from flask import request, jsonify
from . import auth_bp
from .services import (
    login_user,
    change_password,
    logout_user,
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


@auth_bp.post("/change-password")
def reset_password():
    """
    User changes own password
    {
        "user_id": 1,
        "old_password": "old123",
        "new_password": "new123"
    }
    """
    data = request.get_json(silent=True) or {}
    resp, code = change_password(data)
    return jsonify(resp), code


@auth_bp.post("/logout")
def logout():
    resp, code = logout_user()
    return jsonify(resp), code
