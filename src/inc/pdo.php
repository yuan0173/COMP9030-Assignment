<?php
// PDO connection helper for MySQL.
// Reads configuration from environment variables and returns a shared PDO instance.

declare(strict_types=1);

/**
 * Load environment variables from a .env file if present.
 * Search order: project root (../../.env), then web root (../.env).
 * This is a minimal parser: KEY=VALUE, '#' starts a comment, quotes are stripped.
 */
function load_dotenv_if_exists(): void {
    static $loaded = false;
    if ($loaded) {
        return;
    }

    $candidates = [
        __DIR__ . '/../../.env', // project root when docroot is src/
        __DIR__ . '/../.env',    // docroot (src/.env)
    ];

    foreach ($candidates as $path) {
        if (!is_file($path) || !is_readable($path)) {
            continue;
        }
        $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            continue;
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                continue;
            }
            $eqPos = strpos($line, '=');
            $key = trim(substr($line, 0, $eqPos));
            $val = trim(substr($line, $eqPos + 1));
            // Strip surrounding quotes and extra spaces
            $val = trim($val, "\"' ");
            if ($key !== '') {
                putenv($key . '=' . $val);
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
        break; // stop after first found .env
    }

    $loaded = true;
}

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    // Load .env once (if exists), then read values via getenv with sane defaults.
    load_dotenv_if_exists();

    $host = getenv('MYSQL_HOST') ?: '127.0.0.1';
    $db   = getenv('MYSQL_DATABASE') ?: 'cityarts';
    $user = getenv('MYSQL_USER') ?: 'root';
    $pass = getenv('MYSQL_PASSWORD') ?: '';
    $port = getenv('MYSQL_PORT') ?: '3306';
    $socket = getenv('MYSQL_UNIX_SOCKET') ?: '';

    // Build DSN: prefer Unix socket if specified, otherwise use TCP (host/port).
    // Unix socket is useful in environments where TCP connections are restricted.
    if ($socket !== '') {
        $dsn = "mysql:unix_socket={$socket};dbname={$db};charset=utf8mb4";
    } else {
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    }
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    // Optional TLS/RSA configuration for MySQL 8+ authentication compatibility.
    // Note: TLS and RSA options are only applicable for TCP connections, not Unix sockets.
    if ($socket === '') {
        // Prefer TLS (provide CA; optionally client cert/key). As a fallback without TLS,
        // you can set server public key for RSA exchange with caching_sha2_password.
        $sslCa   = getenv('MYSQL_SSL_CA') ?: '';
        $sslCert = getenv('MYSQL_SSL_CERT') ?: '';
        $sslKey  = getenv('MYSQL_SSL_KEY') ?: '';
        $srvPub  = getenv('MYSQL_SERVER_PUBLIC_KEY') ?: '';

        // Enable TLS if CA is provided.
        if ($sslCa !== '' && defined('PDO::MYSQL_ATTR_SSL_CA')) {
            $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCa;
            if ($sslCert !== '' && defined('PDO::MYSQL_ATTR_SSL_CERT')) {
                $options[PDO::MYSQL_ATTR_SSL_CERT] = $sslCert;
            }
            if ($sslKey !== '' && defined('PDO::MYSQL_ATTR_SSL_KEY')) {
                $options[PDO::MYSQL_ATTR_SSL_KEY] = $sslKey;
            }
        } elseif ($srvPub !== '' && defined('PDO::MYSQL_ATTR_SERVER_PUBLIC_KEY')) {
            // If no TLS, allow RSA public key exchange for caching_sha2_password.
            $options[PDO::MYSQL_ATTR_SERVER_PUBLIC_KEY] = $srvPub;
        }
    }

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        return $pdo;
    } catch (Throwable $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'error' => 'Database connection failed',
        ]);
        exit;
    }
}

?>
