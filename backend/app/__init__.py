from flask import Flask
from dotenv import load_dotenv
import os

def create_app():
    """
    Application factory function.
    Creates and configures the Flask app.
    """

    # Load environment variables from .env
    load_dotenv()

    # Create Flask app instance
    app = Flask(__name__)

    # Basic configuration
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")

    # Register blueprints (routes) later
    # from .routes.example import example_bp
    # app.register_blueprint(example_bp)

    return app
