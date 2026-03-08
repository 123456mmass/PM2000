from fastapi import Request
from functools import wraps

def rate_limit(func):
    """Decorator for rate limiting endpoints (DISABLED)."""
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        return await func(request, *args, **kwargs)
    return wrapper

def ai_rate_limit(func):
    """Decorator for AI-specific rate limiting (DISABLED)."""
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        return await func(request, *args, **kwargs)
    return wrapper
