;(function(){
  'use strict'

  // Simple seed and accessors for admin mock data in localStorage.
  // This enables C2 front-end prototypes to share consistent data across pages.

  var KEYS = {
    submissions: 'admin_submissions_v1',
    users: 'admin_users_v1',
    types: 'admin_types_v1',
    periods: 'admin_periods_v1'
  }

  function has(key){
    try{ return !!localStorage.getItem(key) }catch(_){ return false }
  }

  function set(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)) }catch(_){ }
  }

  function get(key){
    try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : null }catch(_){ return null }
  }

  function randomId(prefix){ return (prefix || 'id_') + Math.random().toString(36).slice(2,8) }

  function seedSubmissions(){
    var statuses = ['Pending','Pending','Approved','Rejected']
    var levels = ['exact','locality','region','hidden']
    var names = ['Rock Painting','Mural at Station','Cave Art Panel','Carving Site','Gallery Piece','Riverbank Motif']
    var submitters = ['@alice','@bob','@carol','@dave','@erin']
    var arr = []
    for (var i=0;i<16;i++){
      var s = statuses[i % statuses.length]
      var dl = levels[i % levels.length]
      arr.push({
        id: randomId('art_'),
        title: names[i % names.length] + ' #' + (i+1),
        status: s,
        submitter: submitters[i % submitters.length],
        createdAt: new Date(Date.now() - i*86400000).toISOString(),
        lat: -34.9 + (i*0.01),
        lng: 138.6 + (i*0.01),
        locationNotes: 'Sample location note ' + (i+1),
        images: [],
        displayLevel: dl
      })
    }
    set(KEYS.submissions, arr)
  }

  function seedUsers(){
    var roles = ['public','artist','admin']
    var statuses = ['active','active','suspended']
    var arr = []
    for (var i=0;i<12;i++){
      arr.push({
        id: randomId('user_'),
        username: 'user' + (i+1),
        email: 'user' + (i+1) + '@example.com',
        role: roles[i % roles.length],
        status: statuses[i % statuses.length],
        createdAt: new Date(Date.now() - i*172800000).toISOString()
      })
    }
    // Ensure at least one admin user
    arr[1].role = 'admin'
    set(KEYS.users, arr)
  }

  function seedTaxonomies(){
    set(KEYS.types, ['Cave Art','Mural','Carving','Installation'])
    set(KEYS.periods, ['Ancient','Contemporary'])
  }

  function seedIfNeeded(){
    if (!has(KEYS.submissions)) seedSubmissions()
    if (!has(KEYS.users)) seedUsers()
    if (!has(KEYS.types)) seedTaxonomies()
    if (!has(KEYS.periods)) seedTaxonomies()
  }

  // Expose a tiny API for other admin pages
  window.AdminData = {
    KEYS: KEYS,
    seedIfNeeded: seedIfNeeded,
    get: get,
    set: set
  }

  // Auto-seed on load (safe no-op if already present)
  seedIfNeeded()
})();

