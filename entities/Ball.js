/**
 * Ball.js — Entidad de la pelota de Ullanque
 *
 * TODO (física futura):
 *  - Añadir spin/topspin como vector angular para desvío en vuelo
 *  - Integrar colisiones con Court.walls cuando se implemente la red
 *  - Para multijugador online: serializar pos/vel en cada tick y enviar por WebSocket
 */

export class Ball {
  /**
   * @param {Object} opts
   * @param {{x:number, y:number}} opts.pos  — posición inicial en coordenadas mundo
   * @param {number} opts.radius
   * @param {number} opts.mass
   * @param {number} opts.elasticity   — coef. de restitución contra suelo [0..1]
   * @param {number} opts.friction     — fricción de suelo [0..1] aplicada cada frame
   */
  constructor({ pos = { x: 0, y: 0 }, radius = 12, mass = 1, elasticity = 0.6, friction = 0.985 } = {}) {
    // --- Estado cinemático ---
    this.pos = { x: pos.x, y: pos.y };
    this.vel = { x: 0, y: 0 };
    this.acc = { x: 0, y: 0 };

    // --- Propiedades físicas ---
    this.radius = radius;
    this.mass = mass;
    this.elasticity = elasticity; // rebote contra suelo
    this.friction = friction;     // damping por frame

    // --- Rotación visual (radianes, solo cosmético por ahora) ---
    this.rotation = 0;

    // --- Gravedad local (puede sobreescribirse por escena) ---
    this.gravity = 980; // px/s² (coordenadas mundo)

    // --- Estado interno ---
    this._onGround = false;
  }

  // ─── Física ──────────────────────────────────────────────────────────────

  /**
   * Aplica una fuerza externa (en unidades mundo/s²).
   * Acumula en acc; se consume en update().
   * @param {{x:number, y:number}} force
   */
  applyForce(force) {
    this.acc.x += force.x / this.mass;
    this.acc.y += force.y / this.mass;
  }

  /**
   * Rebota contra una superficie definida por su normal.
   * @param {{x:number, y:number}} normal  — normal unitaria de la superficie
   * @param {number} restitution           — sobreescribe elasticity si se pasa
   */
  bounce(normal, restitution = this.elasticity) {
    // v' = v - (1+e)(v·n)n
    const dot = this.vel.x * normal.x + this.vel.y * normal.y;
    this.vel.x -= (1 + restitution) * dot * normal.x;
    this.vel.y -= (1 + restitution) * dot * normal.y;
  }

  /**
   * Integración de Euler semi-implícita.
   * Aplica gravedad, integra velocidad y posición, luego fricción.
   * Las colisiones reales con suelo/paredes se delegan al sistema de colisiones en game.js.
   *
   * @param {number} dt — delta time en segundos
   */
  update(dt) {
    // Gravedad siempre hacia +Y (abajo en coords. mundo)
    this.acc.y += this.gravity;

    // Integrar velocidad
    this.vel.x += this.acc.x * dt;
    this.vel.y += this.acc.y * dt;

    // Integrar posición
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Fricción de suelo solo si está en tierra (se setea desde game.js)
    if (this._onGround) {
      this.vel.x *= this.friction;
    }

    // Rotación visual proporcional a velocidad horizontal
    this.rotation += (this.vel.x * dt) / this.radius;

    // Resetear acumulador de aceleración (excepto gravedad, que se vuelve a añadir)
    this.acc.x = 0;
    this.acc.y = 0;
  }

  // ─── Utilidades ──────────────────────────────────────────────────────────

  /**
   * @param {number} threshold — velocidad mínima (px/s) para considerar quieta
   * @returns {boolean}
   */
  isQuiet(threshold = 5) {
    return (
      Math.abs(this.vel.x) < threshold &&
      Math.abs(this.vel.y) < threshold
    );
  }

  /** Serialización para futura sincronización online */
  serialize() {
    return {
      pos: { ...this.pos },
      vel: { ...this.vel },
      rotation: this.rotation,
    };
  }

  /** @param {ReturnType<Ball['serialize']>} state */
  deserialize(state) {
    Object.assign(this.pos, state.pos);
    Object.assign(this.vel, state.vel);
    this.rotation = state.rotation;
  }
}