from datetime import datetime
from enum import Enum
from ..extensions import db


class BookingStatus(Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class BookingRequest(db.Model):
    __tablename__ = "booking_requests"

    booking_id = db.Column(db.Integer, primary_key=True)

    booking_date = db.Column(db.Date, nullable=False)
    request_date_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    status = db.Column(db.Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)

    approval_date_time = db.Column(db.DateTime, nullable=True)
    admin_comment = db.Column(db.Text, nullable=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    venue_available_id = db.Column(
        db.Integer,
        db.ForeignKey("venue_availability.venue_available_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    def to_dict(self):
        return {
            "booking_id": self.booking_id,
            "booking_date": self.booking_date.isoformat() if self.booking_date else None,
            "request_date_time": self.request_date_time.isoformat() if self.request_date_time else None,
            "status": self.status.value if self.status else None,
            "approval_date_time": self.approval_date_time.isoformat() if self.approval_date_time else None,
            "admin_comment": self.admin_comment,
            "user_id": self.user_id,
            "venue_available_id": self.venue_available_id,
        }
