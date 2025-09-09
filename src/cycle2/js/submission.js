;(function(){
  var form = document.getElementById('submissionForm')
  if (!form) return

  var mapEl = document.getElementById('submissionMap')
  var latEl = document.getElementById('lat')
  var lngEl = document.getElementById('lng')
  var imageInput = document.getElementById('imageInput')
  var imagePreview = document.getElementById('imagePreview')

  var marker = null
  if (window.L && mapEl) {
    var map = L.map('submissionMap', {
      center: [ -33.8688, 151.2093 ],
      zoom: 11
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    function setMarker(latlng){
      if (marker) marker.setLatLng(latlng)
      else marker = L.marker(latlng, { draggable: true }).addTo(map)
      if (marker) {
        marker.off('dragend')
        marker.on('dragend', function(){
          var p = marker.getLatLng()
          latEl.value = p.lat.toFixed(6)
          lngEl.value = p.lng.toFixed(6)
        })
      }
      latEl.value = latlng.lat.toFixed(6)
      lngEl.value = latlng.lng.toFixed(6)
    }

    map.on('click', function(e){ setMarker(e.latlng) })
  }

  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', function(){
      var file = imageInput.files && imageInput.files[0]
      if (!file) { imagePreview.style.display = 'none'; imagePreview.src = ''; return }
      var reader = new FileReader()
      reader.onload = function(){
        imagePreview.src = reader.result
        imagePreview.style.display = 'block'
      }
      reader.readAsDataURL(file)
    })
  }

  function apiBase(){
    // index.php injects <base href="cycle2/Pages/"> so ../ resolves to src/cycle2
    // API is at ../../api/art.php relative to Pages/* files
    return '../../api/art.php'
  }

  function getBool(id){ return !!document.getElementById(id).checked }
  function getVal(id){ return document.getElementById(id).value.trim() }

  form.addEventListener('submit', function(){
    var payload = {
      title: getVal('artTitle'),
      type: getVal('artType'),
      period: getVal('artPeriod'),
      condition: getVal('artCondition'),
      description: getVal('artDescription'),
      locationNotes: getVal('locationNotes'),
      lat: getVal('lat') || null,
      lng: getVal('lng') || null,
      sensitive: getBool('sensitive'),
      privateLand: getBool('privateLand'),
      creditKnownArtist: getBool('creditKnownArtist'),
      image: imagePreview && imagePreview.src ? imagePreview.src : ''
    }

    fetch(apiBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r){ return r.json() }).then(function(res){
      if (res && res.id) {
        window.location.href = './ArtDetail.html?id=' + encodeURIComponent(res.id)
      } else {
        alert('Failed to submit: ' + (res && res.error ? res.error : 'Unknown error'))
      }
    }).catch(function(err){
      alert('Network error: ' + err)
    })
  })
})();


