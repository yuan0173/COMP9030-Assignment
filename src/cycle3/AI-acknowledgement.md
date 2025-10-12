# AI-Acknowledgement - cycle 3

I acknowledge the use of ChatGPT in generating content included in this submission (OpenAI, 2025). The prompts and output from ChatGPT are included in the file below.

I acknowledge the use of GEMINI in generating content included in this submission (GOOGLE, 2025). The prompts and output from GEMINI are included in the file below.

## AI - usage Declaration

### member 1 lyu0061

### 1. add warning prompts on registration page
  AI prompt: Add warning prompts to the existing registration page when users did not enter the required details or incorrect info is received.

  AI output: 
  ;(function(){
  'use strict';

  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function setOutline(el, on){ 
    if (el) el.style.outline = on ? '2px solid #ef4444' : '' 
  }

  // User storage management
  var UserStorage = {
    USERS_KEY: 'iaa_users_v1',
    
    // Get all users from localStorage
    getUsers: function() {
      try {
        var users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
      } catch (error) {
        console.error('Error loading users:', error);
        return [];
      }
    },
    
    // Save users to localStorage
    saveUsers: function(users) {
      try {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return true;
      } catch (error) {
        console.error('Error saving users:', error);
        return false;
      }
    },
    
    // Add a new user
    addUser: function(userData) {
      var users = this.getUsers();
      
      // Check if user already exists
      var existingUser = users.find(function(u) {
        return u.email.toLowerCase() === userData.email.toLowerCase();
      });
      
      if (existingUser) {
        return { success: false, message: 'User with this email already exists.' };
      }
      
      // Add new user with selected role (default to 'public')
      var newUser = {
        role: userData.role || 'public',
        email: userData.email.toLowerCase(),
        password: userData.password,
        registeredAt: Date.now()
      };
      
      users.push(newUser);
      
      if (this.saveUsers(users)) {
        return { success: true, user: newUser };
      } else {
        return { success: false, message: 'Failed to save user data.' };
      }
    },
    
    // Find user by email and password
    findUser: function(email, password) {
      var users = this.getUsers();
      return users.find(function(u) {
        return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
      });
    }
  };

  // Form validation functions
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // MODIFIED: require letters and numbers, length 6-16
  function validatePassword(password) {
    // At least 6 characters (original comment preserved)
    // MODIFIED: now require at least one letter and one digit, and maximum length 16
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/.test(password);
  }

  function validatePasswordMatch(password, confirmPassword) {
    return password === confirmPassword;
  }

  ready(function(){
    var form = document.querySelector('form.form');
    if (!form) return;

    var emailInput = form.querySelector('input[type="email"]');
    var passwordInput = form.querySelector('input[type="password"]');
    var confirmPasswordInput = form.querySelectorAll('input[type="password"]')[1];
    var submitButton = form.querySelector('button[type="submit"]');

    // Create error message elements if they don't exist
    var errorMessage = document.getElementById('errorMessage');
    if (!errorMessage) {
      errorMessage = document.createElement('div');
      errorMessage.id = 'errorMessage';
      errorMessage.style.display = 'none';
      errorMessage.style.color = '#ef4444';
      errorMessage.style.marginTop = '12px';
      errorMessage.style.textAlign = 'center';
      form.appendChild(errorMessage);
    }

    var errorText = document.getElementById('errorText');
    if (!errorText) {
      errorText = document.createElement('div');
      errorText.id = 'errorText';
      errorMessage.appendChild(errorText);
    }

    // NEW: Add small red error placeholders under each input
    function createFieldError(el) {
      var span = document.createElement('div');
      span.className = 'field-error';
      span.style.color = '#ef4444';
      span.style.fontSize = '0.85em';
      span.style.marginTop = '4px';
      span.style.display = 'none';
      el.parentNode.appendChild(span);
      return span;
    }

    var emailFieldError = createFieldError(emailInput);
    var passwordFieldError = createFieldError(passwordInput);
    var confirmFieldError = createFieldError(confirmPasswordInput);

    function clearOutlines(){
      setOutline(emailInput, false);
      setOutline(passwordInput, false);
      setOutline(confirmPasswordInput, false);
    }

    function showError(message, input) {
      if (errorText) {
        errorText.textContent = message;
      }
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }

      // NEW: show error under specific field
      if (input === emailInput) {
        emailFieldError.textContent = message;
        emailFieldError.style.display = 'block';
      } else if (input === passwordInput) {
        passwordFieldError.textContent = message;
        passwordFieldError.style.display = 'block';
      } else if (input === confirmPasswordInput) {
        confirmFieldError.textContent = message;
        confirmFieldError.style.display = 'block';
      }
    }

    function hideAllFieldErrors() {
      emailFieldError.style.display = 'none';
      passwordFieldError.style.display = 'none';
      confirmFieldError.style.display = 'none';
    }

    function hideError() {
      if (errorMessage) {
        errorMessage.style.display = 'none';
      }
      hideAllFieldErrors();
    }

    function showSuccess(message) {
      if (errorText) {
        errorText.textContent = message;
        errorText.style.color = '#10b981';
      }
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
      hideAllFieldErrors(); // NEW: remove field-level red errors when success
    }

    // Form submission handler
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      clearOutlines();
      hideError();

      var email = (emailInput && emailInput.value || '').trim();
      var password = (passwordInput && passwordInput.value || '').trim();
      var confirmPassword = (confirmPasswordInput && confirmPasswordInput.value || '').trim();

      // Validate email
      if (!email) {
        setOutline(emailInput, true);
        showError('Please enter your email address.', emailInput);
        return;
      }
      
      if (!validateEmail(email)) {
        setOutline(emailInput, true);
        showError('Please enter a valid email address.', emailInput);
        return;
      }

      // Validate password
      if (!password) {
        setOutline(passwordInput, true);
        showError('Please enter a password.', passwordInput);
        return;
      }

      // MODIFIED: show message matching the new rule
      if (!validatePassword(password)) {
        setOutline(passwordInput, true);
        showError('Password must be 6-16 characters and include both letters and numbers.', passwordInput);
        return;
      }

      // Validate password confirmation
      if (!confirmPassword) {
        setOutline(confirmPasswordInput, true);
        showError('Please confirm your password.', confirmPasswordInput);
        return;
      }

      if (!validatePasswordMatch(password, confirmPassword)) {
        setOutline(confirmPasswordInput, true);
        showError('Passwords do not match.', confirmPasswordInput);
        return;
      }

      // Get selected role from form
      var roleInput = form.querySelector('input[name="userRole"]:checked');
      var selectedRole = roleInput ? roleInput.value : 'public';

      // Try backend register first
      try {
        var resp = await fetch('../api/auth.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email, password: password, role: selectedRole })
        })
        var data = await resp.json()
        if (!resp.ok || (data && data.error)) {
          throw new Error((data && data.error) || ('HTTP ' + resp.status))
        }
        showSuccess('Registration successful! Redirecting to login...')
        form.reset()
        setTimeout(function(){ window.location.href = './UserLogIn.html' }, 1500)
        return
      } catch(err) {
        // Fallback to local storage demo if backend not available
        var result = UserStorage.addUser({ email: email, password: password, role: selectedRole })
        if (result.success) {
          showSuccess('Registration successful! Redirecting to login...')
          form.reset()
          setTimeout(function(){ window.location.href = './UserLogIn.html' }, 1500)
        } else {
          showError(result.message || 'Registration failed. Please try again.', emailInput)
        }
      }
    });

    // Clear error when user starts typing
    if (emailInput) {
      emailInput.addEventListener('input', hideError);
    }
    if (passwordInput) {
      passwordInput.addEventListener('input', hideError);
    }
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', hideError);
    }
  });

  // Make UserStorage available globally for other scripts
  window.UserStorage = UserStorage;

})();


