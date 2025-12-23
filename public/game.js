import { gameConfig, assets } from './modules/Config.js';
import { Monster } from './modules/Monster.js';
import { levelsData } from './modules/Levels.js';

const socket = io(); // Global io from script tag

// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1200;
canvas.height = 800;

// Visual-only scale for character sprites (keeps hitbox/collisions unchanged)
const SPRITE_SCALE = 1.5;


const gameState = {
    currentLevel: 1,
    totalLevels: 6,
    progress: 0,
    maxProgress: 0,
    running: false,
    playerName: '',
    isDead: false,
    atDoor: false,
    waitingAtDoor: false,
    showingCutScreen: false,
    showingEnding: false
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
    jumpBoostTimer: 0,
    shieldTimer: 0
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
    if (player.shieldTimer > 0) {
        player.shieldTimer--;
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
            // In debug mode, allow any player to collect any token
            if (!window.DEBUG_MODE && c.requiredPlayer && c.requiredPlayer !== gameState.playerName) continue;

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
            } else if (c.type === 'heart') {
                // Shield: temporary invulnerability against troll contact
                player.shieldTimer = 240; // ~4 seconds
                createParticles(player.x, player.y, '#ff4dd2', 25);
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
                // Shield prevents death; bounce away instead
                if (player.shieldTimer > 0) {
                    player.velocityY = -8;
                    player.velocityX = player.facingRight ? -8 : 8;
                    createParticles(player.x + player.width/2, player.y + player.height/2, '#ff4dd2', 18);
                } else {
                    die(`Eaten by ${m.name}!`);
                }
            }
        }
    }

    // Door Logic
    if (door && !gameState.atDoor && !gameState.waitingAtDoor) {
        if (checkCollision(player, door)) {
            if (gameState.progress >= gameState.maxProgress) {
                gameState.atDoor = true;
                socket.emit('playerEnteredDoor', gameState.currentLevel);
                // In debug mode, skip waiting UI
                if (!window.DEBUG_MODE) {
                    gameState.waitingAtDoor = true;
                    // Show waiting text
                    document.getElementById('doorStatus').textContent = "Waiting for partner...";
                    document.getElementById('doorStatus').classList.remove('hidden');
                }
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

// --- Background Drawing Functions ---
// Small shared helpers/state for atmospheric FX
const fxState = {
    nextLightningAt: Date.now() + 4000,
    lightningUntil: 0
};

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// Deterministic pseudo-random in [0,1) based on integer seed
function prand(seed) {
    const x = Math.sin(seed * 999.123 + 0.1234) * 43758.5453123;
    return x - Math.floor(x);
}

function drawSoftGlow(x, y, r, color, alpha = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawBackground(level) {
    const theme = level.theme;
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    theme.sky.forEach((c, i) => gradient.addColorStop(i / (theme.sky.length - 1), c));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Theme-specific backgrounds
    switch(theme.type) {
        case 'mountain':
            drawMountainBackground(theme);
            break;
        case 'coast':
            drawCoastBackground(theme);
            break;
        case 'fjord':
            drawFjordBackground(theme);
            break;
        case 'underwater':
            drawUnderwaterBackground(theme);
            break;
        case 'forest':
            drawForestBackground(theme);
            break;
        case 'christmas':
            drawChristmasBackground(theme);
            break;
    }
}

function drawMountainBackground(theme) {
    // Snowy mountains (snow all the way down) with subtle shadowing
    const mountainPath = () => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        ctx.lineTo(0, 400);
        ctx.lineTo(200, 300);
        ctx.lineTo(400, 350);
        ctx.lineTo(600, 250);
        ctx.lineTo(800, 300);
        ctx.lineTo(1000, 200);
        ctx.lineTo(1200, 250);
        ctx.lineTo(1200, canvas.height);
        ctx.closePath();
    };

    // Base snow gradient
    const snowGrad = ctx.createLinearGradient(0, 180, 0, canvas.height);
    snowGrad.addColorStop(0, '#FFFFFF');
    snowGrad.addColorStop(0.45, '#F2F7FF');
    snowGrad.addColorStop(1, '#DDE8F5');
    ctx.fillStyle = snowGrad;
    mountainPath();
    ctx.fill();

    // Soft mountain shadows (gives shape while staying snowy)
    ctx.fillStyle = 'rgba(90, 74, 63, 0.18)';
    ctx.beginPath();
    ctx.moveTo(1200, canvas.height);
    ctx.lineTo(1200, 250);
    ctx.lineTo(1000, 200);
    ctx.lineTo(800, 300);
    ctx.lineTo(600, 250);
    ctx.lineTo(700, 420);
    ctx.lineTo(920, 520);
    ctx.lineTo(1200, 600);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(90, 74, 63, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, 400);
    ctx.lineTo(200, 300);
    ctx.lineTo(400, 350);
    ctx.lineTo(300, 520);
    ctx.lineTo(140, 600);
    ctx.lineTo(0, 660);
    ctx.closePath();
    ctx.fill();

    // Cabin - improved design
    if (theme.cabin) {
        const cabinX = 150;
        const cabinY = 500;
        const cabinW = 90;
        const cabinH = 70;
        
        // Cabin base
        ctx.fillStyle = '#654321';
        ctx.fillRect(cabinX, cabinY, cabinW, cabinH);
        
        // Roof
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        // Slight overlap so the roof visually connects to the cabin (no gap)
        ctx.moveTo(cabinX - 6, cabinY + 2);
        ctx.lineTo(cabinX + cabinW/2, cabinY - 26);
        ctx.lineTo(cabinX + cabinW + 6, cabinY + 2);
        ctx.closePath();
        ctx.fill();

        // Roof eave (connection line)
        ctx.fillStyle = '#5A3418';
        ctx.fillRect(cabinX - 6, cabinY, cabinW + 12, 4);

        // Chimney
        ctx.fillStyle = '#4A2C17';
        ctx.fillRect(cabinX + cabinW - 18, cabinY - 18, 10, 20);
        
        // Snow on roof
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cabinX - 6, cabinY, cabinW + 12, 8);
        
        // Door
        ctx.fillStyle = '#4A2C17';
        ctx.fillRect(cabinX + 30, cabinY + 40, 30, 30);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cabinX + 55, cabinY + 55, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Windows
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cabinX + 10, cabinY + 20, 20, 20);
        ctx.fillRect(cabinX + 60, cabinY + 20, 20, 20);

        // Warm window glow (soft bloom)
        drawSoftGlow(cabinX + 20, cabinY + 30, 35, 'rgba(255, 210, 120, 0.65)', 1);
        drawSoftGlow(cabinX + 70, cabinY + 30, 35, 'rgba(255, 210, 120, 0.65)', 1);

        // Chimney smoke puffs
        const t = Date.now();
        for (let i = 0; i < 6; i++) {
            const phase = (t / 25 + i * 30);
            const sx = cabinX + cabinW - 12 + Math.sin(phase / 20) * (6 + i * 0.6);
            const sy = cabinY - 28 - (phase % 140) * 0.55;
            const r = 6 + (i % 3) * 2;
            ctx.fillStyle = `rgba(255,255,255,${0.18 - i * 0.02})`;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Window frames
        ctx.strokeStyle = '#4A2C17';
        ctx.lineWidth = 2;
        ctx.strokeRect(cabinX + 10, cabinY + 20, 20, 20);
        ctx.strokeRect(cabinX + 60, cabinY + 20, 20, 20);
    }

    // Spindrift / blowing snow along ridges
    const t = Date.now();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
        const x = (i * 55 + (t * 0.12)) % canvas.width;
        const y = 220 + Math.sin((t / 550) + i) * 18 + prand(i) * 20;
        const len = 10 + prand(i + 7) * 18;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y - 3);
        ctx.stroke();
    }
}

