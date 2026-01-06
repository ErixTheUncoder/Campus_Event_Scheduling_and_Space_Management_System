from datetime import datetime
from ...extensions import db
from ...models.audit_log import AuditLog

def log_action(
    user_id,
    action_type: str,
    entity_type: str,
    entity_id=None,
    old_value=None,
    new_value=None
):
    audit = AuditLog(
        user_id=user_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        action_date_time=datetime.utcnow()
    )
    db.session.add(audit)
    return audit
