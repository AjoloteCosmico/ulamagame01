// import kaboom from "kaboom";

// kaboom({
//     background: [10, 10, 10], // Fondo oscuro estilo arcade
//     width: 800,
//     height: 600,
// });

// //Importar sprites
// // Cargar una hoja de sprites con animaciones
// loadSprite("scott", "sprites/scott.png", {
//     sliceX: 8,
//     sliceY: 2,
//     anims: {
//         "idleR": 0,
//         "idleL": 8,
//         "walkR": { from: 0, to: 7, speed: 10, loop: true },
//         "walkL": { from: 8, to: 15, speed: 10, loop: true },
//         "hitR": 0, // Ajusta según tu frame de golpe
//         "hitL": 8,
//     },
// });

// // Configuración de velocidades
// const PADDLE_SPEED = 500;
// const BALL_SPEED = 400;

// // 1. EL JUGADOR (PALETAS)
// function createUllanque(x, lado) {
//     const p = add([
//         sprite("scott"),
//         pos(x, 250),
//         area(),
//         // Usamos state para manejar las animaciones y el comportamiento
//         state("idle", ["idle", "walk", "hitting"]),
//         {
//             lado, // 0 = derecha, 1 = izquierda
//             isHitting: false,
//         }
//     ]);

//     // Lógica automática cuando el estado cambia
//     p.onStateEnter("idle", () => {
//         p.play(p.lado === 0 ? "idleR" : "idleL");
//     });

//     p.onStateEnter("walk", () => {
//         p.play(p.lado === 0 ? "walkR" : "walkL");
//     });

//     return p;
// }

// // Para golpear:
// function hitBall(player, ball) {
//     player.enterState("hitting");
//     // Lógica para enviar la pelota hacia arriba (Tiro parabólico)
//     ball.jump(500); // Esto requiere que la bola tenga el componente body()
    
//     // Regresar a idle después de 0.2 segundos
//     wait(0.2, () => player.enterState("idle"));
// }

// const p1 = createUllanque(40);
// const p2 = createUllanque(740);

// // Controles

// onKeyDown("w", () => {
//     p1.move(0, -PADDLE_SPEED);
//     if (p1.state !== "walk") p1.enterState("walk");
// });
// onKeyRelease("w", () => {
//     p1.enterState("idle");
// });

// onKeyDown("s", () => {
//     p1.move(0, PADDLE_SPEED);
//     if (p1.state !== "walk") p1.enterState("walk");
// });
// onKeyRelease("s", () => {
//     p1.enterState("idle");
// });

// onKeyDown("up", () => {
//     p2.move(0, -PADDLE_SPEED);
//     if (p2.state !== "walk") p2.enterState("walk");
// });
// onKeyRelease("up", () => {
//     p2.enterState("idle");
// });

// onKeyDown("down", () => {
//     p2.move(0, PADDLE_SPEED);
//     if (p2.state !== "walk") p2.enterState("walk");
// });
// onKeyRelease("down", () => {
//     p2.enterState("idle");
// });

// onKeyDown("d", () => {
//     p1.lado = 0; // Mirando a la derecha
//     p1.move(PADDLE_SPEED, 0);
//     if (p1.state !== "walk") p1.enterState("walk");
// });
// onKeyRelease("d", () => {
//     p1.enterState("idle");
// });

// onKeyDown("a", () => {
//     p1.lado = 1; // Mirando a la izquierda
//     p1.move(-PADDLE_SPEED, 0);
//     if (p1.state !== "walk") p1.enterState("walk");
// });
// onKeyRelease("a", () => {
//     p1.enterState("idle");
// });

// onKeyDown("left", () => {
//     p2.lado = 1; // Mirando a la izquierda
//     p2.move(-PADDLE_SPEED, 0);
//     if (p2.state !== "walk") p2.enterState("walk");
// });
// onKeyRelease("left", () => {
//     p2.enterState("idle");
// });

// onKeyDown("right", () => {
//     p2.lado = 0; // Mirando a la derecha
//     p2.move(PADDLE_SPEED, 0);
//     if (p2.state !== "walk") p2.enterState("walk");
// });

// onKeyRelease("right", () => {
//     p2.enterState("idle");
// });

// // 2. LA PELOTA
// const ball = add([
//     circle(15),           // Forma circular
//     pos(center()),
//     area(),               // Kaboom maneja colisiones circulares automáticamente con circle()
//     color(255, 0, 0),
//     body({ 
//         gravityScale: 1.5 // Gravedad más pesada (aumenta el valor para más peso)
//     }),
//     {
//         elasticity: 0.75, // Coeficiente de rebote (0 = cae muerto, 1 = rebote infinito)
//         isSquishing: false,
//     }
// ]);

// // Manejador de colisiones para simular el comportamiento gomoso
// ball.onCollide((obj, col) => {
//     // 1. Elasticidad: Invertimos la velocidad y aplicamos el coeficiente
//     // Esto hace que pierda energía con cada rebote (efecto gomoso)
//     ball.vel = ball.vel.scale(-ball.elasticity);

//     // 2. Tiempo de contacto visual (Efecto Squash)
//     // Almacenamos el estado original para recuperarlo
//     if (!ball.isSquishing) {
//         ball.isSquishing = true;
        
//         // Aplastamos la bola en el eje de impacto (simulando deformación)
//         ball.scale = vec2(1.2, 0.8); 
        
