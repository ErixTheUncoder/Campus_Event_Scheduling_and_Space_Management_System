from werkzeug.security import generate_password_hash, check_password_hash

from ..audit.services import log_action
from ...extensions import db
from ...models.user import User


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


def change_password(payload: dict):
    """
    User changes their own password
    """
    try:
        user_id = int(payload.get("user_id"))
    except (TypeError, ValueError):
        return {"error": "user_id is required"}, 400

    old_password = payload.get("old_password") or ""
    new_password = payload.get("new_password") or ""

    if not old_password or not new_password:
        return {"error": "old_password and new_password are required"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    if not check_password_hash(user.password, old_password):
        return {"error": "Old password incorrect"}, 403

    user.password = generate_password_hash(new_password)

    log_action(
        user_id=user.user_id,
        action_type="CHANGE_PASSWORD",
        entity_type="User",
        entity_id=user.user_id,
    )

    db.session.commit()
    return {"message": "Password updated successfully"}, 200


def logout_user():
    # Stateless logout (frontend clears token/session)
    return {"message": "Logout successful"}, 200