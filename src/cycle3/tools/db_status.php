<?php
// Lightweight DB status checker for local use.
// Outputs JSON with table existence, row counts, and basic integrity checks.

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

require_once dirname(__DIR__, 2) . '/inc/pdo.php';

function ok($data) { echo json_encode($data, JSON_PRETTY_PRINT); exit; }
function fail($msg) { http_response_code(500); ok(['ok' => false, 'error' => $msg]); }

try {
    $pdo = get_pdo();
} catch (Throwable $e) {
    fail('DB connect failed');
}

function table_exists(PDO $pdo, string $name): bool {
    // Use information_schema (SHOW ... cannot be used with prepared statements).
    $sql = 'SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = :t LIMIT 1';
    $st = $pdo->prepare($sql);
    $st->execute([':t' => $name]);
    return ((int)$st->fetchColumn()) > 0;
}

$out = [
    'ok' => true,
    'schema' => 'src/sql-exports/schema.sql',
    'env' => [
        'host' => getenv('MYSQL_HOST') ?: null,
        'db' => getenv('MYSQL_DATABASE') ?: null,
        'user' => getenv('MYSQL_USER') ?: null,
        'port' => getenv('MYSQL_PORT') ?: '3306',
    ],
    'tables' => [],
];

$tables = ['users','arts','art_versions','reports'];
foreach ($tables as $t) {
    $exists = table_exists($pdo, $t);
    $info = ['exists' => $exists, 'count' => null];
    if ($exists) {
        try {
            $st = $pdo->query("SELECT COUNT(*) FROM `{$t}`");
            $info['count'] = (int)$st->fetchColumn();
        } catch (Throwable $e) {
            $info['count'] = null;
        }
    }
    $out['tables'][$t] = $info;
}

// Integrity checks if core tables exist
if (($out['tables']['arts']['exists'] ?? false) && ($out['tables']['art_versions']['exists'] ?? false)) {
    // Check current_version pointer validity
    try {
        $sql = 'SELECT COUNT(*) AS invalid
                FROM arts a
                LEFT JOIN art_versions v ON a.current_version_id = v.id
                WHERE a.deleted_at IS NULL AND (a.current_version_id IS NULL OR v.id IS NULL)';
        $st = $pdo->query($sql);
        $out['integrity']['invalid_current_pointer'] = (int)$st->fetchColumn();
    } catch (Throwable $e) {
        $out['integrity']['invalid_current_pointer'] = null;
    }

    // Sample rows
    try {
        $st = $pdo->query('SELECT id, current_version_id, created_at FROM arts ORDER BY id DESC LIMIT 5');
        $out['samples']['arts'] = $st->fetchAll();
    } catch (Throwable $e) { $out['samples']['arts'] = []; }

    try {
        $st = $pdo->query('SELECT id, art_id, version_number, operation_type, created_at FROM art_versions ORDER BY art_id ASC, version_number ASC LIMIT 10');
        $out['samples']['art_versions'] = $st->fetchAll();
    } catch (Throwable $e) { $out['samples']['art_versions'] = []; }
}

ok($out);

?>
