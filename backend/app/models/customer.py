import uuid
from datetime import datetime
from ..extensions import db


class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    orders = db.relationship("Order", back_populates="customer", lazy="dynamic")

    @property
    def total_orders(self) -> int:
        return self.orders.count()

    def to_dict(self, include_orders: bool = False) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "total_orders": self.total_orders,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_orders:
            data["orders"] = [o.to_dict() for o in self.orders.order_by("created_at desc").limit(10)]
        return data

    def __repr__(self) -> str:
        return f"<Customer {self.email}>"
