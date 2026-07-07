import random
import string
from ..extensions import db
from ..models.order import Order


def generate_order_number() -> str:
    """Generate a unique order number in format: ORD-YYYYMMDD-XXXXX"""
    from datetime import datetime
    date_str = datetime.utcnow().strftime("%Y%m%d")
    for _ in range(10):
        suffix = "".join(random.choices(string.digits, k=5))
        candidate = f"ORD-{date_str}-{suffix}"
        exists = db.session.query(Order.id).filter_by(order_number=candidate).first()
        if not exists:
            return candidate
    return f"ORD-{date_str}-{random.randint(10000, 99999)}"
