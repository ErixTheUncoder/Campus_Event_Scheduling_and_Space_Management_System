from datetime import datetime
from enum import Enum
from ..extensions import db


class UserRole(Enum):
    STUDENT = "Student"
    EVENT_ORGANIZER = "Event Organizer"
    ADMIN = "Admin"


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)                 # PK user_id
    full_name = db.Column(db.String(120), nullable=False)
    user_role = db.Column(db.Enum(UserRole), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(30), nullable=False)
    password = db.Column(db.String(255), nullable=False)              # store hashed password

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "user_role": self.user_role.value if self.user_role else None,
            "email": self.email,
            "phone_number": self.phone_number,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
