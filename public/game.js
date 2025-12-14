import { gameConfig, assets } from './modules/Config.js';
import { Monster } from './modules/Monster.js';
import { levelsData } from './modules/Levels.js';

const socket = io(); // Global io from script tag

// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 800;


const gameState = {
    currentLevel: 1,
    totalLevels: 10,
    progress: 0,
    maxProgress: 0,
    running: false,
    playerName: '',
    isDead: false,
    atDoor: false,
    waitingAtDoor: false
};

// Player Object
const player = {
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 0,
    speed: gameConfig.baseSpeed,
    jumpPower: gameConfig.baseJump,
    onGround: false,
    facingRight: true,
    speedBoostTimer: 0,
    jumpBoostTimer: 0
};

// Partner Object
const partner = {
    active: false,
    name: '',
    x: 50,
    y: 300,
    width: 40,
    height: 40,
    facingRight: true,
    level: 1,
    isDead: false // Maybe track this later
};

// Game Objects
let platforms = [];
let collectibles = [];
let monsters = [];
let door = null;
let particles = [];
let snowflakes = [];

// Initialize background snow
for(let i=0; i<100; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1,
        sway: Math.random() * 0.5
    });
}

// --- Physics & Logic ---

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updatePhysics() {
    if (gameState.isDead) return;

    // Movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.velocityX = -player.speed;
        player.facingRight = false;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.velocityX = player.speed;
        player.facingRight = true;
    } else {
        player.velocityX *= gameConfig.friction;
    }

    // Jump
    if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }

    // Gravity
    player.velocityY += gameConfig.gravity;
    if (player.velocityY > gameConfig.terminalVelocity) player.velocityY = gameConfig.terminalVelocity;

    player.x += player.velocityX;
    player.y += player.velocityY;

    // Powerup Timers
    if (player.speedBoostTimer > 0) {
        player.speedBoostTimer--;
        if(player.speedBoostTimer <= 0) player.speed = gameConfig.baseSpeed;
    }
    if (player.jumpBoostTimer > 0) {
        player.jumpBoostTimer--;
        if(player.jumpBoostTimer <= 0) player.jumpPower = gameConfig.baseJump;
    }

    // Platform Collision
    player.onGround = false;
    for (let platform of platforms) {
        if (checkCollision(player, platform)) {
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            } else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            } else if (player.velocityX > 0 && player.x + player.width - player.velocityX <= platform.x) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (player.velocityX < 0 && player.x - player.velocityX >= platform.x + platform.width) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }

    // Boundaries -> Death
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) {
        die("You fell!");
    }

    // Collectibles
    for (let i = 0; i < collectibles.length; i++) {
        let c = collectibles[i];
        if (!c.collected && checkCollision(player, c)) {
            if (c.requiredPlayer && c.requiredPlayer !== gameState.playerName) continue;

            c.collected = true;
            gameState.progress++;
            
            // Powerup Logic
            if (c.type === 'snowflake') {
                player.speed = gameConfig.baseSpeed * 1.5;
                player.speedBoostTimer = 300; // 5 seconds
                createParticles(player.x, player.y, '#00ffff', 20);
            } else if (c.type === 'star') {
                player.jumpPower = gameConfig.baseJump * 1.5;
                player.jumpBoostTimer = 300;
                createParticles(player.x, player.y, '#ffff00', 20);
            } else {
                createParticles(c.x, c.y, '#fff', 10);
            }

            updateUI();
            socket.emit('starCollected', { levelId: gameState.currentLevel, collectibleIndex: i });
        }
    }

    // Monsters -> Interaction (Stomp or Die)
    for(let i = monsters.length - 1; i >= 0; i--) {
        let m = monsters[i];
        m.update();
        if(checkCollision(player, m)) {
            // Check for stomp: Falling down and hitting the top half of the monster
            const hittingTop = player.velocityY > 0 && (player.y + player.height) < (m.y + m.height * 0.5);
            
            if (hittingTop) {
                // Bounce
                player.velocityY = -10;
                m.health--;
                createParticles(m.x + m.width/2, m.y, '#fff', 10); // Hit effect

                if (m.health <= 0) {
                    createParticles(m.x + m.width/2, m.y + m.height/2, '#555', 30); // Death effect
                    monsters.splice(i, 1);
                }
            } else {
                die(`Eaten by ${m.name}!`);
            }
        }
    }

    // Door Logic
    if (door && !gameState.atDoor && !gameState.waitingAtDoor) {
        if (checkCollision(player, door)) {
            if (gameState.progress >= gameState.maxProgress) {
                gameState.atDoor = true;
                gameState.waitingAtDoor = true;
                socket.emit('playerEnteredDoor', gameState.currentLevel);
                // Show waiting text
                document.getElementById('doorStatus').textContent = "Waiting for partner...";
                document.getElementById('doorStatus').classList.remove('hidden');
            } else {
                // Hint to collect more
                // (Optional: UI feedback)
            }
        }
    }

    // Network Update
    if (gameState.running) {
        socket.emit('playerUpdate', {
            x: player.x,
            y: player.y,
            facingRight: player.facingRight,
            level: gameState.currentLevel,
            atDoor: gameState.atDoor
        });
    }
}

