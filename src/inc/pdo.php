<?php
// PDO connection helper for MySQL.
// Reads configuration from environment variables and returns a shared PDO instance.

declare(strict_types=1);

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('MYSQL_HOST') ?: '127.0.0.1';
    $db   = getenv('MYSQL_DATABASE') ?: '';
    $user = getenv('MYSQL_USER') ?: '';
    $pass = getenv('MYSQL_PASSWORD') ?: '';
    $port = getenv('MYSQL_PORT') ?: '3306';

    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

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

