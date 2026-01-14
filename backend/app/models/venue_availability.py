from datetime import datetime
from ..extensions import db


class VenueAvailability(db.Model):
    __tablename__ = "venue_availability"

    venue_available_id = db.Column(db.Integer, primary_key=True)

    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)

    venue_id = db.Column(
        db.Integer,
        db.ForeignKey("venues.venue_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    venue = db.relationship("Venue", backref="availabilities")

    def to_dict(self):
        return {
            "venue_available_id": self.venue_available_id,
            "venue_id": self.venue_id,
            "start_datetime": self.start_datetime.isoformat() if self.start_datetime else None,
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
        }