function die(reason) {
    if (gameState.isDead) return;
    gameState.isDead = true;
    console.log("Died:", reason);
    
    // Visual effect
    createParticles(player.x, player.y, '#ff0000', 50);
    
    setTimeout(() => {
        resetPlayerPosition();
        gameState.isDead = false;
        // Reset powerups
        player.speed = gameConfig.baseSpeed;
        player.jumpPower = gameConfig.baseJump;
    }, 1000);
}

// --- Drawing ---
function draw() {
    if(gameState.isDead) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#ff0000';
        ctx.font = '40px Courier New';
        ctx.fillText("YOU DIED", 300, 300);
        return;
    }

    const level = levelsData[gameState.currentLevel - 1];
    if (!level) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    level.theme.sky.forEach((c, i) => gradient.addColorStop(i, c));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Platforms
    platforms.forEach(p => {
        ctx.fillStyle = level.theme.platform;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        // Snow top
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x, p.y, p.width, 10);
    });

    // Door
    if (door) {
        // Draw door (Open if items collected?)
        const isOpen = gameState.progress >= gameState.maxProgress;
        ctx.globalAlpha = isOpen ? 1.0 : 0.5;
        ctx.drawImage(assets.door, door.x, door.y, door.width, door.height);
        ctx.globalAlpha = 1.0;
    }

    // Collectibles
    collectibles.forEach(c => {
        if(!c.collected) {
            drawIcon(c);
        }
    });

    // Monsters
    monsters.forEach(m => m.draw(ctx));

    // Player
    const playerImg = gameState.playerName === 'Vilde' ? assets.vilde : assets.nora;
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    
    // Partner
    if (partner.active && partner.level === gameState.currentLevel) {
        ctx.globalAlpha = 0.6;
        const partnerImg = partner.name === 'Vilde' ? assets.vilde : assets.nora;
        ctx.drawImage(partnerImg, partner.x, partner.y, partner.width, partner.height);
        ctx.globalAlpha = 1.0;
    }

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 5, 5);
        ctx.globalAlpha = 1.0;
    });
}

