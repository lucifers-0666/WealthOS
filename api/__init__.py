"""WealthOS API Package Wrapper."""
import importlib.util
from pathlib import Path

_api_py = Path(__file__).resolve().parent.parent / "api.py"
if _api_py.exists():
    _spec = importlib.util.spec_from_file_location("wealthos_api_root", _api_py)
    _mod = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    app = getattr(_mod, "app", None)
