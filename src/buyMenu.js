// Buy Menu System
// Allows players to purchase weapons and equipment between rounds

import { WEAPONS } from './weapons.js';

export class BuyMenu {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.element = document.getElementById('buy-menu');
    this.buyItems = document.getElementById('buy-items');
    this.buyTimer = document.getElementById('buy-timer');
    this.buyMoney = document.getElementById('buy-money');

    this.availableItems = [
      { id: 'pistol', ...WEAPONS.pistol, category: 'secondary' },
      { id: 'smg', ...WEAPONS.smg, category: 'primary' },
      { id: 'rifle', ...WEAPONS.rifle, category: 'primary' },
      { id: 'shotgun', ...WEAPONS.shotgun, category: 'primary' },
      { id: 'sniper', ...WEAPONS.sniper, category: 'primary' },
      { id: 'armor', name: 'Body Armor', price: 650, category: 'equipment', description: 'Reduces damage taken by 50%' },
      { id: 'grenade', name: 'Frag Grenade', price: 300, category: 'equipment', description: 'Explosive fragmentation grenade' }
    ];
  }

  open() {
    this.isOpen = true;
    this.element.classList.remove('hidden');
    this.render();
    if (this.game.controls.isLocked) {
      this.game.controls.unlock();
    }
  }

  close() {
    this.isOpen = false;
    this.element.classList.add('hidden');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  render() {
    this.buyItems.innerHTML = '';
    this.buyMoney.textContent = `$${this.game.money}`;

    this.availableItems.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'buy-item';

      const owned = this._isOwned(item);
      if (owned) div.classList.add('owned');

      const key = index + 1;
      div.innerHTML = `
        <div class="buy-item-name">${key}. ${item.name}</div>
        <div class="buy-item-price">$${item.price}</div>
        <div class="buy-item-stats">
          ${item.damage ? `DMG: ${item.damage}${item.pellets ? `x${item.pellets}` : ''}` : ''}
          ${item.magazineSize ? `MAG: ${item.magazineSize}` : ''}
          ${item.fireRate ? `RPM: ${Math.round(60000 / item.fireRate)}` : ''}
        </div>
        <div class="buy-item-desc">${item.description}</div>
      `;

      div.addEventListener('click', () => this.buy(index));
      div.addEventListener('mouseenter', () => {
        div.style.background = 'rgba(255,255,255,0.08)';
      });
      div.addEventListener('mouseleave', () => {
        div.style.background = '';
      });

      this.buyItems.appendChild(div);
    });
  }

  _isOwned(item) {
    if (item.id === 'armor') {
      return this.game.player.armor >= 100;
    }
    if (item.category === 'primary') {
      return this.game.weaponSystem.primaryWeapon &&
             this.game.weaponSystem.primaryWeapon.data.id === item.id;
    }
    if (item.category === 'secondary') {
      return this.game.weaponSystem.secondaryWeapon &&
             this.game.weaponSystem.secondaryWeapon.data.id === item.id;
    }
    return false;
  }

  buy(index) {
    const item = this.availableItems[index];
    if (!item) return;

    // Check if already owned
    if (this._isOwned(item)) return;

    // Check money
    if (this.game.money < item.price) return;

    this.game.money -= item.price;
    this._purchaseItem(item);
    this.render();
  }

  _purchaseItem(item) {
    switch (item.category) {
      case 'primary':
        this.game.weaponSystem.buyWeapon(item.id);
        break;
      case 'secondary':
        this.game.weaponSystem.buyWeapon(item.id);
        break;
      case 'equipment':
        if (item.id === 'armor') {
          this.game.player.addArmor(100);
        } else if (item.id === 'grenade') {
          this.game.grenades = (this.game.grenades || 0) + 1;
        }
        break;
    }
  }

  update(timeRemaining) {
    if (!this.isOpen) return;

    // Handle keyboard shortcuts (1-8)
    const keyMap = ['1', '2', '3', '4', '5', '6', '7', '8'];
    for (let i = 0; i < keyMap.length; i++) {
      if (this.game.controls.weaponSlots[keyMap[i]]) {
        this.buy(i);
        this.game.controls.weaponSlots[keyMap[i]] = false;
      }
    }

    // Update timer
    this.buyTimer.textContent = `Time remaining: ${Math.ceil(timeRemaining)}`;
    this.buyMoney.textContent = `$${this.game.money}`;
  }
}
