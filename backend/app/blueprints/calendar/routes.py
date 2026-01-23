from flask import request, jsonify
from . import calendar_bp
from .services import (
    get_calendar
)


@calendar_bp.get("/calendar")
def calendar_view():
    user_id = request.args.get("user_id", type=int)
    resp, code = get_calendar(user_id)
    return jsonify(resp), code
