from ...extensions import db
from ...models.notification import Notification, NotificationType


def create_notification(
    user_id: int,
    notification_type: NotificationType,
    message: str
):
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        message=message
    )
    db.session.add(notification)
    db.session.commit()
    return notification


def get_user_notifications(user_id: int):
    notifications = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [n.to_dict() for n in notifications]


def mark_notification_as_read(notification_id: int):
    notification = Notification.query.get(notification_id)
    if not notification:
        return {"error": "Notification not found"}, 404

    notification.is_read = True
    db.session.commit()

    return {"message": "Notification marked as read"}, 200
