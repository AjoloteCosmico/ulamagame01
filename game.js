/**
 * game.js — Escena principal de Ullanque
 *
 * Orquesta: Court, Ball, Players, Input, Colisiones simples, Render.
 *
 * TODO (escalabilidad):
 *  - Extraer lógica de colisiones a systems/collision.js cuando crezca.
 *  - Para múltiples jugadores por equipo: players es un array dinámico;
 *    iterar sobre todos en update y render.
 *  - Para online: reemplazar applyInputToPlayers() por un NetworkInputProvider
 *    que lea comandos del servidor para los jugadores remotos.
 *  - Añadir ScoreManager para rastrear puntos, sets y partidos.
 *  - Las onomatopeyas y partículas irán en systems/effects.js.
 */
import kaboom from 'kaboom';
import { Ball }   from './entities/Ball.js';
import { Player } from './entities/Player.js';
import { Court }  from './entities/Court.js';
import { initInput, applyInputToPlayers } from './systems/input.js';

kaboom({
  width: 1280,
  height: 720,
  background: [30, 20, 10],
});

 loadSprite('player1', '/sprites/Alan_v01.png', {
  sliceX: 9,
  sliceY: 3,
  anims: {
    idleR: 0,
    idleL: 8,
    walkR: { from: 18, to: 25, speed: 11, loop: true },
    walkL: { from: 18, to: 25, speed: 11, loop: true },
    jumpR: 16, // Ajusta según tu sprite
    jumpL: 18,
    duckR: 17, // Ajusta
    duckL: 19,
  },
});
 loadSprite('player2', '/sprites/Alan_v01.png', {
  sliceX: 9,
  sliceY: 3,
  anims: {
    idleR: 0,
    idleL: 8,
    walkR: { from: 18, to: 25, speed: 12, loop: true },
    walkL: { from: 18, to: 25, speed: 12, loop: true },
    jumpR: 1,
    jumpL: 4,
    duckR: 2,
    duckL: 0,
  },
});

loadSprite('ball', '/sprites/pelota3.png');

// ─── Configuración de la escena ───────────────────────────────────────────────

const WORLD_W = 1280;
const WORLD_H = 720;

// Posiciones iniciales (coordenadas mundo)
const PLAYER_SPAWN = [
  { x: WORLD_W * 0.25, y: 480 }, // equipo 0 — izquierda
  { x: WORLD_W * 0.75, y: 480 }, // equipo 1 — derecha
];
const BALL_SPAWN = { x: WORLD_W / 2, y: 200 };

// ─── Escena ───────────────────────────────────────────────────────────────────

