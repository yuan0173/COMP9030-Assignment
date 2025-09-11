;(function(){
  'use strict';

  function ready(fn){
    if (document.readyState !== 'loading') fn()
    else document.addEventListener('DOMContentLoaded', fn)
  }

  function setOutline(el, on){ 
    if (el) el.style.outline = on ? '2px solid #ef4444' : '' 
  }

  // User storage management
  var UserStorage = {
    USERS_KEY: 'iaa_users_v1',
    
    // Get all users from localStorage
    getUsers: function() {
      try {
        var users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : [];
      } catch (error) {
        console.error('Error loading users:', error);
        return [];
      }
    },
    
    // Save users to localStorage
    saveUsers: function(users) {
      try {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return true;
      } catch (error) {
        console.error('Error saving users:', error);
        return false;
      }
    },
    
    // Add a new user
    addUser: function(userData) {
      var users = this.getUsers();
      
      // Check if user already exists
      var existingUser = users.find(function(u) {
        return u.email.toLowerCase() === userData.email.toLowerCase();
      });
      
      if (existingUser) {
        return { success: false, message: 'User with this email already exists.' };
      }
      
      // Add new user with default role as 'visitor'
      var newUser = {
        role: 'visitor',
        email: userData.email.toLowerCase(),
        password: userData.password,
        registeredAt: Date.now()
      };
      
      users.push(newUser);
      
      if (this.saveUsers(users)) {
        return { success: true, user: newUser };
      } else {
        return { success: false, message: 'Failed to save user data.' };
      }
    },
    
    // Find user by email and password
    findUser: function(email, password) {
      var users = this.getUsers();
      return users.find(function(u) {
        return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
      });
    }
  };

  // Form validation functions
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    // At least 6 characters
    return password && password.length >= 6;
  }

  function validatePasswordMatch(password, confirmPassword) {
    return password === confirmPassword;
  }

  ready(function(){
    var form = document.querySelector('form.form');
    if (!form) return;

    var emailInput = form.querySelector('input[type="email"]');
    var passwordInput = form.querySelector('input[type="password"]');
    var confirmPasswordInput = form.querySelectorAll('input[type="password"]')[1];
    var submitButton = form.querySelector('button[type="submit"]');

    // Create error message elements if they don't exist
    var errorMessage = document.getElementById('errorMessage');
    if (!errorMessage) {
      errorMessage = document.createElement('div');
      errorMessage.id = 'errorMessage';
      errorMessage.style.display = 'none';
      errorMessage.style.color = '#ef4444';
      errorMessage.style.marginTop = '12px';
      errorMessage.style.textAlign = 'center';
      form.appendChild(errorMessage);
    }

    var errorText = document.getElementById('errorText');
    if (!errorText) {
      errorText = document.createElement('div');
      errorText.id = 'errorText';
      errorMessage.appendChild(errorText);
    }

    function clearOutlines(){
      setOutline(emailInput, false);
      setOutline(passwordInput, false);
      setOutline(confirmPasswordInput, false);
    }

    function showError(message) {
      if (errorText) {
        errorText.textContent = message;
      }
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
    }

    function hideError() {
      if (errorMessage) {
        errorMessage.style.display = 'none';
      }
    }

    function showSuccess(message) {
      if (errorText) {
        errorText.textContent = message;
        errorText.style.color = '#10b981';
      }
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
    }

    // Form submission handler
    form.addEventListener('submit', function(e){
      e.preventDefault();
      clearOutlines();
      hideError();

      var email = (emailInput && emailInput.value || '').trim();
      var password = (passwordInput && passwordInput.value || '').trim();
      var confirmPassword = (confirmPasswordInput && confirmPasswordInput.value || '').trim();

      // Validate email
      if (!email) {
        setOutline(emailInput, true);
        showError('Please enter your email address.');
        return;
      }
      
      if (!validateEmail(email)) {
        setOutline(emailInput, true);
        showError('Please enter a valid email address.');
        return;
      }

      // Validate password
      if (!password) {
        setOutline(passwordInput, true);
        showError('Please enter a password.');
        return;
      }

      if (!validatePassword(password)) {
        setOutline(passwordInput, true);
        showError('Password must be at least 6 characters long.');
        return;
      }

      // Validate password confirmation
      if (!confirmPassword) {
        setOutline(confirmPasswordInput, true);
        showError('Please confirm your password.');
        return;
      }

      if (!validatePasswordMatch(password, confirmPassword)) {
        setOutline(confirmPasswordInput, true);
        showError('Passwords do not match.');
        return;
      }

      // Attempt to register user
      var result = UserStorage.addUser({
        email: email,
        password: password
      });

      if (result.success) {
        showSuccess('Registration successful! Redirecting to login...');
        
        // Clear form
        form.reset();
        
        // Redirect to login page after a short delay
        setTimeout(function() {
          window.location.href = './UserLogIn.html';
        }, 2000);
      } else {
        showError(result.message);
      }
    });

    // Clear error when user starts typing
    if (emailInput) {
      emailInput.addEventListener('input', hideError);
    }
    if (passwordInput) {
      passwordInput.addEventListener('input', hideError);
    }
    if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', hideError);
    }
  });

  // Make UserStorage available globally for other scripts
  window.UserStorage = UserStorage;

})();
