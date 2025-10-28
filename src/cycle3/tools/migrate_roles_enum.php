<?php
// Simple one-off migration to update users.role enum to ('public','artist','admin')
// and convert legacy 'user' values to 'public'.
// Usage: php src/cycle3/tools/migrate_roles_enum.php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../inc/pdo.php';

function ok($msg, $extra = []){ echo json_encode(['ok' => true, 'message' => $msg] + $extra) . "\n"; }
function fail($msg){ http_response_code(500); echo json_encode(['ok' => false, 'error' => $msg]) . "\n"; exit; }

try {
    $pdo = get_pdo();
    $pdo->beginTransaction();
    // 1) Convert legacy values
    $pdo->exec("UPDATE users SET role='public' WHERE role='user'");
    // 2) Update enum definition
    $pdo->exec("ALTER TABLE users MODIFY role ENUM('public','artist','admin') NOT NULL DEFAULT 'public'");
    $pdo->commit();
    ok('Migration complete', ['enum' => "('public','artist','admin')"]);
} catch (Throwable $e) {
    if ($pdo && $pdo->inTransaction()) { $pdo->rollBack(); }
    fail('Migration failed: ' . $e->getMessage());
}

?>

