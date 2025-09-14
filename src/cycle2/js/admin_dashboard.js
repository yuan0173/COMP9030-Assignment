;(function(){
  'use strict'

  // Render admin stats using AdminData (localStorage-backed mock data).

  function el(id){ return document.getElementById(id) }

  function countPending(submissions){
    return (submissions || []).filter(function(s){ return (s.status || '').toLowerCase() === 'pending' }).length
  }
  function countUsers(users){ return (users || []).length }

  function templateCard(title, value, hint){
    return (
      '<article class="card admin-card" aria-live="polite" style="padding:16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div>' +
            '<div class="card__title" style="margin:0">' + title + '</div>' +
            (hint ? '<div class="card__desc">' + hint + '</div>' : '') +
          '</div>' +
          '<div style="font-size:28px;font-weight:700">' + value + '</div>' +
        '</div>' +
      '</article>'
    )
  }

  function render(){
    // Ensure data is seeded
    if (window.AdminData && AdminData.seedIfNeeded) AdminData.seedIfNeeded()
    var subs = (window.AdminData && AdminData.get(AdminData.KEYS.submissions)) || []
    var users = (window.AdminData && AdminData.get(AdminData.KEYS.users)) || []

    var pending = countPending(subs)
    var totalUsers = countUsers(users)
    // Demo value for open reports (no dataset yet): simple function of pending
    var openReports = Math.max(2, Math.min(9, Math.round(pending/2)))

    var stats = el('adminStats')
    if (!stats) return
    stats.innerHTML = ''

    // Cards
    stats.innerHTML += templateCard('Pending Submissions', String(pending), 'Awaiting review')
    stats.innerHTML += templateCard('Total Users', String(totalUsers), 'All registered users')
    stats.innerHTML += templateCard('Open Reports (demo)', String(openReports), 'Moderation backlog')

    // Add a small toolbar with a simulate button
    var bar = document.createElement('div')
    bar.className = 'flex-between'
    bar.style.margin = '8px 0 4px'
    var hint = document.createElement('div')
    hint.className = 'card__desc'
    hint.textContent = 'Counts are based on local mock data.'
    var btn = document.createElement('button')
    btn.className = 'btn btn--ghost'
    btn.type = 'button'
    btn.setAttribute('aria-label','Simulate a data change and refresh stats')
    btn.textContent = 'Simulate Change'
    btn.addEventListener('click', function(){ simulateChange(); render() })
    bar.appendChild(hint)
    bar.appendChild(btn)
    stats.parentNode.insertBefore(bar, stats.nextSibling)

    // Render taxonomies (types and periods)
    renderTaxonomies()
  }

  function renderTaxonomies(){
    var types = (AdminData.get(AdminData.KEYS.types) || []).slice()
    var periods = (AdminData.get(AdminData.KEYS.periods) || []).slice()

    function renderList(containerId, items, onEdit){
      var box = document.getElementById(containerId)
      if (!box) return
      box.innerHTML = ''
      if (!items.length){
        var empty = document.createElement('div')
        empty.className = 'notice notice--empty'
        empty.textContent = 'No items yet.'
        box.appendChild(empty)
        return
      }
      items.forEach(function(name, idx){
        var row = document.createElement('div')
        row.className = 'admin-list__row'
        var span = document.createElement('span')
        span.textContent = name
        var btn = document.createElement('button')
        btn.className = 'btn btn--ghost'
        btn.type = 'button'
        btn.textContent = 'Edit'
        btn.addEventListener('click', function(){ onEdit(idx, name) })
        row.appendChild(span)
        row.appendChild(btn)
        box.appendChild(row)
      })
    }

    renderList('adminTypesList', types, function(idx, oldName){
      var input = prompt('Rename type:', oldName)
      if (input == null) return
      var next = String(input).trim()
      if (!next){ alert('Name cannot be empty.'); return }
      types[idx] = next
      AdminData.set(AdminData.KEYS.types, types)
      renderTaxonomies()
    })

    renderList('adminPeriodsList', periods, function(idx, oldName){
      var input = prompt('Rename period:', oldName)
      if (input == null) return
      var next = String(input).trim()
      if (!next){ alert('Name cannot be empty.'); return }
      periods[idx] = next
      AdminData.set(AdminData.KEYS.periods, periods)
      renderTaxonomies()
    })

    // Hook create buttons
    var typeInput = document.getElementById('adminTypeNew')
    var typeCreate = document.getElementById('adminTypeCreate')
    if (typeCreate){
      typeCreate.addEventListener('click', function(){
        var val = (typeInput && typeInput.value || '').trim()
        if (!val){ alert('Please enter a type name.'); return }
        if (types.indexOf(val) !== -1){ alert('Type already exists.'); return }
        types.push(val)
        AdminData.set(AdminData.KEYS.types, types)
        if (typeInput) typeInput.value = ''
        renderTaxonomies()
      })
    }

    var periodInput = document.getElementById('adminPeriodNew')
    var periodCreate = document.getElementById('adminPeriodCreate')
    if (periodCreate){
      periodCreate.addEventListener('click', function(){
        var val = (periodInput && periodInput.value || '').trim()
        if (!val){ alert('Please enter a period name.'); return }
        if (periods.indexOf(val) !== -1){ alert('Period already exists.'); return }
        periods.push(val)
        AdminData.set(AdminData.KEYS.periods, periods)
        if (periodInput) periodInput.value = ''
        renderTaxonomies()
      })
    }
  }

  function simulateChange(){
    // Toggle one submission between Pending and Approved to demonstrate changing stats
    var key = AdminData.KEYS.submissions
    var subs = AdminData.get(key) || []
    if (subs.length === 0) return

    var pendingIdx = subs.findIndex(function(s){ return (s.status || '').toLowerCase() === 'pending' })
    if (pendingIdx >= 0 && Math.random() < 0.5){
      subs[pendingIdx].status = 'Approved'
    } else {
      var otherIdx = subs.findIndex(function(s){ return (s.status || '').toLowerCase() !== 'pending' })
      if (otherIdx >= 0) subs[otherIdx].status = 'Pending'
    }
    AdminData.set(key, subs)
  }

  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(render)
})()
