from .auth import auth_bp
from .products import products_bp
from .customers import customers_bp
from .orders import orders_bp
from .dashboard import dashboard_bp

__all__ = ["auth_bp", "products_bp", "customers_bp", "orders_bp", "dashboard_bp"]
