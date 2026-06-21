"""
backend/utils/validators.py
Server-side input validation utilities for WealthOS auth endpoints.
"""

import re
import html

# ── Constants ──────────────────────────────────────────────────────────────
EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
)
DISPLAY_NAME_REGEX = re.compile(r"^[a-zA-Z\s'\-]+$")
STRONG_PASSWORD_REGEX = re.compile(r'^(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])')

MAX_EMAIL_LENGTH = 254
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
MIN_DISPLAY_NAME_LENGTH = 2
MAX_DISPLAY_NAME_LENGTH = 50


def sanitize_input(value: str) -> str:
    """
    Escape HTML special chars and strip leading/trailing whitespace.
    Returns empty string for non-string input.
    """
    if not isinstance(value, str):
        return ''
    return html.escape(value.strip())


def validate_email(email: str) -> bool:
    """
    Returns True if email is a valid RFC 5322-ish address within length limits.
    """
    if not email or not isinstance(email, str):
        return False
    trimmed = email.strip().lower()
    return bool(EMAIL_REGEX.match(trimmed)) and len(trimmed) <= MAX_EMAIL_LENGTH


def validate_password_signin(password: str) -> tuple[bool, str | None]:
    """
    Sign-in password validation: only checks presence.
    Returns (is_valid, error_message).
    """
    if not password or not isinstance(password, str):
        return False, 'Password is required.'
    return True, None


def validate_password_signup(password: str) -> tuple[bool, str | None]:
    """
    Sign-up password validation: length + strength requirements.
    Returns (is_valid, error_message).
    """
    if not password or not isinstance(password, str):
        return False, 'Password is required.'
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f'Minimum {MIN_PASSWORD_LENGTH} characters.'
    if len(password) > MAX_PASSWORD_LENGTH:
        return False, 'Password is too long.'
    if not re.search(r'[A-Z]', password):
        return False, 'Include an uppercase letter.'
    if not re.search(r'[0-9]', password):
        return False, 'Include a number.'
    if not re.search(r'[@$!%*?&]', password):
        return False, 'Include a special character.'
    return True, None


def validate_display_name(name: str) -> tuple[bool, str | None]:
    """
    Display name validation: length, character restrictions.
    Returns (is_valid, error_message).
    """
    if not name or not isinstance(name, str):
        return False, 'Name is required.'
    trimmed = name.strip()
    if len(trimmed) < MIN_DISPLAY_NAME_LENGTH:
        return False, f'Name must be at least {MIN_DISPLAY_NAME_LENGTH} characters.'
    if len(trimmed) > MAX_DISPLAY_NAME_LENGTH:
        return False, 'Name is too long.'
    if not DISPLAY_NAME_REGEX.match(trimmed):
        return False, "Name can only contain letters, spaces, hyphens, and apostrophes."
    return True, None


def validate_login_body(body: dict) -> dict:
    """
    Validate POST /auth/login payload.
    Returns dict of field errors, empty if valid.
    """
    errors = {}
    email = body.get('email', '')
    password = body.get('password', '')

    if not validate_email(email):
        errors['email'] = 'Email is required.' if not email else 'Enter a valid email address.'

    valid, msg = validate_password_signin(password)
    if not valid:
        errors['password'] = msg

    return errors


def validate_register_body(body: dict) -> dict:
    """
    Validate POST /auth/register payload.
    Returns dict of field errors, empty if valid.
    """
    errors = {}
    email = body.get('email', '')
    password = body.get('password', '')
    confirm_password = body.get('confirmPassword', '')
    display_name = body.get('displayName', '')

    if not validate_email(email):
        errors['email'] = 'Email is required.' if not email else 'Enter a valid email address.'

    valid, msg = validate_password_signup(password)
    if not valid:
        errors['password'] = msg
    elif password != confirm_password:
        errors['confirmPassword'] = 'Passwords do not match.'

    valid, msg = validate_display_name(display_name)
    if not valid:
        errors['displayName'] = msg

    return errors


def validate_forgot_password_body(body: dict) -> dict:
    """
    Validate POST /auth/forgot-password payload.
    Returns dict of field errors, empty if valid.
    """
    errors = {}
    email = body.get('email', '')
    if not validate_email(email):
        errors['email'] = 'Email is required.' if not email else 'Enter a valid email address.'
    return errors
