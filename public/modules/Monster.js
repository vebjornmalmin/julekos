import { assets } from './Config.js';

export class Monster {
    constructor(x, y, range, name) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.startX = x;
        this.range = range;
        this.speed = 2;
        this.direction = 1;
        this.name = name || (Math.random() > 0.5 ? 'Vebjørn' : 'Vetle');
        this.health = 3;
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
        
        // Health Bar
        const healthPct = this.health / 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 12, this.width, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 12, this.width * healthPct, 4);
    }
}
