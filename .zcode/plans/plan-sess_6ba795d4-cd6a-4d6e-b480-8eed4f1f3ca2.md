## Backend Security Audit Implementation Plan

### Priority 1: Rate Limiting
**Files:** `backend/requirements.txt`, `backend/app/main.py`, `backend/app/api/routes.py`
- Add `slowapi==0.1.9` dependency
- Configure rate limiter with IP-based key function
- Apply decorators: `/verify` (10/min), `/upload` (20/min), `/login` (5/min), read endpoints (60/min)
- **Impact:** None - additive, backward compatible

### Priority 2: Security Headers
**File:** `backend/app/main.py`
- Add middleware to set: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Content-Security-Policy, Cache-Control
- **Impact:** None - additive headers

### Priority 3: File Upload Validation
**Files:** `backend/app/api/routes.py`, `backend/app/services/storage_service.py`, `backend/app/models/constants.py`
- Add MAX_FILE_SIZE constant (10MB)
- Validate file size before processing
- Validate MIME type against allowed list
- Validate file content using magic bytes
- **Impact:** None - rejects malicious uploads

### Priority 4: Input Validation
**File:** `backend/app/schemas/claims.py`
- Add max_length to all text fields (claim_type: 100, description: 5000, etc.)
- Add max_length to objects_detected list (50 items)
- **Impact:** None - additive validation

### Priority 5: Secure Error Handling
**File:** `backend/app/core/auth.py`
- Sanitize error messages to prevent information disclosure
- Log actual errors server-side, return generic messages to client
- **Impact:** None - error messages become less detailed but more secure

### Priority 6: Audit Logging
**Files:** `backend/app/core/logging.py` (new), `backend/app/main.py`, `backend/app/api/routes.py`
- Create structured logging module for security events
- Add request logging middleware
- Log authentication events, failed requests, sensitive operations
- **Impact:** None - additive logging

### Priority 7: Secure Debug Endpoints
**File:** `backend/app/api/routes.py`
- Remove or gate `/debug/auth` and `/debug/token` behind admin auth + DEBUG flag
- **Impact:** None if not used in production

### Additional: CORS Hardening
**File:** `backend/app/main.py`
- Restrict allow_methods to ["GET", "POST", "PUT", "DELETE"]
- Restrict allow_headers to ["Authorization", "Content-Type"]
- **Impact:** None - frontend already uses these methods/headers

### Testing
- Verify rate limits trigger correctly
- Check security headers present in responses
- Test file validation rejects oversized/invalid files
- Verify input length limits enforced
- Confirm error messages don't leak details
- Check audit logs created for security events
- Verify debug endpoints secured

### Rollback
All changes are additive. To rollback: remove decorators, middleware, and validation logic. No database changes required.