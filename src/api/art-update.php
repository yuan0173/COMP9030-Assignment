<?php
// Form-friendly wrapper for updating an art item using method override.
// Usage: POST form fields to this endpoint with at least 'id' and fields to update.
// Internally sets _method=PUT and delegates to arts.php.

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=UTF-8');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$_POST['_method'] = 'PUT';

require __DIR__ . '/arts.php';
// arts.php will handle the request and exit.

?>

