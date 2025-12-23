// --- Level Design ---
// Base ground for 1200x800 canvas

export const levelsData = [
    {
        id: 1,
        title: "Jotunheimen",
        theme: {
            type: 'mountain',
            sky: ['#87CEEB', '#E0F6FF', '#B0D4E6'],
            mountain: ['#8B7355', '#6B5B4F', '#5A4A3F'],
            platform: '#8B7355',
            cabin: true
        },
        cutScreen: {
            title: "Jotunheimen",
            text: "Juletrollene Vetle & Vebjørn er – som vanlig – sent ute med å planlegge årets tur.\n\nFor å kjøpe seg tid vil de gjøre alt de kan for å hindre dere i å nå siste bane og avsløre årets destinasjon.\n\nFinn veien gjennom hindrene og slå juletrollene en gang for alle! Første stopp: Jotunheimen – hvor trollene er ute etter skumlere ting enn bare bananbrød…"
        },
        platforms: [
            { x: 0, y: 750, w: 1200, h: 50 }, // Ground
            { x: 200, y: 650, w: 200, h: 40 },
            { x: 500, y: 550, w: 200, h: 40 },
            { x: 800, y: 450, w: 200, h: 40 },
            { x: 1000, y: 350, w: 200, h: 40 },
            { x: 150, y: 500, w: 100, h: 30 } // Cabin platform
        ],
        collectibles: [
            // Gentle intro: more small pickups
            { x: 120, y: 700, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 180, y: 700, type: 'coin', requiredPlayer: 'Nora' },
            { x: 250, y: 580, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 550, y: 480, type: 'coin', requiredPlayer: 'Nora' },
            { x: 850, y: 380, type: 'star', requiredPlayer: 'Vilde' },
            { x: 1050, y: 280, type: 'snowflake', requiredPlayer: 'Nora' },
            // Extra goodies
            { x: 320, y: 620, type: 'coin', requiredPlayer: 'Nora' },
            { x: 620, y: 520, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 930, y: 420, type: 'coin', requiredPlayer: 'Nora' },
            { x: 170, y: 470, type: 'snowflake', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            // Exactly two monsters: one of each (easy)
            { x: 280, y: 710, range: 300, name: 'Vetle', maxHealth: 2, speed: 1.8 },
            { x: 760, y: 510, range: 260, name: 'Vebjørn', maxHealth: 2, speed: 1.8 }
        ],
        door: { x: 1100, y: 650 }
    },
    {
        id: 2,
        title: "Svensk Skjærgård",
        theme: {
            type: 'coast',
            sky: ['#87CEEB', '#FFE4B5', '#FFD700'],
            water: ['#4A90E2', '#5BA3F5', '#6BB6FF'],
            platform: '#D4A574',
            sunny: true
        },
        cutScreen: {
            title: "Svensk Skjærgård",
            text: "Dere kom dere gjennom Jotunheimens lumske farer – men ferden er ikke over.\n\nTrollene rømmer videre til den svenske skjærgården. Mellom svaberg og solglitter i havet prøver de å stoppe dere fra å finne neste hint.\n\nHold kursen. Hintet venter et sted der ute…"
        },
        platforms: [
            { x: 0, y: 750, w: 300, h: 50 }, // Start island
            { x: 400, y: 700, w: 150, h: 40 },
            { x: 650, y: 700, w: 150, h: 40 },
            { x: 900, y: 750, w: 300, h: 50 }, // End island
            { x: 550, y: 550, w: 100, h: 30 } // High cliff
        ],
        collectibles: [
            { x: 80, y: 700, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 200, y: 700, type: 'coin', requiredPlayer: 'Nora' },
            { x: 450, y: 630, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 700, y: 630, type: 'coin', requiredPlayer: 'Nora' },
            { x: 600, y: 480, type: 'star', requiredPlayer: 'Vilde' },
            { x: 1020, y: 700, type: 'snowflake', requiredPlayer: 'Nora' },
            // More pickups along the route
            { x: 520, y: 520, type: 'coin', requiredPlayer: 'Nora' },
            { x: 580, y: 520, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 960, y: 700, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 1120, y: 700, type: 'coin', requiredPlayer: 'Nora' },
            { x: 560, y: 520, type: 'snowflake', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            // Exactly two monsters (slightly harder)
            { x: 930, y: 710, range: 300, name: 'Vebjørn', maxHealth: 3, speed: 2.1 },
            { x: 430, y: 660, range: 240, name: 'Vetle', maxHealth: 3, speed: 2.1 }
        ],
        door: { x: 1100, y: 650 }
    },
    {
        id: 3,
        title: "Sogndal",
        theme: {
            type: 'fjord',
            sky: ['#B0C4DE', '#D3D3D3', '#E6E6FA'],
            mountain: ['#708090', '#778899', '#696969'],
            water: ['#4682B4', '#5F9EA0'],
            platform: '#8B7355',
            pine: true
        },
        cutScreen: {
            title: "Sogndal",
            text: "Etter Sverige står Sogndal for tur.\n\nMellom høye, snøkledde steinspir og dype fjorder kan juletrollene hoppe fram når som helst.\n\nTrå varsomt – those who enter…"
        },
        platforms: [
            { x: 0, y: 750, w: 1200, h: 50 }, // Ground
            // Divider used to "box-in" the level; move it down so the top platform is a bridge across.
            { x: 580, y: 240, w: 40, h: 510 }, // Vertical Divider (passable at top)
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
            // More pickups + encourages both sides
            { x: 140, y: 530, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 310, y: 380, type: 'coin', requiredPlayer: 'Nora' },
            { x: 150, y: 230, type: 'star', requiredPlayer: 'Vilde' },
            { x: 420, y: 230, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 1000, y: 530, type: 'coin', requiredPlayer: 'Nora' },
            { x: 870, y: 380, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 1000, y: 230, type: 'star', requiredPlayer: 'Nora' },
            // Extra cliffside pickups
            { x: 340, y: 580, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 840, y: 580, type: 'coin', requiredPlayer: 'Nora' },
            { x: 560, y: 110, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 620, y: 110, type: 'coin', requiredPlayer: 'Nora' }
        ],
        monsters: [
            // Exactly two monsters (medium)
            { x: 220, y: 710, range: 520, name: 'Vetle', maxHealth: 4, speed: 2.3 },
            { x: 820, y: 710, range: 420, name: 'Vebjørn', maxHealth: 4, speed: 2.3 }
        ],
        // Door moved to a clear end position (was confusing / hard to reach at the very top)
        door: { x: 1100, y: 650 }
    },
    {
        id: 4,
        title: "Gandsfjorden",
        theme: {
            type: 'underwater',
            sky: ['#1E3A5F', '#2E4A6F', '#3E5A7F'],
            water: ['#006994', '#0080A8', '#0099BC'],
            platform: '#5C4033', // Darker brown for underwater rocks
            fish: true
        },
        cutScreen: {
            title: "Gandsfjorden",
            text: "Fra fjellets topper til Gandsfjordens dyp…\n\nPå med snorkel og dykkermaske: disse trollene er jammen vanntette.\n\nDykk ned – og finn det som glitrer i dypet."
        },
        platforms: [
            { x: 0, y: 550, w: 250, h: 30 },
            { x: 350, y: 550, w: 250, h: 30 },
            { x: 700, y: 550, w: 250, h: 30 },
            { x: 1050, y: 550, w: 150, h: 30 },
            { x: 450, y: 350, w: 300, h: 30 }, // Upper platform
            { x: 100, y: 200, w: 150, h: 30 } // High platform
        ],
        collectibles: [
            { x: 120, y: 480, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 450, y: 480, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 520, y: 280, type: 'coin', requiredPlayer: 'Nora' },
            { x: 800, y: 480, type: 'coin', requiredPlayer: 'Nora' },
            { x: 600, y: 280, type: 'star', requiredPlayer: 'Vilde' },
            { x: 150, y: 130, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 1060, y: 480, type: 'snowflake', requiredPlayer: 'Vilde' },
            // Extra underwater shinies
            { x: 960, y: 520, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 260, y: 520, type: 'coin', requiredPlayer: 'Nora' },
            // Keep requiredPlayer to the actual player names (Vilde/Nora) so it works in normal mode
            { x: 560, y: 320, type: 'snowflake', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            // Exactly two monsters (medium+)
            { x: 360, y: 510, range: 300, name: 'Vebjørn', maxHealth: 5, speed: 2.5 },
            { x: 720, y: 510, range: 300, name: 'Vetle', maxHealth: 5, speed: 2.5 }
        ],
        door: { x: 1100, y: 450 }
    },
    {
        id: 5,
        title: "Østlandske Skoger",
        theme: {
            type: 'forest',
            sky: ['#2F4F2F', '#3D5A3D', '#4A6A4A'],
            forest: ['#1B3A1B', '#2D4D2D'],
            platform: '#654321',
            storm: true,
            rain: true
        },
        cutScreen: {
            title: "Østlandske Skoger",
            text: "Fra vått til verre!\n\nTrollene jager dere inn i de dype østlandske skoger, i ulende uvær. Regnet pisker mellom trærne – og stien forsvinner i mørket.\n\nHold dere tørre den som kan… og hold sammen!"
        },
        platforms: [
            { x: 0, y: 750, w: 1200, h: 50 }, // Ground
            { x: 150, y: 650, w: 150, h: 30 },
            { x: 350, y: 550, w: 150, h: 30 },
            { x: 550, y: 450, w: 150, h: 30 },
            { x: 750, y: 350, w: 150, h: 30 },
            { x: 950, y: 250, w: 150, h: 30 },
            { x: 50, y: 350, w: 200, h: 30 }, // Cabin platform
            { x: 350, y: 350, w: 80, h: 30 }
        ],
        collectibles: [
            // More collectibles; tighter platforming + storm
            { x: 90, y: 700, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 160, y: 700, type: 'coin', requiredPlayer: 'Nora' },
            { x: 200, y: 580, type: 'coin', requiredPlayer: 'Nora' },
            { x: 380, y: 480, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 600, y: 380, type: 'star', requiredPlayer: 'Vilde' },
            { x: 820, y: 280, type: 'coin', requiredPlayer: 'Nora' },
            { x: 100, y: 280, type: 'snowflake', requiredPlayer: 'Nora' },
            { x: 1000, y: 180, type: 'snowflake', requiredPlayer: 'Vilde' },
            // Fun: rare shield pickup to survive a bad troll bump
            { x: 70, y: 680, type: 'heart', requiredPlayer: 'Nora' },
            // Extra forest goodies
            { x: 560, y: 420, type: 'coin', requiredPlayer: 'Nora' },
            { x: 920, y: 220, type: 'star', requiredPlayer: 'Nora' }
        ],
        monsters: [
            // Exactly two monsters (hard)
            { x: 120, y: 710, range: 720, name: 'Vetle', maxHealth: 6, speed: 2.8 },
            { x: 520, y: 510, range: 480, name: 'Vebjørn', maxHealth: 6, speed: 2.8 }
        ],
        door: { x: 1000, y: 150 }
    },
    {
        id: 6,
        title: "Julekvelden",
        theme: {
            type: 'christmas',
            sky: ['#1a1a2e', '#16213e', '#0f3460'],
            platform: '#8B4513', // Brown wood for sleigh/reindeer platforms
            cozy: true,
            warm: true
        },
        cutScreen: {
            title: "Julekvelden",
            text: "Dere nærmer dere veiens ende.\n\nSelve julekvelden er alt som står mellom dere og den store avsløringen. Men Vetle og Vebjørn gir seg ikke – ikke når julemat, julegaver, akevitt og ribbefett er i spill.\n\nHold dem i sjakk. Hold kursen. Nå avgjøres alt."
        },
        platforms: [
            // Sleigh
            { x: 100, y: 650, w: 600, h: 30 }, // Runners
            { x: 150, y: 550, w: 500, h: 30 }, // Base
            { x: 150, y: 400, w: 30, h: 150 }, // Back
            { x: 620, y: 450, w: 80, h: 100 }, // Front
            // Reindeer
            { x: 800, y: 400, w: 150, h: 30 },
            { x: 1000, y: 300, w: 150, h: 30 },
            { x: 200, y: 350, w: 100, h: 30 } // Gift platform
        ],
        collectibles: [
            // Final level: more collectibles + more movement
            { x: 180, y: 700, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 240, y: 700, type: 'coin', requiredPlayer: 'Nora' },
            { x: 200, y: 500, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 300, y: 500, type: 'coin', requiredPlayer: 'Nora' },
            { x: 400, y: 500, type: 'star', requiredPlayer: 'Vilde' },
            { x: 500, y: 500, type: 'star', requiredPlayer: 'Nora' },
            { x: 850, y: 350, type: 'snowflake', requiredPlayer: 'Vilde' },
            { x: 1050, y: 250, type: 'snowflake', requiredPlayer: 'Nora' },
            // One shield in the final level
            { x: 650, y: 520, type: 'heart', requiredPlayer: 'Vilde' },
            // Bonus sparkle trail
            { x: 740, y: 330, type: 'coin', requiredPlayer: 'Vilde' },
            { x: 920, y: 330, type: 'coin', requiredPlayer: 'Nora' },
            { x: 1040, y: 230, type: 'star', requiredPlayer: 'Vilde' }
        ],
        monsters: [
            // Exactly two monsters (final)
            { x: 220, y: 610, range: 620, name: 'Vebjørn', maxHealth: 7, speed: 3.1 },
            { x: 820, y: 360, range: 420, name: 'Vetle', maxHealth: 7, speed: 3.1 }
        ],
        door: { x: 350, y: 450 }
    }
];
