from flask import request, jsonify
from . import auth_bp
from .services import (
    login_user,
    set_user_password,
    logout_user,
    delete_user,
    register_user_admin,
)


@auth_bp.post("/login")
def login():
    """
    {
        "email": "EMAIL@mmu.edu.my",
        "password": "PW"
    }
    """
    data = request.get_json(silent=True) or {}
    resp, code = login_user(data)
    return jsonify(resp), code


@auth_bp.post("/register-admin")
def register_admin():
    """
    Admin-only: create accounts.

    {
      "admin_key": "YOUR_ADMIN_REGISTER_KEY",
      "full_name": "NAME",
      "email": "EMAIL@mmu.edu.my",
      "phone_number": "0123456789",
      "password": "PW",
      "user_role": "STUDENT" | "EVENT_ORGANIZER" | "ADMIN"
    }
    """
    payload = request.get_json(silent=True) or {}
    data, status = register_user_admin(payload)
    return jsonify(data), status


@auth_bp.delete("/users/<int:user_id>")
def delete_account(user_id):
    """
    Admin-only: delete account.
    Admin key can be provided in:
      - Header: X-Admin-Key
      - Query:  ?admin_key=...
    """
    admin_key = request.headers.get("X-Admin-Key") or request.args.get("admin_key")
    resp, code = delete_user(user_id, admin_key)
    return jsonify(resp), code


@auth_bp.post("/set-password")
def set_password():
    """
    Optional endpoint if you still use it.
    {
        "user_id": 1,
        "new_password": "abc123"
    }
    """
    data = request.get_json(silent=True) or {}
    resp, code = set_user_password(data)
    return jsonify(resp), code


@auth_bp.post("/logout")
def logout():
    resp, code = logout_user()
    return jsonify(resp), code
