<?php
// Minimal MySQL connectivity checker for local testing.
// Reads connection settings from environment variables and attempts a PDO connection.

declare(strict_types=1);

$host = getenv('MYSQL_HOST') ?: '127.0.0.1';
$db   = getenv('MYSQL_DATABASE') ?: 'cityarts';
$user = getenv('MYSQL_USER') ?: 'root';
$pass = getenv('MYSQL_PASSWORD') ?: '';
$port = getenv('MYSQL_PORT') ?: '3306';

echo "Host: $host, DB: $db, User: $user, Port: $port\n";

try {
    if (!extension_loaded('pdo_mysql')) {
        throw new RuntimeException('pdo_mysql extension not loaded');
    }

    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    echo "Connection successful!\n";
    $stmt = $pdo->query('SELECT VERSION() AS version');
    if ($stmt) {
        $row = $stmt->fetch();
        if ($row && isset($row['version'])) {
            echo "MySQL Version: " . $row['version'] . "\n";
        }
    }
} catch (Throwable $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

?>

