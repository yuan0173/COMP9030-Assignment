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
      
      // Add new user with selected role (default to 'public')
      var newUser = {
        role: userData.role || 'public',
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

  // MODIFIED: require letters and numbers, length 6-16
  function validatePassword(password) {
    // At least 6 characters (original comment preserved)
    // MODIFIED: now require at least one letter and one digit, and maximum length 16
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,16}$/.test(password);
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

    // NEW: Add small red error placeholders under each input
    function createFieldError(el) {
      var span = document.createElement('div');
      span.className = 'field-error';
      span.style.color = '#ef4444';
      span.style.fontSize = '0.85em';
      span.style.marginTop = '4px';
      span.style.display = 'none';
      el.parentNode.appendChild(span);
      return span;
    }

    var emailFieldError = createFieldError(emailInput);
    var passwordFieldError = createFieldError(passwordInput);
    var confirmFieldError = createFieldError(confirmPasswordInput);

    function clearOutlines(){
      setOutline(emailInput, false);
      setOutline(passwordInput, false);
      setOutline(confirmPasswordInput, false);
    }

    function showError(message, input) {
      if (errorText) {
        errorText.textContent = message;
      }
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }

      // NEW: show error under specific field
      if (input === emailInput) {
        emailFieldError.textContent = message;
        emailFieldError.style.display = 'block';
      } else if (input === passwordInput) {
        passwordFieldError.textContent = message;
        passwordFieldError.style.display = 'block';
      } else if (input === confirmPasswordInput) {
        confirmFieldError.textContent = message;
        confirmFieldError.style.display = 'block';
      }
    }

    function hideAllFieldErrors() {
      emailFieldError.style.display = 'none';
      passwordFieldError.style.display = 'none';
      confirmFieldError.style.display = 'none';
    }

    function hideError() {
      if (errorMessage) {
        errorMessage.style.display = 'none';
      }
      hideAllFieldErrors();
    }

    function showSuccess(message) {
      if (errorText) {
        errorText.textContent = message;
        errorText.style.color = '#10b981';
      }
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
      hideAllFieldErrors(); // NEW: remove field-level red errors when success
    }

    // Form submission handler
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      clearOutlines();
      hideError();

      var email = (emailInput && emailInput.value || '').trim();
      var password = (passwordInput && passwordInput.value || '').trim();
      var confirmPassword = (confirmPasswordInput && confirmPasswordInput.value || '').trim();

      // Validate email
      if (!email) {
        setOutline(emailInput, true);
        showError('Please enter your email address.', emailInput);
        return;
      }
      
      if (!validateEmail(email)) {
        setOutline(emailInput, true);
        showError('Please enter a valid email address.', emailInput);
        return;
      }

      // Validate password
      if (!password) {
        setOutline(passwordInput, true);
        showError('Please enter a password.', passwordInput);
        return;
      }

      // MODIFIED: show message matching the new rule
      if (!validatePassword(password)) {
        setOutline(passwordInput, true);
        showError('Password must be 6-16 characters and include both letters and numbers.', passwordInput);
        return;
      }

      // Validate password confirmation
      if (!confirmPassword) {
        setOutline(confirmPasswordInput, true);
        showError('Please confirm your password.', confirmPasswordInput);
        return;
      }

      if (!validatePasswordMatch(password, confirmPassword)) {
        setOutline(confirmPasswordInput, true);
        showError('Passwords do not match.', confirmPasswordInput);
        return;
      }

      // Get selected role from form
      var roleInput = form.querySelector('input[name="userRole"]:checked');
      var selectedRole = roleInput ? roleInput.value : 'public';

      // Try backend register first
      try {
        var resp = await fetch('../api/auth.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email, password: password, role: selectedRole })
        })
        var data = await resp.json()
        if (!resp.ok || (data && data.error)) {
          throw new Error((data && data.error) || ('HTTP ' + resp.status))
        }
        showSuccess('Registration successful! Redirecting to login...')
        form.reset()
        setTimeout(function(){ window.location.href = './UserLogIn.html' }, 1500)
        return
      } catch(err) {
        // Fallback to local storage demo if backend not available
        var result = UserStorage.addUser({ email: email, password: password, role: selectedRole })
        if (result.success) {
          showSuccess('Registration successful! Redirecting to login...')
          form.reset()
          setTimeout(function(){ window.location.href = './UserLogIn.html' }, 1500)
        } else {
          showError(result.message || 'Registration failed. Please try again.', emailInput)
        }
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
