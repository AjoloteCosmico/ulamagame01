/**
 * Player.js — Entidad jugador de Ullanque
 *
 * TODO (escalabilidad):
 *  - Para múltiples jugadores por equipo: extraer lógica de equipo a TeamManager.
 *  - Para online: serializar solo pos/vel/isHitting/hitTimer y reconciliar en cliente.
 *  - Para animaciones: añadir un AnimationController que lea el estado (isHitting, height)
 *    y devuelva el frame correcto del sprite.
 */

import { CAIDAS, CAIDA_NAMES } from './Caida.js';

// Alturas del hitbox según estado
const HEIGHT_MAP = {
  normal:  64,
  jumping: 64,
  ducking: 30,
};

const SPEED       = 220; // px/s (mundo)
const JUMP_FORCE  = -520;
const HIT_RADIUS  = 48; // distancia máxima al centro para que el golpe conecte

export class Player {
  /**
   * @param {Object} opts
   * @param {string|number} opts.id
   * @param {string}        opts.spriteName  — nombre del sprite cargado en Kaboom
   * @param {{x:number,y:number}} opts.pos
   * @param {number}        opts.team        — 0 = izquierda, 1 = derecha
   */
  constructor({ id, spriteName, pos = { x: 0, y: 0 }, team = 0 } = {}) {
    this.id         = id;
    this.spriteName = spriteName; // TODO: ampliar a spriteSheet con animaciones
    this.team       = team;

    // ── Cinemática ────────────────────────────────────────────────────────
    this.pos = { x: pos.x, y: pos.y };
    this.vel = { x: 0, y: 0 };
    this.acc = { x: 0, y: 0 };

    // Dirección visual (+1 derecha / -1 izquierda)
    this.facingDir = team === 0 ? 1 : -1;

    // ── Estado ────────────────────────────────────────────────────────────
    this.heightState = 'normal'; // 'normal' | 'jumping' | 'ducking'
    this.height      = HEIGHT_MAP.normal;
    this._onGround   = true;
    // Nuevo: estado general para animaciones
    this.state = 'idle'; // 'idle' | 'walk' | 'jump' | 'duck'
    // ── Stats ─────────────────────────────────────────────────────────────
    this.health = 100;
    this.morale = 100; // TODO: afecta multiplicador de caída (futuro)

    // ── Sistema de golpes ─────────────────────────────────────────────────
    this.isHitting    = false;
    this.hitTimer     = 0;        // segundos transcurridos desde startHit()
    this.currentHit   = null;     // instancia de Caida activa
    this.currentHitIdx = 0;       // índice en CAIDA_NAMES para ciclar
    this.selectedHitName = CAIDA_NAMES[0];

    // ── Físicas locales ───────────────────────────────────────────────────
    this.gravity  = 980;
    this.friction = 0.75; // damping horizontal en tierra por frame
  }

  // ─── Movimiento ──────────────────────────────────────────────────────────

  /**
   * Aplica movimiento según dirección recibida del sistema de input.
   * Se llama cada frame con el vector de dirección normalizado.
   * @param {{x:number, y:number}} direction
   */
  move(direction) {
    if (direction.x !== 0) {
      this.vel.x = direction.x * SPEED;
      this.facingDir = Math.sign(direction.x);
      this.state = 'walk';
    } else {
      // Fricción cuando no hay input horizontal
      this.vel.x *= this.friction;
    }

    if (this._onGround) {
      if (direction.y !== 0) {
        // Movimiento de profundidad en el suelo, no salto.
        this.vel.y = direction.y * SPEED;
        this.state = 'walk';
      } else {
        this.vel.y *= this.friction;
      }
    }

    if (this._onGround && direction.x === 0 && direction.y === 0) {
      this.state = 'idle';
    }
  }

  /**
   * Ejecuta un salto si el jugador está en el suelo.
   */
  jump() {
    if (!this._onGround || this.heightState === 'ducking') return;
    this.vel.y = JUMP_FORCE;
    this._onGround = false;
    this.heightState = 'jumping';
    this.state = 'jump';
  }

  /**
   * Integración de posición (llamar después de move()).
   * Las colisiones con el suelo se resuelven en game.js.
   * @param {number} dt
   */
  update(dt) {
    if (!this._onGround) {
      this.vel.y += this.gravity * dt;
    }
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    // Actualizar golpe activo
    if (this.isHitting) {
      this.updateHit(dt);
    }
  }

  // ─── Sistema de golpes ────────────────────────────────────────────────────

  /**
   * Inicia una caída. Si ya hay una activa, la cancela.
   * @param {string} [hitName] — nombre de caída; si no se pasa, usa la seleccionada
   */
  startHit(hitName) {
    const name     = hitName ?? this.selectedHitName;
    const caida    = CAIDAS[name];
    if (!caida) return;

    this.isHitting  = true;
    this.hitTimer   = 0;
    this.currentHit = caida;
  }

  /**
   * Avanza el timer del golpe activo.
   * Cuando termina, limpia el estado.
   * @param {number} dt
   */
  updateHit(dt) {
    if (!this.isHitting || !this.currentHit) return;

    this.hitTimer += dt;

    if (this.currentHit.isFinished(this.hitTimer)) {
      this.isHitting  = false;
      this.currentHit = null;
      this.hitTimer   = 0;
    }
  }

  /**
   * Devuelve el impulso del golpe actual en el instante presente.
   * Lo usa game.js para aplicar fuerza a la pelota.
   * @returns {{x:number, y:number}|null}
   */
  getCurrentImpulse() {
    if (!this.isHitting || !this.currentHit) return null;
    return this.currentHit.getImpulse(this.hitTimer, this.facingDir);
  }

  /**
   * Retrocede / avanza en el catálogo de caídas.
   * @param {number} delta — +1 o -1
   */
  cycleHit(delta) {
    this.currentHitIdx = (this.currentHitIdx + delta + CAIDA_NAMES.length) % CAIDA_NAMES.length;
    this.selectedHitName = CAIDA_NAMES[this.currentHitIdx];
  }

  // ─── Impacto recibido ─────────────────────────────────────────────────────

  /**
   * Aplica daño/efecto cuando la pelota golpea al jugador.
   * @param {{x:number,y:number}} impactPoint — posición del impacto (mundo)
   * @param {{x:number,y:number}} ballForce   — fuerza de la pelota en ese instante
   * @param {boolean}             isRacket    — ¿impacto con la raqueta?
   */
  receiveHit(impactPoint, ballForce, isRacket = false) {
    const strength = Math.hypot(ballForce.x, ballForce.y);
    const damage   = isRacket ? strength * 0.02 : strength * 0.005;
    this.health   -= damage;
    this.morale   -= damage * 0.5;

    // Clamp
    this.health = Math.max(0, this.health);
    this.morale = Math.max(0, this.morale);

    // TODO: disparar animación de daño, sonido, partículas
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Radio de conexión de golpe */
  get hitRadius() { return HIT_RADIUS; }

  /** Centro del hitbox (para colisión con pelota) */
  get center() {
    return { x: this.pos.x, y: this.pos.y - this.height / 2 };
  }

  /** ¿Puede lanzar un golpe ahora? */
  get canHit() { return !this.isHitting; }

  serialize() {
    return {
      id: this.id,
      pos: { ...this.pos },
      vel: { ...this.vel },
      facingDir: this.facingDir,
      isHitting: this.isHitting,
      hitTimer: this.hitTimer,
      health: this.health,
      morale: this.morale,
    };
  }
}