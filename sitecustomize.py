"""Project-wide startup shims for local development.

This module is imported automatically by Python when it is on the import path.
We use it to smooth over dependency mismatches in the local dev environment
without changing application code.
"""

from __future__ import annotations

try:
    import starlette.middleware.gzip as _gzip

    if not hasattr(_gzip, "DEFAULT_EXCLUDED_CONTENT_TYPES"):
        _gzip.DEFAULT_EXCLUDED_CONTENT_TYPES = (
            "text/event-stream",
            "application/x-ndjson",
        )
except Exception:
    # Best-effort shim only; if Starlette isn't available yet, the app can still
    # continue and fail with a more direct import error later.
    pass