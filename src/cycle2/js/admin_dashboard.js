;(function(){
  'use strict'

  // Render admin stats using live database via /api/admin_stats.php

  function el(id){ return document.getElementById(id) }

  function countPending(submissions){
    return (submissions || []).filter(function(s){ return (s.status || '').toLowerCase() === 'pending' }).length
  }
  function countUsers(users){ return (users || []).length }

  function templateCardLink(title, value, hint, href){
    var a = document.createElement('a')
    a.className = 'card admin-card'
    a.style.padding = '16px'
    a.href = href
    a.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center">'
      + '<div>'
      +   '<div class="card__title" style="margin:0">' + title + '</div>'
      +   (hint ? '<div class="card__desc">' + hint + '</div>' : '')
      + '</div>'
      + '<div style="font-size:28px;font-weight:700">' + value + '</div>'
      + '</div>'
    return a
  }

  async function fetchStats(){
    var res = await fetch('/api/admin_stats.php', { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to load admin stats: ' + res.status)
    return res.json()
  }

  async function render(){
    var stats = el('adminStats')
    if (!stats) return
    stats.innerHTML = '<article class="card admin-card" style="padding:16px"><div class="card__desc">Loading stats…</div></article>'

    var data
    try{
      data = await fetchStats()
    }catch(err){
      stats.innerHTML = '<article class="card admin-card" style="padding:16px"><div class="card__desc">Failed to load stats.</div></article>'
      return
    }

    stats.innerHTML = ''
    var links = (data && data.links) || {}
    stats.appendChild(templateCardLink('Pending Submissions', String(data.pending_submissions || 0), 'Created in last 30 days', links.pending_submissions || '/cycle3/arts_list.php'))
    stats.appendChild(templateCardLink('Total Users', String(data.total_users || 0), 'All registered users', links.total_users || '/cycle2/Pages/AdminUserManagement.html'))
    stats.appendChild(templateCardLink('Open Reports', String(data.open_reports || 0), 'Awaiting moderation', links.open_reports || '/cycle2/Pages/AdminReportList.html'))

    // Render taxonomies (types and periods) – still client-side mock for now
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

  function simulateChange(){}

  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  ready(render)
})()
