<?php
// Server-rendered Art Detail page (SSR) for Cycle 3.
// - Fetches current art snapshot from MySQL via PDO.
// - Provides friendly user-facing error messages.
// - Injects CSRF token for subsequent client-side actions.

declare(strict_types=1);

session_start();

// Ensure CSRF token exists in session (used by client when needed)
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

require_once __DIR__ . '/../inc/pdo.php';

function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

// Read and validate id
$id = null;
if (isset($_GET['id'])) {
    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
}

$error = null;
$art = null;

if (!$id) {
    $error = 'Invalid or missing art id.';
} else {
    try {
        $pdo = get_pdo();
        $sql = 'SELECT a.id AS art_id, a.created_at, v.*
                FROM arts a
                JOIN art_versions v ON a.current_version_id = v.id
                WHERE a.id = :id AND a.deleted_at IS NULL';
        $st = $pdo->prepare($sql);
        $st->execute([':id' => (int)$id]);
        $row = $st->fetch();
        if (!$row) {
            $error = 'The requested art could not be found.';
        } else {
            $art = $row;
        }
    } catch (Throwable $e) {
        $error = 'We had trouble loading this page. Please try again later.';
    }
}

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="csrf-token" content="<?php echo e((string)($_SESSION['csrf_token'] ?? '')); ?>" />
  <title><?php echo $art ? e((string)$art['title']) . ' – Art Detail' : 'Art Detail'; ?></title>
  <link rel="stylesheet" href="../cycle2/css/base.css">
  <link rel="stylesheet" href="../cycle2/css/layout.css">
  <link rel="stylesheet" href="../cycle2/css/components.css">
  <link rel="stylesheet" href="../cycle2/css/pages.css">
  <style>
    .container { max-width: 960px; margin: 24px auto; padding: 0 16px; }
    .meta { color: #666; font-size: 0.95rem; margin: 8px 0 16px; }
    .error { background: #fff3f3; color: #a40000; border: 1px solid #ffd6d6; padding: 12px; border-radius: 6px; }
    .actions { margin-top: 16px; display: flex; gap: 12px; }
    .kv { display: grid; grid-template-columns: 160px 1fr; gap: 8px 16px; margin-top: 16px; }
    .kv dt { color: #666; }
    .kv dd { margin: 0; }
    img.art { max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #eee; }
  </style>
  <script>
    // Expose CSRF token for potential client-side requests
    window.CSRF_TOKEN = document.currentScript.previousElementSibling.content;
  </script>
  <script>
    // Simple helper for navigation
    function goHome() { window.location.href = '/'; }
  </script>
  <noscript>
    <!-- This page works without JavaScript; scripts only enhance UX. -->
  </noscript>
  <meta name="robots" content="noindex" />
  <!-- Note: remove noindex in production if SEO is desired for SSR pages. -->
  
</head>
<body>
  <main class="container">
    <a href="/" class="btn btn--ghost">&larr; Back to Home</a>
    <h1>Art Detail</h1>

    <?php if ($error): ?>
      <div class="error" role="alert">
        <?php echo e($error); ?>
      </div>
    <?php else: ?>
      <article>
        <header>
          <h2><?php echo e((string)$art['title']); ?></h2>
          <p class="meta">
            Version <?php echo (int)$art['version_number']; ?> ·
            Created at <?php echo e((string)$art['created_at']); ?>
          </p>
        </header>

        <?php if (!empty($art['image'])): ?>
          <figure>
            <img class="art" src="<?php echo e((string)$art['image']); ?>" alt="Artwork image">
          </figure>
        <?php endif; ?>

        <section>
          <dl class="kv">
            <dt>Type</dt><dd><?php echo e((string)$art['type']); ?></dd>
            <dt>Period</dt><dd><?php echo e((string)$art['period']); ?></dd>
            <dt>Condition</dt><dd><?php echo e((string)$art['condition']); ?></dd>
            <dt>Description</dt><dd><?php echo nl2br(e((string)$art['description'])); ?></dd>
            <dt>Location Notes</dt><dd><?php echo e((string)($art['locationNotes'] ?? '')); ?></dd>
            <dt>Latitude</dt><dd><?php echo is_null($art['lat']) ? '—' : e((string)$art['lat']); ?></dd>
            <dt>Longitude</dt><dd><?php echo is_null($art['lng']) ? '—' : e((string)$art['lng']); ?></dd>
            <dt>Sensitive</dt><dd><?php echo ((int)$art['sensitive']) ? 'Yes' : 'No'; ?></dd>
            <dt>Private Land</dt><dd><?php echo ((int)$art['privateLand']) ? 'Yes' : 'No'; ?></dd>
            <dt>Known Artist</dt><dd><?php echo ((int)$art['creditKnownArtist']) ? 'Yes' : 'No'; ?></dd>
          </dl>
        </section>

        <div class="actions">
          <a class="btn" href="/cycle3/arts_list.php">Back to List</a>
          <a class="btn btn--ghost" href="/api/art_versions.php?art_id=<?php echo (int)$art['art_id']; ?>" target="_blank">View version JSON</a>
        </div>
      </article>
    <?php endif; ?>
  </main>
</body>
</html>
