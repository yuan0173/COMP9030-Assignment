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


