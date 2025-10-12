;(function(){
  // START COMMENT BLOCK
  // AI tool: GEMINI
  // line 314 in AI-Acknowledgement.md file
  // personal interpretation: The code below helps to check the validity of the input such as email input is requred by isEmail function, and the function isRequired is used to validate if the length is > 0.  The inRange function helps to find out the input which is empty string, null. The show field error is used to show errors and all the functions in validate.js are exported so that they can be used in submission.js.
  'use strict'

  // --- Core Validation Functions ---

  /**
   * Checks if a string value is a valid email format.
   * @param {string} v - The value to validate.
   * @returns {boolean}
   */
  function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim()) }
  
  /**
   * Checks if a string value is not empty after trimming whitespace.
   * @param {string} v - The value to validate.
   * @returns {boolean}
   */
  function isRequired(v){ return String(v||'').trim().length > 0 }
  
  /**
   * Checks if a string value's length is less than or equal to the maximum length 'n'.
   * @param {string} v - The value to validate.
   * @param {number} n - The maximum allowed length.
   * @returns {boolean}
   */
  function maxLen(v, n){ return String(v||'').trim().length <= n }
  
  /**
   * Checks if a numeric value is within a specified range (inclusive).
   * Returns true if the value is null, undefined, or empty string.
   * @param {*} n - The value (expected to be numeric) to check.
   * @param {number} min - The minimum allowed value.
   * @param {number} max - The maximum allowed value.
   * @returns {boolean}
   */
  function inRange(n, min, max){ 
    if(n===''||n===null||typeof n==='undefined') return true; 
    var x=Number(n); 
    return !isNaN(x) && x>=min && x<=max 
  }

  // --- Original Global Error Functions (Retained) ---

  /**
   * Ensures the global error box (.js-error-box) exists at the top of the form, creating it if necessary.
   * @param {HTMLElement} form - The form element.
   * @returns {HTMLElement} The error box element.
   */
  function ensureErrorBox(form){
    var box = form.querySelector('.js-error-box')
    if (!box){
      box = document.createElement('div')
      box.className = 'js-error-box notice notice--error'
      box.style.display = 'none'
      box.setAttribute('role','alert')
      var text = document.createElement('div')
      text.className = 'js-error-text'
      box.appendChild(text)
      form.insertBefore(box, form.firstChild)
    }
    return box
  }

  /**
   * Displays a global error message inside the .js-error-box.
   * @param {HTMLElement} form - The form element.
   * @param {string} message - The error message to display.
   */
  function showError(form, message){
    var box = ensureErrorBox(form)
    var text = box.querySelector('.js-error-text')
    if (text) text.textContent = message
    box.style.display = 'block'
  }
  
  /**
   * Clears (hides) the global error box.
   * @param {HTMLElement} form - The form element.
   */
  function clearError(form){
    var box = form.querySelector('.js-error-box')
    if (box) box.style.display = 'none'
  }

  // --- NEW Field-Level Error Functions (Added per user request) ---

  /**
   * Clears any existing red error text next to a specific input field.
   * @param {HTMLElement} inputElement - The input field element (input, select, textarea).
   */
  function clearFieldErrors(inputElement){
    // Look for the error span sibling within the parent node
    var errorSpan = inputElement.parentNode.querySelector('.js-field-error')
    if(errorSpan) {
      errorSpan.parentNode.removeChild(errorSpan)
    }
    // Optional: Remove error class from the input itself if one was added
    // inputElement.classList.remove('is-error') 
  }

  /**
   * Displays a red error message next to a specific input field.
   * @param {HTMLElement} inputElement - The input field element (input, select, textarea).
   * @param {string} message - The error message (e.g., 'Please enter a title here').
   */
  function showFieldError(inputElement, message){
    // 1. Clear any existing error for this field first
    clearFieldErrors(inputElement)

    // 2. Create the error element
    var errorSpan = document.createElement('span')
    errorSpan.className = 'js-field-error' // Class for easy identification and clearing
    errorSpan.textContent = message
    errorSpan.style.color = 'red'          // Set to red text
    errorSpan.style.marginLeft = '5px'     // Add minor spacing

    // 3. Insert the error message right after the input field
    // This assumes the input is wrapped within a parent element (like a div or label)
    inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling)
    
    // Optional: Add error class to the input for styling its border/background
    // inputElement.classList.add('is-error')
  }

  // --- Export Public Interface ---
  
  window.Validate = { 
    isEmail, 
    isRequired, 
    maxLen, 
    inRange, 
    // Original global functions
    showError, 
    clearError,
    // New field-level functions
    showFieldError,
    clearFieldErrors 
  }
  // END COMMENT BLOCK
})()