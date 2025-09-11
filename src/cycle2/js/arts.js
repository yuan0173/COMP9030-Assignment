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
    img.alt = 'art'
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
  
  // Function to extract state from locationNotes
  function extractState(locationNotes) {
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
      empty.className = 'card__desc'
      empty.textContent = 'No arts yet. Be the first to submit!'
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
    var filtered = cache.filter(function(item){
      var t = (item.type || '').toLowerCase()
      var p = (item.period || '').toLowerCase()
      var state = extractState(item.locationNotes)
      
      var typeOk = (t === 'cave art' && f.type.cave) || (t === 'mural' && f.type.mural) || (!t)
      var periodOk = (p === 'ancient' && f.period.ancient) || (p === 'contemporary' && f.period.contemporary) || (!p)
      
      // State filtering logic
      var stateOk = true
      if (state) {
        // If we can identify a state, check if it's enabled
        stateOk = f.state[state] === true
      } else {
        // If no state can be identified, include it only if all state filters are checked
        // or if it's an empty locationNotes (show items without location info)
        var allStatesChecked = f.state.nsw && f.state.vic && f.state.sa && f.state.qld && f.state.wa && f.state.tas && f.state.nt && f.state.act
        stateOk = allStatesChecked || !item.locationNotes || item.locationNotes.trim() === ''
      }
      
      return typeOk && periodOk && stateOk
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
    console.log('Updating pagination:', { totalItems, totalPages, currentPage, itemsPerPage })
    
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
      console.log('Previous button clicked, currentPage:', currentPage)
      if (currentPage > 1) {
        currentPage--
        console.log('Going to page:', currentPage)
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
          console.log('Page button clicked, page:', pageNum, 'currentPage:', currentPage)
          currentPage = pageNum
          console.log('Going to page:', currentPage)
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
        console.log('Last page button clicked, page:', totalPages)
        currentPage = totalPages
        console.log('Going to page:', currentPage)
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
      console.log('Next button clicked, currentPage:', currentPage, 'totalPages:', totalPages)
      if (currentPage < totalPages) {
        currentPage++
        console.log('Going to page:', currentPage)
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
    sortButtons.forEach(function(button, index) {
      button.addEventListener('click', function() {
        var sortTypes = ['new', 'date-asc', 'date-desc', 'title-asc', 'title-desc']
        setSort(sortTypes[index])
      })
    })
  }

  fetch(apiBase()).then(function(r){ return r.json() }).then(function(list){
    cache = Array.isArray(list) ? list : []
    hookInputs()
    updateSortPills() // Set initial sort pill state
    applyFilters({ preservePage: false })
  }).catch(function(err){
    container.innerHTML = '<div class="card__desc">Failed to load: ' + err + '</div>'
  })
})()


