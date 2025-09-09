;(function(){
  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function getEl(id){ return document.getElementById(id) }
  function setDisabled(el, disabled){ if (el) el.disabled = !!disabled }

  var STORAGE_KEY = 'iaa_profile_v1'

  function loadProfile(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return {}
      return JSON.parse(raw) || {}
    }catch(_){ return {} }
  }

  function loadAuth(){
    try{
      var raw = localStorage.getItem('iaa_auth_v1')
      if (!raw) return null
      return JSON.parse(raw)
    }catch(_){ return null }
  }

  function saveProfile(profile){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile || {}))
    }catch(_){ }
  }

  function hydrate(){
    var data = loadProfile()
    var auth = loadAuth()
    var bioText = getEl('bioText')
    var bioInput = getEl('bioInput')
    var emailInput = getEl('contactEmailInput')
    var addressInput = getEl('contactAddressInput')
    var phoneInput = getEl('contactPhoneInput')
    var artistSection = getEl('artistSection')

    if (bioText) bioText.textContent = data.bio || 'This is the bio part'
    if (bioInput) bioInput.value = data.bio || ''
    if (emailInput) emailInput.value = data.email || ''
    if (addressInput) addressInput.value = data.address || ''
    if (phoneInput) phoneInput.value = data.phone || ''
    if (artistSection) artistSection.style.display = (auth && auth.role === 'artist') ? '' : 'none'
  }

  function toggleEdit(isEditing){
    setDisabled(getEl('bioInput'), !isEditing)
    setDisabled(getEl('contactEmailInput'), !isEditing)
    setDisabled(getEl('contactAddressInput'), !isEditing)
    setDisabled(getEl('contactPhoneInput'), !isEditing)
  }

  ready(function(){
    // Initialize default disabled state
    toggleEdit(false)
    hydrate()

    var bioEditBtn = getEl('bioEditBtn')
    var bioSaveBtn = getEl('bioSaveBtn')
    var contactEditBtn = getEl('contactEditBtn')
    var contactSaveBtn = getEl('contactSaveBtn')

    if (bioEditBtn) bioEditBtn.addEventListener('click', function(){ toggleEdit(true) })
    if (contactEditBtn) contactEditBtn.addEventListener('click', function(){ toggleEdit(true) })

    function handleSave(){
      var bio = (getEl('bioInput') && getEl('bioInput').value || '').trim()
      var email = (getEl('contactEmailInput') && getEl('contactEmailInput').value || '').trim()
      var address = (getEl('contactAddressInput') && getEl('contactAddressInput').value || '').trim()
      var phone = (getEl('contactPhoneInput') && getEl('contactPhoneInput').value || '').trim()

      var profile = loadProfile()
      profile.bio = bio
      profile.email = email
      profile.address = address
      profile.phone = phone
      saveProfile(profile)

      var bioText = getEl('bioText')
      if (bioText) bioText.textContent = bio || 'This is the bio part'

      toggleEdit(false)
      try{ alert('Profile saved') }catch(_){ }
    }

    if (bioSaveBtn) bioSaveBtn.addEventListener('click', handleSave)
    if (contactSaveBtn) contactSaveBtn.addEventListener('click', handleSave)
  })
})()


