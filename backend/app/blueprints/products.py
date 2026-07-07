from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.product import Product
from ..utils.sku_generator import generate_unique_sku

products_bp = Blueprint("products", __name__)


@products_bp.route("", methods=["GET"])
@jwt_required()
def list_products():
    """List products with pagination and search."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    low_stock_only = request.args.get("low_stock_only", "false").lower() == "true"

    query = Product.query

    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Product.name.ilike(like), Product.sku.ilike(like))
        )
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    if low_stock_only:
        query = query.filter(Product.stock_quantity <= Product.low_stock_threshold)

    query = query.order_by(Product.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "products": [p.to_dict() for p in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
            "per_page": paginated.per_page,
        }
    ), 200


@products_bp.route("", methods=["POST"])
@jwt_required()
def create_product():
    """Create a new product with auto-generated SKU."""
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    price = data.get("price")
    stock_quantity = data.get("stock_quantity", 0)
    category = data.get("category", "").strip() or None
    description = data.get("description", "").strip() or None
    low_stock_threshold = data.get("low_stock_threshold", 10)

    if not name:
        return jsonify({"error": "Product name is required"}), 400
    if price is None or float(price) < 0:
        return jsonify({"error": "Valid price is required"}), 400
    if int(stock_quantity) < 0:
        return jsonify({"error": "Stock quantity cannot be negative"}), 400

    # Auto-generate or accept custom SKU
    custom_sku = data.get("sku", "").strip().upper() or None
    if custom_sku:
        if Product.query.filter_by(sku=custom_sku).first():
            return jsonify({"error": f"SKU '{custom_sku}' already exists"}), 409
        sku = custom_sku
    else:
        sku = generate_unique_sku(category)

    product = Product(
        name=name,
        sku=sku,
        description=description,
        category=category,
        price=float(price),
        stock_quantity=int(stock_quantity),
        low_stock_threshold=int(low_stock_threshold),
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({"product": product.to_dict()}), 201


@products_bp.route("/<string:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id: str):
    product = Product.query.get_or_404(product_id, description="Product not found")
    return jsonify({"product": product.to_dict()}), 200


@products_bp.route("/<string:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id: str):
    product = Product.query.get_or_404(product_id, description="Product not found")
    data = request.get_json(silent=True) or {}

    if "name" in data:
        product.name = data["name"].strip()
    if "description" in data:
        product.description = data["description"].strip() or None
    if "category" in data:
        product.category = data["category"].strip() or None
    if "price" in data:
        if float(data["price"]) < 0:
            return jsonify({"error": "Price cannot be negative"}), 400
        product.price = float(data["price"])
    if "stock_quantity" in data:
        if int(data["stock_quantity"]) < 0:
            return jsonify({"error": "Stock quantity cannot be negative"}), 400
        product.stock_quantity = int(data["stock_quantity"])
    if "low_stock_threshold" in data:
        product.low_stock_threshold = int(data["low_stock_threshold"])
    if "sku" in data:
        new_sku = data["sku"].strip().upper()
        if new_sku != product.sku:
            if Product.query.filter_by(sku=new_sku).first():
                return jsonify({"error": f"SKU '{new_sku}' already exists"}), 409
            product.sku = new_sku

    db.session.commit()
    return jsonify({"product": product.to_dict()}), 200


@products_bp.route("/<string:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id: str):
    product = Product.query.get_or_404(product_id, description="Product not found")

    # Prevent deletion if linked to pending/processing orders
    from ..models.order import Order, OrderItem
    active_orders = (
        db.session.query(OrderItem)
        .join(Order)
        .filter(
            OrderItem.product_id == product_id,
            Order.status.in_(["pending", "processing"]),
        )
        .count()
    )
    if active_orders > 0:
        return jsonify(
            {"error": "Cannot delete product with active (pending/processing) orders"}
        ), 409

    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted successfully"}), 200


@products_bp.route("/categories/list", methods=["GET"])
@jwt_required()
def list_categories():
    """Return distinct product categories."""
    categories = (
        db.session.query(Product.category)
        .filter(Product.category.isnot(None))
        .distinct()
        .all()
    )
    return jsonify({"categories": [c[0] for c in categories if c[0]]}), 200
