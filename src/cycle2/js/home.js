// Leaflet map setup for Home page
// Expects a div with id="map" present in the DOM.

;(function(){
  if (!window.L) return

  var map = L.map('map', {
    center: [51.505, -0.09],
    zoom: 13
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  var pinMarker = null
  function formatLatLng(latlng){
    return latlng.lat.toFixed(6) + ', ' + latlng.lng.toFixed(6)
  }

  // Expose map so other modules (if needed) can access it
  window.HomeMap = map

  // Load all arts and display their addresses on the map
  ;(function(){
    function apiBase(){ return '../../api/art.php' }

    function isFiniteNumber(n){ return typeof n === 'number' && isFinite(n) }

    fetch(apiBase()).then(function(r){ return r.json() }).then(function(list){
      var markers = []
      if (Array.isArray(list)) {
        // Helper: resolve display level from item fields
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

        // Helper: round coordinate to one decimal (~10km) for region display
        function approx(n){ return Math.round(n * 10) / 10 }

        list.forEach(function(item){
          var lat = item && item.lat
          var lng = item && item.lng
          var hasCoords = isFiniteNumber(lat) && isFiniteNumber(lng)
          var level = resolveDisplayLevel(item)
          var title = item.title || 'Untitled'
          var addr = item.locationNotes || ''
          var link = './ArtDetail.html?id=' + encodeURIComponent(item.id)

          // Skip when hidden, or no coordinates provided
          if (!hasCoords && (level === 'exact' || level === 'locality' || level === 'region')) return
          if (level === 'hidden') return

          if (level === 'exact') {
            var m1 = L.marker([lat, lng]).addTo(map)
            var html1 = '<div style="min-width:200px">'
              + '<div style="font-weight:600; margin-bottom:4px">' + title + '</div>'
              + (addr ? '<div style="color:#666; margin-bottom:6px">' + addr + '</div>' : '')
              + '<a href="' + link + '" style="color:#0b5cff">View details</a>'
              + '</div>'
            m1.bindPopup(html1)
            markers.push(m1)
            return
          }

          if (level === 'locality') {
            // Draw a circle (e.g., 1000m radius) to indicate approximate area
            var c = L.circle([lat, lng], { radius: 1000, color: '#2a5b9d', fillColor: '#2a5b9d', fillOpacity: 0.15 }).addTo(map)
            c.bindPopup('<div style="min-width:200px">'
              + '<div style="font-weight:600; margin-bottom:4px">' + title + '</div>'
              + '<div style="color:#666; margin-bottom:6px">Approximate area (location intentionally obfuscated)</div>'
              + '<a href="' + link + '" style="color:#0b5cff">View details</a>'
              + '</div>')
            markers.push(c)
            return
          }

          if (level === 'region') {
            // Place a marker at an approximated coordinate (rounded to 1 decimal)
            var latA = approx(lat)
            var lngA = approx(lng)
            var m2 = L.marker([latA, lngA]).addTo(map)
            var html2 = '<div style="min-width:200px">'
              + '<div style="font-weight:600; margin-bottom:4px">' + title + '</div>'
              + '<div style="color:#666; margin-bottom:6px">Approximate location (region-level)</div>'
              + '<a href="' + link + '" style="color:#0b5cff">View details</a>'
              + '</div>'
            m2.bindPopup(html2)
            markers.push(m2)
            return
          }
        })
      }

      // Fit map to markers if any; otherwise keep default view
      if (markers.length > 0) {
        var group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.2))
      }
    }).catch(function(err){
      if (window.console && console.error) console.error('Failed to load arts for map:', err)
      try{
        var mapEl = document.getElementById('map')
        if (mapEl){
          var n = document.createElement('div')
          n.className = 'map-notice notice notice--error'
          n.textContent = 'Failed to load map data. Please try again later.'
          mapEl.appendChild(n)
        }
      }catch(_){ }
    })
  })()

  map.on('click', function (e) {
    if (pinMarker) {
      pinMarker.setLatLng(e.latlng)
    } else {
      pinMarker = L.marker(e.latlng, { draggable: true }).addTo(map)
      pinMarker.on('dragend', function(){
        var coords = pinMarker.getLatLng()
        pinMarker.bindPopup('Lat, Lng: ' + formatLatLng(coords)).openPopup()
      })
    }
    pinMarker.bindPopup('Lat, Lng: ' + formatLatLng(e.latlng)).openPopup()
    
  })
})();

// Featured Arts functionality for Home page
;(function(){
  var container = document.getElementById('featuredArtsContainer')
  if (!container) return

  function apiBase(){ return '../../api/art.php' }

  function createCard(item){
    var a = document.createElement('a')
    a.className = 'card'
    a.href = './ArtDetail.html?id=' + encodeURIComponent(item.id)
    var imgWrap = document.createElement('div')
    imgWrap.className = 'card__img'
    var img = document.createElement('img')
    img.src = item.image || '../test.jpg'
    img.alt = 'art'
    imgWrap.appendChild(img)

    var body = document.createElement('div')
    body.className = 'card__body'
    var h3 = document.createElement('h3')
    h3.className = 'card__title'
    h3.textContent = item.title || 'Untitled'
    var p = document.createElement('p')
    p.className = 'card__desc'
    p.textContent = item.description || ''
    body.appendChild(h3)
    body.appendChild(p)

    a.appendChild(imgWrap)
    a.appendChild(body)
    return a
  }

  function render(list){
    container.innerHTML = ''
    if (!Array.isArray(list) || list.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'card__desc'
      empty.textContent = 'No arts yet. Be the first to submit!'
      container.appendChild(empty)
      return
    }
    // Show only the first 3 arts as featured
    var featuredArts = list.slice(0, 3)
    featuredArts.forEach(function(item){ container.appendChild(createCard(item)) })
  }

  fetch(apiBase()).then(function(r){ return r.json() }).then(function(list){
    var artsList = Array.isArray(list) ? list : []
    render(artsList)
  }).catch(function(err){
    container.innerHTML = '<div class="card__desc">Failed to load: ' + err + '</div>'
  })
})();
