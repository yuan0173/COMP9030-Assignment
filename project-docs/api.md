# API Documentation

## Database Schema Location
- The canonical schema file is located at `src/sql-exports/schema.sql`.
- Use this file for creating, resetting, and exporting the database structure.

## Notes
- All API endpoints should assume the database structure defined by the canonical schema above.
- Keep this reference consistent across scripts and documentation.

## Version Management API

- GET `/api/art_versions.php?art_id={id}`: List versions for an art item.
  - Optional filters:
    - `op`: `create|edit|rollback|delete`
    - `changed_by`: user id (integer)
    - `date_from`, `date_to`: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`
    - `limit` (<=200), `page` (>=1)
- GET `/api/art_versions.php?art_id={id}&version={n}`: Get a specific version snapshot.
- POST `/api/art_versions.php?action=rollback`: Perform rollback.
  - JSON body: `{ "art_id": 1, "target_version": 3, "rollback_type": "full|selective", "fields": ["title"], "reason": "...", "expected_current_version_id": 12 }`

## Auth API

- GET `/api/auth.php?action=session`: Get current session and CSRF token.
- POST `/api/auth.php?action=register` `{ email, password }`: Register and sign-in.
- POST `/api/auth.php?action=login` `{ email, password }`: Sign-in and return CSRF token.
- POST `/api/auth.php?action=logout` `{ csrf_token? }`: Sign-out (CSRF enforced if `CSRF_ENFORCE=1`).

Notes:
- Uses session cookies; set `CORS_ALLOW_ORIGIN` to your site in production and enable credentials.
- Passwords stored with `password_hash`; do not store plaintext.

## Geocoding Proxy API

- GET `/api/geo.php?action=search&q=...&limit=5`: OSM Nominatim search (JSON).
- GET `/api/geo.php?action=reverse&lat=...&lon=...`: Reverse geocoding.

Notes:
- Only the official Nominatim host is called; set `NOMINATIM_USER_AGENT`.
- Replace any client-side calls to third-party proxies with this endpoint.