Main modifications:

validatePassword now uses a regex to require letters and numbers and a length of 6–16 characters.

The corresponding error message text was updated to match the new rule.

All other logic (including fetch, fallback to UserStorage, and existing comments) remains completely unchanged.

Do you want me to replace your project’s registration.js with this version and give you a concise summary of the differences (listing each modified line)?

### 2. add warning prompts on submission page
  AI-prompt: Change the existing submission.html, submission.js and validate.js so that the page can react when users enter something wrong in the text box.

  AI-output:
  Here is the confirmation:

  Confirmation of HTML Modification and Validation Strategy

  Understood. To ensure your custom JavaScript error messages display correctly and to bypass the browser's native HTML5 validation (which prevents your custom messages), you have successfully removed the required attribute from the following input fields in your New Submission.html file: artTitle, artType, artPeriod, artCondition, and artDescription.

  The updated HTML confirms the removal of these attributes.

  By removing the HTML5 required attribute, form validation will now be entirely managed by your JavaScript logic (specifically within submission.js), ensuring your custom error handling and display (using functions like showFieldError and clearFieldErrors from validate.js) are correctly executed.

  I will proceed using:

  The modified HTML (without required attributes).

  The latest version of submission.js (including the artTitleEl.focus() fix).

  The latest version of validate.js (including showFieldError and clearFieldErrors).
  <!-- <!DOCTYPE html> -->
    <!-- <html>
      <head>
        <title>New Submission</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
        <link rel="stylesheet" href="../css/base.css">
        <link rel="stylesheet" href="../css/layout.css">
        <link rel="stylesheet" href="../css/components.css">
        <link rel="stylesheet" href="../css/pages.css">
      </head>
      <body>
        <!-- Header will be dynamically generated by header.js -->
        <div id="header-placeholder"></div>

        <main class="container" style="margin-top:24px">
          <h1 class="card__title" style="margin:0 0 12px">Submit Your Art</h1>

          <!-- jia：Form body -->
          <form class="form" id="submissionForm" onsubmit="return false;">
            <div class="js-error-box notice notice--error" role="alert" style="display:none"><div class="js-error-text"></div></div>

            <!-- Basic info: two rows -->
            <div class="form__row">
              <div>
                <label>Title</label>
                <input id="artTitle" class="input" type="text" placeholder="Title"> 
              </div>
              <div>
                <label>Type</label>
                <select id="artType" class="input">
                  <option value="Cave Art">Cave Art</option>
                  <option value="Mural">Mural</option>
                </select>
              </div>
            </div>

            <div class="form__row">
              <div>
                <label>Period</label>
                <select id="artPeriod" class="input">
                  <option value="Ancient">Ancient</option>
                  <option value="Contemporary">Contemporary</option>
                </select>
              </div>
              <div>
                <label>Condition/Quality</label>
                <input id="artCondition" class="input" type="text" placeholder="e.g. Good / Fair"> 
              </div>
            </div>

            <div>
              <label>Description</label>
              <textarea id="artDescription" class="input" rows="4" placeholder="Add a brief description"></textarea> 
              <div class="form__hint">Be mindful of cultural sensitivity and privacy.</div>
            </div>

            <!-- Map + Upload: Just occupy the space. JS takes over later -->
            <section class="grid" style="margin-top:8px">
              <div>
                <label>Location</label>
                <div id="submissionMap" class="map-box"></div>
                <div class="form__hint">Type an address or location description below, or click on the map to set coordinates</div>
                <input id="locationNotes" class="input" type="text" placeholder="Enter address or location (e.g., 'Sydney Opera House' or '123 Main St, Sydney')">
                <input id="lat" type="hidden">
                <input id="lng" type="hidden">
              </div>

              <div class="card" style="padding:16px">
                <label>Images</label>
                <input id="imageInput" class="input" type="file" accept="image/*">
                <div class="form__hint">You can select multiple images.</div>
                <img id="imagePreview" alt="preview" style="margin-top:8px;max-width:100%;display:none;border-radius:8px" />
              </div>
            </section>

            <!-- Multiple options: Cultural sensitivity/Private Land/Signature -->
            <div class="form__row">
              <label><input id="creditKnownArtist" type="checkbox"> Credit a known artist</label>
              <label><input id="sensitive" type="checkbox"> This location is culturally sensitive</label>
            </div>
            <div>
              <label><input id="privateLand" type="checkbox"> This location is private land</label>
            </div>

            <!-- Submit button -->
            <div class="form__actions">
              <button id="submitBtn" class="btn" type="submit">Submit Your Art</button>
            </div>
          </form>
        </main>

        <!-- jia: Footer -->
        <footer class="footer" style="margin-top:24px">
          <div class="container flex-between">
            <div>© IAA</div>
            <nav>
              <a href="./About.html">Introduction</a> ·
              <a href="./Guideline.html">Guidelines</a> ·
              <a href="./ArtsResult.html">Art Listings</a> ·
              
              <a href="./Contact.html">Contact Us</a> ·
              <a href="./Disclaimer.html">Disclaimers</a>
            </nav>
          </div>
        </footer>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <script src="../js/session.js"></script>
        <script src="../js/header.js"></script>
        <script src="../js/validate.js"></script>
        <script src="../js/submission.js"></script>
      </body>
    </html> -->

  validate.js
  ;(function(){
    'use strict'

    // --- Core Validation Functions ---

    /**
    * Checks if a string value is a valid email format.
    * @param {string} v - The value to validate.
    * @returns {boolean}
    */
    function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()) }
    
    /**
    * Checks if a string value is not empty after trimming whitespace.
    * @param {string} v - The value to validate.
    * @returns {boolean}
    */
    function isRequired(v){ return String(v||'').trim().length > 0 }
    
    /**
    * Checks if a string value's length is less than or equal to the maximum length 'n'.
    * @param {string} v - The value to validate.
    * @param {number} n - The maximum allowed length.
    * @returns {boolean}
    */
    function maxLen(v, n){ return String(v||'').trim().length <= n }
    
    /**
    * Checks if a numeric value is within a specified range (inclusive).
    * Returns true if the value is null, undefined, or empty string.
    * @param {*} n - The value (expected to be numeric) to check.
    * @param {number} min - The minimum allowed value.
    * @param {number} max - The maximum allowed value.
    * @returns {boolean}
    */
    function inRange(n, min, max){ 
      if(n===''||n===null||typeof n==='undefined') return true; 
      var x=Number(n); 
      return !isNaN(x) && x>=min && x<=max 
    }

    // --- Original Global Error Functions (Retained) ---

    /**
    * Ensures the global error box (.js-error-box) exists at the top of the form, creating it if necessary.
    * @param {HTMLElement} form - The form element.
    * @returns {HTMLElement} The error box element.
    */
    function ensureErrorBox(form){
      var box = form.querySelector('.js-error-box')
      if (!box){
        box = document.createElement('div')
        box.className = 'js-error-box notice notice--error'
        box.style.display = 'none'
        box.setAttribute('role','alert')
        var text = document.createElement('div')
        text.className = 'js-error-text'
        box.appendChild(text)
        form.insertBefore(box, form.firstChild)
      }
      return box
    }

    /**
    * Displays a global error message inside the .js-error-box.
    * @param {HTMLElement} form - The form element.
    * @param {string} message - The error message to display.
    */
    function showError(form, message){
      var box = ensureErrorBox(form)
      var text = box.querySelector('.js-error-text')
      if (text) text.textContent = message
      box.style.display = 'block'
    }
    
    /**
    * Clears (hides) the global error box.
    * @param {HTMLElement} form - The form element.
    */
    function clearError(form){
      var box = form.querySelector('.js-error-box')
      if (box) box.style.display = 'none'
    }

    // --- NEW Field-Level Error Functions (Added per user request) ---

    /**
    * Clears any existing red error text next to a specific input field.
    * @param {HTMLElement} inputElement - The input field element (input, select, textarea).
    */
    function clearFieldErrors(inputElement){
      // Look for the error span sibling within the parent node
      var errorSpan = inputElement.parentNode.querySelector('.js-field-error')
      if(errorSpan) {
        errorSpan.parentNode.removeChild(errorSpan)
      }
      // Optional: Remove error class from the input itself if one was added
      // inputElement.classList.remove('is-error') 
    }

    /**
    * Displays a red error message next to a specific input field.
    * @param {HTMLElement} inputElement - The input field element (input, select, textarea).
    * @param {string} message - The error message (e.g., 'Please enter a title here').
    */
    function showFieldError(inputElement, message){
      // 1. Clear any existing error for this field first
      clearFieldErrors(inputElement)

      // 2. Create the error element
      var errorSpan = document.createElement('span')
      errorSpan.className = 'js-field-error' // Class for easy identification and clearing
      errorSpan.textContent = message
      errorSpan.style.color = 'red'          // Set to red text
      errorSpan.style.marginLeft = '5px'     // Add minor spacing

      // 3. Insert the error message right after the input field
      // This assumes the input is wrapped within a parent element (like a div or label)
      inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling)
      
      // Optional: Add error class to the input for styling its border/background
      // inputElement.classList.add('is-error')
    }

    // --- Export Public Interface ---
    
    window.Validate = { 
      isEmail, 
      isRequired, 
      maxLen, 
      inRange, 
      // Original global functions
      showError, 
      clearError,
      // New field-level functions
      showFieldError,
      clearFieldErrors 
    }
  })()

  submission.js
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


