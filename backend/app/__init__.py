from flask import Flask
from flask_cors import CORS
from .extensions import db, migrate, jwt, bcrypt, ma
from .config import config_by_name
import os


def create_app(config_name: str = None) -> Flask:
    """Application factory."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    ma.init_app(app)

    # CORS — allow frontend origin
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True,
    )

    # Register blueprints
    from .blueprints.auth import auth_bp
    from .blueprints.products import products_bp
    from .blueprints.customers import customers_bp
    from .blueprints.orders import orders_bp
    from .blueprints.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(products_bp, url_prefix="/api/products")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")
    app.register_blueprint(orders_bp, url_prefix="/api/orders")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "message": "Inventory API is running"}, 200

    return app
