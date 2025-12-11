const socket = io();

// Assets
const assets = {
    vilde: new Image(),
    nora: new Image(),
    troll: new Image(),
    door: new Image()
};
assets.vilde.src = 'assets/vilde.svg';
assets.nora.src = 'assets/nora.svg';
assets.troll.src = 'assets/troll.svg';
assets.door.src = 'assets/door.svg';

// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game Configuration
const gameConfig = {
    gravity: 0.6,
    terminalVelocity: 15,
    friction: 0.8,
    baseSpeed: 6,
    baseJump: 18
};

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

// --- Classes ---
class Monster {
    constructor(x, y, range) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.startX = x;
        this.range = range;
        this.speed = 2;
        this.direction = 1;
        this.name = Math.random() > 0.5 ? 'Vebjørn' : 'Vetle';
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x > this.startX + this.range || this.x < this.startX) {
            this.direction *= -1;
        }
    }

    draw(ctx) {
        ctx.drawImage(assets.troll, this.x, this.y, this.width, this.height);
        // Name tag
        ctx.fillStyle = '#ff0000';
        ctx.font = '10px Courier New';
        ctx.fillText(this.name, this.x, this.y - 5);
    }
}

// --- Level Design ---
const ground = { x: 0, y: 550, width: 800, height: 50, color: '#fff', type: 'snow_ground' };

