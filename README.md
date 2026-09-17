# ⚡ QuickShare Web - Decentralized File & Folder Sharing

A modern, serverless, high-performance file sharing web application ready for deployment on **GitHub Pages**.

---

## 🌟 Key Features

1. **⚡ P2P Torrent Streaming (Unlimited Size & Folders)**:
   - Direct browser-to-browser transfer using WebTorrent and WebRTC data channels.
   - **Zero file size limits** — send 100MB, 5GB, or 50GB without any server storage limits.
   - **Folder & Hierarchy Support**: Drag & drop entire directories (`webkitdirectory`); folder structures are preserved.
   - **Live Speedometer HUD**: Real-time Upload Speed, Download Speed, Connected Peers, and Time Remaining (ETA).
   - **Transfer Resume**: Chunks are cached in client-side IndexedDB, allowing downloads to pause and resume.
   - **Auto-Receiver Link**: Simply share the link (with `#magnet=...`); when the recipient opens the link, it auto-connects to your swarm and begins downloading.

2. **☁️ Fast Cloud Link (Small Files < 100MB)**:
   - For quick sharing where the sender doesn't need to stay online.
   - Live upload progress bar and speed tracking.
   - Generates an instant 1-click direct download link.

3. **📱 Instant QR Code Sharing**:
   - Built-in QR code generator so people on mobile can point their phone camera and download immediately.

---

## 📦 Included Release Downloads
- **Periodica 3D v4.3.0 (Build 4303)**:
  - `downloads/Periodica-3D-v4.3.0-release.aab` (Google Play App Bundle, 4.93 MB)
  - `downloads/Periodica-3D-v4.3.0-release.apk` (Signed Release Test APK, 5.10 MB)
  - `downloads/NOTE_FOR_KAPIL.txt` (Submission Guide & Checklist)
  - `downloads/KEYSTORE_AND_BUILD_INFO.txt` (Keystore Metadata)

---

## 🚀 Live Site & Deployment on GitHub Pages

1. **Repository**: `https://github.com/Vijay-1010110/QuickShare-Web.git`
2. **GitHub Pages Live URL**: `https://vijay-1010110.github.io/QuickShare-Web/`
3. Push commands:
   ```bash
   git init
   git add .
   git commit -m "Initial release: QuickShare Web with Periodica 3D Build 4303"
   git branch -M main
   git remote add origin https://github.com/Vijay-1010110/QuickShare-Web.git
   git push -u origin main
   ```
4. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **Deploy from a branch**.
   - Select branch **main** and folder **/(root)**.
   - Click **Save**.
5. Your website will be live at:
   `https://vijay-1010110.github.io/QuickShare-Web/`

---

## 🛠️ Architecture & Tech Stack

- **100% Client-Side**: No backend server required. Runs completely free on GitHub Pages.
- **WebTorrent (`webtorrent.min.js`)**: Browser-native torrent client.
- **WebRTC Public Trackers**:
  - `wss://tracker.openwebtorrent.com`
  - `wss://tracker.webtorrent.dev`
  - `wss://tracker.btorrent.xyz`
  - `wss://tracker.fastcast.nz`
- **IndexedDB**: Persistent chunk caching for pause/resume.
- **QRCode.js**: Instant client-side QR generation.