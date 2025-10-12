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
    .card { border: 1px solid #eee; border-radius: 8px; padding: 12px; background: #fff; margin-top: 16px; }
    .versions { display: grid; gap: 10px; }
    .version-item { border:1px solid #eee; border-radius:8px; padding:10px; }
    .version-head { display:flex; justify-content:space-between; gap:8px; align-items:center; }
    .muted { color:#666; font-size:.9rem; }
    .actions-row { display:flex; gap:8px; }
    .preview { margin-top:8px; background:#fafafa; border:1px dashed #ddd; padding:8px; border-radius:6px; }
    .kv-mini { display:grid; grid-template-columns:140px 1fr; gap:6px 12px; }
  </style>
  <script>
    // Expose CSRF token for potential client-side requests
    (function(){
      var metas = document.getElementsByName('csrf-token');
      if (metas && metas[0]) { window.CSRF_TOKEN = metas[0].content; }
    })();
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

      <section class="card" id="versionCard" data-art-id="<?php echo (int)$art['art_id']; ?>" data-current-version-id="<?php echo (int)$art['id']; ?>">
        <div class="version-head">
          <h3 style="margin:0;">Version History</h3>
          <div class="actions-row">
            <button class="btn btn--ghost" id="loadVersionsBtn" type="button">Load History</button>
          </div>
        </div>
        <div class="muted" style="margin-top:4px;">View version list, preview snapshots, and rollback to a previous version.</div>
        <div id="versionsContainer" class="versions" style="margin-top:10px;"></div>
      </section>

      <script>
        (function(){
          var card = document.getElementById('versionCard');
          if (!card) return;
          var artId = parseInt(card.getAttribute('data-art-id'), 10);
          var currentVid = parseInt(card.getAttribute('data-current-version-id'), 10);
          var listEl = document.getElementById('versionsContainer');
          var btn = document.getElementById('loadVersionsBtn');

          function el(tag, attrs, children){
            var x = document.createElement(tag);
            if (attrs){ Object.keys(attrs).forEach(function(k){ if(k==='class') x.className=attrs[k]; else x.setAttribute(k, attrs[k]); }); }
            (children||[]).forEach(function(c){ x.appendChild(typeof c==='string'? document.createTextNode(c): c); });
            return x;
          }

          function renderItem(v){
            var head = el('div', { class:'version-head' }, [
              el('div', null, [
                el('div', null, ['v', String(v.version_number), (v.id===currentVid?' (current)':'')].join('')),
                el('div', { class:'muted' }, [ (v.operation_type||'').toUpperCase(), ' • ', v.created_at || '' ])
              ]),
              (function(){
                var row = el('div', { class:'actions-row' }, []);
                var previewBtn = el('button', { class:'btn btn--ghost', type:'button' }, ['Preview']);
                previewBtn.addEventListener('click', function(){ previewVersion(v.version_number, item) });
                row.appendChild(previewBtn);
                if (v.id !== currentVid){
                  var rbBtn = el('button', { class:'btn', type:'button' }, ['Rollback']);
                  rbBtn.addEventListener('click', function(){ rollbackTo(v.version_number) });
                  row.appendChild(rbBtn);
                }
                return row;
              })()
            ]);
            var changed = Array.isArray(v.changed_fields)? v.changed_fields.join(', '): (v.changed_fields || '');
            var meta = el('div', { class:'muted' }, [ changed ? ('Changed: ' + changed) : 'Initial snapshot' ]);
            var item = el('div', { class:'version-item' }, [ head, meta ]);
            return item;
          }

          function loadVersions(){
            btn.disabled = true; btn.textContent = 'Loading...';
            fetch('/api/art_versions.php?art_id=' + encodeURIComponent(artId))
              .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
              .then(function(arr){
                listEl.innerHTML='';
                if (!Array.isArray(arr) || arr.length===0){ listEl.textContent='No versions yet.'; return; }
                arr.forEach(function(v){ listEl.appendChild(renderItem(v)); });
              })
              .catch(function(){ listEl.textContent='Failed to load versions.'; })
              .finally(function(){ btn.disabled=false; btn.textContent='Load History'; });
          }

          function previewVersion(verNo, anchorEl){
            fetch('/api/art_versions.php?art_id=' + encodeURIComponent(artId) + '&version=' + encodeURIComponent(verNo))
              .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
              .then(function(snap){
                var box = el('div', { class:'preview' }, []);
                var kv = el('div', { class:'kv-mini' }, [
                  el('div', null, ['Title']), el('div', null, [String(snap.title||'')]),
                  el('div', null, ['Type']), el('div', null, [String(snap.type||'')]),
                  el('div', null, ['Period']), el('div', null, [String(snap.period||'')]),
                  el('div', null, ['Condition']), el('div', null, [String(snap.condition||'')]),
                  el('div', null, ['Description']), el('div', null, [String(snap.description||'')])
                ]);
                box.appendChild(kv);
                // Replace existing preview under the clicked item
                var container = anchorEl || listEl;
                var old = container.querySelector('.preview'); if (old) old.remove();
                container.appendChild(box);
              })
              .catch(function(){ alert('Failed to load version preview'); });
          }

          function rollbackTo(verNo){
            if (!confirm('Rollback to version v' + verNo + '? This will create a new version.')) return;
            var headers = { 'Content-Type':'application/json' };
            if (window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN;
            var body = {
              art_id: artId,
              target_version: verNo,
              rollback_type: 'full',
              expected_current_version_id: currentVid
            };
            fetch('/api/art_versions.php?action=rollback', {
              method:'POST', headers: headers, credentials:'include', body: JSON.stringify(body)
            })
              .then(function(r){ return r.json().then(function(d){ return { ok:r.ok, data:d }; }); })
              .then(function(res){
                if (!res.ok || (res.data && res.data.error)) throw new Error((res.data&&res.data.error)||'Rollback failed');
                location.reload();
              })
              .catch(function(err){ alert(err.message || 'Rollback failed'); });
          }

          btn.addEventListener('click', loadVersions);
        })();
      </script>
    <?php endif; ?>
  </main>
</body>
</html>
