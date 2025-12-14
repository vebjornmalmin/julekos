// --- Level Design ---
// Base ground for 1200x800 canvas
const ground = { x: 0, y: 750, width: 1200, height: 50, color: '#fff', type: 'snow_ground' };

export const levelsData = [
    {
        id: 1,
        title: "Winter Morning",
        theme: { sky: ['#87CEEB', '#E0F7FA'], mountain: '#FFFFFF', platform: '#A8DADC' },
        platforms: [
            ground,
            { x: 200, y: 650, w: 200, h: 40 },
            { x: 500, y: 550, w: 200, h: 40 },
            { x: 800, y: 450, w: 200, h: 40 },
            { x: 1000, y: 350, w: 200, h: 40 }
        ],
        collectibles: [
            { x: 250, y: 580, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 550, y: 480, type: 'coin', requiredPlayer: 'Nora' },
            { x: 850, y: 380, type: 'star', requiredPlayer: 'Vilde' },
            { x: 1050, y: 280, type: 'snowflake', requiredPlayer: 'Nora' }
        ],
        monsters: [],
        door: { x: 1100, y: 650 }
    },
    {
        id: 2,
        title: "Frozen Crossing",
        theme: { sky: ['#CAF0F8', '#90E0EF'], mountain: '#0077B6', platform: '#00B4D8' },
        platforms: [
            { x: 0, y: 750, w: 300, h: 50 }, // Start island
            { x: 400, y: 700, w: 150, h: 40 }, // Step 1
            { x: 650, y: 700, w: 150, h: 40 }, // Step 2
            { x: 900, y: 750, w: 300, h: 50 }  // End island
        ],
        collectibles: [
            { x: 450, y: 630, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 700, y: 630, type: 'coin', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 950, y: 690, range: 200, name: 'Vebjørn' }
        ],
        door: { x: 1100, y: 650 }
    },
    {
        id: 3,
        title: "The Split Path",
        theme: { sky: ['#2D6A4F', '#40916C'], mountain: '#1B4332', platform: '#52B788' },
        platforms: [
            ground,
            { x: 580, y: 150, w: 40, h: 600 }, // Vertical Divider
            // Left Path
            { x: 100, y: 600, w: 200, h: 30 },
            { x: 250, y: 450, w: 200, h: 30 },
            { x: 100, y: 300, w: 200, h: 30 },
            // Right Path
            { x: 900, y: 600, w: 200, h: 30 },
            { x: 750, y: 450, w: 200, h: 30 },
            { x: 900, y: 300, w: 200, h: 30 },
            // Top Meeting Point
            { x: 0, y: 150, w: 1200, h: 30 }
        ],
        collectibles: [
            { x: 150, y: 530, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 150, y: 230, type: 'star', requiredPlayer: 'Vilde' },
            { x: 1000, y: 530, type: 'coin', requiredPlayer: 'Nora' },
            { x: 1000, y: 230, type: 'star', requiredPlayer: 'Nora' },
            { x: 800, y: 380, type: 'snowflake', requiredPlayer: 'Nora' } // Extra help for the long journey
        ],
        monsters: [
            { x: 300, y: 690, range: 600, name: 'Vetle' },
            { x: 900, y: 690, range: 400, name: 'Vebjørn' } // Right side guard
        ],
        door: { x: 580, y: 50 }
    },
    {
        id: 4,
        title: "Troll Bridge",
        theme: { sky: ['#5E503F', '#8D7F71'], mountain: '#2C1810', platform: '#A68A64' },
        platforms: [
            { x: 0, y: 550, w: 250, h: 30 },
            { x: 350, y: 550, w: 250, h: 30 },
            { x: 700, y: 550, w: 250, h: 30 },
            { x: 1050, y: 550, w: 150, h: 30 },
            { x: 450, y: 350, w: 300, h: 30 } // Upper bridge
        ],
        collectibles: [
            { x: 450, y: 480, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 800, y: 480, type: 'coin', requiredPlayer: 'Nora' },
            { x: 600, y: 280, type: 'heart', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 350, y: 490, range: 200, name: 'Vebjørn' },
            { x: 700, y: 490, range: 200, name: 'Vetle' },
            { x: 500, y: 290, range: 200, name: 'Vebjørn' }
        ],
        door: { x: 1100, y: 450 }
    },
    {
        id: 5,
        title: "Candy Cane Lane",
        theme: { sky: ['#FFCDB2', '#FFB4A2'], mountain: '#E5989B', platform: '#B5838D' },
        platforms: [
            ground,
            { x: 150, y: 650, w: 150, h: 30 },
            { x: 350, y: 550, w: 150, h: 30 },
            { x: 550, y: 450, w: 150, h: 30 },
            { x: 750, y: 350, w: 150, h: 30 },
            { x: 950, y: 250, w: 150, h: 30 },
            { x: 50, y: 350, w: 200, h: 30 }, // Hidden ledge
            { x: 350, y: 350, w: 80, h: 30 } // Stepping stone
        ],
        collectibles: [
            { x: 200, y: 580, type: 'coin', requiredPlayer: 'Nora' },
            { x: 600, y: 380, type: 'star', requiredPlayer: 'Vilde' },
            { x: 100, y: 280, type: 'heart', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 0, y: 690, range: 1100, name: 'Vetle' } // Long patrol
        ],
        door: { x: 1000, y: 150 }
    },
    {
        id: 6,
        title: "Crystal Cavern",
        theme: { sky: ['#240046', '#3C096C'], mountain: '#10002B', platform: '#5A189A' },
        platforms: [
            ground,
            { x: 0, y: 100, w: 1200, h: 50 }, // Ceiling
            { x: 150, y: 550, w: 200, h: 40 },
            { x: 850, y: 550, w: 200, h: 40 },
            { x: 500, y: 400, w: 200, h: 40 },
            { x: 150, y: 250, w: 150, h: 40 },
            { x: 900, y: 250, w: 150, h: 40 }
        ],
        collectibles: [
            { x: 200, y: 480, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 900, y: 480, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 600, y: 330, type: 'star', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 500, y: 340, range: 180, name: 'Vebjørn' },
            { x: 150, y: 690, range: 300, name: 'Vetle' },
            { x: 750, y: 690, range: 300, name: 'Vebjørn' }
        ],
        door: { x: 600, y: 650 }
    },
    {
        id: 7,
        title: "The Climb",
        theme: { sky: ['#A2D2FF', '#BDE0FE'], mountain: '#FFAFCC', platform: '#CDB4DB' },
        platforms: [
            { x: 400, y: 750, w: 400, h: 40 }, // Base
            { x: 200, y: 600, w: 150, h: 30 },
            { x: 850, y: 600, w: 150, h: 30 },
            { x: 525, y: 450, w: 150, h: 30 },
            { x: 250, y: 300, w: 120, h: 30 },
            { x: 830, y: 300, w: 120, h: 30 },
            { x: 550, y: 150, w: 100, h: 30 }  // Top
        ],
        collectibles: [
            { x: 250, y: 530, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 900, y: 530, type: 'coin', requiredPlayer: 'Nora' },
            { x: 300, y: 230, type: 'star', requiredPlayer: 'Nora' },
            { x: 880, y: 230, type: 'star', requiredPlayer: 'Vilde' }
        ],
        monsters: [],
        door: { x: 580, y: 50 }
    },
    {
        id: 8,
        title: "Santa's Workshop",
        theme: { sky: ['#7F5539', '#9C6644'], mountain: '#606C38', platform: '#DDA15E' },
        platforms: [
            ground,
            { x: 0, y: 600, w: 900, h: 30 }, // Conveyor 1
            { x: 300, y: 450, w: 900, h: 30 }, // Conveyor 2
            { x: 0, y: 300, w: 900, h: 30 }, // Conveyor 3
            { x: 300, y: 150, w: 900, h: 30 }  // Conveyor 4
        ],
        collectibles: [
            { x: 100, y: 530, type: 'coin', requiredPlayer: 'Nora' },
            { x: 1100, y: 380, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 100, y: 230, type: 'star', requiredPlayer: 'Nora' },
            { x: 1100, y: 80, type: 'heart', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            { x: 300, y: 540, range: 300, name: 'Vetle' },
            { x: 600, y: 390, range: 300, name: 'Vebjørn' },
            { x: 300, y: 240, range: 300, name: 'Vetle' }
        ],
        door: { x: 100, y: 150 }
    },
    {
        id: 9,
        title: "Blizzard",
        theme: { sky: ['#CED4DA', '#DEE2E6'], mountain: '#6C757D', platform: '#495057' },
        platforms: [
            ground,
            { x: 100, y: 600, w: 100, h: 100 },
            { x: 300, y: 450, w: 100, h: 100 },
            { x: 550, y: 600, w: 100, h: 100 },
            { x: 800, y: 450, w: 100, h: 100 },
            { x: 1000, y: 300, w: 100, h: 100 },
            { x: 750, y: 150, w: 100, h: 100 },
            { x: 500, y: 300, w: 100, h: 100 },
            { x: 250, y: 150, w: 100, h: 100 }
        ],
        collectibles: [
            { x: 130, y: 530, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 580, y: 530, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 1030, y: 230, type: 'star', requiredPlayer: 'Vilde' },
            { x: 280, y: 80, type: 'heart', requiredPlayer: 'Nora' }
        ],
        monsters: [
            { x: 0, y: 690, range: 1100, name: 'Vebjørn' }, // Chaos below
            { x: 500, y: 90, range: 80, name: 'Vetle' } // Guarding top path
        ],
        door: { x: 50, y: 50 }
    },
    {
        id: 10,
        title: "Christmas Eve",
        theme: { sky: ['#001219', '#005F73'], mountain: '#0A9396', platform: '#94D2BD' },
        platforms: [
            // Sleigh
            { x: 100, y: 650, w: 600, h: 30 }, // Runners
            { x: 150, y: 550, w: 500, h: 30 }, // Base
            { x: 150, y: 400, w: 30, h: 150 }, // Back
            { x: 620, y: 450, w: 80, h: 100 }, // Front
            // Reindeer
            { x: 800, y: 400, w: 150, h: 30 },
            { x: 1000, y: 300, w: 150, h: 30 }
        ],
        collectibles: [
            { x: 200, y: 500, type: 'heart', requiredPlayer: 'Vilde' },
            { x: 300, y: 500, type: 'heart', requiredPlayer: 'Nora' },
            { x: 400, y: 500, type: 'star', requiredPlayer: 'Vilde' },
            { x: 500, y: 500, type: 'star', requiredPlayer: 'Nora' },
            { x: 850, y: 350, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 1050, y: 250, type: 'coin', requiredPlayer: 'Nora' }
        ],
        monsters: [],
        door: { x: 350, y: 450 }
    }
];