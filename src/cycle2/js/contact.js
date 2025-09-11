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

      var missing = []
      if (!name) missing.push(nameInput)
      if (!email) missing.push(emailInput)
      if (!subject) missing.push(subjectInput)
      if (!message) missing.push(messageInput)

      // Basic email pattern check
      var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

      if (missing.length > 0 || (email && !emailValid)) {
        missing.forEach(function(el){ if (el) el.style.outline = '2px solid #ef4444' })
        if (email && !emailValid && emailInput) emailInput.style.outline = '2px solid #ef4444'
        alert('Please complete all fields with a valid email address.')
        return
      }

      // Success feedback; can be replaced with real submission later
      alert('Message sent successfully!')
    })
  })
})()


