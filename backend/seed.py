"""
Seed script — creates default admin user and sample data.
Run with: python seed.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.utils.sku_generator import generate_unique_sku


def seed():
    app = create_app("development")
    with app.app_context():
        # ── Admin user ────────────────────────────────────────────
        if not User.query.filter_by(email="admin@example.com").first():
            admin = User(username="admin", email="admin@example.com", role="admin")
            admin.set_password("Admin@123")
            db.session.add(admin)
            print("✓ Admin user created: admin@example.com / Admin@123")
        else:
            print("✓ Admin user already exists")

        # ── Sample Products ────────────────────────────────────────
        sample_products = [
            {"name": "Wireless Mouse", "category": "Electronics", "price": 29.99, "stock_quantity": 150, "description": "Ergonomic wireless mouse with 2.4GHz connectivity"},
            {"name": "Mechanical Keyboard", "category": "Electronics", "price": 89.99, "stock_quantity": 75, "description": "Tactile mechanical keyboard with RGB backlight"},
            {"name": "USB-C Hub", "category": "Electronics", "price": 45.00, "stock_quantity": 200, "description": "7-in-1 USB-C hub with HDMI and card reader"},
            {"name": "Monitor Stand", "category": "Office", "price": 35.50, "stock_quantity": 60, "description": "Adjustable aluminium monitor stand"},
            {"name": "Desk Lamp", "category": "Office", "price": 22.00, "stock_quantity": 8, "low_stock_threshold": 10, "description": "LED desk lamp with adjustable brightness"},
            {"name": "Webcam HD", "category": "Electronics", "price": 69.99, "stock_quantity": 5, "low_stock_threshold": 10, "description": "1080p HD webcam with built-in microphone"},
            {"name": "Notebook Set", "category": "Stationery", "price": 12.99, "stock_quantity": 300, "description": "Pack of 3 premium A5 notebooks"},
            {"name": "Office Chair", "category": "Furniture", "price": 249.00, "stock_quantity": 20, "description": "Ergonomic office chair with lumbar support"},
        ]

        for pd in sample_products:
            if not Product.query.filter_by(name=pd["name"]).first():
                sku = generate_unique_sku(pd.get("category"))
                product = Product(
                    name=pd["name"],
                    sku=sku,
                    category=pd.get("category"),
                    price=pd["price"],
                    stock_quantity=pd["stock_quantity"],
                    low_stock_threshold=pd.get("low_stock_threshold", 10),
                    description=pd.get("description"),
                )
                db.session.add(product)
                print(f"  ✓ Product: {pd['name']} [{sku}]")

        # ── Sample Customers ───────────────────────────────────────
        sample_customers = [
            {"name": "Alice Johnson", "email": "alice@example.com", "phone": "+1-555-0101", "address": "123 Maple St, New York, NY"},
            {"name": "Bob Williams", "email": "bob@example.com", "phone": "+1-555-0102", "address": "456 Oak Ave, Los Angeles, CA"},
            {"name": "Carol Smith", "email": "carol@example.com", "phone": "+1-555-0103", "address": "789 Pine Rd, Chicago, IL"},
            {"name": "David Brown", "email": "david@example.com", "phone": "+1-555-0104", "address": "321 Elm St, Houston, TX"},
            {"name": "Eva Martinez", "email": "eva@example.com", "phone": "+1-555-0105", "address": "654 Cedar Ln, Phoenix, AZ"},
        ]

        for cd in sample_customers:
            if not Customer.query.filter_by(email=cd["email"]).first():
                customer = Customer(**cd)
                db.session.add(customer)
                print(f"  ✓ Customer: {cd['name']}")

        db.session.commit()
        print("\n✅ Seeding complete!")


if __name__ == "__main__":
    seed()
