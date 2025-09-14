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
    // Use SessionManager instead of direct localStorage access
    return SessionManager.getCurrentUser()
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
    
    // Control UI elements based on user role
    updateUIBasedOnRole(auth)
  }

  function updateUIBasedOnRole(user){
    if (!user) return
    
    var submitBtn = getEl('submitArtBtn')
    var submissionsSection = getEl('submissionsSection')
    var artistSection = getEl('artistSection')

    // Control UI visibility based on role
    if (user.role === 'visitor') {
      // Visitor: Can only browse, no submission features
      if (submitBtn) submitBtn.style.display = 'none'
      if (submissionsSection) submissionsSection.style.display = 'none'
      if (artistSection) artistSection.style.display = 'none'
    } else if (user.role === 'public') {
      // Public: Can submit, has basic features
      if (submitBtn) submitBtn.style.display = ''
      if (submissionsSection) submissionsSection.style.display = ''
      if (artistSection) artistSection.style.display = 'none'
    } else if (user.role === 'artist') {
      // Artist: Has all features including artist section
      if (submitBtn) submitBtn.style.display = ''
      if (submissionsSection) submissionsSection.style.display = ''
      if (artistSection) artistSection.style.display = ''
    }
  }

  function toggleEdit(isEditing){
    setDisabled(getEl('bioInput'), !isEditing)
    setDisabled(getEl('contactEmailInput'), !isEditing)
    setDisabled(getEl('contactAddressInput'), !isEditing)
    setDisabled(getEl('contactPhoneInput'), !isEditing)
  }

  function updateUserDisplay(){
    var user = SessionManager.getCurrentUser()
    if (!user) return

    // Update user name and role display
    var userNameEl = document.querySelector('.profile-grid .card__desc')
    if (userNameEl) {
      userNameEl.textContent = '@' + user.email.split('@')[0] + ' · ' + user.role.charAt(0).toUpperCase() + user.role.slice(1)
    }

    // Update welcome message
    var welcomeEl = document.querySelector('.profile-grid .card h3')
    if (welcomeEl) {
      welcomeEl.textContent = 'Hello! ' + user.email.split('@')[0]
    }
  }

  function loadUserSubmissions(){
    var user = SessionManager.getCurrentUser()
    if (!user) return []

    try {
      var submissions = localStorage.getItem('iaa_arts_v1')
      if (!submissions) return []
      var allArts = JSON.parse(submissions)
      
      // Filter submissions by current user email
      return allArts.filter(function(art){
        return art.submittedBy === user.email
      })
    } catch(_) {
      return []
    }
  }

  function createSubmissionCard(submission){
    var card = document.createElement('div')
    card.className = 'card'
    card.style.cssText = 'position:relative;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#fff'

    var imgWrap = document.createElement('div')
    imgWrap.className = 'card__img'
    
    var img = document.createElement('img')
    img.src = submission.image || '../test.jpg'
    img.alt = submission.title || 'Artwork'
    imgWrap.appendChild(img)

    var body = document.createElement('div')
    body.className = 'card__body'
    
    var title = document.createElement('h3')
    title.className = 'card__title'
    title.textContent = submission.title || 'Untitled'
    
    var desc = document.createElement('p')
    desc.className = 'card__desc'
    desc.textContent = submission.status || 'pending'

    var actions = document.createElement('div')
    actions.style.cssText = 'display:flex;gap:8px;margin-top:8px'

    var editBtn = document.createElement('button')
    editBtn.className = 'pill'
    editBtn.textContent = 'Edit'
    editBtn.addEventListener('click', function(){
      editSubmission(submission)
    })

    var deleteBtn = document.createElement('button')
    deleteBtn.className = 'pill'
    deleteBtn.style.cssText = 'background:#fee2e2;color:#991b1b;border-color:#fecaca'
    deleteBtn.textContent = 'Delete'
    deleteBtn.addEventListener('click', function(){
      deleteSubmission(submission.id)
    })

    actions.appendChild(editBtn)
    actions.appendChild(deleteBtn)
    body.appendChild(title)
    body.appendChild(desc)
    body.appendChild(actions)
    card.appendChild(imgWrap)
    card.appendChild(body)

    return card
  }

  function renderUserSubmissions(){
    var container = getEl('userSubmissions')
    if (!container) return

    var submissions = loadUserSubmissions()
    container.innerHTML = ''

    if (submissions.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No submissions yet. Submit your first artwork!'
      container.appendChild(empty)
      return
    }

    submissions.forEach(function(submission){
      container.appendChild(createSubmissionCard(submission))
    })
  }

  function editSubmission(submission){
    // Navigate to dedicated edit page
    var editUrl = './EditSubmission.html?id=' + encodeURIComponent(submission.id)
    window.location.href = editUrl
  }

  function deleteSubmission(submissionId){
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return
    }

    try {
      var submissions = localStorage.getItem('iaa_arts_v1')
      if (!submissions) return

      var allArts = JSON.parse(submissions)
      var updatedArts = allArts.filter(function(art){
        return art.id !== submissionId
      })

      localStorage.setItem('iaa_arts_v1', JSON.stringify(updatedArts))
      
      // Refresh the display
      renderUserSubmissions()
      
      alert('Submission deleted successfully.')
    } catch(err) {
      alert('Failed to delete submission. Please try again.')
    }
  }


  ready(function(){
    // Check if user is logged in
    if (!SessionManager.isLoggedIn()) {
      window.location.href = './UserLogIn.html';
      return;
    }

    // Initialize default disabled state
    toggleEdit(false)
    hydrate()
    
    // Update user display with actual user data
    updateUserDisplay()

    // Load and render user submissions
    renderUserSubmissions()

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


