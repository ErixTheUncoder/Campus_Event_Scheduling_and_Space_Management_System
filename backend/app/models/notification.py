from datetime import datetime
from enum import Enum
from ..extensions import db


class NotificationType(Enum):
    BOOKING_CREATED = "Booking Created"
    BOOKING_APPROVED = "Booking Approved"
    BOOKING_REJECTED = "Booking Rejected"
    BOOKING_CANCELLED = "Booking Cancelled"

    EVENT_CREATED = "Event Created"
    EVENT_UPDATED = "Event Updated"
    EVENT_CANCELLED = "Event Cancelled"
    EVENT_REMINDER = "Event Reminder"

    VENUE_REQUEST_SUBMITTED = "Venue Request Submitted"
    VENUE_REQUEST_APPROVED = "Venue Request Approved"
    VENUE_REQUEST_REJECTED = "Venue Request Rejected"

    SYSTEM_ALERT = "System Alert"


class Notification(db.Model):
    __tablename__ = "notifications"

    notification_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )

    notification_type = db.Column(db.Enum(NotificationType), nullable=False)
    message = db.Column(db.Text, nullable=False)

    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "notification_id": self.notification_id,
            "user_id": self.user_id,
            "notification_type": self.notification_type.value,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat()
        }
