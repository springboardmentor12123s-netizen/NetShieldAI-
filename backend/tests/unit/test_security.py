"""NetShield AI - Unit Tests for Security Utilities."""

from datetime import datetime, timezone
import pytest
from jose import jwt

from app.core.config import get_settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    validate_password_complexity,
)

settings = get_settings()


def test_password_hashing_and_verification():
    """Verify password hashing creates a unique hash and resolves correctly."""
    plain = "SuperComplexPass123!"
    h1 = hash_password(plain)
    h2 = hash_password(plain)

    # Hashes must be unique due to salt
    assert h1 != h2
    assert h1.startswith("$2b$")

    assert verify_password(plain, h1) is True
    assert verify_password(plain, h2) is True
    assert verify_password("WrongPassword!", h1) is False


def test_jwt_access_token_creation_and_decoding():
    """Verify access token parameters, structures, and expiration durations."""
    subject = "user123"
    role = "Analyst"
    permissions = ["traffic:read"]

    token, jti, expires_at = create_access_token(
        subject=subject, role=role, permissions=permissions
    )

    assert isinstance(token, str)
    assert isinstance(jti, str)
    assert expires_at > datetime.now(timezone.utc)

    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["role"] == role
    assert payload["permissions"] == permissions
    assert payload["jti"] == jti
    assert payload["type"] == "access"


def test_jwt_refresh_token_creation_and_decoding():
    """Verify refresh token parameters, structures, and rotation family IDs."""
    subject = "user456"

    token, jti, family_id, expires_at = create_refresh_token(
        subject=subject, family_id="family-1"
    )

    assert isinstance(token, str)
    assert isinstance(jti, str)
    assert family_id == "family-1"
    assert expires_at > datetime.now(timezone.utc)

    payload = decode_token(token)
    assert payload["sub"] == subject
    assert payload["jti"] == jti
    assert payload["family_id"] == "family-1"
    assert payload["type"] == "refresh"


def test_password_complexity_validator():
    """Verify password complexity requirements raise errors for simple keys."""
    # Under length
    errs = validate_password_complexity("Sh0rt!")
    assert "at least" in "".join(errs)

    # Missing uppercase
    errs = validate_password_complexity("no_uppercase_1!")
    assert "uppercase" in "".join(errs)

    # Missing lowercase
    errs = validate_password_complexity("NO_LOWERCASE_1!")
    assert "lowercase" in "".join(errs)

    # Missing digit
    assert "digit" in "".join(validate_password_complexity("NoDigitsHere!!"))

    # Missing special char
    assert "special character" in "".join(validate_password_complexity("NoSpecialChars123"))

    # Valid
    assert len(validate_password_complexity("ValidPassword123!")) == 0
