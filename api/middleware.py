import time
import sys
import os
import uuid
import traceback
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

# Add the project root to python path for clean imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.utils import setup_logger

# Initialize API logger
logger = setup_logger("api_middleware", "logs/api.log")

class LoggingAndExceptionMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Measures and logs request execution time with unique request IDs.
    2. Logs structured request details (method, path, status code).
    3. Gracefully handles unhandled exceptions by logging them and returning a sanitized 500 JSON.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        request_id = str(uuid.uuid4())[:8]
        path = request.url.path
        method = request.method
        
        logger.info(f"[{request_id}] Incoming request: {method} {path}")
        
        try:
            response = await call_next(request)
            
            process_time = (time.time() - start_time) * 1000 # in ms
            status_code = response.status_code
            
            # Use success symbol for normal codes, warning for client errors, failure for server errors
            if status_code < 400:
                symbol = "✔"
            elif status_code < 500:
                symbol = "⚠"
            else:
                symbol = "✖"
                
            logger.info(f"[{request_id}] {symbol} Request completed: {method} {path} - Status: {status_code} - Duration: {process_time:.2f}ms")
            
            # Inject duration and request ID headers
            response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            process_time = (time.time() - start_time) * 1000
            logger.error(f"[{request_id}] ✖ Request failed: {method} {path} after {process_time:.2f}ms. Error: {str(e)}")
            
            # Log full traceback internally on server side
            traceback.print_exc()
            
            # Sanitize error detail returned to public caller
            env_mode = os.getenv("ENVIRONMENT", "development").lower()
            safe_message = "An internal server error occurred. Please verify transaction payload inputs."
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "request_id": request_id,
                    "message": safe_message,
                    "detail": str(e) if env_mode != "production" else "Internal system error."
                }
            )

