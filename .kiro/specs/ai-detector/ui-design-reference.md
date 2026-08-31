# UI Design Reference — AI Detector Capstone Project

This document describes the UI mockups and maps them to implementation components.

---

## Mockup Files

- `Landing page UI.jpg` — Homepage with upload interface
- `operation UI.jpg` — Detection result page
- `Analysis section.jpg` — Admin operations dashboard
- `Save analysis UI.jpg` — History/previous analysis page
- `user management UI.jpg` — Admin user management
- `Home UI.jpg` — All saved analyses (database review)

---

## 1. Landing Page (Homepage)

**File:** `Landing page UI.jpg`

### Visual Structure

**Header/Navbar:**
- Logo: "AI Detector" with teal square icon
- Tagline: "Image and video forensics"
- Right nav: "Analyze" | "History" | "Login / Sign up"

**Hero Section:**
- Tag: "CNN SPATIAL CHECKS + LSTM TEMPORAL REVIEW" (teal, uppercase)
- Headline: "AI Detector" (large, navy blue)
- Subheadline: "Upload images or submit video links to classify media as Authentic or AI-Generated, with confidence scoring, explainable summaries, visual heatmaps, saved analysis history, and downloadable verification reports."

**Upload Card:**
- Tabs: "Image" | "Video"
- "Free detections" label with "0 remaining" counter (coral/red)
- "Upload image file" section with dashed border dropzone
- Icon: teal upload cloud icon
- Text: "Choose JPG, JPEG, or PNG"
- Subtext: "Files are validated before analysis"
- Button: "Run Detection" (navy blue, full width)

**Info Cards (bottom row):**
- **JPG:** "JPEG and PNG images"
- **MP4:** "AVI and MOV video links"
- **TXT:** "Downloadable reports"

### Components to Build

```
LandingPage/
├── HeroSection.jsx         # Hero headline + description
├── UploadTabs.jsx          # Image/Video tab switcher
├── ImageUploadCard.jsx     # Image upload dropzone (as shown)
├── VideoUploadCard.jsx     # Video upload input (URL or file)
└── InfoCardsRow.jsx        # JPG/MP4/TXT supported formats
```

### Design Tokens Extracted

- **Primary color:** Navy blue (`#1e3a5f` or similar)
- **Accent color:** Teal/cyan (`#00bcd4` or similar)
- **Alert/Warning color:** Coral/red (`#ff6b6b` or similar)
- **Background:** Light gray/white (`#f5f7fa`)
- **Border style:** Dashed for dropzone (`border: 2px dashed #ccc`)
- **Typography:**
  - Hero: Bold, 72px+, navy
  - Body: Regular, 16px, gray
  - Labels: Medium, 14px, uppercase for tags

---

## 2. Detection Result Page (Operation UI)

**File:** `operation UI.jpg`

### Visual Structure

**Header:**
- Same navbar (Analyze | History | Logout)
- Section tag: "PREDICTION RESULT" (teal, uppercase)

**Main Content:**

**Left Panel — Result Badge:**
- Large percentage: "71%" (navy, bold)
- Label: "AI-Generated" (red badge)
- Description: "AI-Generated classification with 71% confidence. The CNN pass found localized texture inconsistencies and edge blending artifacts, while the LSTM review indicated temporal flicker and frame-to-frame identity drift."
- Button: "Download report" (navy outline)

**Center Panel — Heatmap Visualization:**
- Title: "Suspicious-region heatmap"
- Subtitle: "Red blobs: No file I and AI-detection"
- Dark card with heatmap overlay (red/yellow/green gradient)

**Right Panel — Model Signals:**
- **Spatial CNN score:** 80%
- **Temporal LSTM score:** 63%
- **File validation:** Passed (green)
- **Stored record:** Saved (green)

### Components to Build