// We'll define just the first 2 levels detailed for now, keeping the others simple
const levelsData = [
    {
        id: 1,
        title: "Troll Bridge (Tutorial)",
        theme: { sky: ['#0d1b2a', '#1b263b'], mountain: '#778da9', platform: '#e0e1dd' },
        platforms: [
            ground,
            { x: 200, y: 450, w: 400, h: 40 },
            { x: 100, y: 300, w: 150, h: 40 },
            { x: 550, y: 300, w: 150, h: 40 }
        ],
        collectibles: [
            { x: 300, y: 400, type: 'snowflake', requiredPlayer: 'Vilde' }, // Speed
            { x: 500, y: 400, type: 'star', requiredPlayer: 'Nora' },       // Jump
            { x: 150, y: 250, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 600, y: 250, type: 'coin', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 350, y: 410, range: 100 }
        ],
        door: { x: 700, y: 460 }
    },
    {
        id: 2,
        title: "Icy Peaks",
        theme: { sky: ['#caf0f8', '#0077b6'], mountain: '#0077b6', platform: '#e0fbfc' },
        platforms: [
            ground,
            { x: 100, y: 450, w: 100, h: 30 },
            { x: 600, y: 450, w: 100, h: 30 },
            { x: 350, y: 350, w: 100, h: 30 },
            { x: 150, y: 250, w: 100, h: 30 },
            { x: 550, y: 250, w: 100, h: 30 },
            { x: 350, y: 150, w: 100, h: 30 }
        ],
        collectibles: [
            { x: 120, y: 400, type: 'coin', requiredPlayer: 'Nora' },
            { x: 620, y: 400, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 370, y: 300, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 170, y: 200, type: 'star', requiredPlayer: 'Vilde' },
            { x: 570, y: 200, type: 'coin', requiredPlayer: 'Nora' },
            { x: 370, y: 100, type: 'coin', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 200, y: 510, range: 400 } // Ground patroller
        ],
        door: { x: 370, y: 70 } // Very top
    },
    {
        id: 3,
        title: "Split Paths",
        theme: { sky: ['#000000', '#2a9d8f'], mountain: '#264653', platform: '#2a9d8f' },
        platforms: [
            ground,
            // Left Tower
            { x: 50, y: 400, w: 100, h: 30 },
            { x: 50, y: 250, w: 100, h: 30 },
            { x: 50, y: 100, w: 200, h: 30 },
            // Right Tower
            { x: 650, y: 400, w: 100, h: 30 },
            { x: 650, y: 250, w: 100, h: 30 },
            { x: 550, y: 100, w: 200, h: 30 }
        ],
        collectibles: [
            // Left side for Vilde
            { x: 70, y: 350, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 70, y: 200, type: 'star', requiredPlayer: 'Vilde' },
            // Right side for Nora
            { x: 670, y: 350, type: 'coin', requiredPlayer: 'Nora' },
            { x: 670, y: 200, type: 'star', requiredPlayer: 'Nora' },
            // Top shared
            { x: 400, y: 50, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 450, y: 50, type: 'snowflake', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 300, y: 510, range: 200 },
            { x: 60, y: 60, range: 100 }, // On top left
            { x: 600, y: 60, range: 100 } // On top right
        ],
        door: { x: 370, y: 460 } // Middle ground (must climb down or fall safely)
    },
    {
        id: 4,
        title: "Monster Mash",
        theme: { sky: ['#590d22', '#ff4d6d'], mountain: '#800f2f', platform: '#a4133c' },
        platforms: [
            ground,
            { x: 0, y: 400, w: 800, h: 30 }, // Second floor
            { x: 100, y: 250, w: 600, h: 30 }, // Third floor
            { x: 350, y: 150, w: 100, h: 30 }  // Top perch
        ],
        collectibles: [
            { x: 50, y: 350, type: 'coin', requiredPlayer: 'Nora' },
            { x: 750, y: 350, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 150, y: 200, type: 'star', requiredPlayer: 'Nora' },
            { x: 650, y: 200, type: 'star', requiredPlayer: 'Vilde' },
            { x: 400, y: 100, type: 'coin', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 100, y: 510, range: 600 }, // Ground
            { x: 50, y: 360, range: 700 }, // Second floor
            { x: 150, y: 210, range: 500 } // Third floor
        ],
        door: { x: 370, y: 70 } // Very top
    },
    {
        id: 5,
        title: "Leap of Faith",
        theme: { sky: ['#e9c46a', '#f4a261'], mountain: '#e76f51', platform: '#264653' },
        platforms: [
            ground,
            { x: 0, y: 450, w: 100, h: 30 },
            { x: 200, y: 450, w: 50, h: 30 }, // Small
            { x: 350, y: 400, w: 50, h: 30 }, // Small
            { x: 500, y: 350, w: 50, h: 30 }, // Small
            { x: 650, y: 300, w: 50, h: 30 }, // Small
            { x: 400, y: 200, w: 200, h: 30 } // Top
        ],
        collectibles: [
            { x: 215, y: 400, type: 'star', requiredPlayer: 'Vilde' },
            { x: 365, y: 350, type: 'coin', requiredPlayer: 'Nora' },
            { x: 515, y: 300, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 665, y: 250, type: 'coin', requiredPlayer: 'Nora' },
            { x: 450, y: 150, type: 'snowflake', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 400, y: 160, range: 150 } // Guarding the door
        ],
        door: { x: 500, y: 120 }
    },
    {
        id: 6,
        title: "Troll Cave",
        theme: { sky: ['#000000', '#14213d'], mountain: '#000000', platform: '#3d405b' },
        platforms: [
            ground,
            { x: 0, y: 100, w: 800, h: 50 }, // Ceiling
            { x: 100, y: 450, w: 200, h: 30 },
            { x: 500, y: 450, w: 200, h: 30 },
            { x: 300, y: 300, w: 200, h: 30 },
            { x: 100, y: 200, w: 50, h: 30 },
            { x: 650, y: 200, w: 50, h: 30 }
        ],
        collectibles: [
            { x: 150, y: 400, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 600, y: 400, type: 'coin', requiredPlayer: 'Nora' },
            { x: 400, y: 250, type: 'star', requiredPlayer: 'Vilde' },
            { x: 115, y: 150, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 665, y: 150, type: 'coin', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 300, y: 510, range: 200 },
            { x: 100, y: 410, range: 150 },
            { x: 500, y: 410, range: 150 },
            { x: 300, y: 260, range: 150 }
        ],
        door: { x: 370, y: 460 } // Bottom center, protected
    },
    {
        id: 7,
        title: "Speedway",
        theme: { sky: ['#00b4d8', '#90e0ef'], mountain: '#caf0f8', platform: '#0077b6' },
        platforms: [
            ground,
            { x: 0, y: 450, w: 300, h: 30 },
            { x: 400, y: 400, w: 400, h: 30 },
            { x: 0, y: 300, w: 300, h: 30 },
            { x: 400, y: 200, w: 400, h: 30 },
            { x: 0, y: 100, w: 200, h: 30 }
        ],
        collectibles: [
            { x: 50, y: 400, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 750, y: 350, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 50, y: 250, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 750, y: 150, type: 'star', requiredPlayer: 'Nora' },
            { x: 50, y: 50, type: 'coin', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 400, y: 360, range: 350 },
            { x: 0, y: 260, range: 250 },
            { x: 400, y: 160, range: 350 }
        ],
        door: { x: 50, y: 20 } // Top left
    },
    {
        id: 8,
        title: "The Vertical Limit",
        theme: { sky: ['#ffb703', '#fb8500'], mountain: '#023047', platform: '#8ecae6' },
        platforms: [
            ground,
            { x: 350, y: 450, w: 100, h: 20 },
            { x: 200, y: 350, w: 100, h: 20 },
            { x: 500, y: 350, w: 100, h: 20 },
            { x: 350, y: 250, w: 100, h: 20 },
            { x: 100, y: 150, w: 100, h: 20 },
            { x: 600, y: 150, w: 100, h: 20 },
            { x: 350, y: 50, w: 100, h: 20 }
        ],
        collectibles: [
            { x: 390, y: 400, type: 'coin', requiredPlayer: 'Nora' },
            { x: 240, y: 300, type: 'star', requiredPlayer: 'Vilde' },
            { x: 540, y: 300, type: 'star', requiredPlayer: 'Nora' },
            { x: 390, y: 200, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 140, y: 100, type: 'coin', requiredPlayer: 'Nora' },
            { x: 640, y: 100, type: 'coin', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 0, y: 510, range: 800 } // Floor is lava (monsters everywhere)
        ],
        door: { x: 370, y: -30 } // Top platform
    },
    {
        id: 9,
        title: "Silent Night (Hard)",
        theme: { sky: ['#000', '#111'], mountain: '#222', platform: '#333' },
        platforms: [
            ground,
            { x: 100, y: 500, w: 50, h: 50 }, // Pillars
            { x: 250, y: 400, w: 50, h: 50 },
            { x: 400, y: 300, w: 50, h: 50 },
            { x: 550, y: 200, w: 50, h: 50 },
            { x: 700, y: 100, w: 50, h: 50 }
        ],
        collectibles: [
            { x: 115, y: 450, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 265, y: 350, type: 'star', requiredPlayer: 'Nora' },
            { x: 415, y: 250, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 565, y: 150, type: 'star', requiredPlayer: 'Nora' },
            { x: 715, y: 50, type: 'coin', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 300, y: 510, range: 400 },
            { x: 250, y: 360, range: 0 }, // Static monster on block? No range 0
            { x: 400, y: 260, range: 0 }
        ],
        door: { x: 700, y: 20 }
    },
    {
        id: 10,
        title: "North Pole Summit",
        theme: { sky: ['#fff', '#d90429'], mountain: '#2c1810', platform: '#d90429' },
        platforms: [
            ground,
            { x: 0, y: 400, w: 200, h: 20 },
            { x: 600, y: 400, w: 200, h: 20 },
            { x: 300, y: 300, w: 200, h: 20 },
            { x: 100, y: 200, w: 100, h: 20 },
            { x: 600, y: 200, w: 100, h: 20 },
            { x: 300, y: 100, w: 200, h: 20 }
        ],
        collectibles: [
            { x: 50, y: 350, type: 'heart', requiredPlayer: 'Vilde' },
            { x: 750, y: 350, type: 'heart', requiredPlayer: 'Nora' },
            { x: 400, y: 250, type: 'star', requiredPlayer: 'Vilde' },
            { x: 150, y: 150, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 650, y: 150, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 400, y: 50, type: 'heart', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 0, y: 510, range: 800 }, // Chaos on floor
            { x: 300, y: 260, range: 150 }, // Middle guard
            { x: 300, y: 60, range: 150 } // Top guard
        ],
        door: { x: 370, y: 20 }
    }
];

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

    // Monsters -> Death
    for(let m of monsters) {
        m.update();
        if(checkCollision(player, m)) {
            die(`Eaten by ${m.name}!`);
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
    document.getElementById('levelDisplay').textContent = gameState.currentLevel;
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
    monsters = data.monsters.map(m => new Monster(m.x, m.y, m.range));
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

// Start
document.getElementById('btnVilde').onclick = () => socket.emit('selectCharacter', 'Vilde');
document.getElementById('btnNora').onclick = () => socket.emit('selectCharacter', 'Nora');

socket.on('selectionSuccess', (name) => {
    gameState.playerName = name;
    document.getElementById('playerNameDisplay').textContent = name;
    gameState.running = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');
    loadLevel(1);
    gameLoop();
});
