;(function(){
  var container = document.getElementById('artsContainer')
  if (!container) return

  function apiBase(){ return '../../api/art.php' }

  function createCard(item){
    var a = document.createElement('a')
    a.className = 'card'
    a.href = './ArtDetail.html?id=' + encodeURIComponent(item.id)
    var imgWrap = document.createElement('div')
    imgWrap.className = 'card__img'
    var img = document.createElement('img')
    img.src = item.image || '../test.jpg'
    img.alt = (item.title || 'Artwork')
    imgWrap.appendChild(img)

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

    a.appendChild(imgWrap)
    a.appendChild(body)
    return a
  }

  var cache = []
  var currentSort = 'new' // Default sort option
  var currentPage = 1
  var itemsPerPage = 6
  var totalPages = 1
  var currentQuery = '' // Search query (case-insensitive)
  
  // Function to extract state from coordinates or locationNotes
  function extractState(locationNotes, lat, lng) {
    // First try to determine state from coordinates if available
    if (typeof lat === 'number' && typeof lng === 'number') {
      return getStateFromCoordinates(lat, lng)
    }
    
    // Fallback to text-based extraction if no coordinates
    if (!locationNotes || locationNotes.trim() === '') return null
    
    var location = locationNotes.toLowerCase()
    
    // Check for NSW (New South Wales)
    if (location.includes('new south wales') || location.includes('nsw') || location.includes('sydney')) {
      return 'nsw'
    }
    
    // Check for VIC (Victoria)
    if (location.includes('victoria') || location.includes('vic') || location.includes('melbourne')) {
      return 'vic'
    }
    
    // Check for SA (South Australia)
    if (location.includes('south australia') || location.includes('sa') || location.includes('adelaide')) {
      return 'sa'
    }
    
    // Check for QLD (Queensland)
    if (location.includes('queensland') || location.includes('qld') || location.includes('brisbane') || location.includes('cairns') || location.includes('gold coast')) {
      return 'qld'
    }
    
    // Check for WA (Western Australia)
    if (location.includes('western australia') || location.includes('wa') || location.includes('perth') || location.includes('fremantle')) {
      return 'wa'
    }
    
    // Check for TAS (Tasmania)
    if (location.includes('tasmania') || location.includes('tas') || location.includes('hobart') || location.includes('launceston')) {
      return 'tas'
    }
    
    // Check for NT (Northern Territory)
    if (location.includes('northern territory') || location.includes('nt') || location.includes('darwin') || location.includes('alice springs')) {
      return 'nt'
    }
    
    // Check for ACT (Australian Capital Territory)
    if (location.includes('australian capital territory') || location.includes('act') || location.includes('canberra')) {
      return 'act'
    }
    
    return null // No state found
  }
  
  // Function to determine Australian state from coordinates
  function getStateFromCoordinates(lat, lng) {
    // Approximate state boundaries for Australian states/territories
    
    // Western Australia
    if (lng < 129) return 'wa'
    
    // Northern Territory
    if (lng >= 129 && lng <= 138 && lat >= -26) return 'nt'
    
    // South Australia
    if (lng >= 129 && lng <= 141 && lat >= -38 && lat < -26) return 'sa'
    
    // Queensland
    if (lng >= 138 && lat >= -29) return 'qld'
    
    // New South Wales & ACT
    if (lng >= 141 && lng <= 154 && lat >= -37 && lat < -29) {
      // ACT is roughly around Canberra (-35.3, 149.1)
      if (lat >= -35.9 && lat <= -35.1 && lng >= 148.8 && lng <= 149.4) {
        return 'act'
      }
      return 'nsw'
    }
    
    // Victoria
    if (lng >= 141 && lng <= 150 && lat >= -39 && lat < -34) return 'vic'
    
    // Tasmania
    if (lat < -39) return 'tas'
    
    return null // Unable to determine state
  }
  
  function readFilters(){
    var typeCave = document.getElementById('filterTypeCave')
    var typeMural = document.getElementById('filterTypeMural')
    var periodAncient = document.getElementById('filterPeriodAncient')
    var periodContemporary = document.getElementById('filterPeriodContemporary')
    var stateNSW = document.getElementById('filterStateNSW')
    var stateVIC = document.getElementById('filterStateVIC')
    var stateSA = document.getElementById('filterStateSA')
    var stateQLD = document.getElementById('filterStateQLD')
    var stateWA = document.getElementById('filterStateWA')
    var stateTAS = document.getElementById('filterStateTAS')
    var stateNT = document.getElementById('filterStateNT')
    var stateACT = document.getElementById('filterStateACT')
    return {
      type: {
        cave: typeCave ? !!typeCave.checked : true,
        mural: typeMural ? !!typeMural.checked : true
      },
      period: {
        ancient: periodAncient ? !!periodAncient.checked : true,
        contemporary: periodContemporary ? !!periodContemporary.checked : true
      },
      state: {
        nsw: stateNSW ? !!stateNSW.checked : true,
        vic: stateVIC ? !!stateVIC.checked : true,
        sa: stateSA ? !!stateSA.checked : true,
        qld: stateQLD ? !!stateQLD.checked : true,
        wa: stateWA ? !!stateWA.checked : true,
        tas: stateTAS ? !!stateTAS.checked : true,
        nt: stateNT ? !!stateNT.checked : true,
        act: stateACT ? !!stateACT.checked : true
      }
    }
  }

  function sortArts(list) {
    if (!Array.isArray(list)) return list
    
    var sorted = list.slice() // Create a copy to avoid mutating original
    
    switch(currentSort) {
      case 'new':
        // Sort by createdAt descending (newest first)
        sorted.sort(function(a, b) {
          var dateA = new Date(a.createdAt || 0)
          var dateB = new Date(b.createdAt || 0)
          return dateB - dateA
        })
        break
      case 'date-asc':
        // Sort by createdAt ascending (oldest first)
        sorted.sort(function(a, b) {
          var dateA = new Date(a.createdAt || 0)
          var dateB = new Date(b.createdAt || 0)
          return dateA - dateB
        })
        break
      case 'date-desc':
        // Sort by createdAt descending (newest first)
        sorted.sort(function(a, b) {
          var dateA = new Date(a.createdAt || 0)
          var dateB = new Date(b.createdAt || 0)
          return dateB - dateA
        })
        break
      case 'title-asc':
        // Sort by title ascending (A-Z)
        sorted.sort(function(a, b) {
          var titleA = (a.title || '').toLowerCase()
          var titleB = (b.title || '').toLowerCase()
          return titleA.localeCompare(titleB)
        })
        break
      case 'title-desc':
        // Sort by title descending (Z-A)
        sorted.sort(function(a, b) {
          var titleA = (a.title || '').toLowerCase()
          var titleB = (b.title || '').toLowerCase()
          return titleB.localeCompare(titleA)
        })
        break
    }
    
    return sorted
  }

  function render(list){
    container.innerHTML = ''
    if (!Array.isArray(list) || list.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'notice notice--empty'
      empty.textContent = 'No arts found. Try different filters or keywords.'
      container.appendChild(empty)
      updatePagination(0)
      return
    }
    
    var sortedList = sortArts(list)
    totalPages = Math.ceil(sortedList.length / itemsPerPage)
    
    // Calculate pagination
    var startIndex = (currentPage - 1) * itemsPerPage
    var endIndex = startIndex + itemsPerPage
    var paginatedList = sortedList.slice(startIndex, endIndex)
    
    // Render only the current page items
    paginatedList.forEach(function(item){ 
      container.appendChild(createCard(item)) 
    })
    
    // Update pagination controls
    updatePagination(sortedList.length)
  }

  function applyFilters(options){
    options = options || {}
    var f = readFilters()
    var q = (currentQuery || '').trim().toLowerCase()
    var filtered = cache.filter(function(item){
      var t = (item.type || '').toLowerCase()
      var p = (item.period || '').toLowerCase()
      
      // Convert coordinates to numbers if they are strings
      var lat = item.lat
      var lng = item.lng
      if (typeof lat === 'string') lat = parseFloat(lat)
      if (typeof lng === 'string') lng = parseFloat(lng)
      
      var state = extractState(item.locationNotes, lat, lng)
      var haystack = ((item.title || '') + ' ' + (item.description || '') + ' ' + (item.locationNotes || '')).toLowerCase()
      
      console.log('Item:', item.title, 'Coords:', {lat: lat, lng: lng}, 'State:', state)
      
      
      var typeOk = (t === 'cave art' && f.type.cave) || (t === 'mural' && f.type.mural) || (!t)
      var periodOk = (p === 'ancient' && f.period.ancient) || (p === 'contemporary' && f.period.contemporary) || (!p)
      var queryOk = !q || haystack.indexOf(q) !== -1
      
      // State filtering logic - Simple and clear
      var stateOk = true
      
      if (state) {
        // If we can identify a state, only show if that state is selected
        stateOk = f.state[state] === true
      } else {
        // If no state can be identified, always show (don't filter by state)
        stateOk = true
      }
      
      return typeOk && periodOk && stateOk && queryOk
    })
    
    // Reset to first page when filters/sort change unless explicitly preserved
    if (!options.preservePage) {
      currentPage = 1
    }
    render(filtered)
  }

  function updateSortPills() {
    // Remove active class from all pills
    var pills = document.querySelectorAll('.pills .pill')
    pills.forEach(function(pill) {
      pill.classList.remove('pill--active')
      pill.setAttribute('aria-pressed', 'false')
    })
    
    // Add active class to current sort pill
    var sortMap = {
      'new': 0,
      'date-asc': 1,
      'date-desc': 2,
      'title-asc': 3,
      'title-desc': 4
    }
    
    var activeIndex = sortMap[currentSort]
    if (pills[activeIndex]) {
      pills[activeIndex].classList.add('pill--active')
      pills[activeIndex].setAttribute('aria-pressed', 'true')
    }
  }

  function setSort(sortType) {
    currentSort = sortType
    currentPage = 1 // Reset to first page when sorting changes
    updateSortPills()
    applyFilters({ preservePage: false }) // Re-apply filters with new sort
  }

  function updatePagination(totalItems) {
    var paginationContainer = document.querySelector('.pagination')
    if (!paginationContainer) {
      console.error('Pagination container not found!')
      return
    }
    
    totalPages = Math.ceil(totalItems / itemsPerPage)
    
    // Clear existing pagination
    paginationContainer.innerHTML = ''
    
    if (totalPages <= 1) {
      // Hide pagination if only one page or no items
      paginationContainer.style.display = 'none'
      return
    }
    
    paginationContainer.style.display = 'flex'
    
    // Previous button
    var prevButton = document.createElement('button')
    prevButton.className = 'page'
    prevButton.textContent = '← Previous'
    prevButton.disabled = currentPage === 1
    if (currentPage === 1) {
      prevButton.style.opacity = '0.5'
      prevButton.style.cursor = 'not-allowed'
    }
    prevButton.addEventListener('click', function(e) {
      e.preventDefault()
      if (currentPage > 1) {
        currentPage--
        applyFilters({ preservePage: true })
      }
    })
    paginationContainer.appendChild(prevButton)
    
    // Page numbers
    var startPage = Math.max(1, currentPage - 2)
    var endPage = Math.min(totalPages, currentPage + 2)
    
    // First page
    if (startPage > 1) {
      var firstPage = document.createElement('button')
      firstPage.className = 'page'
      firstPage.textContent = '1'
      firstPage.addEventListener('click', function() {
        currentPage = 1
        applyFilters()
      })
      paginationContainer.appendChild(firstPage)
      
      if (startPage > 2) {
        var ellipsis = document.createElement('span')
        ellipsis.textContent = '…'
        ellipsis.style.padding = '0 8px'
        paginationContainer.appendChild(ellipsis)
      }
    }
    
    // Page range
    for (var i = startPage; i <= endPage; i++) {
      var pageButton = document.createElement('button')
      pageButton.className = 'page'
      if (i === currentPage) {
        pageButton.classList.add('page--active')
        pageButton.setAttribute('aria-current', 'page')
      }
      pageButton.textContent = i.toString()
      pageButton.addEventListener('click', function(pageNum) {
        return function(e) {
          e.preventDefault()
          currentPage = pageNum
          applyFilters({ preservePage: true })
        }
      }(i))
      paginationContainer.appendChild(pageButton)
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        var ellipsis = document.createElement('span')
        ellipsis.textContent = '…'
        ellipsis.style.padding = '0 8px'
        paginationContainer.appendChild(ellipsis)
      }
      
      var lastPage = document.createElement('button')
      lastPage.className = 'page'
      lastPage.textContent = totalPages.toString()
      lastPage.addEventListener('click', function(e) {
        e.preventDefault()
        currentPage = totalPages
        applyFilters({ preservePage: true })
      })
      paginationContainer.appendChild(lastPage)
    }
    
    // Next button
    var nextButton = document.createElement('button')
    nextButton.className = 'page'
    nextButton.textContent = 'Next →'
    nextButton.disabled = currentPage === totalPages
    if (currentPage === totalPages) {
      nextButton.style.opacity = '0.5'
      nextButton.style.cursor = 'not-allowed'
    }
    nextButton.addEventListener('click', function(e) {
      e.preventDefault()
      if (currentPage < totalPages) {
        currentPage++
        applyFilters({ preservePage: true })
      }
    })
    paginationContainer.appendChild(nextButton)
  }

  function hookInputs(){
    ;['filterTypeCave','filterTypeMural','filterPeriodAncient','filterPeriodContemporary','filterStateNSW','filterStateVIC','filterStateSA','filterStateQLD','filterStateWA','filterStateTAS','filterStateNT','filterStateACT'].forEach(function(id){
      var el = document.getElementById(id)
      if (el) el.addEventListener('change', applyFilters)
    })
    
    // Hook up sort pill buttons
    var sortButtons = document.querySelectorAll('.pills .pill')
    var pillsContainer = document.querySelector('.pills')
    if (pillsContainer) {
      // Provide grouping semantics for assistive technologies
      pillsContainer.setAttribute('role', 'group')
      pillsContainer.setAttribute('aria-label', pillsContainer.getAttribute('aria-label') || 'Sort')
    }
    sortButtons.forEach(function(button, index) {
      button.addEventListener('click', function() {
        var sortTypes = ['new', 'date-asc', 'date-desc', 'title-asc', 'title-desc']
        setSort(sortTypes[index])
      })
    })

    // Hook up search input and button
    var searchInput = document.querySelector('.searchbar__input')
    var searchButton = document.querySelector('.searchbar .btn')

    function triggerSearch(preservePage){
      currentQuery = (searchInput && searchInput.value) ? searchInput.value : ''
      applyFilters({ preservePage: !!preservePage })
    }

    if (searchInput){
      // Live filter as user types
      searchInput.addEventListener('input', function(){ triggerSearch(false) })
      // Enter key triggers search
      searchInput.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){
          e.preventDefault()
          triggerSearch(false)
        }
      })
    }
    if (searchButton){
      searchButton.addEventListener('click', function(e){
        e.preventDefault()
        triggerSearch(false)
      })
    }
  }

  // Load all data from localStorage only (C2 frontend-only approach)
  function loadAllArts() {
    try {
      var allData = localStorage.getItem('iaa_arts_v1')
      cache = allData ? JSON.parse(allData) : []
      
      // Initialize with some mock data if localStorage is empty
      if (cache.length === 0) {
        initializeMockData()
        // Reload after initialization
        allData = localStorage.getItem('iaa_arts_v1')
        cache = allData ? JSON.parse(allData) : []
      }
      
      hookInputs()
      updateSortPills()
      applyFilters({ preservePage: false })
    } catch(err) {
      container.innerHTML = '<div class="notice notice--error">Failed to load arts data.</div>'
    }
  }

  function initializeMockData() {
    var mockArts = [
      {
        id: 'mock-1',
        title: 'Blue Mountains Ancient Engravings',
        description: 'Traditional Aboriginal rock engravings depicting hunting scenes and sacred symbols',
        type: 'Cave Art',
        period: 'Ancient',
        condition: 'Good',
        image: '../imgs/Featuredart1.jpg',
        locationNotes: 'Blue Mountains National Park, New South Wales',
        lat: -33.7152,
        lng: 150.3107,
        sensitive: false,
        privateLand: false,
        creditKnownArtist: false,
        createdAt: '2024-01-15T10:00:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-2',
        title: 'Melbourne Urban Indigenous Mural',
        description: 'Contemporary street art celebrating urban Aboriginal culture in Melbourne CBD',
        type: 'Mural',
        period: 'Contemporary',
        condition: 'Excellent',
        image: '../imgs/Featuredart2.jpg',
        locationNotes: 'Melbourne CBD, Victoria',
        lat: -37.8136,
        lng: 144.9631,
        sensitive: true,
        privateLand: false,
        creditKnownArtist: true,
        createdAt: '2024-02-20T14:30:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-3',
        title: 'Carnarvon Gorge Rock Art',
        description: 'Ancient Aboriginal cave paintings and hand stencils in Queensland highlands',
        type: 'Cave Art',
        period: 'Ancient',
        condition: 'Fair',
        image: '../imgs/Featuredart3.jpg',
        locationNotes: 'Carnarvon Gorge, Queensland',
        lat: -25.0,
        lng: 148.0,
        sensitive: false,
        privateLand: true,
        creditKnownArtist: false,
        createdAt: '2024-03-10T09:15:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-4',
        title: 'Fremantle Cultural Center Mural',
        description: 'Modern Aboriginal artwork celebrating Noongar heritage and connection to country',
        type: 'Mural',
        period: 'Contemporary',
        condition: 'Excellent',
        image: '../imgs/3f217877787f6e0fb348a6d997502516.avif',
        locationNotes: 'Fremantle Cultural Centre, Western Australia',
        lat: -32.0569,
        lng: 115.7574,
        sensitive: false,
        privateLand: false,
        creditKnownArtist: true,
        createdAt: '2024-04-05T16:20:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-5',
        title: 'Flinders Ranges Sacred Site',
        description: 'Sacred Aboriginal cave art with ceremonial significance in South Australian outback',
        type: 'Cave Art',
        period: 'Ancient',
        condition: 'Good',
        image: '../imgs/aih-artwork.jpg',
        locationNotes: 'Flinders Ranges, South Australia',
        lat: -31.2,
        lng: 138.6,
        sensitive: true,
        privateLand: false,
        creditKnownArtist: false,
        createdAt: '2024-05-12T11:45:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-6',
        title: 'MONA Aboriginal Art Installation',
        description: 'Contemporary indigenous art installation exploring themes of identity and place',
        type: 'Mural',
        period: 'Contemporary',
        condition: 'Excellent',
        image: '../imgs/ATSIintheclassroomfront_SRGB2000px.webp',
        locationNotes: 'Museum of Old and New Art, Hobart, Tasmania',
        lat: -42.8821,
        lng: 147.3272,
        sensitive: true,
        privateLand: false,
        creditKnownArtist: true,
        createdAt: '2024-06-18T13:30:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-7',
        title: 'Kakadu Sacred Cave Paintings',
        description: 'Highly sensitive Aboriginal cave art with restricted cultural access in Kakadu',
        type: 'Cave Art',
        period: 'Ancient',
        condition: 'Fair',
        image: '../imgs/b_7122.webp',
        locationNotes: 'Kakadu National Park, Northern Territory',
        lat: -12.6,
        lng: 132.9,
        sensitive: true,
        privateLand: true,
        creditKnownArtist: false,
        createdAt: '2024-07-22T08:00:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      },
      {
        id: 'mock-8',
        title: 'Parliament House Indigenous Art',
        description: 'Contemporary Aboriginal artwork commissioned for national cultural significance',
        type: 'Mural',
        period: 'Contemporary',
        condition: 'Excellent',
        image: '../imgs/images.jpeg',
        locationNotes: 'Parliament House, Canberra, ACT',
        lat: -35.3081,
        lng: 149.1245,
        sensitive: false,
        privateLand: true,
        creditKnownArtist: true,
        createdAt: '2024-08-30T15:10:00Z',
        submittedBy: 'admin@iaa.gov.au',
        status: 'approved'
      }
    ]

    localStorage.setItem('iaa_arts_v1', JSON.stringify(mockArts))
  }

  loadAllArts()
})()
