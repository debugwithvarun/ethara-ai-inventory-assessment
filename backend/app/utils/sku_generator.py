import random
import string
import re
from ..extensions import db
from ..models.product import Product


def _generate_random_suffix(length: int = 6) -> str:
    """Generate a random alphanumeric suffix (uppercase)."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def _category_prefix(category: str | None) -> str:
    """Derive a short prefix from the category name."""
    if not category:
        return "PROD"
    # Keep only letters, uppercase, max 5 chars
    cleaned = re.sub(r"[^A-Za-z]", "", category).upper()
    return cleaned[:5] if cleaned else "PROD"


def generate_unique_sku(category: str | None = None) -> str:
    """
    Generate a unique SKU in format: {PREFIX}-{RANDOM6}
    Retries up to 10 times to ensure uniqueness.
    """
    prefix = _category_prefix(category)
    for _ in range(10):
        candidate = f"{prefix}-{_generate_random_suffix()}"
        exists = db.session.query(Product.id).filter_by(sku=candidate).first()
        if not exists:
            return candidate
    # Fallback with longer suffix to virtually guarantee uniqueness
    return f"{prefix}-{_generate_random_suffix(8)}"
