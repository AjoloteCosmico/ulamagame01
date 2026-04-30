/**
 * Court.js — Cancha de Ullanque
 *
 * Coordenadas "mundo": eje Y crece hacia abajo, origen en esquina superior izquierda.
 * worldToScreen() aplica perspectiva trapezoidal simple para simular profundidad.
 *
 * TODO (escalabilidad):
 *  - Añadir Court.net (rect central) para colisiones de pelota.
 *  - Para múltiples carriles por equipo: cambiar laneLimits a un array de zonas.
 *  - Para juego online: Court es solo datos; el servidor lo valida en su copia.
 */

export class Court {
  /**
   * @param {Object} opts
   * @param {number} opts.hardness    — coef. de restitución del suelo [0..1]
   * @param {number} opts.groundY     — Y del suelo en coords. mundo
   * @param {{minX:number,maxX:number}}          opts.xLimits
   * @param {{minY:number,maxY:number}}          opts.laneLimits   — rango de profundidad del carril
   * @param {{x:number,y:number,w:number,h:number}} [opts.screenRect] — rect de destino en pantalla
   */
  constructor({
    hardness    = 0.65,
    groundY     = 520,
    xLimits     = { minX: 0,   maxX: 1280 },
    laneLimits  = { minY: 300, maxY: 600  },
    screenRect  = { x: 0, y: 0, w: 1280, h: 720 },
  } = {}) {
    this.hardness   = hardness;
    this.groundY    = groundY;
    this.xLimits    = xLimits;
    this.laneLimits = laneLimits;
    this.screenRect = screenRect;

    // Red (centro X)
    this.netX = (xLimits.minX + xLimits.maxX) / 2;

    // Límites de cada equipo (izq / der)
    this.teamZones = [
      { minX: xLimits.minX, maxX: this.netX },   // equipo 0
      { minX: this.netX,    maxX: xLimits.maxX }, // equipo 1
    ];
  }

  // ─── Proyección perspectiva trapezoidal ──────────────────────────────────

  /**
   * Convierte coordenadas mundo (x, y) a pantalla con perspectiva simple.
   * scale crece conforme y avanza (más cerca de la cámara → más grande).
   *
   * Fórmula: scale = 0.5 + y / (2 * groundY)
   *
   * @param {number} x — coord. mundo
   * @param {number} y — coord. mundo (0 = fondo, groundY = primer plano)
   * @returns {{x:number, y:number, scale:number}}
   */
  worldToScreen(x, y) {
    const { w, h } = this.screenRect;
    const { minY, maxY } = this.laneLimits;

    // t: 0 = fondo, 1 = primer plano
    const t = Math.max(0, Math.min(1, (y - minY) / (maxY - minY)));

    // Escala trapezoidal
    const scale = 0.5 + 0.5 * t;

    // Centro horizontal de pantalla como punto de fuga
    const cx = w / 2;
    const sx = cx + (x - cx) * scale;

    // Proyección vertical: mapear y mundo a y pantalla con perspectiva
    const horizonY = h * 0.25; // línea de horizonte
    const sy = horizonY + (y - minY) * ((h - horizonY) / (maxY - minY));

    return { x: sx, y: sy, scale };
  }

  // ─── Consultas espaciales ────────────────────────────────────────────────

  /**
   * ¿Está la pelota dentro del carril jugable (eje Y)?
   * @param {{x:number,y:number}} ballPos
   */
  isInsideLane(ballPos) {
    return (
      ballPos.y >= this.laneLimits.minY &&
      ballPos.y <= this.laneLimits.maxY &&
      ballPos.x >= this.xLimits.minX    &&
      ballPos.x <= this.xLimits.maxX
    );
  }

  /**
   * ¿Es gol? La pelota cae fuera del campo o toca el suelo en zona enemiga.
   *
   * @param {{x:number,y:number}} ballPos
   * @param {number} lastHitByTeam — equipo (0 o 1) que golpeó por última vez
   * @returns {{ isGoal: boolean, scoringTeam: number|null }}
   */
  isGoal(ballPos, lastHitByTeam) {
    // La pelota salió por la izquierda → punto para equipo 1
    if (ballPos.x < this.xLimits.minX) {
      return { isGoal: true, scoringTeam: 1 };
    }
    // Salió por la derecha → punto para equipo 0
    if (ballPos.x > this.xLimits.maxX) {
      return { isGoal: true, scoringTeam: 0 };
    }
    // Cayó al suelo en zona del equipo contrario
    if (ballPos.y >= this.groundY) {
      const scoringTeam = lastHitByTeam === 0 ? 0 : 1;
      // Verifica en qué zona cayó
      const inEnemyZone =
        lastHitByTeam === 0
          ? ballPos.x > this.netX
          : ballPos.x < this.netX;
      if (inEnemyZone) {
        return { isGoal: true, scoringTeam };
      }
    }
    return { isGoal: false, scoringTeam: null };
  }

  /**
   * ¿La pelota tocó la red?
   * @param {{x:number,y:number}} ballPos
   * @param {number} radius
   */
  hitsNet(ballPos, radius = 0) {
    const NET_TOP = this.groundY - 120; // TODO: parametrizar altura de red
    return (
      Math.abs(ballPos.x - this.netX) <= radius + 4 &&
      ballPos.y >= NET_TOP
    );
  }

  /**
   * Resuelve colisión de la pelota contra el suelo.
   * Modifica vel.y directamente y retorna true si hubo rebote.
   * @param {import('./Ball.js').Ball} ball
   */
  resolveGroundCollision(ball) {
    if (ball.pos.y + ball.radius >= this.groundY) {
      ball.pos.y  = this.groundY - ball.radius;
      ball.vel.y  = -Math.abs(ball.vel.y) * this.hardness;
      ball._onGround = true;
      return true;
    }
    ball._onGround = false;
    return false;
  }

  /**
   * Resuelve colisión de la pelota con las paredes laterales.
   * @param {import('./Ball.js').Ball} ball
   */
  resolveSideWalls(ball) {
    if (ball.pos.x - ball.radius < this.xLimits.minX) {
      ball.pos.x = this.xLimits.minX + ball.radius;
      ball.vel.x = Math.abs(ball.vel.x) * 0.7;
    }
    if (ball.pos.x + ball.radius > this.xLimits.maxX) {
      ball.pos.x = this.xLimits.maxX - ball.radius;
      ball.vel.x = -Math.abs(ball.vel.x) * 0.7;
    }
  }
}