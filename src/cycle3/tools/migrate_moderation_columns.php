<?php
// Migration: add moderation columns to arts table
// - moderation_status ENUM('pending','approved','rejected') DEFAULT 'pending'
// - moderated_at TIMESTAMP NULL
// - moderated_by INT NULL

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../../inc/pdo.php';

function out($ok, $msg){ echo json_encode(['ok'=>$ok, 'message'=>$msg]) . "\n"; }

try {
    $pdo = get_pdo();
    $pdo->exec("ALTER TABLE arts ADD COLUMN IF NOT EXISTS moderation_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'");
    $pdo->exec("ALTER TABLE arts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP NULL DEFAULT NULL");
    $pdo->exec("ALTER TABLE arts ADD COLUMN IF NOT EXISTS moderated_by INT NULL DEFAULT NULL");
    out(true, 'Moderation columns ready.');
} catch (Throwable $e) {
    out(false, 'Migration failed: ' . $e->getMessage());
}

?>

