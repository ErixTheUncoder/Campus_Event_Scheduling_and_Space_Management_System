from datetime import datetime
from enum import Enum
import re

from sqlalchemy.orm import validates
from ..extensions import db


class UserRole(Enum):
    STUDENT = "Student"
    EVENT_ORGANIZER = "Event Organizer"
    ADMIN = "Admin"


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    user_role = db.Column(db.Enum(UserRole), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(30), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @validates("phone_number")
    def validate_phone(self, key, value):
        value = (value or "").strip()
        if not re.fullmatch(r"\d{7,30}", value):
            raise ValueError("Phone number must be digits only (7–30 digits).")
        return value

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "user_role": self.user_role.value if self.user_role else None,
            "email": self.email,
            "phone_number": self.phone_number,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
