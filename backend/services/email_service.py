"""
backend/services/email_service.py
Email service for WealthOS — password reset and transactional emails.

Authentication is handled entirely through Supabase Auth's built-in email
system. This module provides a supplementary email service for custom
transactional emails if/when needed beyond what Supabase natively provides.

Environment variables required:
    EMAIL_HOST      — SMTP host (e.g. smtp.resend.com)
    EMAIL_PORT      — SMTP port (e.g. 587)
    EMAIL_USER      — SMTP username (e.g. 'resend')
    EMAIL_PASS      — SMTP password / API key
    EMAIL_FROM      — Sender address (e.g. no-reply@yourdomain.com)
    FRONTEND_URL    — Frontend base URL for link generation
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.resend.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USER = os.environ.get('EMAIL_USER', 'resend')
EMAIL_PASS = os.environ.get('EMAIL_PASS', '')
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'no-reply@wealthos.app')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

# ── Dark-theme email styles ─────────────────────────────────────────────────
_BASE_STYLES = """
  body { margin: 0; padding: 0; background: #0B1F12; font-family: 'Inter', Arial, sans-serif; }
  .wrapper { max-width: 520px; margin: 0 auto; padding: 40px 24px; }
  .header { border-bottom: 1px solid rgba(212, 160, 23, 0.20); padding-bottom: 24px; margin-bottom: 32px; }
  .brand { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #D4A017; font-weight: 600; }
  .headline { font-size: 22px; font-weight: 700; color: #F9F3E6; margin: 16px 0 8px; }
  .body-text { font-size: 14px; color: rgba(249, 243, 230, 0.70); line-height: 1.7; margin: 0 0 24px; }
  .cta-btn {
    display: inline-block; padding: 14px 28px; background: #D4A017;
    color: #1C1508 !important; text-decoration: none; font-weight: 700;
    font-size: 13px; letter-spacing: 0.16em; border-radius: 6px; text-transform: uppercase;
  }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(212, 160, 23, 0.10); }
  .footer-text { font-size: 11px; color: rgba(249, 243, 230, 0.28); line-height: 1.6; }
  .expiry-note { margin-top: 20px; font-size: 11px; color: rgba(249, 243, 230, 0.40); }
"""


def _build_reset_email(reset_link: str) -> tuple[str, str]:
    """Return (plain_text, html) for a password reset email."""
    plain = (
        f"ARCA — Password Reset\n\n"
        f"You requested a password reset for your Arca account.\n\n"
        f"Click the link below to reset your password (expires in 1 hour):\n"
        f"{reset_link}\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"— ANTIGRAVITY · PRIVATE TERMINAL"
    )
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset Your Password — Arca</title>
<style>{_BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="brand">Antigravity · Private Terminal</span>
    </div>
    <h1 class="headline">Reset Your Password</h1>
    <p class="body-text">
      You requested a password reset for your Arca account.
      Click the button below to set a new password.
    </p>
    <a href="{reset_link}" class="cta-btn">Reset Password →</a>
    <p class="expiry-note">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
    <div class="footer">
      <p class="footer-text">
        256-bit encrypted · SOC 2 aligned · No data sold<br>
        Antigravity · Private Wealth Terminal · 2026
      </p>
    </div>
  </div>
</body>
</html>"""
    return plain, html


def _build_welcome_email(display_name: str) -> tuple[str, str]:
    """Return (plain_text, html) for a welcome/signup confirmation email."""
    dashboard_link = f"{FRONTEND_URL}/dashboard"
    plain = (
        f"Welcome to Arca, {display_name}.\n\n"
        f"Your private financial command environment is ready.\n\n"
        f"Access your dashboard: {dashboard_link}\n\n"
        f"— ANTIGRAVITY · PRIVATE TERMINAL"
    )
    html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to Arca</title>
<style>{_BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="brand">Antigravity · Private Terminal</span>
    </div>
    <h1 class="headline">Welcome, {display_name}.</h1>
    <p class="body-text">
      Your private financial command environment is ready.
      Portfolio intelligence, AI analysis, and market context —
      all in one place.
    </p>
    <a href="{dashboard_link}" class="cta-btn">Enter Dashboard →</a>
    <div class="footer">
      <p class="footer-text">
        256-bit encrypted · SOC 2 aligned · No data sold<br>
        Antigravity · Private Wealth Terminal · 2026
      </p>
    </div>
  </div>
</body>
</html>"""
    return plain, html


def _send(to_email: str, subject: str, plain: str, html: str) -> bool:
    """
    Send an email via SMTP. Returns True on success, False on failure.
    """
    if not EMAIL_PASS:
        logger.warning('[EmailService] EMAIL_PASS not set — skipping email send.')
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = to_email
    msg.attach(MIMEText(plain, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_FROM, [to_email], msg.as_string())
        return True
    except smtplib.SMTPException as exc:
        logger.error('[EmailService] SMTP error: %s', exc)
        return False
    except OSError as exc:
        logger.error('[EmailService] Connection error: %s', exc)
        return False


def send_password_reset(to_email: str, reset_link: str) -> bool:
    """
    Send a password reset email.
    NOTE: When using Supabase's built-in resetPasswordForEmail(),
    this function is NOT needed — Supabase handles it natively.
    Use this only if you need a fully custom email template via SMTP.
    """
    plain, html = _build_reset_email(reset_link)
    return _send(to_email, 'Reset your Arca password', plain, html)


def send_welcome(to_email: str, display_name: str) -> bool:
    """
    Send a welcome email after successful registration.
    """
    plain, html = _build_welcome_email(display_name)
    return _send(to_email, 'Welcome to Arca — Your private terminal is ready', plain, html)
