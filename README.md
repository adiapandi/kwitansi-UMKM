# 🧾 Buku Kwitansi

A simple invoice & receipt (kwitansi) generator for **freelancers and small businesses (UMKM)**.
Create a document, it's saved automatically, then print or save as PDF.
Free hosting, free database, installable like a native app.

> Built with zero build step (no bundler) — just HTML, JS, and Firebase.
> Upload it to GitHub Pages and it just works.

---

## ✨ Features

- **Invoice & Kwitansi** in one app, just toggle between them
  - Invoice: itemized line items, qty × price, discount, tax %
  - Kwitansi (receipt): single amount + automatic "amount in words" (a standard convention for Indonesian receipts)
- **Auto-generated document numbers** (`INV-202608-001` / `KWT-202608-001`), still editable manually
- **Document history** — search, filter by type, reopen to edit, or delete
- **Paid/unpaid status**, with a "LUNAS" (paid) stamp that appears automatically on the preview
- **Business profile** — name, address, logo, bank details — auto-applied to the header of every document
- **Print / Save as PDF** directly from the browser, one click
- **PWA** — installable to your homescreen/desktop with its own icon, works offline for already-cached data
- Data is stored in your own **Firebase Firestore** project (not a third party)

## 🛠️ Tech Stack

| Part | Technology |
|---|---|
| UI | React 18 (via CDN, no bundler) + Babel Standalone (transpiles JSX directly in the browser) |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (Anonymous) — so Firestore isn't left wide open to the public |
| Hosting | GitHub Pages (static, free) |
| Offline/Installable | Service Worker + Web App Manifest (PWA) |

No `npm install`, no build step — every file in this repo can be deployed as-is.

## 📂 Project Structure

```
├── index.html          # main shell: loads React, Babel, Firebase, registers the service worker
├── app.jsx             # all app logic & UI (React)
├── firebase-config.js  # your Firebase project credentials (YOU must fill this in)
├── manifest.json        # PWA config (name, colors, icons)
├── service-worker.js    # caching for offline mode
├── icons/               # app icons (192px, 512px, maskable, apple-touch)
└── README.md
```

## 🚀 Deployment Guide

### 1. Set up Firebase (free)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. In the project dashboard → click the **`</>`** icon (Add app → Web) → give the app a name.
   Firebase will show you a `firebaseConfig` object — copy all of it.
3. Paste it into the `firebaseConfig` object in **`firebase-config.js`**.
4. **Build → Firestore Database → Create database** → **Production** mode.
5. **Build → Authentication → Sign-in method** → enable the **Anonymous** provider
   (used so only this app can access the data, not the public).
6. **Firestore Database → Rules**, replace with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   then click **Publish**.

### 2. Deploy to GitHub Pages

1. Push/upload all the files in this repo to GitHub (public or private repo, both are free for Pages).
2. **Settings → Pages** → Source: branch `main`, folder `/ (root)` → **Save**.
3. Wait 1-2 minutes → the app goes live at `https://username.github.io/repo-name/`.

Every time you update a file in the repo, GitHub Pages redeploys automatically.

## 🎨 Customization

- Colors & visual identity: variables at the top of `app.jsx` (`INK`, `STAMP`, `PAPER`, etc.).
- Icons: replace the files in the `icons/` folder (keep the same size & filename), or update the paths in `manifest.json` / `index.html`.
- Document number format: the `genNumber()` function in `app.jsx`.

## ⚠️ Security Note

Data is stored in your own Firestore project. Don't skip the
Authentication + Security Rules steps above — without them, anyone who
knows your `projectId` could read/write your data freely.

## 📄 License

Free to use, modify, and redistribute for personal or commercial purposes.
