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

    // Contact display elements
    var emailDisplay = getEl('contactEmailDisplay')
    var addressDisplay = getEl('contactAddressDisplay')
    var phoneDisplay = getEl('contactPhoneDisplay')

    if (bioText) bioText.textContent = data.bio || "I'm an art enthusiast"
    if (bioInput) bioInput.value = data.bio || ''
    if (emailInput) emailInput.value = data.email || ''
    if (addressInput) addressInput.value = data.address || ''
    if (phoneInput) phoneInput.value = data.phone || ''

    // Update contact display
    if (emailDisplay) emailDisplay.textContent = data.email || '-'
    if (addressDisplay) addressDisplay.textContent = data.address || '-'
    if (phoneDisplay) phoneDisplay.textContent = data.phone || '-'

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

  function toggleBioEdit(isEditing){
    var bioForm = getEl('bioForm')
    var bioText = getEl('bioText')
    var bioEditBtn = getEl('bioEditBtn')

    if (bioForm) {
      bioForm.style.display = isEditing ? 'block' : 'none'
    }
    if (bioText) {
      bioText.style.display = isEditing ? 'none' : 'block'
    }
    if (bioEditBtn) {
      bioEditBtn.style.display = isEditing ? 'none' : 'inline-block'
    }
  }

  function toggleContactEdit(isEditing){
    var contactForm = getEl('contactForm')
    var contactDisplay = getEl('contactDisplay')
    var contactEditBtn = getEl('contactEditBtn')

    if (contactForm) {
      contactForm.style.display = isEditing ? 'block' : 'none'
    }
    if (contactDisplay) {
      contactDisplay.style.display = isEditing ? 'none' : 'block'
    }
    if (contactEditBtn) {
      contactEditBtn.style.display = isEditing ? 'none' : 'inline-block'
    }
  }

  function updateUserDisplay(){
    var user = SessionManager.getCurrentUser()
    if (!user) return

    // Compute username (immutable) and display name (editable)
    var username = (user.email || '').split('@')[0]
    var profile = loadProfile()
    var displayName = (profile && profile.displayName) ? String(profile.displayName).trim() : ''
    if (!displayName) displayName = username

    // Update user name and role display
    var userInfoEl = getEl('userInfo')
    if (userInfoEl) {
      userInfoEl.textContent = '@' + username + ' · ' + (user.role || 'member').charAt(0).toUpperCase() + (user.role || 'member').slice(1)
    }

    // Update welcome message (use display name)
    var welcomeEl = getEl('userWelcome')
    if (welcomeEl) {
      welcomeEl.textContent = 'Hello! ' + displayName
    }
  }

  async function loadUserSubmissions(){
    var user = SessionManager.getCurrentUser()
    if (!user) return []

    try {
      // Load from database API; include credentials for session-based filtering
      var response = await fetch('../../api/arts.php?user=current', {
        credentials: 'include'
      })
      if (!response.ok) {
        console.error('Failed to load user submissions:', response.status)
        return []
      }

      var data = await response.json()
      // API returns an array; also support legacy { arts: [...] }
      if (Array.isArray(data)) return data
      if (data && Array.isArray(data.arts)) return data.arts

      return []
    } catch(err) {
      console.error('Error loading submissions:', err)
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

  async function renderUserSubmissions(){
    var container = getEl('userSubmissions')
    if (!container) return

    // Show loading state
    container.innerHTML = '<div class="notice">Loading submissions...</div>'

    var submissions = await loadUserSubmissions()
    container.innerHTML = ''

    if (submissions.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No submissions yet. Submit your first artwork!'
      container.appendChild(empty)
      // Even if none, also refresh credited works section (will be empty)
      renderArtistWorksFrom(submissions)
      return
    }

    submissions.forEach(function(submission){
      container.appendChild(createSubmissionCard(submission))
    })

    // Also render credited works for artist accounts
    renderArtistWorksFrom(submissions)
  }

  function createCreditedCard(item){
    var card = document.createElement('a')
    card.className = 'card'
    card.href = '/cycle3/art_detail.php?id=' + encodeURIComponent(item.id)
    var imgWrap = document.createElement('div')
    imgWrap.className = 'card__img'
    var img = document.createElement('img')
    img.src = item.image || '../test.jpg'
    img.alt = item.title || 'Artwork'
    imgWrap.appendChild(img)
    var body = document.createElement('div')
    body.className = 'card__body'
    var title = document.createElement('h3')
    title.className = 'card__title'
    title.textContent = item.title || 'Untitled'
    var desc = document.createElement('p')
    desc.className = 'card__desc'
    desc.textContent = item.description || ''
    body.appendChild(title)
    body.appendChild(desc)
    card.appendChild(imgWrap)
    card.appendChild(body)
    return card
  }

  function renderArtistWorksFrom(list){
    var user = SessionManager.getCurrentUser()
    var worksBox = getEl('artistWorks')
    var section = getEl('artistSection')
    if (!worksBox || !section) return
    // Only meaningful for artist role
    if (!user || user.role !== 'artist') { worksBox.innerHTML = ''; return }
    // Filter: items where creditKnownArtist set
    var works = (list || []).filter(function(it){
      var v = it && it.creditKnownArtist
      return v === true || v === 1 || v === '1'
    })
    worksBox.innerHTML = ''
    if (works.length === 0){
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No credited works yet.'
      worksBox.appendChild(empty)
      return
    }
    works.forEach(function(it){ worksBox.appendChild(createCreditedCard(it)) })
  }

  // Favorites
  var favPage = 1
  var favPageSize = 6
  var favTotal = 0

  async function loadFavorites(page, size){
    try{
      var params = new URLSearchParams()
      params.set('limit', String(size||favPageSize))
      params.set('offset', String(((page||favPage)-1) * (size||favPageSize)))
      var r = await fetch('/api/favorites.php?' + params.toString(), { credentials:'include' })
      var d = await r.json()
      favTotal = (d && typeof d.total==='number') ? d.total : 0
      return (d && Array.isArray(d.items)) ? d.items : []
    }catch(_){ favTotal = 0; return [] }
  }

  function createFavoriteCard(item){
    var a = document.createElement('a')
    a.className = 'card'
    a.href = '/cycle3/art_detail.php?id=' + encodeURIComponent(item.id)

    var imgWrap = document.createElement('div')
    imgWrap.className = 'card__img'
    imgWrap.style.position = 'relative'
    var img = document.createElement('img')
    img.src = item.image || '../test.jpg'
    img.alt = item.title || 'Artwork'
    imgWrap.appendChild(img)

    var heart = document.createElement('button')
    heart.className = 'fav-btn is-on'
    heart.type = 'button'
    heart.textContent = '♥'
    heart.title = 'Remove from favorites'
    heart.setAttribute('aria-pressed','true')
    heart.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      // Toggle off (remove favorite)
      fetch('/api/favorites.php?art_id=' + encodeURIComponent(item.id), { method:'DELETE', credentials:'include' })
        .then(function(r){ return r.json() })
        .then(function(){ renderFavorites() })
        .catch(function(err){ alert('Failed to update favorite: ' + err) })
    })
    imgWrap.appendChild(heart)

    var body = document.createElement('div')
    body.className = 'card__body'
    var h3 = document.createElement('h3')
    h3.className = 'card__title'
    h3.textContent = item.title || 'Untitled'
    var p = document.createElement('p')
    p.className = 'card__desc'
    p.textContent = item.description || ''
    body.appendChild(h3)
    body.appendChild(p)

    // Author meta if provided
    try{
      var uname = item.author_username ? ('@' + item.author_username) : ''
      var role = item.author_role ? (String(item.author_role).charAt(0).toUpperCase() + String(item.author_role).slice(1)) : ''
      var meta = [uname, role].filter(Boolean).join(' • ')
      if (meta){ var m = document.createElement('div'); m.className = 'card__desc'; m.textContent = meta; body.appendChild(m) }
    }catch(_){ }

    a.appendChild(imgWrap)
    a.appendChild(body)
    return a
  }

  async function renderFavorites(){
    var box = getEl('userFavorites')
    if (!box) return
    box.innerHTML = '<div class="notice">Loading favorites…</div>'
    var items = await loadFavorites(favPage, favPageSize)
    box.innerHTML = ''
    if (!items.length){
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No favorites yet.'
      box.appendChild(empty)
      renderFavPagination()
      return
    }
    items.forEach(function(it){ box.appendChild(createFavoriteCard(it)) })
    renderFavPagination()
  }

  function renderFavPagination(){
    var nav = getEl('favoritesPagination')
    if (!nav) return
    nav.innerHTML = ''
    var totalPages = Math.max(1, Math.ceil((favTotal||0) / favPageSize))
    if (totalPages <= 1){ nav.style.display = 'none'; return }
    nav.style.display = 'flex'
    function addBtn(label, disabled, onClick, active){
      var b = document.createElement('button')
      b.className = 'page'
      if (active) b.classList.add('page--active')
      b.textContent = label
      if (disabled) b.disabled = true
      b.addEventListener('click', function(e){ e.preventDefault(); onClick() })
      nav.appendChild(b)
    }
    addBtn('← Previous', favPage===1, function(){ favPage=Math.max(1, favPage-1); renderFavorites() })
    var start = Math.max(1, favPage-2), end = Math.min(totalPages, favPage+2)
    for (var i=start;i<=end;i++){ (function(p){ addBtn(String(p), false, function(){ favPage=p; renderFavorites() }, p===favPage) })(i) }
    addBtn('Next →', favPage===totalPages, function(){ favPage=Math.min(totalPages, favPage+1); renderFavorites() })
  }

  function editSubmission(submission){
    // Navigate to dedicated edit page
    var editUrl = './EditSubmission.html?id=' + encodeURIComponent(submission.id)
    window.location.href = editUrl
  }

  async function deleteSubmission(submissionId){
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return
    }

    try {
      var headers = { 'Content-Type': 'application/json' }
      if (window.CSRF_TOKEN) headers['X-CSRF-Token'] = window.CSRF_TOKEN
      var response = await fetch('../../api/arts.php?id=' + encodeURIComponent(submissionId), {
        method: 'DELETE',
        headers: headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete: ' + response.status)
      }

      // Refresh the display
      await renderUserSubmissions()

      alert('Submission deleted successfully.')
    } catch(err) {
      console.error('Delete error:', err)
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
    toggleBioEdit(false)
    toggleContactEdit(false)
    hydrate()
    
    // Update user display with actual user data
    updateUserDisplay()

    // Avatar fallback to a local placeholder if broken
    try{
      var avatarImg = document.querySelector('aside.card img[alt="avatar"]')
      if (avatarImg){
        var fallbackSrc = '/cycle2/imgs/images.jpeg'
        avatarImg.addEventListener('error', function(){
          if (avatarImg && avatarImg.src.indexOf(fallbackSrc) === -1) avatarImg.src = fallbackSrc
        })
      }
    }catch(_){ }

    // Inject simple Display Name editor (username/id immutable)
    try{
      var headerBox = document.querySelector('aside.card')
      var user = SessionManager.getCurrentUser()
      if (headerBox && user){
        var nameCtrl = document.createElement('div')
        nameCtrl.style.marginTop = '8px'

        var input = document.createElement('input')
        input.className = 'input'
        input.placeholder = 'Display name (max 50 characters)'
        input.style.display = 'none'
        input.maxLength = 50

        var editBtn = document.createElement('button')
        editBtn.className = 'btn btn--ghost'
        editBtn.type = 'button'
        editBtn.textContent = 'Edit Display Name'

        var saveBtn = document.createElement('button')
        saveBtn.className = 'btn'
        saveBtn.type = 'button'
        saveBtn.textContent = 'Save'
        saveBtn.style.display = 'none'

        function toggleNameEdit(on){
          input.style.display = on ? 'block' : 'none'
          saveBtn.style.display = on ? 'inline-block' : 'none'
          editBtn.style.display = on ? 'none' : 'inline-block'
          if (on){
            var profile = loadProfile()
            var current = (profile && profile.displayName) ? String(profile.displayName) : ''
            if (!current){ current = (user.email || '').split('@')[0] }
            input.value = current
            input.focus()
          }
        }

        editBtn.addEventListener('click', function(){ toggleNameEdit(true) })
        saveBtn.addEventListener('click', function(){
          var val = String(input.value || '').trim()
          if (!val){ alert('Display name cannot be empty.') ; return }
          if (val.length > 50){ alert('Display name must be 50 characters or less.') ; return }
          var p = loadProfile()
          p.displayName = val
          saveProfile(p)
          updateUserDisplay()
          toggleNameEdit(false)
        })

        nameCtrl.appendChild(editBtn)
        nameCtrl.appendChild(saveBtn)
        nameCtrl.appendChild(input)

        // Insert controls right after the header info block
        var infoEl = getEl('userInfo')
        if (infoEl && infoEl.parentNode){
          infoEl.parentNode.appendChild(nameCtrl)
        } else {
          headerBox.appendChild(nameCtrl)
        }
      }
    }catch(_){ }

    // Load and render user submissions
    renderUserSubmissions()
    // Load favorites
    renderFavorites()

    var bioEditBtn = getEl('bioEditBtn')
    var bioSaveBtn = getEl('bioSaveBtn')
    var bioCancelBtn = getEl('bioCancelBtn')
    var contactEditBtn = getEl('contactEditBtn')
    var contactSaveBtn = getEl('contactSaveBtn')
    var contactCancelBtn = getEl('contactCancelBtn')

    if (bioEditBtn) bioEditBtn.addEventListener('click', function(){ toggleBioEdit(true) })
    if (bioCancelBtn) bioCancelBtn.addEventListener('click', function(){ toggleBioEdit(false) })
    if (contactEditBtn) contactEditBtn.addEventListener('click', function(){ toggleContactEdit(true) })
    if (contactCancelBtn) contactCancelBtn.addEventListener('click', function(){ toggleContactEdit(false) })

    function handleBioSave(){
      var bio = (getEl('bioInput') && getEl('bioInput').value || '').trim()

      // Bio validation
      if (bio.length > 500) {
        alert('Bio must be 500 characters or less')
        return
      }

      var profile = loadProfile()
      profile.bio = bio
      saveProfile(profile)

      var bioText = getEl('bioText')
      if (bioText) bioText.textContent = bio || "I'm an art enthusiast"

      toggleBioEdit(false)
      try{ alert('Bio saved successfully!') }catch(_){ }
    }

    function validateEmail(email) {
      if (!email) return true // Allow empty email
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    function validatePhone(phone) {
      if (!phone) return true // Allow empty phone
      // Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
      var phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{7,20}$/
      return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
    }

    function validateAddress(address) {
      if (!address) return true // Allow empty address
      return address.length >= 5 && address.length <= 200
    }

    function handleContactSave(){
      var email = (getEl('contactEmailInput') && getEl('contactEmailInput').value || '').trim()
      var address = (getEl('contactAddressInput') && getEl('contactAddressInput').value || '').trim()
      var phone = (getEl('contactPhoneInput') && getEl('contactPhoneInput').value || '').trim()

      // Validation
      if (!validateEmail(email)) {
        alert('Please enter a valid email address (e.g., user@example.com)')
        return
      }

      if (!validatePhone(phone)) {
        alert('Please enter a valid phone number')
        return
      }

      if (!validateAddress(address)) {
        alert('Address must be between 5 and 200 characters if provided')
        return
      }

      var profile = loadProfile()
      profile.email = email
      profile.address = address
      profile.phone = phone
      saveProfile(profile)

      // Update display elements
      var emailDisplay = getEl('contactEmailDisplay')
      var addressDisplay = getEl('contactAddressDisplay')
      var phoneDisplay = getEl('contactPhoneDisplay')

      if (emailDisplay) emailDisplay.textContent = email || '-'
      if (addressDisplay) addressDisplay.textContent = address || '-'
      if (phoneDisplay) phoneDisplay.textContent = phone || '-'

      toggleContactEdit(false)
      try{ alert('Contact details saved successfully!') }catch(_){ }
    }

    if (bioSaveBtn) bioSaveBtn.addEventListener('click', handleBioSave)
    if (contactSaveBtn) contactSaveBtn.addEventListener('click', handleContactSave)
  })
})()