function drawCoastBackground(theme) {
    // Water
    const waterGradient = ctx.createLinearGradient(0, 600, 0, canvas.height);
    theme.water.forEach((c, i) => waterGradient.addColorStop(i / (theme.water.length - 1), c));
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 600, canvas.width, canvas.height - 600);
    
    // Islands in background
    ctx.fillStyle = '#8B7355';
    // Island 1
    ctx.beginPath();
    ctx.moveTo(100, 600);
    ctx.quadraticCurveTo(150, 550, 200, 600);
    ctx.closePath();
    ctx.fill();
    // Island 2
    ctx.beginPath();
    ctx.moveTo(800, 600);
    ctx.quadraticCurveTo(850, 570, 900, 600);
    ctx.closePath();
    ctx.fill();
    // Island 3 (small)
    ctx.beginPath();
    ctx.moveTo(500, 600);
    ctx.quadraticCurveTo(520, 580, 540, 600);
    ctx.closePath();
    ctx.fill();
    
    // Sailboat in background
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(300, 580, 40, 20); // Boat hull
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(320, 580);
    ctx.lineTo(320, 520);
    ctx.lineTo(340, 540);
    ctx.closePath();
    ctx.fill(); // Sail
    
    // Waves
    ctx.strokeStyle = '#3A7BC8';
    ctx.lineWidth = 2;
    for(let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 120, 600 + Math.sin(Date.now() / 500 + i) * 5);
        ctx.quadraticCurveTo(i * 120 + 60, 600 + Math.sin(Date.now() / 500 + i) * 8, i * 120 + 120, 600 + Math.sin(Date.now() / 500 + i) * 5);
        ctx.stroke();
    }
    
    // Seagulls
    drawSeagull(200 + Math.sin(Date.now() / 2000) * 30, 150);
    drawSeagull(600 + Math.sin(Date.now() / 1800 + 1) * 40, 180);
    drawSeagull(900 + Math.sin(Date.now() / 2200 + 2) * 35, 160);
    
    // Sun
    if (theme.sunny) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(1000, 100, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(1000, 100, 50, 0, Math.PI * 2);
        ctx.fill();
    }

    // Horizon haze (depth)
    const haze = ctx.createLinearGradient(0, 520, 0, 660);
    haze.addColorStop(0, 'rgba(255,255,255,0.45)');
    haze.addColorStop(0.35, 'rgba(255,255,255,0.12)');
    haze.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 520, canvas.width, 180);

    // Sun glint on water (specular streaks)
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    const t = Date.now();
    for (let i = 0; i < 16; i++) {
        const y = 615 + i * 10;
        const w = 260 - i * 12;
        const cx = 1000 + Math.sin(t / 900 + i) * 20;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, y);
        ctx.quadraticCurveTo(cx, y + 3, cx + w / 2, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Sailboat wake
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
        const wx = 300 - 10 - i * 14;
        const wy = 595 + i * 4;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx - 18, wy + 8);
        ctx.stroke();
    }
}

