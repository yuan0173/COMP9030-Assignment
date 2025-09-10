;(function(){
  var params = new URLSearchParams(location.search)
  var id = params.get('id')
  if (!id) return

  function apiBase(){ return '../../api/art.php?id=' + encodeURIComponent(id) }

  var titleEl = document.getElementById('artTitle')
  var descEl = document.getElementById('artDescription')
  var typeEl = document.getElementById('artType')
  var periodEl = document.getElementById('artPeriod')
  var condEl = document.getElementById('artCondition')
  var imgEl = document.getElementById('artImage')
  var notesEl = document.getElementById('detailNotes')
  var flagsEl = document.getElementById('detailFlags')
  var breadcrumb = document.getElementById('breadcrumbTitle')
  var editToggle = document.getElementById('editToggle')
  var deleteBtn = document.getElementById('deleteBtn')
  var editForm = document.getElementById('editForm')
  var eTitle = document.getElementById('editTitle')
  var eType = document.getElementById('editType')
  var ePeriod = document.getElementById('editPeriod')
  var eCondition = document.getElementById('editCondition')
  var eDescription = document.getElementById('editDescription')
  var eNotes = document.getElementById('editNotes')
  var eLat = document.getElementById('editLat')
  var eLng = document.getElementById('editLng')
  var eArtist = document.getElementById('editArtist')
  var eSensitive = document.getElementById('editSensitive')
  var ePrivate = document.getElementById('editPrivate')

  fetch(apiBase()).then(function(r){ return r.json() }).then(function(item){
    if (!item || item.error) { document.body.innerHTML = '<main class="container">Not found</main>'; return }
    titleEl.textContent = item.title || 'Untitled'
    breadcrumb.textContent = item.title || 'Untitled'
    descEl.textContent = item.description || ''
    typeEl.textContent = item.type || ''
    periodEl.textContent = item.period || ''
    condEl.textContent = item.condition || ''
    imgEl.src = item.image || '../test.jpg'
    notesEl.textContent = item.locationNotes || ''
    var flags = []
    if (item.creditKnownArtist) flags.push('Credited artist')
    if (item.sensitive) flags.push('Culturally sensitive')
    if (item.privateLand) flags.push('Private land')
    flagsEl.textContent = flags.join(' • ')

    if (window.L) {
      var map = L.map('detailMap', { center: [ -33.8688, 151.2093 ], zoom: 11 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        var ll = [ item.lat, item.lng ]
        L.marker(ll).addTo(map)
        map.setView(ll, 14)
      }
    }

    // Populate edit form
    if (eTitle) {
      eTitle.value = item.title || ''
      eType.value = item.type || 'Cave Art'
      ePeriod.value = item.period || 'Ancient'
      eCondition.value = item.condition || ''
      eDescription.value = item.description || ''
      eNotes.value = item.locationNotes || ''
      eLat.value = (typeof item.lat === 'number') ? item.lat : ''
      eLng.value = (typeof item.lng === 'number') ? item.lng : ''
      eArtist.checked = !!item.creditKnownArtist
      eSensitive.checked = !!item.sensitive
      ePrivate.checked = !!item.privateLand
    }
  })

  if (editToggle && editForm) {
    editToggle.addEventListener('click', function(){
      editForm.style.display = (editForm.style.display === 'none' || !editForm.style.display) ? 'block' : 'none'
    })
  }

  if (editForm) {
    editForm.addEventListener('submit', function(){
      var payload = {
        title: eTitle.value.trim(),
        type: eType.value,
        period: ePeriod.value,
        condition: eCondition.value.trim(),
        description: eDescription.value.trim(),
        locationNotes: eNotes.value.trim(),
        lat: eLat.value ? parseFloat(eLat.value) : null,
        lng: eLng.value ? parseFloat(eLng.value) : null,
        creditKnownArtist: !!eArtist.checked,
        sensitive: !!eSensitive.checked,
        privateLand: !!ePrivate.checked
      }
      fetch('../../api/art.php?id=' + encodeURIComponent(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r){ return r.json() }).then(function(){
        location.reload()
      }).catch(function(err){ alert('Failed to save: ' + err) })
    })
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function(){
      if (!confirm('Delete this art?')) return
      fetch('../../api/art.php?id=' + encodeURIComponent(id), { method: 'DELETE' })
        .then(function(r){ return r.json() })
        .then(function(){ window.location.href = './ArtsResult.html' })
        .catch(function(err){ alert('Failed to delete: ' + err) })
    })
  }
})()


