;(function(){
  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function setOutline(el, on){ if (el) el.style.outline = on ? '2px solid #ef4444' : '' }

  // Static admin users (registered users are stored separately)
  var adminUsers = [
    { role: 'admin', email: 'admin@gmail.com', password: 'admin' },
    { role: 'visitor', email: 'visitor@gmail.com', password: 'visitor' },
    { role: 'artist', email: 'artist@gmail.com', password: 'artist' },
  ]

  ready(async function(){
    var form = document.querySelector('form.form')
    if (!form) return

    var modeInputs = form.querySelectorAll('input[name="loginMode"][type="radio"]')
    var emailInput = form.querySelector('input[type="email"]')
    var passwordInput = form.querySelector('input[type="password"]')
    var errorMessage = document.getElementById('errorMessage')
    var errorText = document.getElementById('errorText')

    // Load users from storage
    try{ 
      var registeredUsers = window.UserStorage ? window.UserStorage.getUsers() : [];
      console.log('[login] Loaded admin users:', adminUsers.length);
      console.log('[login] Loaded registered users:', registeredUsers.length);
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

    form.addEventListener('submit', function(e){
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

      // First check admin users
      var match = adminUsers.find(function(u){
        return u.role === mode && String(u.email || '').trim().toLowerCase() === email.toLowerCase() && String(u.password || '').trim() === password
      })
      
      // If not found in admin users, check registered users
      if (!match && window.UserStorage) {
        var registeredUser = window.UserStorage.findUser(email, password);
        if (registeredUser) {
          match = registeredUser;
        }
      }
      
      if (match){
        // Use SessionManager to handle login
        if (SessionManager.login({ role: match.role, email: match.email })) {
          SessionManager.redirectAfterLogin();
        } else {
          showError('Login failed. Please try again.')
        }
        return
      }
      setOutline(emailInput, true)
      setOutline(passwordInput, true)
      showError('Invalid credentials for selected role.')
    })

    // Clear error when user starts typing or changes mode
    if (emailInput) {
      emailInput.addEventListener('input', hideError)
    }
    if (passwordInput) {
      passwordInput.addEventListener('input', hideError)
    }
    modeInputs.forEach(function(input) {
      input.addEventListener('change', hideError)
    })
  })
})()


