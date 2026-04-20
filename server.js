const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Buat HTTP server untuk serve file HTML
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading page');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

// WebSocket server di atas HTTP server yang sama
const wss = new WebSocket.Server({ server });

// Simpan semua koneksi client
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client baru terhubung');
    clients.add(ws);

    // Kirim pesan selamat datang ke client baru
    ws.send(JSON.stringify({ type: 'system', message: 'Selamat datang di chat!' }));

    // Broadcast ke semua client bahwa ada user baru
    broadcast({ type: 'system', message: 'User baru bergabung' }, ws);

    ws.on('message', (data) => {
        try {
            const message = data.toString();
            console.log('Pesan diterima:', message);
            
            // Broadcast pesan ke semua client termasuk pengirim
            broadcast({ type: 'chat', message: message, timestamp: new Date().toLocaleTimeString() });
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    });

    ws.on('close', () => {
        console.log('Client terputus');
        clients.delete(ws);
        broadcast({ type: 'system', message: 'User meninggalkan chat' });
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(ws);
    });
});

function broadcast(data, exclude = null) {
    const message = JSON.stringify(data);
    for (const client of clients) {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// Jalankan server di port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
