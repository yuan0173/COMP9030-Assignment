<?php
// Favorites API: add/remove/list favorites for the current user

declare(strict_types=1);

session_start();

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../inc/pdo.php';

function respond(int $code, $data): never {
  http_response_code($code);
  echo json_encode($data);
  exit;
}

function require_login(): int {
  if (!isset($_SESSION['user_id'])) respond(401, ['error' => 'Login required']);
  return (int)$_SESSION['user_id'];
}

try {
  $pdo = get_pdo();
  // Ensure table exists
  $pdo->exec(
    "CREATE TABLE IF NOT EXISTS favorites (
        user_id INT NOT NULL,
        art_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, art_id),
        INDEX idx_fav_user (user_id),
        INDEX idx_fav_art (art_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (art_id) REFERENCES arts(id) ON DELETE CASCADE
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
  );

  $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
  if ($method === 'OPTIONS') respond(204, ['ok' => true]);

  if ($method === 'GET') {
    $uid = require_login();
    $artCheck = isset($_GET['art_id']) ? (int)$_GET['art_id'] : 0;
    if ($artCheck > 0) {
      $st = $pdo->prepare('SELECT 1 FROM favorites WHERE user_id = :u AND art_id = :a');
      $st->execute([':u' => $uid, ':a' => $artCheck]);
      respond(200, ['favorited' => (bool)$st->fetchColumn()]);
    }
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
    if ($limit > 200) $limit = 200;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;
    // Count
    $total = (int)$pdo->query('SELECT COUNT(*) FROM favorites WHERE user_id = ' . $uid)->fetchColumn();
    // Join current snapshot
    $sql = 'SELECT a.id,
                   v.title, v.description, v.type, v.period, v.`condition`, v.image, a.created_at,
                   u.username AS author_username,
                   CASE WHEN u.role = "user" THEN "public" ELSE u.role END AS author_role
            FROM favorites f
            JOIN arts a ON f.art_id = a.id
            JOIN art_versions v ON a.current_version_id = v.id
            LEFT JOIN users u ON v.changed_by = u.id
            WHERE f.user_id = :u AND a.deleted_at IS NULL
            ORDER BY f.created_at DESC
            LIMIT :lim OFFSET :off';
    $st = $pdo->prepare($sql);
    $st->bindValue(':u', $uid, PDO::PARAM_INT);
    $st->bindValue(':lim', $limit, PDO::PARAM_INT);
    $st->bindValue(':off', $offset, PDO::PARAM_INT);
    $st->execute();
    $rows = $st->fetchAll() ?: [];
    respond(200, ['total' => $total, 'items' => $rows]);
  }

  if ($method === 'POST') {
    $uid = require_login();
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: 'null', true) ?: [];
    $artId = isset($data['art_id']) ? (int)$data['art_id'] : 0;
    if ($artId <= 0) respond(400, ['error' => 'Missing art_id']);
    $st = $pdo->prepare('INSERT IGNORE INTO favorites (user_id, art_id) VALUES (:u, :a)');
    $st->execute([':u' => $uid, ':a' => $artId]);
    respond(200, ['ok' => true]);
  }

  if ($method === 'DELETE') {
    $uid = require_login();
    $artId = isset($_GET['art_id']) ? (int)$_GET['art_id'] : 0;
    if ($artId <= 0) {
      $raw = file_get_contents('php://input');
      $data = json_decode($raw ?: 'null', true) ?: [];
      $artId = isset($data['art_id']) ? (int)$data['art_id'] : 0;
    }
    if ($artId <= 0) respond(400, ['error' => 'Missing art_id']);
    $st = $pdo->prepare('DELETE FROM favorites WHERE user_id = :u AND art_id = :a');
    $st->execute([':u' => $uid, ':a' => $artId]);
    respond(200, ['ok' => true]);
  }

  respond(405, ['error' => 'Method not allowed']);
} catch (Throwable $e) {
  respond(500, ['error' => 'Server error']);
}

?>
