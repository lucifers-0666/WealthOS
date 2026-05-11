"""Project-wide startup shims for local development.

This module is imported automatically by Python when it is on the import path.
We use it to smooth over dependency mismatches without changing application code.

IMPORTANT: This file must never raise an exception or import Streamlit.
Any failure here silently corrupts the ASGI stack and causes HTTP 500 on all routes.
"""

from __future__ import annotations

try:
    import starlette.middleware.gzip as _gzip

    # DEFAULT_EXCLUDED_CONTENT_TYPES was removed in Starlette 0.37.0.
    # Patch it back in so older Streamlit versions that reference it don't crash.
    if not hasattr(_gzip, "DEFAULT_EXCLUDED_CONTENT_TYPES"):
        _gzip.DEFAULT_EXCLUDED_CONTENT_TYPES = (
            "text/event-stream",
            "application/x-ndjson",
        )
except ImportError:
    # Starlette not installed yet — skip silently, pip install will fix it.
    pass
except Exception as _e:  # noqa: BLE001
    # Log but DO NOT re-raise. A crash here kills the ASGI server before
    # Streamlit can register its routes, causing every request to return 500.
    import sys
    print(f"[sitecustomize] WARNING: gzip shim failed ({_e!r}) — continuing.",
          file=sys.stderr)
