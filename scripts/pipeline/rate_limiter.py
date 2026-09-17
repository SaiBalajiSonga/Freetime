"""
Token-bucket rate limiter for Gemini API calls.

Enforces a hard requests-per-minute (RPM) ceiling so concurrent workers
can't accidentally blow past free-tier limits, even when individual
requests complete quickly.

Usage:
    limiter = RateLimiter(rpm=10)
    async with limiter:
        # make API call
        ...
"""
from __future__ import annotations

import asyncio
import time


class RateLimiter:
    """Async-compatible token-bucket rate limiter.

    Parameters
    ----------
    rpm : int
        Maximum requests per minute.
    concurrency : int
        Maximum number of requests in flight at the same time.
    """

    def __init__(self, rpm: int = 10, concurrency: int = 3) -> None:
        self._rpm = rpm
        self._interval = 60.0 / rpm          # minimum seconds between requests
        self._semaphore = asyncio.Semaphore(concurrency)
        self._lock = asyncio.Lock()
        self._last_request_time: float = 0.0  # monotonic timestamp

    async def acquire(self) -> None:
        """Wait until both the RPM budget and a concurrency slot are free."""
        await self._semaphore.acquire()
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_request_time
            if elapsed < self._interval:
                await asyncio.sleep(self._interval - elapsed)
            self._last_request_time = time.monotonic()

    def release(self) -> None:
        """Return the concurrency slot."""
        self._semaphore.release()

    async def __aenter__(self) -> "RateLimiter":
        await self.acquire()
        return self

    async def __aexit__(self, *exc: object) -> None:
        self.release()
