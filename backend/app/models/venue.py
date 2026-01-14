from enum import Enum
from ..extensions import db


class VenueType(Enum):
    LECTURE_HALL = "Lecture Hall"
    AUDITORIUM = "Auditorium"
    LAB = "Lab"
    MEETING_ROOM = "Meeting Room"
    MULTIPURPOSE = "Multipurpose"


class Venue(db.Model):
    __tablename__ = "venues"

    venue_id = db.Column(db.Integer, primary_key=True)
    venue_name = db.Column(db.String(150), nullable=False, unique=True)
    location = db.Column(db.String(150), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    venue_type = db.Column(db.Enum(VenueType), nullable=False)

    def to_dict(self):
        return {
            "venue_id": self.venue_id,
            "venue_name": self.venue_name,
            "location": self.location,
            "capacity": self.capacity,
            "venue_type": self.venue_type.value if self.venue_type else None
        }
