from flask import request, jsonify
from . import admin_bp
from .services import (
    create_user,
    list_users,
    set_user_active,
    reset_user_password,
    change_user_role,
)

def _parse_bool(v):
    if v is None:
        return None
    s = str(v).strip().lower()
    return s in ("true", "1", "yes", "y", "on")

@admin_bp.post("/users")
def admin_create_user():
    admin_id = request.args.get("admin_id", type=int)
    payload = request.get_json(silent=True) or {}
    resp, code = create_user(admin_id, payload)
    return jsonify(resp), code

@admin_bp.get("/users")
def admin_list_users():
    admin_id = request.args.get("admin_id", type=int)
    resp, code = list_users(admin_id)
    return jsonify(resp), code

@admin_bp.patch("/users/<int:user_id>/active")
def admin_set_active(user_id):
    admin_id = request.args.get("admin_id", type=int)
    is_active_raw = request.args.get("is_active")
    is_active = _parse_bool(is_active_raw)
    if is_active is None:
        return jsonify({"error": "is_active query param is required (true/false)"}), 400

    resp, code = set_user_active(admin_id, user_id, is_active)
    return jsonify(resp), code

@admin_bp.patch("/users/<int:user_id>/password")
def admin_reset_password(user_id):
    admin_id = request.args.get("admin_id", type=int)
    payload = request.get_json(silent=True) or {}
    resp, code = reset_user_password(admin_id, user_id, payload.get("new_password"))
    return jsonify(resp), code

@admin_bp.patch("/users/<int:user_id>/role")
def admin_change_role(user_id):
    admin_id = request.args.get("admin_id", type=int)
    payload = request.get_json(silent=True) or {}
    resp, code = change_user_role(admin_id, user_id, payload.get("role"))
    return jsonify(resp), code
