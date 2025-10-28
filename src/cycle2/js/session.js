;(function(){
  'use strict';

  // Session management utility
  var SessionManager = {
    AUTH_KEY: 'iaa_auth_v1',
    SESSION_KEY: 'iaa_session_v1',
    
    // Initialize session on page load
    init: function() {
      this.restoreSession();
      this.updateNavigation();
    },

    // Login user and create session
    login: function(userData) {
      try {
        var sessionData = {
          user: userData,
          loginTime: Date.now(),
          lastActivity: Date.now()
        };
        
        // Store both auth and session data
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(userData));
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        
        this.updateNavigation();
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      }
    },

    // Logout user and clear session
    logout: function() {
      try {
        // Also tell backend to clear PHP session (best-effort)
        try {
          var headers = { 'Content-Type': 'application/json' }
          if (typeof window !== 'undefined' && window.CSRF_TOKEN) {
            headers['X-CSRF-Token'] = window.CSRF_TOKEN
          }
          fetch('/api/auth.php?action=logout', {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify({})
          }).catch(function(){ /* ignore */ })
        } catch (_e) {}

        localStorage.removeItem(this.AUTH_KEY);
        localStorage.removeItem(this.SESSION_KEY);
        this.updateNavigation();
        
        // Redirect to login page
        window.location.href = './UserLogIn.html';
        return true;
      } catch (error) {
        console.error('Logout failed:', error);
        return false;
      }
    },

    // Check if user is logged in
    isLoggedIn: function() {
      try {
        var authData = localStorage.getItem(this.AUTH_KEY);
        var sessionData = localStorage.getItem(this.SESSION_KEY);
        
        if (!authData || !sessionData) {
          return false;
        }
        
        var session = JSON.parse(sessionData);
        var now = Date.now();
        
        // Check if session is expired (24 hours)
        var sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (now - session.loginTime > sessionTimeout) {
          this.logout();
          return false;
        }
        
        // Update last activity
        session.lastActivity = now;
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        
        return true;
      } catch (error) {
        console.error('Session check failed:', error);
        return false;
      }
    },

    // Get current user data
    getCurrentUser: function() {
      try {
        if (!this.isLoggedIn()) {
          return null;
        }
        
        var authData = localStorage.getItem(this.AUTH_KEY);
        return JSON.parse(authData);
      } catch (error) {
        console.error('Get user failed:', error);
        return null;
      }
    },

    // Restore session on page load
    restoreSession: function() {
      if (this.isLoggedIn()) {
        var user = this.getCurrentUser();
        return user;
      }
      return null;
    },

    // Update navigation based on auth state
    updateNavigation: function() {
      var authSection = document.querySelector('.auth');
      if (!authSection) return;

      var user = this.getCurrentUser();
      
      if (user) {
        // User is logged in
        authSection.innerHTML = `
          <span class="user-info" style="margin-right: 12px; color: var(--text-secondary);">
            Welcome, ${user.email}
          </span>
          <a class="btn btn--ghost" href="#" onclick="SessionManager.logout()">Sign out</a>
          ${user.role === 'artist' ? '<a class="btn" href="./Submission.html">Submit Art</a>' : ''}
        `;
      } else {
        // User is not logged in
        authSection.innerHTML = `
          <a class="btn btn--ghost" href="./UserLogIn.html">Sign in</a>
          <a class="btn" href="./UserRegistration.html">Sign up</a>
        `;
      }
    },

    // Redirect to appropriate page based on user role
    redirectAfterLogin: function() {
      var user = this.getCurrentUser();
      if (!user) return;

      if (user.role === 'admin') {
        window.location.href = '/cycle2/Pages/AdminDashboard.html';
      } else {
        window.location.href = './UserProfile.html';
      }
    },

    // Check if user has required role
    hasRole: function(requiredRole) {
      var user = this.getCurrentUser();
      return user && user.role === requiredRole;
    },

    // Require authentication for protected pages
    requireAuth: function(redirectTo) {
      if (!this.isLoggedIn()) {
        window.location.href = redirectTo || './UserLogIn.html';
        return false;
      }
      return true;
    },

    // Require specific role for protected pages
    requireRole: function(requiredRole, redirectTo) {
      if (!this.requireAuth(redirectTo)) {
        return false;
      }
      
      if (!this.hasRole(requiredRole)) {
        alert('You do not have permission to access this page.');
        window.location.href = './Home.html';
        return false;
      }
      
      return true;
    }
  };

  // Make SessionManager globally available
  window.SessionManager = SessionManager;

  // Auto-initialize when DOM is ready
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function() {
    SessionManager.init();
  });

})();
