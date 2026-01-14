import os

class BaseConfig:
    """
    Base configuration shared by all environments.
    """
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(BaseConfig):
    """
    Configuration for local development.
    """
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///dev.db"
    )


class ProductionConfig(BaseConfig):
    """
    Configuration for production deployment.
    """
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

    # if not SQLALCHEMY_DATABASE_URI:
    #     raise RuntimeError("DATABASE_URL must be set in production")