function drawIcon(c) {
    const cx = c.x + c.width/2;
    const cy = c.y + c.height/2;
    const size = c.width;

    // Bobbing
    const bob = Math.sin(Date.now() / 200) * 3;
    
    // Ring
    if (c.requiredPlayer) {
        ctx.strokeStyle = c.requiredPlayer === 'Vilde' ? '#ff4d4d' : '#4da6ff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy + bob, size/1.5, 0, Math.PI*2); ctx.stroke();
    }

    // Icon
    if(c.type === 'snowflake') {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath(); ctx.arc(cx, cy + bob, size/3, 0, Math.PI*2); ctx.fill();
    } else if (c.type === 'star') {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath(); ctx.arc(cx, cy + bob, size/3, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(cx, cy + bob, size/3, 0, Math.PI*2); ctx.fill();
    }
}

// --- Init & Events ---
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Socket Listeners
socket.on('levelStateResponse', (data) => {
    if (data.levelId === gameState.currentLevel && data.collectedIndices) {
        data.collectedIndices.forEach(idx => {
            if(collectibles[idx]) {
                collectibles[idx].collected = true;
                gameState.progress++;
            }
        });
        updateUI();
    }
});

socket.on('globalStarCollected', (data) => {
    if (data.levelId === gameState.currentLevel) {
        if(collectibles[data.collectibleIndex] && !collectibles[data.collectibleIndex].collected) {
            collectibles[data.collectibleIndex].collected = true;
            gameState.progress++;
            updateUI();
        }
    }
});

socket.on('otherPlayerMoved', (data) => {
    partner.active = true;
    partner.x = data.x;
    partner.y = data.y;
    partner.level = data.level;
    // We could show "At Door" status on partner too if we wanted
});

socket.on('waitingAtDoor', () => {
    document.getElementById('doorStatus').textContent = "Waiting for partner to enter...";
    document.getElementById('doorStatus').classList.remove('hidden');
});

socket.on('levelComplete', (levelId) => {
    // Show Score Screen
    document.getElementById('messageScreen').classList.remove('hidden');
    document.getElementById('messageTitle').textContent = "LEVEL COMPLETE!";
    document.getElementById('messageSubtitle').textContent = "Great Teamwork!";
    document.getElementById('btnNextLevel').textContent = "Next Level";
    document.getElementById('btnNextLevel').onclick = () => {
        socket.emit('requestNextLevel', levelId);
    };
});

socket.on('startNextLevel', (nextId) => {
    loadLevel(nextId);
});

// Helper Functions
function updateUI() {
    // Update the level display outside the game canvas
    const levelDisplayOutside = document.getElementById('levelDisplayOutside');
    if (levelDisplayOutside) {
        levelDisplayOutside.textContent = gameState.currentLevel;
    }
    // Update progress inside the game canvas
    document.getElementById('progress').textContent = gameState.progress;
    document.getElementById('maxProgress').textContent = gameState.maxProgress;
}


function resetPlayerPosition() {
    player.x = 50;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    gameState.atDoor = false;
    gameState.waitingAtDoor = false;
    document.getElementById('doorStatus').classList.add('hidden');
}

function loadLevel(id) {
    if(id > 10) return; // End game handling omitted for brevity
    gameState.currentLevel = id;
    gameState.progress = 0;
    gameState.isDead = false;
    document.getElementById('messageScreen').classList.add('hidden');
    
    const data = levelsData[id-1];
    // Fix: Map w/h to width/height
    platforms = data.platforms.map(p => ({
        x: p.x, 
        y: p.y, 
        width: p.w || p.width, 
        height: p.h || p.height, 
        color: p.color,
        type: p.type 
    }));
    collectibles = data.collectibles.map(c => ({...c, width: 30, height: 30, collected: false}));
    monsters = data.monsters.map(m => new Monster(m.x, m.y, m.range, m.name));
    door = data.door ? { x: data.door.x, y: data.door.y, width: 60, height: 80 } : null;
    gameState.maxProgress = collectibles.length;
    
    resetPlayerPosition();
    updateUI();
    socket.emit('requestLevelState', id);
}

// Particle System (Simplified)
function createParticles(x, y, color, count) {
    for(let i=0; i<count; i++) {
        particles.push({x, y, color, speedX: Math.random()*4-2, speedY: Math.random()*4-2, life: 1});
    }
}
function updateParticles() { // call in loop
    particles.forEach((p, i) => {
        p.x += p.speedX; p.y += p.speedY; p.life -= 0.05;
        if(p.life <= 0) particles.splice(i, 1);
    });
}
// Add particle draw to draw() (already there)
// Add updateParticles to loop

function gameLoop() {
    if(gameState.running) {
        updatePhysics();
        updateParticles();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Mobile/Touch Controls
function setupTouchControls() {
    const bindBtn = (id, key) => {
        const btn = document.getElementById(id);
        if (!btn) {
            console.log(`Button ${id} not found`);
            return;
        }
        const setKey = (state) => {
            // console.log(`Key ${key} set to ${state}`); // Debug log
            if (key === 'ArrowLeft') {
                keys['ArrowLeft'] = state;
                keys['a'] = state; 
            } else if (key === 'ArrowRight') {
                keys['ArrowRight'] = state;
                keys['d'] = state;
            } else if (key === ' ') {
                keys[' '] = state;
                keys['ArrowUp'] = state;
                keys['w'] = state;
            }
        };
        
        btn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); // Prevent scrolling/zoom
            setKey(true); 
        }, {passive: false});
        
        btn.addEventListener('touchend', (e) => { 
            e.preventDefault(); 
            setKey(false); 
        }, {passive: false});

        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            setKey(false);
        }, {passive: false});

        // Mouse fallbacks for testing on desktop
        btn.addEventListener('mousedown', () => setKey(true));
        btn.addEventListener('mouseup', () => setKey(false));
        btn.addEventListener('mouseleave', () => setKey(false));
    };

    bindBtn('btnLeft', 'ArrowLeft');
    bindBtn('btnRight', 'ArrowRight');
    bindBtn('btnJump', ' ');
}

// Start
setupTouchControls();
document.getElementById('btnVilde').onclick = () => socket.emit('selectCharacter', 'Vilde');
document.getElementById('btnNora').onclick = () => socket.emit('selectCharacter', 'Nora');

// Debugger: Level Jump
const levelSelect = document.getElementById('levelJump');
const debugPanelOutside = document.getElementById('debugPanelOutside'); // Reference the new outside panel

if (window.DEBUG_MODE && debugPanelOutside && levelSelect) {
    debugPanelOutside.style.display = 'block'; // Ensure it's visible if debug mode is on
    levelsData.forEach(level => {
        const option = document.createElement('option');
        option.value = level.id;
        option.textContent = `${level.id}: ${level.title}`;
        levelSelect.appendChild(option);
    });

    levelSelect.addEventListener('change', (e) => {
        const levelId = parseInt(e.target.value);
        if (levelId && !isNaN(levelId)) {
            console.log("Debug Jump to Level:", levelId);
            loadLevel(levelId);
            levelSelect.blur();
        }
    });
} else if (debugPanelOutside) {
    debugPanelOutside.style.display = 'none'; // Hide if debug mode is off
}

socket.on('selectionSuccess', (name) => {
    gameState.playerName = name;
    gameState.running = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');
    loadLevel(1);
    gameLoop();
});
