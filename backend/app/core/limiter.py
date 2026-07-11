"""
Shared rate-limiter instance.

Lives in its own module so that both ``main.py`` (which attaches it
to the app) and ``api/routes.py`` (which applies per-endpoint
decorators) can import it without creating a circular dependency.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
