from datetime import datetime
from ...models.venue_availability import VenueAvailability
from ...models.booking_request import BookingRequest, BookingStatus
from ...models.venue_request import VenueRequest, VenueRequestStatus


def is_venue_available(venue_id: int, start_dt: datetime, end_dt: datetime, exclude_request_id: int = None, exclude_booking_id: int = None):
    """
    Centralized availability checker.
    
    Returns tuple: (available: bool, error_message: str or None, conflict_slot_id: int or None)
    
    - venue_id: the venue to check
    - start_dt, end_dt: datetime objects for the desired time slot
    - exclude_request_id: if editing a venue request, exclude this venue_request_id from conflict checks
    - exclude_booking_id: if editing a booking request, exclude this booking_id from conflict checks
    
    Overlap logic: (new_start < existing_end) AND (new_end > existing_start)
    
    Only PENDING and APPROVED requests/bookings block availability.
    REJECTED and CANCELLED do not block.
    """
    
    # Find all existing venue availability records that overlap
    overlapping_slots = VenueAvailability.query.filter(
        VenueAvailability.venue_id == venue_id,
        VenueAvailability.start_datetime < end_dt,
        VenueAvailability.end_datetime > start_dt
    ).all()
    
    for slot in overlapping_slots:
        # Check venue requests (Event Organizer)
        vr_query = VenueRequest.query.filter(
            VenueRequest.venue_available_id == slot.venue_available_id,
            VenueRequest.status.in_([VenueRequestStatus.PENDING, VenueRequestStatus.APPROVED])
        )
        
        if exclude_request_id:
            vr_query = vr_query.filter(VenueRequest.venue_request_id != exclude_request_id)
        
        existing_vr = vr_query.first()
        if existing_vr:
            return False, "Venue already reserved for this time slot (event request conflict)", slot.venue_available_id
        
        # Check booking requests (Student)
        br_query = BookingRequest.query.filter(
            BookingRequest.venue_available_id == slot.venue_available_id,
            BookingRequest.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED])
        )
        
        if exclude_booking_id:
            br_query = br_query.filter(BookingRequest.booking_id != exclude_booking_id)
        
        existing_br = br_query.first()
        if existing_br:
            return False, "Venue already reserved for this time slot (booking request conflict)", slot.venue_available_id
    
    return True, None, None


def check_venue_availability_service(data: dict):
    """
    Service for checking venue availability via API.
    Used by Admin venue availability checker.
    """
    try:
        venue_id = int(data.get("venue_id"))
    except (TypeError, ValueError):
        return {"error": "venue_id is required"}, 400

    date_str = (data.get("date") or "").strip()
    start_str = (data.get("start_time") or "").strip()
    end_str = (data.get("end_time") or "").strip()

    if not date_str or not start_str or not end_str:
        return {"error": "date, start_time, and end_time are required"}, 400

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_time = datetime.strptime(start_str, "%H:%M").time()
        end_time = datetime.strptime(end_str, "%H:%M").time()
    except ValueError:
        return {"error": "Invalid date/time format"}, 400

    if end_time <= start_time:
        return {"error": "end_time must be later than start_time"}, 400

    start_dt = datetime.combine(date, start_time)
    end_dt = datetime.combine(date, end_time)

    available, error_msg, conflict_slot_id = is_venue_available(venue_id, start_dt, end_dt)

    return {
        "available": available,
        "message": error_msg if not available else "Venue is available for the selected time",
        "conflict_slot_id": conflict_slot_id
    }, 200


def get_all_availability():
    try:
        # slots taken by venue_requests (EO events)
        taken_by_venue = {
            vr.venue_available_id
            for vr in VenueRequest.query.filter(
                VenueRequest.status.in_([VenueRequestStatus.PENDING, VenueRequestStatus.APPROVED])
            ).all()
        }

        # slots taken by booking_requests (students)
        taken_by_booking = {
            br.venue_available_id
            for br in BookingRequest.query.filter(
                BookingRequest.status.in_([BookingStatus.PENDING, BookingStatus.APPROVED])
            ).all()
        }

        taken_ids = taken_by_venue.union(taken_by_booking)

        availability_records = VenueAvailability.query.all()

        out = []
        for a in availability_records:
            out.append({
                "venue_available_id": a.venue_available_id,
                "venue_id": a.venue_id,
                "start_datetime": a.start_datetime.isoformat(),
                "end_datetime": a.end_datetime.isoformat(),
                # computed availability
                "is_available": a.venue_available_id not in taken_ids,
                # helpful derived fields for frontend
                "date": a.start_datetime.date().isoformat(),
                "start_time": a.start_datetime.strftime("%H:%M"),
                "end_time": a.end_datetime.strftime("%H:%M"),
            })

        return {"availability": out}, 200

    except Exception as e:
        return {"error": str(e)}, 500
