# Usability Evaluation Report
## Introduction
This report reflects on the basic functionalities of the art atlas web application including art submission, art details viewing and so on. The report focuses on completing the basic tasks from the view of normal users and users' feelings and comments on the functionality designs of this application. Also, this includes the main causes of those issues and related recommendations. 

## Testing tasks
1. Signing up for a new account and log in.
2. Submitting a piece of art.
3. Find the new submission from user's profile page.
4. Filters and art details page.
5. Content clarity and navigation
6. Map interaction.
7. readability of art details page.
8. Contact page testing.
9. Users can add art works to their favourites.
10. Users can only edit the art works they submitted themselves.
11. Consistency on different devices.

## Testing Materials
test plan document and the questionnaire.

## Scenarios
### Scenario 1
#### Goal
Register for a new account and log in with it.

#### Procedures
1. Click the "sign in" button, then click sign up. Or, click "register" button instead.
2. Complete email, password, confirming password and choosing a role to register for a new account.
3. See if user is redirected back to log in page.
4. Sign in with the new account.

### Scenario 2
#### Goal
Submit a piece of art.

#### Procedures
1. Click "Submit my art" button to see the submission page.
2. Fill in the details such as title, condition/quality, description of address, choose a image from local and select period and art type.
3. Click "submit your art" button.
4. See if there is a submission successful prompt.

### Scenario 3
#### Goal
View the new submission in user's page.

#### Procedures
1. Click "submit your art" button.
2. Go back to user's profile page to see if the new submission is added into "my submission" area.
3. Click into the latest submission.
4. See the details of the last submission. 

### Scenario 4
#### Goal
Filter the arts with given filters and view the arts' details as an unlogged in user.

#### Procedures
1. Visit the home page.
2. Go back to arts page by clicking "art" link at the top navigation.
3. use filters to select arts.
4. see if there is any changes on the results.
5. Click any one of the arts to view its details.
6. Check if the necessary details are listed.
7. Go back to the last page and redo step 5 - 6.  

### Scenario 5
#### Goal
Assess intuitiveness of the navigation bar. Evaluate information layout and content clarity on key pages.

#### Procedures
1. Visit "homepage" page.
2. Visit "about" page.
3. Visit "Guidelines" page.
4. Visit "Arts" page.
5. Visit "Contact" page.
6. Return to "homepage"

### Scenario 6
#### Goal
Validate zoom in/out and panning feature. Check whether clicking map markers provides accurate responses.

#### Procedures
1. Zoom in to a specific region on the map (e.g., Adelaide city area).
2. Pan the map to a different location (e.g., Melbourne).
3. Click on one of the art item and view its details.

### Scenario 7
#### Goal
Test the functionality in homepage featured arts item.

#### Procedures
1. Navigate to the homepage.
2. Browse through featured artworks and select one of interest.
3. Click on the artwork to open its detail page.
4. Review the detail content and return to the Arts list.

### Scenario 8
#### Goal
Test the functionality of the Contact email sending feature.

#### Procedures
1. Go to the "Contact" page.
2. Fill in all required fields.
3. Click "Send" to submit the message, check if it is successful.
4. Fill one fields.
5. Click "Send" to submit the message, check if it isn't successful.

### Scenario 9
#### Goal
Test the functionality of user favorite (art collection) feature.

#### Procedures
1. Log in to the website.
2. Go to the "Arts" page.
3. Select one artwork and click the “Favorite” or “Save” icon.
4. Navigate to “My Favorites” section and verify the artwork appears.

### Scenario 10
#### Goal
Test user account security and editing permissions.

#### Procedures
1. Log in as public user.
2. Edit one arartworkt submitted by others. It should be unsuccessful.
3. Attempt to edit other user's profile. It should be unsuccessful.
4. Log out and confirm that editing is unavailable for unauthenticated users.
5. Redo the same step by admin and artist.

### Scenario 11
#### Goal
Test mobile and tablet compatibility of the website interface.

#### Procedures
1. Open the website on a mobile phone.
2. Browse main pages (Home, Arts, Contact) and interact with the map.
3. Repeat steps on a tablet.
4. Compare layout, performance, and ease of use.

## Test results 
### task completion data
- Desktop (Chrome 142, 1920×1080): **10/11** tasks completed on first attempt; **1** task required a retry (Scenario 1 sign-up).
- Mobile (iPhone 12, Chrome): **8/11** tasks completed; delays on Scenarios **4, 6, 11** due to small tap targets and layout shifts.

Per scenario:
1. Sign up & log in — Completed after one retry (validation copy unclear on first try).
2. Submit a piece of art — Completed; image upload and form save worked.
3. View the new submission — Completed; path not immediately discoverable in profile.
4. Filters & details (logged out) — Completed; filter feedback subtle; details page OK.
5. Navigation & content clarity — Completed; labels understandable.
6. Map interaction — Partially completed on mobile; marker taps inconsistent.
7. Featured arts — Completed; link opens details as expected.
8. Contact page — Completed; negative path correctly blocked, error message is small/low contrast.
9. Favourites — Completed; item added but success feedback is subtle.
10. Permissions — Completed; editing others correctly blocked; admin/artist behave as expected.
11. Cross-device consistency — Partially completed; header overlap and tight form spacing on mobile.

### errors
- **E1 (High)** — Sign-up first attempt failed; password rule not obvious and error copy non-specific.
- **E2 (High)** — Mobile header overlaps content when opening the menu; icons misaligned.
- **E3 (High)** — Map marker tap targets are small on mobile; multiple taps needed.
- **E4 (Medium)** — Contact form error message lacks field-level guidance; small font/contrast.
- **E5 (Medium)** — “My submissions” entry point is buried in profile; low discoverability.
- **E6 (Minor)** — Filters apply without a clear “active” state or reset; easy to lose track.

