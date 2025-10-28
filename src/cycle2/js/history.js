;(function(){
  'use strict'

  var ART_ID = window.ART_ID
  if (!ART_ID) return

  var versions = []
  var total = 0
  var page = 1
  var limit = 10
  var opFilter = ''
  var sortMode = 'new' // new|old|ver-asc|ver-desc
  var query = ''
  var currentVersion = null
  var cmpA = null, cmpB = null

  function el(id){ return document.getElementById(id) }

  function opBadge(op){
    var span = document.createElement('span')
    span.className = 'op-badge ' + (op==='create'?'op-create':op==='rollback'?'op-rollback':op==='delete'?'op-delete':'op-edit')
    span.textContent = op
    return span
  }

  function fmtTime(iso){ try{ return new Date(iso).toLocaleString() }catch(_){ return iso||'' } }

  function fetchCurrent(){
    return fetch('/api/arts.php?id=' + encodeURIComponent(ART_ID))
      .then(function(r){ return r.json() })
      .then(function(data){ currentVersion = data && data.version_number ? Number(data.version_number) : null; updateSummary(data) })
      .catch(function(){ currentVersion = null })
  }

  function updateSummary(item){
    var box = el('historySummary')
    if (!box) return
    if (!item || !item.id){ box.textContent = 'Artwork not found'; return }
    var parts = []
    if (item.title) parts.push(item.title)
    if (item.version_number) parts.push('Current v' + item.version_number)
    if (item.changed_by) parts.push('Last edited by user ' + item.changed_by)
    box.textContent = parts.join(' • ')
  }

  function fetchVersions(){
    var url = '/api/art_versions.php?art_id=' + encodeURIComponent(ART_ID) + '&limit=' + limit + '&page=' + page
    if (opFilter) url += '&op=' + encodeURIComponent(opFilter)
    return fetch(url)
      .then(function(r){ return r.json() })
      .then(function(data){
        total = (data && typeof data.total==='number') ? data.total : (Array.isArray(data)?data.length:0)
        versions = Array.isArray(data && data.items) ? data.items : (Array.isArray(data)?data:[])
        applyFilters()
      })
      .catch(function(err){
        var list = el('versionsList');
        if (list) list.innerHTML = '<div class="notice notice--error" style="margin:12px">Failed to load: ' + (err && err.message || 'error') + '</div>'
      })
  }

  function applyFilters(){
    var items = versions.slice()
    // client-side search in notes and fields
    if (query){
      var q = query.toLowerCase()
      items = items.filter(function(v){
        var notes = (v.change_reason || '').toLowerCase()
        var fields = ''
        try{ fields = JSON.parse(v.changed_fields||'[]').join(' ').toLowerCase() }catch(_){ }
        return notes.indexOf(q)!==-1 || fields.indexOf(q)!==-1
      })
    }
    // sort
    items.sort(function(a,b){
      if (sortMode === 'old') return new Date(a.created_at||0) - new Date(b.created_at||0)
      if (sortMode === 'ver-asc') return (a.version_number||0) - (b.version_number||0)
      if (sortMode === 'ver-desc') return (b.version_number||0) - (a.version_number||0)
      return new Date(b.created_at||0) - new Date(a.created_at||0)
    })
    renderList(items)
    renderPager()
  }

  function renderPager(){
    var nav = el('historyPager')
    if (!nav) return
    var totalPages = Math.max(1, Math.ceil((total||0) / limit))
    if (totalPages <= 1){ nav.style.display='none'; return }
    nav.style.display='flex'; nav.innerHTML = ''
    function addBtn(label, disabled, onClick, active){
      var b = document.createElement('button')
      b.className = 'page'
      if (active) b.classList.add('page--active')
      b.textContent = label
      if (disabled) b.disabled = true
      b.addEventListener('click', function(e){ e.preventDefault(); onClick() })
      nav.appendChild(b)
    }
    addBtn('← Previous', page===1, function(){ page=Math.max(1,page-1); fetchVersions() })
    var start = Math.max(1, page-2), end = Math.min(totalPages, page+2)
    for(var i=start;i<=end;i++){ (function(p){ addBtn(String(p), false, function(){ page=p; fetchVersions() }, p===page) })(i) }
    addBtn('Next →', page===totalPages, function(){ page=Math.min(totalPages,page+1); fetchVersions() })
  }

  function createChips(v){
    var div = document.createElement('div')
    div.className = 'chips'
    var arr = []
    try{ arr = JSON.parse(v.changed_fields||'[]') }catch(_){ arr=[] }
    if (!Array.isArray(arr) || arr.length===0){
      var d = document.createElement('div'); d.className='card__desc'; d.textContent = 'No fields changed'; div.appendChild(d); return div
    }
    arr.forEach(function(k){ var s=document.createElement('span'); s.className='chip'; s.textContent=k; div.appendChild(s) })
    return div
  }

  function createVersionCard(v){
    var wrap = document.createElement('div')
    wrap.className = 'card'
    wrap.style.padding = '12px'

    var title = document.createElement('div')
    title.className = 'card__title'
    title.textContent = 'v' + v.version_number
    title.appendChild(opBadge(v.operation_type))
    wrap.appendChild(title)

    var meta = document.createElement('div')
    meta.className = 'version-card__meta'
    meta.textContent = fmtTime(v.created_at) + (v.changed_by ? (' • by user ' + v.changed_by) : '')
    wrap.appendChild(meta)

    wrap.appendChild(createChips(v))

    if (v.change_reason){
      var notes = document.createElement('div')
      notes.className = 'card__desc'
      notes.style.marginTop = '6px'
      notes.textContent = v.change_reason
      wrap.appendChild(notes)
    }

    var actions = document.createElement('div')
    actions.className = 'form__actions'
    actions.style.justifyContent = 'flex-end'

    // Details (show before/after for changed fields)
    var detailsBtn = document.createElement('button')
    detailsBtn.className = 'btn btn--ghost'
    detailsBtn.type = 'button'
    detailsBtn.textContent = 'Details'
    var detailsBox = document.createElement('div')
    detailsBox.style.display = 'none'
    detailsBox.style.marginTop = '8px'
    wrap.appendChild(detailsBox)
    detailsBtn.addEventListener('click', function(){
      var visible = detailsBox.style.display !== 'none'
      if (visible){ detailsBox.style.display = 'none'; return }
      detailsBox.style.display = 'block'
      if (!detailsBox.dataset.loaded){
        renderVersionDetails(v, detailsBox)
      }
    })

    actions.appendChild(detailsBtn)

    // Compare selectors
    var btnA = document.createElement('button')
    btnA.className = 'btn btn--ghost'
    btnA.type = 'button'
    btnA.textContent = 'Select as A'
    btnA.addEventListener('click', function(){ cmpA = v.version_number; syncCompareInputs() })

    var btnB = document.createElement('button')
    btnB.className = 'btn btn--ghost'
    btnB.type = 'button'
    btnB.textContent = 'Select as B'
    btnB.addEventListener('click', function(){ cmpB = v.version_number; syncCompareInputs() })

    actions.appendChild(btnA)
    actions.appendChild(btnB)

    // Rollback (disabled for current version)
    var rb = document.createElement('button')
    rb.className = 'btn'
    rb.type = 'button'
    rb.textContent = 'Rollback to v' + v.version_number
    if (currentVersion && v.version_number === currentVersion){ rb.disabled = true }
    rb.addEventListener('click', function(){ openRollbackModal(v) })
    actions.appendChild(rb)

    wrap.appendChild(actions)
    return wrap
  }

  function fetchVersion(ver){
    return fetch('/api/art_versions.php?art_id=' + ART_ID + '&version=' + ver).then(function(r){ return r.json() })
  }

  function renderVersionDetails(v, box){
    box.dataset.loaded = '1'
    box.innerHTML = '<div class="card__desc">Loading details…</div>'
    var ver = v.version_number || 0
    var prev = Math.max(1, ver - 1)
    Promise.all([
      fetchVersion(ver),
      prev === ver ? Promise.resolve(null) : fetchVersion(prev)
    ]).then(function(arr){
      var cur = arr[0] || {}
      var before = arr[1] || {}
      var fields = []
      try{ fields = JSON.parse(v.changed_fields||'[]') }catch(_){ fields = [] }
      if (!Array.isArray(fields) || fields.length===0){ fields = ['title','description','type','period','condition','locationNotes','lat','lng','sensitive','privateLand','creditKnownArtist','image'] }

      var frag = document.createDocumentFragment()
      fields.forEach(function(k){
        var row = document.createElement('div')
        row.className = 'diff-row diff-changed'
        var c1 = document.createElement('div'); c1.textContent = k
        var c2 = document.createElement('div')
        var c3 = document.createElement('div')
        setCellValue(c2, before[k], k)
        setCellValue(c3, cur[k], k)
        row.appendChild(c1); row.appendChild(c2); row.appendChild(c3)
        frag.appendChild(row)
      })
      box.innerHTML = ''
      box.appendChild(frag)
    }).catch(function(err){ box.innerHTML = '<div class="notice notice--error">Failed to load details: ' + err + '</div>' })
  }

  function setCellValue(cell, val, key){
    if (key === 'sensitive' || key === 'privateLand' || key === 'creditKnownArtist'){
      var b = (val===1 || val===true || val==='1')
      cell.textContent = b ? 'Yes' : 'No'
      return
    }
    if (key === 'image'){
      if (val){
        var img = document.createElement('img')
        img.src = String(val)
        img.alt = 'image'
        img.style.maxWidth = '100%'
        img.style.maxHeight = '96px'
        img.style.objectFit = 'cover'
        img.style.borderRadius = '8px'
        cell.appendChild(img)
      } else { cell.textContent = '—' }
      return
    }
    cell.textContent = (val===null||val===undefined)?'':String(val)
  }

  function renderList(items){
    var box = el('versionsList')
    if (!box) return
    box.innerHTML = ''
    if (!Array.isArray(items) || items.length===0){
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.style.margin = '12px'
      empty.textContent = 'No versions.'
      box.appendChild(empty)
      return
    }
    items.forEach(function(v){ box.appendChild(createVersionCard(v)) })
  }

  function syncCompareInputs(){
    var a = el('cmpA'), b = el('cmpB')
    if (a) a.value = cmpA ? String(cmpA) : ''
    if (b) b.value = cmpB ? String(cmpB) : ''
  }

  function compareNow(){
    var a = cmpA, b = cmpB
    if (!a || !b){ alert('Select two versions first.'); return }
    Promise.all([
      fetch('/api/art_versions.php?art_id=' + ART_ID + '&version=' + a).then(function(r){return r.json()}),
      fetch('/api/art_versions.php?art_id=' + ART_ID + '&version=' + b).then(function(r){return r.json()})
    ]).then(function(arr){ renderDiff(arr[0], arr[1]) }).catch(function(err){ alert('Compare failed: ' + err) })
  }

  function renderDiff(a, b){
    var target = el('cmpResult')
    if (!target) return
    target.innerHTML = ''
    var fields = ['title','description','type','period','condition','locationNotes','lat','lng','sensitive','privateLand','creditKnownArtist','image']
    fields.forEach(function(k){
      var va = a && (a[k]!==undefined ? a[k] : a[k])
      var vb = b && (b[k]!==undefined ? b[k] : b[k])
      if (String(va) === String(vb)) return // only show differences
      var row = document.createElement('div')
      row.className = 'diff-row diff-changed'
      var c1 = document.createElement('div'); c1.textContent = k
      var c2 = document.createElement('div'); c2.textContent = (va===null||va===undefined)?'':String(va)
      var c3 = document.createElement('div'); c3.textContent = (vb===null||vb===undefined)?'':String(vb)
      row.appendChild(c1); row.appendChild(c2); row.appendChild(c3)
      target.appendChild(row)
    })
    if (!target.childNodes.length){ target.innerHTML = '<div class="card__desc">No differences.</div>' }
  }

  // Rollback modal flows
  var rbState = { ver: null, fields: [] }
  function openRollbackModal(v){
    rbState.ver = v.version_number
    rbState.fields = []
    el('rbTarget').textContent = 'Target version: v' + v.version_number
    var modal = el('rbModal'); if (modal) modal.style.display = 'flex'
    // reset
    el('rbReason').value = ''
    var typeRadios = document.querySelectorAll('input[name="rbType"]')
    typeRadios.forEach(function(r){ r.checked = (r.value==='full') })
    var rbFieldsBox = el('rbFields'); rbFieldsBox.style.display='none'; rbFieldsBox.innerHTML=''
    // Show all available fields, pre-check those in changed_fields
    var changed = []
    try{ changed = JSON.parse(v.changed_fields||'[]') }catch(_){ changed = [] }
    var all = ['title','description','type','period','condition','locationNotes','lat','lng','sensitive','privateLand','creditKnownArtist','image']
    all.forEach(function(k){
      var label = document.createElement('label')
      label.style.display = 'block'
      var c = document.createElement('input')
      c.type = 'checkbox'; c.value = k; c.checked = changed.indexOf(k)!==-1
      label.appendChild(c)
      label.appendChild(document.createTextNode(' ' + k))
      rbFieldsBox.appendChild(label)
    })
  }

  function closeRollback(){ var m=el('rbModal'); if (m) m.style.display='none' }

  function onRbTypeChange(){
    var selected = document.querySelector('input[name="rbType"]:checked')
    var box = el('rbFields')
    box.style.display = selected && selected.value==='selective' ? 'block' : 'none'
  }

  function confirmRollback(){
    var selected = document.querySelector('input[name="rbType"]:checked')
    var type = selected ? selected.value : 'full'
    var reason = (el('rbReason') && el('rbReason').value || '').trim()
    if (!reason){ alert('Please provide a reason for rollback.'); return }
    var fields = []
    if (type === 'selective'){
      var inputs = el('rbFields').querySelectorAll('input[type="checkbox"]')
      inputs.forEach(function(c){ if (c.checked) fields.push(c.value) })
      if (!fields.length){ alert('Please select at least one field for selective rollback.'); return }
    }
    var payload = { art_id: ART_ID, target_version: rbState.ver, rollback_type: type, change_reason: reason }
    if (fields.length) payload.fields = fields

    var headers = { 'Content-Type': 'application/json' }
    if (window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN
    fetch('/api/art_versions.php?action=rollback', {
      method: 'POST', headers: headers, credentials: 'include', body: JSON.stringify(payload)
    }).then(function(r){ return r.json() }).then(function(res){
      if (res && res.error){ throw new Error(res.error) }
      alert('Rollback successful to v' + rbState.ver)
      closeRollback()
      // After rollback, redirect to detail to reflect current snapshot
      window.location.href = '/cycle3/art_detail.php?id=' + encodeURIComponent(ART_ID)
    }).catch(function(err){ alert('Rollback failed: ' + err.message) })
  }

  // Toolbar wiring
  function hookToolbar(){
    var opPills = document.querySelectorAll('#opPills .pill')
    opPills.forEach(function(b){ b.addEventListener('click', function(){
      opPills.forEach(function(x){ x.classList.remove('pill--active') })
      b.classList.add('pill--active')
      opFilter = b.dataset.op || ''
      page = 1
      fetchVersions()
    }) })

    var sortPills = document.querySelectorAll('#sortPills .pill')
    sortPills.forEach(function(b){ b.addEventListener('click', function(){
      sortPills.forEach(function(x){ x.classList.remove('pill--active') })
      b.classList.add('pill--active')
      sortMode = b.dataset.sort || 'new'
      applyFilters()
    }) })

    var searchInput = el('historySearch')
    var searchBtn = el('historySearchBtn')
    if (searchInput){ searchInput.addEventListener('input', function(){ query = searchInput.value.trim(); applyFilters() }) }
    if (searchBtn){ searchBtn.addEventListener('click', function(){ query = searchInput.value.trim(); applyFilters() }) }

    var typeRadios = document.querySelectorAll('input[name="rbType"]')
    typeRadios.forEach(function(r){ r.addEventListener('change', onRbTypeChange) })
    var rbCancel = el('rbCancel'); if (rbCancel) rbCancel.addEventListener('click', closeRollback)
    var rbConfirm = el('rbConfirm'); if (rbConfirm) rbConfirm.addEventListener('click', confirmRollback)
    var cmpBtn = el('cmpBtn'); if (cmpBtn) cmpBtn.addEventListener('click', compareNow)
    var cmpClear = el('cmpClear'); if (cmpClear) cmpClear.addEventListener('click', function(){ cmpA=null; cmpB=null; syncCompareInputs(); el('cmpResult').innerHTML='' })
  }

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn) }

  ready(function(){
    hookToolbar()
    fetchCurrent().then(fetchVersions)
  })
})()
