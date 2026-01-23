from flask import request, jsonify
from . import audit_bp
from ...models.audit_log import AuditLog
from datetime import datetime

@audit_bp.get("/")
def list_audit_logs():
    """
    Admin: View audit logs.
    Supports basic filtering via query params.
    Example: /api/audit?user_id=1&action=APPROVE_BOOKING&from=2025-01-01&to=2025-01-31
    """
    user_id = request.args.get("user_id", type=int)
    action = request.args.get("action")
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    page = request.args.get("page", default=1, type=int)
    page_size = request.args.get("page_size", default=20, type=int)
    
    # Build query
    query = AuditLog.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    if action:
        query = query.filter_by(action_type=action)
    if from_date:
        try:
            from_datetime = datetime.fromisoformat(from_date)
            query = query.filter(AuditLog.action_date_time >= from_datetime)
        except ValueError:
            pass
    if to_date:
        try:
            to_datetime = datetime.fromisoformat(to_date)
            query = query.filter(AuditLog.action_date_time <= to_datetime)
        except ValueError:
            pass
    
    # Order by most recent first
    query = query.order_by(AuditLog.action_date_time.desc())
    
    # Paginate
    total = query.count()
    audit_logs = query.limit(page_size).offset((page - 1) * page_size).all()
    
    # Convert to dict
    logs_data = [{
        "audit_id": log.audit_id,
        "user_id": log.user_id,
        "action_type": log.action_type,
        "action_date_time": log.action_date_time.isoformat() if log.action_date_time else None,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "old_value": log.old_value,
        "new_value": log.new_value
    } for log in audit_logs]
    
    return jsonify({
        "audit_logs": logs_data,
        "total": total,
        "page": page,
        "page_size": page_size
    }), 200
