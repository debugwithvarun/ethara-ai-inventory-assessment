from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models.customer import Customer

customers_bp = Blueprint("customers", __name__)


@customers_bp.route("", methods=["GET"])
@jwt_required()
def list_customers():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search", "").strip()

    query = Customer.query
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Customer.name.ilike(like),
                Customer.email.ilike(like),
                Customer.phone.ilike(like),
            )
        )

    query = query.order_by(Customer.created_at.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        {
            "customers": [c.to_dict() for c in paginated.items],
            "total": paginated.total,
            "pages": paginated.pages,
            "page": paginated.page,
            "per_page": paginated.per_page,
        }
    ), 200


@customers_bp.route("", methods=["POST"])
@jwt_required()
def create_customer():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    phone = data.get("phone", "").strip() or None
    address = data.get("address", "").strip() or None

    if not name:
        return jsonify({"error": "Customer name is required"}), 400
    if not email:
        return jsonify({"error": "Customer email is required"}), 400

    if Customer.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered to another customer"}), 409

    customer = Customer(name=name, email=email, phone=phone, address=address)
    db.session.add(customer)
    db.session.commit()

    return jsonify({"customer": customer.to_dict()}), 201


@customers_bp.route("/<string:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id: str):
    customer = Customer.query.get_or_404(customer_id, description="Customer not found")
    include_orders = request.args.get("include_orders", "false").lower() == "true"
    return jsonify({"customer": customer.to_dict(include_orders=include_orders)}), 200


@customers_bp.route("/<string:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id: str):
    customer = Customer.query.get_or_404(customer_id, description="Customer not found")
    data = request.get_json(silent=True) or {}

    if "name" in data:
        customer.name = data["name"].strip()
    if "email" in data:
        new_email = data["email"].strip().lower()
        if new_email != customer.email:
            if Customer.query.filter_by(email=new_email).first():
                return jsonify({"error": "Email already registered to another customer"}), 409
            customer.email = new_email
    if "phone" in data:
        customer.phone = data["phone"].strip() or None
    if "address" in data:
        customer.address = data["address"].strip() or None

    db.session.commit()
    return jsonify({"customer": customer.to_dict()}), 200


@customers_bp.route("/<string:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id: str):
    customer = Customer.query.get_or_404(customer_id, description="Customer not found")

    # Block delete if customer has orders
    if customer.orders.count() > 0:
        return jsonify(
            {"error": "Cannot delete customer with existing orders"}
        ), 409

    db.session.delete(customer)
    db.session.commit()
    return jsonify({"message": "Customer deleted successfully"}), 200
