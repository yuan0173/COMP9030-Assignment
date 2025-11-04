<?php
// Authentication API: register, login, logout, and session info.
// Security:
// - Uses password_hash/password_verify for credentials.
// - Session-based auth; cookies should be set with HttpOnly/Secure/SameSite via server config.
// - Optional CSRF enforcement for state-changing actions via CSRF_ENFORCE=1.
// CORS:
// - Allowlist configured via CORS_ALLOW_ORIGIN env; credentials enabled.

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=UTF-8');

// CORS
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

function respond_auth(int $status, $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function read_json_auth(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function csrf_enforced_auth(): bool { return (getenv('CSRF_ENFORCE') === '1'); }

function ensure_csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string)$_SESSION['csrf_token'];
}

function verify_csrf_for_write_auth(): void {
    if (!csrf_enforced_auth()) return;
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method !== 'POST') return;
    $tokenHeader = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $tokenBody = '';
    if (isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        $json = read_json_auth();
        if (isset($json['csrf_token'])) $tokenBody = (string)$json['csrf_token'];
    } else {
        $tokenBody = isset($_POST['csrf_token']) ? (string)$_POST['csrf_token'] : '';
    }
    $sent = $tokenHeader ?: $tokenBody;
    $sessionToken = isset($_SESSION['csrf_token']) ? (string)$_SESSION['csrf_token'] : '';
    if ($sent === '' || $sessionToken === '' || !hash_equals($sessionToken, $sent)) {
        respond_auth(403, ['error' => 'CSRF validation failed']);
    }
}

function sanitize_email(string $email): string {
    return strtolower(trim($email));
}

function register(PDO $pdo, array $input): void {
    $email = isset($input['email']) ? sanitize_email((string)$input['email']) : '';
    $password = isset($input['password']) ? (string)$input['password'] : '';
    // Role: only allow 'public' or 'artist'; default to 'public'
    $role = isset($input['role']) ? strtolower(trim((string)$input['role'])) : 'public';
    if (!in_array($role, ['public','artist'], true)) { $role = 'public'; }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond_auth(400, ['error' => 'Invalid email']);
    }
    if (strlen($password) < 6) {
        respond_auth(400, ['error' => 'Password too short']);
    }

    // Check uniqueness
    $st = $pdo->prepare('SELECT id FROM users WHERE email = :e');
    $st->execute([':e' => $email]);
    if ($st->fetch()) {
        respond_auth(409, ['error' => 'Email already registered']);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    // Generate unique username from email
    $baseUsername = explode('@', $email)[0];
    $username = $baseUsername;
    $counter = 1;

    // Check for username uniqueness and add counter if needed
    while (true) {
        $st = $pdo->prepare('SELECT id FROM users WHERE username = :u');
        $st->execute([':u' => $username]);
        if (!$st->fetch()) {
            break; // Username is unique
        }
        $username = $baseUsername . $counter;
        $counter++;
    }

    $st = $pdo->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (:u, :e, :h, :r)');
    $st->execute([':u' => $username, ':e' => $email, ':h' => $hash, ':r' => $role]);
    $uid = (int)$pdo->lastInsertId();

    // Auto-login on register
    $_SESSION['user_id'] = $uid;
    $_SESSION['email'] = $email;
    $_SESSION['role'] = $role;
    $csrf = ensure_csrf_token();

    respond_auth(201, [
        'user' => ['id' => $uid, 'email' => $email, 'role' => $role],
        'csrf_token' => $csrf,
    ]);
}

function login(PDO $pdo, array $input): void {
    $email = isset($input['email']) ? sanitize_email((string)$input['email']) : '';
    $password = isset($input['password']) ? (string)$input['password'] : '';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond_auth(400, ['error' => 'Invalid email']);
    }
    $st = $pdo->prepare('SELECT id, password_hash, role, email FROM users WHERE email = :e');
    $st->execute([':e' => $email]);
    $row = $st->fetch();
    if (!$row || !password_verify($password, (string)$row['password_hash'])) {
        respond_auth(401, ['error' => 'Invalid credentials']);
    }
    $_SESSION['user_id'] = (int)$row['id'];
    $_SESSION['email'] = (string)$row['email'];
    $_SESSION['role'] = (string)$row['role'];
    $csrf = ensure_csrf_token();
    // Backward compatibility: map legacy 'user' role to 'public'
    $roleOut = (string)$row['role'];
    if ($roleOut === 'user') { $roleOut = 'public'; }
    respond_auth(200, [
        'user' => ['id' => (int)$row['id'], 'email' => (string)$row['email'], 'role' => $roleOut],
        'csrf_token' => $csrf,
    ]);
}

function logout(): void {
    verify_csrf_for_write_auth();
    unset($_SESSION['user_id'], $_SESSION['email'], $_SESSION['role']);
    // Keep CSRF token or regenerate as needed
    ensure_csrf_token();
    respond_auth(200, ['ok' => true]);
}

function session_info(): void {
    $csrf = ensure_csrf_token();
    if (isset($_SESSION['user_id'])) {
        respond_auth(200, [
            'user' => [
                'id' => (int)$_SESSION['user_id'],
                'email' => (string)($_SESSION['email'] ?? ''),
                'role' => (string)($_SESSION['role'] ?? 'user'),
            ],
            'csrf_token' => $csrf,
        ]);
    }
    respond_auth(200, [ 'user' => null, 'csrf_token' => $csrf ]);
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? (string)$_GET['action'] : (isset($_POST['action']) ? (string)$_POST['action'] : '');
$pdo = get_pdo();

try {
    if ($method === 'GET') {
        if ($action === 'session') { session_info(); }
        respond_auth(400, ['error' => 'Unknown or missing action']);
    } elseif ($method === 'POST') {
        // Read JSON or form
        $input = read_json_auth();
        if (empty($input) && !empty($_POST)) $input = $_POST;
        if ($action === 'register') { register($pdo, $input); }
        elseif ($action === 'login') { login($pdo, $input); }
        elseif ($action === 'logout') { logout(); }
        else { respond_auth(400, ['error' => 'Unknown or missing action']); }
    } else {
        respond_auth(405, ['error' => 'Method not allowed']);
    }
} catch (Throwable $e) {
    respond_auth(500, ['error' => 'Server error']);
}

?>
