from werkzeug.security import generate_password_hash
import json

from ...extensions import db
from ...models.user import User, UserRole
from ...blueprints.audit.services import log_action


def _require_admin(admin_id: int):
    if not admin_id:
        return None, ({"error": "admin_id is required"}, 400)

    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin not found"}, 404)

    # block inactive admins
    if not getattr(admin, "is_active", True):
        return None, ({"error": "Account is inactive. Please contact another admin."}, 403)

    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)

    return admin, None


def _normalize_role(value: str):
    """
    Accepts:
      - STUDENT / student / Student
      - EVENT_ORGANIZER / event_organizer / Event Organizer / EVENT ORGANIZER
      - ADMIN / admin / Admin
    Returns enum-name: STUDENT / EVENT_ORGANIZER / ADMIN
    """
    if not value:
        return None

    raw = str(value).strip().upper()
    raw = raw.replace("-", "_").replace(" ", "_")

    # Also handle if frontend sends enum "value" like "Event Organizer"
    # -> becomes EVENT_ORGANIZER after replace

    if raw in ("STUDENT", "EVENT_ORGANIZER", "ADMIN"):
        return raw

    return None


def create_user(admin_id: int, payload: dict):
    admin, err = _require_admin(admin_id)
    if err:
        return err

    full_name = (payload.get("full_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone = (payload.get("phone_number") or "").strip()
    password = payload.get("password") or ""
    role_in = payload.get("user_role")

    role = _normalize_role(role_in)

    if not all([full_name, email, phone, password, role]):
        return {"error": "All fields are required"}, 400

    if User.query.filter_by(email=email).first():
        return {"error": "Email already exists"}, 409

    try:
        user = User(
            full_name=full_name,
            email=email,
            phone_number=phone,              # validated by @validates
            user_role=UserRole[role],
            password=generate_password_hash(password),
            is_active=True,
        )

        db.session.add(user)
        db.session.commit()

        log_action(
            user_id=admin.user_id,
            action_type="ADMIN_CREATE_USER",
            entity_type="User",
            entity_id=user.user_id,
            new_value=json.dumps(user.to_dict()),
        )

        return {"message": "User created", "user": user.to_dict()}, 201

    except ValueError as ve:
        db.session.rollback()
        # This catches your phone_number validator error nicely
        return {"error": str(ve)}, 400

    except Exception:
        db.session.rollback()
        return {"error": "Failed to create user"}, 500


def list_users(admin_id: int):
    admin, err = _require_admin(admin_id)
    if err:
        return err

    users = User.query.order_by(User.user_id.asc()).all()
    return {"users": [u.to_dict() for u in users]}, 200


def set_user_active(admin_id: int, user_id: int, is_active: bool):
    admin, err = _require_admin(admin_id)
    if err:
        return err

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    user.is_active = bool(is_active)

    log_action(
        user_id=admin.user_id,
        action_type="ADMIN_SET_USER_ACTIVE",
        entity_type="User",
        entity_id=user.user_id,
        new_value=str(bool(is_active)),
    )

    db.session.commit()
    return {"message": "User status updated"}, 200


def reset_user_password(admin_id: int, user_id: int, new_password: str):
    admin, err = _require_admin(admin_id)
    if err:
        return err

    if not new_password or len(new_password) < 6:
        return {"error": "new_password is required (min 6 chars)"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    user.password = generate_password_hash(new_password)

    log_action(
        user_id=admin.user_id,
        action_type="ADMIN_RESET_PASSWORD",
        entity_type="User",
        entity_id=user.user_id,
    )

    db.session.commit()
    return {"message": "Password reset successfully"}, 200


def change_user_role(admin_id: int, user_id: int, new_role: str):
    admin, err = _require_admin(admin_id)
    if err:
        return err

    role = _normalize_role(new_role)
    if role not in {"STUDENT", "EVENT_ORGANIZER", "ADMIN"}:
        return {"error": "Invalid role"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    old_role = user.user_role.name  # enum name
    user.user_role = UserRole[role]

    log_action(
        user_id=admin.user_id,
        action_type="ADMIN_CHANGE_ROLE",
        entity_type="User",
        entity_id=user.user_id,
        old_value=old_role,
        new_value=role,
    )

    db.session.commit()
    return {"message": "User role updated"}, 200


def get_dashboard_stats(admin_id: int):
    """Get dashboard statistics for admin"""
    admin, err = _require_admin(admin_id)
    if err:
        return err

    from ...models.event_request import EventRequest, EventRequestStatus
    from ...models.venue_request import VenueRequest, VenueRequestStatus
    from ...models.venue import Venue
    from datetime import date

    # Count upcoming approved events (event_date >= today)
    today = date.today()
    upcoming_events = EventRequest.query.filter(
        EventRequest.status == EventRequestStatus.APPROVED,
        EventRequest.event_date >= today
    ).count()

    # Count pending requests (both event and venue requests)
    pending_event_requests = EventRequest.query.filter(
        EventRequest.status == EventRequestStatus.PENDING
    ).count()
    
    pending_venue_requests = VenueRequest.query.filter(
        VenueRequest.status == VenueRequestStatus.PENDING
    ).count()
    
    total_pending = pending_event_requests + pending_venue_requests

    # Count total venues
    total_venues = Venue.query.count()

    # Count active users
    active_users = User.query.filter(User.is_active == True).count()

    return {
        "upcoming_events": upcoming_events,
        "pending_requests": total_pending,
        "total_venues": total_venues,
        "active_users": active_users
    }, 200

