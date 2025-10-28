<?php
// Contact form API for Cycle 3
// Handles contact form submissions with database persistence

declare(strict_types=1);

session_start();

require_once __DIR__ . '/../inc/pdo.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json; charset=UTF-8');

function respond(int $code, array $data): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function e(string $s): string {
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(200, ['status' => 'ok']);
}

// Only handle POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

try {
    // Read JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        respond(400, ['error' => 'Invalid JSON input']);
    }

    // Validate required fields
    $required = ['name', 'email', 'subject', 'message'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            respond(400, ['error' => "Missing required field: $field"]);
        }
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        respond(400, ['error' => 'Invalid email format']);
    }

    // Validate subject is one of allowed values
    $allowedSubjects = ['general', 'collaboration', 'submission', 'technical', 'cultural', 'other'];
    if (!in_array($data['subject'], $allowedSubjects)) {
        respond(400, ['error' => 'Invalid subject']);
    }

    // Create database table if it doesn't exist
    $pdo = get_pdo();
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject ENUM('general', 'collaboration', 'submission', 'technical', 'cultural', 'other') NOT NULL,
            message TEXT NOT NULL,
            newsletter BOOLEAN DEFAULT FALSE,
            ip_address VARCHAR(45),
            user_agent TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('new', 'read', 'responded', 'closed') DEFAULT 'new',
            INDEX idx_submitted_at (submitted_at),
            INDEX idx_email (email),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Insert contact submission
    $stmt = $pdo->prepare("
        INSERT INTO contact_submissions
        (name, email, subject, message, newsletter, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        trim($data['name']),
        trim($data['email']),
        $data['subject'],
        trim($data['message']),
        !empty($data['newsletter']) ? 1 : 0,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);

    $submissionId = (int)$pdo->lastInsertId();

    // Attempt to send notification email (best-effort; ignore failures in dev)
    try {
        $to = getenv('ADMIN_EMAIL') ?: 'admin@localhost';
        $subject = 'IAA Contact: ' . $data['subject'] . ' from ' . $data['name'];
        $body = "From: " . $data['name'] . " <" . $data['email'] . ">\n" .
                "Subject: " . $data['subject'] . "\n\n" .
                $data['message'];
        $headers = 'From: no-reply@localhost';
        if (function_exists('mail')) { @mail($to, $subject, $body, $headers); }
    } catch (Throwable $e) { /* ignore */ }

    // Log successful submission
    error_log("Contact form submission: ID $submissionId from " . $data['email']);

    respond(200, [
        'success' => true,
        'message' => 'Thank you for your message! We\'ll get back to you within 2-3 business days.',
        'submission_id' => $submissionId
    ]);

} catch (PDOException $e) {
    error_log("Contact form database error: " . $e->getMessage());
    respond(500, ['error' => 'Database error. Please try again later.']);
} catch (Throwable $e) {
    error_log("Contact form error: " . $e->getMessage());
    respond(500, ['error' => 'Server error. Please try again later.']);
}
?>
