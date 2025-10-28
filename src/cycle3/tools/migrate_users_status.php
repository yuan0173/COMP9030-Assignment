<?php
// Migration: add users.status enum('active','suspended')

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../inc/pdo.php';

function out($ok, $msg){ echo json_encode(['ok'=>$ok, 'message'=>$msg]) . "\n"; }

try {
    $pdo = get_pdo();
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active','suspended') NOT NULL DEFAULT 'active'");
    out(true, 'users.status ready.');
} catch (Throwable $e) {
    out(false, 'Migration failed: ' . $e->getMessage());
}

?>

