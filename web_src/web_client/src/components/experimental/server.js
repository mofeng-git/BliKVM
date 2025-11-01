const WebSocket = require('ws');
const fs = require('fs');
const https = require('https');
const path = require('path');

const url = '0.0.0.0';
const port = 3000;

// HTTPS server setup
const server = https.createServer({
  cert: fs.readFileSync('./cert.pem'),
  key: fs.readFileSync('./key.pem'),
});

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Client tracking for echo prevention
const clients = new Map(); // ws -> { clientId, isActive }
let opusFileStream = null;

// Opus frame validation function
function isValidOpusFrame(data) {
  if (!data || data.byteLength === 0) {
    return false;
  }

  // Opus frames should be at least 1 byte and typically 20-1500 bytes
  if (data.byteLength < 1 || data.byteLength > 1500) {
    return false;
  }

  // Convert to Uint8Array if it's a Buffer
  const frame = data instanceof Buffer ? new Uint8Array(data) : data;

  // Basic Opus packet validation
  // Check TOC (Table of Contents) byte - first byte of Opus packet
  const toc = frame[0];

  // Opus TOC byte format: CCCCSSPP
  // CCCC = config (0-31), SS = stereo flag, PP = frame packing
  // Valid config should be 0-31 (5 bits)
  const config = (toc >> 3) & 0x1f;
  if (config > 31) {
    return false;
  }

  // Additional validation: check if this looks like JSON
  const firstChar = String.fromCharCode(frame[0]);
  if (firstChar === '{' || firstChar === '[') {
    return false; // This is JSON, not Opus
  }

  return true;
}

// Initialize Opus file for raw audio storage (optional)
function initOpusFile() {
  const opusFilePath = path.join(__dirname, 'output.opus');
  opusFileStream = fs.createWriteStream(opusFilePath);
  console.log('Opus file stream initialized:', opusFilePath);
}

// Global error handler
wss.on('error', (err) => {
  console.error('WebSocket server error:', err);
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Initialize client without ID first
  clients.set(ws, { clientId: null, isActive: true });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });

  ws.on('message', (data, isBinary) => {
    const client = clients.get(ws);

    if (!client) {
      console.warn('Message from unknown client, ignoring');
      return;
    }

    // Handle JSON messages (client identification)
    if (!isBinary) {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'identify' && message.clientId) {
          client.clientId = message.clientId;
          clients.set(ws, client);
          console.log(`Client identified: ${message.clientId}`);
          return;
        }
      } catch (err) {
        console.warn('Invalid JSON message received:', err.message);
        return;
      }
    }

    // Handle binary audio data (Opus frames)
    if (isBinary && data.byteLength > 0) {
      // Validate Opus frame before broadcasting
      if (!isValidOpusFrame(data)) {
        console.warn(
          `Invalid Opus frame from client ${client.clientId || 'unknown'}, skipping broadcast`
        );
        return;
      }

      console.log(`Received ${data.byteLength} bytes from client ${client.clientId || 'unknown'}`);

      // Optional: Save raw Opus data to file
      if (opusFileStream) {
        opusFileStream.write(data);
      }

      // Broadcast to all other clients (echo prevention)
      let broadcastCount = 0;
      const senderClientId = client.clientId;

      for (const [clientWs, clientInfo] of clients) {
        // Skip sender (by WebSocket reference AND client ID) and inactive clients
        if (
          clientWs !== ws &&
          clientInfo.clientId !== senderClientId &&
          clientInfo.isActive &&
          clientWs.readyState === WebSocket.OPEN
        ) {
          try {
            clientWs.send(data);
            broadcastCount++;
          } catch (sendError) {
            console.error(`Failed to send to client ${clientInfo.clientId}:`, sendError);
            clientInfo.isActive = false;
          }
        }
      }

      if (broadcastCount > 0) {
        console.log(`Broadcasted to ${broadcastCount} clients`);
      }
    } else if (isBinary) {
      console.warn('Received empty binary message, ignoring');
    }
  });

  ws.on('close', (code, reason) => {
    const client = clients.get(ws);
    console.log(
      `Client disconnected: ${client?.clientId || 'unknown'} (code: ${code}, reason: ${reason?.toString() || 'none'})`
    );
    clients.delete(ws);
  });

  // Ping/pong for connection health
  ws.on('pong', () => {
    const client = clients.get(ws);
    if (client) {
      client.isActive = true;
    }
  });
});

// Periodic connection health check
setInterval(() => {
  for (const [ws, client] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      client.isActive = false; // Will be set to true on pong
      ws.ping();
    } else {
      clients.delete(ws);
    }
  }
}, 30000); // Check every 30 seconds

// HTTP routes
server.on('request', (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/opus.opus') {
    // Serve raw Opus file
    const opusFilePath = path.join(__dirname, 'output.opus');
    if (fs.existsSync(opusFilePath)) {
      res.writeHead(200, {
        'Content-Type': 'audio/opus',
      });
      fs.createReadStream(opusFilePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Opus file not found');
    }
  } else if (req.url === '/status') {
    // Server status endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        connectedClients: clients.size,
        activeClients: Array.from(clients.values()).filter((c) => c.isActive).length,
        clients: Array.from(clients.values()).map((c) => ({
          clientId: c.clientId,
          isActive: c.isActive,
        })),
      })
    );
  } else if (req.url === '/health') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Graceful shutdown
function gracefulShutdown() {
  console.log('\nShutting down server...');

  // Close all WebSocket connections
  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(1001, 'Server shutting down');
    }
  }

  // Close Opus file stream
  if (opusFileStream) {
    opusFileStream.end(() => {
      console.log('Opus file stream closed');
    });
  }

  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');

    // Close HTTPS server
    server.close(() => {
      console.log('HTTPS server closed');
      process.exit(0);
    });
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.log('Force exit');
    process.exit(1);
  }, 5000);
}

// Handle shutdown signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start server
server.listen(port, url, () => {
  console.log(`HTTPS/WebSocket server listening on wss://${url}:${port}/ws`);
  console.log(`Status endpoint: https://${url}:${port}/status`);
  console.log(`Health check: https://${url}:${port}/health`);
  console.log(`Opus file: https://${url}:${port}/opus.opus`);

  // Initialize Opus file stream (optional)
  initOpusFile();
});

// Log server stats every 60 seconds
setInterval(() => {
  const activeClients = Array.from(clients.values()).filter((c) => c.isActive).length;
  console.log(`Server stats - Total clients: ${clients.size}, Active: ${activeClients}`);
}, 60000);
