# ShareWithMe 🚀

> **Instant static web deployment & QR code sharing for students, creators, and hobbyists.**  
> Built for [hitarth.tech](https://hitarth.tech) to allow anyone to showcase HTML, CSS, and JavaScript creations without friction or expensive hosting limits.

---

## ✨ Features

- **⚡ Dual Creation Modes**:
  - **In-Browser Code Editor**: 3 syntax-highlighted tabs (HTML, CSS, JavaScript) powered by CodeMirror, with real-time live preview that updates as you type. Includes starter templates (Counter App, Glow Card).
  - **Drag & Drop / Zip Uploader**: Drop a `.zip` archive or individual `.html`, `.css`, and `.js` files. Client-side JSZip automatically extracts and bundles them.
- **📱 Instant Links & QR Code Generator**:
  - Every deployment gets an interactive live link (`/p/:slug`) and a scannable QR code.
  - Test responsive creations on phones instantly.
  - Download high-res QR code PNGs or share directly via WhatsApp.
- **🔒 Sandboxed & Secure**:
  - Previews run in strict sandboxed iframes (`sandbox="allow-scripts allow-forms allow-modals"`) without `allow-same-origin`, guaranteeing untrusted user JavaScript has zero access to host cookies, `localStorage`, or parent window objects.
  - Direct raw endpoint (`/raw/:slug`) includes strict Content-Security-Policy headers.
- **⏱️ Automated Zero-Cron Cleanup (MongoDB TTL)**:
  - Powered by MongoDB Atlas TTL indexes (`expireAfterSeconds: 0`), expired projects automatically self-destruct in the background every 60 seconds with no external cron jobs or workers required.
- **👥 Tiered Quotas & Guest Recovery**:
  - **Guests (No Sign-in)**: Max **2 active projects**, link TTL up to **2 hours**. Session and edit tokens are cached in `localStorage` so guests never lose their links or countdowns.
  - **Authenticated Users (Google OAuth)**: Max **5 active projects**, link TTL up to **30 days**.
  - **Seamless Project Claiming**: Guests who later sign in with Google can claim their active projects with a single click, extending their expiration to 30 days.
- **🖼️ Real Live Thumbnails**:
  - Dashboard project cards render live scaled iframes of the actual website without requiring headless browser screenshot workers.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Code Editor**: `@uiw/react-codemirror` (HTML, CSS, JS extensions, OneDark theme)
- **Database**: MongoDB Atlas via Mongoose with auto-cleanup TTL indexes
- **Auth**: Auth.js / NextAuth v5 (Google OAuth)
- **QR Codes**: `qrcode.react` (SVG & Canvas rendering)
- **Zip Extraction**: `JSZip`

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/hitarth-ganatra-college/ShareWithMe.git
cd ShareWithMe
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (refer to `.env.example`):

```env
# MongoDB Atlas Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sharewithme?retryWrites=true&w=majority

# NextAuth Configuration
AUTH_SECRET=generate_a_random_32_character_string_here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth Credentials (Optional for local guest testing)
AUTH_GOOGLE_ID=your-google-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 📄 License

MIT © [Hitarth Ganatra](https://hitarth.tech)
