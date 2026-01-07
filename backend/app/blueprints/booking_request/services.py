from datetime import datetime
import json

from ...extensions import db
from ...models.booking_request import BookingRequest, BookingStatus
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
      user_id, booking_date(YYYY-MM-DD), venue_available_id
    """
    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    # ✅ RBAC: Only STUDENT can create booking request
    if user.user_role != UserRole.STUDENT:
        return {"error": "Forbidden: Only Students can create booking requests"}, 403

    booking_date_str = (payload.get("booking_date") or "").strip()
    try:
        venue_available_id = int(payload.get("venue_available_id"))
    except (TypeError, ValueError):
        return {"error": "venue_available_id is required and must be an integer"}, 400

    if not booking_date_str:
        return {"error": "booking_date is required (YYYY-MM-DD)"}, 400

    try:
        booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid booking_date format. Use YYYY-MM-DD"}, 400

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
    db.session.flush()  # assigns booking.booking_id

    # AUDIT
    log_action(
        user_id=user_id,
        action_type="BOOKING_REQUEST_SUBMITTED",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        new_value=json.dumps({
            "booking_date": booking_date_str,
            "venue_available_id": venue_available_id,
            "status": "Pending"
        })
    )

    db.session.commit()
    return {"message": "Booking request created", "booking_request": booking.to_dict()}, 201


def list_booking_requests(viewer_id: int | None, status: str | None = None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    q = BookingRequest.query

    # ✅ Visibility rules
    if viewer.user_role == UserRole.ADMIN:
        pass  # admin sees all
    elif viewer.user_role == UserRole.STUDENT:
        q = q.filter(BookingRequest.user_id == viewer.user_id)
    else:
        return {"error": "Forbidden"}, 403

    # optional status filter
    if status:
        status = status.strip().upper()
        try:
            status_enum = BookingStatus[status]
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

    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    if viewer.user_role == UserRole.ADMIN:
        return {"booking_request": booking.to_dict()}, 200

    if viewer.user_role == UserRole.STUDENT and booking.user_id == viewer.user_id:
        return {"booking_request": booking.to_dict()}, 200

    return {"error": "Forbidden"}, 403


def decide_booking_request(booking_id: int, payload: dict):
    """
    ADMIN only decision:
      admin_id, decision=APPROVED/REJECTED, admin_comment(optional)
    """
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
        "status": booking.status.value if booking.status else None,
        "admin_comment": booking.admin_comment,
        "approval_date_time": booking.approval_date_time.isoformat() if booking.approval_date_time else None
    }

    booking.status = BookingStatus.APPROVED if decision == "APPROVED" else BookingStatus.REJECTED
    booking.admin_comment = (admin_comment or "").strip() or None
    booking.approval_date_time = datetime.utcnow()

    new_state = {
        "status": booking.status.value,
        "admin_comment": booking.admin_comment,
        "approval_date_time": booking.approval_date_time.isoformat()
    }

    log_action(
        user_id=admin.user_id,
        action_type="BOOKING_REQUEST_DECISION",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(new_state)
    )

    db.session.commit()
    return {"message": f"Booking request {decision.lower()}", "booking_request": booking.to_dict()}, 200


def cancel_booking_request(booking_id: int, payload: dict):
    booking = BookingRequest.query.get(booking_id)
    if not booking:
        return {"error": "Booking request not found"}, 404

    try:
        student_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required"}, 400

    student = User.query.get(student_id)
    if not student or student.user_role != UserRole.STUDENT:
        return {"error": "Forbidden"}, 403

    if booking.user_id != student.user_id:
        return {"error": "Forbidden"}, 403

    if booking.status != BookingStatus.PENDING:
        return {"error": "Only pending bookings can be cancelled"}, 400

    booking.status = BookingStatus.CANCELLED

    log_action(
        user_id=student.user_id,
        action_type="BOOKING_REQUEST_CANCELLED",
        entity_type="BookingRequest",
        entity_id=booking.booking_id,
        old_value="PENDING",
        new_value="CANCELLED"
    )

    db.session.commit()
    return {"message": "Booking request cancelled"}, 200

