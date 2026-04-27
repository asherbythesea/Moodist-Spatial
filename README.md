# Moodist Spatial 🌌

A modern, high-performance ambient sound mixer with spatial audio logic and multi-device synchronization. 

Built with **Svelte 5 (Runes)** and **Web Audio API**.

## 🚀 Features

- **Spatial Mixer:** Drag sound nodes on a 2D orbit to control volume based on proximity to the listener.
- **Remote Sync:** Connect multiple devices (Work PC, Phone, Server) and choose which one plays the audio while controlling it from any other device.
- **Audio-Reactive UI:** Background visualizers and pulses that react to the current soundscape's amplitude.
- **Mobile Optimized:** Full touch support for dragging sounds and a responsive mobile layout.
- **Professional Setup:** Dockerized with automated builds via GitHub Actions.

## 🛠️ Tech Stack

- **Frontend:** Svelte 5 (Runes), TypeScript, Vite, Tailwind CSS 4.
- **Backend:** Node.js (Express) with WebSockets for real-time state synchronization.
- **Icons:** Lucide Svelte.
- **Deployment:** Docker, GitHub Container Registry, GitHub Actions.

## 📦 Deployment

### Cloud Build (Recommended)
1. Push code to GitHub.
2. GitHub Actions builds the image automatically.
3. On your server, run:
   ```bash
   docker login ghcr.io
   docker-compose pull
   docker-compose up -d
   ```

### Local Build
```bash
docker-compose up --build
```

---
*Created with ❤️ by Antigravity.*