//         // Recuperamos la forma después de un breve tiempo (simulando la elasticidad)
//         wait(0.15, () => {
//             ball.scale = vec2(1, 1);
//             ball.isSquishing = false;
//         });
//     }
// });


import kaboom from "kaboom";

kaboom({
    background: [10, 10, 10], // Fondo oscuro estilo arcade
    width: 800,
    height: 600,
});

//Importar sprites
// Cargar una hoja de sprites con animaciones
loadSprite("scott", "sprites/scott.png", {
    sliceX: 8,
    sliceY: 2,
    anims: {
        "idleR": 0,
        "idleL": 8,
        "walkR": { from: 0, to: 7, speed: 10, loop: true },
        "walkL": { from: 8, to: 15, speed: 10, loop: true },
        "hitR": 0, // Ajusta según tu frame de golpe
        "hitL": 8,
    },
});

// Configuración de velocidades
const PADDLE_SPEED = 500;
const BALL_SPEED = 400;

// 1. EL JUGADOR (PALETAS)
function createUllanque(x, lado) {
    const p = add([
        sprite("scott"),
        pos(x, 250),
        area(),
        // Usamos state para manejar las animaciones y el comportamiento
        state("idle", ["idle", "walk", "hitting"]),
        {
            lado, // 0 = derecha, 1 = izquierda
            isHitting: false,
        }
    ]);

    // Lógica automática cuando el estado cambia
    p.onStateEnter("idle", () => {
        p.play(p.lado === 0 ? "idleR" : "idleL");
    });

    p.onStateEnter("walk", () => {
        p.play(p.lado === 0 ? "walkR" : "walkL");
    });

    return p;
}

// Para golpear:
function hitBall(player, ball) {
    player.enterState("hitting");
    // Lógica para enviar la pelota hacia arriba (Tiro parabólico)
    ball.jump(500); // Esto requiere que la bola tenga el componente body()
    
    // Regresar a idle después de 0.2 segundos
    wait(0.2, () => player.enterState("idle"));
}

const p1 = createUllanque(40);
const p2 = createUllanque(740);

// Controles

onKeyDown("w", () => {
    p1.move(0, -PADDLE_SPEED);
    if (p1.state !== "walk") p1.enterState("walk");
});
onKeyRelease("w", () => {
    p1.enterState("idle");
});

onKeyDown("s", () => {
    p1.move(0, PADDLE_SPEED);
    if (p1.state !== "walk") p1.enterState("walk");
});
onKeyRelease("s", () => {
    p1.enterState("idle");
});

onKeyDown("up", () => {
    p2.move(0, -PADDLE_SPEED);
    if (p2.state !== "walk") p2.enterState("walk");
});
onKeyRelease("up", () => {
    p2.enterState("idle");
});

onKeyDown("down", () => {
    p2.move(0, PADDLE_SPEED);
    if (p2.state !== "walk") p2.enterState("walk");
});
onKeyRelease("down", () => {
    p2.enterState("idle");
});

onKeyDown("d", () => {
    p1.lado = 0; // Mirando a la derecha
    p1.move(PADDLE_SPEED, 0);
    if (p1.state !== "walk") p1.enterState("walk");
});
onKeyRelease("d", () => {
    p1.enterState("idle");
});

onKeyDown("a", () => {
    p1.lado = 1; // Mirando a la izquierda
    p1.move(-PADDLE_SPEED, 0);
    if (p1.state !== "walk") p1.enterState("walk");
});
onKeyRelease("a", () => {
    p1.enterState("idle");
});

onKeyDown("left", () => {
    p2.lado = 1; // Mirando a la izquierda
    p2.move(-PADDLE_SPEED, 0);
    if (p2.state !== "walk") p2.enterState("walk");
});
onKeyRelease("left", () => {
    p2.enterState("idle");
});

onKeyDown("right", () => {
    p2.lado = 0; // Mirando a la derecha
    p2.move(PADDLE_SPEED, 0);
    if (p2.state !== "walk") p2.enterState("walk");
});

onKeyRelease("right", () => {
    p2.enterState("idle");
});

// 2. LA PELOTA
const ball = add([
    circle(15),           // Forma circular
    pos(center()),
    area(),               // Kaboom maneja colisiones circulares automáticamente con circle()
    color(255, 0, 0),
    body({ 
        gravityScale: 1.5 // Gravedad más pesada (aumenta el valor para más peso)
    }),
    {
        elasticity: 0.75, // Coeficiente de rebote (0 = cae muerto, 1 = rebote infinito)
        isSquishing: false,
    }
]);

// Manejador de colisiones para simular el comportamiento gomoso
ball.onCollide((obj, col) => {
    // 1. Elasticidad: Invertimos la velocidad y aplicamos el coeficiente
    // Esto hace que pierda energía con cada rebote (efecto gomoso)
    ball.vel = ball.vel.scale(-ball.elasticity);

    // 2. Tiempo de contacto visual (Efecto Squash)
    // Almacenamos el estado original para recuperarlo
    if (!ball.isSquishing) {
        ball.isSquishing = true;
        
        // Aplastamos la bola en el eje de impacto (simulando deformación)
        ball.scale = vec2(1.2, 0.8); 
        
        // Recuperamos la forma después de un breve tiempo (simulando la elasticidad)
        wait(0.15, () => {
            ball.scale = vec2(1, 1);
            ball.isSquishing = false;
        });
    }
});