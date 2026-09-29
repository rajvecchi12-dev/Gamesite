class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vec2(this.x * s, this.y * s); }
  len() { return Math.hypot(this.x, this.y); }
  norm() { const l = this.len(); return l > 0 ? this.scale(1 / l) : new Vec2(); }
  dot(v) { return this.x * v.x + this.y * v.y; }
}

class PhysicsBody {
  constructor(x, y, radius, mass = 1) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2();
    this.radius = radius;
    this.mass = mass;
    this.friction = 0.985;
  }

  update(dt) {
    this.pos = this.pos.add(this.vel.scale(dt));
    this.vel = this.vel.scale(this.friction);
    if (this.vel.len() < 0.3) {
      this.vel = new Vec2();
    }
  }

  isMoving() {
    return this.vel.len() > 0.3;
  }
}

class PhysicsEngine {
  constructor(fieldW, fieldH, goalW, goalH) {
    this.fieldW = fieldW;
    this.fieldH = fieldH;
    this.goalW = goalW;
    this.goalH = goalH;
    this.bodies = [];
    this.ball = null;
  }

  addBody(body) {
    this.bodies.push(body);
  }

  setBall(ball) {
    this.ball = ball;
    this.addBody(ball);
  }

  update(dt) {
    for (const b of this.bodies) {
      b.update(dt);
    }
    this.resolveCollisions();
    this.constrainToField();
  }

  resolveCollisions() {
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        this.collide(this.bodies[i], this.bodies[j]);
      }
    }
  }

  collide(a, b) {
    const diff = b.pos.sub(a.pos);
    const dist = diff.len();
    const minDist = a.radius + b.radius;
    if (dist < minDist && dist > 0) {
      const normal = diff.norm();
      const overlap = minDist - dist;
      const totalMass = a.mass + b.mass;
      a.pos = a.pos.sub(normal.scale(overlap * (b.mass / totalMass)));
      b.pos = b.pos.add(normal.scale(overlap * (a.mass / totalMass)));

      const relVel = a.vel.sub(b.vel);
      const velAlongNormal = relVel.dot(normal);
      if (velAlongNormal > 0) return;

      const restitution = 0.8;
      const impulse = -(1 + restitution) * velAlongNormal / totalMass;
      a.vel = a.vel.add(normal.scale(impulse * b.mass));
      b.vel = b.vel.sub(normal.scale(impulse * a.mass));
    }
  }

  constrainToField() {
    for (const b of this.bodies) {
      const goalTop = (this.fieldH - this.goalH) / 2;
      const goalBottom = goalTop + this.goalH;
      const isBall = b === this.ball;

      // Left wall
      if (b.pos.x - b.radius < 0) {
        if (isBall && b.pos.y > goalTop && b.pos.y < goalBottom) {
          // ball entering left goal
        } else {
          b.pos.x = b.radius;
          b.vel.x = Math.abs(b.vel.x) * 0.6;
        }
      }
      // Right wall
      if (b.pos.x + b.radius > this.fieldW) {
        if (isBall && b.pos.y > goalTop && b.pos.y < goalBottom) {
          // ball entering right goal
        } else {
          b.pos.x = this.fieldW - b.radius;
          b.vel.x = -Math.abs(b.vel.x) * 0.6;
        }
      }
      // Top wall
      if (b.pos.y - b.radius < 0) {
        b.pos.y = b.radius;
        b.vel.y = Math.abs(b.vel.y) * 0.6;
      }
      // Bottom wall
      if (b.pos.y + b.radius > this.fieldH) {
        b.pos.y = this.fieldH - b.radius;
        b.vel.y = -Math.abs(b.vel.y) * 0.6;
      }

      // Goal posts for non-ball (keep players out of goals)
      if (!isBall) {
        this.constrainGoalPosts(b, goalTop, goalBottom);
      }
    }
  }

  constrainGoalPosts(b, goalTop, goalBottom) {
    const postRadius = 4;
    // Left goal posts
    const posts = [
      { x: 0, y: goalTop },
      { x: 0, y: goalBottom },
      { x: this.fieldW, y: goalTop },
      { x: this.fieldW, y: goalBottom },
    ];
    for (const p of posts) {
      const diff = b.pos.sub(new Vec2(p.x, p.y));
      const dist = diff.len();
      const minD = b.radius + postRadius;
      if (dist < minD && dist > 0) {
        const n = diff.norm();
        b.pos = new Vec2(p.x, p.y).add(n.scale(minD));
        const vn = b.vel.dot(n);
        if (vn < 0) {
          b.vel = b.vel.sub(n.scale(vn * 1.5));
        }
      }
    }
  }

  checkGoal() {
    if (!this.ball) return 0;
    const goalTop = (this.fieldH - this.goalH) / 2;
    const goalBottom = goalTop + this.goalH;
    const b = this.ball;

    if (b.pos.x < -b.radius && b.pos.y > goalTop && b.pos.y < goalBottom) {
      return 2; // team 2 scored (ball went into left goal)
    }
    if (b.pos.x > this.fieldW + b.radius && b.pos.y > goalTop && b.pos.y < goalBottom) {
      return 1; // team 1 scored (ball went into right goal)
    }
    return 0;
  }

  allStopped() {
    return this.bodies.every(b => !b.isMoving());
  }
}
