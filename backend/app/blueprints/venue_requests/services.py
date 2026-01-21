from datetime import datetime
import json

from ...extensions import db
from ...models.venue_request import VenueRequest, VenueRequestStatus
from ...models.event_request import EventRequest
from ...models.venue import Venue
from ...models.user import User, UserRole
from ...models.venue_availability import VenueAvailability
from ..audit.services import log_action
from ...blueprints.notifications.services import create_notification
from ...models.notification import NotificationType


def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)
    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)
    return admin, None


def _time_overlap(start1, end1, start2, end2):
    """
    Returns True if time ranges overlap
    """
    return start1 < end2 and start2 < end1


def create_venue_request(payload: dict):
    """
    Event Organizer only.
    Required:
      organiser_id, event_id, venue_id, date, start_time, end_time, reason
    """

    # validate organiser
    try:
        organiser_id = int(payload.get("organiser_id"))
    except (TypeError, ValueError):
        return {"error": "organiser_id is required"}, 400

    organiser = User.query.get(organiser_id)
    if not organiser or organiser.user_role != UserRole.EVENT_ORGANIZER:
        return {"error": "Forbidden: Event Organizer only"}, 403

    # validate event
    try:
        event_id = int(payload.get("event_id"))
    except (TypeError, ValueError):
        return {"error": "event_id is required"}, 400

    event = EventRequest.query.get(event_id)
    if not event:
        return {"error": "Event request not found"}, 404

    if event.user_id != organiser.user_id:
        return {"error": "Forbidden: Not your event request"}, 403

    # validate venue
    try:
        venue_id = int(payload.get("venue_id"))
    except (TypeError, ValueError):
        return {"error": "venue_id is required"}, 400

    venue = Venue.query.get(venue_id)
    if not venue:
        return {"error": "Venue not found"}, 404

    # validate date & time
    date_str = (payload.get("date") or "").strip()
    start_str = (payload.get("start_time") or "").strip()
    end_str = (payload.get("end_time") or "").strip()
    reason = (payload.get("reason") or "").strip()

    if not date_str or not start_str or not end_str or not reason:
        return {"error": "date, start_time, end_time, and reason are required"}, 400

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
    except ValueError:
        return {"error": "Invalid date/time format"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    # check venue availability table
    availability = VenueAvailability.query.filter_by(
        venue_id=venue_id,
        date=date
    ).first()

    if not availability or not availability.is_available:
        return {"error": "Venue is not available on the selected date"}, 409

    # conflict check: one venue, one event at one time
    conflict = VenueRequest.query.filter(
        VenueRequest.venue_id == venue_id,
        VenueRequest.date == date,
        VenueRequest.status == VenueRequestStatus.APPROVED
    ).all()

    for vr in conflict:
        if _time_overlap(start_time, end_time, vr.start_time, vr.end_time):
            return {
                "error": "Venue already booked for this time slot"
            }, 409

    # create venue request
    vr = VenueRequest(
        event_id=event_id,
        venue_id=venue_id,
        organiser_id=organiser_id,
        date=date,
        start_time=start_time,
        end_time=end_time,
        reason=reason,
        status=VenueRequestStatus.PENDING,
        request_date_time=datetime.utcnow(),
        admin_comment=None
    )

    db.session.add(vr)
    db.session.flush()


    log_action(
        user_id=organiser.user_id,
        action_type="VENUE_REQUEST_SUBMITTED",
        entity_type="VenueRequest",
        entity_id=vr.venue_request_id,
        new_value=json.dumps({
            "event_id": event_id,
            "venue_id": venue_id,
            "date": date_str,
            "start_time": start_str,
            "end_time": end_str,
            "status": "PENDING"
        })
    )

    db.session.commit()
    return {"message": "Venue request created", "venue_request": vr.to_dict()}, 201


def list_venue_requests(viewer_id: int, filters: dict | None = None):
    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    q = VenueRequest.query

    if viewer.user_role == UserRole.ADMIN:
        pass
    elif viewer.user_role == UserRole.EVENT_ORGANIZER:
        q = q.filter(VenueRequest.organiser_id == viewer.user_id)
    else:
        return {"error": "Forbidden"}, 403

    if filters:
        status = filters.get("status")
        event_id = filters.get("event_id")

        if status:
            try:
                status_enum = VenueRequestStatus[status.upper()]
            except KeyError:
                return {
                    "error": "Invalid status",
                    "allowed": [s.name for s in VenueRequestStatus]
                }, 400
            q = q.filter(VenueRequest.status == status_enum)

        if event_id:
            q = q.filter(VenueRequest.event_id == event_id)

    items = q.order_by(VenueRequest.request_date_time.desc()).all()
    return {"venue_requests": [i.to_dict() for i in items]}, 200


def decide_venue_request(request_id: int, payload: dict):
    """
    Admin only.
    decision = APPROVED or REJECTED
    """

    vr = VenueRequest.query.get(request_id)
    if not vr:
        return {"error": "Venue request not found"}, 404

    try:
        admin_id = int(payload.get("admin_id"))
    except (TypeError, ValueError):
        return {"error": "admin_id is required"}, 400

    admin, err = _require_admin(admin_id)
    if err:
        return err

    decision = (payload.get("decision") or "").strip().upper()
    admin_comment = (payload.get("remark") or "").strip()

    if decision not in ("APPROVED", "REJECTED"):
        return {"error": "decision must be APPROVED or REJECTED"}, 400

    if decision == "REJECTED" and not admin_comment:
        return {"error": "remark is required when rejecting"}, 400

    old_state = {
        "status": vr.status.value,
        "admin_comment": vr.admin_comment
    }

    vr.status = (
        VenueRequestStatus.APPROVED
        if decision == "APPROVED"
        else VenueRequestStatus.REJECTED
    )
    vr.admin_comment = admin_comment or None

    # update availability
    availability = VenueAvailability.query.filter_by(
        venue_id=vr.venue_id,
        date=vr.date
    ).first()

    if decision == "APPROVED":
        if availability:
            availability.is_available = False
    else:
        if availability:
            availability.is_available = True

    # notification to organiser
    create_notification(
        user_id=vr.organiser_id,
        notification_type=(
            NotificationType.VENUE_REQUEST_APPROVED
            if decision == "APPROVED"
            else NotificationType.VENUE_REQUEST_REJECTED
        ),
        message=f"Your venue request for venue ID {vr.venue_id} has been {decision.lower()}."
    )


    log_action(
        user_id=admin.user_id,
        action_type="VENUE_REQUEST_DECISION",
        entity_type="VenueRequest",
        entity_id=vr.venue_request_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps({
            "status": vr.status.value,
            "admin_comment": vr.admin_comment
        })
    )

    db.session.commit()
    return {
        "message": f"Venue request {decision.lower()}",
        "venue_request": vr.to_dict()
    }, 200
