from datetime import datetime
from enum import Enum
from ..extensions import db


class VenueRequestStatus(Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class VenueRequest(db.Model):
    __tablename__ = "venue_requests"

    venue_request_id = db.Column(db.Integer, primary_key=True)

    # FK -> event_requests.event_id (your EventRequest PK)
    event_id = db.Column(
        db.Integer,
        db.ForeignKey("event_requests.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # FK -> venue_availability.venue_available_id
    venue_available_id = db.Column(
        db.Integer,
        db.ForeignKey("venue_availability.venue_available_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    request_date_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    status = db.Column(db.Enum(VenueRequestStatus), default=VenueRequestStatus.PENDING, nullable=False)

    approval_date_time = db.Column(db.DateTime, nullable=True)
    admin_comment = db.Column(db.Text, nullable=True)

    resources_needed = db.Column(db.Text, nullable=True)

    # Relationships (optional but useful)
    event_request = db.relationship("EventRequest", backref="venue_requests")
    availability = db.relationship("VenueAvailability", backref="venue_requests")

    def to_dict(self):
        return {
            "venue_request_id": self.venue_request_id,
            "event_id": self.event_id,
            "venue_available_id": self.venue_available_id,
            "request_date_time": self.request_date_time.isoformat() if self.request_date_time else None,
            "status": self.status.value if self.status else None,
            "approval_date_time": self.approval_date_time.isoformat() if self.approval_date_time else None,
            "admin_comment": self.admin_comment,
            "resources_needed": self.resources_needed
        }
