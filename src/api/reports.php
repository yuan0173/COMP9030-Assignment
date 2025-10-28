<?php
// Reports API for Cycle 3
// Handles problem reports for artworks with database persistence

declare(strict_types=1);

session_start();

require_once __DIR__ . '/../inc/pdo.php';

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json; charset=UTF-8');

function respond(int $code, array $data): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(200, ['status' => 'ok']);
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    handleGetReports();
} elseif ($method === 'POST') {
    handleCreateReport();
} elseif ($method === 'PUT') {
    handleUpdateReport();
} else {
    respond(405, ['error' => 'Method not allowed']);
}

function handleGetReports(): never {
    try {
        $pdo = get_pdo();

        // Get query parameters for filtering
        $status = $_GET['status'] ?? '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

        // Build query with optional status filter
        $whereClause = '';
        $params = [];

        if ($status && in_array($status, ['new', 'reviewed', 'resolved', 'dismissed'])) {
            $whereClause = 'WHERE r.status = ?';
            $params[] = $status;
        }

        // Get reports with artwork information
        $sql = "
            SELECT
                r.id,
                r.art_id,
                r.reason,
                r.note,
                r.reported_at,
                r.status,
                r.admin_notes,
                r.resolved_at,
                r.resolved_by,
                r.reporter_ip,
                a.id as artwork_id,
                v.title as artwork_title,
                v.type as artwork_type
            FROM artwork_reports r
            LEFT JOIN arts a ON r.art_id = a.id
            LEFT JOIN art_versions v ON a.current_version_id = v.id
            $whereClause
            ORDER BY r.reported_at DESC
            LIMIT ? OFFSET ?
        ";

        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count for pagination
        $countSql = "SELECT COUNT(*) as total FROM artwork_reports r $whereClause";
        $countParams = array_slice($params, 0, -2); // Remove limit and offset
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($countParams);
        $total = (int)$countStmt->fetch()['total'];

        respond(200, [
            'reports' => $reports,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);

    } catch (PDOException $e) {
        error_log("Get reports database error: " . $e->getMessage());
        respond(500, ['error' => 'Database error. Please try again later.']);
    } catch (Throwable $e) {
        error_log("Get reports error: " . $e->getMessage());
        respond(500, ['error' => 'Server error. Please try again later.']);
    }
}

function handleUpdateReport(): never {
    try {
        // Read JSON input
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data) {
            respond(400, ['error' => 'Invalid JSON input']);
        }

        // Get report ID from URL or data
        $reportId = null;
        if (isset($_GET['id'])) {
            $reportId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
        } elseif (isset($data['id'])) {
            $reportId = filter_var($data['id'], FILTER_VALIDATE_INT);
        }

        if (!$reportId || $reportId <= 0) {
            respond(400, ['error' => 'Invalid report ID']);
        }

        // Validate status if provided
        if (isset($data['status'])) {
            $allowedStatuses = ['new', 'reviewed', 'resolved', 'dismissed'];
            if (!in_array($data['status'], $allowedStatuses)) {
                respond(400, ['error' => 'Invalid status']);
            }
        }

        $pdo = get_pdo();

        // Check if report exists
        $stmt = $pdo->prepare("SELECT id FROM artwork_reports WHERE id = ?");
        $stmt->execute([$reportId]);
        if (!$stmt->fetch()) {
            respond(404, ['error' => 'Report not found']);
        }

        // Build update query
        $updateFields = [];
        $params = [];

        if (isset($data['status'])) {
            $updateFields[] = 'status = ?';
            $params[] = $data['status'];

            // Set resolved_at if status is resolved
            if ($data['status'] === 'resolved') {
                $updateFields[] = 'resolved_at = NOW()';
                // TODO: Add resolved_by when user system is implemented
            }
        }

        if (isset($data['admin_notes'])) {
            $updateFields[] = 'admin_notes = ?';
            $params[] = trim($data['admin_notes']);
        }

        if (empty($updateFields)) {
            respond(400, ['error' => 'No valid fields to update']);
        }

        $params[] = $reportId;
        $sql = "UPDATE artwork_reports SET " . implode(', ', $updateFields) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Log the update
        error_log("Report updated: ID $reportId, fields: " . implode(', ', $updateFields));

        respond(200, [
            'success' => true,
            'message' => 'Report updated successfully',
            'report_id' => $reportId
        ]);

    } catch (PDOException $e) {
        error_log("Update report database error: " . $e->getMessage());
        respond(500, ['error' => 'Database error. Please try again later.']);
    } catch (Throwable $e) {
        error_log("Update report error: " . $e->getMessage());
        respond(500, ['error' => 'Server error. Please try again later.']);
    }
}

function handleCreateReport(): never {
    try {
        // Read JSON input
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!$data) {
            respond(400, ['error' => 'Invalid JSON input']);
        }

        // Validate required fields
        if (empty($data['art_id'])) {
            respond(400, ['error' => 'Missing artwork ID']);
        }

        if (empty($data['reason'])) {
            respond(400, ['error' => 'Missing report reason']);
        }

        // Validate art_id is numeric
        $artId = filter_var($data['art_id'], FILTER_VALIDATE_INT);
        if ($artId === false || $artId <= 0) {
            respond(400, ['error' => 'Invalid artwork ID']);
        }

        // Validate reason is one of allowed values
        $allowedReasons = [
            'inappropriate_content',
            'copyright_violation',
            'cultural_sensitivity',
            'incorrect_information',
            'spam_or_fake',
            'privacy_violation',
            'other'
        ];
        if (!in_array($data['reason'], $allowedReasons)) {
            respond(400, ['error' => 'Invalid report reason']);
        }

        // Create database table if it doesn't exist
        $pdo = get_pdo();
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS artwork_reports (
                id INT AUTO_INCREMENT PRIMARY KEY,
                art_id INT NOT NULL,
                reason ENUM('inappropriate_content', 'copyright_violation', 'cultural_sensitivity', 'incorrect_information', 'spam_or_fake', 'privacy_violation', 'other') NOT NULL,
                note TEXT,
                reporter_ip VARCHAR(45),
                reporter_user_agent TEXT,
                reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('new', 'reviewed', 'resolved', 'dismissed') DEFAULT 'new',
                admin_notes TEXT,
                resolved_at TIMESTAMP NULL,
                resolved_by INT NULL,
                INDEX idx_art_id (art_id),
                INDEX idx_reported_at (reported_at),
                INDEX idx_status (status),
                FOREIGN KEY (art_id) REFERENCES arts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Check if artwork exists
        $stmt = $pdo->prepare("SELECT id FROM arts WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$artId]);
        if (!$stmt->fetch()) {
            respond(404, ['error' => 'Artwork not found']);
        }

        // Insert report
        $stmt = $pdo->prepare("
            INSERT INTO artwork_reports
            (art_id, reason, note, reporter_ip, reporter_user_agent)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $artId,
            $data['reason'],
            trim($data['note'] ?? ''),
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

        $reportId = (int)$pdo->lastInsertId();

        // Log report submission
        error_log("Artwork report submitted: ID $reportId for artwork $artId, reason: " . $data['reason']);

        respond(200, [
            'success' => true,
            'message' => 'Thank you for your report. We will review it and take appropriate action if necessary.',
            'report_id' => $reportId
        ]);

    } catch (PDOException $e) {
        error_log("Report submission database error: " . $e->getMessage());
        respond(500, ['error' => 'Database error. Please try again later.']);
    } catch (Throwable $e) {
        error_log("Report submission error: " . $e->getMessage());
        respond(500, ['error' => 'Server error. Please try again later.']);
    }
}
?>