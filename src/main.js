// Entry point
// Initializes and starts the game

import { Game } from './game.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initial loading message
  const loadingEl = document.createElement('div');
  loadingEl.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    font-family: 'Courier New', monospace;
    font-size: 18px;
    letter-spacing: 3px;
    z-index: 100;
    text-align: center;
  `;
  loadingEl.textContent = 'LOADING...';
  document.body.appendChild(loadingEl);

  // Start game
  try {
    const game = new Game();
    game.init().then(() => {
      loadingEl.remove();

      // Show start hint
      if (!game.isMobile) {
        const hintEl = document.createElement('div');
        hintEl.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: rgba(255,255,255,0.6);
          font-family: 'Courier New', monospace;
          font-size: 14px;
          letter-spacing: 2px;
          z-index: 100;
          text-align: center;
          pointer-events: none;
          text-shadow: 0 0 20px rgba(0,0,0,0.8);
        `;
        hintEl.id = 'start-hint';
        hintEl.innerHTML = 'Click to start<br><span style="font-size:11px;opacity:0.5;">WASD Move | Mouse Look | Left Click Shoot</span>';

        // Show hint until pointer is locked
        const checkLock = setInterval(() => {
          if (game.controls.isLocked) {
            hintEl.remove();
            clearInterval(checkLock);
          }
        }, 100);

        document.body.appendChild(hintEl);
      }

      // Expose game to console for debugging
      window.game = game;
    });
  } catch (e) {
    loadingEl.textContent = 'Failed to load game';
    loadingEl.style.color = '#ff4444';
    console.error('Game initialization failed:', e);
  }
});

// Handle unhandled errors
window.addEventListener('error', (e) => {
  console.error('Runtime error:', e.error || e.message);
});

// Handle WebGL not supported
if (!window.WebGLRenderingContext) {
  const errEl = document.createElement('div');
  errEl.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ff4444;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    text-align: center;
    z-index: 100;
  `;
  errEl.textContent = 'WebGL is not supported in your browser. Please use a modern browser.';
  document.body.appendChild(errEl);
}
