;(function(){
  'use strict'

  function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()) }
  function isRequired(v){ return String(v||'').trim().length > 0 }
  function maxLen(v, n){ return String(v||'').trim().length <= n }
  function inRange(n, min, max){ if(n===''||n===null||typeof n==='undefined') return true; var x=Number(n); return !isNaN(x) && x>=min && x<=max }

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

  function showError(form, message){
    var box = ensureErrorBox(form)
    var text = box.querySelector('.js-error-text')
    if (text) text.textContent = message
    box.style.display = 'block'
  }
  function clearError(form){
    var box = form.querySelector('.js-error-box')
    if (box) box.style.display = 'none'
  }

  window.Validate = { isEmail, isRequired, maxLen, inRange, showError, clearError }
})()

