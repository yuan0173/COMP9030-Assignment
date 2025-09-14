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

  // Load from localStorage instead of API (C2 frontend-only approach)
  function loadArtworkData() {
    try {
      var allData = localStorage.getItem('iaa_arts_v1')
      var allArts = allData ? JSON.parse(allData) : []
      var item = allArts.find(function(art){ return art.id === id })
      
      if (!item) {
        document.body.innerHTML = '<main class="container page-section"><div class="notice notice--error">Artwork not found or unavailable.</div></main>'
        return
      }
      
      displayArtwork(item)
    } catch(err) {
      document.body.innerHTML = '<main class="container page-section"><div class="notice notice--error">Failed to load artwork data.</div></main>'
    }
  }

  function displayArtwork(item) {
    titleEl.textContent = item.title || 'Untitled'
    breadcrumb.textContent = item.title || 'Untitled'
    descEl.textContent = item.description || ''
    typeEl.textContent = item.type || ''
    periodEl.textContent = item.period || ''
    condEl.textContent = item.condition || ''
    // Legacy single-image fill (will be replaced by slider below)
    if (imgEl) { imgEl.src = item.image || '../test.jpg' }
    notesEl.textContent = item.locationNotes || ''
    var flags = []
    if (item.creditKnownArtist) flags.push('Credited artist')
    if (item.sensitive) flags.push('Culturally sensitive')
    if (item.privateLand) flags.push('Private land')
    flagsEl.textContent = flags.join(' • ')

    if (window.L) {
      var mapEl = document.getElementById('detailMap')
      var map = L.map('detailMap', { center: [ -33.8688, 151.2093 ], zoom: 11 })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map)

      // Resolve display level: prefer item.display_level, otherwise infer from flags
      function resolveDisplayLevel(it){
        var dl = (it && typeof it.display_level === 'string') ? it.display_level.toLowerCase() : ''
        if (dl === 'exact' || dl === 'locality' || dl === 'region' || dl === 'hidden') return dl
        var sensitive = !!(it && it.sensitive)
        var priv = !!(it && it.privateLand)
        if (sensitive && priv) return 'hidden'
        if (sensitive) return 'locality'
        if (priv) return 'region'
        return 'exact'
      }

      function approx(n){ return Math.round(n * 10) / 10 }

      var level = resolveDisplayLevel(item)
      var hasCoords = (typeof item.lat === 'number' && typeof item.lng === 'number')

      if (!hasCoords) {
        // No coordinates provided — keep default view and note
        if (flagsEl) flagsEl.textContent += (flagsEl.textContent ? ' • ' : '') + 'No coordinates available'
      } else if (level === 'hidden') {
        // Hide exact position; show a textual notice
        if (flagsEl) flagsEl.textContent += (flagsEl.textContent ? ' • ' : '') + 'Location hidden to protect sensitive or private site'
        // Do not place markers/circles; keep a generic view
        map.setView([ item.lat, item.lng ], 10)
      } else if (level === 'locality') {
        var center = [ item.lat, item.lng ]
        L.circle(center, { radius: 1000, color: '#2a5b9d', fillColor: '#2a5b9d', fillOpacity: 0.15 }).addTo(map)
        map.setView(center, 13)
        if (flagsEl) flagsEl.textContent += (flagsEl.textContent ? ' • ' : '') + 'Approximate area shown (location obfuscated)'
      } else if (level === 'region') {
        var latA = approx(item.lat)
        var lngA = approx(item.lng)
        var approxLL = [ latA, lngA ]
        L.marker(approxLL).addTo(map)
        map.setView(approxLL, 11)
        if (flagsEl) flagsEl.textContent += (flagsEl.textContent ? ' • ' : '') + 'Approximate region shown'
      } else {
        // exact
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

    // Build gallery
    buildGallery(item)
  }

  // Load artwork data
  loadArtworkData()

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

// Minimal gallery/slider implementation without third-party libraries
function buildGallery(item){
  try{
    var gallery = document.querySelector('.gallery')
    if (!gallery) return

    var images = []
    if (Array.isArray(item.images) && item.images.length){
      images = item.images.filter(Boolean)
    } else if (item.image) {
      images = [ item.image ]
    } else {
      images = [ '../test.jpg' ]
    }

    // If only one image, render a simple image and return (no controls)
    if (images.length <= 1){
      gallery.innerHTML = ''
      var simple = document.createElement('img')
      simple.src = images[0]
      simple.alt = (item.title || 'Artwork')
      simple.style.width = '100%'
      simple.style.height = '100%'
      simple.style.objectFit = 'cover'
      simple.style.borderRadius = '12px'
      gallery.appendChild(simple)
      return
    }

    // Build slider structure
    gallery.innerHTML = ''
    var slider = document.createElement('div')
    slider.className = 'slider'
    slider.setAttribute('role','region')
    slider.setAttribute('aria-label','Artwork gallery')

    var track = document.createElement('div')
    track.className = 'slider__track'
    slider.appendChild(track)

    images.forEach(function(src, i){
      var slide = document.createElement('div')
      slide.className = 'slider__slide'
      var img = document.createElement('img')
      img.src = src
      img.alt = (item.title || 'Artwork') + ' - image ' + (i+1)
      slide.appendChild(img)
      track.appendChild(slide)
    })

    var nav = document.createElement('div')
    nav.className = 'slider__nav'
    var prev = document.createElement('button')
    prev.className = 'slider__btn'
    prev.type = 'button'
    prev.setAttribute('aria-label','Previous image')
    prev.textContent = '‹'
    var next = document.createElement('button')
    next.className = 'slider__btn'
    next.type = 'button'
    next.setAttribute('aria-label','Next image')
    next.textContent = '›'
    nav.appendChild(prev)
    nav.appendChild(next)
    slider.appendChild(nav)

    var dots = document.createElement('div')
    dots.className = 'slider__dots'
    var dotButtons = []
    images.forEach(function(_, i){
      var dot = document.createElement('button')
      dot.className = 'slider__dot'
      dot.type = 'button'
      dot.setAttribute('aria-label','Go to image ' + (i+1))
      if (i === 0) dot.setAttribute('aria-current','true')
      dots.appendChild(dot)
      dotButtons.push(dot)
    })
    slider.appendChild(dots)

    gallery.appendChild(slider)

    var index = 0
    function update(){
      var offset = -index * 100
      track.style.transform = 'translateX(' + offset + '%)'
      dotButtons.forEach(function(b, i){ b.setAttribute('aria-current', i === index ? 'true' : 'false') })
    }
    function go(n){ index = (n + images.length) % images.length; update() }
    function nextSlide(){ go(index + 1) }
    function prevSlide(){ go(index - 1) }

    prev.addEventListener('click', prevSlide)
    next.addEventListener('click', nextSlide)
    dotButtons.forEach(function(b, i){ b.addEventListener('click', function(){ go(i) }) })

    // Keyboard support
    slider.tabIndex = 0
    slider.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide() }
    })

    // Auto-play with pause on hover/focus
    var timer = setInterval(nextSlide, 5000)
    function pause(){ clearInterval(timer); timer = null }
    function resume(){ if (!timer) timer = setInterval(nextSlide, 5000) }
    slider.addEventListener('mouseenter', pause)
    slider.addEventListener('mouseleave', resume)
    slider.addEventListener('focusin', pause)
    slider.addEventListener('focusout', resume)

    update()
  }catch(err){
    if (window.console && console.error) console.error('Failed to build gallery:', err)
  }
}
