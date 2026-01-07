from flask import jsonify, request
from . import notifications_bp
from .services import get_user_notifications, mark_notification_as_read


@notifications_bp.get("/")
def list_notifications():
    """
    GET /api/notifications/?user_id=1
    """
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return {"error": "user_id is required"}, 400

    data = get_user_notifications(user_id)
    return jsonify(data), 200


@notifications_bp.patch("/<int:notification_id>/read")
def read_notification(notification_id):
    resp, code = mark_notification_as_read(notification_id)
    return jsonify(resp), code
