;(function(){
  'use strict'

  // Switch to server-backed list via /api/users.php

  var pageSize = 10
  var currentPage = 1
  var cache = []

  function el(id){ return document.getElementById(id) }

  function readFilters(){
    var kw = (el('adminUsersKeyword') && el('adminUsersKeyword').value || '').trim().toLowerCase()
    var role = (el('adminUsersRole') && el('adminUsersRole').value) || 'all'
    var status = (el('adminUsersStatus') && el('adminUsersStatus').value) || 'all'
    var sort = (el('adminUsersSort') && el('adminUsersSort').value) || 'newest'
    return { keyword: kw, role: role, status: status, sort: sort }
  }

  function filterList(list){
    var f = readFilters()
    var out = (list || []).filter(function(u){
      var okRole = (f.role === 'all') || (String(u.role || '').toLowerCase() === f.role)
      var okStatus = (f.status === 'all') || (String(u.status || '').toLowerCase() === f.status)
      var hay = ((u.username || '') + ' ' + (u.email || '')).toLowerCase()
      var okKw = !f.keyword || hay.indexOf(f.keyword) !== -1
      return okRole && okStatus && okKw
    })
    // Sort
    out.sort(function(a,b){
      if (f.sort === 'name-asc') return String(a.username||'').localeCompare(String(b.username||''))
      if (f.sort === 'name-desc') return String(b.username||'').localeCompare(String(a.username||''))
      if (f.sort === 'oldest') return new Date(a.createdAt||0) - new Date(b.createdAt||0)
      // newest
      return new Date(b.createdAt||0) - new Date(a.createdAt||0)
    })
    return out
  }

  function formatRole(r){
    var s = String(r||'')
    if (!s) return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  function formatStatus(s){
    s = String(s||'')
    if (s.toLowerCase() === 'active') return 'Active'
    if (s.toLowerCase() === 'suspended') return 'Suspended'
    return s
  }
  function formatDate(iso){ try{ return new Date(iso).toISOString().slice(0,10) }catch(_){ return '' } }

  function renderTable(list){
    var body = el('adminUsersBody')
    if (!body) return
    body.innerHTML = ''
    if (!Array.isArray(list) || list.length === 0){
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No users match your filters.'
      body.appendChild(empty)
      return
    }

    var start = (currentPage - 1) * pageSize
    var end = start + pageSize
    var pageItems = list.slice(start, end)

    pageItems.forEach(function(u){
      var row = document.createElement('div')
      row.className = 'admin-table admin-table__row'
      row.dataset.userId = u.id

      var c1 = document.createElement('div')
      c1.className = 'admin-cell__title'
      c1.textContent = u.username || ''
      var c2 = document.createElement('div')
      c2.textContent = formatRole(u.role)
      var c3 = document.createElement('div')
      c3.className = 'hide-sm'
      c3.textContent = u.email || ''
      var c4 = document.createElement('div')
      c4.textContent = formatStatus(u.status)
      var c5 = document.createElement('div')
      c5.className = 'admin-actions'
      // Actions: Change Role, Suspend/Activate, View Submissions
      var btnRole = document.createElement('button')
      btnRole.className = 'btn btn--ghost'
      btnRole.type = 'button'
      btnRole.textContent = 'Change Role'
      btnRole.addEventListener('click', function(){ changeRole(u) })

      var btnToggle = document.createElement('button')
      btnToggle.className = 'btn btn--ghost'
      btnToggle.type = 'button'
      btnToggle.textContent = (String(u.status||'active').toLowerCase() === 'suspended') ? 'Activate' : 'Suspend'
      btnToggle.addEventListener('click', function(){ toggleStatus(u) })

      var view = document.createElement('a')
      view.className = 'btn'
      view.href = '/cycle3/arts_list.php?submitter=' + encodeURIComponent(u.id)
      view.textContent = 'View Submissions'

      c5.appendChild(btnRole)
      c5.appendChild(btnToggle)
      c5.appendChild(view)

      row.appendChild(c1)
      row.appendChild(c2)
      row.appendChild(c3)
      row.appendChild(c4)
      row.appendChild(c5)
      body.appendChild(row)
    })
  }

  function renderPagination(total){
    var nav = el('adminUsersPagination')
    if (!nav) return
    nav.innerHTML = ''
    var totalPages = Math.max(1, Math.ceil(total / pageSize))
    if (totalPages <= 1){ nav.style.display = 'none'; return }
    nav.style.display = 'flex'

    function addBtn(label, disabled, onClick, active){
      var b = document.createElement('button')
      b.className = 'page'
      if (active) b.classList.add('page--active')
      b.textContent = label
      if (disabled) b.disabled = true
      b.addEventListener('click', function(e){ e.preventDefault(); onClick() })
      nav.appendChild(b)
    }
    addBtn('← Previous', currentPage === 1, function(){ currentPage = Math.max(1, currentPage - 1); apply(true) })
    var start = Math.max(1, currentPage - 2)
    var end = Math.min(totalPages, currentPage + 2)
    for (var i=start;i<=end;i++){ (function(p){ addBtn(String(p), false, function(){ currentPage = p; apply(true) }, p===currentPage) })(i) }
    addBtn('Next →', currentPage === totalPages, function(){ currentPage = Math.min(totalPages, currentPage + 1); apply(true) })
  }

  function showNotice(kind, msg){
    var box = el('adminUsersNotice')
    if (!box) return
    var div = document.createElement('div')
    div.className = 'notice ' + (kind === 'error' ? 'notice--error' : 'notice--empty')
    div.textContent = msg
    box.innerHTML = ''
    box.appendChild(div)
  }

  function saveUsers(list){}

  function apiUpdate(id, body){
    return fetch('/api/users.php?id=' + encodeURIComponent(id), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body)
    }).then(function(r){ return r.json() }).then(function(res){ if (res && res.error){ throw new Error(res.error) } return res })
  }

  function changeRole(u){
    var current = String(u.role || '')
    var next = prompt('Set role for ' + (u.username||'user') + ' (public/artist/admin):', current)
    if (next == null) return
    next = String(next).trim().toLowerCase()
    if (['public','artist','admin'].indexOf(next) === -1){ showNotice('error','Invalid role.'); return }
    apiUpdate(u.id, { role: next }).then(function(){ apply(true) }).catch(function(err){ showNotice('error', err.message) })
  }

  function toggleStatus(u){
    var cur = String(u.status || 'active').toLowerCase()
    var next = (cur === 'suspended') ? 'active' : 'suspended'
    apiUpdate(u.id, { status: next }).then(function(){ apply(true) }).catch(function(err){ showNotice('error', err.message) })
  }

  function apply(preservePage){
    // Load from API
    var f = readFilters()
    var params = new URLSearchParams()
    if (f.keyword) params.set('q', f.keyword)
    if (f.role && f.role !== 'all') params.set('role', f.role)
    params.set('limit', String(pageSize))
    params.set('offset', String((currentPage - 1) * pageSize))
    fetch('/api/users.php?' + params.toString(), { credentials: 'include' })
      .then(function(r){ return r.json() })
      .then(function(data){
        cache = (data && Array.isArray(data.users)) ? data.users : []
        var list = filterList(cache) // apply client-side sort
        if (!preservePage) currentPage = 1
        renderTable(list)
        renderPagination(data && typeof data.total==='number' ? data.total : list.length)
      })
      .catch(function(err){ showNotice('error','Failed to load users: ' + err.message) })
  }

  function hook(){
    var form = el('adminUsersFilter')
    var kw = el('adminUsersKeyword')
    var role = el('adminUsersRole')
    var status = el('adminUsersStatus')
    var sort = el('adminUsersSort')
    if (form){ form.addEventListener('submit', function(e){ e.preventDefault(); apply(false) }) }
    if (kw){ kw.addEventListener('input', function(){ apply(false) }) }
    if (role){ role.addEventListener('change', function(){ apply(false) }) }
    if (status){ status.addEventListener('change', function(){ apply(false) }) }
    if (sort){ sort.addEventListener('change', function(){ apply(false) }) }
  }

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn) }
  ready(function(){ hook(); apply(false) })
})()
