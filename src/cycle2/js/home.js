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
        list.forEach(function(item){
          var lat = item && item.lat
          var lng = item && item.lng
          if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
            var marker = L.marker([lat, lng]).addTo(map)
            var title = item.title || 'Untitled'
            var addr = item.locationNotes || ''
            var link = './ArtDetail.html?id=' + encodeURIComponent(item.id)
            var popupHtml = '<div style="min-width:200px">'
              + '<div style="font-weight:600; margin-bottom:4px">' + title + '</div>'
              + (addr ? '<div style="color:#666; margin-bottom:6px">' + addr + '</div>' : '')
              + '<a href="' + link + '" style="color:#0b5cff">View details</a>'
              + '</div>'
            marker.bindPopup(popupHtml)
            markers.push(marker)
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
        if (window.console && console.log) console.log('Selected coordinates:', coords)
      })
    }
    pinMarker.bindPopup('Lat, Lng: ' + formatLatLng(e.latlng)).openPopup()
    if (window.console && console.log) console.log('Selected coordinates:', e.latlng)
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


