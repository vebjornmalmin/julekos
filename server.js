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

// Shared monster state (health/dead) per level
// levelId -> { healthByIndex: { [idx]: number }, dead: Set<number> }
const monsterState = {};

// Track players who are "ready" for the next level
// levelId -> Set of socket IDs
const levelCompletion = {};

// Shared lives per level (team lives)
// levelId -> integer lives remaining
const levelLives = {};

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
                name: players[socket.id].name,
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

    // --- Monster sync (health + death only) ---
    socket.on('requestMonsterState', (levelId) => {
        const state = monsterState[levelId];
        if (!state) {
            socket.emit('monsterStateResponse', { levelId, healthByIndex: {}, deadIndices: [] });
            return;
        }
        socket.emit('monsterStateResponse', {
            levelId,
            healthByIndex: state.healthByIndex,
            deadIndices: Array.from(state.dead)
        });
    });

    socket.on('monsterHit', ({ levelId, monsterIndex, health }) => {
        if (!levelId && levelId !== 0) return;
        if (monsterIndex === undefined || monsterIndex === null) return;

        if (!monsterState[levelId]) {
            monsterState[levelId] = { healthByIndex: {}, dead: new Set() };
        }
        const state = monsterState[levelId];

        // Ignore hits to dead monsters
        if (state.dead.has(monsterIndex)) return;

        const nextHealth = Math.max(0, Math.min(99, Number(health)));
        state.healthByIndex[monsterIndex] = nextHealth;
        io.emit('monsterHit', { levelId, monsterIndex, health: nextHealth });

        if (nextHealth <= 0) {
            state.dead.add(monsterIndex);
            io.emit('monsterDied', { levelId, monsterIndex });
        }
    });

    socket.on('monsterDied', ({ levelId, monsterIndex }) => {
        if (!levelId && levelId !== 0) return;
        if (monsterIndex === undefined || monsterIndex === null) return;

        if (!monsterState[levelId]) {
            monsterState[levelId] = { healthByIndex: {}, dead: new Set() };
        }
        const state = monsterState[levelId];
        if (!state.dead.has(monsterIndex)) {
            state.dead.add(monsterIndex);
        }
        state.healthByIndex[monsterIndex] = 0;
        io.emit('monsterDied', { levelId, monsterIndex });
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
        // Reset lives for next level
        levelLives[currentLevelId + 1] = 3;
        io.emit('startNextLevel', currentLevelId + 1);
    });

    socket.on('requestLivesState', (levelId) => {
        if (!levelId) return;
        if (levelLives[levelId] == null) levelLives[levelId] = 3;
        socket.emit('livesUpdate', { levelId, lives: levelLives[levelId] });
    });

    // If anyone dies, decrement lives. Only reset the level when lives reach 0.
    socket.on('playerDied', ({ levelId, playerId }) => {
        if (!levelId) return;
        if (levelLives[levelId] == null) levelLives[levelId] = 3;

        levelLives[levelId] = Math.max(0, levelLives[levelId] - 1);
        console.log(`Level ${levelId} lives remaining: ${levelLives[levelId]}`);

        io.emit('livesUpdate', { levelId, lives: levelLives[levelId] });

        if (levelLives[levelId] > 0) {
            // Respawn only the dead player, keep collectibles/monsters as-is
            io.emit('playerRespawn', { levelId, playerId });
            return;
        }

        // Out of lives: reset level state
        console.log(`Resetting level ${levelId} after running out of lives.`);
        levelLives[levelId] = 3;
        levelState[levelId] = new Set();
        levelCompletion[levelId] = new Set();
        monsterState[levelId] = { healthByIndex: {}, dead: new Set() };
        io.emit('levelReset', levelId);
        io.emit('livesUpdate', { levelId, lives: levelLives[levelId] });
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