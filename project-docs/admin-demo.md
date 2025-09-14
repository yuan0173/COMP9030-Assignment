# Admin Demo Guide (Cycle 2)

This guide helps you reproduce the admin features for Cycle 2 HD acceptance using mock data (localStorage) and the PHP built‑in server.

## 0) Start the site
- Run: `php -S localhost:8000 -t src`
- Open: `http://localhost:8000/`

## 1) Seed data (auto)
- Mock data for submissions/users/types/periods auto‑seeds on first visit via `admin_data.js`.
- To reset: open DevTools Console and run:
  - `localStorage.removeItem('admin_submissions_v1')`
  - `localStorage.removeItem('admin_users_v1')`
  - `localStorage.removeItem('admin_types_v1')`
  - `localStorage.removeItem('admin_periods_v1')`
  - Refresh the page.

## 2) Admin login (separate entry)
- Go to `src/cycle2/Pages/AdminLogIn.html` (or navigate from User Login with the link).
- Use demo admin: `admin@gmail.com` / `admin`.
- On success you land on `AdminDashboard.html`.
- Role guard: any `Admin*.html` page redirects non‑admin users to login.

## 3) Dashboard (stats + quick links)
- See “Pending Submissions / Total Users / Open Reports (demo)”.
- Click “Simulate Change” to toggle counts (writes to localStorage).
- Use Quick Links to open Users / Submissions / Moderation.

## 4) Submissions list (filter + paginate)
- Page: `AdminSubmissionList.html`.
- Use Keyword and Status (Pending/Approved/Rejected) to filter.
- Use pagination at the bottom (Prev/Next or page numbers).
- Click “Open” to view a specific submission.

## 5) Submission detail (review + map preview)
- Page: `AdminSubmissionDetail.html?id=...`.
- Display Options controls how location appears:
  - exact = precise marker
  - locality = 1 km circle
  - region = rounded coordinates marker (approx.)
  - hidden = not shown (text notice only)
- Actions (front‑end mock):
  - Approve → status=Approved
  - Reject → requires a reason, status=Rejected
  - Save Changes → updates fields/displayLevel
  - Delete → removes and returns to list

## 6) User management (edit role/status)
- Page: `AdminUserManagement.html`.
- Filter by keyword/role/status; sort by newest/oldest/name.
- Edit Role → enter `public | artist | admin`.
- Edit Status → enter `active | suspended`.
- Changes persist in localStorage.

## 7) Types/Periods and submission form linkage
- On Dashboard, add or rename Types/Periods.
- Open `Submission.html`: the “Type/Period” dropdowns load from the latest Types/Periods (fallback to defaults if none).

## 8) Accessibility & notices
- Filters have `aria-label`; pagination has `aria-label` and active state.
- Errors and empty states use unified `.notice` styles.

Notes
- All admin features are front‑end prototypes in Cycle 2 (no real backend). In Cycle 3, replace localStorage with PHP+MySQL APIs and keep the same UX flows.
