<?php
// Quick setup for MySQL: (1) optionally create DB + user using admin creds,
// (2) import canonical schema into the target DB using app creds.
// Outputs JSON with step-by-step results.

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

function out($data){ echo json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES),"\n"; exit; }

function envv(string $k, ?string $def=null): ?string { $v=getenv($k); return ($v===false)?$def:$v; }

$admin = [
  'host' => envv('ADMIN_DB_HOST','127.0.0.1'),
  'port' => envv('ADMIN_DB_PORT','3306'),
  'user' => envv('ADMIN_DB_USER',''),
  'pass' => envv('ADMIN_DB_PASSWORD',''),
];

$app = [
  'host' => envv('MYSQL_HOST','127.0.0.1'),
  'port' => envv('MYSQL_PORT','3306'),
  'db'   => envv('MYSQL_DATABASE','cityarts'),
  'user' => envv('MYSQL_USER','cityarts'),
  'pass' => envv('MYSQL_PASSWORD','P@ssw0rd!'),
];

$schemaPath = __DIR__ . '/../../sql-exports/schema.sql';
$res = [ 'ok'=>true, 'steps'=>[], 'app'=>$app, 'schema'=>$schemaPath ];

function pdo_conn(string $dsn, string $user, string $pass): PDO {
  $opt=[
    PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES=>false,
  ];
  return new PDO($dsn, $user, $pass, $opt);
}

try {
  // Step 1: If admin user is provided, create DB + app user + grant
  if ($admin['user'] !== '') {
    $res['steps'][] = 'Admin credentials detected. Creating database and user...';
    $dsnAdmin = sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $admin['host'], $admin['port']);
    $pdoAdmin = pdo_conn($dsnAdmin, $admin['user'], $admin['pass']);
    $db = preg_replace('/[^a-zA-Z0-9_]/','',$app['db']);
    $usr= preg_replace('/[^a-zA-Z0-9_]/','',$app['user']);
    // Create DB if not exists
    $pdoAdmin->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    // Create user if not exists and grant
    $stmt = $pdoAdmin->prepare("CREATE USER IF NOT EXISTS '{$usr}'@'localhost' IDENTIFIED BY :pw");
    $stmt->execute([':pw'=>$app['pass']]);
    $pdoAdmin->exec("GRANT ALL PRIVILEGES ON `{$db}`.* TO '{$usr}'@'localhost'");
    $pdoAdmin->exec("FLUSH PRIVILEGES");
    $res['steps'][] = 'Database and user ensured.';
  } else {
    $res['steps'][] = 'No admin credentials. Skipping DB/user creation.';
  }

  // Step 2: Import schema with app creds
  if (!file_exists($schemaPath)) {
    throw new RuntimeException('Schema file not found: '.$schemaPath);
  }
  $sql = file_get_contents($schemaPath);
  if ($sql === false || trim($sql) === '') {
    throw new RuntimeException('Schema file is empty or unreadable.');
  }

  $dsnApp = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $app['host'], $app['port'], $app['db']);
  $pdoApp = pdo_conn($dsnApp, $app['user'], $app['pass']);

  // Optional: drop conflicting tables first (safe when empty)
  $res['steps'][] = 'Importing schema...';
  $pdoApp->exec($sql);
  $res['steps'][] = 'Schema imported successfully.';

  // Step 3: Quick verification
  $check = $pdoApp->query("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name")->fetchAll();
  $res['tables'] = array_map(fn($r)=>$r['table_name'], $check);
  out($res);
} catch (Throwable $e) {
  $res['ok'] = false;
  $res['error'] = $e->getMessage();
  out($res);
}

?>

