from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from ..extensions import db
from ..models.order import Order, OrderItem
from ..models.product import Product
from ..models.customer import Customer
from ..utils.order_number import generate_order_number

orders_bp = Blueprint("orders", __name__)


@orders_bp.route("", methods=["GET"])
@jwt_required()
def list_orders():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    status = request.args.get("status", "").strip()
    search = request.args.get("search", "").strip()

    query = Order.query.join(Customer)

    if status and status in Order.VALID_STATUSES:
        query = query.filter(Order.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Order.order_number.ilike(like),
                Customer.name.ilike(like),
                Customer.email.ilike(like),
            )
        )

    query = query.order_by(Order.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "orders": [o.to_dict(include_items=False) for o in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
            "per_page": paginated.per_page,
        }
    ), 200


@orders_bp.route("", methods=["POST"])
@jwt_required()
def create_order():
    """
    Create an order with atomic inventory validation and deduction.

    Body:
      {
        "customer_id": "uuid",
        "items": [{"product_id": "uuid", "quantity": 2}, ...],
        "notes": "optional"
      }
    """
    data = request.get_json(silent=True) or {}

    customer_id = data.get("customer_id", "").strip()
    items_data = data.get("items", [])
    notes = data.get("notes", "").strip() or None

    if not customer_id:
        return jsonify({"error": "customer_id is required"}), 400
    if not items_data or not isinstance(items_data, list):
        return jsonify({"error": "At least one order item is required"}), 400

    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    # Validate item structure
    validated_items = []
    for idx, item in enumerate(items_data):
        product_id = item.get("product_id", "").strip()
        quantity = item.get("quantity", 0)
        if not product_id:
            return jsonify({"error": f"Item {idx + 1}: product_id is required"}), 400
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return jsonify({"error": f"Item {idx + 1}: quantity must be an integer"}), 400
        if quantity <= 0:
            return jsonify({"error": f"Item {idx + 1}: quantity must be greater than 0"}), 400
        validated_items.append({"product_id": product_id, "quantity": quantity})

    # ---- Atomic inventory check & deduction ----
    try:
        total_amount = 0.0
        order_items_to_create = []
        insufficient = []

        for item in validated_items:
            # Row-level lock to prevent race conditions
            product = (
                db.session.execute(
                    select(Product)
                    .where(Product.id == item["product_id"])
                    .with_for_update()
                )
                .scalar_one_or_none()
            )
            if not product:
                db.session.rollback()
                return jsonify({"error": f"Product '{item['product_id']}' not found"}), 404

            if product.stock_quantity < item["quantity"]:
                insufficient.append(
                    {
                        "product_id": product.id,
                        "product_name": product.name,
                        "sku": product.sku,
                        "requested": item["quantity"],
                        "available": product.stock_quantity,
                    }
                )
            else:
                subtotal = float(product.price) * item["quantity"]
                total_amount += subtotal
                order_items_to_create.append(
                    {
                        "product": product,
                        "quantity": item["quantity"],
                        "unit_price": float(product.price),
                        "subtotal": subtotal,
                    }
                )

        if insufficient:
            db.session.rollback()
            return jsonify(
                {
                    "error": "Insufficient stock for one or more products",
                    "insufficient_items": insufficient,
                }
            ), 422

        # Create order
        order_number = generate_order_number()
        order = Order(
            order_number=order_number,
            customer_id=customer_id,
            total_amount=total_amount,
            notes=notes,
            status=Order.STATUS_PENDING,
        )
        db.session.add(order)
        db.session.flush()  # Get order.id without committing

        # Create items and deduct stock
        for item_data in order_items_to_create:
            product = item_data["product"]
            product.stock_quantity -= item_data["quantity"]  # Deduct stock

            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"],
            )
            db.session.add(order_item)

        db.session.commit()
        return jsonify({"order": order.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Order creation failed: {str(e)}"}), 500


@orders_bp.route("/<string:order_id>", methods=["GET"])
@jwt_required()
def get_order(order_id: str):
    order = Order.query.get_or_404(order_id, description="Order not found")
    return jsonify({"order": order.to_dict(include_items=True)}), 200


@orders_bp.route("/<string:order_id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(order_id: str):
    order = Order.query.get_or_404(order_id, description="Order not found")
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").strip()

    if new_status not in Order.VALID_STATUSES:
        return jsonify(
            {"error": f"Invalid status. Must be one of: {', '.join(Order.VALID_STATUSES)}"}
        ), 400

    # Cannot transition from cancelled
    if order.status == Order.STATUS_CANCELLED:
        return jsonify({"error": "Cannot update a cancelled order"}), 409

    # If cancelling, restore stock
    if new_status == Order.STATUS_CANCELLED and order.status != Order.STATUS_CANCELLED:
        for item in order.items:
            product = db.session.execute(
                select(Product).where(Product.id == item.product_id).with_for_update()
            ).scalar_one_or_none()
            if product:
                product.stock_quantity += item.quantity

    order.status = new_status
    db.session.commit()
    return jsonify({"order": order.to_dict()}), 200


@orders_bp.route("/<string:order_id>", methods=["DELETE"])
@jwt_required()
def cancel_order(order_id: str):
    """Cancel an order (only if pending/processing) and restore stock."""
    order = Order.query.get_or_404(order_id, description="Order not found")

    if order.status not in [Order.STATUS_PENDING, Order.STATUS_PROCESSING]:
        return jsonify(
            {"error": f"Cannot cancel order with status '{order.status}'"}
        ), 409

    try:
        # Restore stock for each item
        for item in order.items:
            product = db.session.execute(
                select(Product).where(Product.id == item.product_id).with_for_update()
            ).scalar_one_or_none()
            if product:
                product.stock_quantity += item.quantity

        order.status = Order.STATUS_CANCELLED
        db.session.commit()
        return jsonify({"message": "Order cancelled and stock restored", "order": order.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Cancellation failed: {str(e)}"}), 500
