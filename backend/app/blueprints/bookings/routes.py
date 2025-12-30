from flask import request, jsonify
from . import bookings_bp

@bookings_bp.post("/")
def create_booking():
    """
    Student: Book venue (stub).
    Body example:
    {
      "user_id": 10,
      "venue_id": 2,
      "date": "2026-01-10",
      "start": "10:00",
      "end": "12:00",
      "purpose": "Club meeting"
    }
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "create booking (stub)", "received": data}), 201

@bookings_bp.patch("/<int:booking_id>")
def update_booking(booking_id: int):
    """
    Student: Edit booking (stub).
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "update booking (stub)", "booking_id": booking_id, "received": data}), 200

@bookings_bp.delete("/<int:booking_id>")
def cancel_booking(booking_id: int):
    """
    Student: Cancel booking (stub).
    """
    return jsonify({"message": "cancel booking (stub)", "booking_id": booking_id}), 200

@bookings_bp.get("/history")
def booking_history():
    """
    Student: View booking history (stub).
    Example: /api/bookings/history?user_id=10&status=APPROVED
    """
    params = {
        "user_id": request.args.get("user_id", type=int),
        "status": request.args.get("status"),
        "page": request.args.get("page", default=1, type=int),
        "page_size": request.args.get("page_size", default=20, type=int),
    }
    return jsonify({"message": "booking history (stub)", "params": params}), 200

@bookings_bp.get("/user/<int:user_id>")
def admin_view_user_bookings(user_id: int):
    """
    Admin: View a user's bookings (stub).
    """
    params = {
        "status": request.args.get("status"),
        "page": request.args.get("page", default=1, type=int),
        "page_size": request.args.get("page_size", default=20, type=int),
    }
    return jsonify({"message": "admin view user bookings (stub)", "user_id": user_id, "params": params}), 200

@bookings_bp.patch("/<int:booking_id>/decision")
def admin_decide_booking(booking_id: int):
    """
    Admin: Approve/Reject booking request (stub).
    Body example: {"decision":"APPROVED","admin_id":1,"remark":"OK"}
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "admin booking decision (stub)", "booking_id": booking_id, "received": data}), 200
