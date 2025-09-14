;(function(){
  // Check if user is logged in
  if (!SessionManager.isLoggedIn()) {
    window.location.href = './UserLogIn.html';
    return;
  }

  // Get submission ID from URL
  var params = new URLSearchParams(location.search)
  var submissionId = params.get('id')
  if (!submissionId) {
    alert('No submission ID provided')
    window.location.href = './UserProfile.html'
    return
  }

  var form = document.getElementById('editForm')
  if (!form) return

  // Load the submission data
  function loadSubmission() {
    try {
      var submissions = localStorage.getItem('iaa_arts_v1')
      if (!submissions) return null
      var allArts = JSON.parse(submissions)
      return allArts.find(function(art){ return art.id === submissionId })
    } catch(_) {
      return null
    }
  }

  // Verify user owns this submission
  var currentUser = SessionManager.getCurrentUser()
  var submission = loadSubmission()
  if (!submission || !currentUser) {
    alert('Submission not found')
    window.location.href = './UserProfile.html'
    return
  }

  if (submission.submittedBy !== currentUser.email) {
    alert('You do not have permission to edit this submission')
    window.location.href = './UserProfile.html'
    return
  }

  // Populate form fields with existing data
  function populateForm() {
    document.getElementById('artTitle').value = submission.title || ''
    document.getElementById('artType').value = submission.type || 'Cave Art'
    document.getElementById('artPeriod').value = submission.period || 'Ancient'
    document.getElementById('artCondition').value = submission.condition || ''
    document.getElementById('artDescription').value = submission.description || ''
    document.getElementById('locationNotes').value = submission.locationNotes || ''
    document.getElementById('lat').value = submission.lat || ''
    document.getElementById('lng').value = submission.lng || ''
    document.getElementById('creditKnownArtist').checked = !!submission.creditKnownArtist
    document.getElementById('sensitive').checked = !!submission.sensitive
    document.getElementById('privateLand').checked = !!submission.privateLand

    // Show current image
    var currentImagePreview = document.getElementById('currentImagePreview')
    if (currentImagePreview && submission.image) {
      currentImagePreview.src = submission.image
      currentImagePreview.style.display = 'block'
    }
  }

  // Initialize map (same logic as submission.js)
  var mapEl = document.getElementById('submissionMap')
  var latEl = document.getElementById('lat')
  var lngEl = document.getElementById('lng')
  var imageInput = document.getElementById('imageInput')
  var imagePreview = document.getElementById('imagePreview')

  var marker = null
  var map = null
  var locationNotesInput = document.getElementById('locationNotes')
  
  if (window.L && mapEl) {
    map = L.map('submissionMap', {
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
          reverseGeocode(p.lat, p.lng)
        })
      }
      latEl.value = latlng.lat.toFixed(6)
      lngEl.value = latlng.lng.toFixed(6)
    }

    map.on('click', function(e){ setMarker(e.latlng) })

    // Set existing marker if coordinates exist
    function setExistingMarker() {
      var lat = parseFloat(submission.lat)
      var lng = parseFloat(submission.lng)
      if (!isNaN(lat) && !isNaN(lng)) {
        var latlng = L.latLng(lat, lng)
        map.setView(latlng, 15)
        setMarker(latlng)
      }
    }

    // Geocoding functions (same as submission.js)
    function geocodeAddress(address) {
      if (!address || address.trim() === '') return
      
      locationNotesInput.style.borderColor = '#ffa500'
      locationNotesInput.placeholder = 'Searching for location...'
      
      var url = 'https://corsproxy.io/?' + encodeURIComponent('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + '&limit=1&addressdetails=1')
      
      fetch(url)
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status)
          }
          return response.json()
        })
        .then(function(data) {
          locationNotesInput.style.borderColor = ''
          locationNotesInput.placeholder = 'Enter address or location'
          
          if (data && data.length > 0) {
            var lat = parseFloat(data[0].lat)
            var lng = parseFloat(data[0].lng || data[0].lon)
            
            if (isNaN(lat) || isNaN(lng)) {
              locationNotesInput.style.borderColor = '#ff4444'
              alert('Invalid coordinates received.')
              setTimeout(function() {
                locationNotesInput.style.borderColor = ''
              }, 3000)
              return
            }
            
            var latlng = L.latLng(lat, lng)
            map.setView(latlng, 15)
            setMarker(latlng)
            locationNotesInput.value = data[0].display_name
          } else {
            locationNotesInput.style.borderColor = '#ff4444'
            alert('Address not found. Please try a different location description.')
            setTimeout(function() {
              locationNotesInput.style.borderColor = ''
            }, 3000)
          }
        })
        .catch(function(error) {
          console.error('Geocoding error:', error)
          locationNotesInput.style.borderColor = '#ff4444'
          alert('Error finding location: ' + error.message)
          setTimeout(function() {
            locationNotesInput.style.borderColor = ''
          }, 3000)
        })
    }

    function reverseGeocode(lat, lng) {
      var proxyUrl = 'https://api.allorigins.win/raw?url='
      var nominatimUrl = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&addressdetails=1'
      
      fetch(proxyUrl + encodeURIComponent(nominatimUrl))
        .then(function(response) {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.json()
        })
        .then(function(data) {
          if (data && data.display_name) {
            locationNotesInput.value = data.display_name
          }
        })
        .catch(function(error) {
          console.error('Reverse geocoding error:', error)
        })
    }

    // Location input handlers
    if (locationNotesInput) {
      var geocodeTimeout
      locationNotesInput.addEventListener('input', function() {
        clearTimeout(geocodeTimeout)
        geocodeTimeout = setTimeout(function() {
          var address = locationNotesInput.value.trim()
          if (address.length > 3) {
            geocodeAddress(address)
          }
        }, 1000)
      })

      locationNotesInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault()
          clearTimeout(geocodeTimeout)
          var address = locationNotesInput.value.trim()
          if (address) {
            geocodeAddress(address)
          }
        }
      })

      locationNotesInput.addEventListener('input', function() {
        if (locationNotesInput.value.trim() === '') {
          if (marker) {
            map.removeLayer(marker)
            marker = null
          }
          latEl.value = ''
          lngEl.value = ''
        }
      })
    }

    // Set existing marker after map is initialized
    setTimeout(setExistingMarker, 100)
  }

  // Image handling
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

  function getBool(id){ return !!document.getElementById(id).checked }
  function getVal(id){ return document.getElementById(id).value.trim() }

  function updateSubmission(updatedData) {
    try {
      var submissions = localStorage.getItem('iaa_arts_v1')
      if (!submissions) return false
      var allArts = JSON.parse(submissions)
      var index = allArts.findIndex(function(art){ return art.id === submissionId })
      if (index === -1) return false
      
      // Update the submission
      allArts[index] = Object.assign(allArts[index], updatedData)
      localStorage.setItem('iaa_arts_v1', JSON.stringify(allArts))
      return true
    } catch(_) {
      return false
    }
  }

  function deleteSubmission() {
    try {
      var submissions = localStorage.getItem('iaa_arts_v1')
      if (!submissions) return false
      var allArts = JSON.parse(submissions)
      var updatedArts = allArts.filter(function(art){ return art.id !== submissionId })
      localStorage.setItem('iaa_arts_v1', JSON.stringify(updatedArts))
      return true
    } catch(_) {
      return false
    }
  }

  // Form submission handler
  form.addEventListener('submit', function(e){
    e.preventDefault()
    
    var updatedData = {
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
      creditKnownArtist: getBool('creditKnownArtist')
    }

    // Update image only if a new one is selected
    if (imagePreview && imagePreview.src && imagePreview.style.display !== 'none') {
      updatedData.image = imagePreview.src
    }

    if (updateSubmission(updatedData)) {
      alert('Submission updated successfully!')
      window.location.href = './UserProfile.html'
    } else {
      alert('Failed to update submission. Please try again.')
    }
  })

  // Cancel button handler
  document.getElementById('cancelBtn').addEventListener('click', function(){
    window.location.href = './UserProfile.html'
  })

  // Delete button handler
  document.getElementById('deleteBtn').addEventListener('click', function(){
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return
    }
    
    if (deleteSubmission()) {
      alert('Submission deleted successfully.')
      window.location.href = './UserProfile.html'
    } else {
      alert('Failed to delete submission. Please try again.')
    }
  })

  // Initialize form with existing data
  populateForm()
})();