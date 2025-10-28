<?php
// Users API (read-only list for admin UI)

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

try {
    $pdo = get_pdo();

    if ($method === 'GET') {
        $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
        $role = isset($_GET['role']) ? trim((string)$_GET['role']) : '';
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
        if ($limit > 200) $limit = 200;
        $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

        $where = ' WHERE 1=1 ';
        $params = [];
        if ($q !== '') {
            $where .= ' AND (username LIKE :q OR email LIKE :q)';
            $params[':q'] = '%' . $q . '%';
        }
        if ($role !== '' && in_array($role, ['public','artist','admin'], true)) {
            $where .= ' AND role = :role';
            $params[':role'] = $role;
        }

        $countSql = 'SELECT COUNT(*) FROM users ' . $where;
        $st = $pdo->prepare($countSql);
        $st->execute($params);
        $total = (int)$st->fetchColumn();

        // Include status column if exists; fall back to 'active' for old schemas
        $statusColumn = 'status';
        try {
            $pdo->query('SELECT status FROM users LIMIT 1');
        } catch (Throwable $e) {
            $statusColumn = "'active' AS status";
        }

        $sql = 'SELECT id, username, email, role, ' . $statusColumn . ', created_at FROM users ' . $where . ' ORDER BY created_at DESC LIMIT :lim OFFSET :off';
        $st = $pdo->prepare($sql);
        foreach ($params as $k => $v) { $st->bindValue($k, $v); }
        $st->bindValue(':lim', $limit, PDO::PARAM_INT);
        $st->bindValue(':off', $offset, PDO::PARAM_INT);
        $st->execute();
        $rows = $st->fetchAll() ?: [];
        respond(200, ['total' => $total, 'users' => $rows]);
    }

    if ($method === 'PUT') {
        require_admin();
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if ($id <= 0) respond(400, ['error' => 'Missing id']);
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: 'null', true) ?: [];
        $newRole = isset($data['role']) ? strtolower(trim((string)$data['role'])) : '';
        $newStatus = isset($data['status']) ? strtolower(trim((string)$data['status'])) : '';
        if ($newRole && !in_array($newRole, ['public','artist','admin'], true)) respond(400, ['error' => 'Invalid role']);
        if ($newStatus && !in_array($newStatus, ['active','suspended'], true)) respond(400, ['error' => 'Invalid status']);
        if (!$newRole && !$newStatus) respond(400, ['error' => 'No valid fields to update']);

        // Prevent demoting last admin
        if ($newRole && $newRole !== 'admin') {
            $st = $pdo->prepare('SELECT role FROM users WHERE id = :id');
            $st->execute([':id' => $id]);
            $cur = $st->fetch();
            if ($cur && (string)$cur['role'] === 'admin') {
                $count = (int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='admin'")->fetchColumn();
                if ($count <= 1) {
                    respond(409, ['error' => 'Cannot demote the last admin']);
                }
            }
        }

        $sets = [];
        $params = [':id' => $id];
        if ($newRole) { $sets[] = 'role = :role'; $params[':role'] = $newRole; }
        // update status only if column exists
        if ($newStatus) {
            try { $pdo->query('SELECT status FROM users LIMIT 1'); $sets[] = 'status = :status'; $params[':status'] = $newStatus; } catch (Throwable $e) { /* ignore */ }
        }
        if (empty($sets)) respond(400, ['error' => 'No applicable fields to update']);
        $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = :id';
        $st = $pdo->prepare($sql);
        $st->execute($params);
        respond(200, ['ok' => true]);
    }

    respond(405, ['error' => 'Method not allowed']);
} catch (Throwable $e) {
    respond(500, ['error' => 'Server error']);
}

?>
