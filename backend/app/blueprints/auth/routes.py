from flask import request, jsonify
from . import auth_bp
from .services import register_user, login_user, set_user_password, logout_user, delete_user

@auth_bp.post("/register")
def register():
    """
    {
        "full_name": "NAME",
        "user_role": "STUDENT/EVENT_ORGANIZER/ADMIN",
        "email": "EMAIL@mmu.edu.my",
        "phone_number": "PhoneNum",
        "password": "PW"
    }
    """
    data = request.get_json(silent=True) or {}
    resp, code = register_user(data)
    return jsonify(resp), code

@auth_bp.post("/login")
def login():
    """
    {
        "email": "email@mmu.edu.my",
        "password": "PW"
    }

    """
    data = request.get_json(silent=True) or {}
    resp, code = login_user(data)
    return jsonify(resp), code

@auth_bp.post("/set-password")
def set_password():
    """
    First-time password setup or reset
    Body example:
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
    """
    Logout endpoint (stateless version for now)
    Token/session invalidation can be added later
    """
    resp, code = logout_user()
    return jsonify(resp), code

@auth_bp.delete("/users/<int:user_id>")
def delete_account(user_id):
    resp, code = delete_user(user_id)
    return jsonify(resp), code
