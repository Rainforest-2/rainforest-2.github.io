/**
 * Entity is the base class for ally/enemy units.
 * It contains stats, lane position, move/attack states, and hit handling.
 */
class Entity {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.team = config.team;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.atk = config.atk;
    this.range = config.range;
    this.speed = config.speed;
    this.cooldown = config.cooldown;
    this.cost = config.cost || 0;
    this.sprite = config.sprite;
    this.width = 56;
    this.height = 56;
    this.x = config.x;
    this.lane = config.lane;
    this.y = 0;

    this.cooldownTimer = 0;
    this.state = 'move';
    this.alive = true;
    this.knockbackTimer = 0;
    this.knockbackPower = 0;
  }

  /**
   * Update movement and cooldown.
   */
  update(dt, target) {
    this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      this.x += this.knockbackPower * dt;
      return;
    }

    if (!target) {
      this.state = 'move';
      const direction = this.team === 'player' ? 1 : -1;
      this.x += direction * this.speed * 60 * dt;
      return;
    }

    const inRange = Collision.inRange(this, target);
    if (inRange) {
      this.state = 'attack';
    } else {
      this.state = 'move';
      const direction = this.team === 'player' ? 1 : -1;
      this.x += direction * this.speed * 60 * dt;
    }
  }

  canAttack() {
    return this.cooldownTimer <= 0;
  }

  attack(target) {
    if (!this.canAttack()) return;
    this.cooldownTimer = this.cooldown;
    target.takeDamage(this.atk, this.team === 'player' ? 22 : -22);
  }

  takeDamage(amount, knockbackPower) {
    this.hp -= amount;
    this.knockbackPower = knockbackPower;
    this.knockbackTimer = 0.12;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }
}

/**
 * BattleField controls lane Y positions, bases, money growth, and victory state.
 */
class BattleField {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.lanes = [110, 180, 250];
    this.playerBaseHp = 300;
    this.enemyBaseHp = 300;
    this.money = 100;
    this.maxMoney = 300;
    this.moneyGainPerSec = 12;
    this.running = false;
    this.result = 'idle';
  }

  laneY(index) {
    return this.lanes[index] || this.lanes[0];
  }

  updateEconomy(dt) {
    if (!this.running) return;
    this.money = Math.min(this.maxMoney, this.money + this.moneyGainPerSec * dt);
  }

  applyBaseDamage(entity) {
    if (entity.team === 'player' && entity.x >= this.width - 40) {
      this.enemyBaseHp -= 10;
      entity.alive = false;
    }

    if (entity.team === 'enemy' && entity.x <= 40) {
      this.playerBaseHp -= 10;
      entity.alive = false;
    }
  }

  evaluateResult() {
    if (this.enemyBaseHp <= 0) {
      this.running = false;
      this.result = 'win';
    } else if (this.playerBaseHp <= 0) {
      this.running = false;
      this.result = 'lose';
    }
  }
}