```
DetectionResultPage/
├── ResultCard.jsx          # Left: 71% + badge + description
├── HeatmapViewer.jsx       # Center: canvas/image with heatmap overlay
├── ModelSignalsPanel.jsx   # Right: score cards
└── DownloadReportButton.jsx
```

### Design Notes

- **Result badge colors:**
  - AI-Generated: Red background (`#ff4d4d`)
  - Authentic/Real: Green background (`#4caf50`)
- **Heatmap:** Dark blue-black background (`#1a2332`) with overlay
- **Score display:** Percentage + label, right-aligned

---

## 3. Admin Dashboard (Operations Dashboard)

**File:** `Analysis section.jpg`

### Visual Structure

**Dark theme:**
- Background: Very dark navy/black (`#0d1b2a`)
- White text

**Header:**
- Tag: "ADMINISTRATIVE MANAGEMENT" (teal, uppercase)
- Title: "Operations dashboard" (large, white)

**Stat Cards (4 columns):**
1. **Total analyses:** 15
2. **AI-generated rate:** 27%
3. **Average confidence:** 60%
4. **Total users:** 5

**Management Functions (buttons):**
- "Export records" (teal outline)
- "Export users" (teal outline)
- "Clear database" (red solid)

### Components to Build

```
AdminDashboardPage/
├── StatCard.jsx            # Reusable card: label + big number
├── ManagementActions.jsx   # Button row (export/clear)
└── AdminLayout.jsx         # Dark theme wrapper
```

### Design Tokens (Dark Theme)

- **Background:** `#0d1b2a`
- **Card background:** `#162739` (slightly lighter)
- **Text:** White (`#ffffff`)
- **Primary button:** Teal (`#00bcd4`)
- **Danger button:** Red (`#ff4d4d`)

---

## 4. History Page (Previous Analysis)

**File:** `Save analysis UI.jpg`

### Visual Structure

**Header:**
- Same navbar
- Section tag: "DATABASE REVIEW" (teal, uppercase)
- Title: "Previous analysis" (navy)

**Table:**
| Column | Example |
|--------|---------|
| MEDIA | `She Speaks, We Rise 1.mp4` |
| TYPE | `Video / MP4` |
| PREDICTION | `AI-Generated` |
| CONFIDENCE | `71%` |
| REVIEWER | `AI Detector` |
| DATE | `6/12/2026, 2:38:22 PM` |

**Footer:**
- Note: "AI Detecteor verification interface"
- Subtext: "Prototype analysis uses deterministic simulated model scoring."

### Components to Build

```
HistoryPage/
├── HistoryTable.jsx        # Table with columns as shown
├── HistoryRow.jsx          # Single row component
└── HistoryFilters.jsx      # (Optional) filter by type/prediction
```

### Design Notes

- Table styling: Clean, white background, gray borders
- Hover state on rows
- Responsive: mobile switches to cards

---

## 5. All Saved Analyses (Database Review)

**File:** `Home UI.jpg`

### Visual Structure

**Dark theme:**
- Background: Very dark navy/black
- Title: "All saved analyses" (white, large)
- Section tag: "DATABASE REVIEW" (teal)

**Table (extended columns):**
| Column | Width Hint |
|--------|------------|
| MEDIA | Wide (shows full filename) |
| TYPE | Small (Image/PNG, Video/MP4) |
| PREDICTION | Medium (AI-Generated / Authentic) |
| CONFIDENCE | Small (60%, 57%, etc.) |
| REVIEWER | Medium (AI Detector / Guest) |
| USER NAME | Medium (aaron, Guest, juan miguel) |
| USER EMAIL | Wide (email addresses) |
| DATE | Medium (6/17/2026, 5:22:40 AM) |

**Rows:** Multiple entries with alternating subtle background tones

### Components to Build

```
AllAnalysesPage/          # Admin-only, extended history
├── ExtendedHistoryTable.jsx
└── UserInfoColumn.jsx    # Shows user name + email
```

### Design Notes