function drawSeagull(x, y) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Left wing
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 20, y - 5);
    ctx.lineTo(x - 15, y);
    // Body
    ctx.moveTo(x, y);
    // Right wing
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 20, y - 5);
    ctx.lineTo(x + 15, y);
    ctx.stroke();
}

function drawFjordBackground(theme) {
    // Much steeper, pointier mountains with snow extending further down
    const mGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    mGrad.addColorStop(0, '#FFFFFF');
    mGrad.addColorStop(0.55, '#EDF4FF');
    mGrad.addColorStop(1, '#C9D7E8');

    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, 140);
    ctx.lineTo(120, 30);
    ctx.lineTo(230, 120);
    ctx.lineTo(320, 20);
    ctx.lineTo(440, 160);
    ctx.lineTo(560, 10);
    ctx.lineTo(680, 170);
    ctx.lineTo(790, 25);
    ctx.lineTo(930, 150);
    ctx.lineTo(1040, 40);
    ctx.lineTo(1200, 130);
    ctx.lineTo(1200, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Mountain shadow layer to keep depth (but still snowy)
    ctx.fillStyle = 'rgba(70, 90, 120, 0.18)';
    ctx.beginPath();
    ctx.moveTo(1200, canvas.height);
    ctx.lineTo(1200, 130);
    ctx.lineTo(1040, 40);
    ctx.lineTo(930, 150);
    ctx.lineTo(980, 320);
    ctx.lineTo(1120, 420);
    ctx.lineTo(1200, 520);
    ctx.closePath();
    ctx.fill();

    // Fjord water as a fjord-shaped inlet (no big rectangle)
    const fjordTop = 520;
    const waterGradient = ctx.createLinearGradient(0, fjordTop, 0, canvas.height);
    theme.water.forEach((c, i) => waterGradient.addColorStop(i / (theme.water.length - 1), c));

    ctx.fillStyle = waterGradient;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, fjordTop + 40);
    ctx.bezierCurveTo(160, fjordTop - 30, 320, fjordTop + 120, 520, fjordTop + 10);
    ctx.bezierCurveTo(680, fjordTop - 70, 820, fjordTop + 90, 980, fjordTop + 20);
    ctx.bezierCurveTo(1060, fjordTop - 10, 1140, fjordTop + 60, 1200, fjordTop + 10);
    ctx.lineTo(1200, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Light reflections on fjord (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
        const y = fjordTop + 80 + i * 20;
        ctx.beginPath();
        ctx.moveTo(80 + i * 30, y);
        ctx.quadraticCurveTo(240 + i * 35, y + 6, 420 + i * 40, y);
        ctx.stroke();
    }

    // Mist layer over the fjord
    const mist = ctx.createLinearGradient(0, fjordTop - 20, 0, fjordTop + 180);
    mist.addColorStop(0, 'rgba(255,255,255,0.18)');
    mist.addColorStop(0.5, 'rgba(255,255,255,0.10)');
    mist.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, fjordTop - 20, canvas.width, 220);

    // Snow streaks down slopes (steepness cue)
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 2;
    const tt = Date.now();
    for (let i = 0; i < 55; i++) {
        const x = (i * 23) % canvas.width;
        const y = 120 + (i % 10) * 22;
        const drift = Math.sin(tt / 1200 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 22 + drift, y + 55);
        ctx.stroke();
    }
    
    // More pine trees
    if (theme.pine) {
        // Dense line of pines at the fjord edge
        const treeLineY = fjordTop - 60;
        for (let i = 0; i < 18; i++) {
            const x = 40 + i * 70;
            const size = 22 + (i % 5) * 6;
            drawPineTree(x, treeLineY + (i % 3) * 10, size);
        }
        // Some foreground trees for depth
        drawPineTree(120, fjordTop + 40, 48);
        drawPineTree(320, fjordTop + 55, 56);
        drawPineTree(980, fjordTop + 45, 52);
        drawPineTree(1120, fjordTop + 60, 58);
    }
}

