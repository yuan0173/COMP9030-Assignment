<?php
// REST-style CRUD API for arts, backed by MySQL via PDO and version snapshots.
// Security notes:
// - Uses prepared statements (PDO) to prevent SQL injection.
// - Supports CSRF token enforcement (optional during local dev via env toggle).
// - CORS allowlist can be configured via environment variable.

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=UTF-8');

// CORS configuration (configure allowlist for production)
$allowOrigin = getenv('CORS_ALLOW_ORIGIN') ?: '*'; // For development use '*'. Restrict in production.
header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once dirname(__DIR__) . '/inc/pdo.php';

function respond(int $status, $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function get_user_id(): ?int {
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

function csrf_enforced(): bool {
    // Enable by setting CSRF_ENFORCE=1 in the environment.
    return (getenv('CSRF_ENFORCE') === '1');
}

function verify_csrf_for_write(): void {
    if (!csrf_enforced()) return; // Disabled in local/dev by default
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['POST','PUT','DELETE'], true)) return;

    $tokenHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $tokenBody = '';
    if (isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $json = json_decode($raw ?: 'null', true);
        if (is_array($json) && isset($json['csrf_token'])) {
            $tokenBody = (string)$json['csrf_token'];
        }
    } else {
        $tokenBody = isset($_POST['csrf_token']) ? (string)$_POST['csrf_token'] : '';
    }

    $sent = $tokenHeader ?: $tokenBody;
    $sessionToken = isset($_SESSION['csrf_token']) ? (string)$_SESSION['csrf_token'] : '';
    if ($sent === '' || $sessionToken === '' || !hash_equals($sessionToken, $sent)) {
        respond(403, ['error' => 'CSRF validation failed']);
    }
}

function read_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function validate_art_payload(array $data, bool $creating = true): array {
    // Required fields on create
    $required = ['title','type','period','condition','description'];
    if ($creating) {
        foreach ($required as $k) {
            if (!isset($data[$k]) || trim((string)$data[$k]) === '') {
                respond(400, ['error' => 'Missing field: ' . $k]);
            }
        }
    }
    // Basic normalization
    $out = [];
    $fields = ['title','description','type','period','condition','locationNotes','image'];
    foreach ($fields as $k) {
        if (array_key_exists($k, $data)) {
            $v = (string)$data[$k];
            if ($k === 'title' && strlen($v) > 255) respond(400, ['error' => 'Title too long']);
            if ($k === 'type' && strlen($v) > 100) respond(400, ['error' => 'Type too long']);
            if ($k === 'period' && strlen($v) > 100) respond(400, ['error' => 'Period too long']);
            if ($k === 'condition' && strlen($v) > 100) respond(400, ['error' => 'Condition too long']);
            if ($k === 'locationNotes' && strlen($v) > 500) respond(400, ['error' => 'Location notes too long']);
            if ($k === 'image') {
                // Allow base64 data URIs, otherwise enforce short path/URL (<=500 chars)
                if (!is_base64_image($v) && strlen($v) > 500) {
                    respond(400, ['error' => 'Image path too long']);
                }
            }
            $out[$k] = $v;
        }
    }
    foreach (['lat','lng'] as $k) {
        if (array_key_exists($k, $data) && $data[$k] !== null && $data[$k] !== '') {
            $num = (float)$data[$k];
            if ($k === 'lat' && ($num < -90 || $num > 90)) respond(400, ['error' => 'Invalid latitude']);
            if ($k === 'lng' && ($num < -180 || $num > 180)) respond(400, ['error' => 'Invalid longitude']);
            $out[$k] = $num;
        } else {
            $out[$k] = null;
        }
    }
    foreach (['sensitive','privateLand','creditKnownArtist'] as $k) {
        if (array_key_exists($k, $data)) {
            $out[$k] = !empty($data[$k]) ? 1 : 0;
        }
    }
    return $out;
}

function is_base64_image(string $val): bool {
    // data:[<mediatype>][;base64],<data>
    if (stripos($val, 'data:image/') !== 0) return false;
    $comma = strpos($val, ',');
    if ($comma === false) return false;
    $meta = substr($val, 5, $comma - 5); // skip 'data:'
    return (stripos($meta, ';base64') !== false);
}

