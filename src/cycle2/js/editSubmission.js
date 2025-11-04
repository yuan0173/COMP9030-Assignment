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

  // Load the submission data from API
  function loadSubmission(callback) {
    fetch('/api/arts.php?id=' + submissionId)
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to fetch submission')
        }
        return response.json()
      })
      .then(function(data) {
        callback(data)
      })
      .catch(function(error) {
        console.error('Error loading submission:', error)
        callback(null)
      })
  }

  // Get current user session from backend
  function getCurrentUserFromBackend(callback) {
    fetch('/api/auth.php?action=session', {
      credentials: 'include'
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      callback(data.user)
    })
    .catch(function(error) {
      console.error('Error getting session:', error)
      callback(null)
    })
  }

  // Verify user owns this submission
  getCurrentUserFromBackend(function(currentUser) {
    if (!currentUser) {
      alert('User not logged in')
      window.location.href = './UserProfile.html'
      return
    }

    loadSubmission(function(data) {
      submission = data
      if (!submission) {
        alert('Submission not found')
        window.location.href = './UserProfile.html'
        return
      }

      // Check ownership - for API data, use changed_by field
      var userRole = currentUser.role
      var currentUserId = currentUser.id

      // Allow admin to edit any submission, or user to edit their own submissions
      if (userRole !== 'admin' && submission.changed_by !== currentUserId) {
        alert('You do not have permission to edit this submission')
        window.location.href = './UserProfile.html'
        return
      }

      // Initialize form and map with loaded data
      populateForm(data)
      initializeMap()
      initializeImageHandling()
      setTimeout(function() { setExistingMarker(data) }, 100)
    })
  })

  // Populate form fields with existing data
  function populateForm(submissionData) {
    document.getElementById('artTitle').value = submissionData.title || ''
    document.getElementById('artType').value = submissionData.type || 'Cave Art'
    document.getElementById('artPeriod').value = submissionData.period || 'Ancient'
    document.getElementById('artCondition').value = submissionData.condition || ''
    document.getElementById('artDescription').value = submissionData.description || ''
    document.getElementById('locationNotes').value = submissionData.locationNotes || ''
    document.getElementById('lat').value = submissionData.lat || ''
    document.getElementById('lng').value = submissionData.lng || ''
    document.getElementById('creditKnownArtist').checked = !!submissionData.creditKnownArtist
    document.getElementById('sensitive').checked = !!submissionData.sensitive
    document.getElementById('privateLand').checked = !!submissionData.privateLand

    // Show current image
    var currentImagePreview = document.getElementById('currentImagePreview')
    if (currentImagePreview && submissionData.image) {
      currentImagePreview.src = submissionData.image
      currentImagePreview.style.display = 'block'
    }
  }

  // Global variables for map and form elements
  var mapEl = document.getElementById('submissionMap')
  var latEl = document.getElementById('lat')
  var lngEl = document.getElementById('lng')
  var imageInput = document.getElementById('imageInput')
  var imagePreview = document.getElementById('imagePreview')
  var locationNotesInput = document.getElementById('locationNotes')
  var marker = null
  var map = null

  // Initialize map
  function initializeMap() {
    if (!window.L || !mapEl) return
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
    function setExistingMarker(submissionData) {
      var lat = parseFloat(submissionData.lat)
      var lng = parseFloat(submissionData.lng)
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
      
    // Use backend proxy to OpenStreetMap Nominatim
    var url = '/api/geo.php?action=search&q=' + encodeURIComponent(address) + '&limit=1'
      
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
    // Reverse geocoding via backend proxy
    var reverseUrl = '/api/geo.php?action=reverse&lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lng)
    
    fetch(reverseUrl)
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

  // Initialize image handling
  function initializeImageHandling() {
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
  }

  function getBool(id){ return !!document.getElementById(id).checked }
  function getVal(id){ return document.getElementById(id).value.trim() }

  function updateSubmission(updatedData, callback) {
    fetch('/api/arts.php?id=' + submissionId, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updatedData)
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      if (data.error) {
        callback(false, data.error)
      } else {
        callback(true, null)
      }
    })
    .catch(function(error) {
      console.error('Update error:', error)
      callback(false, 'Network error')
    })
  }

  function deleteSubmission(callback) {
    fetch('/api/arts.php?id=' + submissionId, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({})
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      if (data.error) {
        callback(false, data.error)
      } else {
        callback(true, null)
      }
    })
    .catch(function(error) {
      console.error('Delete error:', error)
      callback(false, 'Network error')
    })
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

    updateSubmission(updatedData, function(success, error) {
      if (success) {
        alert('Submission updated successfully!')
        window.location.href = './UserProfile.html'
      } else {
        alert('Failed to update submission: ' + (error || 'Please try again.'))
      }
    })
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
    
    deleteSubmission(function(success, error) {
      if (success) {
        alert('Submission deleted successfully.')
        window.location.href = './UserProfile.html'
      } else {
        alert('Failed to delete submission: ' + (error || 'Please try again.'))
      }
    })
  })

})();
