# Julekos - Christmas Platformer Game

## Project Overview
Vanilla JavaScript platformer with Japanese aesthetic and Web Audio API chiptune music. No build tools or frameworks—everything runs directly in the browser. Files load via `<script>` tags in [index.html](../index.html).

## Architecture

### Three-File Structure
- **[game.js](../game.js)** (326 lines): Canvas-based game loop, physics engine, collision detection
- **[music.js](../music.js)** (192 lines): Web Audio API implementation of "All I Want for Christmas is You"
- **[style.css](../style.css)**: Gradient background, pixel-art rendering hints, UI overlays

### Key Dependencies
- HTML5 Canvas API with 2D context
- Web Audio API (OscillatorNode with square wave for chiptune sound)
- RequestAnimationFrame for game loop

## Critical Patterns

### Physics System
All physics in `updatePlayer()` function. Gravity constant: `0.6`, terminal velocity: `15`, player speed: `5`. Platform collision uses AABB detection via `checkCollision()`. Player state includes `onGround` flag for jump control.

**Example collision pattern:**
```javascript
// Landing from above - must check velocityY > 0 AND player.y < platform.y
if (player.velocityY > 0 && player.y < platform.y) {
    player.y = platform.y - player.height;
    player.velocityY = 0;
    player.onGround = true;
}
```

### Audio Architecture
Music requires user interaction to initialize (`AudioContext`). Melody defined as array of `{note, duration}` objects with exact timing at 120 BPM. Notes use square wave oscillators with envelope shaping. Looping handled via `setTimeout` after total melody duration.

**Timing constants:**
```javascript
TEMPO = 120; // BPM
QUARTER_NOTE = 60 / TEMPO; // 0.5s
```

### Japanese Aesthetic
Cherry blossom collectibles drawn as 5-petal flowers using ellipses. Player sprite: red "kimono" body (`#c94a4a`), pixelated head with black hair. Platforms: stone gray (`#6b5b4f`) with moss overlay. Background: gradient sky with layered mountain silhouettes.

## Development Workflow

### Testing
Open [index.html](../index.html) directly in browser (no server needed). Click/press key to start audio. Use arrow keys or WASD + Space to test physics.

### Adding Game Objects
1. Define object in respective array (`platforms`, `collectibles`) with `x, y, width, height` properties
2. Draw in `draw()` function (called every frame)
3. Handle collisions in `updatePlayer()` if physics interaction needed

### Modifying Music
Edit `melody` array in [music.js](../music.js). Use note frequencies from `notes` object. Durations based on TEMPO constants (QUARTER_NOTE, EIGHTH_NOTE, etc.). Add `{ note: 0, duration: X }` for rests.

## Common Gotchas

- Canvas uses pixel coordinates—use `Math.floor()` for crisp pixel art rendering
- Audio won't play without user gesture—ensure `initAudio()` called from event listener
- Platform collision order matters—check top collision before side collisions
- Collectibles don't auto-remove—set `collected: true` flag and check before rendering
- Progress counter updates in `updateProgress()`—trip reveal logic at `gameState.progress >= 10`

## Project-Specific Conventions

- **No classes:** Everything uses plain objects and functions
- **Global state:** `gameState`, `player`, `platforms`, `collectibles` all module-level
- **Rendering:** All draw functions use `ctx` directly, no abstraction layers
- **Input:** Key states stored in `keys` object, checked each frame in `updatePlayer()`
- **Colors:** Hex values inline (no CSS variables), Japanese-inspired palette throughout
