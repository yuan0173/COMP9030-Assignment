;(function(){
  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function setOutline(el, on){ if (el) el.style.outline = on ? '2px solid #ef4444' : '' }

  // Static demo users for testing (registered users are stored separately)
  var demoUsers = [
    { role: 'admin', email: 'admin@gmail.com', password: 'admin' },
    { role: 'public', email: 'public@gmail.com', password: 'public' },
    { role: 'artist', email: 'artist@gmail.com', password: 'artist' },
  ]

  ready(async function(){
    var form = document.querySelector('form.form')
    if (!form) return

    var modeInputs = form.querySelectorAll('input[name="loginMode"][type="radio"]')
    var emailInput = form.querySelector('input[type="email"]') || document.getElementById('loginEmail')
    var passwordInput = form.querySelector('input[type="password"]') || document.getElementById('loginPassword')
    var errorMessage = document.getElementById('errorMessage')
    var errorText = document.getElementById('errorText')

    // Load users from storage
    try{ 
      var registeredUsers = window.UserStorage ? window.UserStorage.getUsers() : [];
    }catch(_){ }

    function validateEmail(val){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) }

    function currentMode(){
      var selected = Array.from(modeInputs).find(function(r){ return r.checked })
      return selected ? selected.value : 'visitor'
    }

    function clearOutlines(){
      setOutline(emailInput, false)
      setOutline(passwordInput, false)
    }

    function showError(message) {
      if (errorText) {
        errorText.textContent = message
      }
      if (errorMessage) {
        errorMessage.style.display = 'block'
      }
    }

    function hideError() {
      if (errorMessage) {
        errorMessage.style.display = 'none'
      }
    }

    function fillCredentialsForMode(mode) {
      var user = demoUsers.find(function(u) { return u.role === mode })
      if (user && emailInput && passwordInput) {
        emailInput.value = user.email
        passwordInput.value = user.password
      }
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault()
      clearOutlines()
      hideError()

      var mode = currentMode()
      var email = (emailInput && emailInput.value || '').trim()
      var password = (passwordInput && passwordInput.value || '').trim()

      if (!email || !validateEmail(email)){
        setOutline(emailInput, true)
        showError('Please enter a valid email.')
        return
      }
      if (!password){
        setOutline(passwordInput, true)
        showError('Please enter your password.')
        return
      }
      // Try backend login first
      try {
        var resp = await fetch('../../api/auth.php?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email, password: password })
        })
        var data = await resp.json()
        if (!resp.ok || (data && data.error)) {
          throw new Error((data && data.error) || ('HTTP ' + resp.status))
        }
        // Success: store CSRF token and mark session
        if (data && data.csrf_token) { window.CSRF_TOKEN = data.csrf_token }
        var user = (data && data.user) ? data.user : { email: email, role: mode }
        if (SessionManager.login({ role: user.role || mode, email: user.email || email })) {
          SessionManager.redirectAfterLogin();
          return
        } else {
          showError('Login failed. Please try again.')
          return
        }
      } catch(err) {
        // Fallback to demo/local users for offline demo
        var match = demoUsers.find(function(u){
          return u.role === mode && String(u.email || '').trim().toLowerCase() === email.toLowerCase() && String(u.password || '').trim() === password
        })
        if (!match && window.UserStorage) {
          var registeredUser = window.UserStorage.findUser(email, password);
          if (registeredUser) match = registeredUser;
        }
        if (match){
          if (SessionManager.login({ role: match.role, email: match.email })) {
            SessionManager.redirectAfterLogin();
            return
          }
        }
        setOutline(emailInput, true)
        setOutline(passwordInput, true)
        showError('Invalid credentials. Please check your email and password.')
      }
    })

    // Clear error when user starts typing or changes mode
    if (emailInput) {
      emailInput.addEventListener('input', hideError)
    }
    if (passwordInput) {
      passwordInput.addEventListener('input', hideError)
    }
    modeInputs.forEach(function(input) {
      input.addEventListener('change', function() {
        hideError()
        fillCredentialsForMode(input.value)
      })
    })

    // Fill credentials for initially selected mode
    var initialMode = currentMode()
    if (initialMode) {
      fillCredentialsForMode(initialMode)
    }
  })
})()
