/**
 * input.js — Sistema de input local para 2 jugadores
 *
 * Abstrae el mapeo de teclas en "comandos" que los jugadores entienden.
 * De esta forma, añadir un gamepad o soporte online solo requiere
 * implementar otro InputProvider que emita los mismos comandos.
 *
 * TODO (escalabilidad):
 *  - Para gamepad: implementar GamepadInputProvider con la misma interfaz.
 *  - Para online: en el cliente, el InputProvider envía comandos al servidor
 *    en lugar de llamarlos directamente; en el servidor, se reciben y aplican.
 *  - Para más de 2 jugadores locales: añadir más entradas en PLAYER_KEYMAPS
 *    y registrar más jugadores en init().
 */

// ─── Mapa de teclas ───────────────────────────────────────────────────────────

/**
 * Cada jugador tiene:
 *  - up/down/left/right: movimiento
 *  - hit: ejecutar caída seleccionada
 *  - cycleHitNext / cycleHitPrev: cambiar tipo de caída
 */
const PLAYER_KEYMAPS = [
  // Jugador 1 — WASD
  {
    up:           'w',
    down:         's',
    left:         'a',
    right:        'd',
    hit:          'space',
    cycleHitNext: 'e',
    cycleHitPrev: 'q',
  },
  // Jugador 2 — Flechas
  {
    up:           'up',
    down:         'down',
    left:         'left',
    right:        'right',
    hit:          'enter',
    cycleHitNext: ']',
    cycleHitPrev: '[',
  },
];

// ─── Estado interno de teclas ─────────────────────────────────────────────────

/** Set de teclas actualmente presionadas */
const _pressed = new Set();

// ─── Inicialización (llamar una vez en la escena) ─────────────────────────────

/**
 * Registra los listeners de Kaboom para el teclado.
 * kaboom() ya debe estar inicializado.
 *
 * @param {Object[]} players — array de instancias Player (índice = id - 1)
 */
export function initInput(players) {
  // Kaboom expone onKeyDown/onKeyPress/onKeyRelease en el contexto global.
  // Si usas el modo módulo de Kaboom, pasa `k` como parámetro adicional.

  onKeyDown((key) => _pressed.add(key));
  onKeyRelease((key) => _pressed.delete(key));

  // Teclas de acción (one-shot, no continuas)
  players.forEach((player, i) => {
    const map = PLAYER_KEYMAPS[i];
    if (!map) return;

    // Golpe: se dispara una sola vez al presionar
    onKeyPress(map.hit, () => {
      if (player.canHit) player.startHit();
    });

    // Ciclo de caídas
    onKeyPress(map.cycleHitNext, () => player.cycleHit(+1));
    onKeyPress(map.cycleHitPrev, () => player.cycleHit(-1));
  });
}

// ─── Lectura de comandos por frame ────────────────────────────────────────────

/**
 * Lee el estado actual del teclado y construye el vector de dirección
 * para el jugador `i`. Llamar en update() para movimiento continuo.
 *
 * @param {number} i — índice de jugador (0 o 1)
 * @returns {{x:number, y:number}} — dirección normalizada (-1, 0, 1)
 */
export function getDirection(i) {
  const map = PLAYER_KEYMAPS[i];
  if (!map) return { x: 0, y: 0 };

  let x = 0;
  let y = 0;

  if (isKeyDown(map.left))  x -= 1;
  if (isKeyDown(map.right)) x += 1;
  if (isKeyDown(map.up))    y -= 1; // salto
  if (isKeyDown(map.down))  y += 1; // agacharse

  return { x, y };
}

/**
 * Aplica los comandos de dirección a todos los jugadores.
 * Llamar cada frame en update().
 *
 * @param {Object[]} players
 */
export function applyInputToPlayers(players) {
  players.forEach((player, i) => {
    const dir = getDirection(i);
    player.move(dir);
  });
}