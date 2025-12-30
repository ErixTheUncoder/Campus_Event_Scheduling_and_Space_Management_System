from flask import request, jsonify
from . import notifications_bp

@notifications_bp.get("/")
def list_notifications():
    """
    Student/Admin/Organiser: View notifications (stub).
    Example: /api/notifications?user_id=10&unread=true
    """
    params = {
        "user_id": request.args.get("user_id", type=int),
        "unread": request.args.get("unread"),
        "page": request.args.get("page", default=1, type=int),
        "page_size": request.args.get("page_size", default=20, type=int),
    }
    return jsonify({"message": "list notifications (stub)", "params": params}), 200

@notifications_bp.patch("/<int:notification_id>/read")
def mark_notification_read(notification_id: int):
    """
    Mark a notification as read (stub).
    """
    return jsonify({"message": "mark notification read (stub)", "notification_id": notification_id}), 200
