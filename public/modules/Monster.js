import { assets } from './Config.js';

export class Monster {
    constructor(x, y, range, name, maxHealth = 3, speed = 2) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.startX = x;
        this.range = range;
        this.speed = speed;
        this.direction = 1;
        this.name = name || (Math.random() > 0.5 ? 'Vebjørn' : 'Vetle');
        this.maxHealth = maxHealth;
        this.health = maxHealth;
    }

    update() {
        this.x += this.speed * this.direction;
        if (this.x > this.startX + this.range || this.x < this.startX) {
            this.direction *= -1;
        }
    }

    draw(ctx) {
        ctx.drawImage(assets.troll, this.x, this.y, this.width, this.height);
        // Name + Health Bar UNDER the monster (so it doesn't overlap the sprite)
        const barY = this.y + this.height + 4;
        const nameY = barY + 14;
        const healthPct = Math.max(0, Math.min(1, this.health / this.maxHealth));

        // Backplate for readability
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(this.x - 2, barY - 2, this.width + 4, 24);

        // Health bar
        ctx.fillStyle = '#222';
        ctx.fillRect(this.x, barY, this.width, 6);
        ctx.fillStyle = healthPct > 0.5 ? '#00ff66' : (healthPct > 0.25 ? '#ffd60a' : '#ff3b30');
        ctx.fillRect(this.x, barY, this.width * healthPct, 6);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, barY, this.width, 6);

        // Name (under bar)
        ctx.fillStyle = '#fff';
        ctx.font = '11px Courier New';
        ctx.fillText(this.name, this.x, nameY);
    }
}
