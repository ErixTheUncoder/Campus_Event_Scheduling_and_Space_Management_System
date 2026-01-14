from flask import Flask, app
from dotenv import load_dotenv
import os

from .extensions import db
from flask_migrate import Migrate
from .config import DevelopmentConfig, ProductionConfig


def create_app():
    """
    Application factory.
    Creates and configures the Flask app.
    """

    # Load environment variables from .env
    load_dotenv()

    app = Flask(__name__)

    @app.get("/")
    def home():
        return {
            "message": "Backend is running",
            "endpoints": [
                "/api/auth",
                "/api/venues",
                "/api/availability",
                "/api/bookings",
                "/api/events",
                "/api/venue-requests",
                "/api/notifications",
                "/api/audit"
            ]
        }, 200


    # Select config based on environment
    env = os.getenv("FLASK_ENV", "development").lower()
    if env == "production":
        app.config.from_object(ProductionConfig)

        if not app.config.get("SQLALCHEMY_DATABASE_URI"):
            raise RuntimeError("DATABASE_URL must be set in production")
        
    else:
        app.config.from_object(DevelopmentConfig)

    print("DB URI:", app.config.get("SQLALCHEMY_DATABASE_URI"))

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "connect_args": {"prepare_threshold": 0}
    }


    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)

    # -----------------------
    # Register blueprints
    # -----------------------
    from .blueprints.auth.routes import auth_bp
    from .blueprints.venues.routes import venues_bp
    from .blueprints.availability.routes import availability_bp
    from .blueprints.booking_request.routes import booking_requests_bp 
    from .blueprints.event_request.routes import event_requests_bp
    from .blueprints.venue_requests.routes import venue_requests_bp
    from .blueprints.notifications.routes import notifications_bp
    from .blueprints.audit.routes import audit_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(venues_bp, url_prefix="/api/venues")
    app.register_blueprint(availability_bp, url_prefix="/api/availability")
    app.register_blueprint(booking_requests_bp, url_prefix="/api/booking-requests")
    app.register_blueprint(event_requests_bp, url_prefix="/api/event-requests")
    app.register_blueprint(venue_requests_bp, url_prefix="/api/venue-requests")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")

    with app.app_context():
        from . import models
        # db.create_all()

    return app
