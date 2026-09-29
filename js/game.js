class Game {
  constructor(canvas, mode, team1Data, team2Data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = mode;
    this.team1Data = team1Data;
    this.team2Data = team2Data;
    this.numPlayers = MODE_CONFIG[mode].players;

    this.BUTTON_RADIUS = 18;
    this.BALL_RADIUS = 10;
    this.GOAL_DEPTH = 30;
    this.SHOOT_FORCE = 18;

    this.score = [0, 0];
    this.currentTeam = 1;
    this.state = 'waiting'; // waiting, aiming, shooting, animating, goal, paused, ended
    this.prevState = null;

    this.selectedButton = null;
    this.aimStart = null;
    this.aimEnd = null;
    this.power = 0;

    this.timeLeft = 300; // 5 minutes
    this.lastTick = 0;
    this.animFrame = null;

    this.team1Buttons = [];
    this.team2Buttons = [];

    this.onGoal = null;
    this.onTimeUpdate = null;
    this.onTurnChange = null;
    this.onGameOver = null;

    this.resize();
    this.initPhysics();
    this.setupPositions();
    this.bindEvents();
  }

  resize() {
    const wrapper = this.canvas.parentElement;
    const maxW = wrapper.clientWidth - 16;
    const maxH = wrapper.clientHeight - 16;
    const aspect = 3 / 2;

    let w, h;
    if (maxW / maxH > aspect) {
      h = maxH;
      w = h * aspect;
    } else {
      w = maxW;
      h = w / aspect;
    }

    this.fieldW = Math.floor(w);
    this.fieldH = Math.floor(h);
    this.canvas.width = this.fieldW;
    this.canvas.height = this.fieldH;

    this.goalH = this.fieldH * 0.3;
    this.goalDepth = this.GOAL_DEPTH;
  }

  initPhysics() {
    this.physics = new PhysicsEngine(this.fieldW, this.fieldH, this.goalDepth, this.goalH);
    this.ball = new PhysicsBody(this.fieldW / 2, this.fieldH / 2, this.BALL_RADIUS, 0.5);
    this.ball.friction = 0.99;
    this.physics.setBall(this.ball);
  }

  setupPositions() {
    this.team1Buttons = [];
    this.team2Buttons = [];

    const positions1 = this.getFormation(1);
    const positions2 = this.getFormation(2);

    for (const p of positions1) {
      const btn = new PhysicsBody(p.x, p.y, this.BUTTON_RADIUS, 2);
      btn.team = 1;
      this.team1Buttons.push(btn);
      this.physics.addBody(btn);
    }

    for (const p of positions2) {
      const btn = new PhysicsBody(p.x, p.y, this.BUTTON_RADIUS, 2);
      btn.team = 2;
      this.team2Buttons.push(btn);
      this.physics.addBody(btn);
    }
  }

  getFormation(team) {
    const n = this.numPlayers;
    const w = this.fieldW;
    const h = this.fieldH;
    const positions = [];

    if (team === 1) {
      // GK
      positions.push({ x: w * 0.08, y: h * 0.5 });
      if (n >= 3) {
        // Defenders
        positions.push({ x: w * 0.2, y: h * 0.35 });
        positions.push({ x: w * 0.2, y: h * 0.65 });
      }
      if (n >= 5) {
        // Midfielders
        positions.push({ x: w * 0.35, y: h * 0.3 });
        positions.push({ x: w * 0.35, y: h * 0.7 });
      }
      if (n >= 7) {
        // Forwards
        positions.push({ x: w * 0.45, y: h * 0.4 });
        positions.push({ x: w * 0.45, y: h * 0.6 });
      }
    } else {
      positions.push({ x: w * 0.92, y: h * 0.5 });
      if (n >= 3) {
        positions.push({ x: w * 0.8, y: h * 0.35 });
        positions.push({ x: w * 0.8, y: h * 0.65 });
      }
      if (n >= 5) {
        positions.push({ x: w * 0.65, y: h * 0.3 });
        positions.push({ x: w * 0.65, y: h * 0.7 });
      }
      if (n >= 7) {
        positions.push({ x: w * 0.55, y: h * 0.4 });
        positions.push({ x: w * 0.55, y: h * 0.6 });
      }
    }
    return positions;
  }

  resetPositions() {
    const p1 = this.getFormation(1);
    const p2 = this.getFormation(2);
    this.team1Buttons.forEach((b, i) => {
      b.pos = new Vec2(p1[i].x, p1[i].y);
      b.vel = new Vec2();
    });
    this.team2Buttons.forEach((b, i) => {
      b.pos = new Vec2(p2[i].x, p2[i].y);
      b.vel = new Vec2();
    });
    this.ball.pos = new Vec2(this.fieldW / 2, this.fieldH / 2);
    this.ball.vel = new Vec2();
  }

  bindEvents() {
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);
    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);

    this.canvas.addEventListener('mousedown', this._onMouseDown);
    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseup', this._onMouseUp);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd);
  }

  unbindEvents() {
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mouseup', this._onMouseUp);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchmove', this._onTouchMove);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return new Vec2(
      (e.clientX - rect.left) * scaleX,
      (e.clientY - rect.top) * scaleY
    );
  }

  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }

  onTouchEnd(e) {
    this.onMouseUp(e);
  }

  onMouseDown(e) {
    if (this.state !== 'waiting') return;
    const pos = this.getCanvasPos(e);
    const buttons = this.currentTeam === 1 ? this.team1Buttons : this.team2Buttons;

    for (const btn of buttons) {
      if (pos.sub(btn.pos).len() < btn.radius + 8) {
        this.selectedButton = btn;
        this.aimStart = pos;
        this.aimEnd = pos;
        this.state = 'aiming';
        return;
      }
    }
  }

  onMouseMove(e) {
    if (this.state !== 'aiming' || !this.selectedButton) return;
    this.aimEnd = this.getCanvasPos(e);
    const diff = this.aimStart.sub(this.aimEnd);
    this.power = Math.min(diff.len() / 150, 1);
  }

  onMouseUp(_e) {
    if (this.state !== 'aiming' || !this.selectedButton) return;

    const diff = this.aimStart.sub(this.aimEnd);
    const force = Math.min(diff.len() / 150, 1) * this.SHOOT_FORCE;

    if (force > 0.5) {
      const dir = diff.norm();
      this.selectedButton.vel = dir.scale(force * 60);
      this.state = 'animating';
      this.power = 0;
      if (this.onPowerChange) this.onPowerChange(0);
    } else {
      this.state = 'waiting';
      this.power = 0;
    }

    this.selectedButton = null;
    this.aimStart = null;
    this.aimEnd = null;
  }

  start() {
    this.lastTick = performance.now();
    this.state = 'waiting';
    this.loop();
  }

  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTick) / 1000, 0.05);
    this.lastTick = now;

    if (this.state !== 'paused' && this.state !== 'ended' && this.state !== 'goal') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endGame();
        return;
      }
      if (this.onTimeUpdate) this.onTimeUpdate(this.timeLeft);
    }

    if (this.state === 'animating') {
      this.physics.update(dt * 60);

      const goalScorer = this.physics.checkGoal();
      if (goalScorer > 0) {
        this.score[goalScorer - 1]++;
        this.state = 'goal';
        if (this.onGoal) this.onGoal(goalScorer, this.score);
        setTimeout(() => {
          this.resetPositions();
          this.currentTeam = goalScorer === 1 ? 2 : 1;
          this.state = 'waiting';
          if (this.onTurnChange) this.onTurnChange(this.currentTeam);
        }, 2000);
      } else if (this.physics.allStopped()) {
        this.currentTeam = this.currentTeam === 1 ? 2 : 1;
        this.state = 'waiting';
        if (this.onTurnChange) this.onTurnChange(this.currentTeam);
      }
    }

    this.draw();
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  pause() {
    if (this.state === 'paused' || this.state === 'ended') return;
    this.prevState = this.state;
    this.state = 'paused';
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = this.prevState || 'waiting';
    this.prevState = null;
    this.lastTick = performance.now();
  }

  endGame() {
    this.state = 'ended';
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.onGameOver) this.onGameOver(this.score);
  }

  destroy() {
    this.state = 'ended';
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.unbindEvents();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.fieldW;
    const h = this.fieldH;

    // Field background
    ctx.fillStyle = '#1b7a2d';
    ctx.fillRect(0, 0, w, h);

    // Field stripes
    const stripeW = w / 12;
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        ctx.fillRect(i * stripeW, 0, stripeW, h);
      }
    }

    // Goals
    const goalTop = (h - this.goalH) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-this.goalDepth, goalTop, this.goalDepth, this.goalH);
    ctx.fillRect(w, goalTop, this.goalDepth, this.goalH);

    // Goal nets pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let y = goalTop; y < goalTop + this.goalH; y += 10) {
      ctx.beginPath();
      ctx.moveTo(-this.goalDepth, y);
      ctx.lineTo(0, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w, y);
      ctx.lineTo(w + this.goalDepth, y);
      ctx.stroke();
    }

    // Field lines
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;

    // Outline
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Center line
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, h * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Penalty areas
    const penW = w * 0.15;
    const penH = h * 0.5;
    const penTop = (h - penH) / 2;
    ctx.strokeRect(0, penTop, penW, penH);
    ctx.strokeRect(w - penW, penTop, penW, penH);

    // Small boxes
    const smW = w * 0.06;
    const smH = h * 0.25;
    const smTop = (h - smH) / 2;
    ctx.strokeRect(0, smTop, smW, smH);
    ctx.strokeRect(w - smW, smTop, smW, smH);

    // Goal posts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, goalTop - 4, 6, 8);
    ctx.fillRect(-2, goalTop + this.goalH - 4, 6, 8);
    ctx.fillRect(w - 4, goalTop - 4, 6, 8);
    ctx.fillRect(w - 4, goalTop + this.goalH - 4, 6, 8);

    // Draw buttons
    this.drawTeamButtons(ctx, this.team1Buttons, this.team1Data, 1);
    this.drawTeamButtons(ctx, this.team2Buttons, this.team2Data, 2);

    // Draw ball
    this.drawBall(ctx);

    // Draw aim arrow
    if (this.state === 'aiming' && this.selectedButton && this.aimStart && this.aimEnd) {
      this.drawAimArrow(ctx);
    }

    // Highlight current team's buttons
    if (this.state === 'waiting') {
      const buttons = this.currentTeam === 1 ? this.team1Buttons : this.team2Buttons;
      for (const btn of buttons) {
        ctx.beginPath();
        ctx.arc(btn.pos.x, btn.pos.y, btn.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = this.currentTeam === 1
          ? 'rgba(239,68,68,0.5)'
          : 'rgba(59,130,246,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  drawTeamButtons(ctx, buttons, teamData, teamNum) {
    const c1 = teamData.colors[0];
    const c2 = teamData.colors[1];

    for (const btn of buttons) {
      const x = btn.pos.x;
      const y = btn.pos.y;
      const r = btn.radius;

      // Shadow
      ctx.beginPath();
      ctx.arc(x + 2, y + 3, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, r);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, this.darkenColor(c1, 30));
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = c2;
      ctx.fill();

      // Border
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = teamNum === 1
        ? 'rgba(239,68,68,0.8)'
        : 'rgba(59,130,246,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shine
      ctx.beginPath();
      ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fill();
    }
  }

  drawBall(ctx) {
    const x = this.ball.pos.x;
    const y = this.ball.pos.y;
    const r = this.ball.radius;

    // Shadow
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Ball
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, r);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(1, '#cccccc');
    ctx.fillStyle = bg;
    ctx.fill();

    // Pentagon pattern
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.8;
    const angles = [0, 72, 144, 216, 288];
    for (const a of angles) {
      const rad = (a * Math.PI) / 180;
      const px = x + Math.cos(rad) * r * 0.55;
      const py = y + Math.sin(rad) * r * 0.55;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawAimArrow(ctx) {
    const btn = this.selectedButton;
    const diff = this.aimStart.sub(this.aimEnd);
    const dir = diff.norm();
    const force = Math.min(diff.len() / 150, 1);
    const arrowLen = force * 100;

    const start = btn.pos;
    const end = start.add(dir.scale(arrowLen));

    // Arrow line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = `rgba(255,255,100,${0.5 + force * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arrow head
    const headLen = 12;
    const angle = Math.atan2(dir.y, dir.x);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLen * Math.cos(angle - 0.4),
      end.y - headLen * Math.sin(angle - 0.4)
    );
    ctx.lineTo(
      end.x - headLen * Math.cos(angle + 0.4),
      end.y - headLen * Math.sin(angle + 0.4)
    );
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,100,${0.5 + force * 0.5})`;
    ctx.fill();

    // Dotted trajectory preview
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(start.x + dir.x * arrowLen * 2, start.y + dir.y * arrowLen * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Highlight selected button
    ctx.beginPath();
    ctx.arc(btn.pos.x, btn.pos.y, btn.radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,100,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  darkenColor(hex, amount) {
    let color = hex.replace('#', '');
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const r = Math.max(0, parseInt(color.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(color.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(color.substr(4, 2), 16) - amount);
    return `rgb(${r},${g},${b})`;
  }
}
