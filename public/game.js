const socket = io();

// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game Configuration & State
const gameConfig = {
    gravity: 0.6,
    terminalVelocity: 15,
    friction: 0.8
};

const gameState = {
    currentLevel: 1,
    totalLevels: 10,
    progress: 0,
    maxProgress: 0,
    running: false,
    playerName: '',
    isTransitioning: false
};

// Player Object (Local)
const player = {
    x: 50,
    y: 300,
    width: 32,
    height: 32,
    velocityX: 0,
    velocityY: 0,
    speed: 6,
    jumpPower: 18,
    onGround: false,
    color: '#c94a4a',
    accentColor: '#2c1810',
    facingRight: true
};

// Partner Object (Remote)
const partner = {
    active: false,
    name: '',
    x: 50,
    y: 300,
    width: 32,
    height: 32,
    color: '#4a8bc9', // Default blue, will update
    facingRight: true,
    level: 1
};

// Current Level Data
let platforms = [];
let collectibles = [];
let particles = [];
let snowflakes = [];

for(let i=0; i<100; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 1,
        sway: Math.random() * 0.5
    });
}

const ground = { x: 0, y: 550, width: 800, height: 50, color: '#fff', type: 'snow_ground' };

const levelsData = [
    {
        id: 1,
        title: "Snowy Departure",
        theme: { sky: ['#0d1b2a', '#1b263b', '#415a77'], mountain: '#778da9', platform: '#e0e1dd', accent: '#778da9' },
        collectibleType: 'snowflake',
        platforms: [
            ground,
            { x: 200, y: 450, w: 150, h: 40 },
            { x: 450, y: 350, w: 150, h: 40 },
            { x: 100, y: 250, w: 100, h: 40 },
            { x: 300, y: 150, w: 200, h: 40 },
            { x: 600, y: 250, w: 150, h: 40 }
        ],
        collectibles: [
            { x: 250, y: 400 }, { x: 500, y: 300 }, { x: 120, y: 200 }, { x: 350, y: 100 }, { x: 650, y: 200 }
        ]
    },
    {
        id: 2,
        title: "Frozen Lake",
        theme: { sky: ['#caf0f8', '#90e0ef', '#00b4d8'], mountain: '#0077b6', platform: '#e0fbfc', accent: '#98c1d9' },
        collectibleType: 'ice',
        platforms: [
            ground,
            { x: 50, y: 450, w: 100, h: 30 },
            { x: 250, y: 400, w: 100, h: 30 },
            { x: 450, y: 350, w: 100, h: 30 },
            { x: 650, y: 300, w: 100, h: 30 },
            { x: 350, y: 200, w: 100, h: 30 },
            { x: 150, y: 150, w: 100, h: 30 }
        ],
        collectibles: [
            { x: 70, y: 400 }, { x: 270, y: 350 }, { x: 470, y: 300 }, { x: 670, y: 250 }, { x: 370, y: 150 }, { x: 170, y: 100 }
        ]
    },
    {
        id: 3,
        title: "Pine Forest",
        theme: { sky: ['#004b23', '#006400', '#007200'], mountain: '#38b000', platform: '#2d6a4f', accent: '#1b4332' },
        collectibleType: 'ornament', 
        platforms: [
            ground,
            { x: 0, y: 400, w: 200, h: 40 },
            { x: 600, y: 400, w: 200, h: 40 },
            { x: 300, y: 300, w: 200, h: 40 },
            { x: 100, y: 200, w: 150, h: 40 },
            { x: 550, y: 200, w: 150, h: 40 },
            { x: 350, y: 100, w: 100, h: 40 }
        ],
        collectibles: [
            { x: 100, y: 350 }, { x: 700, y: 350 }, { x: 400, y: 250 }, { x: 175, y: 150 }, { x: 625, y: 150 }, { x: 400, y: 50 }
        ]
    },
    {
        id: 4,
        title: "Candy Cane Lane", 
        theme: { sky: ['#d90429', '#ef233c', '#edf2f4'], mountain: '#8d99ae', platform: '#ffffff', accent: '#d90429' },
        collectibleType: 'candy',
        platforms: [
            ground,
            { x: 100, y: 500, w: 50, h: 200 },
            { x: 300, y: 400, w: 50, h: 200 },
            { x: 500, y: 300, w: 50, h: 300 },
            { x: 700, y: 200, w: 50, h: 400 },
            { x: 200, y: 350, w: 80, h: 20 }
        ],
        collectibles: [
            { x: 115, y: 450 }, { x: 315, y: 350 }, { x: 515, y: 250 }, { x: 715, y: 150 }, { x: 240, y: 300 }
        ]
    },
    {
        id: 5,
        title: "Gingerbread Village", 
        theme: { sky: ['#432818', '#664229', '#99582a'], mountain: '#bb9457', platform: '#8B4513', accent: '#ffe6a7' },
        collectibleType: 'gingerbread', 
        platforms: [
            ground,
            { x: 0, y: 150, w: 100, h: 20 },
            { x: 150, y: 250, w: 100, h: 20 },
            { x: 300, y: 350, w: 100, h: 20 },
            { x: 450, y: 450, w: 100, h: 20 },
            { x: 600, y: 350, w: 100, h: 20 },
            { x: 700, y: 200, w: 100, h: 20 },
            { x: 350, y: 100, w: 50, h: 20 }
        ],
        collectibles: [
            { x: 20, y: 100 }, { x: 170, y: 200 }, { x: 320, y: 300 }, { x: 470, y: 400 }, { x: 620, y: 300 }, { x: 720, y: 150 }, { x: 360, y: 50 }
        ]
    },
    {
        id: 6,
        title: "Cozy Hearth",
        theme: { sky: ['#590d22', '#800f2f', '#a4133c'], mountain: '#3E2723', platform: '#5D4037', accent: '#D2691E' },
        collectibleType: 'stocking',
        platforms: [
            ground,
            { x: 50, y: 480, w: 80, h: 20 },
            { x: 150, y: 400, w: 80, h: 20 },
            { x: 250, y: 320, w: 80, h: 20 },
            { x: 400, y: 250, w: 300, h: 30 }, 
            { x: 750, y: 350, w: 50, h: 20 }
        ],
        collectibles: [
            { x: 80, y: 430 }, { x: 180, y: 350 }, { x: 280, y: 270 }, { x: 420, y: 200 }, { x: 500, y: 200 }, { x: 580, y: 200 }, { x: 660, y: 200 }
        ]
    },
    {
        id: 7,
        title: "Elf Workshop",
        theme: { sky: ['#2b9348', '#55a630', '#80b918'], mountain: '#004b23', platform: '#aacc00', accent: '#d90429' },
        collectibleType: 'gift',
        platforms: [
            ground,
            { x: 100, y: 500, w: 100, h: 20 },
            { x: 300, y: 500, w: 100, h: 20 },
            { x: 500, y: 500, w: 100, h: 20 },
            { x: 200, y: 350, w: 400, h: 20 },
            { x: 100, y: 200, w: 100, h: 20 },
            { x: 600, y: 200, w: 100, h: 20 },
            { x: 350, y: 100, w: 100, h: 20 }
        ],
        collectibles: [
            { x: 130, y: 450 }, { x: 330, y: 450 }, { x: 530, y: 450 }, { x: 250, y: 300 }, { x: 450, y: 300 }, { x: 130, y: 150 }, { x: 630, y: 150 }, { x: 380, y: 50 }
        ]
    },
    {
        id: 8,
        title: "Reindeer Stables",
        theme: { sky: ['#3c096c', '#5a189a', '#7b2cbf'], mountain: '#240046', platform: '#9d4edd', accent: '#e0aaff' },
        collectibleType: 'bell', 
        platforms: [
            ground,
            { x: 0, y: 450, w: 150, h: 50 },
            { x: 650, y: 450, w: 150, h: 50 },
            { x: 200, y: 350, w: 100, h: 20 },
            { x: 500, y: 350, w: 100, h: 20 },
            { x: 300, y: 250, w: 200, h: 20 },
            { x: 350, y: 150, w: 100, h: 20 }
        ],
        collectibles: [
            { x: 50, y: 400 }, { x: 700, y: 400 }, { x: 230, y: 300 }, { x: 530, y: 300 }, { x: 350, y: 200 }, { x: 400, y: 200 }, { x: 380, y: 100 }
        ]
    },
    {
        id: 9,
        title: "Silent Night",
        theme: { sky: ['#000000', '#14213d', '#fca311'], mountain: '#000000', platform: '#e5e5e5', accent: '#fca311' },
        collectibleType: 'star',
        platforms: [
            ground,
            { x: 100, y: 450, w: 50, h: 10 },
            { x: 200, y: 400, w: 50, h: 10 },
            { x: 300, y: 350, w: 50, h: 10 },
            { x: 400, y: 300, w: 50, h: 10 },
            { x: 500, y: 250, w: 50, h: 10 },
            { x: 600, y: 200, w: 50, h: 10 },
            { x: 700, y: 150, w: 50, h: 10 }
        ],
        collectibles: [
            { x: 110, y: 400 }, { x: 210, y: 350 }, { x: 310, y: 300 }, { x: 410, y: 250 }, { x: 510, y: 200 }, { x: 610, y: 150 }, { x: 710, y: 100 }
        ]
    },
    {
        id: 10,
        title: "North Pole Summit",
        theme: { sky: ['#ff0000', '#ff8700', '#ffd300', '#deff0a', '#a1ff0a', '#0aff99', '#0aefff', '#147df5', '#580aff', '#be0aff'], mountain: '#ffffff', platform: '#ffffff', accent: '#ff0000' },
        collectibleType: 'heart',
        platforms: [
            ground,
            { x: 300, y: 450, w: 200, h: 20 },
            { x: 200, y: 350, w: 50, h: 20 },
            { x: 550, y: 350, w: 50, h: 20 },
            { x: 100, y: 250, w: 50, h: 20 },
            { x: 650, y: 250, w: 50, h: 20 },
            { x: 350, y: 150, w: 100, h: 20 }
        ],
        collectibles: [
            { x: 350, y: 400 }, { x: 400, y: 400 }, { x: 215, y: 300 }, { x: 565, y: 300 }, { x: 115, y: 200 }, { x: 665, y: 200 }, { x: 380, y: 100 }, { x: 400, y: 100 }, { x: 360, y: 100 }
        ]
    }
];

