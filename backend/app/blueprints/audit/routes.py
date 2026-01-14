from flask import request, jsonify
from . import audit_bp

@audit_bp.get("/")
def list_audit_logs():
    """
    Admin: View audit logs (stub).
    Supports basic filtering via query params.
    Example: /api/audit?user_id=1&action=APPROVE_BOOKING&from=2025-01-01&to=2025-01-31
    """
    filters = {
        "user_id": request.args.get("user_id", type=int),
        "action": request.args.get("action"),
        "from": request.args.get("from"),
        "to": request.args.get("to"),
        "page": request.args.get("page", default=1, type=int),
        "page_size": request.args.get("page_size", default=20, type=int),
    }
    return jsonify({"message": "list audit logs (stub)", "filters": filters}), 200
