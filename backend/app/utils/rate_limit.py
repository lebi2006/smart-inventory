import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300

# In-memory per-process store: resets on restart and isn't shared across
# multiple worker processes. Good enough for this app's single-process deploy;
# swap for a shared store (e.g. Redis) if it's ever run with multiple workers.
_attempts = defaultdict(list)


def check_login_rate_limit(request: Request):
    key = request.client.host if request.client else "unknown"
    now = time.time()
    recent = [t for t in _attempts[key] if now - t < WINDOW_SECONDS]
    _attempts[key] = recent
    if len(recent) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )


def record_failed_login(request: Request):
    key = request.client.host if request.client else "unknown"
    _attempts[key].append(time.time())


def clear_login_attempts(request: Request):
    key = request.client.host if request.client else "unknown"
    _attempts.pop(key, None)
