from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from ..extensions import db
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..models.customer import Customer

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Return all dashboard statistics in a single request."""

    # ── Counts ──────────────────────────────────────────────────
    total_products = Product.query.count()
    total_customers = Customer.query.count()
    total_orders = Order.query.count()

    # Total revenue from fulfilled orders
    total_revenue = (
        db.session.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.status == Order.STATUS_FULFILLED)
        .scalar()
    )

    # ── Orders by status ────────────────────────────────────────
    status_rows = (
        db.session.query(Order.status, func.count(Order.id))
        .group_by(Order.status)
        .all()
    )
    orders_by_status = {row[0]: row[1] for row in status_rows}

    # ── Low stock alerts ─────────────────────────────────────────
    low_stock_products = (
        Product.query.filter(Product.stock_quantity <= Product.low_stock_threshold)
        .order_by(Product.stock_quantity.asc())
        .limit(10)
        .all()
    )

    # ── Recent orders ────────────────────────────────────────────
    recent_orders = (
        Order.query.order_by(Order.created_at.desc())
        .limit(7)
        .all()
    )

    # ── Revenue last 30 days (daily breakdown) ────────────────────
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_revenue = (
        db.session.query(
            func.date(Order.created_at).label("date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        )
        .filter(
            Order.created_at >= thirty_days_ago,
            Order.status == Order.STATUS_FULFILLED,
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )

    # ── Top selling products ──────────────────────────────────────
    top_products = (
        db.session.query(
            Product.id,
            Product.name,
            Product.sku,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal).label("total_revenue"),
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status == Order.STATUS_FULFILLED)
        .group_by(Product.id, Product.name, Product.sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    return jsonify(
        {
            "summary": {
                "total_products": total_products,
                "total_customers": total_customers,
                "total_orders": total_orders,
                "total_revenue": float(total_revenue),
            },
            "orders_by_status": orders_by_status,
            "low_stock_alerts": [p.to_dict() for p in low_stock_products],
            "recent_orders": [o.to_dict(include_items=False) for o in recent_orders],
            "daily_revenue": [
                {"date": str(row.date), "revenue": float(row.revenue)}
                for row in daily_revenue
            ],
            "top_products": [
                {
                    "id": row.id,
                    "name": row.name,
                    "sku": row.sku,
                    "total_sold": int(row.total_sold),
                    "total_revenue": float(row.total_revenue),
                }
                for row in top_products
            ],
        }
    ), 200
