from datetime import datetime
import json

from ...extensions import db
from ...models.booking_request import BookingRequest, BookingStatus
from ...models.venue_availability import VenueAvailability
from ...models.user import User, UserRole
from ..audit.services import log_action


def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)
    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)
    return admin, None


def create_booking_request(payload: dict):
    """
    STUDENT only.

    Required:
    - user_id
    - booking_date (YYYY-MM-DD)
    - venue_available_id
    """

    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    if user.user_role != UserRole.STUDENT:
        return {"error": "Forbidden: Only students can create booking requests"}, 403

    #  validate booking date
    booking_date_str = (payload.get("booking_date") or "").strip()
    if not booking_date_str:
        return {"error": "booking_date is required (YYYY-MM-DD)"}, 400

    try:
        booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid booking_date format. Use YYYY-MM-DD"}, 400

    # validate venue availability ID ----
    try:
        venue_available_id = int(payload.get("venue_available_id"))
    except (TypeError, ValueError):
        return {"error": "venue_available_id is required and must be an integer"}, 400

    availability = VenueAvailability.query.get(venue_available_id)
    if not availability:
        return {"error": "Venue availability not found"}, 404

    # availability integrity checks
    if availability.date != booking_date:
        return {"error": "Booking date does not match venue availability date"}, 400

    if not availability.is_available:
        return {"error": "Selected venue slot is not available"}, 409

    # prevent double booking (safety check)
    existing = BookingRequest.query.filter(
        BookingRequest.venue_available_id == venue_available_id,
        BookingRequest.status.in_([
            BookingStatus.PENDING,
            BookingStatus.APPROVED
        ])
    ).first()

    if existing:
        return {"error": "This venue slot has already been requested or booked"}, 409

    # create booking request
    booking = BookingRequest(
        booking_date=booking_date,
        user_id=user_id,
        venue_available_id=venue_available_id,
        status=BookingStatus.PENDING,
        request_date_time=datetime.utcnow(),
        approval_date_time=None,
        admin_comment=None
    )

    db.session.add(booking)
    db.session.flush()  # assigns booking_id

    # soft block availability (IMPORTANT)
    availability.is_available = False

    # audit log
    log_action(
        user_id=user_id,
        action_type="BOOKING_REQUEST_SUBMITTED",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        new_value=json.dumps({
            "booking_date": booking_date_str,
            "venue_available_id": venue_available_id,
            "status": "PENDING"
        })
    )

    db.session.commit()
    return {
        "message": "Booking request created",
        "booking_request": booking.to_dict()
    }, 201


