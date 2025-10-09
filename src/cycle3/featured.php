<?php
// SSR Featured Arts: show latest 6 artworks as cards.
// Reads current snapshots from MySQL via PDO and renders HTML.

declare(strict_types=1);

session_start();
require_once __DIR__ . '/../inc/pdo.php';

function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$error = null;
$rows = [];

try {
    $pdo = get_pdo();
    $sql = 'SELECT a.id AS art_id, a.created_at,
                   v.version_number, v.title, v.type, v.period, v.`condition`, v.description, v.image
            FROM arts a
            JOIN art_versions v ON a.current_version_id = v.id
            WHERE a.deleted_at IS NULL
            ORDER BY a.created_at DESC
            LIMIT 6';
    $st = $pdo->query($sql);
    $rows = $st ? ($st->fetchAll() ?: []) : [];
} catch (Throwable $e) {
    $error = 'Failed to load featured items. Please try again later.';
}

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Featured Arts (SSR)</title>
  <link rel="stylesheet" href="../cycle2/css/base.css">
  <link rel="stylesheet" href="../cycle2/css/layout.css">
  <link rel="stylesheet" href="../cycle2/css/components.css">
  <link rel="stylesheet" href="../cycle2/css/pages.css">
  <style>
    .container { max-width: 1060px; margin: 24px auto; padding: 0 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 16px; margin-top: 16px; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 12px; background: #fff; display: flex; flex-direction: column; }
    .thumb { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 6px; border: 1px solid #eee; background: #f6f6f6; }
    .meta { color: #666; font-size: 0.92rem; margin-top: 8px; }
    .desc { color: #333; font-size: 0.95rem; margin-top: 6px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .actions { margin-top: auto; display: flex; gap: 8px; }
    .titlebar { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  </style>
</head>
<body>
  <main class="container page-section">
    <div class="titlebar">
      <h1>Featured Arts</h1>
      <div>
        <a class="btn btn--ghost" href="/">Home</a>
        <a class="btn" href="/cycle3/arts_list.php">All Arts (SSR)</a>
      </div>
    </div>

    <?php if ($error): ?>
      <div class="notice notice--error" role="alert"><?php echo e($error); ?></div>
    <?php elseif (empty($rows)): ?>
      <div class="notice notice--empty">No artworks available yet.</div>
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
              <a class="btn" href="/cycle3/art_detail.php?id=<?php echo (int)$r['art_id']; ?>">Open detail (SSR)</a>
              <a class="btn btn--ghost" href="/cycle2/Pages/ArtDetail.html?id=<?php echo (int)$r['art_id']; ?>">Open SPA</a>
            </div>
          </article>
        <?php endforeach; ?>
      </section>
    <?php endif; ?>
  </main>
</body>
</html>

