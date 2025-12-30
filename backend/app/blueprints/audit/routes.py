from . import audit_bp

@audit_bp.get("/")
def list_audit():
    return {"message": "audit ok (stub)"}
