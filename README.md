# Moodist Spatial

A modern, high-performance ambient sound mixer with spatial audio logic and multi-device synchronization. 

Built with Svelte 5 (Runes) and Web Audio API.

## Features

- **Spatial Mixer:** Drag sound nodes on a 2D orbit to control volume based on proximity to the listener.
- **Remote Sync:** Connect multiple devices (Work PC, Phone, Server) and choose which one plays the audio while controlling it from any other device.
- **Audio-Reactive UI:** Background visualizers and pulses that react to the current soundscape's amplitude.
- **Mobile Optimized:** Full touch support for dragging sounds and a responsive mobile layout.
- **Dockerized:** Simple deployment with a single command.

## Tech Stack

- **Frontend:** Svelte 5 (Runes), TypeScript, Vite, Tailwind CSS 4.
- **Backend:** Node.js (Express) with WebSockets for real-time state synchronization.
- **Icons:** Lucide Svelte.
- **Infrastructure:** Docker.

## Deployment

To run the application, simply use:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:3001`.

---
Created with Antigravity.
