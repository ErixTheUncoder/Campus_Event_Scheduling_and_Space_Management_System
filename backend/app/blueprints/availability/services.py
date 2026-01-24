from ...models.venue_availability import VenueAvailability
from ...models.booking_request import BookingRequest, BookingStatus
from ...models.venue_request import VenueRequest, VenueRequestStatus

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
