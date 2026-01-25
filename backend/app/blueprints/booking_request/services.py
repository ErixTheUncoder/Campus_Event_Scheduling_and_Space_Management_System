from datetime import datetime
import json

from ...extensions import db
from ...models.booking_request import BookingRequest, BookingStatus
from ...models.venue_request import VenueRequest, VenueRequestStatus
from ...models.venue_availability import VenueAvailability
from ...models.venue import Venue
from ...models.user import User, UserRole
from ..audit.services import log_action
from ..availability.services import is_venue_available


# ------------------------
# shared guards
# ------------------------
def _ensure_active(user: User, label: str = "Account"):
    if not getattr(user, "is_active", True):
        return {"error": f"{label} is inactive. Please contact admin."}, 403
    return None


def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)

    err = _ensure_active(admin, "Admin account")
    if err:
        return None, err

    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)

    return admin, None


def _require_student_owner(user_id: int, booking: BookingRequest):
    user = User.query.get(user_id)
    if not user:
        return None, ({"error": "User not found"}, 404)

    err = _ensure_active(user, "User account")
    if err:
        return None, err

    if user.user_role != UserRole.STUDENT:
        return None, ({"error": "Forbidden: Student only"}, 403)

    if booking.user_id != user.user_id:
        return None, ({"error": "Forbidden: Not owner"}, 403)

    return user, None


# ------------------------
# availability helpers
# ------------------------
def _is_slot_taken(venue_available_id: int) -> bool:
    """
    Slot is taken if any:
    - BookingRequest (PENDING/APPROVED) references it, OR
    - VenueRequest (PENDING/APPROVED) references it
    """
    br = BookingRequest.query.filter(
        BookingRequest.venue_available_id == venue_available_id,
        BookingRequest.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED])
    ).first()
    if br:
        return True

    vr = VenueRequest.query.filter(
        VenueRequest.venue_available_id == venue_available_id,
        VenueRequest.status.in_([VenueRequestStatus.PENDING, VenueRequestStatus.APPROVED])
    ).first()
    return vr is not None


def _check_overlap_conflict(venue_id: int, start_dt: datetime, end_dt: datetime):
    """
    Overlap check:
    return (True, conflict_slot_id) if overlaps any RESERVED slot
    (reserved = referenced by booking_requests / venue_requests PENDING or APPROVED)
    """
    overlaps = VenueAvailability.query.filter(
        VenueAvailability.venue_id == venue_id,
        VenueAvailability.start_datetime < end_dt,
        VenueAvailability.end_datetime > start_dt
    ).all()

    for avail in overlaps:
        if _is_slot_taken(avail.venue_available_id):
            return True, avail.venue_available_id

    return False, None


