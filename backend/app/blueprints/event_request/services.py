from datetime import datetime
import json

from ...extensions import db
from ...models.event_request import EventRequest, EventRequestStatus
from ...models.venue_request import VenueRequest, VenueRequestStatus
from ...models.venue_availability import VenueAvailability
from ...models.venue import Venue
from ...models.user import User, UserRole

from ...blueprints.audit.services import log_action
from ...blueprints.notifications.services import create_notification
from ...models.notification import NotificationType


def _parse_date(date_str: str):
    return datetime.strptime(date_str, "%Y-%m-%d").date()


def _parse_time(time_str: str):
    fmt = "%H:%M:%S" if len(time_str.strip()) == 8 else "%H:%M"
    return datetime.strptime(time_str, fmt).time()


def _ensure_active(user: User, label: str = "Account"):
    if not getattr(user, "is_active", True):
        return {"error": f"{label} is inactive. Please contact admin."}, 403
    return None


def create_event_request(payload: dict):
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

    if user.user_role not in (UserRole.EVENT_ORGANIZER, UserRole.ADMIN):
        return {"error": "Forbidden: Only Event Organizers and admins can create event requests"}, 403

    event_name = (payload.get("event_name") or "").strip()
    event_date_str = (payload.get("event_date") or "").strip()
    start_time_str = (payload.get("start_time") or "").strip()
    end_time_str = (payload.get("end_time") or "").strip()
    purpose = (payload.get("purpose") or "").strip()

    documents = payload.get("documents")

    if not event_name or not event_date_str or not start_time_str or not end_time_str or not purpose:
        return {"error": "event_name, event_date, start_time, end_time, and purpose are required"}, 400

    try:
        event_date = _parse_date(event_date_str)
        start_time = _parse_time(start_time_str)
        end_time = _parse_time(end_time_str)
    except ValueError:
        return {"error": "Invalid date/time format. Use event_date=YYYY-MM-DD, time=HH:MM"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    req = EventRequest(
        user_id=user_id,
        event_name=event_name,
        event_date=event_date,
        start_time=start_time,
        end_time=end_time,
        purpose=purpose,
        documents=documents,
        status=EventRequestStatus.PENDING,
        request_date_time=datetime.utcnow(),
        approval_date_time=None,
        admin_comment=None,
    )

    db.session.add(req)
    db.session.flush()

    log_action(
        user_id=user_id,
        action_type="EVENT_REQUEST_SUBMITTED",
        entity_type="EventRequest",
        entity_id=req.event_id,
        new_value=json.dumps({
            "event_name": event_name,
            "event_date": event_date_str,
            "start_time": start_time_str,
            "end_time": end_time_str,
            "status": "Pending"
        })
    )

    db.session.commit()
    return {"message": "Event request created", "event_request": req.to_dict()}, 201


def list_event_requests(viewer_id: int | None, status: str | None = None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    q = EventRequest.query

    if viewer.user_role == UserRole.ADMIN:
        pass
    elif viewer.user_role == UserRole.EVENT_ORGANIZER:
        q = q.filter(EventRequest.user_id == viewer.user_id)
    else:
        return {"error": "Forbidden"}, 403

    if status:
        status = status.strip().upper()
        try:
            status_enum = EventRequestStatus[status]
        except KeyError:
            return {"error": "Invalid status", "allowed": [s.name for s in EventRequestStatus]}, 400
        q = q.filter(EventRequest.status == status_enum)

    items = q.order_by(EventRequest.request_date_time.desc()).all()

    result = []
    for e in items:
        venue_reqs = VenueRequest.query.filter(VenueRequest.event_id == e.event_id).all()

        venue_names = []
        for vr in venue_reqs:
            avail = VenueAvailability.query.get(vr.venue_available_id)
            if not avail:
                continue
            v = Venue.query.get(avail.venue_id)
            if v:
                venue_names.append(v.venue_name)

        d = e.to_dict()
        d["requested_venues"] = venue_names
        
        # Get organizer (user) details
        if e.user_id:
            user = User.query.get(e.user_id)
            if user:
                d['user_name'] = user.full_name
        
        result.append(d)

    return {"event_requests": result}, 200


def get_event_request(event_id: int, viewer_id: int | None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

    if viewer.user_role == UserRole.ADMIN:
        return {"event_request": req.to_dict()}, 200

    if viewer.user_role == UserRole.EVENT_ORGANIZER and req.user_id == viewer.user_id:
        return {"event_request": req.to_dict()}, 200

    return {"error": "Forbidden"}, 403


def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)

    if not getattr(admin, "is_active", True):
        return None, ({"error": "Account is inactive. Please contact another admin."}, 403)

    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)

    return admin, None


def _require_event_organizer_owner(user_id: int, req: EventRequest):
    user = User.query.get(user_id)
    if not user:
        return None, ({"error": "User not found"}, 404)

    if not getattr(user, "is_active", True):
        return None, ({"error": "Account is inactive. Please contact admin."}, 403)

    if user.user_role != UserRole.EVENT_ORGANIZER:
        return None, ({"error": "Forbidden: Event Organizer only"}, 403)

    if req.user_id != user.user_id:
        return None, ({"error": "Forbidden: Not your event request"}, 403)

    return user, None


def edit_event_request(event_id: int, payload: dict):
    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user, err = _require_event_organizer_owner(user_id, req)
    if err:
        return err

    if req.status != EventRequestStatus.PENDING:
        return {"error": "Only PENDING event requests can be edited"}, 400

    event_name = (payload.get("event_name") or req.event_name or "").strip()
    purpose = (payload.get("purpose") or req.purpose or "").strip()
    documents = payload.get("documents", req.documents)

    event_date_str = (payload.get("event_date") or "").strip()
    start_time_str = (payload.get("start_time") or "").strip()
    end_time_str = (payload.get("end_time") or "").strip()

    try:
        event_date = _parse_date(event_date_str) if event_date_str else req.event_date
        start_time = _parse_time(start_time_str) if start_time_str else req.start_time
        end_time = _parse_time(end_time_str) if end_time_str else req.end_time
    except ValueError:
        return {"error": "Invalid date/time format. Use event_date=YYYY-MM-DD, time=HH:MM"}, 400

    if not event_name or not event_date or not start_time or not end_time or not purpose:
        return {"error": "event_name, event_date, start_time, end_time, and purpose are required"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    old_state = req.to_dict()

    req.event_name = event_name
    req.event_date = event_date
    req.start_time = start_time
    req.end_time = end_time
    req.purpose = purpose
    req.documents = documents

    log_action(
        user_id=user.user_id,
        action_type="EVENT_REQUEST_EDITED",
        entity_type="EventRequest",
        entity_id=req.event_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(req.to_dict())
    )

    db.session.commit()
    return {"message": "Event request updated", "event_request": req.to_dict()}, 200


def withdraw_event_request(event_id: int, payload: dict):
    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400

    user, err = _require_event_organizer_owner(user_id, req)
    if err:
        return err

    if req.status != EventRequestStatus.PENDING:
        return {"error": "Only PENDING event requests can be withdrawn"}, 400

    old_state = req.to_dict()

    req.status = EventRequestStatus.CANCELLED
    req.admin_comment = "Withdrawn by Event Organizer"

    linked_venue_requests = VenueRequest.query.filter(
        VenueRequest.event_id == req.event_id
    ).all()

    for vr in linked_venue_requests:
        vr.status = VenueRequestStatus.CANCELLED
        vr.admin_comment = "Cancelled because Event Request was withdrawn"

    create_notification(
        user_id=req.user_id,
        notification_type=NotificationType.SYSTEM_ALERT,
        message=f"Your event request '{req.event_name}' has been withdrawn (cancelled)."
    )

    log_action(
        user_id=user.user_id,
        action_type="EVENT_REQUEST_WITHDRAWN",
        entity_type="EventRequest",
        entity_id=req.event_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(req.to_dict())
    )

    db.session.commit()
    return {"message": "Event request withdrawn (cancelled)", "event_request": req.to_dict()}, 200


def decide_event_request(event_id: int, payload: dict):
    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

    if req.status != EventRequestStatus.PENDING:
        return {"error": "Only PENDING event requests can be decided"}, 400

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
        "status": req.status.value if req.status else None,
        "admin_comment": req.admin_comment,
        "approval_date_time": req.approval_date_time.isoformat() if req.approval_date_time else None
    }

    if decision == "APPROVED":
        approved_venues_count = VenueRequest.query.filter(
            VenueRequest.event_id == req.event_id,
            VenueRequest.status == VenueRequestStatus.APPROVED
        ).count()

        if approved_venues_count < 1:
            return {"error": "Event cannot be approved without at least one approved venue request"}, 400

    req.status = EventRequestStatus.APPROVED if decision == "APPROVED" else EventRequestStatus.REJECTED
    req.admin_comment = (admin_comment or "").strip() or None
    req.approval_date_time = datetime.utcnow()

    new_state = {
        "status": req.status.value,
        "admin_comment": req.admin_comment,
        "approval_date_time": req.approval_date_time.isoformat()
    }

    notif_msg = (
        f"Your event request '{req.event_name}' has been approved."
        if decision == "APPROVED"
        else f"Your event request '{req.event_name}' has been rejected."
    )

    create_notification(
        user_id=req.user_id,
        notification_type=NotificationType.SYSTEM_ALERT,
        message=notif_msg
    )

    log_action(
        user_id=admin.user_id,
        action_type="EVENT_REQUEST_DECISION",
        entity_type="EventRequest",
        entity_id=req.event_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(new_state)
    )

    db.session.commit()
    return {"message": f"Event request {decision.lower()}", "event_request": req.to_dict()}, 200


def get_event_calendar(viewer_id: int, role: str):
    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    err = _ensure_active(viewer, "Viewer account")
    if err:
        return err

    q = EventRequest.query.filter(EventRequest.status == EventRequestStatus.APPROVED)

    if role == "EO":
        q = q.filter(EventRequest.user_id == viewer_id)

    events = q.all()
    calendar_items = []

    for e in events:
        venue_reqs = VenueRequest.query.filter(
            VenueRequest.event_id == e.event_id,
            VenueRequest.status == VenueRequestStatus.APPROVED
        ).all()

        venues = []
        for vr in venue_reqs:
            avail = VenueAvailability.query.get(vr.venue_available_id)
            if not avail:
                continue
            v = Venue.query.get(avail.venue_id)
            if v:
                venues.append(v.venue_name)

        calendar_items.append({
            "id": f"event-{e.event_id}",
            "type": "EVENT",
            "title": e.event_name,
            "date": e.event_date.isoformat(),
            "start_time": e.start_time.strftime("%H:%M"),
            "end_time": e.end_time.strftime("%H:%M"),
            "venues": venues,
            "status": e.status.value,
            "owner_id": e.user_id
        })

    return {"calendar": calendar_items}, 200


def delete_event_request(event_id: int, payload: dict | None = None):
    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

    try:
        actor_id = int((payload or {}).get("actor_id"))
    except (TypeError, ValueError):
        return {"error": "actor_id is required"}, 400

    actor = User.query.get(actor_id)
    if not actor:
        return {"error": "Actor not found"}, 404

    err = _ensure_active(actor, "Actor account")
    if err:
        return err

    is_admin = (actor.user_role == UserRole.ADMIN)
    is_owner = (actor.user_id == req.user_id)

    if not (is_admin or is_owner):
        return {"error": "Forbidden"}, 403

    if not is_admin and req.status != EventRequestStatus.PENDING:
        return {"error": "Only pending requests can be deleted by the requester"}, 403

    snapshot = req.to_dict()

    db.session.delete(req)

    log_action(
        user_id=actor.user_id,
        action_type="EVENT_REQUEST_DELETED",
        entity_type="EventRequest",
        entity_id=event_id,
        old_value=json.dumps(snapshot),
        new_value=None
    )

    db.session.commit()
    return {"message": f"Event request {event_id} deleted"}, 200