function drawPineTree(x, y, size) {
    // Better-looking pine: trunk + three layered triangles + a bit of snow
    const trunkW = Math.max(4, Math.floor(size * 0.18));
    const trunkH = Math.floor(size * 0.35);

    // Trunk
    ctx.fillStyle = '#5A3A1A';
    ctx.fillRect(x - trunkW / 2, y + size * 1.55, trunkW, trunkH);

    // Needles
    ctx.fillStyle = '#1F4B1A';
    const layer = (topY, w, h) => {
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x - w, topY + h);
        ctx.lineTo(x + w, topY + h);
        ctx.closePath();
        ctx.fill();
    };

    layer(y - size * 0.9, size * 0.55, size * 0.75);
    layer(y - size * 0.35, size * 0.75, size * 0.9);
    layer(y + size * 0.25, size * 0.95, size * 1.0);

    // Snow caps (small strokes on each layer)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.18, y - size * 0.85);
    ctx.lineTo(x + size * 0.22, y - size * 0.85);
    ctx.lineTo(x + size * 0.05, y - size * 0.72);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - size * 0.28, y - size * 0.28);
    ctx.lineTo(x + size * 0.32, y - size * 0.28);
    ctx.lineTo(x + size * 0.08, y - size * 0.12);
    ctx.closePath();
    ctx.fill();
}

