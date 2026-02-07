from datetime import datetime
import json

from ...extensions import db
from ...models.venue_request import VenueRequest, VenueRequestStatus
from ...models.event_request import EventRequest, EventRequestStatus
from ...models.venue import Venue
from ...models.user import User, UserRole
from ...models.venue_availability import VenueAvailability
from ..audit.services import log_action
from ...blueprints.notifications.services import create_notification
from ...models.notification import NotificationType
from ...models.booking_request import BookingRequest, BookingStatus
from ..availability.services import is_venue_available

def _ensure_active(user: User, label: str = "Account"):
    """
    Shared guard: block inactive users from protected operations.
    """
    if not getattr(user, "is_active", True):
        return {"error": f"{label} is inactive. Please contact admin."}, 403
    return None


def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)

    # block inactive admins
    err = _ensure_active(admin, "Admin account")
    if err:
        return None, err

    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)

    return admin, None


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
    if not organiser:
        return {"error": "User not found"}, 404

    # block inactive organiser
    err = _ensure_active(organiser, "User account")
    if err:
        return err

    if organiser.user_role != UserRole.EVENT_ORGANIZER:
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

    # cannot request venue for non-pending event
    if event.status != EventRequestStatus.PENDING:
        return {"error": "Cannot create venue request: event request is not PENDING"}, 400

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
        # keep your format as HH:MM
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
    except ValueError:
        return {"error": "Invalid date/time format"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    start_datetime = datetime.combine(date, start_time)
    end_datetime = datetime.combine(date, end_time)

    # Use centralized availability check
    available, error_msg, conflict_slot_id = is_venue_available(venue_id, start_datetime, end_datetime)
    if not available:
        return {"error": error_msg, "conflict_slot_id": conflict_slot_id}, 409

    # Create a new venue availability record for this request
    availability = VenueAvailability(
        venue_id=venue_id,
        start_datetime=start_datetime,
        end_datetime=end_datetime
    )
    db.session.add(availability)
    db.session.flush()

    # Create venue request
    vr = VenueRequest(
        event_id=event_id,
        venue_available_id=availability.venue_available_id,
        status=VenueRequestStatus.PENDING,
        request_date_time=datetime.utcnow(),
        admin_comment=None,
        resources_needed=reason
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

    # block inactive viewer
    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    q = VenueRequest.query

    if viewer.user_role == UserRole.ADMIN:
        pass
    elif viewer.user_role == UserRole.EVENT_ORGANIZER:
        # EO sees only requests for events they own
        q = q.join(EventRequest, VenueRequest.event_id == EventRequest.event_id) \
             .filter(EventRequest.user_id == viewer.user_id)
    else:
        return {"error": "Forbidden"}, 403

    if filters:
        status = filters.get("status")
        event_id = filters.get("event_id")

        if status:
            try:
                status_enum = VenueRequestStatus[status.upper()]
            except KeyError:
                return {"error": "Invalid status", "allowed": [s.name for s in VenueRequestStatus]}, 400
            q = q.filter(VenueRequest.status == status_enum)

        if event_id:
            q = q.filter(VenueRequest.event_id == event_id)

    items = q.order_by(VenueRequest.request_date_time.desc()).all()
    
    # Enrich venue requests with venue and event names
    enriched_requests = []
    for vr in items:
        vr_dict = vr.to_dict()
        
        # Get venue name from venue_availability
        if vr.venue_available_id:
            venue_avail = VenueAvailability.query.get(vr.venue_available_id)
            if venue_avail and venue_avail.venue_id:
                venue = Venue.query.get(venue_avail.venue_id)
                if venue:
                    vr_dict['venue_name'] = venue.venue_name
        
        # Get event name
        if vr.event_id:
            event = EventRequest.query.get(vr.event_id)
            if event:
                vr_dict['event_name'] = event.event_name
        
        enriched_requests.append(vr_dict)
    
    return {"venue_requests": enriched_requests}, 200


def decide_venue_request(request_id: int, payload: dict):
    """
    Admin only.
    decision = APPROVED or REJECTED
    """

    vr = VenueRequest.query.get(request_id)
    if not vr:
        return {"error": "Venue request not found"}, 404

    # only decide if venue request still pending
    if vr.status != VenueRequestStatus.PENDING:
        return {"error": "Only PENDING venue requests can be decided"}, 400

    # parent event must still be pending
    event = EventRequest.query.get(vr.event_id)
    if not event:
        return {"error": "Parent event request not found"}, 404
    if event.status != EventRequestStatus.PENDING:
        return {"error": "Cannot decide venue request because event request is not PENDING"}, 400

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

    old_state = {"status": vr.status.value, "admin_comment": vr.admin_comment}

    vr.status = VenueRequestStatus.APPROVED if decision == "APPROVED" else VenueRequestStatus.REJECTED
    vr.admin_comment = admin_comment or None

    # derive venue_id + organiser from availability + event
    availability = VenueAvailability.query.get(vr.venue_available_id)
    venue_id = availability.venue_id if availability else None
    organiser_id = event.user_id if event else None

    # notification to organiser
    if organiser_id:
        create_notification(
            user_id=organiser_id,
            notification_type=(
                NotificationType.VENUE_REQUEST_APPROVED
                if decision == "APPROVED"
                else NotificationType.VENUE_REQUEST_REJECTED
            ),
            message=f"Your venue request for venue ID {venue_id} has been {decision.lower()}."
        )

    log_action(
        user_id=admin.user_id,
        action_type="VENUE_REQUEST_DECISION",
        entity_type="VenueRequest",
        entity_id=vr.venue_request_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps({"status": vr.status.value, "admin_comment": vr.admin_comment})
    )

    db.session.commit()
    return {"message": f"Venue request {decision.lower()}", "venue_request": vr.to_dict()}, 200


def edit_venue_request(request_id: int, payload: dict):
    """
    Event Organizer only.
    Edit a PENDING venue request.
    """
    vr = VenueRequest.query.get(request_id)
    if not vr:
        return {"error": "Venue request not found"}, 404

    try:
        organiser_id = int(payload.get("organiser_id"))
    except (TypeError, ValueError):
        return {"error": "organiser_id is required"}, 400

    organiser = User.query.get(organiser_id)
    if not organiser:
        return {"error": "User not found"}, 404

    err = _ensure_active(organiser, "User account")
    if err:
        return err

    if organiser.user_role != UserRole.EVENT_ORGANIZER:
        return {"error": "Forbidden: Event Organizer only"}, 403

    # verify ownership
    event = EventRequest.query.get(vr.event_id)
    if not event or event.user_id != organiser.user_id:
        return {"error": "Forbidden: Not your venue request"}, 403

    # can only edit PENDING
    if vr.status != VenueRequestStatus.PENDING:
        return {"error": "Only PENDING venue requests can be edited"}, 400

    # get new venue/time info
    try:
        venue_id = int(payload.get("venue_id"))
    except (TypeError, ValueError):
        return {"error": "venue_id is required"}, 400

    venue = Venue.query.get(venue_id)
    if not venue:
        return {"error": "Venue not found"}, 404

    date_str = (payload.get("date") or "").strip()
    start_str = (payload.get("start_time") or "").strip()
    end_str = (payload.get("end_time") or "").strip()
    reason = (payload.get("reason") or "").strip()

    if not date_str or not start_str or not end_str:
        return {"error": "date, start_time, and end_time are required"}, 400

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
    except ValueError:
        return {"error": "Invalid date/time format"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    start_datetime = datetime.combine(date, start_time)
    end_datetime = datetime.combine(date, end_time)

    # Use centralized availability check, excluding current request
    available, error_msg, conflict_slot_id = is_venue_available(
        venue_id, start_datetime, end_datetime, exclude_request_id=request_id
    )
    if not available:
        return {"error": error_msg, "conflict_slot_id": conflict_slot_id}, 409

    old_state = vr.to_dict()

    # Get old availability record
    old_availability = VenueAvailability.query.get(vr.venue_available_id)

    # Create new availability record
    new_availability = VenueAvailability(
        venue_id=venue_id,
        start_datetime=start_datetime,
        end_datetime=end_datetime
    )
    db.session.add(new_availability)
    db.session.flush()

    # Update venue request
    vr.venue_available_id = new_availability.venue_available_id
    if reason:
        vr.resources_needed = reason

    log_action(
        user_id=organiser.user_id,
        action_type="VENUE_REQUEST_EDITED",
        entity_type="VenueRequest",
        entity_id=vr.venue_request_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(vr.to_dict())
    )

    db.session.commit()
    return {"message": "Venue request updated", "venue_request": vr.to_dict()}, 200


def withdraw_venue_request(request_id: int, payload: dict):
    """
    Event Organizer only.
    Withdraw (cancel) a PENDING venue request.
    """
    vr = VenueRequest.query.get(request_id)
    if not vr:
        return {"error": "Venue request not found"}, 404

    try:
        organiser_id = int(payload.get("organiser_id"))
    except (TypeError, ValueError):
        return {"error": "organiser_id is required"}, 400

    organiser = User.query.get(organiser_id)
    if not organiser:
        return {"error": "User not found"}, 404

    err = _ensure_active(organiser, "User account")
    if err:
        return err

    if organiser.user_role != UserRole.EVENT_ORGANIZER:
        return {"error": "Forbidden: Event Organizer only"}, 403

    # verify ownership
    event = EventRequest.query.get(vr.event_id)
    if not event or event.user_id != organiser.user_id:
        return {"error": "Forbidden: Not your venue request"}, 403

    # can only withdraw PENDING
    if vr.status != VenueRequestStatus.PENDING:
        return {"error": "Only PENDING venue requests can be withdrawn"}, 400

    old_state = vr.to_dict()

    vr.status = VenueRequestStatus.CANCELLED

    log_action(
        user_id=organiser.user_id,
        action_type="VENUE_REQUEST_WITHDRAWN",
        entity_type="VenueRequest",
        entity_id=vr.venue_request_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(vr.to_dict())
    )

    db.session.commit()
    return {"message": "Venue request withdrawn", "venue_request": vr.to_dict()}, 200


def get_venue_request(request_id: int, viewer_id: int):
    """
    Get a single venue request.
    Admin can see all, EO can see own only.
    """
    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    vr = VenueRequest.query.get(request_id)
    if not vr:
        return {"error": "Venue request not found"}, 404

    if viewer.user_role == UserRole.ADMIN:
        return {"venue_request": vr.to_dict()}, 200

    if viewer.user_role == UserRole.EVENT_ORGANIZER:
        event = EventRequest.query.get(vr.event_id)
        if event and event.user_id == viewer.user_id:
            return {"venue_request": vr.to_dict()}, 200
        return {"error": "Forbidden: Not your venue request"}, 403

    return {"error": "Forbidden"}, 403
