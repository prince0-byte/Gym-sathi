from datetime import datetime, date, timedelta
from typing import Optional

def parse_date(s: str) -> Optional[date]:
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except Exception:
        return None

def days_until_expiry(expiry_str: str) -> Optional[int]:
    d = parse_date(expiry_str)
    return (d - datetime.today().date()).days if d else None

def is_expired(expiry_str: str) -> bool:
    days = days_until_expiry(expiry_str)
    return days is not None and days <= 0

def today_str() -> str:
    return datetime.today().strftime("%Y-%m-%d")

def date_offset_str(days: int) -> str:
    return (datetime.today() + timedelta(days=days)).strftime("%Y-%m-%d")

def indian_to_iso(s: str) -> Optional[str]:
    try:
        return datetime.strptime(s, "%d-%m-%Y").strftime("%Y-%m-%d")
    except Exception:
        return None
