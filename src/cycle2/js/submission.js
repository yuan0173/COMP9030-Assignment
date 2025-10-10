;(function(){
  'use strict'

  // Check if user is logged in
  if (!SessionManager.isLoggedIn()) {
    window.location.href = './UserLogIn.html';
    return;
  }

  var form = document.getElementById('submissionForm')
  if (!form) return

  /**
   * Helper function to clear all existing field errors on the form.
   * This ensures we start the validation process clean.
   */
  function clearAllFieldErrors(form){
    // Get all elements that might have an error box associated with them
    var fields = form.querySelectorAll('#artTitle, #artType, #artPeriod, #artCondition, #artDescription, #lat, #lng, #locationNotes')
    if (window.Validate && Validate.clearFieldErrors) {
      fields.forEach(function(el){
        Validate.clearFieldErrors(el)
      })
    }
  }

  // Populate type/period selects from admin-configured taxonomies when available
  ;(function initTaxonomies(){
    try{
      if (!window.AdminData) return
      var types = AdminData.get(AdminData.KEYS.types) || []
      var periods = AdminData.get(AdminData.KEYS.periods) || []
      var typeSel = document.getElementById('artType')
      var periodSel = document.getElementById('artPeriod')
      function fillSelect(sel, items){
        if (!sel || !Array.isArray(items) || items.length === 0) return
        var current = sel.value
        sel.innerHTML = ''
        items.forEach(function(name){
          var opt = document.createElement('option')
          opt.value = name
          opt.textContent = name
          sel.appendChild(opt)
        })
        // Try to preserve current value if present
        if (current && items.indexOf(current) !== -1) sel.value = current
      }
      fillSelect(typeSel, types)
      fillSelect(periodSel, periods)
    }catch(_){ }
  })()

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
          // Reverse geocode to update location notes
          reverseGeocode(p.lat, p.lng)
        })
      }
      latEl.value = latlng.lat.toFixed(6)
      lngEl.value = latlng.lng.toFixed(6)
    }

    map.on('click', function(e){ setMarker(e.latlng) })

    // Function to geocode address to coordinates
    function geocodeAddress(address) {
      if (!address || address.trim() === '') return
      
      // Show loading state
      locationNotesInput.style.borderColor = '#ffa500'
      locationNotesInput.placeholder = 'Searching for location...'
      
      // Use a simple approach with a working CORS proxy
      // Use backend proxy to OpenStreetMap Nominatim
      var url = `/api/geo.php?action=search&q=${encodeURIComponent(address)}&limit=1`
      
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.status)
          }
          return response.json()
        })
        .then(data => {
          // Reset loading state
          locationNotesInput.style.borderColor = ''
          locationNotesInput.placeholder = 'Notes (optional)'
          
          
          if (data && data.length > 0) {
            // Handle both 'lat'/'lng' and 'lat'/'lon' field names
            var lat = parseFloat(data[0].lat)
            var lng = parseFloat(data[0].lng || data[0].lon) // Try 'lng' first, then 'lon'
            
            
            // Validate coordinates
            if (isNaN(lat) || isNaN(lng)) {
              console.error('Invalid coordinates:', { lat: lat, lng: lng, raw: data[0] })
              locationNotesInput.style.borderColor = '#ff4444'
              alert('Invalid coordinates received. Available fields: ' + Object.keys(data[0]).join(', '))
              setTimeout(function() {
                locationNotesInput.style.borderColor = ''
              }, 3000)
              return
            }
            
            var latlng = L.latLng(lat, lng)
            
            // Update map view and marker
            map.setView(latlng, 15)
            setMarker(latlng)
            
            // Update location notes with the found address
            locationNotesInput.value = data[0].display_name
          } else {
            locationNotesInput.style.borderColor = '#ff4444'
            alert('Address not found. Please try a different location description.')
            setTimeout(function() {
              locationNotesInput.style.borderColor = ''
            }, 3000)
          }
        })
        .catch(error => {
          console.error('Geocoding error:', error)
          locationNotesInput.style.borderColor = '#ff4444'
          locationNotesInput.placeholder = 'Notes (optional)'
          alert('Error finding location: ' + error.message)
          setTimeout(function() {
            locationNotesInput.style.borderColor = ''
          }, 3000)
        })
    }

    // Function to reverse geocode coordinates to address
    function reverseGeocode(lat, lng) {
      // Reverse geocoding via backend proxy
      var reverseUrl = `/api/geo.php?action=reverse&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
      
      fetch(reverseUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.json()
        })
        .then(data => {
          if (data && data.display_name) {
            locationNotesInput.value = data.display_name
          }
        })
        .catch(error => {
          console.error('Reverse geocoding error:', error)
        })
    }

    // Add event listener for location notes input
    if (locationNotesInput) {
      // Use debounced input to avoid too many API calls
      var geocodeTimeout
      locationNotesInput.addEventListener('input', function() {
        clearTimeout(geocodeTimeout)
        geocodeTimeout = setTimeout(function() {
          var address = locationNotesInput.value.trim()
          if (address.length > 3) { // Only geocode if there's enough text
            geocodeAddress(address)
          }
        }, 1000) // Wait 1 second after user stops typing
      })

      // Also add enter key support for immediate geocoding
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

      // Handle clearing the location
      locationNotesInput.addEventListener('input', function() {
        if (locationNotesInput.value.trim() === '') {
          // Clear marker and coordinates when input is empty
          if (marker) {
            map.removeLayer(marker)
            marker = null
          }
          latEl.value = ''
          lngEl.value = ''
        }
      })
    }
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

  form.addEventListener('submit', async function(e){
    e.preventDefault()
    
    // Clear any previous global form errors and field-level errors
    if (window.Validate) {
      Validate.clearError(form)
      clearAllFieldErrors(form) 
    }
    
    var btn = document.getElementById('submitBtn')
    var currentUser = SessionManager.getCurrentUser()
    if (!currentUser) {
      alert('Please log in to submit artwork')
      return
    }

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
      // Note: Image validation (e.g., size check) should ideally happen here too, 
      // but is omitted for simplicity based on original code structure.
      image: imagePreview && imagePreview.src ? imagePreview.src : ''
    }

    // Frontend validation (friendly, human-readable)
    try{
      if (window.Validate && Validate.showFieldError){
        
        var artTitleEl = document.getElementById('artTitle')
        if (!Validate.isRequired(payload.title)) {
          Validate.showFieldError(artTitleEl, 'Please enter a title.')
          artTitleEl.focus() // Focus on the error field
          return 
        }
        if (!Validate.maxLen(payload.title, 255)) {
          Validate.showFieldError(artTitleEl, 'Title must be 255 characters or less.')
          artTitleEl.focus() // Focus on the error field
          return
        }

        var artTypeEl = document.getElementById('artType')
        if (!Validate.isRequired(payload.type)) {
          Validate.showFieldError(artTypeEl, 'Please select a type.')
          artTypeEl.focus() // Focus on the error field
          return
        }
        if (!Validate.maxLen(payload.type, 100)) {
          Validate.showFieldError(artTypeEl, 'Type is too long.')
          artTypeEl.focus() // Focus on the error field
          return
        }

        var artPeriodEl = document.getElementById('artPeriod')
        if (!Validate.isRequired(payload.period)) {
          Validate.showFieldError(artPeriodEl, 'Please select a period.')
          artPeriodEl.focus() // Focus on the error field
          return
        }
        if (!Validate.maxLen(payload.period, 100)) {
          Validate.showFieldError(artPeriodEl, 'Period is too long.')
          artPeriodEl.focus() // Focus on the error field
          return
        }

        var artConditionEl = document.getElementById('artCondition')
        if (!Validate.isRequired(payload.condition)) {
          Validate.showFieldError(artConditionEl, 'Please enter a condition/quality.')
          artConditionEl.focus() // Focus on the error field
          return
        }
        if (!Validate.maxLen(payload.condition, 100)) {
          Validate.showFieldError(artConditionEl, 'Condition is too long.')
          artConditionEl.focus() // Focus on the error field
          return
        }

        var artDescriptionEl = document.getElementById('artDescription')
        if (!Validate.isRequired(payload.description)) {
          Validate.showFieldError(artDescriptionEl, 'Please enter a description.')
          artDescriptionEl.focus() // Focus on the error field
          return
        }

        // Latitude validation
        var latEl = document.getElementById('lat')
        if (payload.lat !== null && payload.lat !== '') {
          if (!Validate.inRange(payload.lat, -90, 90)) {
            Validate.showFieldError(locationNotesInput, 'Latitude must be between -90 and 90.')
            locationNotesInput.focus() // Focus on related field
            return
          }
        }
        
        // Longitude validation
        var lngEl = document.getElementById('lng')
        if (payload.lng !== null && payload.lng !== '') {
          if (!Validate.inRange(payload.lng, -180, 180)) {
            Validate.showFieldError(locationNotesInput, 'Longitude must be between -180 and 180.')
            locationNotesInput.focus() // Focus on related field
            return
          }
        }
      }
    }catch(err){ 
      if (window.Validate){ Validate.showError(form, 'Validation failed internally: ' + err.message) }
      return
    }

    // Submit to backend API (preferred)
    try{
      if (btn){ btn.disabled = true; btn.textContent = 'Submitting…' }
      var headers = { 'Content-Type': 'application/json' }
      if (window.CSRF_TOKEN){ headers['X-CSRF-Token'] = window.CSRF_TOKEN }
      var resp = await fetch('../../api/arts.php', {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      var data = await resp.json()
      if (!resp.ok || (data && data.error)){
        throw new Error((data && data.error) || ('HTTP ' + resp.status))
      }
      // Success: go to SSR detail if possible, otherwise profile
      var newId = (data && data.id) ? data.id : null
      if (newId){ window.location.href = '/cycle3/art_detail.php?id=' + encodeURIComponent(newId) }
      else { window.location.href = './UserProfile.html' }
    }catch(err){
      if (window.Validate){ Validate.showError(form, 'Submit failed: ' + err.message) }
      else { alert('Submit failed: ' + err.message) }
    } finally {
      if (btn){ btn.disabled = false; btn.textContent = 'Submit Your Art' }
    }
  })
})();