(async function bootstrap() {
  const canvas = document.getElementById('gameCanvas');
  const statusText = document.getElementById('statusText');
  const moneyGauge = document.getElementById('moneyGauge');
  const moneyValue = document.getElementById('moneyValue');

  const renderer = new Renderer(canvas);
  const field = new BattleField(canvas.width, canvas.height);
  const loader = new ResourceLoader();

  // JSON-like unit definitions are loaded from local file data.
  const unitDefs = await fetch('assets/data/units.json').then((r) => r.json());

  const images = await loader.loadImages({
    background: 'assets/images/background.svg',
    ally: 'assets/images/ally_cat.svg',
    enemy: 'assets/images/enemy_blob.svg',
    effect: 'assets/images/hit_effect.svg'
  });

  const allySprite = new Sprite(images.ally);
  const enemySprite = new Sprite(images.enemy);

  const allies = [];
  const enemies = [];

  let spawnTimer = 0;

  const spawnAlly = () => {
    const def = unitDefs.cat_basic;
    if (!field.running || field.money < def.cost) return;
    field.money -= def.cost;

    const lane = Math.floor(Math.random() * field.lanes.length);
    const ally = new Entity({ ...def, team: 'player', x: 80, lane, sprite: allySprite });
    ally.y = field.laneY(lane);
    allies.push(ally);
  };

  const spawnEnemy = () => {
    const def = unitDefs.enemy_basic;
    const lane = Math.floor(Math.random() * field.lanes.length);
    const enemy = new Entity({ ...def, team: 'enemy', x: canvas.width - 80, lane, sprite: enemySprite });
    enemy.y = field.laneY(lane);
    enemies.push(enemy);
  };

  const uiInput = new Input({
    onStart: () => {
      allies.length = 0;
      enemies.length = 0;
      field.playerBaseHp = 300;
      field.enemyBaseHp = 300;
      field.money = 100;
      field.running = true;
      field.result = 'running';
      statusText.className = 'status-text';
      statusText.textContent = 'Battle started!';
      uiInput.setStartEnabled(false);
    },
    onSpawn: spawnAlly
  });

  const loop = new GameLoop({
    fps: 60,
    update: (dt) => {
      field.updateEconomy(dt);
      moneyGauge.value = Math.round(field.money);
      moneyValue.textContent = `${Math.round(field.money)} / ${field.maxMoney}`;
      uiInput.setSpawnEnabled(field.running && field.money >= unitDefs.cat_basic.cost);

      if (!field.running) return;

      spawnTimer += dt;
      if (spawnTimer >= 2.5) {
        spawnTimer = 0;
        spawnEnemy();
      }

      const updateSide = (units, targets) => {
        units.forEach((unit) => {
          const target = Collision.findTarget(unit, targets);
          unit.update(dt, target);
          unit.sprite.update(dt);

          if (target && Collision.inRange(unit, target)) {
            unit.attack(target);
          }

          field.applyBaseDamage(unit);
        });
      };

      updateSide(allies, enemies);
      updateSide(enemies, allies);

      // Remove defeated entities from arrays.
      const aliveAllies = allies.filter((u) => u.alive);
      const aliveEnemies = enemies.filter((u) => u.alive);
      allies.length = 0;
      enemies.length = 0;
      allies.push(...aliveAllies);
      enemies.push(...aliveEnemies);

      field.evaluateResult();

      if (field.result === 'win') {
        statusText.className = 'status-text win';
        statusText.textContent = 'Victory! Enemy base collapsed.';
        uiInput.setStartEnabled(true);
      } else if (field.result === 'lose') {
        statusText.className = 'status-text lose';
        statusText.textContent = 'Defeat... Your base was destroyed.';
        uiInput.setStartEnabled(true);
      }
    },
    draw: () => {
      renderer.clear();
      renderer.drawBackground(images.background);
      const ctx = renderer.ctx;

      // Draw lane guide lines for readability.
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      field.lanes.forEach((laneY) => {
        ctx.beginPath();
        ctx.moveTo(0, laneY + 26);
        ctx.lineTo(canvas.width, laneY + 26);
        ctx.stroke();
      });

      // Draw bases at both edges.
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(0, 80, 30, 220);
      ctx.fillRect(canvas.width - 30, 80, 30, 220);

      // Draw each entity sprite and small HP bars.
      const drawUnit = (unit) => {
        unit.sprite.draw(ctx, unit.x - 28, unit.y - 28, unit.width, unit.height, unit.team === 'enemy');
        ctx.fillStyle = '#111';
        ctx.fillRect(unit.x - 28, unit.y - 36, 56, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(unit.x - 28, unit.y - 36, Math.max(0, (unit.hp / unit.maxHp) * 56), 5);
      };

      allies.forEach(drawUnit);
      enemies.forEach(drawUnit);

      // Draw base HP text.
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText(`Base HP: ${Math.max(0, Math.round(field.playerBaseHp))}`, 12, 24);
      ctx.fillText(`Enemy HP: ${Math.max(0, Math.round(field.enemyBaseHp))}`, canvas.width - 130, 24);
    }
  });

  loop.start();
})();
