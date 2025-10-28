<?php
// Admin stats API: returns counts for dashboard cards.
// - pending_submissions: arts created in last 30 days by non-admin accounts
// - total_users: total users in users table
// - open_reports: artwork_reports with status='new' (0 if table absent)

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../inc/pdo.php';

function respond_json(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

try {
    $pdo = get_pdo();

    // 1) Pending submissions: created in last 30 days, created/last-changed by non-admin user
    $sqlPending = "SELECT COUNT(*) AS c
                   FROM arts a
                   JOIN art_versions v ON a.current_version_id = v.id
                   LEFT JOIN users u ON v.changed_by = u.id
                   WHERE a.deleted_at IS NULL
                     AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                     AND COALESCE(u.role, 'public') <> 'admin'";
    $pending = (int)$pdo->query($sqlPending)->fetchColumn();

    // 2) Total users
    $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

    // 3) Open reports (status=new). If table missing, return 0 gracefully.
    $openReports = 0;
    try {
        $openReports = (int)$pdo->query("SELECT COUNT(*) FROM artwork_reports WHERE status='new'")->fetchColumn();
    } catch (Throwable $e) {
        $openReports = 0; // table not created yet
    }

    respond_json(200, [
        'pending_submissions' => $pending,
        'total_users' => $totalUsers,
        'open_reports' => $openReports,
        // Suggested destinations for each card
        'links' => [
            'pending_submissions' => '/cycle3/arts_list.php?admin_view=pending',
            'total_users' => '/cycle2/Pages/AdminUserManagement.html',
            'open_reports' => '/cycle2/Pages/AdminReportList.html',
        ],
    ]);
} catch (Throwable $e) {
    respond_json(500, ['error' => 'Failed to load admin stats']);
}

?>

