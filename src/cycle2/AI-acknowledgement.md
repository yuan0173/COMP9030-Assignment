# AI Acknowledgement

I acknowledge the use of ChatGPT in generating content included in this submission (OpenAI, 2025).  
The prompts and output from ChatGPT are included in the file below.

## Details of AI Usage

- **Files involved**:  
  - `base.css`  
  - `components.css`  
  - `layout.css`  

These three CSS files were initially generated with the assistance of ChatGPT, which provided a **basic structural framework** for styling. I customized and adjusted the details according to the Cycle 1 visual design style, ensuring consistency with our group’s unique theme and requirements.  


AI is used for generating an idea for AdminLogIn.html file, here are the propmt and output.

Prompt: Now in our project, general users they log in with email and password, we have to figure out a new way for admins to log in differently, give us some ideas on new ways to log in. Notice: no extra APIs and packages

AI output: Got it! Since you don’t want to add any extra APIs or packages, we need solutions that can work with your existing setup (likely your Express + Passport.js + MySQL stack). Here are some ways to make admin login different from general users:

1. Admin Login via Special Admin URL

Create a separate login page like /admin-login.

Only this route checks the isAdmin flag in your users table.

Normal users attempting /admin-login get rejected.

Example logic:

if (!user.isAdmin) {
  return res.status(403).send('Access denied');
}


Pros: Easy to implement, visually distinct for admins.

Cons: Must keep URL secret-ish.

2. Admin Login via Email Pattern

Require admins to use emails with a specific pattern, e.g., admin@yourdomain.com.

During login, check:

if (!user.email.endsWith('@yourdomain.com') || !user.isAdmin) {
  return res.status(403).send('Access denied');
}


Pros: No extra UI changes needed.

Cons: Less secure if email patterns are guessable.

3. Admin Login via Password Prefix / Suffix

Admins have a special prefix or suffix in their password (admin123! vs 123!).

On login, check if password meets admin pattern.

Pros: Easy for backend logic.

Cons: Less secure if pattern leaks; password management might be tricky.

4. Admin “Secret Key” Alongside Password

Add a secretKey field in DB for admins.

Admin login form has an extra input: Secret Key.

Backend checks:

if (!user.isAdmin || user.secretKey !== inputSecretKey) {
  return res.status(403).send('Access denied');
}


Pros: Very clear separation, minimal changes.

Cons: Admins need to remember secret key.

5. Two-Step Admin Verification

Admins login with email + password plus a fixed code (like a one-time code you can store in DB for each admin).

Could reuse an existing field in your DB (e.g., otp or verificationCode) without external APIs.

Pros: Stronger separation, more secure.

Cons: Slightly more complex UI.

6. Admin Login with Hidden Field

Admin login page includes a hidden field (isAdmin=true).

Only process login if isAdmin flag is set and user is an admin.

Pros: Very minimal code change.

Cons: Security relies on keeping page hidden (not strong on its own).

💡 Recommendation:
The cleanest approach without new packages is a separate admin login page (/admin-login) + DB isAdmin check. Optionally, combine it with a secret key for extra security. This avoids breaking your existing user login flow.

If you want, I can draft a ready-to-use Express + Passport.js admin login flow that’s separate from the general user login, fully compatible with your current setup.

Do you want me to do that?

---

## References

OpenAI. (2025). *ChatGPT (September 2025 version)* [Large language model]. https://chat.openai.com/chat  

---