function save_base64_image(int $artId, string $val): string {
    // Enforce allowed types and size <= 2MB
    $comma = strpos($val, ',');
    if ($comma === false) {
        respond(400, ['error' => 'Invalid image']);
    }
    $header = substr($val, 5, $comma - 5); // between 'data:' and ','
    $dataB64 = substr($val, $comma + 1);
    $mime = strtolower(trim(explode(';', $header)[0] ?? ''));
    $ext = null;
    if ($mime === 'image/png') $ext = 'png';
    elseif ($mime === 'image/jpeg' || $mime === 'image/jpg') $ext = 'jpg';
    elseif ($mime === 'image/webp') $ext = 'webp';
    else respond(400, ['error' => 'Unsupported image type']);

    $bin = base64_decode($dataB64, true);
    if ($bin === false) respond(400, ['error' => 'Invalid image data']);
    if (strlen($bin) > 2 * 1024 * 1024) respond(400, ['error' => 'Image too large']);

    $baseDir = dirname(__DIR__) . '/uploads/arts/' . $artId;
    if (!is_dir($baseDir)) {
        if (!mkdir($baseDir, 0775, true) && !is_dir($baseDir)) {
            respond(500, ['error' => 'Failed to prepare upload directory']);
        }
    }
    $name = 'img_' . gmdate('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $path = $baseDir . '/' . $name;
    if (file_put_contents($path, $bin) === false) {
        respond(500, ['error' => 'Failed to save image']);
    }
    // Return web path
    return '/uploads/arts/' . $artId . '/' . $name;
}

function get_current_version_row(PDO $pdo, int $artId): ?array {
    $sql = "SELECT v.* FROM arts a JOIN art_versions v ON a.current_version_id = v.id WHERE a.id = :id AND a.deleted_at IS NULL";
    $st = $pdo->prepare($sql);
    $st->execute([':id' => $artId]);
    $row = $st->fetch();
    return $row ?: null;
}

function next_version_number(PDO $pdo, int $artId): int {
    $st = $pdo->prepare('SELECT COALESCE(MAX(version_number), 0) AS maxv FROM art_versions WHERE art_id = :id');
    $st->execute([':id' => $artId]);
    $max = (int)($st->fetch()['maxv'] ?? 0);
    return $max + 1;
}

function create_art_and_version(PDO $pdo, array $payload, ?int $userId): array {
    $pdo->beginTransaction();
    try {
        // 1) Create the art shell (use defaults; schema has no created_by column)
        $st = $pdo->prepare('INSERT INTO arts (current_version_id) VALUES (NULL)');
        $st->execute();
        $artId = (int)$pdo->lastInsertId();

        // 2) Create the first version (v1)
        $vnum = 1;
        // Process image if it's base64
        if (isset($payload['image']) && is_string($payload['image']) && is_base64_image($payload['image'])) {
            $payload['image'] = save_base64_image($artId, $payload['image']);
        }
        $st = $pdo->prepare('INSERT INTO `art_versions` (
            `art_id`, `version_number`, `operation_type`, `content_source_version_id`,
            `title`, `description`, `type`, `period`, `condition`, `locationNotes`, `lat`, `lng`,
            `sensitive`, `privateLand`, `creditKnownArtist`, `image`,
            `changed_fields`, `change_reason`, `changed_by`
        ) VALUES (
            :art_id, :vnum, \'create\', NULL,
            :title, :description, :type, :period, :cond, :loc, :lat, :lng,
            :sensitive, :pl, :cka, :image,
            :changed_fields, :reason, :changed_by
        )');
        $changed = array_keys($payload);
        $st->execute([
            ':art_id' => $artId,
            ':vnum' => $vnum,
            ':title' => $payload['title'],
            ':description' => $payload['description'],
            ':type' => $payload['type'],
            ':period' => $payload['period'],
            ':cond' => $payload['condition'],
            ':loc' => $payload['locationNotes'] ?? null,
            ':lat' => $payload['lat'] ?? null,
            ':lng' => $payload['lng'] ?? null,
            ':sensitive' => $payload['sensitive'] ?? 0,
            ':pl' => $payload['privateLand'] ?? 0,
            ':cka' => $payload['creditKnownArtist'] ?? 0,
            ':image' => $payload['image'] ?? null,
            ':changed_fields' => json_encode($changed),
            ':reason' => $payload['change_reason'] ?? null,
            ':changed_by' => $userId,
        ]);
        $versionId = (int)$pdo->lastInsertId();

        // 3) Point current_version_id to v1
        $st = $pdo->prepare('UPDATE arts SET current_version_id = :vid WHERE id = :id');
        $st->execute([':vid' => $versionId, ':id' => $artId]);

        $pdo->commit();
        return ['id' => $artId, 'version_id' => $versionId, 'version_number' => $vnum];
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(500, ['error' => 'Failed to create art', 'detail' => $e->getMessage()]);
    }
}

function create_new_version_from_current(PDO $pdo, int $artId, array $newFields, ?int $userId, ?int $expectedCurrentVersionId = null): array {
    // Load current version
    $current = get_current_version_row($pdo, $artId);
    if (!$current) respond(404, ['error' => 'Art not found']);
    if ($expectedCurrentVersionId !== null && (int)$current['id'] !== $expectedCurrentVersionId) {
        respond(409, ['error' => 'Version conflict. Please refresh and retry.']);
    }

    // Build next snapshot by overlaying fields
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
    foreach ($newFields as $k => $v) {
        if (array_key_exists($k, $snapshot)) {
            // Process base64 image to file before overlay
            if ($k === 'image' && is_string($v) && is_base64_image($v)) {
                $snapshot[$k] = save_base64_image($artId, $v);
            } else {
                $snapshot[$k] = $v;
            }
        }
    }

    // Determine changed fields
    $changed = [];
    foreach ($snapshot as $k => $v) {
        if ((string)$v !== (string)$current[$k]) {
            $changed[] = $k;
        }
    }
    if (empty($changed)) {
        return ['no_change' => true, 'current_version_id' => (int)$current['id']];
    }

    $pdo->beginTransaction();
    try {
        $vnum = next_version_number($pdo, $artId);
        $st = $pdo->prepare('INSERT INTO `art_versions` (
            `art_id`, `version_number`, `operation_type`, `content_source_version_id`,
            `title`, `description`, `type`, `period`, `condition`, `locationNotes`, `lat`, `lng`,
            `sensitive`, `privateLand`, `creditKnownArtist`, `image`,
            `changed_fields`, `change_reason`, `changed_by`
        ) VALUES (
            :art_id, :vnum, \'edit\', :content_src,
            :title, :description, :type, :period, :cond, :loc, :lat, :lng,
            :sensitive, :pl, :cka, :image,
            :changed_fields, :reason, :changed_by
        )');
        $st->execute([
            ':art_id' => $artId,
            ':vnum' => $vnum,
            ':content_src' => $current['id'],
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
            ':reason' => $newFields['change_reason'] ?? null,
            ':changed_by' => $userId,
        ]);
        $newVersionId = (int)$pdo->lastInsertId();

        $st = $pdo->prepare('UPDATE arts SET current_version_id = :vid WHERE id = :id');
        $st->execute([':vid' => $newVersionId, ':id' => $artId]);

        $pdo->commit();
        return ['version_id' => $newVersionId, 'version_number' => $vnum];
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(500, ['error' => 'Failed to update art', 'detail' => $e->getMessage()]);
    }
}

function soft_delete_art(PDO $pdo, int $artId, ?int $userId, ?int $expectedCurrentVersionId = null): void {
    $current = get_current_version_row($pdo, $artId);
    if (!$current) respond(404, ['error' => 'Art not found']);
    if ($expectedCurrentVersionId !== null && (int)$current['id'] !== $expectedCurrentVersionId) {
        respond(409, ['error' => 'Version conflict. Please refresh and retry.']);
    }

    $pdo->beginTransaction();
    try {
        // Mark deleted
        $st = $pdo->prepare('UPDATE arts SET deleted_at = NOW() WHERE id = :id');
        $st->execute([':id' => $artId]);

        // Create a delete snapshot (same content, operation_type=delete)
        $vnum = next_version_number($pdo, $artId);
        $st = $pdo->prepare('INSERT INTO `art_versions` (
            `art_id`, `version_number`, `operation_type`, `content_source_version_id`,
            `title`, `description`, `type`, `period`, `condition`, `locationNotes`, `lat`, `lng`,
            `sensitive`, `privateLand`, `creditKnownArtist`, `image`,
            `changed_fields`, `change_reason`, `changed_by`
        ) VALUES (
            :art_id, :vnum, \'delete\', :content_src,
            :title, :description, :type, :period, :cond, :loc, :lat, :lng,
            :sensitive, :pl, :cka, :image,
            :changed_fields, :reason, :changed_by
        )');
        $st->execute([
            ':art_id' => $artId,
            ':vnum' => $vnum,
            ':content_src' => $current['id'],
            ':title' => $current['title'],
            ':description' => $current['description'],
            ':type' => $current['type'],
            ':period' => $current['period'],
            ':cond' => $current['condition'],
            ':loc' => $current['locationNotes'],
            ':lat' => $current['lat'],
            ':lng' => $current['lng'],
            ':sensitive' => (int)$current['sensitive'],
            ':pl' => (int)$current['privateLand'],
            ':cka' => (int)$current['creditKnownArtist'],
            ':image' => $current['image'],
            ':changed_fields' => json_encode(['deleted_at']),
            ':reason' => 'soft delete',
            ':changed_by' => $userId,
        ]);

        $pdo->commit();
        respond(200, ['ok' => true]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        respond(500, ['error' => 'Failed to delete art', 'detail' => $e->getMessage()]);
    }
}

function list_arts(PDO $pdo): void {
    $q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
    $type = isset($_GET['type']) ? trim((string)$_GET['type']) : '';
    $period = isset($_GET['period']) ? trim((string)$_GET['period']) : '';

    $sql = "SELECT a.id, v.version_number, v.title, v.description, v.type, v.period, v.`condition`, v.locationNotes, v.lat, v.lng, v.image, a.created_at
            FROM arts a JOIN art_versions v ON a.current_version_id = v.id
            WHERE a.deleted_at IS NULL";
    $params = [];
    if ($q !== '') {
        $sql .= " AND (v.title LIKE :q OR v.description LIKE :q)";
        $params[':q'] = '%' . $q . '%';
    }
    if ($type !== '') { $sql .= " AND v.type = :type"; $params[':type'] = $type; }
    if ($period !== '') { $sql .= " AND v.period = :period"; $params[':period'] = $period; }
    $sql .= " ORDER BY a.created_at DESC";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    respond(200, $rows);
}

function get_art(PDO $pdo, int $id): void {
    $sql = "SELECT a.id, a.created_at, v.* FROM arts a JOIN art_versions v ON a.current_version_id = v.id WHERE a.id = :id AND a.deleted_at IS NULL";
    $st = $pdo->prepare($sql);
    $st->execute([':id' => $id]);
    $row = $st->fetch();
    if (!$row) respond(404, ['error' => 'Not found']);
    respond(200, $row);
}

// Entry point
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
// Method override for HTML forms: allow POST + _method=PUT/DELETE
if ($method === 'POST' && isset($_POST['_method'])) {
    $override = strtoupper(trim((string)$_POST['_method']));
    if (in_array($override, ['PUT','DELETE'], true)) {
        $method = $override;
    }
}
$pdo = get_pdo();

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $id = (int)$_GET['id'];
                get_art($pdo, $id);
            } else {
                list_arts($pdo);
            }
            break;
        case 'POST':
            verify_csrf_for_write();
            $json = read_json();
            // Fallback to form fields if JSON body is empty
            if (empty($json) && !empty($_POST)) {
                $json = $_POST;
            }
            $payload = validate_art_payload($json, true);
            $userId = get_user_id();
            $res = create_art_and_version($pdo, $payload, $userId);
            respond(201, $res);
            break;
        case 'PUT':
            verify_csrf_for_write();
            // Allow id in query or form fields (method override)
            $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
            if ($id <= 0) respond(400, ['error' => 'Missing id']);
            $json = read_json();
            if (empty($json) && !empty($_POST)) { $json = $_POST; }
            $payload = validate_art_payload($json, false);
            $expected = isset($json['expected_current_version_id']) ? (int)$json['expected_current_version_id'] : null;
            $userId = get_user_id();
            $res = create_new_version_from_current($pdo, $id, $payload, $userId, $expected);
            respond(200, $res);
            break;
        case 'DELETE':
            verify_csrf_for_write();
            $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($_POST['id']) ? (int)$_POST['id'] : 0);
            if ($id <= 0) respond(400, ['error' => 'Missing id']);
            $json = read_json();
            if (empty($json) && !empty($_POST)) { $json = $_POST; }
            $expected = isset($json['expected_current_version_id']) ? (int)$json['expected_current_version_id'] : null;
            $userId = get_user_id();
            soft_delete_art($pdo, $id, $userId, $expected);
            break;
        default:
            respond(405, ['error' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    respond(500, ['error' => 'Server error']);
}

?>