// --- Input Handling ---
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// --- Physics ---
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updatePhysics() {
    // Horizontal
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
        createParticles(player.x + player.width/2, player.y + player.height, '#fff', 5);
    }

    // Gravity
    player.velocityY += gameConfig.gravity;
    if (player.velocityY > gameConfig.terminalVelocity) player.velocityY = gameConfig.terminalVelocity;

    // Apply Velocity
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Platform Collisions
    player.onGround = false;
    for (let platform of platforms) {
        if (checkCollision(player, platform)) {
            // Landing
            if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            }
            // Hitting head
            else if (player.velocityY < 0 && player.y - player.velocityY >= platform.y + platform.height) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Side collisions
            else if (player.velocityX > 0 && player.x + player.width - player.velocityX <= platform.x) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (player.velocityX < 0 && player.x - player.velocityX >= platform.x + platform.width) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) {
        resetPlayerPosition();
    }

    // Collectibles & Multiplayer Sync
    for (let i = 0; i < collectibles.length; i++) {
        let c = collectibles[i];
        if (!c.collected && checkCollision(player, c)) {
            // Optimistic update
            c.collected = true;
            gameState.progress++;
            createParticles(c.x + c.width/2, c.y + c.height/2, c.color || '#fff', 15);
            updateUI();
            
            // Send to server
            socket.emit('starCollected', { levelId: gameState.currentLevel, collectibleIndex: i });
            
            checkLevelComplete();
        }
    }

    // Network Update (Send position to server)
    if (gameState.running) {
        socket.emit('playerUpdate', {
            x: player.x,
            y: player.y,
            facingRight: player.facingRight,
            level: gameState.currentLevel
        });
    }
}