function drawUnderwaterBackground(theme) {
    // Water line at top (surface)
    const surfaceY = 100;
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, surfaceY);
    
    // Water gradient below surface
    const waterGradient = ctx.createLinearGradient(0, surfaceY, 0, canvas.height);
    theme.water.forEach((c, i) => waterGradient.addColorStop(i / (theme.water.length - 1), c));
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, surfaceY, canvas.width, canvas.height - surfaceY);
    
    // Water surface line with slight waves
    ctx.strokeStyle = '#5BA3F5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    for(let x = 0; x < canvas.width; x += 20) {
        const waveY = surfaceY + Math.sin((Date.now() / 300) + x / 50) * 3;
        ctx.lineTo(x, waveY);
    }
    ctx.stroke();

    // Light rays from the surface
    const t = Date.now();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 7; i++) {
        const x = 80 + i * 170 + Math.sin(t / 1300 + i) * 30;
        ctx.beginPath();
        ctx.moveTo(x, surfaceY);
        ctx.lineTo(x + 80, canvas.height);
        ctx.lineTo(x - 40, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Caustics (moving bands)
    ctx.globalAlpha = 0.10;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3;
    for (let y = surfaceY + 80; y < canvas.height - 120; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= canvas.width; x += 80) {
            ctx.lineTo(x, y + Math.sin(t / 850 + x / 130 + y / 200) * 10);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Sea bottom
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, canvas.height - 50);
    ctx.quadraticCurveTo(300, canvas.height - 80, 600, canvas.height - 60);
    ctx.quadraticCurveTo(900, canvas.height - 70, 1200, canvas.height - 55);
    ctx.lineTo(1200, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Distant rock silhouettes / kelp (depth)
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 140);
    ctx.quadraticCurveTo(220, canvas.height - 180, 420, canvas.height - 150);
    ctx.quadraticCurveTo(680, canvas.height - 120, 920, canvas.height - 170);
    ctx.quadraticCurveTo(1100, canvas.height - 210, 1200, canvas.height - 160);
    ctx.lineTo(1200, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Seaweed
    ctx.strokeStyle = '#2D5016';
    ctx.lineWidth = 3;
    for(let i = 0; i < 8; i++) {
        const x = 100 + i * 150;
        const baseY = canvas.height - 30;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.quadraticCurveTo(x + 10, baseY - 30, x, baseY - 60);
        ctx.stroke();
    }
    
    // Bubble columns from the seabed (a few fixed vents)
    const vents = [160, 520, 860, 1120];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let v = 0; v < vents.length; v++) {
        const baseX = vents[v];
        for (let i = 0; i < 10; i++) {
            const phase = (t / 3 + i * 42 + v * 100) % (canvas.height - surfaceY);
            const y = canvas.height - 40 - phase;
            const x = baseX + Math.sin((t / 700) + i) * 10;
            const r = 2 + (i % 4);
            if (y > surfaceY + 10) {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Bubbles rising from bottom (ambient)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for(let i = 0; i < 25; i++) {
        const x = (Date.now() / 10 + i * 50) % canvas.width;
        const y = canvas.height - (Date.now() / 3 + i * 30) % (canvas.height - surfaceY);
        if (y > surfaceY) {
            const size = 3 + Math.sin(Date.now() / 200 + i) * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Fish
    if (theme.fish) {
        drawFish(200 + Math.sin(Date.now() / 1000) * 50, 250, true);
        drawFish(600 + Math.sin(Date.now() / 800 + 1) * 40, 350, false);
        drawFish(900 + Math.sin(Date.now() / 1200 + 2) * 60, 280, true);
        drawFish(400 + Math.sin(Date.now() / 900 + 3) * 45, 450, false);
    }
}

function drawFish(x, y, facingRight) {
    ctx.fillStyle = '#FF6B6B';
    ctx.save();
    ctx.translate(x, y);
    if (!facingRight) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF8E8E';
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-25, -5);
    ctx.lineTo(-25, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawForestBackground(theme) {
    // Deep forest: layered pine silhouettes (static) + fog
    const drawPineSilhouette = (x, baseY, h, color) => {
        const w = h * 0.45;
        ctx.fillStyle = color;
        // trunk
        ctx.fillRect(x - w * 0.08, baseY - h * 0.15, w * 0.16, h * 0.18);
        // foliage layers
        ctx.beginPath();
        ctx.moveTo(x, baseY - h);
        ctx.lineTo(x - w * 0.55, baseY - h * 0.55);
        ctx.lineTo(x + w * 0.55, baseY - h * 0.55);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, baseY - h * 0.75);
        ctx.lineTo(x - w * 0.75, baseY - h * 0.25);
        ctx.lineTo(x + w * 0.75, baseY - h * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, baseY - h * 0.45);
        ctx.lineTo(x - w * 0.95, baseY);
        ctx.lineTo(x + w * 0.95, baseY);
        ctx.closePath();
        ctx.fill();
    };

    const baseY = canvas.height - 40;
    // Far layer
    for (let i = 0; i < 28; i++) {
        const x = (i * 50) % canvas.width;
        const h = 140 + (i % 7) * 12;
        drawPineSilhouette(x, baseY - 180, h, '#0F2A17');
    }
    // Mid layer
    for (let i = 0; i < 24; i++) {
        const x = (i * 60 + 25) % canvas.width;
        const h = 190 + (i % 6) * 18;
        drawPineSilhouette(x, baseY - 100, h, '#14331D');
    }
    // Near layer
    for (let i = 0; i < 22; i++) {
        const x = (i * 70 + 10) % canvas.width;
        const h = 240 + (i % 5) * 22;
        drawPineSilhouette(x, baseY, h, '#1B3A1B');
    }

    // Low fog (adds depth + stormy mood)
    const fog = ctx.createLinearGradient(0, canvas.height - 260, 0, canvas.height);
    fog.addColorStop(0, 'rgba(255,255,255,0)');
    fog.addColorStop(1, 'rgba(180, 200, 220, 0.10)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, canvas.height - 260, canvas.width, 260);
    
    // Rain - less “weird”: thin, mostly vertical streaks with slight drift
    if (theme.rain) {
        ctx.strokeStyle = 'rgba(185, 215, 235, 0.45)';
        ctx.lineWidth = 1.4;
        const t = Date.now() * 0.9;
        for (let i = 0; i < 140; i++) {
            const x = (i * 37 + (t * 0.22)) % (canvas.width + 40) - 20;
            const y = (i * 83 + (t * 0.85)) % (canvas.height + 120) - 60;
            const len = 18 + (i % 6) * 6;
            const drift = 4 + (i % 3); // slight diagonal
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + drift, y + len);
            ctx.stroke();
        }
    }

    // Lightning flashes (rare)
    const now = Date.now();
    if (now > fxState.nextLightningAt) {
        fxState.lightningUntil = now + 160;
        fxState.nextLightningAt = now + 5000 + Math.random() * 8000;
    }
    if (now < fxState.lightningUntil) {
        const p = 1 - (fxState.lightningUntil - now) / 160;
        const a = 0.35 * (1 - p);
        ctx.fillStyle = `rgba(230, 245, 255, ${a})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simple bolt
        ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - p)})`;
        ctx.lineWidth = 4;
        const bx = 820;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx - 40, 180);
        ctx.lineTo(bx + 20, 210);
        ctx.lineTo(bx - 60, 360);
        ctx.stroke();
    }
    
    // Cabin at bottom
    const cabinX = 50;
    const cabinY = canvas.height - 120;
    const cabinW = 100;
    const cabinH = 80;
    
    // Cabin base
    ctx.fillStyle = '#654321';
    ctx.fillRect(cabinX, cabinY, cabinW, cabinH);
    
    // Roof
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(cabinX - 5, cabinY);
    ctx.lineTo(cabinX + cabinW/2, cabinY - 25);
    ctx.lineTo(cabinX + cabinW + 5, cabinY);
    ctx.closePath();
    ctx.fill();
    
    // Rain on roof
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
    ctx.fillRect(cabinX - 5, cabinY, cabinW + 10, 3);
    
    // Door
    ctx.fillStyle = '#4A2C17';
    ctx.fillRect(cabinX + 30, cabinY + 40, 30, 40);
    
    // Windows with warm light
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(cabinX + 10, cabinY + 20, 25, 25);
    ctx.fillRect(cabinX + 65, cabinY + 20, 25, 25);
    
    // Window frames
    ctx.strokeStyle = '#4A2C17';
    ctx.lineWidth = 2;
    ctx.strokeRect(cabinX + 10, cabinY + 20, 25, 25);
    ctx.strokeRect(cabinX + 65, cabinY + 20, 25, 25);
}

function drawChristmasBackground(theme) {
    // Big moon glow
    const moonX = 980, moonY = 140;
    ctx.fillStyle = 'rgba(255, 240, 210, 0.10)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF1D6';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 55, 0, Math.PI * 2);
    ctx.fill();

    // Northern lights / aurora bands
    for (let i = 0; i < 3; i++) {
        const y = 180 + i * 40;
        const aur = ctx.createLinearGradient(0, y, canvas.width, y);
        aur.addColorStop(0, 'rgba(0,255,200,0)');
        aur.addColorStop(0.25, `rgba(0,255,200,${0.10 + i * 0.03})`);
        aur.addColorStop(0.55, `rgba(120,255,120,${0.10 + i * 0.03})`);
        aur.addColorStop(0.8, `rgba(255,0,180,${0.06 + i * 0.02})`);
        aur.addColorStop(1, 'rgba(255,0,180,0)');
        ctx.fillStyle = aur;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= canvas.width; x += 80) {
            ctx.lineTo(x, y + Math.sin((Date.now() / 900) + x / 180 + i) * 18);
        }
        ctx.lineTo(canvas.width, y + 120);
        ctx.lineTo(0, y + 120);
        ctx.closePath();
        ctx.fill();
    }

    // More stars twinkling
    ctx.fillStyle = '#FFD700';
    for(let i = 0; i < 65; i++) {
        const x = (i * 19) % canvas.width;
        const y = (i * 13) % 320;
        const twinkle = 0.55 + Math.sin(Date.now() / 450 + i) * 0.35;
        ctx.globalAlpha = twinkle;
        drawStar(x, y, 2.2 + Math.sin(Date.now() / 320 + i) * 1.2);
        ctx.globalAlpha = 1;
    }

    // Garland + bulbs across top (more festive)
    const lightColors = ['#FF3B30', '#34C759', '#FFD60A', '#AF52DE', '#5AC8FA'];
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 90);
    for(let i = 0; i < 16; i++) {
        const x = i * 80;
        const y = 90 + Math.sin(i * 0.55) * 18;
        ctx.lineTo(x, y);

        // Bulbs
        const colorIndex = Math.floor(Date.now() / 220 + i) % lightColors.length;
        ctx.fillStyle = lightColors[colorIndex];
        ctx.shadowBlur = 14;
        ctx.shadowColor = lightColors[colorIndex];
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.stroke();

    // Snowflakes falling (denser)
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    for(let i = 0; i < 70; i++) {
        const x = (Date.now() / 6 + i * 27) % canvas.width;
        const y = (Date.now() / 3 + i * 19) % canvas.height;
        const r = 1.5 + (i % 3) * 0.8;
        ctx.beginPath();
        ctx.arc(x + Math.sin(Date.now() / 600 + i) * 8, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cozy village silhouette with warm windows
    ctx.fillStyle = '#0B1020';
    ctx.fillRect(0, canvas.height - 130, canvas.width, 130);
    ctx.fillStyle = '#121B33';
    const t = Date.now();
    for (let i = 0; i < 10; i++) {
        const x = 60 + i * 110;
        const w = 70 + (i % 3) * 20;
        const h = 70 + (i % 4) * 15;
        ctx.fillRect(x, canvas.height - 130 - h, w, h);
        // roof
        ctx.beginPath();
        ctx.moveTo(x - 6, canvas.height - 130 - h);
        ctx.lineTo(x + w/2, canvas.height - 130 - h - 24);
        ctx.lineTo(x + w + 6, canvas.height - 130 - h);
        ctx.closePath();
        ctx.fill();
        // windows
        ctx.fillStyle = 'rgba(255, 210, 120, 0.9)';
        const wy = canvas.height - 130 - h + 20;
        for (let wx = 0; wx < 2; wx++) {
            const wxp = x + 12 + wx * 28;
            ctx.fillRect(wxp, wy, 16, 18);
            // Window bloom
            drawSoftGlow(wxp + 8, wy + 9, 26, 'rgba(255, 200, 120, 0.55)', 0.9);
        }
        ctx.fillStyle = '#121B33';
    }

    // Extra lower string lights (market feel)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 260);
    for (let i = 0; i < 16; i++) {
        const x = i * 80;
        const y = 260 + Math.sin(i * 0.7) * 12;
        ctx.lineTo(x, y);
        const colorIndex = Math.floor(t / 200 + i * 2) % lightColors.length;
        ctx.fillStyle = lightColors[colorIndex];
        ctx.shadowBlur = 10;
        ctx.shadowColor = lightColors[colorIndex];
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.stroke();

    // Chimney smoke from a few houses
    for (let i = 0; i < 3; i++) {
        const hx = 140 + i * 330;
        const hy = canvas.height - 260;
        for (let p = 0; p < 6; p++) {
            const phase = (t / 28 + p * 26 + i * 80);
            const sx = hx + Math.sin(phase / 16) * (6 + p);
            const sy = hy - (phase % 160) * 0.55;
            const r = 7 + (p % 3) * 2;
            ctx.fillStyle = `rgba(255,255,255,${0.16 - p * 0.02})`;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Candy canes in the snow (foreground accents)
    const candyCane = (x, y, s) => {
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - s);
        ctx.arc(x + s * 0.25, y - s, s * 0.25, Math.PI, 0);
        ctx.stroke();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FF3B30';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x - 6, y - i * (s / 6));
            ctx.lineTo(x + 6, y - i * (s / 6) - 10);
            ctx.stroke();
        }
    };
    candyCane(120, canvas.height - 40, 60);
    candyCane(1040, canvas.height - 45, 55);

    // Christmas trees in background (keep)
    drawChristmasTree(220, 430, 70);
    drawChristmasTree(620, 470, 60);
    drawChristmasTree(980, 450, 65);

    // Sparkles on snow (tiny twinkles)
    for (let i = 0; i < 30; i++) {
        const x = (i * 43) % canvas.width;
        const y = canvas.height - 28 - (i % 6) * 6;
        const tw = 0.4 + Math.sin(t / 350 + i) * 0.4;
        ctx.globalAlpha = clamp01(tw);
        ctx.fillStyle = '#FFFFFF';
        drawStar(x, y, 2.2);
        ctx.globalAlpha = 1;
    }

    // Snow-covered ground
    ctx.fillStyle = '#F3F7FF';
    ctx.fillRect(0, canvas.height - 25, canvas.width, 25);
}

function drawChristmasTree(x, y, size) {
    // Tree trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - 5, y, 10, size);
    
    // Tree layers
    ctx.fillStyle = '#2D5016';
    // Bottom layer
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * 0.8, y - size * 0.3);
    ctx.lineTo(x + size * 0.8, y - size * 0.3);
    ctx.closePath();
    ctx.fill();
    // Middle layer
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.3);
    ctx.lineTo(x - size * 0.6, y - size * 0.6);
    ctx.lineTo(x + size * 0.6, y - size * 0.6);
    ctx.closePath();
    ctx.fill();
    // Top layer
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.6);
    ctx.lineTo(x - size * 0.4, y - size * 0.9);
    ctx.lineTo(x + size * 0.4, y - size * 0.9);
    ctx.closePath();
    ctx.fill();
    
    // Star on top
    ctx.fillStyle = '#FFD700';
    drawStar(x, y - size * 0.9, 5);
    
    // Ornaments
    const ornamentColors = ['#FF0000', '#FFD700', '#00FF00', '#FF00FF'];
    for(let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const layer = Math.floor(i / 2);
        const layerY = y - size * (0.2 + layer * 0.3);
        const layerSize = size * (0.8 - layer * 0.2);
        const ornamentX = x + Math.cos(angle) * layerSize * 0.5;
        const ornamentY = layerY + Math.sin(angle) * 10;
        ctx.fillStyle = ornamentColors[i % ornamentColors.length];
        ctx.beginPath();
        ctx.arc(ornamentX, ornamentY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Ornament sparkle (twinkle)
        const t = Date.now();
        const tw = 0.25 + Math.sin(t / 280 + i + x * 0.01) * 0.25;
        ctx.globalAlpha = clamp01(tw);
        ctx.fillStyle = '#FFFFFF';
        drawStar(ornamentX + 8, ornamentY - 6, 2);
        ctx.globalAlpha = 1;
    }
}

function drawStar(x, y, size) {
    ctx.beginPath();
    for(let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
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

    // Draw themed background
    drawBackground(level);

    // Platforms with theme-specific colors
    platforms.forEach(p => {
        // Base platform color based on theme
        let platformColor = level.theme.platform;
        let topColor = null;
        let topHeight = 10;
        
        switch(level.theme.type) {
            case 'mountain':
                platformColor = '#8B7355'; // Rocky brown
                topColor = '#FFFFFF'; // Snow
                break;
            case 'coast':
                platformColor = '#D4A574'; // Sandy beige
                topColor = '#F5DEB3'; // Light sand
                topHeight = 8;
                break;
            case 'fjord':
                platformColor = '#708090'; // Stone gray
                topColor = '#FFFFFF'; // Snow
                break;
            case 'underwater':
                platformColor = '#8B4513'; // Brown wood/rock
                topColor = '#654321'; // Darker brown
                topHeight = 5;
                break;
            case 'forest':
                platformColor = '#654321'; // Dark brown wood
                topColor = '#8B7355'; // Lighter brown
                topHeight = 5;
                break;
            case 'christmas':
                platformColor = '#8B4513'; // Brown wood
                topColor = '#FFFFFF'; // Snow
                break;
        }
        
        ctx.fillStyle = platformColor;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        
        // Top layer
        if (topColor) {
            ctx.fillStyle = topColor;
            ctx.fillRect(p.x, p.y, p.width, topHeight);
        }
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
    {
        const rw = player.width * SPRITE_SCALE;
        const rh = player.height * SPRITE_SCALE;
        const rx = player.x - (rw - player.width) / 2; // center horizontally on hitbox
        const ry = player.y + player.height - rh;       // keep feet aligned to hitbox bottom
        ctx.drawImage(playerImg, rx, ry, rw, rh);
    }

    // Shield aura
    if (player.shieldTimer > 0) {
        const pulse = 0.5 + Math.sin(Date.now() / 120) * 0.15;
        ctx.strokeStyle = `rgba(255, 77, 210, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y + player.height/2, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Partner
    if (partner.active && partner.level === gameState.currentLevel) {
        ctx.globalAlpha = 0.6;
        const partnerImg = partner.name === 'Vilde' ? assets.vilde : assets.nora;
        {
            const rw = partner.width * SPRITE_SCALE;
            const rh = partner.height * SPRITE_SCALE;
            const rx = partner.x - (rw - partner.width) / 2;
            const ry = partner.y + partner.height - rh;
            ctx.drawImage(partnerImg, rx, ry, rw, rh);
        }
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
    } else if (c.type === 'heart') {
        ctx.fillStyle = '#ff4dd2';
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
    if (levelId >= 6) {
        // Last level - show ending screen
        showEndingScreen();
    } else {
        // Show Score Screen
        document.getElementById('messageScreen').classList.remove('hidden');
        document.getElementById('messageTitle').textContent = "LEVEL COMPLETE!";
        document.getElementById('messageSubtitle').textContent = "Great Teamwork!";
        document.getElementById('btnNextLevel').textContent = "Next Level";
        document.getElementById('btnNextLevel').onclick = () => {
            socket.emit('requestNextLevel', levelId);
        };
    }
});

socket.on('startNextLevel', (nextId) => {
    if (nextId > 6) {
        showEndingScreen();
    } else {
        loadLevel(nextId);
    }
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

function showCutScreen(levelData) {
    gameState.showingCutScreen = true;
    const cutScreen = document.getElementById('cutScreen');
    const titleEl = document.getElementById('cutScreenTitle');
    const textEl = document.getElementById('cutScreenText');
    
    titleEl.textContent = levelData.cutScreen.title;
    textEl.innerHTML = levelData.cutScreen.text.replace(/\n/g, '<br>');
    
    cutScreen.classList.remove('hidden');
    
    // Setup button
    const btnStart = document.getElementById('btnStartLevel');
    btnStart.onclick = () => {
        cutScreen.classList.add('hidden');
        gameState.showingCutScreen = false;
        gameState.running = true;
    };
}

function showEndingScreen() {
    gameState.showingEnding = true;
    gameState.running = false;
    const endingScreen = document.getElementById('endingScreen');
    endingScreen.classList.remove('hidden');
}

function loadLevel(id) {
    if(id > 6) {
        // Show ending screen
        showEndingScreen();
        return;
    }
    
    gameState.currentLevel = id;
    gameState.progress = 0;
    gameState.isDead = false;
    document.getElementById('messageScreen').classList.add('hidden');
    
    const data = levelsData[id-1];
    
    // Show cut screen before loading level
    showCutScreen(data);
    
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
    monsters = data.monsters.map(m => new Monster(m.x, m.y, m.range, m.name, m.maxHealth, m.speed));
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
    if(gameState.running && !gameState.showingCutScreen && !gameState.showingEnding) {
        updatePhysics();
        updateParticles();
        draw();
    } else if (gameState.showingEnding) {
        // Draw ending screen background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Stars
        ctx.fillStyle = '#FFD700';
        for(let i = 0; i < 50; i++) {
            const x = (i * 24) % canvas.width;
            const y = (i * 16) % canvas.height;
            drawStar(x, y, 2);
        }
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
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');
    loadLevel(1);
    gameLoop();
});
