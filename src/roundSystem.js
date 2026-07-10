// Round-based game mode system
// Manages buy phases, combat phases, round transitions, scoring, and economy

import { audio } from './audio.js';

export class RoundSystem {
  constructor(game) {
    this.game = game;
    this.round = 0;
    this.phase = 'idle'; // idle, buy, combat, roundEnd
    this.phaseTimer = 0;

    // Timing
    this.buyTime = 30;
    this.roundTime = 120;
    this.roundEndTime = 8;
    this.countdownTime = 3;

    // Score
    this.playerKills = 0;
    this.playerDeaths = 0;
    this.playerScore = 0;
    this.money = 800;

    // Money rewards
    this.killReward = 300;
    this.headshotBonus = 150;
    this.roundWinReward = 3000;
    this.roundLoseReward = 1400;

    // Round state
    this.enemiesAlive = 0;
    this.roundActive = false;
    this.buyMenuActive = false;

    // Kill tracking
    this.recentKills = [];
  }

  startNewRound() {
    this.round++;
    this.phase = 'buy';
    this.phaseTimer = this.buyTime;

    // Reset enemy count
    this.enemiesAlive = this.game.enemyAI.enemies.length;

    // Give lose bonus if applicable
    if (this.round > 1) {
      this.money += this.roundWinReward;
    }

    // Reset player
    this.game.player.reset();
    this.game.player.position.set(0, 0, 10);

    // Reset enemies
    this._resetEnemies();

    // Clear kill feed
    this.game.ui.killFeed.innerHTML = '';

    // Reset weapon system
    this.game.weaponSystem.reset();

    // Hide end screens
    this.game.ui.hideDeathScreen();
    this.game.ui.hideWinScreen();
    this.game.ui.hideRoundStart();

    // Phase UI
    this.game.ui.updateRoundPhase('BUY PHASE');
    this.game.ui.updateRoundTimer(this.phaseTimer);
    this.game.ui.updateMoney(this.money);

    // Show round start overlay
    this._startCountdown();
  }

  _startCountdown() {
    this.game.ui.showRoundStart(this.round, this.countdownTime);
    let count = this.countdownTime;

    const interval = setInterval(() => {
      count--;
      this.game.ui.roundCountdown.textContent = count;
      audio.play('roundStart', 0.3);

      if (count <= 0) {
        clearInterval(interval);
        this.game.ui.hideRoundStart();
        this.phase = 'combat';
        this.phaseTimer = this.roundTime;
        this.roundActive = true;
        this.game.ui.updateRoundPhase('COMBAT');
      }
    }, 1000);
  }

  _resetEnemies() {
    const spawns = this.game.map.getEnemySpawns();
    const difficulties = ['easy', 'normal', 'hard'];
    const enemyCount = Math.min(3 + this.round, 8);

    // Remove existing enemies
    this.game.enemyAI.clear();

    // Create new enemies
    for (let i = 0; i < enemyCount; i++) {
      const spawn = spawns[i % spawns.length];
      const diff = difficulties[Math.min(Math.floor(this.round / 2), difficulties.length - 1)];
    }
  }

  // Create enemies (called from game.js)
  createEnemies() {
    const spawns = this.game.map.getEnemySpawns();
    const difficulties = ['easy', 'normal', 'hard', 'elite'];
    const diffIndex = Math.min(Math.floor((this.round - 1) / 2), difficulties.length - 1);
    const enemyCount = Math.min(3 + this.round, 8);

    for (let i = 0; i < enemyCount; i++) {
      const spawn = spawns[i % spawns.length];
      const diff = difficulties[Math.min(diffIndex, difficulties.length - 1)];
      this.game.spawnEnemy(spawn, diff);
    }

    this.enemiesAlive = enemyCount;
  }

  onEnemyKilled(isHeadshot) {
    this.enemiesAlive--;

    // Money reward
    let reward = this.killReward;
    if (isHeadshot) reward += this.headshotBonus;
    this.money += reward;
    this.playerKills++;
    this.playerScore += 100 + (isHeadshot ? 50 : 0);

    // Check round win
    if (this.enemiesAlive <= 0) {
      this.endRound(true);
    }
  }

  onPlayerDied() {
    this.playerDeaths++;
    this.roundActive = false;

    // Show death screen after short delay
    setTimeout(() => {
      this.game.ui.showDeathScreen(this.playerKills, this.round);
      this.game.ui.updateScoreboard(this.playerKills, this.playerDeaths, this.playerScore);
    }, 1000);

    // End round after a longer delay
    setTimeout(() => {
      if (this.phase === 'combat') {
        this.endRound(false);
      }
    }, 3000);
  }

  endRound(won) {
    this.roundActive = false;
    this.phase = 'roundEnd';
    this.phaseTimer = this.roundEndTime;

    if (won) {
      this.money += this.roundWinReward;
      this.game.ui.showWinScreen(this.playerKills, this.roundWinReward);
      this.game.ui.showRoundMessage('ROUND WON', '#44ff66');
      audio.play('roundWin', 0.5);
    } else {
      this.money += this.roundLoseReward;
      this.game.ui.showRoundMessage('ROUND LOST', '#ff4444');
      audio.play('roundLose', 0.5);
    }

    this.game.ui.updateMoney(this.money);
    this.game.ui.updateScoreboard(this.playerKills, this.playerDeaths, this.playerScore);
  }

  update(delta) {
    if (this.phase === 'idle') return;

    this.phaseTimer -= delta;

    switch (this.phase) {
      case 'buy':
        this.game.ui.updateRoundTimer(this.phaseTimer);
        if (this.phaseTimer <= 0) {
          // Buy phase ended, transition to combat
          this.phase = 'combat';
          this.phaseTimer = this.roundTime;
          this.roundActive = true;
          this.game.ui.updateRoundPhase('COMBAT');
          this.game.ui.hideRoundStart();

          // Close buy menu
          if (this.game.buyMenu && this.game.buyMenu.isOpen) {
            this.game.buyMenu.close();
          }

          // Create enemies
          this.createEnemies();
        } else if (this.game.buyMenu && this.game.buyMenu.isOpen) {
          this.game.buyMenu.update(this.phaseTimer);
        }
        break;

      case 'combat':
        this.game.ui.updateRoundTimer(this.phaseTimer);
        if (this.phaseTimer <= 0) {
          // Time ran out - player loses
          this.endRound(false);
        }

        // Update enemy count on HUD
        if (this.game.ui) {
          // Could show remaining enemies
        }
        break;

      case 'roundEnd':
        this.game.ui.updateRoundTimer(this.phaseTimer);
        if (this.phaseTimer <= 0) {
          this.startNewRound();
        }
        break;
    }
  }

  addKillFeed(killer, victim, isHeadshot) {
    this.game.ui.addKillFeed(killer, victim, isHeadshot);

    // Track for scoreboard
    this.recentKills.push({ killer, victim, isHeadshot, time: performance.now() });
    if (this.recentKills.length > 20) this.recentKills.shift();
  }

  reset() {
    this.round = 0;
    this.phase = 'idle';
    this.playerKills = 0;
    this.playerDeaths = 0;
    this.playerScore = 0;
    this.money = 800;
    this.enemiesAlive = 0;
    this.recentKills = [];
  }
}