// --- Visual Effects ---
function updateSnow() {
    snowflakes.forEach(f => {
        f.y += f.speed;
        f.x += Math.sin(f.y * 0.05 + f.sway) * 0.5;
        if (f.y > canvas.height) {
            f.y = -10;
            f.x = Math.random() * canvas.width;
        }
    });
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.95;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1.0;
    }
}

function createParticles(x, y, color, count) {
    for(let i=0; i<count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// --- Drawing ---
function drawRect(x, y, w, h, color, border='#000') {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

function drawBackground(theme) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    theme.sky.forEach((color, index) => {
        gradient.addColorStop(index / (theme.sky.length - 1), color);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = theme.mountain;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for(let i=0; i<=canvas.width; i+=50) {
        let h = 100 + Math.sin(i * 0.02) * 80 + Math.random() * 10;
        ctx.lineTo(i, canvas.height - h);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();

    ctx.fillStyle = '#fff';
    snowflakes.forEach(f => {
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

function drawPlatforms(theme) {
    platforms.forEach(p => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(p.x - 2, p.y - 6, p.width + 4, 10);
        drawRect(p.x, p.y, p.width, p.height, theme.platform);
        
        const lightColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00'];
        for(let i=5; i<p.width; i+=20) {
             ctx.fillStyle = lightColors[(i/20 + Math.floor(Date.now()/500)) % lightColors.length];
             ctx.beginPath();
             ctx.arc(p.x + i, p.y + 4, 3, 0, Math.PI*2);
             ctx.fill();
        }
    });
}

// Reusable character drawer
function drawCharacter(charObj) {
    if (!charObj) return;
    
    // Body
    drawRect(charObj.x, charObj.y, charObj.width, charObj.height, charObj.color);
    
    // Coat details
    ctx.fillStyle = '#fff'; 
    ctx.fillRect(charObj.x + charObj.width/2 - 2, charObj.y, 4, charObj.height);
    
    // Belt
    ctx.fillStyle = '#000';
    ctx.fillRect(charObj.x, charObj.y + 20, charObj.width, 4);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(charObj.x + charObj.width/2 - 4, charObj.y + 19, 8, 6);
    
    // Eyes
    ctx.fillStyle = '#000';
    if (charObj.facingRight) {
        ctx.fillRect(charObj.x + 20, charObj.y + 8, 4, 4);
        ctx.fillRect(charObj.x + 26, charObj.y + 8, 4, 4);
    } else {
        ctx.fillRect(charObj.x + 2, charObj.y + 8, 4, 4);
        ctx.fillRect(charObj.x + 8, charObj.y + 8, 4, 4);
    }
    
    // HAT
    ctx.fillStyle = '#d90429'; 
    ctx.beginPath();
    if (charObj.facingRight) {
        ctx.moveTo(charObj.x, charObj.y);
        ctx.lineTo(charObj.x + charObj.width, charObj.y);
        ctx.lineTo(charObj.x + charObj.width/2, charObj.y - 15);
    } else {
        ctx.moveTo(charObj.x, charObj.y);
        ctx.lineTo(charObj.x + charObj.width, charObj.y);
        ctx.lineTo(charObj.x + charObj.width/2, charObj.y - 15);
    }
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(charObj.x - 2, charObj.y - 4, charObj.width + 4, 6);
    ctx.beginPath(); 
    ctx.arc(charObj.x + charObj.width/2, charObj.y - 15, 5, 0, Math.PI*2); 
    ctx.fill();
}

function drawIcon(type, x, y, size) {
    const cx = x + size/2;
    const cy = y + size/2;
    ctx.save();
    ctx.translate(cx, cy);
    const bob = Math.sin(Date.now() / 200) * 3;
    ctx.translate(0, bob);

    switch(type) {
        case 'snowflake':
            ctx.strokeStyle = '#fff'; ctx.lineWidth=3;
            for(let i=0; i<6; i++) {
                ctx.rotate(Math.PI*2/6);
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, size/2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, size/4); ctx.lineTo(size/6, size/3); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, size/4); ctx.lineTo(-size/6, size/3); ctx.stroke();
            }
            break;
        case 'ice':
            ctx.fillStyle = '#E0FFFF';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.lineTo(size/3, 0);
            ctx.lineTo(0, size/2);
            ctx.lineTo(-size/3, 0);
            ctx.fill();
            break;
        case 'ornament': 
            ctx.fillStyle = '#ff0000';
            ctx.beginPath(); ctx.arc(0, 0, size/2.5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; 
            ctx.beginPath(); ctx.arc(-size/6, -size/6, size/8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffd700'; 
            ctx.fillRect(-size/6, -size/2, size/3, size/6);
            break;
        case 'gingerbread':
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(0, -size/4, size/6, 0, Math.PI*2); 
            ctx.fill();
            ctx.fillRect(-size/4, -size/4, size/2, size/2); 
            ctx.fillRect(-size/2, -size/4, size/4, size/6); 
            ctx.fillRect(size/4, -size/4, size/4, size/6); 
            break;
        case 'stocking':
            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.fillRect(-size/4, -size/2, size/2, size * 0.6);
            ctx.fillRect(-size/4, 0, size * 0.6, size/3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-size/4, -size/2, size/2, size/5);
            break;
        case 'candy':
            ctx.strokeStyle = '#FF0000'; ctx.lineWidth=5; ctx.lineCap='round';
            ctx.beginPath();
            ctx.arc(-size/6, -size/4, size/4, Math.PI, 0);
            ctx.lineTo(size/12, size/2);
            ctx.stroke();
            ctx.strokeStyle = '#fff'; ctx.lineWidth=3;
            ctx.beginPath();
            ctx.arc(-size/6, -size/4, size/4, Math.PI, 0);
            ctx.lineTo(size/12, size/2);
            ctx.stroke();
            break;
        case 'gift':
            ctx.fillStyle = '#32CD32';
            ctx.fillRect(-size/3, -size/3, size/1.5, size/1.5);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(-size/12, -size/3, size/6, size/1.5);
            ctx.fillRect(-size/3, -size/12, size/1.5, size/6);
            break;
        case 'bell':
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(0, -size/2);
            ctx.quadraticCurveTo(size/2, -size/2, size/2, size/2);
            ctx.lineTo(-size/2, size/2);
            ctx.quadraticCurveTo(-size/2, -size/2, 0, -size/2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(0, size/2, size/8, 0, Math.PI*2); ctx.fill();
            break;
        case 'star':
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                ctx.rotate(Math.PI*2/5);
                ctx.lineTo(0, -size/2);
                ctx.lineTo(size/6, -size/6);
            }
            ctx.fill();
            break;
        case 'heart':
            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.moveTo(0, size/4);
            ctx.bezierCurveTo(size/2, -size/4, size/2, size/2, 0, size/2);
            ctx.bezierCurveTo(-size/2, size/2, -size/2, -size/4, 0, size/4);
            ctx.fill();
            break;
        default:
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0,0,size/3,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
}

function drawCollectibles(type) {
    collectibles.forEach(c => {
        if (!c.collected) {
            drawIcon(type, c.x, c.y, c.width);
        }
    });
}

function draw() {
    const level = levelsData[gameState.currentLevel - 1];
    if (!level) return;

    drawBackground(level.theme);
    drawPlatforms(level.theme);
    drawCollectibles(level.collectibleType);
    
    // Draw Player
    drawCharacter(player);
    
    // Draw Partner (if they are on the same level)
    if (partner.active && partner.level === gameState.currentLevel) {
        ctx.globalAlpha = 0.7; // Ghost effect
        drawCharacter(partner);
        // Name tag
        ctx.fillStyle = '#fff';
        ctx.font = '12px Courier New';
        ctx.fillText(partner.name, partner.x, partner.y - 25);
        ctx.globalAlpha = 1.0;
    }
    
    particles.forEach(p => p.draw(ctx));
}

// --- Socket Events & Game Logic ---

socket.on('connect', () => {
    document.getElementById('connectionStatus').textContent = 'Connected!';
    document.getElementById('connectionStatus').style.color = '#00ff00';
});

socket.on('currentPlayers', (takenNames) => {
    // Disable buttons if taken
    const btnVilde = document.getElementById('btnVilde');
    const btnNora = document.getElementById('btnNora');
    
    if (takenNames.includes('Vilde')) {
        btnVilde.disabled = true;
        btnVilde.style.background = '#333';
        btnVilde.style.color = '#777';
        btnVilde.textContent = 'Vilde (Taken)';
    }
    
    if (takenNames.includes('Nora')) {
        btnNora.disabled = true;
        btnNora.style.background = '#333';
        btnNora.style.color = '#777';
        btnNora.textContent = 'Nora (Taken)';
    }
    
    // Update Partner UI name if we are playing
    if (gameState.running) {
        const otherName = takenNames.find(n => n !== gameState.playerName);
        if (otherName) {
            document.getElementById('partnerNameDisplay').textContent = otherName;
            partner.active = true;
            partner.name = otherName;
            partner.color = otherName === 'Nora' ? '#4a8bc9' : '#c94a4a';
        } else {
            document.getElementById('partnerNameDisplay').textContent = 'Waiting...';
            partner.active = false;
        }
    }
});

socket.on('selectionSuccess', (name) => {
    startGame(name);
});

socket.on('selectionError', (msg) => {
    alert(msg);
    location.reload();
});

socket.on('playerJoined', (data) => {
    if (data.name !== gameState.playerName) {
        console.log('Partner joined:', data.name);
    }
});

socket.on('otherPlayerMoved', (data) => {
    if (!gameState.running) return;
    partner.active = true;
    partner.x = data.x;
    partner.y = data.y;
    partner.facingRight = data.facingRight;
    partner.level = data.level;
});

socket.on('globalStarCollected', (data) => {
    try {
        // data = { levelId, collectibleIndex }
        if (data.levelId === gameState.currentLevel) {
            // Safety check for array bounds
            if (collectibles && 
                collectibles[data.collectibleIndex] && 
                !collectibles[data.collectibleIndex].collected) {
                
                const item = collectibles[data.collectibleIndex];
                item.collected = true;
                gameState.progress++;
                
                // Add center offset for particle origin if possible, otherwise use x/y
                const pX = item.x + (item.width ? item.width / 2 : 15);
                const pY = item.y + (item.height ? item.height / 2 : 15);
                
                createParticles(pX, pY, '#ffd700', 10);
                
                updateUI();
                checkLevelComplete();
            }
        }
    } catch (e) {
        console.error("Error handling globalStarCollected:", e);
    }
});

function loadLevel(levelIndex) {
    if (levelIndex > gameState.totalLevels) {
        gameComplete();
        return;
    }
    
    gameState.currentLevel = levelIndex;
    gameState.isTransitioning = false;
    
    const level = levelsData[levelIndex - 1];
    
    platforms = level.platforms.map(p => ({...p, width: p.w || p.width, height: p.h || p.height, type: p.type || 'normal'}));
    collectibles = level.collectibles.map(c => ({
        x: c.x, 
        y: c.y, 
        width: 30, 
        height: 30, 
        collected: false,
        color: '#fff' 
    }));
    
    resetPlayerPosition();
    
    gameState.progress = 0;
    gameState.maxProgress = collectibles.length;
    
    updateUI();
    document.getElementById('messageScreen').classList.add('hidden');
    
    // Sync state with server
    if (socket && socket.connected) {
        socket.emit('requestLevelState', level.id);
    }
    
    console.log(`Loaded Level ${level.id}: ${level.title}`);
}

socket.on('levelStateResponse', (data) => {
    if (data.levelId === gameState.currentLevel && data.collectedIndices) {
        data.collectedIndices.forEach(index => {
            if (collectibles[index] && !collectibles[index].collected) {
                collectibles[index].collected = true;
                gameState.progress++;
            }
        });
        updateUI();
        checkLevelComplete();
    }
});

function checkLevelComplete() {
    console.log(`Checking Level Complete: ${gameState.progress}/${gameState.maxProgress} (Transitioning: ${gameState.isTransitioning})`);
    if (gameState.progress >= gameState.maxProgress && !gameState.isTransitioning) {
        console.log("Level Complete! Transitioning...");
        gameState.isTransitioning = true;
        updateUI();
        setTimeout(showLevelComplete, 500);
    }
}

function showLevelComplete() {
    const screen = document.getElementById('messageScreen');
    const title = document.getElementById('messageTitle');
    const sub = document.getElementById('messageSubtitle');
    const btn = document.getElementById('btnNextLevel');
    
    console.log("Showing Level Complete Screen");
    screen.classList.remove('hidden');
    screen.style.display = 'flex';
    
    if (gameState.currentLevel === gameState.totalLevels) {
        title.textContent = "MERRY CHRISTMAS!";
        sub.textContent = "You saved the holidays!";
        btn.textContent = "Play Again";
        btn.onclick = () => location.reload();
    } else {
        title.textContent = "Level Complete!";
        sub.textContent = `Next stop: ${levelsData[gameState.currentLevel].title}`;
        btn.textContent = "Continue Journey";
        btn.onclick = () => {
            screen.classList.add('hidden');
            screen.style.display = '';
            loadLevel(gameState.currentLevel + 1);
        };
    }
}

function resetPlayerPosition() {
    player.x = 50;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    player.onGround = false;
}

function updateUI() {
    document.getElementById('levelDisplay').textContent = gameState.currentLevel;
    document.getElementById('progress').textContent = gameState.progress;
    document.getElementById('maxProgress').textContent = gameState.maxProgress;
}

function gameLoop() {
    try {
        if (gameState.running && !gameState.isTransitioning) {
            updatePhysics();
            updateSnow();
            updateParticles();
        }
        if (gameState.running) {
            draw();
        }
    } catch (e) {
        console.error("Game loop error:", e);
        // Attempt to recover by not stopping, but maybe resetting a state if needed
    }
    requestAnimationFrame(gameLoop);
}

// Button Events - Now just requests selection
document.getElementById('btnVilde').addEventListener('click', () => {
    if (typeof initAudio === 'function') initAudio(); 
    socket.emit('selectCharacter', 'Vilde');
});

document.getElementById('btnNora').addEventListener('click', () => {
    if (typeof initAudio === 'function') initAudio();
    socket.emit('selectCharacter', 'Nora');
});

function startGame(name) {
    gameState.playerName = name;
    player.color = name === 'Nora' ? '#4a8bc9' : '#c94a4a';
    
    document.getElementById('playerNameDisplay').textContent = name;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');
    
    gameState.running = true;
    loadLevel(1);
    gameLoop();
}

// Initial draw (background only)
const tempTheme = levelsData[0].theme;
drawBackground(tempTheme);