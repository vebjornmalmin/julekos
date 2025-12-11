const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Game State
const players = {}; // socket.id -> { name, x, y, frame, facingRight, level }

// Store collected indices per level to sync new players
// levelId -> Set of integer indices
const levelState = {}; 

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send current taken spots
    const takenNames = Object.values(players).map(p => p.name);
    socket.emit('currentPlayers', takenNames);

    socket.on('selectCharacter', (characterName) => {
        const isTaken = Object.values(players).some(p => p.name === characterName);
        if (isTaken) {
            socket.emit('selectionError', 'Character is already taken.');
            return;
        }

        players[socket.id] = {
            name: characterName,
            x: 50,
            y: 300,
            level: 1,
            facingRight: true
        };

        socket.emit('selectionSuccess', characterName);
        io.emit('playerJoined', { id: socket.id, name: characterName });
        io.emit('currentPlayers', Object.values(players).map(p => p.name));
    });

    socket.on('playerUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].facingRight = data.facingRight;
            players[socket.id].level = data.level;
            
            socket.broadcast.emit('otherPlayerMoved', {
                id: socket.id,
                ...data
            });
        }
    });

    socket.on('starCollected', (data) => {
        // data = { levelId, collectibleIndex }
        if (!levelState[data.levelId]) {
            levelState[data.levelId] = new Set();
        }
        
        // Only broadcast if not already collected
        if (!levelState[data.levelId].has(data.collectibleIndex)) {
            levelState[data.levelId].add(data.collectibleIndex);
            io.emit('globalStarCollected', data);
        }
    });
    
    // New: Allow client to ask for current level state
    socket.on('requestLevelState', (levelId) => {
        if (levelState[levelId]) {
            const collectedIndices = Array.from(levelState[levelId]);
            socket.emit('levelStateResponse', { levelId, collectedIndices });
        }
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            console.log(`Player ${players[socket.id].name} disconnected`);
            delete players[socket.id];
            io.emit('playerLeft', socket.id);
            io.emit('currentPlayers', Object.values(players).map(p => p.name));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});