# ------------------------
# create booking
# ------------------------
def create_booking_request(payload: dict):
    """
    STUDENT only.

    Supports 2 modes:

    Mode A (old):
      - user_id
      - booking_date (YYYY-MM-DD)
      - venue_available_id

    Mode B (new, EO-style):
      - user_id
      - booking_date (YYYY-MM-DD)
      - venue_id
      - start_time (HH:MM)
      - end_time (HH:MM)
    """
    # user validation
    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    err = _ensure_active(user, "User account")
    if err:
        return err

    if user.user_role != UserRole.STUDENT:
        return {"error": "Forbidden: Only students can create booking requests"}, 403

    # booking date validation
    booking_date_str = (payload.get("booking_date") or "").strip()
    if not booking_date_str:
        return {"error": "booking_date is required (YYYY-MM-DD)"}, 400

    try:
        booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid booking_date format. Use YYYY-MM-DD"}, 400

    # ----------------------------
    # MODE A: use existing slot
    # ----------------------------
    if payload.get("venue_available_id") is not None:
        try:
            venue_available_id = int(payload.get("venue_available_id"))
        except (TypeError, ValueError):
            return {"error": "venue_available_id must be an integer"}, 400

        availability = VenueAvailability.query.get(venue_available_id)
        if not availability:
            return {"error": "Venue availability not found"}, 404

        if availability.start_datetime.date() != booking_date:
            return {"error": "Booking date does not match venue availability date"}, 400

        if _is_slot_taken(venue_available_id):
            return {"error": "This venue slot is not available (already reserved/booked)."}, 409

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
        db.session.flush()

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
        return {"message": "Booking request created", "booking_request": booking.to_dict()}, 201

    # ----------------------------
    # MODE B: EO-style create slot
    # ----------------------------
    try:
        venue_id = int(payload.get("venue_id"))
    except (TypeError, ValueError):
        return {"error": "venue_id is required and must be an integer"}, 400

    venue = Venue.query.get(venue_id)
    if not venue:
        return {"error": "Venue not found"}, 404

    start_str = (payload.get("start_time") or "").strip()
    end_str = (payload.get("end_time") or "").strip()

    if not start_str or not end_str:
        return {"error": "start_time and end_time are required (HH:MM)"}, 400

    try:
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
    except ValueError:
        return {"error": "Invalid time format. Use HH:MM"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    start_dt = datetime.combine(booking_date, start_time)
    end_dt = datetime.combine(booking_date, end_time)

    # Use centralized availability check
    available, error_msg, conflict_slot_id = is_venue_available(venue_id, start_dt, end_dt)
    if not available:
        return {"error": error_msg, "conflict_slot_id": conflict_slot_id}, 409

    availability = VenueAvailability(
        venue_id=venue_id,
        start_datetime=start_dt,
        end_datetime=end_dt
    )
    db.session.add(availability)
    db.session.flush()

    booking = BookingRequest(
        booking_date=booking_date,
        user_id=user_id,
        venue_available_id=availability.venue_available_id,
        status=BookingStatus.PENDING,
        request_date_time=datetime.utcnow(),
        approval_date_time=None,
        admin_comment=None
    )
    db.session.add(booking)
    db.session.flush()

    log_action(
        user_id=user_id,
        action_type="BOOKING_REQUEST_SUBMITTED",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        new_value=json.dumps({
            "booking_date": booking_date_str,
            "venue_id": venue_id,
            "start_time": start_str,
            "end_time": end_str,
            "venue_available_id": availability.venue_available_id,
            "status": "PENDING"
        })
    )

    db.session.commit()
    return {"message": "Booking request created", "booking_request": booking.to_dict()}, 201


# ------------------------
# list / get
# ------------------------
def list_booking_requests(viewer_id: int | None, status: str | None = None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

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
            return {"error": "Invalid status", "allowed": [s.name for s in BookingStatus]}, 400
        q = q.filter(BookingRequest.status == status_enum)

    items = q.order_by(BookingRequest.request_date_time.desc()).all()
    return {"booking_requests": [b.to_dict() for b in items]}, 200


def get_booking_request(booking_id: int, viewer_id: int | None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    if viewer.user_role == UserRole.ADMIN:
        return {"booking_request": booking.to_dict()}, 200

    if viewer.user_role == UserRole.STUDENT and booking.user_id == viewer.user_id:
        return {"booking_request": booking.to_dict()}, 200

    return {"error": "Forbidden"}, 403


# ------------------------
# student edit / withdraw
# ------------------------
def edit_booking_request(booking_id: int, payload: dict):
    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user, err = _require_student_owner(user_id, booking)
    if err:
        return err

    if booking.status != BookingStatus.PENDING:
        return {"error": "Only PENDING booking requests can be edited"}, 400

    # allow edit via venue_available_id OR EO-style fields
    if payload.get("venue_available_id") is not None:
        try:
            new_venue_available_id = int(payload.get("venue_available_id"))
        except (TypeError, ValueError):
            return {"error": "venue_available_id must be an integer"}, 400

        if new_venue_available_id == booking.venue_available_id:
            return {"error": "No changes detected (same venue_available_id)"}, 400

        new_avail = VenueAvailability.query.get(new_venue_available_id)
        if not new_avail:
            return {"error": "Venue availability not found"}, 404

        if _is_slot_taken(new_venue_available_id):
            return {"error": "Selected slot is not available (reserved/booked)."}, 409

        old_state = booking.to_dict()

        booking.venue_available_id = new_venue_available_id
        booking.booking_date = new_avail.start_datetime.date()

        log_action(
            user_id=user.user_id,
            action_type="BOOKING_REQUEST_EDITED",
            entity_type="BookingRequest",
            entity_id=booking.booking_id,
            old_value=json.dumps(old_state),
            new_value=json.dumps(booking.to_dict())
        )

        db.session.commit()
        return {"message": "Booking request updated", "booking_request": booking.to_dict()}, 200

    # EO-style edit (venue_id + date + start/end)
    date_str = (payload.get("booking_date") or "").strip()
    venue_id = payload.get("venue_id")
    start_str = (payload.get("start_time") or "").strip()
    end_str = (payload.get("end_time") or "").strip()

    if not date_str or venue_id is None or not start_str or not end_str:
        return {"error": "Provide venue_available_id OR (booking_date, venue_id, start_time, end_time)"}, 400

    try:
        new_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        venue_id = int(venue_id)
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
    except Exception:
        return {"error": "Invalid input format"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    start_dt = datetime.combine(new_date, start_time)
    end_dt = datetime.combine(new_date, end_time)

    # Use centralized availability check, excluding current booking
    available, error_msg, conflict_slot_id = is_venue_available(
        venue_id, start_dt, end_dt, exclude_booking_id=booking_id
    )
    if not available:
        return {"error": error_msg, "conflict_slot_id": conflict_slot_id}, 409

    # create new availability row for edit
    new_avail = VenueAvailability(venue_id=venue_id, start_datetime=start_dt, end_datetime=end_dt)
    db.session.add(new_avail)
    db.session.flush()

    old_state = booking.to_dict()

    booking.venue_available_id = new_avail.venue_available_id
    booking.booking_date = new_date

    log_action(
        user_id=user.user_id,
        action_type="BOOKING_REQUEST_EDITED",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(booking.to_dict())
    )

    db.session.commit()
    return {"message": "Booking request updated", "booking_request": booking.to_dict()}, 200


def withdraw_booking_request(booking_id: int, payload: dict):
    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user, err = _require_student_owner(user_id, booking)
    if err:
        return err

    if booking.status != BookingStatus.PENDING:
        return {"error": "Only PENDING booking requests can be withdrawn"}, 400

    old_state = booking.to_dict()

    if hasattr(BookingStatus, "CANCELLED"):
        booking.status = BookingStatus.CANCELLED
    else:
        booking.status = BookingStatus.REJECTED

    booking.admin_comment = "Withdrawn by Student"
    booking.approval_date_time = datetime.utcnow()

    log_action(
        user_id=user.user_id,
        action_type="BOOKING_REQUEST_WITHDRAWN",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(booking.to_dict())
    )

    db.session.commit()
    return {"message": "Booking request withdrawn", "booking_request": booking.to_dict()}, 200


# ------------------------
# admin decision / cancel
# ------------------------
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

    # if approving, ensure EO hasn't reserved that slot
    if decision == "APPROVED":
        conflict_vr = VenueRequest.query.filter(
            VenueRequest.venue_available_id == booking.venue_available_id,
            VenueRequest.status.in_([VenueRequestStatus.PENDING, VenueRequestStatus.APPROVED])
        ).first()
        if conflict_vr:
            return {"error": "Cannot approve: slot reserved by an event venue request."}, 409

    old_state = {
        "status": booking.status.value,
        "admin_comment": booking.admin_comment,
        "approval_date_time": booking.approval_date_time.isoformat()
        if booking.approval_date_time else None
    }

    booking.status = BookingStatus.APPROVED if decision == "APPROVED" else BookingStatus.REJECTED
    booking.admin_comment = (admin_comment or "").strip() or None
    booking.approval_date_time = datetime.utcnow()

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
    return {"message": f"Booking request {decision.lower()}", "booking_request": booking.to_dict()}, 200


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


# ------------------------
# calendar
# ------------------------
def get_booking_calendar(viewer_id: int, role: str):
    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    q = BookingRequest.query.filter(BookingRequest.status == BookingStatus.APPROVED)

    if viewer.user_role == UserRole.STUDENT:
        q = q.filter(BookingRequest.user_id == viewer_id)
    elif viewer.user_role == UserRole.ADMIN:
        pass
    else:
        return {"error": "Forbidden"}, 403

    bookings = q.all()
    calendar_items = []

    for b in bookings:
        va = VenueAvailability.query.get(b.venue_available_id)
        if not va:
            continue

        venue = Venue.query.get(va.venue_id)

        calendar_items.append({
            "id": f"booking-{b.booking_id}",
            "type": "BOOKING",
            "title": f"Booking - {venue.venue_name if venue else 'Venue'}",
            "date": b.booking_date.isoformat(),
            "start_time": va.start_datetime.strftime("%H:%M"),
            "end_time": va.end_datetime.strftime("%H:%M"),
            "venues": [venue.venue_name] if venue else [],
            "status": b.status.value,
            "owner_id": b.user_id
        })

    return {"calendar": calendar_items}, 200
