from datetime import datetime
from enum import Enum
from ..extensions import db


class EventRequestStatus(Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class EventRequest(db.Model):
    __tablename__ = "event_requests"

    # PK (you requested event_id as PK)
    event_id = db.Column(db.Integer, primary_key=True)

    # FK -> users.user_id
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    event_name = db.Column(db.String(200), nullable=False)

    event_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    purpose = db.Column(db.Text, nullable=True)

    status = db.Column(db.Enum(EventRequestStatus), nullable=False, default=EventRequestStatus.PENDING)

    request_date_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    approval_date_time = db.Column(db.DateTime, nullable=True)

    admin_comment = db.Column(db.Text, nullable=True)

    documents = db.Column(db.Text, nullable=True)

    user = db.relationship("User", backref="event_requests")

    def to_dict(self):
        return {
            "event_id": self.event_id,
            "user_id": self.user_id,
            "event_name": self.event_name,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "purpose": self.purpose,
            "status": self.status.value if self.status else None,
            "request_date_time": self.request_date_time.isoformat() if self.request_date_time else None,
            "approval_date_time": self.approval_date_time.isoformat() if self.approval_date_time else None,
            "admin_comment": self.admin_comment,
            "documents": self.documents
        }
