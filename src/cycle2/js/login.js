;(function(){
  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function setOutline(el, on){ if (el) el.style.outline = on ? '2px solid #ef4444' : '' }

  // Static users with roles
  var users = [
    { role: 'admin', email: 'admin@gmail.com', password: 'admin1' },
    { role: 'visitor', email: 'visitor@gmail.com', password: 'visitor' },
    { role: 'artist', email: 'artist@gmail.com', password: 'artist' },
  ]

  ready(async function(){
    var form = document.querySelector('form.form')
    if (!form) return

    var modeInputs = form.querySelectorAll('input[name="loginMode"][type="radio"]')
    var emailInput = form.querySelector('input[type="email"]')
    var passwordInput = form.querySelector('input[type="password"]')

    // Users are static now
    try{ console.log('[login] Loaded users:', users.length) }catch(_){ }

    function validateEmail(val){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) }

    function currentMode(){
      var selected = Array.from(modeInputs).find(function(r){ return r.checked })
      return selected ? selected.value : 'visitor'
    }

    function clearOutlines(){
      setOutline(emailInput, false)
      setOutline(passwordInput, false)
    }

    form.addEventListener('submit', function(e){
      e.preventDefault()
      clearOutlines()

      var mode = currentMode()
      var email = (emailInput && emailInput.value || '').trim()
      var password = (passwordInput && passwordInput.value || '').trim()

      if (!email || !validateEmail(email)){
        setOutline(emailInput, true)
        alert('Please enter a valid email.')
        return
      }
      if (!password){
        setOutline(passwordInput, true)
        alert('Please enter your password.')
        return
      }

      var match = users.find(function(u){
        return u.role === mode && String(u.email || '').trim().toLowerCase() === email.toLowerCase() && String(u.password || '').trim() === password
      })
      if (match){
        try {
          localStorage.setItem('iaa_auth_v1', JSON.stringify({ role: match.role, email: match.email }))
        } catch(_) { }
        if (mode === 'admin') window.location.href = './AdminDashboard.html'
        else if (mode === 'artist') window.location.href = './UserProfile.html'
        else window.location.href = './UserProfile.html'
        return
      }
      setOutline(emailInput, true)
      setOutline(passwordInput, true)
      alert('Invalid credentials for selected role.')
    })
  })
})()


