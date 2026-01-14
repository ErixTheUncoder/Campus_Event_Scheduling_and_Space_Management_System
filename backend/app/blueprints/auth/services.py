from ..audit.services import log_action
from werkzeug.security import generate_password_hash, check_password_hash
from ...extensions import db
from ...models.user import User

def register_user(payload: dict):
    full_name = (payload.get("full_name") or "").strip()
    user_role = (payload.get("user_role") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    phone_number = (payload.get("phone_number") or "").strip()
    password = payload.get("password") or ""

    if not full_name or not user_role or not email or not password:
        return {"error": "full_name, user_role, email, password are required"}, 400

    if User.query.filter_by(email=email).first():
        return {"error": "Email already registered"}, 409

    hashed_password = generate_password_hash(password)

    user = User(
        full_name=full_name,
        user_role=user_role,
        email=email,
        phone_number=phone_number if phone_number else None,
        password=hashed_password
    )

    db.session.add(user)
    db.session.commit()

    log_action(
        user_id=user.user_id,
        action_type="REGISTER",
        entity_type="User",
        entity_id=user.user_id,
        new_value=f"User {user.email} registered"
    )

    db.session.commit()

    return {"message": "User registered", "user": user.to_dict()}, 201


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
        entity_id=user.user_id
    )
    # Simple version: return user details.
    # Later you can add JWT/session.
    return {"message": "Login successful", "user": user.to_dict()}, 200


def set_user_password(payload: dict):
    """
    First-time password setup or password reset
    """
    user_id = payload.get("user_id")
    new_password = payload.get("new_password")

    if not user_id or not new_password:
        return {"error": "user_id and new_password are required"}, 400

    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404

    user.password = generate_password_hash(new_password)
    db.session.commit()

    log_action(
        user_id=user.user_id,
        action_type="CHANGE_PASSWORD",
        entity_type="User",
        entity_id=user.user_id,
        old_value="password_hash_changed",
        new_value="password_hash_changed"
    )

    db.session.commit()

    return {"message": "Password updated successfully"}, 200


def logout_user():
    """
    Stateless logout.
    Token/session invalidation can be added later.
    """
    return {"message": "Logout successful"}, 200

def delete_user(user_id: int):
    user = User.query.get(user_id)
    if not user:
        return {"error": "User not found"}, 404
    
    email = user.email

    log_action(
        user_id=user_id,
        action_type="DELETE_USER",
        entity_type="User",
        entity_id=user_id,
        old_value=f"User {email} deleted"
    )

    db.session.delete(user)
    db.session.commit()

    return {"message": f"User {user_id} deleted successfully"}, 200