### 3. add warning prompts on contact page
  AI-prompt: Add warning prompts 

  AI-output: 
  Here’s the updated contact.js as you requested. It keeps all existing functionality intact and adds red inline error messages for required fields, displayed directly below the corresponding input box. Comments in English explain the added logic:

  // Simple contact form handler: show success on submit
  ;(function(){
    function ready(fn){
      if (document.readyState !== 'loading') fn()
      else document.addEventListener('DOMContentLoaded', fn)
    }

    ready(function(){
      var form = document.querySelector('form.form')
      if (!form) return

      form.addEventListener('submit', function(e){
        e.preventDefault()
        // Collect fields
        var nameInput = form.querySelector('input[type="text"]')
        var emailInput = form.querySelector('input[type="email"]')
        var subjectInput = form.querySelector('input[placeholder="Subject"]')
        var messageInput = form.querySelector('textarea')

        // Reset basic error state
        ;[nameInput, emailInput, subjectInput, messageInput].forEach(function(el){ if (el) el.style.outline = '' })

        var name = nameInput ? nameInput.value.trim() : ''
        var email = emailInput ? emailInput.value.trim() : ''
        var subject = subjectInput ? subjectInput.value.trim() : ''
        var message = messageInput ? messageInput.value.trim() : ''

        // --- New: clear existing inline error messages before re-validating ---
        form.querySelectorAll('.error-text').forEach(function(el){ el.remove() })

        var missing = []
        if (!name) missing.push(nameInput)
        if (!email) missing.push(emailInput)
        if (!subject) missing.push(subjectInput)
        if (!message) missing.push(messageInput)

        // Basic email pattern check
        var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

        // --- New: show inline red error messages for required fields ---
        missing.forEach(function(el){
          if (el) {
            el.style.outline = '2px solid #ef4444'
            var error = document.createElement('div')
            error.className = 'error-text'
            error.style.color = '#ef4444'
            error.style.fontSize = '0.875rem'
            error.style.marginTop = '4px'
            error.textContent = 'This field is required.'
            el.insertAdjacentElement('afterend', error)
          }
        })

        // --- New: show specific message if email format is invalid ---
        if (email && !emailValid && emailInput) {
          emailInput.style.outline = '2px solid #ef4444'
          var error = document.createElement('div')
          error.className = 'error-text'
          error.style.color = '#ef4444'
          error.style.fontSize = '0.875rem'
          error.style.marginTop = '4px'
          error.textContent = 'Please enter a valid email address.'
          emailInput.insertAdjacentElement('afterend', error)
        }

        if (missing.length > 0 || (email && !emailValid)) {
          alert('Please complete all fields with a valid email address.')
          return
        }

        // Success feedback; can be replaced with real submission later
        alert('Message sent successfully!')
      })
    })
  })()

  ✅ Changes Explained

  Added .error-text elements to display red inline error messages below each empty or invalid field.

  Clears old error messages on every submission to prevent stacking.

  Shows a specific message for invalid email: "Please enter a valid email address."

  Preserves all existing functionality, including alert() notifications and red outline styling for invalid fields.

  If you want, I can also add the CSS for .error-text (e.g., font-size: 0.875rem; color: #ef4444; margin-top: 4px;) and suggest placing it in components.css for a cleaner separation of styles.