import { WebSocketServer } from 'ws';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Serve the static files from the Svelte build
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`Moodist server listening on port ${port}`);
});

const wss = new WebSocketServer({ server });

// Simple in-memory state for remote control
const clients = new Map();
let globalMixerState = {};
let activeOutputId = 'local'; // 'local' means everyone plays locally, otherwise specific client ID plays

wss.on('connection', (ws) => {
  // Generate a random ID for this client
  const id = Math.random().toString(36).substring(2, 9);

  // Default name
  clients.set(id, { ws, name: `Device ${id}` });

  console.log(`Client connected: ${id}`);

  // Send initial state to the new client
  ws.send(JSON.stringify({
    type: 'init',
    id,
    clients: getClientsList(),
    mixerState: globalMixerState,
    activeOutputId
  }));

  // Broadcast the new client list to everyone
  broadcast({ type: 'clients', clients: getClientsList() });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'set_name':
          if (clients.has(id)) {
            clients.get(id).name = data.name;
            broadcast({ type: 'clients', clients: getClientsList() });
          }
          break;

        case 'set_output':
          activeOutputId = data.outputId;
          broadcast({ type: 'output_changed', activeOutputId });
          break;

        case 'sync_mixer':
          globalMixerState = data.state;
          // Broadcast the new state to everyone EXCEPT the sender
          // so we don't cause feedback loops
          const msg = JSON.stringify({ type: 'mixer_synced', state: globalMixerState });
          for (const [clientId, client] of clients.entries()) {
            if (clientId !== id && client.ws.readyState === 1) {
              client.ws.send(msg);
            }
          }
          break;
      }
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${id}`);
    clients.delete(id);

    // If the active output device disconnected, revert to local
    if (activeOutputId === id) {
      activeOutputId = 'local';
      broadcast({ type: 'output_changed', activeOutputId });
    }

    broadcast({ type: 'clients', clients: getClientsList() });
  });
});

function getClientsList() {
  return Array.from(clients.entries()).map(([id, client]) => ({
    id,
    name: client.name
  }));
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients.values()) {
    if (client.ws.readyState === 1) { // OPEN
      client.ws.send(msg);
    }
  }
}
