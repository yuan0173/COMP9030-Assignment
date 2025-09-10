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
  function readFilters(){
    var typeCave = document.getElementById('filterTypeCave')
    var typeMural = document.getElementById('filterTypeMural')
    var periodAncient = document.getElementById('filterPeriodAncient')
    var periodContemporary = document.getElementById('filterPeriodContemporary')
    return {
      type: {
        cave: typeCave ? !!typeCave.checked : true,
        mural: typeMural ? !!typeMural.checked : true
      },
      period: {
        ancient: periodAncient ? !!periodAncient.checked : true,
        contemporary: periodContemporary ? !!periodContemporary.checked : true
      }
    }
  }

  function render(list){
    container.innerHTML = ''
    if (!Array.isArray(list) || list.length === 0) {
      var empty = document.createElement('div')
      empty.className = 'card__desc'
      empty.textContent = 'No arts yet. Be the first to submit!'
      container.appendChild(empty)
      return
    }
    list.forEach(function(item){ container.appendChild(createCard(item)) })
  }

  function applyFilters(){
    var f = readFilters()
    var filtered = cache.filter(function(item){
      var t = (item.type || '').toLowerCase()
      var p = (item.period || '').toLowerCase()
      var typeOk = (t === 'cave art' && f.type.cave) || (t === 'mural' && f.type.mural) || (!t)
      var periodOk = (p === 'ancient' && f.period.ancient) || (p === 'contemporary' && f.period.contemporary) || (!p)
      return typeOk && periodOk
    })
    render(filtered)
  }

  function hookInputs(){
    ;['filterTypeCave','filterTypeMural','filterPeriodAncient','filterPeriodContemporary'].forEach(function(id){
      var el = document.getElementById(id)
      if (el) el.addEventListener('change', applyFilters)
    })
  }

  fetch(apiBase()).then(function(r){ return r.json() }).then(function(list){
    cache = Array.isArray(list) ? list : []
    hookInputs()
    applyFilters()
  }).catch(function(err){
    container.innerHTML = '<div class="card__desc">Failed to load: ' + err + '</div>'
  })
})()