- Admin-only view
- Shows **all users'** analyses (not just current user)
- Dark theme to distinguish from user-facing history
- Includes user identification columns

---

## 6. User Management Page

**File:** `user management UI.jpg`

### Visual Structure

**Dark theme:**
- Background: Very dark navy/black
- Tag: "ACCOUNT CONTROL" (teal, uppercase)
- Title: "User management" (white, large)

**Table:**
| Column | Example |
|--------|---------|
| NAME | `aaronbenitez` |
| EMAIL | `aaronbenitez@gmail.com` |
| ROLE | `user` |
| JOINED | `6/11/2026, 11:43:40 PM` |
| ACTIONS | [Edit] [Remove] buttons |

**Action Buttons:**
- "Edit" — Teal outline
- "Remove" — Red solid

### Components to Build

```
UserManagementPage/
├── UserTable.jsx
├── UserRow.jsx
├── EditUserModal.jsx       # Edit role/disable
└── DeleteUserModal.jsx     # Confirmation
```

### Design Notes

- Admin-only
- Dark theme consistent with admin dashboard
- Remove button triggers confirmation modal
- Edit button opens modal to change role or disable account

---

## Color Palette (Finalized)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1e3a5f` | Navbar, headings, primary buttons |
| `accent` | `#00bcd4` | Tags, links, secondary buttons |
| `success` | `#4caf50` | "Authentic" badge, success states |
| `danger` | `#ff4d4d` | "AI-Generated" badge, delete buttons |
| `warning` | `#ff6b6b` | Alert/limit warnings |
| `background` | `#f5f7fa` | Page background (light theme) |
| `dark-bg` | `#0d1b2a` | Admin pages background |
| `dark-card` | `#162739` | Admin cards/panels |
| `text-primary` | `#2c3e50` | Main text (light theme) |
| `text-light` | `#ffffff` | Main text (dark theme) |
| `border` | `#e0e0e0` | Borders, dividers |

---

## Typography

**Font Family:** Sans-serif (likely Inter, Roboto, or system font stack)

**Sizes:**
- **Hero:** 64–80px, bold
- **Page Title:** 36–48px, bold
- **Section Tag:** 12px, uppercase, semi-bold, letter-spacing: 1px
- **Body:** 16px, regular
- **Small:** 14px, regular
- **Button:** 16px, medium

---

## Component Mapping to Routes

| Route | Mockup | Primary Components |
|-------|--------|-------------------|
| `/` or `/home` | Landing page UI.jpg | LandingPage, HeroSection, UploadTabs, ImageUploadCard |
| `/results/:detectionId` | operation UI.jpg | DetectionResultPage, ResultCard, HeatmapViewer, ModelSignalsPanel |
| `/history` | Save analysis UI.jpg | HistoryPage, HistoryTable |
| `/admin` | Analysis section.jpg | AdminDashboardPage, StatCard, ManagementActions |
| `/admin/analyses` | Home UI.jpg | AllAnalysesPage, ExtendedHistoryTable |
| `/admin/users` | user management UI.jpg | UserManagementPage, UserTable, UserRow |

---

## Accessibility Notes (from Mockups)

- **Color contrast:** Ensure navy text on light gray meets WCAG AA (4.5:1)
- **Dark theme contrast:** White text on `#0d1b2a` passes AAA
- **Button states:** All buttons must have hover/focus states
- **Table accessibility:** `<table>`, `<thead>`, `<tbody>` semantic HTML with proper headers
- **Badge colors:** Don't rely solely on color (use icon + text)
- **Keyboard nav:** All interactive elements must be keyboard-accessible

---

## Implementation Priority (Based on Mockups)

1. **Landing page** (upload interface) — Phase 5
2. **Detection result page** (operation UI) — Phase 6/7
3. **History page** (previous analysis) — Phase 5
4. **Admin dashboard** (operations) — Phase 10
5. **User management** — Phase 10
6. **All saved analyses** (admin history) — Phase 10
