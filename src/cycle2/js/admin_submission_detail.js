;(function(){
  'use strict'

  // Require admin role early
  if (!SessionManager || !SessionManager.requireRole || !SessionManager.requireRole('admin')){
    return
  }

  function qs(s){ return document.querySelector(s) }
  function el(id){ return document.getElementById(id) }

  // Resolve display level from item or selection
  function resolveDisplayLevel(it){
    var dl = (it && typeof it.displayLevel === 'string') ? it.displayLevel.toLowerCase() : ''
    if (dl === 'exact' || dl === 'locality' || dl === 'region' || dl === 'hidden') return dl
    var sensitive = !!(it && it.sensitive)
    var priv = !!(it && it.privateLand)
    if (sensitive && priv) return 'hidden'
    if (sensitive) return 'locality'
    if (priv) return 'region'
    return 'exact'
  }
  function approx(n){ return Math.round(n * 10) / 10 }

  var map, tile
  function ensureMap(){
    if (!window.L) return null
    if (map) return map
    map = L.map('adminSubmissionMap', { center:[-34.9, 138.6], zoom: 11 })
    tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap contributors' })
    tile.addTo(map)
    return map
  }

  var previewLayer
  function renderPreview(item, level){
    var m = ensureMap()
    if (!m) return
    if (previewLayer){ try{ m.removeLayer(previewLayer) }catch(_){ } previewLayer = null }
    var hasCoords = typeof item.lat === 'number' && typeof item.lng === 'number'
    if (!hasCoords){ m.setView([-34.9, 138.6], 10); return }
    var lat = item.lat, lng = item.lng
    if (level === 'hidden'){
      m.setView([lat, lng], 10)
      return
    }
    if (level === 'locality'){
      previewLayer = L.circle([lat, lng], { radius: 1000, color:'#2a5b9d', fillColor:'#2a5b9d', fillOpacity:0.15 }).addTo(m)
      m.setView([lat, lng], 13)
      return
    }
    if (level === 'region'){
      var latA = approx(lat), lngA = approx(lng)
      previewLayer = L.marker([latA, lngA]).addTo(m)
      m.setView([latA, lngA], 11)
      return
    }
    // exact
    previewLayer = L.marker([lat, lng]).addTo(m)
    m.setView([lat, lng], 14)
  }

  function showNotice(kind, msg){
    var box = el('admNotice')
    if (!box) return
    var div = document.createElement('div')
    div.className = 'notice ' + (kind === 'error' ? 'notice--error' : 'notice--empty')
    div.textContent = msg
    box.innerHTML = ''
    box.appendChild(div)
  }

  function saveToStorage(updated){
    var key = AdminData.KEYS.submissions
    var subs = AdminData.get(key) || []
    var idx = subs.findIndex(function(x){ return String(x.id) === String(updated.id) })
    if (idx >= 0){ subs[idx] = updated; AdminData.set(key, subs) }
  }

  function removeFromStorage(id){
    var key = AdminData.KEYS.submissions
    var subs = AdminData.get(key) || []
    var next = subs.filter(function(x){ return String(x.id) !== String(id) })
    AdminData.set(key, next)
  }

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn) }

  ready(function(){
    if (window.AdminData && AdminData.seedIfNeeded) AdminData.seedIfNeeded()

    var params = new URLSearchParams(location.search)
    var id = params.get('id')
    if (!id){
      var main = document.querySelector('main.container')
      if (main) main.innerHTML = '<div class="notice notice--error">Missing submission id.</div>'
      return
    }

    var sub = (AdminData.get(AdminData.KEYS.submissions) || []).find(function(s){ return String(s.id) === String(id) })
    if (!sub){
      var main2 = document.querySelector('main.container')
      if (main2) main2.innerHTML = '<div class="notice notice--error">Submission not found.</div>'
      return
    }

    // Populate form fields
    el('admEditTitle').value = sub.title || ''
    el('admEditType').value = sub.type || el('admEditType').value
    el('admEditPeriod').value = sub.period || el('admEditPeriod').value
    el('admEditCondition').value = sub.condition || ''
    el('admEditDescription').value = sub.description || ''
    el('admEditNotes').value = sub.locationNotes || ''
    if (el('admEditArtist')) el('admEditArtist').value = sub.artist || ''

    var currentLevel = resolveDisplayLevel(sub)
    el('admDisplayLevel').value = currentLevel
    renderPreview(sub, currentLevel)

    // Wire up display level change
    el('admDisplayLevel').addEventListener('change', function(){
      var lvl = el('admDisplayLevel').value
      renderPreview(sub, lvl)
    })

    function collectEdits(){
      sub.title = el('admEditTitle').value.trim()
      sub.type = el('admEditType').value
      sub.period = el('admEditPeriod').value
      sub.condition = el('admEditCondition').value.trim()
      sub.description = el('admEditDescription').value.trim()
      sub.locationNotes = el('admEditNotes').value.trim()
      if (el('admEditArtist')) sub.artist = el('admEditArtist').value.trim()
      sub.displayLevel = el('admDisplayLevel').value
      return sub
    }

    // Save changes (edit only)
    el('admSaveBtn').addEventListener('click', function(){
      collectEdits()
      saveToStorage(sub)
      showNotice('ok', 'Changes saved (demo).')
    })

    // Approve
    el('admApproveBtn').addEventListener('click', function(){
      collectEdits()
      sub.status = 'Approved'
      saveToStorage(sub)
      showNotice('ok', 'Submission approved (demo).')
    })

    // Reject (requires reason)
    el('admRejectBtn').addEventListener('click', function(){
      var reason = (el('admRejectReason') && el('admRejectReason').value || '').trim()
      if (!reason){ showNotice('error', 'Please provide a rejection reason.'); return }
      collectEdits()
      sub.status = 'Rejected'
      sub.rejectReason = reason
      saveToStorage(sub)
      showNotice('ok', 'Submission rejected (demo).')
    })

    // Delete
    el('admDeleteBtn').addEventListener('click', function(){
      if (!confirm('Delete this submission?')) return
      removeFromStorage(sub.id)
      showNotice('ok', 'Submission deleted (demo).')
      setTimeout(function(){ window.location.href = './AdminSubmissionList.html' }, 600)
    })
  })
})()

