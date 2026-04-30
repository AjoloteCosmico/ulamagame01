/**
 * Caida.js — Define un tipo de golpe/caída parametrizable
 *
 * "Caída" es el término del Ullanque para los golpes.
 *
 * TODO (escalabilidad):
 *  - Registrar nuevos tipos en un CaidaRegistry (Map<string, CaidaConfig>)
 *    para poder añadirlos sin tocar lógica de Player ni Game.
 *  - Añadir campo `animFrames` para ligar caída con animación de sprite.
 *  - Para online: serializar solo el nombre de la caída + elapsed, no el objeto entero.
 */

export class Caida {
  /**
   * @param {Object} opts
   * @param {string}  opts.name           — identificador legible ('golpe_normal', 'remate', etc.)
   * @param {number}  opts.duration       — duración total en segundos
   * @param {Array<[number, number]>} opts.forceCurve
   *   Array de pares [t_normalizado(0..1), multiplier].
   *   Ejemplo: [[0,0],[0.3,1.5],[0.7,1],[1,0.2]]
   * @param {{x:number, y:number}} opts.impulseVector
   *   Dirección e intensidad base del golpe (mundo px/s).
   * @param {'normal'|'high'|'low'} opts.heightModifier
   *   Ajusta la trayectoria vertical del golpe.
   */
  constructor({
    name = 'golpe_normal',
    duration = 0.4,
    forceCurve = [[0, 0], [0.5, 1], [1, 0]],
    impulseVector = { x: 500, y: -300 },
    heightModifier = 'normal',
  } = {}) {
    this.name = name;
    this.duration = duration;
    this.forceCurve = forceCurve; // debe estar ordenado por t
    this.impulseVector = { x: impulseVector.x, y: impulseVector.y };
    this.heightModifier = heightModifier;

    // Modificadores por altura
    this._heightYMultipliers = {
      normal: 1.0,
      high: 1.6,   // más elevación
      low: 0.4,    // golpe rasante
    };
  }

  // ─── Interpolación ───────────────────────────────────────────────────────

  /**
   * Devuelve el multiplicador de fuerza para el instante `elapsedTime`.
   * Interpola linealmente entre los puntos de forceCurve.
   *
   * @param {number} elapsedTime — segundos transcurridos desde que inició la caída
   * @returns {number} multiplicador (0..N)
   */
  getForceMultiplier(elapsedTime) {
    const t = Math.min(elapsedTime / this.duration, 1);
    const curve = this.forceCurve;

    // Fuera de rango
    if (t <= curve[0][0]) return curve[0][1];
    if (t >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];

    // Buscar segmento
    for (let i = 0; i < curve.length - 1; i++) {
      const [t0, m0] = curve[i];
      const [t1, m1] = curve[i + 1];
      if (t >= t0 && t <= t1) {
        const alpha = (t - t0) / (t1 - t0);
        return m0 + alpha * (m1 - m0);
      }
    }
    return 0;
  }

  /**
   * Devuelve el impulso final del golpe con el multiplicador actual y el heightModifier.
   * @param {number} elapsedTime
   * @param {number} facingDir — +1 derecha / -1 izquierda
   * @returns {{x:number, y:number}}
   */
  getImpulse(elapsedTime, facingDir = 1) {
    const mult = this.getForceMultiplier(elapsedTime);
    const yMod = this._heightYMultipliers[this.heightModifier] ?? 1;
    return {
      x: this.impulseVector.x * mult * facingDir,
      y: this.impulseVector.y * mult * yMod,
    };
  }

  /** ¿Terminó la caída? */
  isFinished(elapsedTime) {
    return elapsedTime >= this.duration;
  }
}

// ─── Catálogo de caídas predefinidas ─────────────────────────────────────────
// TODO: mover a un archivo CaidaRegistry.js cuando haya más de ~5 tipos.

export const CAIDAS = {
  golpe_normal: new Caida({
    name: 'golpe_normal',
    duration: 0.35,
    forceCurve: [[0, 0], [0.4, 1], [0.7, 0.8], [1, 0]],
    impulseVector: { x: 550, y: -280 },
    heightModifier: 'normal',
  }),

  remate: new Caida({
    name: 'remate',
    duration: 0.25,
    forceCurve: [[0, 0], [0.2, 1.8], [0.6, 1.2], [1, 0]],
    impulseVector: { x: 800, y: -150 },
    heightModifier: 'low',
  }),

  globo: new Caida({
    name: 'globo',
    duration: 0.5,
    forceCurve: [[0, 0], [0.5, 0.9], [1, 0.1]],
    impulseVector: { x: 300, y: -600 },
    heightModifier: 'high',
  }),
};

/** Lista ordenada de nombres para ciclar con Q/E o [/] */
export const CAIDA_NAMES = Object.keys(CAIDAS);