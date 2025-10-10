<?php
// Version management API for arts: list versions, get a specific version, and perform rollback.
// Design:
// - Linear version chain: rollback creates a new version (operation_type='rollback').
// - Full snapshot stored per version to simplify recovery.
// - Selective rollback supported by overlaying chosen fields from target snapshot onto current snapshot.

declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=UTF-8');

// CORS configuration (align with arts.php)
$allowOrigin = getenv('CORS_ALLOW_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once dirname(__DIR__) . '/inc/pdo.php';

function respond_v(int $status, $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function get_user_id_v(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function csrf_enforced_v(): bool { return (getenv('CSRF_ENFORCE') === '1'); }

function verify_csrf_for_write_v(): void {
    if (!csrf_enforced_v()) return;
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method !== 'POST') return; // only POST here performs writes
    $tokenHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $tokenBody = '';
    if (isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw ?: 'null', true);
        if (is_array($json) && isset($json['csrf_token'])) $tokenBody = (string)$json['csrf_token'];
    } else {
        $tokenBody = isset($_POST['csrf_token']) ? (string)$_POST['csrf_token'] : '';
    }
    $sent = $tokenHeader ?: $tokenBody;
    $sessionToken = isset($_SESSION['csrf_token']) ? (string)$_SESSION['csrf_token'] : '';
    if ($sent === '' || $sessionToken === '' || !hash_equals($sessionToken, $sent)) {
        respond_v(403, ['error' => 'CSRF validation failed']);
    }
}

function read_json_v(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function get_current_version_row_v(PDO $pdo, int $artId): ?array {
    $sql = "SELECT v.* FROM arts a JOIN art_versions v ON a.current_version_id = v.id WHERE a.id = :id AND a.deleted_at IS NULL";
    $st = $pdo->prepare($sql);
    $st->execute([':id' => $artId]);
    $row = $st->fetch();
    return $row ?: null;
}

function next_version_number_v(PDO $pdo, int $artId): int {
    $st = $pdo->prepare('SELECT COALESCE(MAX(version_number), 0) AS maxv FROM art_versions WHERE art_id = :id');
    $st->execute([':id' => $artId]);
    $max = (int)($st->fetch()['maxv'] ?? 0);
    return $max + 1;
}

function get_version_by_number(PDO $pdo, int $artId, int $versionNo): ?array {
    $st = $pdo->prepare('SELECT * FROM art_versions WHERE art_id = :aid AND version_number = :v');
    $st->execute([':aid' => $artId, ':v' => $versionNo]);
    $row = $st->fetch();
    return $row ?: null;
}

function list_versions(PDO $pdo, int $artId): void {
    // Ensure art exists
    $st = $pdo->prepare('SELECT id FROM arts WHERE id = :id AND deleted_at IS NULL');
    $st->execute([':id' => $artId]);
    if (!$st->fetch()) respond_v(404, ['error' => 'Art not found']);

    // Optional filters
    $allowedOps = ['create','edit','rollback','delete'];
    $op = isset($_GET['op']) ? strtolower(trim((string)$_GET['op'])) : '';
    if ($op !== '' && !in_array($op, $allowedOps, true)) {
        respond_v(400, ['error' => 'Invalid op. Allowed: create, edit, rollback, delete']);
    }
    $changedBy = isset($_GET['changed_by']) ? (int)$_GET['changed_by'] : 0;

    $dateFrom = isset($_GET['date_from']) ? trim((string)$_GET['date_from']) : '';
    $dateTo   = isset($_GET['date_to']) ? trim((string)$_GET['date_to']) : '';
    $dateRe = '/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/';
    if ($dateFrom !== '' && !preg_match($dateRe, $dateFrom)) respond_v(400, ['error' => 'Invalid date_from format']);
    if ($dateTo   !== '' && !preg_match($dateRe, $dateTo))   respond_v(400, ['error' => 'Invalid date_to format']);

    // Optional pagination
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
    $page  = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    if ($limit <= 0) { $limit = 0; } // by default, return all
    $limit = min($limit, 200); // cap
    $offset = $limit > 0 ? ($page - 1) * $limit : 0;

    $sql = 'SELECT id, art_id, version_number, operation_type, changed_by, created_at, changed_fields, rollback_from_version_id, rollback_to_version_id, content_source_version_id 
            FROM art_versions WHERE art_id = :id';
    $params = [':id' => $artId];
    if ($op !== '') { $sql .= ' AND operation_type = :op'; $params[':op'] = $op; }
    if ($changedBy > 0) { $sql .= ' AND changed_by = :cb'; $params[':cb'] = $changedBy; }
    if ($dateFrom !== '') { $sql .= ' AND created_at >= :df'; $params[':df'] = $dateFrom; }
    if ($dateTo !== '')   { $sql .= ' AND created_at <= :dt'; $params[':dt'] = $dateTo; }
    $sql .= ' ORDER BY version_number DESC';
    if ($limit > 0) { $sql .= ' LIMIT :lim OFFSET :off'; }

    $st = $pdo->prepare($sql);
    // Bind integer limit/offset explicitly if used
    foreach ($params as $k => $v) { $st->bindValue($k, $v); }
    if ($limit > 0) {
        $st->bindValue(':lim', $limit, PDO::PARAM_INT);
        $st->bindValue(':off', $offset, PDO::PARAM_INT);
    }
    $st->execute();
    $rows = $st->fetchAll();
    // Optionally decode changed_fields JSON
    foreach ($rows as &$r) {
        if (isset($r['changed_fields']) && is_string($r['changed_fields'])) {
            $decoded = json_decode($r['changed_fields'], true);
            if ($decoded !== null) $r['changed_fields'] = $decoded;
        }
    }
    respond_v(200, $rows);
}

function get_version(PDO $pdo, int $artId, int $versionNo): void {
    $row = get_version_by_number($pdo, $artId, $versionNo);
    if (!$row) respond_v(404, ['error' => 'Version not found']);
    if (isset($row['changed_fields']) && is_string($row['changed_fields'])) {
        $decoded = json_decode($row['changed_fields'], true);
        if ($decoded !== null) $row['changed_fields'] = $decoded;
    }
    respond_v(200, $row);
}

function rollback(PDO $pdo, array $input, ?int $userId): void {
    verify_csrf_for_write_v();

    $artId = isset($input['art_id']) ? (int)$input['art_id'] : 0;
    $targetVersionNo = isset($input['target_version']) ? (int)$input['target_version'] : 0;
    $rollbackType = isset($input['rollback_type']) ? (string)$input['rollback_type'] : 'full';
    $fields = isset($input['fields']) && is_array($input['fields']) ? $input['fields'] : [];
    $reason = isset($input['reason']) ? (string)$input['reason'] : null;
    $expected = isset($input['expected_current_version_id']) ? (int)$input['expected_current_version_id'] : null;

    if ($artId <= 0 || $targetVersionNo <= 0) {
        respond_v(400, ['error' => 'Missing art_id or target_version']);
    }

    $current = get_current_version_row_v($pdo, $artId);
    if (!$current) respond_v(404, ['error' => 'Art not found']);
    if ($expected !== null && (int)$current['id'] !== $expected) {
        respond_v(409, ['error' => 'Version conflict. Please refresh and retry.']);
    }

    $target = get_version_by_number($pdo, $artId, $targetVersionNo);
    if (!$target) respond_v(404, ['error' => 'Target version not found']);

    // Build new snapshot by either copying full target or overlaying selected fields.
    $snapshot = [
        'title' => $current['title'],
        'description' => $current['description'],
        'type' => $current['type'],
        'period' => $current['period'],
        'condition' => $current['condition'],
        'locationNotes' => $current['locationNotes'],
        'lat' => $current['lat'],
        'lng' => $current['lng'],
        'sensitive' => (int)$current['sensitive'],
        'privateLand' => (int)$current['privateLand'],
        'creditKnownArtist' => (int)$current['creditKnownArtist'],
        'image' => $current['image'],
    ];

    if (strtolower($rollbackType) === 'full') {
        // Copy all fields from target
        $snapshot = [
            'title' => $target['title'],
            'description' => $target['description'],
            'type' => $target['type'],
            'period' => $target['period'],
            'condition' => $target['condition'],
            'locationNotes' => $target['locationNotes'],
            'lat' => $target['lat'],
            'lng' => $target['lng'],
            'sensitive' => (int)$target['sensitive'],
            'privateLand' => (int)$target['privateLand'],
            'creditKnownArtist' => (int)$target['creditKnownArtist'],
            'image' => $target['image'],
        ];
    } else {
        // Selective: overlay specified fields from target
        $allowed = array_keys($snapshot);
        foreach ($fields as $f) {
            if (in_array($f, $allowed, true)) {
                $snapshot[$f] = $target[$f];
            }
        }
    }

    // Calculate changed fields compared to current
    $changed = [];
    foreach ($snapshot as $k => $v) {
        if ((string)$v !== (string)$current[$k]) {
            $changed[] = $k;
        }
    }

    // Even if nothing changes (rare: rollback to identical content), still create a rollback version for audit trail.

    $pdo->beginTransaction();
    try {
        $vnum = next_version_number_v($pdo, $artId);
        $st = $pdo->prepare('INSERT INTO `art_versions` (
            `art_id`, `version_number`, `operation_type`, `content_source_version_id`,
            `rollback_from_version_id`, `rollback_to_version_id`,
            `title`, `description`, `type`, `period`, `condition`, `locationNotes`, `lat`, `lng`,
            `sensitive`, `privateLand`, `creditKnownArtist`, `image`,
            `changed_fields`, `change_reason`, `changed_by`
        ) VALUES (
            :art_id, :vnum, \'rollback\', :content_src,
            :rb_from, :rb_to,
            :title, :description, :type, :period, :cond, :loc, :lat, :lng,
            :sensitive, :pl, :cka, :image,
            :changed_fields, :reason, :changed_by
        )');
        $st->execute([
            ':art_id' => $artId,
            ':vnum' => $vnum,
            ':content_src' => $target['id'],
            ':rb_from' => $current['id'],
            ':rb_to' => $target['id'],
            ':title' => $snapshot['title'],
            ':description' => $snapshot['description'],
            ':type' => $snapshot['type'],
            ':period' => $snapshot['period'],
            ':cond' => $snapshot['condition'],
            ':loc' => $snapshot['locationNotes'],
            ':lat' => $snapshot['lat'],
            ':lng' => $snapshot['lng'],
            ':sensitive' => $snapshot['sensitive'],
            ':pl' => $snapshot['privateLand'],
            ':cka' => $snapshot['creditKnownArtist'],
            ':image' => $snapshot['image'],
            ':changed_fields' => json_encode($changed),
            ':reason' => $reason,
            ':changed_by' => $userId,
        ]);
        $newVersionId = (int)$pdo->lastInsertId();

        $st = $pdo->prepare('UPDATE arts SET current_version_id = :vid WHERE id = :id');
        $st->execute([':vid' => $newVersionId, ':id' => $artId]);

        $pdo->commit();
        respond_v(200, ['ok' => true, 'version_id' => $newVersionId, 'version_number' => $vnum, 'changed_fields' => $changed]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond_v(500, ['error' => 'Failed to rollback']);
    }
}

// Entry
$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $artId = isset($_GET['art_id']) ? (int)$_GET['art_id'] : 0;
        if ($artId <= 0) respond_v(400, ['error' => 'Missing art_id']);
        if (isset($_GET['version'])) {
            $ver = (int)$_GET['version'];
            get_version($pdo, $artId, $ver);
        } else {
            list_versions($pdo, $artId);
        }
    } elseif ($method === 'POST') {
        $action = isset($_GET['action']) ? (string)$_GET['action'] : '';
        $input = read_json_v();
        if (empty($input) && !empty($_POST)) $input = $_POST; // allow form submission
        if ($action === 'rollback') {
            $userId = get_user_id_v();
            rollback($pdo, $input, $userId);
        } else {
            respond_v(400, ['error' => 'Unknown or missing action']);
        }
    } else {
        respond_v(405, ['error' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    respond_v(500, ['error' => 'Server error']);
}

?>
