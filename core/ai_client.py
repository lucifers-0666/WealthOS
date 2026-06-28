import time
import logging
from collections import deque
import google.generativeai as genai

logger = logging.getLogger("wealthos-ai-client")

class RateLimiter:
    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period_seconds = period_seconds
        self.calls = deque()

    def can_proceed(self) -> bool:
        now = time.time()
        while self.calls and now - self.calls[0] > self.period_seconds:
            self.calls.popleft()
        return len(self.calls) < self.max_calls

    def add_call(self):
        self.calls.append(time.time())

_global_rate_limiter = RateLimiter(max_calls=45, period_seconds=60)


class GeminiClient:
    FALLBACK_MESSAGE = (
        "The AI advisor is temporarily unavailable. "
        "Your portfolio data is intact. Please try again in a moment."
    )

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model)

    def ask(self, prompt: str, context: str = "") -> str:
        """
        Sends prompt to Gemini. Returns response text.
        On any error, returns a safe fallback message — never raises.
        Implements:
          · 3 retries with 2s exponential backoff on 429/503 errors
          · 10 second timeout per request
          · If all retries fail: return FALLBACK_MESSAGE
        """
        if not _global_rate_limiter.can_proceed():
            logger.warning("Rate limit guard triggered — skipping API call")
            return self.FALLBACK_MESSAGE
        
        full_prompt = f"{context}\n\n{prompt}" if context else prompt

        retries = 3
        backoff = 2
        for attempt in range(retries):
            try:
                _global_rate_limiter.add_call()
                # `request_options={"timeout": 10}` passes timeout to httpx inside google-generativeai
                response = self.model.generate_content(
                    full_prompt,
                    request_options={"timeout": 10}
                )
                if hasattr(response, 'text'):
                    return response.text
                return self.FALLBACK_MESSAGE
            except Exception as e:
                err_str = str(e).lower()
                is_retryable = ("429" in err_str or "503" in err_str or "timeout" in err_str or "quota" in err_str or "deadline" in err_str)
                logger.error(f"Gemini API error (attempt {attempt + 1}): {e}")
                
                if attempt < retries - 1 and is_retryable:
                    time.sleep(backoff)
                    backoff *= 2
                else:
                    return self.FALLBACK_MESSAGE
                    
        return self.FALLBACK_MESSAGE
