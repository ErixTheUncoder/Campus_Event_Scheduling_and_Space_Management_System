from flask import request, jsonify
from . import auth_bp
from .services import register_user, login_user, set_user_password, logout_user, delete_user, register_user_admin

@auth_bp.post("/register")
def register():
    """
    {
        "full_name": "NAME",
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

@auth_bp.route("/register-admin", methods=["POST"]      )
def register_admin():
    payload = request.get_json(silent=True) or {}
    data, status = register_user_admin(payload)
    return jsonify(data), status

"""
    "user_role": "STUDENT/EVENT_ORGANIZER/ADMIN",
    
register as always student
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Ali","email":"ali@mmu.edu.my","password":"123456"}'

register as admin with key
curl -X POST http://127.0.0.1:5000/api/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{"admin_key":"MY_TEST_KEY_123","full_name":"Org","email":"org@mmu.edu.my","password":"123456","user_role":"EVENT_ORGANIZER"}'
{
  "admin_key": "MY_TEST_KEY_123",
  "full_name": "Organizer Test",
  "user_role": "EVENT_ORGANIZER",
  "email": "orgtest@mmu.edu.my",
  "password": "123456",
  "phone_number": "0123456789"
}

"""