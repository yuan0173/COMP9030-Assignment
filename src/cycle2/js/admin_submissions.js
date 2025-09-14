;(function(){
  'use strict'

  if (!window.AdminData){ return }

  var pageSize = 10
  var currentPage = 1
  var cache = []

  function el(id){ return document.getElementById(id) }
  function q(sel){ return document.querySelector(sel) }

  function readFilters(){
    var kw = (el('adminSubsKeyword') && el('adminSubsKeyword').value || '').trim().toLowerCase()
    var st = (el('adminSubsStatus') && el('adminSubsStatus').value) || 'Pending'
    return { keyword: kw, status: st }
  }

  function filterList(list){
    var f = readFilters()
    return (list || []).filter(function(it){
      var statusOk = f.status ? (String(it.status || '').toLowerCase() === f.status.toLowerCase()) : true
      var needle = f.keyword
      var hay = ((it.title || '') + ' ' + (it.submitter || '')).toLowerCase()
      var kwOk = !needle || hay.indexOf(needle) !== -1
      return statusOk && kwOk
    })
  }

  function formatDate(iso){
    try{ return new Date(iso).toISOString().slice(0,10) }catch(_){ return '' }
  }

  function renderTable(list){
    var body = el('adminSubsBody')
    if (!body) return
    body.innerHTML = ''

    if (!Array.isArray(list) || list.length === 0){
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No submissions match your filters.'
      body.appendChild(empty)
      return
    }

    // Paginate
    var start = (currentPage - 1) * pageSize
    var end = start + pageSize
    var pageItems = list.slice(start, end)

    pageItems.forEach(function(it){
      var row = document.createElement('div')
      row.className = 'admin-table admin-table__row'

      var c1 = document.createElement('div')
      c1.className = 'admin-cell__title'
      c1.textContent = it.title || 'Untitled'
      var c2 = document.createElement('div')
      c2.textContent = it.status || ''
      var c3 = document.createElement('div')
      c3.className = 'hide-sm'
      c3.textContent = it.submitter || ''
      var c4 = document.createElement('div')
      c4.className = 'hide-sm'
      c4.textContent = formatDate(it.createdAt)
      var c5 = document.createElement('div')
      c5.className = 'admin-actions'
      var open = document.createElement('a')
      open.className = 'btn'
      open.href = './AdminSubmissionDetail.html?id=' + encodeURIComponent(it.id)
      open.textContent = 'Open'
      c5.appendChild(open)

      row.appendChild(c1)
      row.appendChild(c2)
      row.appendChild(c3)
      row.appendChild(c4)
      row.appendChild(c5)
      body.appendChild(row)
    })
  }

  function renderPagination(totalItems){
    var nav = el('adminSubsPagination')
    if (!nav) return
    nav.innerHTML = ''

    var totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    if (totalPages <= 1){ nav.style.display = 'none'; return }
    nav.style.display = 'flex'

    function addBtn(label, disabled, onClick, active){
      var b = document.createElement('button')
      b.className = 'page'
      if (active) b.classList.add('page--active')
      b.textContent = label
      if (disabled){ b.disabled = true }
      b.addEventListener('click', function(e){ e.preventDefault(); onClick() })
      nav.appendChild(b)
    }

    // Prev
    addBtn('← Previous', currentPage === 1, function(){ currentPage = Math.max(1, currentPage - 1); apply() })

    // Page numbers (windowed)
    var start = Math.max(1, currentPage - 2)
    var end = Math.min(totalPages, currentPage + 2)
    for (var i = start; i <= end; i++){
      (function(p){ addBtn(String(p), false, function(){ currentPage = p; apply(true) }, p === currentPage) })(i)
    }

    // Next
    addBtn('Next →', currentPage === totalPages, function(){ currentPage = Math.min(totalPages, currentPage + 1); apply() })
  }

  function apply(preservePage){
    cache = AdminData.get(AdminData.KEYS.submissions) || []
    var filtered = filterList(cache)
    if (!preservePage){ currentPage = 1 }
    renderTable(filtered)
    renderPagination(filtered.length)
  }

  function hook(){
    var form = el('adminSubsFilter')
    var keyword = el('adminSubsKeyword')
    var status = el('adminSubsStatus')
    if (form){ form.addEventListener('submit', function(e){ e.preventDefault(); apply(false) }) }
    if (keyword){ keyword.addEventListener('input', function(){ apply(false) }) }
    if (status){ status.addEventListener('change', function(){ apply(false) }) }
  }

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn) }

  ready(function(){
    if (window.AdminData && AdminData.seedIfNeeded) AdminData.seedIfNeeded()
    hook()
    apply(false)
  })
})()