def list_booking_requests(viewer_id: int | None, status: str | None = None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    q = BookingRequest.query

    if viewer.user_role == UserRole.ADMIN:
        pass
    elif viewer.user_role == UserRole.STUDENT:
        q = q.filter(BookingRequest.user_id == viewer.user_id)
    else:
        return {"error": "Forbidden"}, 403

    if status:
        try:
            status_enum = BookingStatus[status.strip().upper()]
        except KeyError:
            return {
                "error": "Invalid status",
                "allowed": [s.name for s in BookingStatus]
            }, 400
        q = q.filter(BookingRequest.status == status_enum)

    items = q.order_by(BookingRequest.request_date_time.desc()).all()
    return {"booking_requests": [b.to_dict() for b in items]}, 200


def get_booking_request(booking_id: int, viewer_id: int | None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    if viewer.user_role == UserRole.ADMIN:
        return {"booking_request": booking.to_dict()}, 200

    if viewer.user_role == UserRole.STUDENT and booking.user_id == viewer.user_id:
        return {"booking_request": booking.to_dict()}, 200

    return {"error": "Forbidden"}, 403


def decide_booking_request(booking_id: int, payload: dict):
    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    try:
        admin_id = int(payload.get("admin_id"))
    except (TypeError, ValueError):
        return {"error": "admin_id is required and must be an integer"}, 400

    admin, err = _require_admin(admin_id)
    if err:
        return err

    decision = (payload.get("decision") or "").strip().upper()
    admin_comment = payload.get("admin_comment")

    if decision not in ("APPROVED", "REJECTED"):
        return {"error": "decision must be APPROVED or REJECTED"}, 400

    old_state = {
        "status": booking.status.value,
        "admin_comment": booking.admin_comment,
        "approval_date_time": booking.approval_date_time.isoformat()
        if booking.approval_date_time else None
    }

    booking.status = (
        BookingStatus.APPROVED
        if decision == "APPROVED"
        else BookingStatus.REJECTED
    )
    booking.admin_comment = (admin_comment or "").strip() or None
    booking.approval_date_time = datetime.utcnow()

    # ---- Release availability if rejected ----
    if booking.status == BookingStatus.REJECTED:
        availability = VenueAvailability.query.get(booking.venue_available_id)
        if availability:
            availability.is_available = True

    log_action(
        user_id=admin.user_id,
        action_type="BOOKING_REQUEST_DECISION",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps({
            "status": booking.status.value,
            "admin_comment": booking.admin_comment,
            "approval_date_time": booking.approval_date_time.isoformat()
        })
    )

    db.session.commit()
    return {
        "message": f"Booking request {decision.lower()}",
        "booking_request": booking.to_dict()
    }, 200


def get_booking_calendar(viewer_id: int, role: str):
    from ...models.booking_request import BookingRequest, BookingStatus
    from ...models.venue_availability import VenueAvailability
    from ...models.venue import Venue
    from ...models.user import User

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    q = BookingRequest.query.filter(
        BookingRequest.status == BookingStatus.APPROVED
    )

    # Student sees own bookings only
    if role == "STUDENT":
        q = q.filter(BookingRequest.user_id == viewer_id)

    bookings = q.all()
    calendar_items = []

    for b in bookings:
        va = VenueAvailability.query.get(b.venue_available_id)
        venue = Venue.query.get(va.venue_id)

        calendar_items.append({
            "id": f"booking-{b.booking_id}",
            "type": "BOOKING",
            "title": f"Booking - {venue.venue_name}",
            "date": b.booking_date.isoformat(),
            "start_time": va.start_time.strftime("%H:%M"),
            "end_time": va.end_time.strftime("%H:%M"),
            "venues": [venue.venue_name],
            "status": b.status.value,
            "owner_id": b.user_id
        })

    return {"calendar": calendar_items}, 200


def cancel_booking_request(booking_id: int, payload: dict):
    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    try:
        admin_id = int(payload.get("admin_id"))
    except (TypeError, ValueError):
        return {"error": "admin_id is required"}, 400

    admin, err = _require_admin(admin_id)
    if err:
        return err

    if booking.status != BookingStatus.APPROVED:
        return {"error": "Only approved bookings can be cancelled"}, 400

    admin_comment = (payload.get("admin_comment") or "").strip()
    if not admin_comment:
        return {"error": "admin_comment is required for cancellation"}, 400

    old_state = {
        "status": booking.status.value,
        "admin_comment": booking.admin_comment,
        "approval_date_time": booking.approval_date_time.isoformat()
        if booking.approval_date_time else None
    }


    booking.status = BookingStatus.REJECTED
    booking.admin_comment = admin_comment
    booking.approval_date_time = datetime.utcnow()

    # release availability
    availability = VenueAvailability.query.get(booking.venue_available_id)
    if availability:
        availability.is_available = True
        

    log_action(
        user_id=admin.user_id,
        action_type="BOOKING_REQUEST_CANCELLED_BY_ADMIN",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps({
            "status": booking.status.value,
            "admin_comment": booking.admin_comment,
            "approval_date_time": booking.approval_date_time.isoformat()
        })
    )

    db.session.commit()
    return {"message": "Booking request cancelled by admin"}, 200
