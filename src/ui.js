// UI / HUD Manager
// Manages all HTML-based UI elements

export class UIManager {
  constructor() {
    // HUD Elements
    this.healthValue = document.getElementById('health-value');
    this.healthFill = document.getElementById('health-fill');
    this.armorValue = document.getElementById('armor-value');
    this.armorFill = document.getElementById('armor-fill');
    this.ammoMagazine = document.getElementById('ammo-magazine');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.weaponName = document.getElementById('weapon-name');
    this.moneyDisplay = document.getElementById('money');
    this.roundPhase = document.getElementById('round-phase');
    this.roundTimer = document.getElementById('round-timer');
    this.killFeed = document.getElementById('kill-feed');

    // Crosshair
    this.crosshair = document.getElementById('crosshair');
    this.crosshairLines = this.crosshair.querySelectorAll('.crosshair-line');

    // Hit Marker
    this.hitMarker = document.getElementById('hit-marker');
    this.hitMarkerTimeout = null;

    // Damage indicator
    this.damageIndicator = document.getElementById('damage-indicator');
    this.damageTimeout = null;

    // Low health vignette
    this.lowHealthVignette = document.getElementById('low-health-vignette');

    // Round messages
    this.roundMessage = document.getElementById('round-message');

    // Round start
    this.roundStart = document.getElementById('round-start');
    this.roundNumber = document.getElementById('round-number');
    this.roundCountdown = document.getElementById('round-countdown');

    // Death screen
    this.deathScreen = document.getElementById('death-screen');
    this.deathKills = document.getElementById('death-kills');
    this.deathRound = document.getElementById('death-round');

    // Win screen
    this.winScreen = document.getElementById('win-screen');
    this.winKills = document.getElementById('win-kills');
    this.winBonus = document.getElementById('win-bonus');

    // Scoreboard
    this.scoreboard = document.getElementById('scoreboard');
    this.sbKills = document.getElementById('sb-kills');
    this.sbDeaths = document.getElementById('sb-deaths');
    this.sbScore = document.getElementById('sb-score');

    // Pause
    this.pauseOverlay = document.getElementById('pause-overlay');
  }

  // Update HUD with current player/weapon state
  updateHUD(player, weapon) {
    if (!player || !weapon) return;

    // Health
    this.healthValue.textContent = Math.round(player.health);
    this.healthFill.style.width = `${(player.health / player.maxHealth) * 100}%`;

    // Armor
    this.armorValue.textContent = Math.round(player.armor);
    this.armorFill.style.width = `${(player.armor / player.maxArmor) * 100}%`;

    // Ammo
    this.ammoMagazine.textContent = weapon.ammo;
    this.ammoReserve.textContent = weapon.reserveAmmo;
    this.weaponName.textContent = weapon.data.name;

    // Low health vignette
    if (player.health < 30) {
      this.lowHealthVignette.style.opacity = 1 - (player.health / 30) * 0.5;
    } else {
      this.lowHealthVignette.style.opacity = 0;
    }
  }

  updateMoney(money) {
    this.moneyDisplay.textContent = `$${money}`;
  }

  updateRoundPhase(phase) {
    this.roundPhase.textContent = phase;
  }

  updateRoundTimer(seconds) {
    this.roundTimer.textContent = Math.ceil(seconds);
  }

  // Crosshair spread
  updateCrosshair(spread) {
    const size = 4 + spread * 200;
    this.crosshairLines.forEach(line => {
      if (line.classList.contains('top')) line.style.top = `-${size}px`;
      if (line.classList.contains('bottom')) line.style.bottom = `-${size}px`;
      if (line.classList.contains('left')) line.style.left = `-${size}px`;
      if (line.classList.contains('right')) line.style.right = `-${size}px`;
    });
  }

  // Show hit marker
  showHitMarker(headshot = false) {
    this.hitMarker.classList.add('show');
    if (headshot) {
      this.hitMarker.querySelectorAll('.hit-line').forEach(l => l.style.borderColor = '#ffaa00');
    } else {
      this.hitMarker.querySelectorAll('.hit-line').forEach(l => l.style.borderColor = '#ff4444');
    }

    clearTimeout(this.hitMarkerTimeout);
    this.hitMarkerTimeout = setTimeout(() => {
      this.hitMarker.classList.remove('show');
    }, headshot ? 200 : 100);
  }

  // Show damage indicator
  showDamageIndicator(direction) {
    this.damageIndicator.classList.add('show');
    clearTimeout(this.damageTimeout);
    this.damageTimeout = setTimeout(() => {
      this.damageIndicator.classList.remove('show');
    }, 300);
  }

  // Add kill feed entry
  addKillFeed(killer, victim, isHeadshot) {
    const entry = document.createElement('div');
    entry.className = 'kill-feed-entry';
    entry.textContent = `${killer} → ${victim}${isHeadshot ? ' HEADSHOT' : ''}`;
    this.killFeed.appendChild(entry);

    // Remove after 5 seconds
    setTimeout(() => {
      if (entry.parentNode) entry.remove();
    }, 5000);

    // Limit to 5 entries
    while (this.killFeed.children.length > 5) {
      this.killFeed.children[0].remove();
    }
  }

  // Show round message
  showRoundMessage(text, color = '#ffffff', duration = 2000) {
    this.roundMessage.textContent = text;
    this.roundMessage.style.color = color;
    this.roundMessage.classList.add('show');

    setTimeout(() => {
      this.roundMessage.classList.remove('show');
    }, duration);
  }

  // Round start countdown
  showRoundStart(round, countdown) {
    this.roundStart.classList.remove('hidden');
    this.roundNumber.textContent = `Round ${round}`;
    this.roundCountdown.textContent = countdown;
  }

  hideRoundStart() {
    this.roundStart.classList.add('hidden');
  }

  // Death screen
  showDeathScreen(kills, round) {
    this.deathScreen.classList.remove('hidden');
    this.deathKills.textContent = kills;
    this.deathRound.textContent = round;
  }

  hideDeathScreen() {
    this.deathScreen.classList.add('hidden');
  }

  // Win screen
  showWinScreen(kills, bonus) {
    this.winScreen.classList.remove('hidden');
    this.winKills.textContent = kills;
    this.winBonus.textContent = `$${bonus}`;
  }

  hideWinScreen() {
    this.winScreen.classList.add('hidden');
  }

  // Scoreboard
  showScoreboard() {
    this.scoreboard.classList.remove('hidden');
  }

  hideScoreboard() {
    this.scoreboard.classList.add('hidden');
  }

  updateScoreboard(kills, deaths, score) {
    this.sbKills.textContent = kills;
    this.sbDeaths.textContent = deaths;
    this.sbScore.textContent = score;
  }

  // Pause
  showPause() {
    this.pauseOverlay.classList.remove('hidden');
  }

  hidePause() {
    this.pauseOverlay.classList.add('hidden');
  }

  // Toggle buy menu visibility
  toggleBuyMenu(visible) {
    const menu = document.getElementById('buy-menu');
    if (visible) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  }
}
