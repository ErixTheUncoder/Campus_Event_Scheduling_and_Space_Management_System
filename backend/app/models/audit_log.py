from datetime import datetime
from ..extensions import db

class AuditLog(db.Model):
    __tablename__ = "audit_log"

    audit_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True
    )

    action_type = db.Column(db.String(100), nullable=False)
    action_date_time = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    entity_type = db.Column(db.String(100), nullable=False)
    entity_id = db.Column(db.Integer, nullable=True)

    old_value = db.Column(db.Text, nullable=True)
    new_value = db.Column(db.Text, nullable=True)

    user = db.relationship("User", backref="audit_logs")

    def to_dict(self):
        return {
            "audit_id": self.audit_id,
            "user_id": self.user_id,
            "action_type": self.action_type,
            "action_date_time": self.action_date_time.isoformat(),
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "old_value": self.old_value,
            "new_value": self.new_value
        }
