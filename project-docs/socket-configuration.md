# MySQL Socket Configuration for COMP9030 Cycle 3

## Overview

This document describes the Unix socket configuration option added to the database connection system to support environments where TCP connections are restricted (e.g., sandbox environments).

## Configuration Options

The application supports both TCP and Unix socket connections to MySQL:

### TCP Connection (Default)
- Uses `host:port` connection
- Supports TLS encryption
- Suitable for production environments

### Unix Socket Connection (Alternative)
- Uses Unix socket file
- Bypasses network restrictions
- Suitable for local development and restricted environments

## Environment Variables

### Socket Configuration
```bash
MYSQL_UNIX_SOCKET=/tmp/mysql.sock    # Path to MySQL socket file
```

### Standard Configuration (TCP)
```bash
MYSQL_HOST=127.0.0.1                 # MySQL host
MYSQL_PORT=3306                      # MySQL port
MYSQL_DATABASE=cityarts              # Database name
MYSQL_USER=root                      # Database user
MYSQL_PASSWORD=                      # Database password
```

### TLS Configuration (TCP only)
```bash
MYSQL_SSL_CA=/path/to/ca.pem         # SSL Certificate Authority
MYSQL_SSL_CERT=/path/to/cert.pem     # Client certificate (optional)
MYSQL_SSL_KEY=/path/to/key.pem       # Client private key (optional)
MYSQL_SERVER_PUBLIC_KEY=/path/to/public_key.pem  # RSA public key (fallback)
```

## Connection Priority

The application uses the following connection priority:

1. **Unix Socket** (if `MYSQL_UNIX_SOCKET` is set)
   - DSN: `mysql:unix_socket=/path/to/socket;dbname=database`
   - No TLS options applied (not applicable for socket connections)

2. **TCP Connection** (if socket not configured)
   - DSN: `mysql:host=hostname;port=port;dbname=database`
   - TLS options applied if configured

## Setup Examples

### Example 1: Socket Connection for Development
```bash
# Find MySQL socket path
mysql -u root -e "SHOW VARIABLES LIKE 'socket';"

# Set environment variable
export MYSQL_UNIX_SOCKET=/tmp/mysql.sock

# Start PHP server
php -S localhost:8000 -t src
```

### Example 2: .env File Configuration
Create `.env` file in project root:
```bash
# Socket configuration (preferred in restricted environments)
MYSQL_UNIX_SOCKET=/tmp/mysql.sock
MYSQL_DATABASE=cityarts
MYSQL_USER=root
MYSQL_PASSWORD=

# Alternative TCP configuration
# MYSQL_HOST=127.0.0.1
# MYSQL_PORT=3306
# MYSQL_DATABASE=cityarts
# MYSQL_USER=webapp
# MYSQL_PASSWORD=StrongPass!234
# MYSQL_SSL_CA=/opt/homebrew/var/mysql/ca.pem
```

## Verification Steps

### 1. Check MySQL Socket Availability
```bash
# Find socket path
mysql -u root -e "SHOW VARIABLES LIKE 'socket';"

# Test socket connection
mysql -S /tmp/mysql.sock -u root -e "SELECT 1;"
```

### 2. Test PHP Socket Connection
```bash
# Test with environment variable
MYSQL_UNIX_SOCKET=/tmp/mysql.sock php -r 'require "src/inc/pdo.php"; $pdo=get_pdo(); var_dump($pdo->query("SELECT 1")->fetchColumn());'
```

### 3. Verify Application Pages
```bash
# Start server with socket configuration
export MYSQL_UNIX_SOCKET=/tmp/mysql.sock
php -S localhost:8000 -t src

# Test pages
curl -s http://localhost:8000/cycle3/arts_list.php | head -20
curl -s http://localhost:8000/cycle3/featured.php | head -20
```

## Troubleshooting

### Common Issues

1. **Socket file not found**
   - Verify MySQL is running: `brew services list | grep mysql`
   - Check socket path: `mysql -u root -e "SHOW VARIABLES LIKE 'socket';"`

2. **Permission denied**
   - Ensure PHP process can read socket file: `ls -la /tmp/mysql.sock`
   - Socket should be readable by current user

3. **Authentication failed**
   - Verify user exists and has correct permissions
   - Reset user password if needed:
     ```sql
     ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '';
     FLUSH PRIVILEGES;
     ```

4. **Mixed authentication methods**
   - Socket connections don't use TLS
   - Ensure user authentication is compatible with socket connections

### Testing Matrix

| Method | Host | Expected Result |
|--------|------|-----------------|
| MySQL CLI + Socket | `mysql -S /tmp/mysql.sock` | ✅ Success |
| PHP CLI + Socket | `MYSQL_UNIX_SOCKET=/tmp/mysql.sock` | ✅ Success |
| MySQL CLI + TCP | `mysql -h 127.0.0.1` | ✅ Success |
| PHP CLI + TCP | `MYSQL_HOST=127.0.0.1` | ❌ May fail in sandbox |

## Technical Implementation

The socket support is implemented in `src/inc/pdo.php` with minimal changes:

1. **Environment variable detection**: `MYSQL_UNIX_SOCKET`
2. **DSN selection**: Socket DSN vs TCP DSN
3. **TLS exclusion**: TLS options only applied for TCP connections
4. **Backward compatibility**: Default behavior unchanged

This ensures production deployments continue using TCP+TLS while development environments can use socket connections when needed.