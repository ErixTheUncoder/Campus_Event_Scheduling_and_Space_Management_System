from datetime import datetime
import json

from ...extensions import db
from ...models.event_request import EventRequest, EventRequestStatus
from ..audit.services import log_action
from ...models.user import User, UserRole

from ...blueprints.notifications.services import create_notification
from ...models.notification import NotificationType


def _parse_date(date_str: str):
    # expected: "YYYY-MM-DD"
    return datetime.strptime(date_str, "%Y-%m-%d").date()


def _parse_time(time_str: str):
    # expected: "HH:MM" or "HH:MM:SS"
    fmt = "%H:%M:%S" if len(time_str.strip()) == 8 else "%H:%M"
    return datetime.strptime(time_str, fmt).time()


def create_event_request(payload: dict):
    """
    Create event request
    Required:
      user_id, event_name, event_date, start_time, end_time
    Optional:
      purpose, documents
    """
    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required and must be an integer"}, 400
    
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    if user.user_role != UserRole.EVENT_ORGANIZER:
        return {"error": "Forbidden: Only Event Organizers can create event requests"}, 403

    event_name = (payload.get("event_name") or "").strip()
    event_date_str = (payload.get("event_date") or "").strip()
    start_time_str = (payload.get("start_time") or "").strip()
    end_time_str = (payload.get("end_time") or "").strip()

    purpose = payload.get("purpose")
    documents = payload.get("documents")  # optional (can be None)

    if not event_name or not event_date_str or not start_time_str or not end_time_str:
        return {"error": "event_name, event_date, start_time, end_time are required"}, 400

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
    db.session.flush()  # assigns req.event_id without committing

    # AUDIT (submit request)
    log_action(
        user_id=user_id,  # requester
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
    
    q = EventRequest.query

    if viewer.user_role == UserRole.ADMIN:
        # admin sees all
        pass
    elif viewer.user_role == UserRole.EVENT_ORGANIZER:
        # organizer sees only their own
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
    return {"event_requests": [i.to_dict() for i in items]}, 200


def get_event_request(event_id: int, viewer_id: int | None):
    if not viewer_id:
        return {"error": "viewer_id is required"}, 400

    viewer = User.query.get(viewer_id)
    if not viewer:
        return {"error": "Viewer not found"}, 404

    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

    # Admin can view any request
    if viewer.user_role == UserRole.ADMIN:
        return {"event_request": req.to_dict()}, 200

    # Event organizer can view only their own request
    if viewer.user_role == UserRole.EVENT_ORGANIZER and req.user_id == viewer.user_id:
        return {"event_request": req.to_dict()}, 200

    return {"error": "Forbidden"}, 403



def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)

    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)

    return admin, None


def decide_event_request(event_id: int, payload: dict):
    """
    Admin decision:
      payload:
        admin_id (int)
        decision: "APPROVED" or "REJECTED"
        admin_comment (optional)
    """
    req = EventRequest.query.get(event_id)
    if not req:
        return {"error": "Event request not found"}, 404

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

    req.status = EventRequestStatus.APPROVED if decision == "APPROVED" else EventRequestStatus.REJECTED
    req.admin_comment = (admin_comment or "").strip() or None
    req.approval_date_time = datetime.utcnow()

    new_state = {
        "status": req.status.value,
        "admin_comment": req.admin_comment,
        "approval_date_time": req.approval_date_time.isoformat()
    }

    # NOTIFICATION to requester
    if decision == "APPROVED":
        notif_type = NotificationType.EVENT_REQUEST_APPROVED
        notif_msg = f"Your event request '{req.event_name}' has been approved."
    else:
        notif_type = NotificationType.EVENT_REQUEST_REJECTED
        notif_msg = f"Your event request '{req.event_name}' has been rejected."

    create_notification(
        user_id=req.user_id,   # requester
        notification_type=notif_type,
        message=notif_msg
    )

    # AUDIT (admin decision)
    log_action(
        user_id=admin.user_id,  # admin who decides
        action_type="EVENT_REQUEST_DECISION",
        entity_type="EventRequest",
        entity_id=req.event_id,
        old_value=json.dumps(old_state),
        new_value=json.dumps(new_state)
    )

    db.session.commit()

    return {"message": f"Event request {decision.lower()}", "event_request": req.to_dict()}, 200


def delete_event_request(event_id: int, payload: dict | None = None):
    """
    Optional: allow requester/admin delete
    payload can include actor_id for audit (optional)
    """
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

    is_admin = (actor.user_role == UserRole.ADMIN)
    is_owner = (actor.user_id == req.user_id)

    if not (is_admin or is_owner):
        return {"error": "Forbidden"}, 403

    # non-admin, only allow delete when pending
    if not is_admin and req.status != EventRequestStatus.PENDING:
        return {"error": "Only pending requests can be deleted by the requester"}, 403

    snapshot = req.to_dict()

    db.session.delete(req)

    # AUDIT
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
