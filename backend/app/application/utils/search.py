"""Normalize search strings for case- and accent-insensitive matching."""
import unicodedata


def normalize_search(value: str | None) -> str:
    """Lowercase and remove accents (NFD, strip combining marks)."""
    if not value or not value.strip():
        return ""
    s = unicodedata.normalize("NFD", value.strip())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.lower()
