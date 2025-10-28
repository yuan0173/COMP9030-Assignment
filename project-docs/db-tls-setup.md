# MySQL TLS/RSA Setup for PHP PDO (Production-Ready)

This guide explains how to connect PHP (PDO MySQL) to MySQL 8+ using modern authentication safely. It enables TLS (recommended) or RSA public key exchange when using `caching_sha2_password`.

The application reads optional SSL settings from environment variables. No behavior changes unless you provide these variables.

## Environment variables

- `MYSQL_HOST` (default `127.0.0.1`)
- `MYSQL_PORT` (default `3306`)
- `MYSQL_DATABASE` (default `cityarts`)
- `MYSQL_USER` (default `root`)
- `MYSQL_PASSWORD` (default empty)

Optional security settings (provide absolute paths):

- `MYSQL_SSL_CA` — path to MySQL server CA (enables TLS)
- `MYSQL_SSL_CERT` — optional client certificate (TLS)
- `MYSQL_SSL_KEY` — optional client private key (TLS)
- `MYSQL_SERVER_PUBLIC_KEY` — MySQL server RSA public key path (RSA exchange without TLS)

Notes:
- If `MYSQL_SSL_CA` is set, TLS is enabled and takes precedence. `MYSQL_SERVER_PUBLIC_KEY` is ignored in that case.
- Without `MYSQL_SSL_CA`, if `MYSQL_SERVER_PUBLIC_KEY` is set, RSA exchange is enabled (works with `caching_sha2_password` without TLS).

## Recommended: TLS with `caching_sha2_password`

1) Verify server SSL availability

```sql
SHOW VARIABLES LIKE 'have_ssl';
SHOW VARIABLES LIKE 'ssl_%';
```

Typical Homebrew MySQL 8 paths (macOS): `/opt/homebrew/var/mysql/ca.pem`, `server-cert.pem`, `server-key.pem`.

2) Ensure MySQL is configured with certificates (my.cnf):

```
[mysqld]
ssl_ca=/path/to/ca.pem
ssl_cert=/path/to/server-cert.pem
ssl_key=/path/to/server-key.pem
# Optional hardening:
# require_secure_transport=ON
```

Restart MySQL after changes.

3) Create an app user requiring TLS (example):

```sql
CREATE USER 'webapp'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'StrongPass!234' REQUIRE SSL;
GRANT SELECT,INSERT,UPDATE,DELETE ON cityarts.* TO 'webapp'@'localhost';
FLUSH PRIVILEGES;
```

4) Configure the app `.env`:

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=cityarts
MYSQL_USER=webapp
MYSQL_PASSWORD=StrongPass!234
MYSQL_SSL_CA=/opt/homebrew/var/mysql/ca.pem
# Optional client certs (usually not required):
# MYSQL_SSL_CERT=/path/to/client-cert.pem
# MYSQL_SSL_KEY=/path/to/client-key.pem
```

5) Verify locally

```
php -r 'require "src/inc/pdo.php"; $pdo=get_pdo(); echo $pdo->query("SELECT 1")->fetchColumn(), PHP_EOL;'
```

Then start the built-in server and test endpoints:

```
php -S localhost:8000 -t src
curl -s http://localhost:8000/cycle3/arts_list.php
```

## Alternative: RSA public key (no TLS)

If TLS is not available, enable RSA exchange:

Server (my.cnf):

```
[mysqld]
# Ensure RSA keys exist (paths below are examples)
caching_sha2_password_public_key_path=/path/to/public_key.pem
caching_sha2_password_private_key_path=/path/to/private_key.pem
# require_secure_transport=OFF
```

App `.env`:

```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=cityarts
MYSQL_USER=webapp
MYSQL_PASSWORD=StrongPass!234
MYSQL_SERVER_PUBLIC_KEY=/path/to/public_key.pem
```

Verify with the same CLI/HTTP steps.

## Development fallback (temporarily)

For local development only, you may create a user with `mysql_native_password`:

```sql
CREATE USER 'webapp'@'localhost' IDENTIFIED WITH mysql_native_password BY 'StrongPass!234';
GRANT SELECT,INSERT,UPDATE,DELETE ON cityarts.* TO 'webapp'@'localhost';
FLUSH PRIVILEGES;
```

This avoids TLS/RSA setup but is less secure. Prefer TLS in production.

## Troubleshooting

- `SQLSTATE[HY000] [2002]` — Check host/port or local firewall; on macOS try `127.0.0.1` instead of `localhost`.
- `Access denied` — Verify user plugin and password; confirm grants for the target database.
- `Database connection failed` from app — Check `.env` placement (project root or `src/.env`) and restart the PHP built-in server.
- TLS errors — Ensure `MYSQL_SSL_CA` points to a readable file and matches server CA; do not disable verification in production.

