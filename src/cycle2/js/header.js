;(function(){
  'use strict';

  // Header Component
  var HeaderComponent = {
    
    // Page types and their configurations
    pageTypes: {
      'home': {
        logo: 'IAA',
        navItems: [
          { href: './Home.html', text: 'Home', current: true },
          { href: './About.html', text: 'About' },
          { href: './Guideline.html', text: 'Guidelines' },
      { href: '/cycle3/arts_list.php', text: 'Arts' },
          { href: './Contact.html', text: 'Contact' }
        ]
      },
      'regular': {
        logo: 'IAA',
        navItems: [
          { href: './Home.html', text: 'Home' },
          { href: './About.html', text: 'About' },
          { href: './Guideline.html', text: 'Guidelines' },
      { href: '/cycle3/arts_list.php', text: 'Arts' },
          { href: './Contact.html', text: 'Contact' }
        ]
      },
      'profile': {
        logo: 'IAA',
        navItems: [
          { href: './Home.html', text: 'Home' },
          { href: './About.html', text: 'About' },
          { href: './Guideline.html', text: 'Guidelines' },
      { href: '/cycle3/arts_list.php', text: 'Arts' },
          { href: './Contact.html', text: 'Contact' }
        ]
      },
      'admin': {
        logo: 'IAA • Admin',
        navItems: [
          { href: './AdminDashboard.html', text: 'Dashboard' },
          { href: './AdminUserManagement.html', text: 'Users' },
          { href: './AdminSubmissionList.html', text: 'Submissions' },
          { href: './AdminReportList.html', text: 'Moderation' }
        ]
      }
    },

    // Detect page type based on current URL
    detectPageType: function() {
      var path = window.location.pathname;
      var filename = path.split('/').pop();
      
      if (filename === 'Home.html' || filename === '') {
        return 'home';
      } else if (filename.startsWith('Admin')) {
        return 'admin';
      } else if (filename === 'UserProfile.html' || filename === 'Submission.html') {
        return 'profile';
      } else {
        return 'regular';
      }
    },

    // Get current page for highlighting active nav item
    getCurrentPage: function() {
      var path = window.location.pathname;
      var filename = path.split('/').pop();
      
      // Map filenames to nav text
      var pageMap = {
        'Home.html': 'Home',
        'About.html': 'About',
        'Guideline.html': 'Guidelines',
    '/cycle3/arts_list.php': 'Arts',
        'Map.html': 'Map',
        'Contact.html': 'Contact',
        'AdminDashboard.html': 'Dashboard',
        'AdminUserManagement.html': 'Users',
        'AdminSubmissionList.html': 'Submissions',
        'AdminReportList.html': 'Moderation'
      };
      
      return pageMap[filename] || '';
    },

    // Generate navigation HTML
    generateNavHTML: function(navItems, currentPage) {
      return navItems.map(function(item) {
        var isCurrent = item.text === currentPage || item.current;
        var currentAttr = isCurrent ? ' aria-current="page"' : '';
        return '<a href="' + item.href + '"' + currentAttr + '>' + item.text + '</a>';
      }).join('\n          ');
    },

    // Generate auth section HTML based on login status
    generateAuthHTML: function() {
      var user = (typeof SessionManager !== 'undefined' && SessionManager) ? SessionManager.getCurrentUser() : null;
      
      if (user) {
        var authHTML = '<span class="user-info" style="margin-right: 12px; color: var(--text-secondary);">Welcome, ' + user.email + '</span>';
        
        // Add dashboard link based on user role
        if (user.role === 'admin') {
          authHTML += '<a class="btn btn--ghost" href="./AdminDashboard.html">Dashboard</a>';
        } else {
          authHTML += '<a class="btn btn--ghost" href="./UserProfile.html">Dashboard</a>';
        }
        
        authHTML += '<a class="btn btn--ghost" href="#" onclick="SessionManager.logout()">Sign out</a>';
        
        return authHTML;
      } else {
        return '<a class="btn btn--ghost" href="./UserLogIn.html">Sign in</a>\n          <a class="btn" href="./UserRegistration.html">Register</a>';
      }
    },

    // Generate complete header HTML
    generateHeaderHTML: function(pageType, currentPage) {
      var config = this.pageTypes[pageType] || this.pageTypes['regular'];
      var navHTML = this.generateNavHTML(config.navItems, currentPage);
      var authHTML = this.generateAuthHTML();
      
      return '<header class="nav">\n' +
        '      <div class="nav__inner container flex-between">\n' +
        '        <div class="logo">' + config.logo + '</div>\n' +
        '        <nav class="nav__menu">\n' +
        '          ' + navHTML + '\n' +
        '        </nav>\n' +
        '        <div class="auth">\n' +
        '          ' + authHTML + '\n' +
        '        </div>\n' +
        '      </div>\n' +
        '    </header>';
    },

    // Render header to page
    render: function() {
      var pageType = this.detectPageType();
      var currentPage = this.getCurrentPage();
      var headerHTML = this.generateHeaderHTML(pageType, currentPage);
      
      // Find existing header and replace it
      var existingHeader = document.querySelector('header.nav');
      if (existingHeader) {
        existingHeader.outerHTML = headerHTML;
      } else {
        // If no existing header, insert at the beginning of body
        var body = document.body;
        if (body) {
          body.insertAdjacentHTML('afterbegin', headerHTML);
        }
      }
    },

    // Initialize header component
    init: function() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.render.bind(this));
      } else {
        this.render();
      }
    }
  };

  // Make HeaderComponent globally available
  window.HeaderComponent = HeaderComponent;

  // Auto-initialize when DOM is ready
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function() {
    HeaderComponent.init();
  });

})();
