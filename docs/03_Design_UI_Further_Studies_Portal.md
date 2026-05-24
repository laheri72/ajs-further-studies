# Further Studies Portal — Design + UI Specification

## 1. Design direction

The portal should feel dignified, institutional, and premium. It is not a casual student form. It is a serious academic and administrative journey.

The best visual language is:
- deep forest green background
- antique gold accents
- soft glass-like cards
- high contrast text
- elegant serif headings
- clean sans body text
- smooth motion without gimmicks

## 2. Brand tone

### Words that describe the UI
- reverent
- calm
- serious
- trustworthy
- refined
- ceremonial
- clear
- modern but rooted

### Words to avoid
- playful
- noisy
- loud
- neon
- cartoonish
- generic dashboard look

## 3. Color system

### Core palette
- Background: very dark forest green
- Surface/card: translucent green-black panels
- Primary accent: antique gold
- Secondary text: muted warm ivory
- Success: restrained green
- Warning: amber/gold
- Danger: soft muted red

### Usage rules
- Gold should be used for emphasis, not everywhere.
- Status chips should be immediately readable.
- Cards should have subtle borders and depth.
- Inputs should feel integrated into the theme.

## 4. Typography

### Headings
Use a refined serif such as:
- Cormorant Garamond
- or a similarly elegant high-contrast serif

### Body
Use a clean sans serif such as:
- Jost
- or a similarly calm geometric sans

### Type behavior
- Large, graceful page titles
- Small uppercase section labels
- Readable paragraph spacing
- Comfortable line heights
- No cramped text blocks

## 5. Layout principles

### Global shell
- Sticky top nav
- Small emblem/logo at left
- User identity at right
- Sign out action clearly visible
- Page content centered in a restrained width container

### Page structure
- Home landing
- Student login
- Admin login
- Unauthorized screen
- Student profile linking
- Student dashboard
- Admin dashboard
- Admin modal

### Spacing rules
- Plenty of breathing room
- Cards should not touch the viewport edges
- Use generous vertical rhythm
- Mobile layout should collapse gracefully

## 6. Component design

### 6.1 Landing page cards
Two large entry cards:
- Student Portal
- Admin Portal

Each card should include:
- icon or symbol
- title
- short explanation
- action button

### 6.2 Auth card
- Centered single-purpose card
- Google login button
- Gentle helper text
- Minimal clutter

### 6.3 Student profile card
- TR number input
- Full name input
- Save and continue button
- Clear explanation that the Google account is being linked

### 6.4 Multi-step registration
Use a guided step system where the current step is visually obvious.

#### Step indicator
- numbered circles
- active state
- completed state
- connecting lines
- responsive and slim

#### Step sections
Each step should feel like a page in a guided form:
- one visible section at a time
- fade or slide transition
- no harsh jumps

#### Choice cards
Use card-like radio options for:
- yes/no questions
- intent selection
- stage selection

Cards should:
- be clickable
- show selected state clearly
- have subtle hover feedback
- stay readable on mobile

### 6.5 Pill selectors
Use pill-style selectors for:
- months
- clash events
- qualifications if needed

Selected pills should have gold emphasis. Unselected pills should remain subdued.

### 6.6 Review screen
The review screen should feel like a neat summary sheet:
- two-column rows
- labels on the left
- values on the right
- clean separators
- no visual noise

### 6.7 Status banner
The student dashboard needs a prominent state panel:
- Pending state should feel calm and informative
- Approved state should feel affirmative but still institutional
- Notes should appear as a dedicated section

### 6.8 Admin dashboard
Should feel like a command center, not a spreadsheet dump.

Include:
- stats cards at top
- search and filter row
- compact but readable table
- status chips
- manage action button
- modal with detailed breakdown

### 6.9 Admin modal
The modal should:
- dim the background
- show a full profile summary
- show editable notes
- allow status toggle
- include save and cancel actions

## 7. Micro-interactions

- Smooth hover states on cards and buttons
- Subtle fade/slide between steps
- Loading spinner for auth/init
- Selected card animation or border emphasis
- Modal open/close fade
- Button disabled states
- Gentle transitions for status updates

## 8. Mobile design behavior

- One-column layout
- Step cards stack vertically
- Table becomes horizontally scrollable or cardified
- Nav compresses cleanly
- Buttons become full width where appropriate
- Modals should fit within viewport height

## 9. Accessibility guidelines

- Maintain readable contrast
- Never use color alone to communicate status
- Keep button labels explicit
- Use real labels for form inputs
- Support keyboard navigation for controls
- Make selected states obvious without relying only on tiny borders

## 10. Visual hierarchy by page

### Home
Hero title first, then a short summary, then two entry cards.

### Student portal
Login card first, then profile linking, then the guided form.

### Student dashboard
Status banner first, then the registration form, then review or update flow.

### Admin dashboard
Page title and stats first, then search/filter, then table, then detailed modal.

## 11. UI tokens to define

A Codex prompt should ask for:
- `--bg`
- `--surface`
- `--border`
- `--text`
- `--muted`
- `--gold`
- `--success`
- `--warning`
- `--danger`
- `--radius-sm`
- `--radius-md`
- `--radius-lg`

## 12. Design do-not list

- no bright corporate blue theme
- no default bootstrap feel
- no crowded forms
- no tiny unreadable labels
- no harsh shadows
- no overdone gradients
- no busy animated backgrounds

## 13. Visual reference for Codex

Tell Codex the interface should feel like:
- an institutional portal with a premium studio finish,
- a serene academic ritual rather than an ordinary SaaS dashboard,
- a design that uses restraint to communicate importance.
