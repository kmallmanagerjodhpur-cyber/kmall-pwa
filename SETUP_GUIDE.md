# K-Mall Manager PWA — Complete Setup Guide
**Khalsa Builders and Associates · Jodhpur, Rajasthan**

---

## What You're Building
A multi-user Progressive Web App (PWA) that any staff member can open on their phone like a native app. Data is stored in Google Sheets — no server costs, no subscriptions.

**Tech Stack:**
- Frontend: HTML/CSS/JS — hosted FREE on GitHub Pages
- Backend: Google Sheets + Apps Script — FREE
- URL: `https://YOUR-GITHUB-USERNAME.github.io/kmall-pwa`

---

## Part 1 — Google Sheets Backend (15 minutes)

### Step 1: Create a dedicated Google Account
Go to accounts.google.com and create: `kmall.manager@gmail.com` (or similar)

### Step 2: Create the Google Sheet
1. Go to **sheets.google.com** → New spreadsheet
2. Name it: `KMall Manager Data`
3. Note the URL — copy the Sheet ID (the long string between `/d/` and `/edit`)

### Step 3: Set up Apps Script
1. In the Sheet, go to **Extensions → Apps Script**
2. Delete all existing code
3. Copy the entire contents of `backend/Code.gs` and paste it
4. Click **Save** (Ctrl+S)
5. Click **Run** → Select function: `setupSheets` → Click **Run**
   - Approve permissions when asked — this creates all 12 data sheets
6. You'll see: "✅ All sheets created with headers"

### Step 4: Deploy as Web App
1. In Apps Script, click **Deploy → New deployment**
2. Click the gear icon → **Web app**
3. Settings:
   - Description: `K-Mall API v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** → Copy the Web App URL
   - It looks like: `https://script.google.com/macros/s/ABC.../exec`

### Step 5: Connect the App to Your Sheet
Open `js/config.js` and replace:
```js
SHEET_API_URL: 'YOUR_APPS_SCRIPT_URL_HERE',
```
With your actual URL:
```js
SHEET_API_URL: 'https://script.google.com/macros/s/YOUR_REAL_URL/exec',
```

---

## Part 2 — GitHub (10 minutes)

### Step 1: Create GitHub Account
Go to github.com → Sign up (free)

### Step 2: Create Repository
1. Click **New repository**
2. Name: `kmall-pwa`
3. Visibility: **Public** (required for free GitHub Pages)
4. Click **Create repository**

### Step 3: Upload the App
**Option A — GitHub Desktop (easiest):**
1. Download GitHub Desktop from desktop.github.com
2. Clone your new repo
3. Copy all files from `kmall-pwa/` into the cloned folder
4. Commit and push

**Option B — Upload via browser:**
1. In your repo, click **uploading an existing file**
2. Drag the entire `kmall-pwa` folder contents
3. Commit changes

### Step 4: Enable GitHub Pages
1. In your repo → **Settings → Pages**
2. Source: **GitHub Actions**
3. The workflow in `.github/workflows/deploy.yml` auto-deploys on every push

### Step 5: Access Your App
After ~2 minutes: `https://YOUR-USERNAME.github.io/kmall-pwa`

**Share this URL with all staff.** They can:
- Open it in Chrome/Safari on their phone
- Tap "Add to Home Screen" to install as an app icon

---

## Part 3 — Staff Accounts (5 minutes)

### Default Admin Account (pre-created)
| Employee ID | Password |
|-------------|----------|
| KM-ADMIN | admin@kmall |

### Create Accounts for Each Staff Member
1. Log in as KM-ADMIN
2. Go to **More → Manage Staff Accounts → + Add**
3. Fill in: Name, Employee ID, Role, Password
4. Tap **Create Account**

### Suggested Employee IDs
| Role | ID | Default Password |
|------|----|-----------------|
| Super Admin (you) | KM-ADMIN | admin@kmall |
| Project Head | KM-001 | kmall@2026 |
| Mall Manager | KM-002 | kmall@2026 |
| MEP Manager | KM-003 | kmall@2026 |
| ELV Manager | KM-004 | kmall@2026 |
| Finance Manager | KM-005 | kmall@2026 |
| Legal Head | KM-006 | kmall@2026 |
| Security & HK Head | KM-007 | kmall@2026 |
| Parking Manager | KM-008 | kmall@2026 |
| Store / Stock Keeper | KM-009 | kmall@2026 |

> **Important:** Each staff member should change their password after first login.

---

## Part 4 — Installing on Phones

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the three-dot menu → **Add to Home screen**
3. Tap **Add** — app icon appears on home screen

### iPhone (Safari)
1. Open the app URL in Safari
2. Tap the **Share** icon (box with arrow)
3. Tap **Add to Home Screen → Add**

---

## App Modules

| Module | Who Uses It | Key Feature |
|--------|------------|-------------|
| Dashboard | All (role-specific view) | Your super admin view shows all staff status |
| Attendance | All staff | GPS check-in, you see everyone's status live |
| Tasks | All staff + you assign | You assign daily/weekly/monthly tasks to anyone |
| Daily Checklist | All staff | Role-specific SOP tasks from K-Mall SOP doc |
| EOD Reports | All staff | End-of-day submission → you review |
| Petty Cash | All + Finance approves | Expense entry → approval workflow |
| Incidents | All report, you manage | Severity-tagged, escalation tracking |
| Tenants | Management roles | Stores, violations, complaints, utility meters |

---

## Updating the App
1. Edit files in your GitHub repo
2. Commit → GitHub Actions auto-deploys in ~1 minute
3. Staff refresh the app on their phone — they get the update instantly

---

## Costs
- GitHub Pages: **Free**
- Google Sheets + Apps Script: **Free**
- Custom domain (optional): ~₹800/year from GoDaddy/Namecheap

---

## Support
Shreyansh · K-Mall, Jodhpur · infokmalljodhpur@gmail.com · +91 9799991000
