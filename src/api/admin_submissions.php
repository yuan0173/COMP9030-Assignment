<?php
// Admin submissions API: list and update moderation status for arts

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../inc/pdo.php';

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function require_admin(): void {
    $role = isset($_SESSION['role']) ? (string)$_SESSION['role'] : '';
    if ($role === 'user') $role = 'public';
    if ($role !== 'admin') {
        respond(403, ['error' => 'Admin only']);
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pdo = get_pdo();

if ($method === 'GET') {
    // List submissions by moderation_status
    $status = isset($_GET['status']) ? strtolower(trim((string)$_GET['status'])) : 'pending';
    if (!in_array($status, ['pending','approved','rejected','all'], true)) $status = 'pending';
    $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
    if ($limit > 200) $limit = 200;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    $where = ' WHERE a.deleted_at IS NULL ';
    $params = [];
    if ($status !== 'all') {
        $where .= ' AND COALESCE(a.moderation_status, \"pending\") = :st';
        $params[':st'] = $status;
    }
    if ($q !== '') {
        $where .= ' AND (v.title LIKE :q OR v.description LIKE :q OR u.username LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    $countSql = 'SELECT COUNT(*) FROM arts a JOIN art_versions v ON a.current_version_id = v.id LEFT JOIN users u ON v.changed_by = u.id ' . $where;
    $st = $pdo->prepare($countSql);
    $st->execute($params);
    $total = (int)$st->fetchColumn();

    $sql = 'SELECT a.id, a.created_at, COALESCE(a.moderation_status, \"pending\") AS status, v.title, v.description, v.image, u.username AS submitter
            FROM arts a JOIN art_versions v ON a.current_version_id = v.id LEFT JOIN users u ON v.changed_by = u.id '
            . $where . ' ORDER BY a.created_at DESC LIMIT :lim OFFSET :off';
    $st = $pdo->prepare($sql);
    foreach ($params as $k => $v) { $st->bindValue($k, $v); }
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->bindValue(':off', $offset, PDO::PARAM_INT);
    $st->execute();
    $rows = $st->fetchAll() ?: [];
    respond(200, ['total' => $total, 'items' => $rows]);
}

if ($method === 'PUT') {
    require_admin();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) respond(400, ['error' => 'Missing id']);
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: 'null', true) ?: [];
    $status = isset($data['status']) ? strtolower(trim((string)$data['status'])) : '';
    if (!in_array($status, ['pending','approved','rejected'], true)) respond(400, ['error' => 'Invalid status']);

    $st = $pdo->prepare('UPDATE arts SET moderation_status = :st, moderated_at = NOW(), moderated_by = :uid WHERE id = :id');
    $uid = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $st->execute([':st' => $status, ':uid' => $uid, ':id' => $id]);
    respond(200, ['ok' => true]);
}

respond(405, ['error' => 'Method not allowed']);

?>

