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
        // No full ground: falling = death. Use ledges/plateaus.
        platforms: [
            { x: 0, y: 720, w: 220, h: 26 },   // Start plateau
            { x: 130, y: 580, w: 90, h: 22 },  // Cabin ledge
            { x: 260, y: 650, w: 140, h: 26 },
            { x: 330, y: 520, w: 90, h: 22 },
            { x: 500, y: 580, w: 140, h: 26 },
            { x: 740, y: 500, w: 140, h: 26 },
            { x: 980, y: 420, w: 140, h: 26 },
            { x: 980, y: 700, w: 220, h: 26 }  // Finish plateau (door)
        ],
        collectibles: [
            // REQUIRED (exactly 6): banana bread, evenly along the route
            { x: 80, y: 680, type: 'bananabread', requiredPlayer: 'Vilde' },
            { x: 300, y: 610, type: 'bananabread', requiredPlayer: 'Nora' },
            { x: 520, y: 540, type: 'bananabread', requiredPlayer: 'Vilde' },
            { x: 760, y: 460, type: 'bananabread', requiredPlayer: 'Nora' },
            { x: 1010, y: 380, type: 'bananabread', requiredPlayer: 'Vilde' },
            { x: 1120, y: 660, type: 'bananabread', requiredPlayer: 'Nora' },
            // Optional powerups (not required for door)
            { x: 180, y: 520, type: 'snowflake', requiredPlayer: 'Vilde', optional: true },
            { x: 1020, y: 360, type: 'star', requiredPlayer: 'Nora', optional: true }
        ],
        monsters: [
            // Exactly two monsters: one of each (easy)
            { x: 280, y: 710, range: 300, name: 'Vetle', maxHealth: 2, speed: 1.8 },
            { x: 760, y: 510, range: 260, name: 'Vebjørn', maxHealth: 2, speed: 1.8 }
        ],
        door: { x: 1100, y: 620 }
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
            { x: 0, y: 720, w: 210, h: 26 },     // Start rock
            { x: 300, y: 660, w: 140, h: 26 },   // Rock hop
            { x: 420, y: 580, w: 90, h: 22 },    // Small ledge
            // Moving "raft" rock for spice
            { x: 540, y: 720, w: 110, h: 26, move: { axis: 'x', amp: 40, speed: 1.2, phase: 0.5 } },
            { x: 720, y: 600, w: 120, h: 26 },   // Cliff ledge
            { x: 980, y: 720, w: 220, h: 26 },   // Finish rock (door)
            { x: 560, y: 520, w: 100, h: 22 }    // High cliff
        ],
        collectibles: [
            // REQUIRED (exactly 6): kayaks, evenly along the route
            { x: 80, y: 680, type: 'kayak', requiredPlayer: 'Vilde' },
            { x: 340, y: 620, type: 'kayak', requiredPlayer: 'Nora' },
            { x: 460, y: 540, type: 'kayak', requiredPlayer: 'Vilde' },
            { x: 580, y: 680, type: 'kayak', requiredPlayer: 'Nora' },
            { x: 740, y: 560, type: 'kayak', requiredPlayer: 'Vilde' },
            { x: 1120, y: 680, type: 'kayak', requiredPlayer: 'Nora' },
            // Optional powerups
            { x: 580, y: 480, type: 'snowflake', requiredPlayer: 'Vilde', optional: true },
            { x: 620, y: 480, type: 'star', requiredPlayer: 'Nora', optional: true }
        ],
        monsters: [
            // Exactly two monsters (slightly harder)
            { x: 930, y: 710, range: 300, name: 'Vebjørn', maxHealth: 3, speed: 2.1 },
            { x: 430, y: 660, range: 240, name: 'Vetle', maxHealth: 3, speed: 2.1 }
        ],
        door: { x: 1100, y: 640 }
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
        // Level 3 complete redo: clear ascending route + segmented top ridge (no giant full-width platform).
        platforms: [
            { x: 0, y: 720, w: 200, h: 26 },      // Start ledge
            { x: 170, y: 640, w: 110, h: 22 },
            { x: 70, y: 560, w: 130, h: 22 },
            { x: 240, y: 500, w: 110, h: 22 },
            { x: 120, y: 420, w: 130, h: 22 },
            { x: 300, y: 360, w: 110, h: 22 },
            { x: 180, y: 280, w: 130, h: 22 },
            { x: 380, y: 220, w: 110, h: 22 },    // last step to bridge
            // Top ridge (segmented, requires a couple of careful jumps)
            { x: 0, y: 160, w: 260, h: 26 },
            { x: 340, y: 160, w: 220, h: 26 },
            { x: 640, y: 160, w: 220, h: 26 },
            { x: 940, y: 160, w: 260, h: 26 }
        ],
        collectibles: [
            // REQUIRED (exactly 6): skis, evenly spread along the climb + bridge
            { x: 60, y: 680, type: 'skis', requiredPlayer: 'Vilde' },
            { x: 190, y: 600, type: 'skis', requiredPlayer: 'Nora' },
            { x: 110, y: 520, type: 'skis', requiredPlayer: 'Vilde' },
            { x: 260, y: 440, type: 'skis', requiredPlayer: 'Nora' },
            { x: 200, y: 260, type: 'skis', requiredPlayer: 'Vilde' },
            { x: 1040, y: 120, type: 'skis', requiredPlayer: 'Nora' },
            // Optional powerups
            { x: 600, y: 160, type: 'snowflake', requiredPlayer: 'Vilde', optional: true },
            { x: 660, y: 160, type: 'star', requiredPlayer: 'Nora', optional: true }
        ],
        monsters: [
            // Exactly two monsters (medium)
            { x: 220, y: 710, range: 520, name: 'Vetle', maxHealth: 4, speed: 2.3 },
            { x: 820, y: 710, range: 420, name: 'Vebjørn', maxHealth: 4, speed: 2.3 }
        ],
        // Door on the final right segment (not overlapping any platform)
        door: { x: 1120, y: 80 }
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
            { x: 0, y: 720, w: 200, h: 26 },   // Start ledge
            { x: 230, y: 650, w: 120, h: 22 }, // Step
            // Rising bubble-platform (moving)
            { x: 420, y: 640, w: 80, h: 18, move: { axis: 'y', amp: 70, speed: 1.0, phase: 1.4 } },
            { x: 0, y: 550, w: 250, h: 30 },
            { x: 350, y: 550, w: 250, h: 30 },
            { x: 700, y: 550, w: 250, h: 30 },
            { x: 1050, y: 550, w: 150, h: 30 },
            { x: 450, y: 350, w: 300, h: 30 }, // Upper platform
            { x: 100, y: 200, w: 150, h: 30 }  // High platform
        ],
        collectibles: [
            // REQUIRED (exactly 6): snorkels, evenly spread
            { x: 60, y: 680, type: 'snorkel', requiredPlayer: 'Vilde' },
            { x: 260, y: 610, type: 'snorkel', requiredPlayer: 'Nora' },
            { x: 120, y: 510, type: 'snorkel', requiredPlayer: 'Vilde' },
            { x: 480, y: 510, type: 'snorkel', requiredPlayer: 'Nora' },
            { x: 600, y: 320, type: 'snorkel', requiredPlayer: 'Vilde' },
            { x: 150, y: 170, type: 'snorkel', requiredPlayer: 'Nora' },
            // Optional powerups
            { x: 1060, y: 510, type: 'snowflake', requiredPlayer: 'Vilde', optional: true },
            { x: 600, y: 240, type: 'star', requiredPlayer: 'Nora', optional: true }
        ],
        monsters: [
            // Exactly two monsters (medium+)
            { x: 360, y: 510, range: 300, name: 'Vebjørn', maxHealth: 5, speed: 2.5 },
            { x: 720, y: 510, range: 300, name: 'Vetle', maxHealth: 5, speed: 2.5 }
        ],
        door: { x: 1100, y: 470 }
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
            { x: 0, y: 720, w: 210, h: 26 },    // Start log
            { x: 250, y: 660, w: 120, h: 22 },
            { x: 420, y: 600, w: 120, h: 22 },
            { x: 590, y: 540, w: 120, h: 22 },
            { x: 760, y: 480, w: 120, h: 22 },
            { x: 930, y: 420, w: 120, h: 22 },
            { x: 980, y: 260, w: 200, h: 26 }, // Finish log (door)
            { x: 500, y: 720, w: 130, h: 26 }   // Mid safety log
        ],
        collectibles: [
            // REQUIRED (exactly 6): mushrooms, evenly spread
            { x: 60, y: 680, type: 'mushroom', requiredPlayer: 'Vilde' },
            { x: 300, y: 620, type: 'mushroom', requiredPlayer: 'Nora' },
            { x: 480, y: 560, type: 'mushroom', requiredPlayer: 'Vilde' },
            { x: 660, y: 500, type: 'mushroom', requiredPlayer: 'Nora' },
            { x: 840, y: 440, type: 'mushroom', requiredPlayer: 'Vilde' },
            { x: 1120, y: 220, type: 'mushroom', requiredPlayer: 'Nora' },
            // Optional powerups
            { x: 560, y: 680, type: 'heart', requiredPlayer: 'Nora', optional: true },
            { x: 700, y: 500, type: 'snowflake', requiredPlayer: 'Vilde', optional: true },
            { x: 1060, y: 220, type: 'star', requiredPlayer: 'Nora', optional: true }
        ],
        monsters: [
            // Exactly two monsters (hard)
            { x: 120, y: 710, range: 720, name: 'Vetle', maxHealth: 6, speed: 2.8 },
            { x: 520, y: 510, range: 480, name: 'Vebjørn', maxHealth: 6, speed: 2.8 }
        ],
        door: { x: 1100, y: 180 }
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
            { x: 0, y: 720, w: 210, h: 26 },    // Start ledge
            { x: 210, y: 650, w: 100, h: 22 },  // Step to sleigh
            // Sleigh
            { x: 100, y: 650, w: 600, h: 30, move: { axis: 'y', amp: 12, speed: 0.9, phase: 0.2 } }, // Runners (gentle bob)
            { x: 150, y: 550, w: 500, h: 30 }, // Base
            { x: 150, y: 400, w: 30, h: 150 }, // Back
            { x: 620, y: 450, w: 80, h: 100 }, // Front
            // Reindeer
            { x: 800, y: 400, w: 150, h: 30 },
            { x: 1000, y: 300, w: 150, h: 30 },
            { x: 200, y: 350, w: 100, h: 30 } // Gift platform
        ],
        collectibles: [
            // REQUIRED (exactly 6): presents, evenly spread
            { x: 60, y: 680, type: 'present', requiredPlayer: 'Vilde' },
            { x: 210, y: 610, type: 'present', requiredPlayer: 'Nora' },
            { x: 260, y: 310, type: 'present', requiredPlayer: 'Vilde' },
            { x: 420, y: 510, type: 'present', requiredPlayer: 'Nora' },
            { x: 840, y: 360, type: 'present', requiredPlayer: 'Vilde' },
            { x: 1100, y: 260, type: 'present', requiredPlayer: 'Nora' },
            // Optional powerups
            // Shields placed on solid, reachable platforms
            { x: 360, y: 520, type: 'heart', requiredPlayer: 'Vilde', optional: true }, // Sleigh base (y=550)
            { x: 320, y: 620, type: 'heart', requiredPlayer: 'Nora', optional: true },  // Sleigh runners (y=650, moving)
            { x: 860, y: 370, type: 'heart', requiredPlayer: 'Vilde', optional: true }, // Reindeer platform (y=400)
            { x: 1050, y: 240, type: 'snowflake', requiredPlayer: 'Nora', optional: true },
            { x: 420, y: 510, type: 'star', requiredPlayer: 'Vilde', optional: true }
        ],
        monsters: [
            // Exactly two monsters (final)
            { x: 220, y: 610, range: 620, name: 'Vebjørn', maxHealth: 7, speed: 3.1 },
            { x: 820, y: 360, range: 420, name: 'Vetle', maxHealth: 7, speed: 3.1 }
        ],
        // Door moved so it doesn't overlap the sleigh front block (x=620..700, y=450..550)
        door: { x: 720, y: 470 }
    }
];
