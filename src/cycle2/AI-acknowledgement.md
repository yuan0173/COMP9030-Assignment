# AI Acknowledgement - Cycle 2

I acknowledge the use of Claude (Anthropic, 2024) and ChatGPT (OpenAI, 2024) in generating content included in this submission. The prompts and output from AI tools are included in the file below.

## AI Usage Declaration

### Member 1 (yuan0173)

Claude was used to provide basic assistance with the following minor aspects of this Cycle 2 submission:

### 1. Basic Code Structure Suggestions
- **Purpose:** Received simple guidance on JavaScript object structure for mock data
- **AI Contribution:** Provided basic template examples for data organization
- **Human Work:** I independently designed all geographic coordinates, cultural descriptions, and implemented all functionality

### 2. Simple CSS Styling Help
- **Purpose:** Asked for basic CSS background-image syntax
- **AI Contribution:** Provided standard CSS property examples
- **Human Work:** I created all visual design decisions, responsive layouts, and aesthetic choices

### 3. General Documentation Format
- **Purpose:** Asked about standard commenting practices
- **AI Contribution:** Shared common code commenting conventions
- **Human Work:** I wrote all actual comments and documentation content

## Prompts and Output from AI

### Line 1: Basic Data Structure Question
**Human Prompt:**
"How should I structure JavaScript objects for storing artwork data?"

**AI Output:**
"You can use an array of objects with properties like id, title, description, etc. Here's a basic template:
```javascript
var artworks = [
  {
    id: 'art-1',
    title: 'Sample Title',
    description: 'Sample Description'
  }
]
```"

**My Implementation:** I used this basic template concept but independently created all 8 artwork entries with authentic Australian locations, cultural descriptions, and geographic coordinates.

### Line 2: CSS Background Syntax
**Human Prompt:**
"What's the CSS syntax for background images?"

**AI Output:**
"Use background: url('path/image.jpg') center/cover no-repeat; for full coverage."

**My Implementation:** I applied this basic syntax but designed all visual styling, gradient overlays, and responsive behavior independently.

### Line 3: Code Comments Format
**Human Prompt:**
"What are standard JavaScript commenting practices?"

**AI Output:**
"Use /* */ for multi-line comments and // for single lines. Be descriptive about function purposes."

**My Implementation:** I followed standard practices but wrote all actual comment content myself based on my understanding of the code functionality.

### Member 2 (lyu0061)

ChatGPT was used to provide basic assistance with the following minor aspects of this Cycle 2 submission:

#### 1. CSS Structural Framework
- **Purpose:** Received basic CSS structure suggestions for styling components
- **AI Contribution:** Provided a basic structural framework for CSS styling
- **Human Work:** I customized and adjusted all details according to the Cycle 1 visual design style, ensuring consistency with our group's unique theme and requirements

#### 2. Admin Login Ideas
- **Purpose:** Asked for alternative authentication approaches for admin users
- **AI Contribution:** Provided several conceptual approaches for differentiating admin login from regular user login
- **Human Work:** I independently selected and implemented the chosen approach, adapting it to fit our existing system architecture

### Member 2 (Team Member) - ChatGPT Interactions

#### Interaction 1: CSS Framework
**Human Prompt:**
"Need basic CSS structure for web components"

**AI Output:**
"These three CSS files were initially generated with the assistance of ChatGPT, which provided a **basic structural framework** for styling."

**My Implementation:** I customized and adjusted the details according to the Cycle 1 visual design style, ensuring consistency with our group's unique theme and requirements.

#### Interaction 2: Admin Authentication Ideas
**Human Prompt:**
"Now in our project, general users they log in with email and password, we have to figure out a new way for admins to log in differently, give us some ideas on new ways to log in. Notice: no extra APIs and packages"

**AI Output:**
"Got it! Since you don't want to add any extra APIs or packages, we need solutions that can work with your existing setup (likely your Express + Passport.js + MySQL stack). Here are some ways to make admin login different from general users:

1. Admin Login via Special Admin URL
Create a separate login page like /admin-login.
Only this route checks the isAdmin flag in your users table.
Normal users attempting /admin-login get rejected.
Example logic:
if (!user.isAdmin) {
  return res.status(403).send('Access denied');
}

2. Admin Login via Email Pattern
Require admins to use emails with a specific pattern, e.g., admin@yourdomain.com.
During login, check:
if (!user.email.endsWith('@yourdomain.com') || !user.isAdmin) {
  return res.status(403).send('Access denied');
}

3. Admin Login via Password Prefix / Suffix
Admins have a special prefix or suffix in their password (admin123! vs 123!).
On login, check if password meets admin pattern.

4. Admin "Secret Key" Alongside Password
Add a secretKey field in DB for admins.
Admin login form has an extra input: Secret Key.
Backend checks:
if (!user.isAdmin || user.secretKey !== inputSecretKey) {
  return res.status(403).send('Access denied');
}

5. Two-Step Admin Verification
Admins login with email + password plus a fixed code (like a one-time code you can store in DB for each admin).

6. Admin Login with Hidden Field
Admin login page includes a hidden field (isAdmin=true).

💡 Recommendation:
The cleanest approach without new packages is a separate admin login page (/admin-login) + DB isAdmin check. Optionally, combine it with a secret key for extra security."

**My Implementation:** I independently selected and implemented the chosen approach, adapting it to fit our existing system architecture.

## Code Comments Indicating AI Assistance

### Member 1 (yuan0173)

The following code sections received minimal AI assistance:

### File: src/cycle2/js/arts.js (Lines 510-659)
```javascript
#-# START COMMENT BLOCK #-#
AI Tool used: Claude (Anthropic)
Line reference: Line 1 - Basic Data Structure Question
Personal interpretation: AI provided a simple object template format. I used this basic structure concept but independently created all content including geographic data, cultural descriptions, coordinates, and artwork details.
#-# END COMMENT BLOCK #-#
```

### File: src/cycle2/css/components.css (Lines 4-15)
```css
/*
#-# START COMMENT BLOCK #-#
AI Tool used: Claude (Anthropic)
Line reference: Line 2 - CSS Background Syntax
Personal interpretation: AI provided basic background-image CSS syntax. I implemented the property but designed all visual elements, gradient overlays, colors, and responsive behavior myself.
#-# END COMMENT BLOCK #-#
*/
```

### Member 2 (Team Member)

The following code sections received minimal AI assistance:

### CSS Files: src/cycle2/css/*.css
```css
/*
#-# START COMMENT BLOCK #-#
AI Tool used: ChatGPT (OpenAI)
Line reference: Interaction 1 - CSS Framework
Personal interpretation: AI provided basic structural framework for CSS styling. I customized all visual details, color schemes, responsive layouts, and design elements according to our Cycle 1 visual design requirements.
#-# END COMMENT BLOCK #-#
*/
```

### HTML File: src/cycle2/Pages/AdminLogIn.html
```html
<!--
#-# START COMMENT BLOCK #-#
AI Tool used: ChatGPT (OpenAI)
Line reference: Interaction 2 - Admin Authentication Ideas
Personal interpretation: AI provided conceptual approaches for admin authentication. I independently designed and implemented the specific login interface and authentication logic that fits our project architecture.
#-# END COMMENT BLOCK #-#
-->
```

## References

Anthropic. (2025). Claude (January 2025, Sonnet 4) [Large language model]. https://claude.ai/

OpenAI. (2024). ChatGPT (2024) [Large language model]. https://chat.openai.com/chat