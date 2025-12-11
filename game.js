// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
const gameState = {
    progress: 0,
    maxProgress: 10
};

// Player object - Japanese-inspired character
const player = {
    x: 50,
    y: 300,
    width: 32,
    height: 32,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 20,
    onGround: false,
    color: '#c94a4a', // Japanese red
    accentColor: '#2c1810' // Dark brown for details
};

// Platforms - Stone/mountain ledges with Japanese aesthetic
const platforms = [
    { x: 0, y: 550, width: 200, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 250, y: 500, width: 150, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 450, y: 450, width: 150, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 650, y: 400, width: 150, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 200, y: 350, width: 100, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 400, y: 300, width: 150, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 600, y: 250, width: 150, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 100, y: 200, width: 100, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 500, y: 150, width: 150, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' },
    { x: 0, y: 100, width: 200, height: 50, color: '#6b5b4f', borderColor: '#4a3d32' }
];

// Collectibles - Cherry blossoms (sakura)
const collectibles = [
    { x: 300, y: 450, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 500, y: 400, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 700, y: 350, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 250, y: 300, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 450, y: 250, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 650, y: 200, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 150, y: 150, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 550, y: 100, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 100, y: 50, width: 20, height: 20, collected: false, color: '#ffb7c5' },
    { x: 700, y: 50, width: 20, height: 20, collected: false, color: '#ffb7c5' }
];

// Input handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Physics and movement
function updatePlayer() {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.velocityX = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.velocityX = player.speed;
    } else {
        player.velocityX *= 0.8; // Friction
    }

    // Jumping
    if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && player.onGround) {
        player.velocityY = -player.jumpPower;
        player.onGround = false;
    }

    // Apply gravity
    player.velocityY += 0.6; // Gravity strength
    player.velocityY = Math.min(player.velocityY, 15); // Terminal velocity

    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Check platform collisions
    player.onGround = false;
    for (let platform of platforms) {
        if (checkCollision(player, platform)) {
            // Landing on top of platform
            if (player.velocityY > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            }
            // Hitting platform from below
            else if (player.velocityY < 0 && player.y > platform.y) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
            // Side collisions
            else if (player.velocityX > 0) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }

    // Boundary checks
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.onGround = true;
    }

    // Check collectible collisions
    for (let collectible of collectibles) {
        if (!collectible.collected && checkCollision(player, collectible)) {
            collectible.collected = true;
            gameState.progress++;
            updateProgress();
        }
    }
}

// Update progress display
function updateProgress() {
    document.getElementById('progress').textContent = gameState.progress;
    
    // When all collectibles are collected, you can add a reveal here
    if (gameState.progress >= gameState.maxProgress) {
        // TODO: Add trip reveal logic here
        console.log('All collectibles collected! Ready for trip reveal!');
    }
}

// Rendering
function drawPixelRect(x, y, width, height, color, borderColor = '#000') {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    
    // Add pixelated border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(x), Math.floor(y), width, height);
}

function drawMountainBackground() {
    // Sky gradient - dawn/dusk colors
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ffd4b3'); // Light peach/orange
    gradient.addColorStop(0.3, '#ffb3ba'); // Soft pink
    gradient.addColorStop(0.6, '#b3d9ff'); // Light blue
    gradient.addColorStop(1, '#8c6b5f'); // Mountain base color
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountain silhouettes
    ctx.fillStyle = '#6b5b4f';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, 400);
    ctx.lineTo(150, 350);
    ctx.lineTo(300, 380);
    ctx.lineTo(450, 320);
    ctx.lineTo(600, 360);
    ctx.lineTo(750, 340);
    ctx.lineTo(canvas.width, 370);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Add darker mountain layer for depth
    ctx.fillStyle = '#4a3d32';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(0, 450);
    ctx.lineTo(200, 400);
    ctx.lineTo(400, 420);
    ctx.lineTo(600, 380);
    ctx.lineTo(canvas.width, 400);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw some clouds (simple pixelated)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    drawCloud(100, 80, 40);
    drawCloud(300, 60, 35);
    drawCloud(550, 90, 45);
    drawCloud(700, 50, 30);
}

function drawCloud(x, y, size) {
    ctx.fillRect(x, y, size, size / 2);
    ctx.fillRect(x + size / 3, y - size / 3, size / 2, size / 2);
    ctx.fillRect(x + size * 2 / 3, y, size / 2, size / 2);
}

function drawPlayer() {
    // Japanese-inspired pixelated character
    // Body (red kimono-like)
    drawPixelRect(player.x, player.y + 16, player.width, player.height - 16, player.color);
    
    // Head
    ctx.fillStyle = '#f4d4a4'; // Skin tone
    ctx.fillRect(Math.floor(player.x + 6), Math.floor(player.y), 20, 18);
    ctx.strokeStyle = '#2c1810';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.floor(player.x + 6), Math.floor(player.y), 20, 18);
    
    // Hair (black)
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(Math.floor(player.x + 4), Math.floor(player.y + 2), 24, 8);
    
    // Eyes
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(Math.floor(player.x + 10), Math.floor(player.y + 6), 3, 3);
    ctx.fillRect(Math.floor(player.x + 19), Math.floor(player.y + 6), 3, 3);
    
    // Belt/obi
    ctx.fillStyle = player.accentColor;
    ctx.fillRect(Math.floor(player.x + 8), Math.floor(player.y + 20), 16, 4);
}

function drawPlatforms() {
    for (let platform of platforms) {
        // Main platform
        drawPixelRect(platform.x, platform.y, platform.width, platform.height, platform.color, platform.borderColor);
        
        // Add some texture/details (moss or stone texture)
        ctx.fillStyle = 'rgba(90, 120, 80, 0.3)'; // Moss green overlay
        ctx.fillRect(Math.floor(platform.x + 5), Math.floor(platform.y + 5), platform.width - 10, 8);
        
        // Highlight edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(Math.floor(platform.x), Math.floor(platform.y), platform.width, 2);
    }
}

function drawCollectibles() {
    for (let collectible of collectibles) {
        if (!collectible.collected) {
            // Draw cherry blossom (sakura) - 5 petals
            const centerX = collectible.x + collectible.width / 2;
            const centerY = collectible.y + collectible.height / 2;
            const radius = collectible.width / 2;
            
            ctx.fillStyle = collectible.color;
            ctx.beginPath();
            
            // Draw 5 petals
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                const petalX = centerX + Math.cos(angle) * radius * 0.6;
                const petalY = centerY + Math.sin(angle) * radius * 0.6;
                
                // Simple petal shape (ellipse)
                ctx.ellipse(petalX, petalY, radius * 0.4, radius * 0.6, angle, 0, Math.PI * 2);
            }
            
            // Center of flower
            ctx.fill();
            ctx.fillStyle = '#ff6b9d';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            // Outline
            ctx.strokeStyle = '#c94a4a';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

function draw() {
    // Draw Japanese mountain background
    drawMountainBackground();
    
    // Draw platforms
    drawPlatforms();
    
    // Draw collectibles
    drawCollectibles();
    
    // Draw player
    drawPlayer();
}

// Game loop
function gameLoop() {
    updatePlayer();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

