from enum import Enum


class ErrorCode(Enum):
    """Business error codes using tuple structure (code, message)."""

    # General Business Errors (40000+)
    BAD_REQUEST = (40000, "Bad request")
    UNAUTHORIZED = (40100, "Unauthorized")
    FORBIDDEN = (40300, "Forbidden")
    NOT_FOUND = (40400, "Resource not found")

    # User-related errors (10000-10999)
    USER_NOT_FOUND = (10001, "User not found")
    USER_ALREADY_EXISTS = (10002, "User already exists")
    INVALID_CREDENTIALS = (10003, "Invalid credentials")

    # Business logic errors (10100-10199)
    BALANCE_INSUFFICIENT = (10101, "Insufficient balance")
    OPERATION_NOT_ALLOWED = (10102, "Operation not allowed")

    # System errors (50000-50999)
    INTERNAL_ERROR = (50000, "Internal server error")
    DATABASE_ERROR = (50101, "Database operation failed")
    EXTERNAL_SERVICE_ERROR = (50201, "External service error")

    @property
    def code(self) -> int:
        return self.value[0]

    @property
    def message(self) -> str:
        return self.value[1]
