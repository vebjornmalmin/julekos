const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve index.html with DEBUG_MODE injected
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading page');
        }
        const debugScript = `<script>window.DEBUG_MODE = ${process.env.DEBUG_MODE === 'true'};</script>`;
        const modifiedHtml = html.replace('<!-- DEBUG_MODE_SCRIPT_PLACEHOLDER -->', debugScript);
        res.send(modifiedHtml);
    });
});

app.use(express.static(path.join(__dirname, 'public')));

// Game State
const players = {}; // socket.id -> { name, x, y, frame, facingRight, level }

// Store collected indices per level to sync new players
// levelId -> Set of integer indices
const levelState = {}; 

// Track players who are "ready" for the next level
// levelId -> Set of socket IDs
const levelCompletion = {};

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
    
    // Allow client to ask for current level state
    socket.on('requestLevelState', (levelId) => {
        if (levelState[levelId]) {
            const collectedIndices = Array.from(levelState[levelId]);
            socket.emit('levelStateResponse', { levelId, collectedIndices });
        }
    });

    // Handle Door Logic
    socket.on('playerEnteredDoor', (levelId) => {
        // In debug mode, allow single-player progression
        if (process.env.DEBUG_MODE === 'true') {
            console.log(`Debug mode: Single player completing Level ${levelId}`);
            io.emit('levelComplete', levelId);
            return;
        }
        
        if (!levelCompletion[levelId]) {
            levelCompletion[levelId] = new Set();
        }
        
        levelCompletion[levelId].add(socket.id);
        
        const currentPlayersCount = Object.keys(players).length;
        const readyPlayersCount = levelCompletion[levelId].size;
        
        console.log(`Level ${levelId}: ${readyPlayersCount}/${currentPlayersCount} players at door.`);
        
        // Notify the player they are waiting
        socket.emit('waitingAtDoor');

        // Check if everyone is ready
        if (readyPlayersCount >= currentPlayersCount) {
            console.log(`All players at door for Level ${levelId}. Completing...`);
            io.emit('levelComplete', levelId); // Trigger score screen
            
            // Auto-start next level after a brief delay or let them click "Continue"?
            // User requirement: "Level progress only happens when both players walk through the door"
            // So hitting the door = Level Complete.
            // Then we can show the score screen and let them click "Next Level".
        }
    });

    socket.on('requestNextLevel', (currentLevelId) => {
        // Simple relay to start next level for everyone if one person clicks continue?
        // Or require voting again? Let's just make "Continue" start it for everyone for simplicity
        io.emit('startNextLevel', currentLevelId + 1);
    });

    socket.on('disconnect', () => {
        if (players[socket.id]) {
            console.log(`Player ${players[socket.id].name} disconnected`);
            delete players[socket.id];
            
            // Remove from completion sets to avoid deadlocks
            for (const lvl in levelCompletion) {
                if (levelCompletion[lvl].has(socket.id)) {
                    levelCompletion[lvl].delete(socket.id);
                }
            }
            
            io.emit('playerLeft', socket.id);
            io.emit('currentPlayers', Object.values(players).map(p => p.name));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});