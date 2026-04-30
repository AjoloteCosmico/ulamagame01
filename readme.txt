# Ullanque — Arquitectura del juego

## Estructura de archivos

```
ullanque/
├── entities/
│   ├── Ball.js       — Física de pelota (cinemática, fricción, rebote)
│   ├── Player.js     — Jugador (movimiento, sistema de caídas, daño)
│   ├── Court.js      — Cancha (perspectiva, colisiones, goles)
│   └── Caida.js      — Definición y catálogo de tipos de golpe
├── systems/
│   └── input.js      — Mapeo de teclas → comandos de jugador
└── game.js           — Escena principal (orquestador)
```

## Flujo de un frame

```
onUpdate(dt)
  │
  ├── applyInputToPlayers()     → player.move(dir)
  ├── player.update(dt)         → integración física + updateHit()
  ├── detectar colisión P↔B     → ball.vel = impulso de caída
  ├── ball.update(dt)           → gravedad + fricción
  ├── court.resolveGroundCollision(ball)
  ├── court.resolveSideWalls(ball)
  ├── court.isGoal()            → actualizar score / resetBall
  └── render via worldToScreen()
```

## Controles

| Acción         | Jugador 1 | Jugador 2  |
|----------------|-----------|------------|
| Moverse        | WASD      | Flechas    |
| Golpear        | Espacio   | Enter      |
| Sig. caída     | E         | ]          |
| Ant. caída     | Q         | [          |

## Caídas disponibles

| Nombre       | Fuerza | Altura | Uso              |
|--------------|--------|--------|------------------|
| golpe_normal | media  | normal | Golpe estándar   |
| remate       | alta   | baja   | Ataque rápido    |
| globo        | baja   | alta   | Tiro elevado     |

Para añadir una nueva caída: editar `entities/Caida.js` → objeto `CAIDAS`.

## Roadmap de escalabilidad

### Más jugadores por equipo
- `Player` ya es stateless por instancia.
- `game.js`: convertir `players` en `teams: [[p1, p2], [p3, p4]]`.
- `input.js`: añadir entradas en `PLAYER_KEYMAPS` o implementar `GamepadInputProvider`.

### Multijugador online
- Crear `systems/network.js` con un `NetworkInputProvider`.
- `Ball.serialize()` / `Player.serialize()` ya están listos.
- El servidor autoritativo ejecuta las mismas clases de entidades.
- Los clientes solo envían comandos y renderizan el estado recibido.

### Nuevas caídas
- Añadir entrada en `CAIDAS` (Caida.js) con su `forceCurve` e `impulseVector`.
- Opcional: ligar a un `animFrames` para la animación del sprite.

### Física avanzada
- `Ball.applyForce()` ya acepta vectores arbitrarios (spin, viento, etc.).
- `bounce(normal, restitution)` acepta cualquier superficie con su normal.
- Integrar detección de colisión con la red en `Court.hitsNet()`.