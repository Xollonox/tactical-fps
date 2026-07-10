// Input controls management
// Handles keyboard, mouse, touch input

import { audio } from './audio.js';

export class Controls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement keys
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      crouch: false,
      reload: false
    };

    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      left: false,
      right: false,
      middle: false
    };

    // Weapon slots
    this.weaponSlots = {
      '1': true, '2': true, '3': true, '4': true, '5': true
    };

    // Actions
    this.actions = {
      buy: false,
      pause: false,
      scoreboard: false,
      use: false
    };

    this.isLocked = false;
    this.sensitivity = 0.002;
    this.mouseSmooth = 0.3;

    this._prevMouseX = 0;
    this._prevMouseY = 0;
    this._smoothDX = 0;
    this._smoothDY = 0;

    // Touch controls for mobile
    this.touch = {
      leftStick: { active: false, x: 0, y: 0 },
      rightStick: { active: false, x: 0, y: 0 },
      shooting: false,
      aiming: false
    };
    this.isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

    this._setupListeners();
  }

  _setupListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => this._onKeyDown(e));
    document.addEventListener('keyup', (e) => this._onKeyUp(e));

    // Mouse
    this.domElement.addEventListener('mousedown', (e) => this._onMouseDown(e));
    this.domElement.addEventListener('mouseup', (e) => this._onMouseUp(e));
    document.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.domElement.addEventListener('click', () => this._onClick());

    // Pointer lock
    document.addEventListener('pointerlockchange', () => this._onPointerLockChange());

    // Context menu
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch (mobile)
    if (this.isMobile) {
      this._setupTouchControls();
    }

    // Prevent default for game keys to avoid scrolling
    window.addEventListener('keydown', (e) => {
      if ([' ', 'Shift', 'Control', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = true; break;
      case 'KeyS': this.keys.backward = true; break;
      case 'KeyA': this.keys.left = true; break;
      case 'KeyD': this.keys.right = true; break;
      case 'Space': this.keys.jump = true; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
      case 'ControlLeft': case 'ControlRight': case 'KeyC': this.keys.crouch = true; break;
      case 'KeyR': this.keys.reload = true; break;
      case 'KeyB': this.actions.buy = true; break;
      case 'Escape': this.actions.pause = true; break;
      case 'Tab': this.actions.scoreboard = true; break;
      case 'KeyE': this.actions.use = true; break;
      case 'Digit1': case 'Numpad1': this.weaponSlots['1'] = true; break;
      case 'Digit2': case 'Numpad2': this.weaponSlots['2'] = true; break;
      case 'Digit3': case 'Numpad3': this.weaponSlots['3'] = true; break;
      case 'Digit4': case 'Numpad4': this.weaponSlots['4'] = true; break;
      case 'Digit5': case 'Numpad5': this.weaponSlots['5'] = true; break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW': this.keys.forward = false; break;
      case 'KeyS': this.keys.backward = false; break;
      case 'KeyA': this.keys.left = false; break;
      case 'KeyD': this.keys.right = false; break;
      case 'Space': this.keys.jump = false; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
      case 'ControlLeft': case 'ControlRight': case 'KeyC': this.keys.crouch = false; break;
      case 'Tab': this.actions.scoreboard = false; break;
    }
  }

  _onMouseDown(e) {
    if (!this.isLocked) return;
    switch (e.button) {
      case 0: this.mouse.left = true; break;
      case 2: this.mouse.right = true; break;
      case 1: this.mouse.middle = true; break;
    }
  }

  _onMouseUp(e) {
    switch (e.button) {
      case 0: this.mouse.left = false; break;
      case 2: this.mouse.right = false; break;
      case 1: this.mouse.middle = false; break;
    }
  }

  _onMouseMove(e) {
    if (this.isLocked) {
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    }
  }

  _onClick() {
    if (!this.isLocked) {
      this.domElement.requestPointerLock();
    } else {
      audio.resume();
    }
  }

  _onPointerLockChange() {
    this.isLocked = document.pointerLockElement === this.domElement;
  }

  _setupTouchControls() {
    // Create mobile control elements
    const container = document.getElementById('game-container') || document.body;
    const mobileUI = document.createElement('div');
    mobileUI.id = 'mobile-controls';
    mobileUI.style.cssText = 'display:block;position:fixed;top:0;left:0;width:100%;height:100%;z-index:5;pointer-events:none;';

    // Left joystick (movement)
    const leftJoy = document.createElement('div');
    leftJoy.className = 'mobile-joystick';
    leftJoy.id = 'mobile-joystick-left';
    leftJoy.innerHTML = '<div class="mobile-joystick-knob"></div>';

    // Right joystick (look)
    const rightJoy = document.createElement('div');
    rightJoy.className = 'mobile-joystick';
    rightJoy.id = 'mobile-joystick-right';
    rightJoy.innerHTML = '<div class="mobile-joystick-knob"></div>';

    // Action buttons
    const btns = document.createElement('div');
    btns.className = 'mobile-buttons';
    btns.innerHTML = `
      <div class="mobile-btn" id="mbtn-jump">JUMP</div>
      <div class="mobile-btn" id="mbtn-crouch">CROUCH</div>
      <div class="mobile-btn" id="mbtn-reload">R</div>
      <div class="mobile-btn" id="mbtn-fire">FIRE</div>
    `;

    mobileUI.appendChild(leftJoy);
    mobileUI.appendChild(rightJoy);
    mobileUI.appendChild(btns);
    container.appendChild(mobileUI);

    // Joystick handling
    this._setupJoystick(leftJoy, 'leftStick');
    this._setupJoystick(rightJoy, 'rightStick');

    // Button handling
    document.getElementById('mbtn-fire').addEventListener('touchstart', (e) => { e.preventDefault(); this.touch.shooting = true; });
    document.getElementById('mbtn-fire').addEventListener('touchend', (e) => { e.preventDefault(); this.touch.shooting = false; });
    document.getElementById('mbtn-jump').addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.jump = true; });
    document.getElementById('mbtn-jump').addEventListener('touchend', (e) => { e.preventDefault(); this.keys.jump = false; });
    document.getElementById('mbtn-crouch').addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.crouch = true; });
    document.getElementById('mbtn-crouch').addEventListener('touchend', (e) => { e.preventDefault(); this.keys.crouch = false; });
    document.getElementById('mbtn-reload').addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.reload = true; });
    document.getElementById('mbtn-reload').addEventListener('touchend', (e) => { e.preventDefault(); this.keys.reload = false; });
  }

  _setupJoystick(element, stickName) {
    const knob = element.querySelector('.mobile-joystick-knob');
    const rect = element.getBoundingClientRect();
    const maxDist = 35;

    const onStart = (e) => {
      e.preventDefault();
      this.touch[stickName].active = true;
      const touch = e.touches[0];
      this._updateJoystick(element, knob, touch, maxDist, stickName);
    };

    const onMove = (e) => {
      e.preventDefault();
      if (this.touch[stickName].active) {
        const touch = e.touches[0];
        this._updateJoystick(element, knob, touch, maxDist, stickName);
      }
    };

    const onEnd = (e) => {
      e.preventDefault();
      this.touch[stickName].active = false;
      this.touch[stickName].x = 0;
      this.touch[stickName].y = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };

    element.addEventListener('touchstart', onStart, { passive: false });
    element.addEventListener('touchmove', onMove, { passive: false });
    element.addEventListener('touchend', onEnd, { passive: false });
    element.addEventListener('touchcancel', onEnd, { passive: false });
  }

  _updateJoystick(element, knob, touch, maxDist, stickName) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      dx = dx / dist * maxDist;
      dy = dy / dist * maxDist;
    }

    this.touch[stickName].x = dx / maxDist;
    this.touch[stickName].y = dy / maxDist;

    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  // Update mouse deltas and consume them
  getMouseDelta() {
    const dx = this.mouse.dx;
    const dy = this.mouse.dy;

    // Smooth the mouse movement
    this._smoothDX = this._smoothDX * this.mouseSmooth + dx * (1 - this.mouseSmooth);
    this._smoothDY = this._smoothDY * this.mouseSmooth + dy * (1 - this.mouseSmooth);

    this.mouse.dx = 0;
    this.mouse.dy = 0;

    if (!this.isLocked && !this.isMobile) {
      return { x: 0, y: 0 };
    }

    return {
      x: this._smoothDX * this.sensitivity,
      y: this._smoothDY * this.sensitivity
    };
  }

  // Consume one-shot actions (returns true once per press)
  consumeAction(action) {
    if (this.actions[action]) {
      this.actions[action] = false;
      return true;
    }
    return false;
  }

  consumeKey(key) {
    if (this.keys[key]) {
      this.keys[key] = false;
      return true;
    }
    return false;
  }

  consumeWeaponSlot() {
    for (const [slot, pressed] of Object.entries(this.weaponSlots)) {
      if (pressed) {
        this.weaponSlots[slot] = false;
        return parseInt(slot);
      }
    }
    return null;
  }

  // Request pointer lock
  lock() {
    if (!this.isLocked) {
      this.domElement.requestPointerLock();
    }
  }

  unlock() {
    if (this.isLocked) {
      document.exitPointerLock();
    }
  }

  // For mobile: get look input from right stick
  getMobileLook() {
    if (!this.isMobile) return { x: 0, y: 0 };
    return {
      x: this.touch.rightStick.x * 0.02,
      y: this.touch.rightStick.y * 0.02
    };
  }

  // Get movement input (combines keyboard and touch)
  getMovementInput() {
    if (this.isMobile && this.touch.leftStick.active) {
      return {
        forward: this.touch.leftStick.y < -0.2,
        backward: this.touch.leftStick.y > 0.2,
        left: this.touch.leftStick.x < -0.2,
        right: this.touch.leftStick.x > 0.2
      };
    }
    return {
      forward: this.keys.forward,
      backward: this.keys.backward,
      left: this.keys.left,
      right: this.keys.right
    };
  }

  isShooting() {
    return this.mouse.left || this.touch.shooting;
  }

  isAiming() {
    return this.mouse.right || this.touch.aiming;
  }
}
