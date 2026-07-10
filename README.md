# Tactical FPS

A browser-based tactical first-person shooter built with Three.js. Inspired by classic round-based shooters.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser. Click the game window to lock your cursor and start playing.

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look around |
| Left Click | Shoot |
| Right Click | Aim down sights |
| R | Reload |
| 1 | Primary weapon |
| 2 | Pistol |
| B | Buy menu (buy phase only) |
| Shift | Sprint |
| Ctrl / C | Crouch |
| Space | Jump |
| Esc | Pause / Unlock cursor |
| Tab | Scoreboard |

## Gameplay

- **Round-based**: Each round starts with a buy phase where you can purchase weapons and equipment.
- **Buy Phase**: Press B to open the buy menu. Buy weapons based on your available money.
- **Combat Phase**: Eliminate all enemy bots to win the round.
- **Economy**: Earn money from kills and round wins. Spend wisely on weapons and armor.
- **Health & Armor**: Monitor your health and armor. Use cover and aim carefully.

## Weapon Stats

| Weapon | Price | Damage | Mag | RPM |
|--------|-------|--------|-----|-----|
| Tactical Pistol | $500 | 25 | 15 | 300 |
| Submachine Gun | $1,800 | 22 | 35 | 857 |
| Assault Rifle | $2,700 | 30 | 30 | 600 |
| Combat Shotgun | $2,200 | 15x8 | 8 | 100 |
| Sniper Rifle | $3,500 | 100 | 5 | 50 |

## Project Structure

```
/src
  main.js          - Entry point
  game.js          - Main game loop and coordination
  player.js        - Player entity (movement, health, armor)
  controls.js      - Keyboard, mouse, and touch input
  weaponSystem.js  - Weapon firing, reloading, and switching
  weapons.js       - Weapon definitions and stats
  enemy.js         - Enemy entity (model, health, states)
  enemyAI.js       - Enemy AI behavior (patrol, combat, cover)
  map.js           - Map/level creation with Three.js geometry
  collision.js     - AABB collision detection system
  effects.js       - Visual effects (muzzle flash, blood, impacts)
  audio.js         - Procedural audio system
  ui.js            - HUD and UI management
  buyMenu.js       - Buy menu for purchasing equipment
  roundSystem.js   - Round-based game mode
  utils.js         - Helper functions
/public            - Static assets directory
```

## Building for Production

```bash
npm run build
```

Output goes to the `dist/` directory.

## Customization

Edit `src/weapons.js` to adjust weapon stats. Edit `src/map.js` to modify the level layout. Edit `src/enemy.js` to change enemy bot behavior and difficulty.

## Requirements

- Node.js 16+
- Modern browser with WebGL support

## License

MIT
