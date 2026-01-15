import os
from werkzeug.security import generate_password_hash, check_password_hash

from ..audit.services import log_action
from ...extensions import db
from ...models.user import User


def _validate_admin_key(provided_key):
    expected_key = (os.getenv("ADMIN_REGISTER_KEY") or "").strip()

    if not expected_key:
        return False, {"error": "ADMIN_REGISTER_KEY not set on server"}, 500

    if not provided_key or (provided_key or "").strip() != expected_key:
        return False, {"error": "Forbidden"}, 403

    return True, {}, 200


def register_user_admin(payload: dict):
    """
    Admin-only: create a user account.
    """
    admin_key = (payload.get("admin_key") or "").strip()
    ok, resp, code = _validate_admin_key(admin_key)
    if not ok:
        return resp, code

    full_name = (payload.get("full_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone_number = (payload.get("phone_number") or "").strip()
    password = payload.get("password") or ""
    user_role = (payload.get("user_role") or "").strip().upper()

    if not full_name or not email or not password or not phone_number or not user_role:
        return {
            "error": "admin_key, full_name, email, phone_number, password, user_role are required"
        }, 400

    if user_role not in {"STUDENT", "EVENT_ORGANIZER", "ADMIN"}:
        return {"error": "Invalid user_role. Use STUDENT, EVENT_ORGANIZER, or ADMIN."}, 400

    if User.query.filter_by(email=email).first():
        return {"error": "Email already registered"}, 409

    user = User(
        full_name=full_name,
        user_role=user_role,
        email=email,
        phone_number=phone_number,
        password=generate_password_hash(password),
    )

    db.session.add(user)
    db.session.commit()

    log_action(
        user_id=user.user_id,
        action_type="REGISTER_ADMIN",
        entity_type="User",
        entity_id=user.user_id,
        new_value=f"Admin created user {user.email} as {user_role}",
    )
    db.session.commit()

    return {"message": "User created (admin)", "user": user.to_dict()}, 201


def login_user(payload: dict):
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return {"error": "email and password are required"}, 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return {"error": "Invalid credentials"}, 401

    log_action(
        user_id=user.user_id,
        action_type="LOGIN",
        entity_type="User",
        entity_id=user.user_id,
    )
    db.session.commit()

    return {"message": "Login successful", "user": user.to_dict()}, 200


def set_user_password(payload: dict):
    user_id = payload.get("user_id")
    new_password = payload.get("new_password") or ""

    if not user_id or not new_password:
        return {"error": "user_id and new_password are required"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    user.password = generate_password_hash(new_password)

    log_action(
        user_id=user.user_id,
        action_type="UPDATE_PASSWORD",
        entity_type="User",
        entity_id=user.user_id,
        new_value="password_hash_changed",
    )

    db.session.commit()
    return {"message": "Password updated successfully"}, 200


def logout_user():
    # stateless logout
    return {"message": "Logout successful"}, 200


def delete_user(user_id: int, admin_key: str):
    """
    Admin-only: delete a user account.
    """
    ok, resp, code = _validate_admin_key(admin_key)
    if not ok:
        return resp, code

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    email = user.email

    log_action(
        user_id=user_id,
        action_type="DELETE_USER",
        entity_type="User",
        entity_id=user_id,
        old_value=f"User {email} deleted",
    )

    db.session.delete(user)
    db.session.commit()

    return {"message": f"User {user_id} deleted successfully"}, 200