### participants comments
- “I wasn’t sure why my first sign-up failed—what exactly is the password rule?”
- “On my phone the top bar covers part of the page when I open the menu.”
- “It’s hard to tap the map pins accurately.”
- “After I add to favourites, I don’t see a clear success message.”
- “The contact form tells me there’s an error but doesn’t show which field.”
- “Once I found ‘My submissions’ it made sense, but it took a moment.”

### questionnaire responses
- Task ease (1–5 Likert):  
  1) Sign-up & log in: **3/5**  
  2) Submit art: **5/5**  
  3) View my submission: **4/5**  
  4) Filters & details: **4/5** (desktop), **3/5** (mobile)  
  5) Navigation & content: **4/5**  
  6) Map interaction: **3/5**  
  7) Featured arts: **4/5**  
  8) Contact form: **3/5**  
  9) Favourites: **4/5**  
  10) Permissions: **5/5**  
  11) Cross-device consistency: **3/5**

- Overall satisfaction: **4.2/5**; Would use again / recommend: **4/5 (Likely)**.



## Findings 
The overall satisfaction of this application is 4.2/5.0, which is around 80%. In general, the problems are about the compatibility on mobile phones and accounts creating. Some users may not be able to create an account successfully. Also, when the application is run on the mobile phones, some of the elements may not look just like as what they are on the computers. In other words, the layout of the application may look strange when it comes to using this application with mobile phones.
For other testings aspects, such as login, art submission, users find them easy and their task satisfaction rate are 4.8/5.0 (96%) and 4.6/5.0 (92%) respectively. In general, testers find that they can smoothly complete these scenarios. Some of the testers leave comments that as a new user, it is easy to learn how to use this application.

## Key issues and their causes  
- **K1 — Sign-up first-attempt failures (High)**  
  **Cause:** Password complexity not explicit; no inline rule checklist; generic error copy; missing show/hide password.  
- **K2 — Mobile header overlap & layout shifts (High)**  
  **Cause:** Fixed header z-index and safe-area handling; menu panel pushes content; inconsistent breakpoints; non–mobile-first CSS.  
- **K3 — Map tap targets too small on mobile (High)**  
  **Cause:** Default marker hit area equals icon; no extra hit-slop; clustering/selection tolerance low; event swallowing on container.  
- **K4 — Contact form errors lack field-level guidance (Medium)**  
  **Cause:** Validate only on submit; banner is generic; weak contrast and small font; no `aria-describedby` linking.  
- **K5 — “My submissions” hard to find (Medium)**  
  **Cause:** IA places entry under profile with low prominence; label not task-oriented; no empty-state CTA.  
- **K6 — Filters active state & reset unclear (Medium)**  
  **Cause:** Auto-apply without visible “active” chips; absent “Clear all”; filter state not synced to URL/query.  
- **K7 — Favourites feedback too subtle (Minor)**  
  **Cause:** Icon state change only; no toast/inline confirmation; list does not visibly update.  
- **K8 — Cross-device spacing/consistency (High)**  
  **Cause:** Component spacing, font metrics and breakpoints diverge; no mobile regression checks in CI.

## Recommendations
**Priority legend:** P0 = immediate (1–2 days), P1 = this week, P2 = next sprint. Success criteria align with the report’s task list.

**P0 — Quick wins**
- **Clarify sign-up rules & validation (K1)**  
  Add inline password checklist (min length, cases, number, special), show/hide toggle, specific error copy.  
  *Success:* sign-up first-attempt success ≥ **90%**; task ease ≥ **4/5**; retry rate < **10%**.
- **Fix mobile header/nav overlap (K2)**  
  Convert to sticky header with proper `z-index` and `padding-top`; respect iOS safe-area; verify on Safari/Chrome.  
  *Success:* mobile completion **≥ 9/11** tasks; 0/5 participants report overlap.

**P1 — Experience & IA**
- **Increase map tapability (K3)**  
  Min  **44×44 px** targets; add invisible hit-slop; enable clustering; raise tap tolerance; offer “list of nearby items”.  
  *Success:* map task ease ≥ **4/5** on mobile; mis-taps ≤ **1** per user.
- **Upgrade form error UX (K4)**  
  Field-level messages, error summary at top, link to fields, contrast ≥ **WCAG AA**, `aria-describedby`.  
  *Success:* contact form ease ≥ **4/5**; error resolution within **1** attempt.
- **Surface “My submissions” (K5)**  
  Add to top nav/user menu; dashboard card + empty-state CTA (“Submit your first artwork”).  
  *Success:* time-to-find ≤ **10s**; 5/5 participants locate without hints.
- **Make filters stateful & resettable (K6)**  
  Show active filter chips/badges; add “Clear all”; sync state to URL for share/back support.  
  *Success:* filter task ease ≥ **4/5**; all participants discover reset.

**P2 — Robustness & governance**
- **Stabilize layout & performance (K2/K8)**  
  Reserve image aspect ratios to reduce CLS; lazy-load below the fold; prefetch likely nav paths.  
  *Success:* CLS < **0.10**; no “layout shift” complaints in sessions.
- **Accessibility hardening (K4/K8)**  
  Visible focus, keyboard nav, landmark roles/labels, contrast checks, `prefers-reduced-motion`.  
  *Success:* automated a11y score ≥ **90**; zero keyboard traps.
- **Analytics & regression checks (cross-cutting)**  
  Instrument sign-up failures, map mis-taps, filter usage; add mobile snapshots to CI.  
  *Success:* weekly dashboard shows downward trend in error rates; 2 sprints with no mobile regressions.


