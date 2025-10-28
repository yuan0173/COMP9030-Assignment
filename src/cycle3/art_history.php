<?php
// Server-rendered Art History page (versions + rollback UI)
// Uses existing /api/art_versions.php for data and rollback actions.

declare(strict_types=1);

session_start();

if (empty($_SESSION['csrf_token'])) {
  $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function e(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
  http_response_code(400);
  echo '<!DOCTYPE html><meta charset="utf-8"><div style="padding:24px;font-family:sans-serif">Invalid id</div>';
  exit;
}

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="csrf-token" content="<?php echo e((string)($_SESSION['csrf_token'] ?? '')); ?>" />
  <title>Art Edit History</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <link rel="stylesheet" href="../cycle2/css/base.css">
  <link rel="stylesheet" href="../cycle2/css/layout.css">
  <link rel="stylesheet" href="../cycle2/css/components.css">
  <link rel="stylesheet" href="../cycle2/css/pages.css">
  <style>
    .history-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 1024px){ .history-grid { grid-template-columns: 2fr 1fr; } }
    .version-card__meta { color:#6b7280; font-size: 0.92rem; }
    .chips { display:flex; flex-wrap: wrap; gap:6px; margin-top:6px; }
    .chip { font-size:12px; padding:2px 8px; border-radius:999px; border:1px solid var(--border); background:#f9fafb; }
    .op-badge { display:inline-block; font-size:12px; padding:2px 8px; border-radius:999px; margin-left:8px; }
    .op-create{ background:#e0f2fe; color:#0369a1; }
    .op-edit{ background:#e5e7eb; color:#374151; }
    .op-rollback{ background:#fef3c7; color:#92400e; }
    .op-delete{ background:#fee2e2; color:#991b1b; }
    .compare-box { border:1px solid var(--border); border-radius:10px; padding:12px; }
    .diff-row { display:grid; grid-template-columns: 160px 1fr 1fr; gap:8px; padding:6px 0; border-bottom:1px dashed #e5e7eb; }
    .diff-row:last-child{ border-bottom:0; }
    .diff-changed { background:#fff7ed; }
    .modal { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none; align-items:center; justify-content:center; }
    .modal__card{ background:#fff; border-radius:12px; padding:16px; width:min(560px,92vw); }
  </style>
  <script>
    window.CSRF_TOKEN = document.currentScript.previousElementSibling.content;
    window.ART_ID = <?php echo (int)$id; ?>;
  </script>
</head>
<body>
  <div id="header-placeholder"></div>

  <main class="container" style="margin-top:24px">
    <nav><a class="btn btn--ghost" href="/cycle3/art_detail.php?id=<?php echo (int)$id; ?>">&larr; Back to Detail</a></nav>

    <section class="card" style="padding:16px">
      <div class="flex-between" style="align-items:center">
        <div>
          <h1 class="card__title" style="margin:0">Art Edit History</h1>
          <div class="card__desc" id="historySummary">Loading current version…</div>
        </div>
        <div>
          <a class="btn" href="/cycle3/art_detail.php?id=<?php echo (int)$id; ?>">Open Detail</a>
        </div>
      </div>
    </section>

    <!-- Toolbar -->
    <section class="card" style="padding:16px">
      <div class="flex-between" style="gap:8px; align-items:center; flex-wrap:wrap">
        <div class="pills" id="opPills" aria-label="Operation filter">
          <button class="pill pill--active" data-op="">All</button>
          <button class="pill" data-op="create">Create</button>
          <button class="pill" data-op="edit">Edit</button>
          <button class="pill" data-op="rollback">Rollback</button>
          <button class="pill" data-op="delete">Delete</button>
        </div>
        <div class="pills" id="sortPills" aria-label="Sort" style="margin-left:auto">
          <button class="pill pill--active" data-sort="new">Newest</button>
          <button class="pill" data-sort="old">Oldest</button>
          <button class="pill" data-sort="ver-asc">Version ↑</button>
          <button class="pill" data-sort="ver-desc">Version ↓</button>
        </div>
      </div>
      <div class="searchbar" style="margin-top:8px">
        <input id="historySearch" class="input searchbar__input" placeholder="Search notes/fields">
        <button class="btn" id="historySearchBtn">Search</button>
      </div>
    </section>

    <section class="history-grid">
      <section class="card" style="padding:0">
        <div id="versionsList">
          <div class="notice" style="margin:12px">Loading versions…</div>
        </div>
        <nav class="pagination" id="historyPager" style="margin:12px" aria-label="Versions pagination"></nav>
      </section>

      <aside class="card" style="padding:16px">
        <h3 class="card__title" style="margin:0 0 8px">Compare</h3>
        <div class="compare-box">
          <div class="form__row">
            <input id="cmpA" class="input" placeholder="Version A" readonly>
            <input id="cmpB" class="input" placeholder="Version B" readonly>
          </div>
          <div class="form__actions">
            <button id="cmpBtn" class="btn" type="button">Compare</button>
            <button id="cmpClear" class="btn btn--ghost" type="button">Clear</button>
          </div>
          <div id="cmpResult" style="margin-top:8px"></div>
        </div>
      </aside>
    </section>
  </main>

  <!-- Rollback modal -->
  <div id="rbModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="rbTitle">
    <div class="modal__card">
      <h3 id="rbTitle" class="card__title" style="margin:0 0 8px">Rollback</h3>
      <p class="card__desc" id="rbTarget">Target version: </p>
      <div class="form">
        <div class="form__row">
          <label><input type="radio" name="rbType" value="full" checked> Full rollback</label>
          <label><input type="radio" name="rbType" value="selective"> Selective (choose fields)</label>
        </div>
        <div id="rbFields" class="grid" style="gap:8px; display:none"></div>
        <textarea id="rbReason" class="input" rows="3" placeholder="Reason (required)"></textarea>
        <div class="form__actions" style="justify-content:flex-end">
          <button id="rbCancel" class="btn btn--ghost" type="button">Cancel</button>
          <button id="rbConfirm" class="btn" type="button">Confirm Rollback</button>
        </div>
      </div>
    </div>
  </div>

  <footer class="footer page-section">
    <div class="container flex-between">
      <div>© IAA</div>
      <nav>
        <a href="../cycle2/Pages/About.html">Introduction</a> ·
        <a href="../cycle2/Pages/Guideline.html">Guidelines</a> ·
        <a href="../cycle2/Pages/ArtsResult.html">Art Listings</a> ·
        <a href="../cycle2/Pages/Contact.html">Contact Us</a> ·
        <a href="../cycle2/Pages/Disclaimer.html">Disclaimers</a>
      </nav>
    </div>
  </footer>

  <script src="../cycle2/js/session.js"></script>
  <script src="../cycle2/js/header.js"></script>
  <script src="../cycle2/js/history.js"></script>
</body>
</html>

