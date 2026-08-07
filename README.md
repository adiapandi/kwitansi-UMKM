# 🧾 Kwitansi UMKM

A simple, free invoice & receipt (kwitansi) generator for **freelancers and small businesses (UMKM)**.

Create a document, it's saved automatically to your personal Firebase database, then print or save as PDF. **Free hosting, free database, installable like a native app.**

> Built with zero build step (no bundler) — just HTML, JavaScript, and Firebase.  
> Upload it to GitHub Pages and it just works.

![type](https://img.shields.io/badge/type-PWA-blue)
![database](https://img.shields.io/badge/database-Firebase%20Firestore-orange)
![deployment](https://img.shields.io/badge/deployment-GitHub%20Pages-green)
![offline](https://img.shields.io/badge/offline-ready-brightgreen)

---

## 🎯 Quick Demo

**Live Demo:** [adiapandi.github.io/kwitansi-UMKM](https://adiapandi.github.io/kwitansi-UMKM)

### How it works in 60 seconds:
```
1. Set up your business profile once (name, address, logo, bank details)
2. Choose: Invoice or Kwitansi (receipt)
3. Fill in item details (or just amount for kwitansi)
4. Document number auto-generates (but you can edit it)
5. Mark as "Paid" when customer pays
6. Print or save as PDF
7. All documents saved & searchable → easy to find old ones
```

### Visual Workflow:
```
┌──────────────────────────────┐
│  🏪 KWITANSI UMKM            │
├──────────────────────────────┤
│ Dashboard                    │
├──────────────────────────────┤
│ [⚙️ Business Profile]         │
│ [📄 New Invoice] [📋 Receipt]│
│                              │
│ 📋 Recent Documents:         │
│ ┌──────────────────────────┐ │
│ │ INV-202608-001           │ │
│ │ PT. Maju Jaya Teknik     │ │
│ │ 5 Juta Rp │ BELUM LUNAS │ │
│ │ [Edit] [Print] [PDF]     │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ KWT-202608-001           │ │
│ │ Jasa Konsultasi          │ │
│ │ 2 Juta Rp │ LUNAS ✓      │ │
│ │ [Edit] [Print] [PDF]     │ │
│ └──────────────────────────┘ │
│                              │
│ 🔍 Search...                │
│ Filter by: [Type] [Status]  │
└──────────────────────────────┘
         ↓ (Click "New Invoice")
┌──────────────────────────────┐
│  📝 CREATE INVOICE           │
├──────────────────────────────┤
│ Document #: [INV-202608-002] │
│ Date: [06 Aug 2026]          │
│ Due Date: [06 Sep 2026]      │
│                              │
│ 👤 Customer:                 │
│ Name: [CV. Sejahtera]        │
│ Address: [Jl. Merdeka...]    │
│                              │
│ 📋 Items:                    │
│ [Item 1] [Qty] [Price] [Disc]│
│ [Item 2] [Qty] [Price] [Disc]│
│ [Item 3] [Qty] [Price] [Disc]│
│ [+ Add Item]                 │
│                              │
│ 💰 Summary:                  │
│ Subtotal: 15.000.000         │
│ Discount: 500.000            │
│ Tax (10%): 1.450.000         │
│ TOTAL: 16.450.000            │
│                              │
│ Bank Details:                │
│ [Bank Name] [Account] [Name] │
│                              │
│ Status: [○ BELUM LUNAS] [✓ LUNAS]
│                              │
│ [Preview] [Print] [Save PDF] │
│        [Save to History]     │
└──────────────────────────────┘
```

---

## ✨ Features

### 📄 Document Types
- **Invoice** — itemized line items, qty × price, discount %, tax %
- **Kwitansi (Receipt)** — single amount + automatic "amount in words" (Indonesian standard)

### 🎯 Smart Defaults
- **Auto-generated document numbers** (`INV-202608-001` / `KWT-202608-001`), still editable
- **Amount in words** — "Dua Juta Lima Ratus Ribu Rupiah" auto-generated for kwitansi
- **Business profile** — set once, auto-applied to every document

### 🔍 Document Management
- **Search & filter** — find old documents by date, type, or customer
- **Edit anytime** — update details or regenerate PDF
- **Delete if needed** — remove drafts or mistakes
- **Paid/Unpaid status** — mark as "LUNAS" (paid), shows stamp on PDF

### 🖨️ Export & Print
- **Print directly** — browser Print dialog (Ctrl+P)
- **Save as PDF** — one-click export with logo and all formatting
- **Professional layout** — ready for client delivery

### 📱 Mobile & Install
- **PWA (Progressive Web App)** — install to homescreen like a native app
- **Offline ready** — works without internet for already-cached data
- **Responsive design** — works on phone, tablet, desktop

### 🔒 Your Data
- **Firebase Firestore** — your own project, your own data
- **No third-party cloud** — documents stored in YOUR Firestore instance
- **Secure** — only you can access your data with proper authentication

---

## 🚀 Setup & Deployment

### Step 1: Create Firebase Project (Free)

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **[+ Add Project]**
3. Enter project name (e.g., "Kwitansi UMKM")
4. Click **[Create Project]** → wait for setup
5. In the project dashboard, click **`</>`** (Add App → Web)
6. Give the app a name, Firebase shows a `firebaseConfig` object
7. **Copy the entire config** (including `apiKey`, `projectId`, `appId`, etc.)
8. Paste it into `firebase-config.js` in this repo

### Step 2: Enable Firestore Database

1. In Firebase console → **Build → Firestore Database**
2. Click **[Create Database]**
3. Select **Production** mode
4. Choose location (closest to your users)
5. Click **[Create]** → database created

### Step 3: Enable Anonymous Authentication

1. **Build → Authentication → Sign-in method**
2. Click **Anonymous** provider
3. Click **[Enable]** → **[Save]**

This allows the app to access your Firestore without requiring login.

### Step 4: Set Firestore Security Rules

1. **Firestore Database → Rules** tab
2. Replace the default rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click **[Publish]**

This ensures only authenticated users (from this app) can access the data.

### Step 5: Deploy to GitHub Pages

1. Push/upload all files to GitHub (can be private or public)
2. **Settings → Pages** → Source: branch `main`, folder `/ (root)`
3. Click **[Save]**
4. Wait 1-2 minutes → app lives at `https://username.github.io/repo-name/`

**Every time you update a file, GitHub Pages redeploys automatically.**

---

## 📖 Usage Examples

### Example 1: Create Your First Invoice
```
1. Click [New Invoice]
2. Fill in customer name & address
3. Add items:
   - Item: "Web Development"
   - Qty: 1
   - Price: 5.000.000
4. Add 10% tax
5. Fill in your bank details
6. Mark as "BELUM LUNAS" (unpaid)
7. Click [Save to History]
8. Click [Print] or [Save PDF]
9. Send PDF to customer
```

### Example 2: Create a Kwitansi (Receipt)
```
1. Click [New Kwitansi]
2. Fill in customer name
3. Enter amount: 2.500.000
4. → "Dua Juta Lima Ratus Ribu Rupiah" auto-generated
5. Mark as "LUNAS" (paid)
6. Click [Print]
7. Keep printed copy for record
```

### Example 3: Find an Old Invoice
```
1. In Dashboard, use Search: "CV Maju Jaya"
2. Filter: Type = "Invoice"
3. Click document to view/edit details
4. Update payment status if needed
5. Regenerate PDF if address changed
```

---

## 🎨 Customization

All styling is in `app.jsx` at the top — easy to change:

```javascript
const INK = '#1a1a1a';           // Text color
const STAMP = '#FF6B6B';         // "LUNAS" stamp color
const PAPER = '#FFFFFF';         // Background
const ACCENT = '#4ECDC4';        // Highlights
```

**Change colors:** Modify these hex codes  
**Change fonts:** Edit the font imports in `index.html`  
**Change logo:** Replace in Firebase or update the image URL  

---

## 📂 Project Structure

```
kwitansi-UMKM/
├── index.html              # Main page (loads React, Babel, Firebase)
├── app.jsx                 # All app logic & UI (React)
├── firebase-config.js      # YOUR Firebase credentials (you fill this in)
├── manifest.json           # PWA config (name, colors, icons)
├── service-worker.js       # Offline caching
├── icons/                  # App icons (192px, 512px, maskable)
└── README.md               # This file
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **UI** | React 18 (via CDN, no bundler) + Babel Standalone |
| **Database** | Firebase Firestore (your own project) |
| **Auth** | Firebase Authentication (Anonymous) |
| **Hosting** | GitHub Pages (static, free) |
| **Install** | Service Worker + Web App Manifest (PWA) |

**No `npm install`, no build step** — every file can be deployed as-is.

---

## 🔒 Security Note

✅ **DO this:**
- Set Firestore security rules (see Step 4)
- Use Anonymous auth to restrict access to this app only
- Keep your `firebase-config.js` in this repo (credentials are public-safe)

❌ **DON'T do this:**
- Leave Firestore in public mode (anyone could read/write)
- Disable authentication
- Share your Firebase Admin credentials

---

## 📱 Installation as App

### On Android:
1. Open the live URL in Chrome
2. Menu → **[Install app]** or **[Add to Home Screen]**
3. App installed like native app

### On iOS:
1. Open in Safari
2. Share → **[Add to Home Screen]**
3. App available from home screen

### On Desktop:
1. Open in Chrome
2. Click address bar icon → **[Install]**
3. App opens in its own window

---

## ⚠️ Data Persistence

- **Automatic saving** — every change saves to Firestore immediately
- **Offline support** — cached data available even without internet
- **Backup** — Firestore keeps automatic backups (see Firebase console → Settings → Backups)
- **Export** — you can export data from Firestore console anytime

---

## 🎯 Use Cases

✅ Freelancer invoicing  
✅ UMKM receipt tracking  
✅ Service provider billing  
✅ Consultant invoices  
✅ Small shop transactions  
✅ Client history management  

---

## 🚀 Next Features (Roadmap)

- [ ] Email invoice directly to customer
- [ ] Invoice templates (customize header/footer)
- [ ] Recurring invoices
- [ ] Payment tracking dashboard
- [ ] Multi-user support (team members)
- [ ] SMS receipt notification

---

## 📄 License

Free to use, modify, and redistribute for personal or commercial purposes.

---

**Questions or issues?** Open an issue on the repository!

**Made with ❤️ for Indonesian UMKM** | [Visit live demo](https://adiapandi.github.io/kwitansi-UMKM)

© 2026 adiapandi