scene('game', () => {

  // ── Instancias ──────────────────────────────────────────────────────────
  const court = new Court({
    hardness:   0.65,
    groundY:    530,
    xLimits:    { minX: 40,  maxX: WORLD_W - 40 },
    laneLimits: { minY: 300, maxY: 530 },
    screenRect: { x: 0, y: 0, w: WORLD_W, h: WORLD_H },
  });

  const ball = new Ball({
    pos:        { ...BALL_SPAWN },
    radius:     14,
    mass:       1,
    elasticity: court.hardness,
    friction:   0.988,
  });

  // TODO: cargar nombres reales de sprite desde un config externo
  const players = [
    new Player({ id: 1, spriteName: 'player1', pos: { ...PLAYER_SPAWN[0] }, team: 0 }),
    new Player({ id: 2, spriteName: 'player2', pos: { ...PLAYER_SPAWN[1] }, team: 1 }),
  ];

  // Índice del último equipo que golpeó la pelota (para isGoal)
  let lastHitByTeam = 0;

  // Score provisional
  const score = [0, 0];

  // ── Input ───────────────────────────────────────────────────────────────
  initInput(players);

  // ── Objetos Kaboom (solo visuales; la física la manejan nuestras clases) ─

  // Suelo de referencia (visual)
  add([
    rect(WORLD_W, 8),
    pos(0, court.groundY),
    color(80, 60, 40),
    { z: -1 },
  ]);

  // Red (visual)
  add([
    rect(6, 120),
    pos(court.netX - 3, court.groundY - 120),
    color(220, 220, 200),
  ]);

  // Sprites de jugadores (Kaboom los mueve nosotros vía worldToScreen)
  const playerSprites = players.map((p) => {
    return add([
      sprite(p.spriteName),
      pos(p.pos.x, p.pos.y),
      anchor('bot'),
      scale(1),
      { playerId: p.id },
    ]);
  });

  // Sprite de pelota
  const ballSprite = add([
    sprite('ball'),
    pos(ball.pos.x, ball.pos.y),
    anchor('center'),
    scale(0.8),
  ]);

  // HUD provisional
  const hudScore = add([
    text(`${score[0]} — ${score[1]}`, { size: 32 }),
    pos(WORLD_W / 2, 20),
    anchor('top'),
    fixed(),
  ]);

  const hudHitP1 = add([
    text('', { size: 16 }),
    pos(20, 20),
    fixed(),
  ]);

  const hudHitP2 = add([
    text('', { size: 16 }),
    pos(WORLD_W - 20, 20),
    anchor('topright'),
    fixed(),
  ]);

  // ── Update ───────────────────────────────────────────────────────────────

  onUpdate(() => {
    const delta = dt();

    // 1. Aplicar input → move() de cada jugador
    applyInputToPlayers(players);

    // 2. Actualizar física de jugadores (integración + hits)
    players.forEach((p) => {
      p.update(delta);

      // Colisión jugador con suelo
      if (p.pos.y >= court.groundY) {
        p.pos.y    = court.groundY;
        p.vel.y    = 0;
        p._onGround = true;
        if (p.heightState === 'jumping') p.heightState = 'normal';
      }

      // Límites horizontales del campo
      p.pos.x = Math.max(court.xLimits.minX + 16, Math.min(court.xLimits.maxX - 16, p.pos.x));

      // Cada jugador se queda en su mitad
      // TODO: quitar esta restricción cuando se implemente la lógica de zonas
      if (p.team === 0) {
        p.pos.x = Math.min(p.pos.x, court.netX - 20);
      } else {
        p.pos.x = Math.max(p.pos.x, court.netX + 20);
      }
    });

    // 3. Detectar colisión jugador → pelota (por distancia)
    players.forEach((p) => {
      if (!p.isHitting) return;

      const dx   = ball.pos.x - p.center.x;
      const dy   = ball.pos.y - p.center.y;
      const dist = Math.hypot(dx, dy);

      if (dist < p.hitRadius + ball.radius) {
        const impulse = p.getCurrentImpulse();
        if (impulse) {
          // Sobreescribir velocidad de pelota con el impulso del golpe
          // TODO: sumar en lugar de sobreescribir cuando haya física avanzada
          ball.vel.x = impulse.x;
          ball.vel.y = impulse.y;
          lastHitByTeam = p.team;
        }
      }
    });

    // 4. Actualizar pelota
    ball.update(delta);
    court.resolveGroundCollision(ball);
    court.resolveSideWalls(ball);

    // 5. Detectar gol
    const { isGoal, scoringTeam } = court.isGoal(ball.pos, lastHitByTeam);
    if (isGoal && scoringTeam !== null) {
      score[scoringTeam]++;
      hudScore.text = `${score[0]} — ${score[1]}`;
      _resetBall(ball, court);
    }

    // 6. Render — mover sprites Kaboom a posiciones calculadas por worldToScreen
    // Pelota
    {
      const { x, y, scale: s } = court.worldToScreen(ball.pos.x, ball.pos.y);
      ballSprite.pos = vec2(x, y);
      ballSprite.scale = vec2(s, s);
      // Rotación visual
      ballSprite.angle = ball.rotation * (180 / Math.PI);
    }

    // Jugadores
    players.forEach((p, i) => {
      const { x, y, scale: s } = court.worldToScreen(p.pos.x, p.pos.y);
      playerSprites[i].pos   = vec2(x, y);
      playerSprites[i].scale = vec2(
        s * p.facingDir, // flip horizontal según dirección
        s
      );

      // Cambiar animación / frame basada en estado o en el golpe activo
      if (p.isHitting && p.currentHit?.animFrame != null) {
        const frame = p.currentHit.getAnimFrame(p.hitTimer);
        if (frame != null) {
          playerSprites[i].frame = frame;
        }
      } else {
        const animName = `${p.state}${p.facingDir > 0 ? 'R' : 'L'}`;
        if (playerSprites[i].curAnim() !== animName) {
          playerSprites[i].play(animName);
        }
      }
    });

    // 7. HUD de caídas
    hudHitP1.text = `P1: ${players[0].selectedHitName}${players[0].isHitting ? ' ●' : ''}`;
    hudHitP2.text = `P2: ${players[1].selectedHitName}${players[1].isHitting ? ' ●' : ''}`;
  });

});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resetea la pelota al centro tras un gol */
function _resetBall(ball, court) {
  ball.pos.x = (court.xLimits.minX + court.xLimits.maxX) / 2;
  ball.pos.y = 200;
  ball.vel.x = 0;
  ball.vel.y = 0;
  ball.acc.x = 0;
  ball.acc.y = 0;
  ball._onGround = false;
}

go('game');

// ─── Arranque ─────────────────────────────────────────────────────────────────

/**
 * Punto de entrada.
 * Este bloque debe estar en tu main.js / index.js donde inicializas Kaboom.
 * Lo incluimos aquí para que el ejemplo sea autocontenido.
 *
 * Reemplaza los sprites con los nombres reales que ya tienes cargados.
 */

/*
kaboom({
  width:  1280,
  height: 720,
  canvas: document.querySelector('#gameCanvas'),
  background: [30, 20, 10],
});

// Carga de assets (ya los tienes; ajusta rutas)
loadSprite('player1', 'assets/player1.png');
loadSprite('player2', 'assets/player2.png');

go('game');
*/