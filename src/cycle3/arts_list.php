<?php
// Server-rendered Arts List page (SSR) for Cycle 3.
// - Lists current snapshots of arts with search and pagination.
// - Provides friendly user-facing error messages.
// - Does not require JavaScript to function (progressive enhancement ready).

declare(strict_types=1);

session_start();

// Ensure CSRF token exists for future actions if needed
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

require_once __DIR__ . '/../inc/pdo.php';

function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

// Read filters
$q = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
$type = isset($_GET['type']) ? trim((string)$_GET['type']) : '';
$period = isset($_GET['period']) ? trim((string)$_GET['period']) : '';
$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$pageSize = isset($_GET['page_size']) ? (int)$_GET['page_size'] : 12;
if ($pageSize <= 0) $pageSize = 12;
if ($pageSize > 50) $pageSize = 50; // cap
$offset = ($page - 1) * $pageSize;

$error = null;
$rows = [];
$total = 0;

try {
    $pdo = get_pdo();

    // Build where
    $where = ' WHERE a.deleted_at IS NULL ';
    $params = [];
    if ($q !== '') {
        $where .= ' AND (v.title LIKE :q OR v.description LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }
    if ($type !== '') { $where .= ' AND v.type = :type'; $params[':type'] = $type; }
    if ($period !== '') { $where .= ' AND v.period = :period'; $params[':period'] = $period; }

    // Count total
    $countSql = 'SELECT COUNT(*) FROM arts a JOIN art_versions v ON a.current_version_id = v.id ' . $where;
    $st = $pdo->prepare($countSql);
    $st->execute($params);
    $total = (int)$st->fetchColumn();

    // Fetch page
    $sql = 'SELECT a.id AS art_id, a.created_at, v.version_number, v.title, v.type, v.period, v.`condition`, v.description, v.image
            FROM arts a JOIN art_versions v ON a.current_version_id = v.id '
            . $where . ' ORDER BY a.created_at DESC LIMIT :lim OFFSET :off';
    $st = $pdo->prepare($sql);
    foreach ($params as $k => $v) { $st->bindValue($k, $v); }
    $st->bindValue(':lim', $pageSize, PDO::PARAM_INT);
    $st->bindValue(':off', $offset, PDO::PARAM_INT);
    $st->execute();
    $rows = $st->fetchAll() ?: [];
} catch (Throwable $e) {
    $error = 'We had trouble loading the list. Please try again later.';
}

// Helper to build query strings preserving some params
function qs(array $overrides = []): string {
    $base = [
        'q' => isset($_GET['q']) ? (string)$_GET['q'] : '',
        'type' => isset($_GET['type']) ? (string)$_GET['type'] : '',
        'period' => isset($_GET['period']) ? (string)$_GET['period'] : '',
        'page_size' => isset($_GET['page_size']) ? (string)$_GET['page_size'] : '12',
    ];
    $merged = array_merge($base, $overrides);
    return http_build_query($merged);
}

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="csrf-token" content="<?php echo e((string)($_SESSION['csrf_token'] ?? '')); ?>" />
  <title>Arts – List</title>
  <link rel="stylesheet" href="../cycle2/css/base.css">
  <link rel="stylesheet" href="../cycle2/css/layout.css">
  <link rel="stylesheet" href="../cycle2/css/components.css">
  <link rel="stylesheet" href="../cycle2/css/pages.css">
  <style>
    .container { max-width: 1060px; margin: 24px auto; padding: 0 16px; }
    .error { background: #fff3f3; color: #a40000; border: 1px solid #ffd6d6; padding: 12px; border-radius: 6px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 16px; margin-top: 16px; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 12px; background: #fff; display: flex; flex-direction: column; }
    .thumb { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 6px; border: 1px solid #eee; background: #f6f6f6; }
    .meta { color: #666; font-size: 0.92rem; margin-top: 8px; }
    .desc { color: #333; font-size: 0.95rem; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .actions { margin-top: auto; display: flex; gap: 8px; }
    form.filters { display: grid; grid-template-columns: 1fr 140px 140px 120px 90px; gap: 8px; align-items: center; }
    form.filters input, form.filters select { padding: 8px; }
    .pager { margin: 16px 0; display: flex; justify-content: space-between; align-items: center; }
    .count { color: #666; }
  </style>
  <script>
    window.CSRF_TOKEN = document.currentScript.previousElementSibling.content;
  </script>
  <noscript><!-- Page works without JS --></noscript>
  <meta name="robots" content="noindex" />
</head>
<body>
  <main class="container">
    <a href="/" class="btn btn--ghost">&larr; Back to Home</a>
    <h1>Arts</h1>

    <form class="filters" method="get" action="/cycle3/arts_list.php">
      <input type="text" name="q" placeholder="Search title or description" value="<?php echo e($q); ?>" />
      <input type="text" name="type" placeholder="Type" value="<?php echo e($type); ?>" />
      <input type="text" name="period" placeholder="Period" value="<?php echo e($period); ?>" />
      <select name="page_size">
        <?php foreach ([12,24,36,50] as $opt): ?>
          <option value="<?php echo $opt; ?>" <?php echo ($pageSize===$opt?'selected':''); ?>><?php echo $opt; ?>/page</option>
        <?php endforeach; ?>
      </select>
      <button class="btn" type="submit">Apply</button>
    </form>

    <div class="pager">
      <div class="count">Total: <?php echo (int)$total; ?> items</div>
      <div>
        <?php if ($page > 1): ?>
          <a class="btn btn--ghost" href="/cycle3/arts_list.php?<?php echo e(qs(['page' => $page-1])); ?>">&larr; Prev</a>
        <?php endif; ?>
        <?php if ($offset + $pageSize < $total): ?>
          <a class="btn" href="/cycle3/arts_list.php?<?php echo e(qs(['page' => $page+1])); ?>">Next &rarr;</a>
        <?php endif; ?>
      </div>
    </div>

    <?php if ($error): ?>
      <div class="error" role="alert"><?php echo e($error); ?></div>
    <?php elseif (empty($rows)): ?>
      <p>No items found. Try different filters.</p>
    <?php else: ?>
      <section class="grid">
        <?php foreach ($rows as $r): ?>
          <article class="card">
            <?php if (!empty($r['image'])): ?>
              <img class="thumb" src="<?php echo e((string)$r['image']); ?>" alt="Artwork image" />
            <?php else: ?>
              <div class="thumb" aria-label="No image"></div>
            <?php endif; ?>
            <h3 style="margin:10px 0 4px;"><?php echo e((string)$r['title']); ?></h3>
            <p class="meta">Type: <?php echo e((string)$r['type']); ?> · Period: <?php echo e((string)$r['period']); ?> · v<?php echo (int)$r['version_number']; ?></p>
            <p class="desc"><?php echo e(mb_strimwidth((string)$r['description'], 0, 180, '…', 'UTF-8')); ?></p>
            <div class="actions">
              <a class="btn" href="/cycle3/art_detail.php?id=<?php echo (int)$r['art_id']; ?>">Open detail</a>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>

    <div class="pager">
      <div></div>
      <div>
        <?php if ($page > 1): ?>
          <a class="btn btn--ghost" href="/cycle3/arts_list.php?<?php echo e(qs(['page' => $page-1])); ?>">&larr; Prev</a>
        <?php endif; ?>
        <?php if ($offset + $pageSize < $total): ?>
          <a class="btn" href="/cycle3/arts_list.php?<?php echo e(qs(['page' => $page+1])); ?>">Next &rarr;</a>
        <?php endif; ?>
      </div>
    </div>

  </main>
</body>
</html>
