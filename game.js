const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let keys = {};

let mouse = {
    x: 400,
    y: 250,
    down: false
};

let player = {
    x: 380,
    y: 230,
    width: 40,
    height: 40,
    speed: 4,
    shootCooldown: 0
};

let base = {
    x: 350,
    y: 200,
    width: 100,
    height: 100,
    health: 150,
    maxHealth: 150
};

let bullets = [];
let enemies = [];

let wave = 1;
let enemiesLeft = 6;
let enemiesSpawned = 0;
let spawnTimer = 0;
let waveDelay = 120;

let coins = 0;
let score = 0;

let gameOver = false;
let victory = false;

let message = "Survive 10 waves!";

document.addEventListener("keydown", function(event) {
    keys[event.key.toLowerCase()] = true;

    if (event.key.toLowerCase() === "r" && gameOver) {
        restartGame();
    }

    if (event.key.toLowerCase() === "u" && !gameOver) {
        buyUpgrade();
    }
});

document.addEventListener("keyup", function(event) {
    keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", function(event) {
    let rectangle = canvas.getBoundingClientRect();

    mouse.x = event.clientX - rectangle.left;
    mouse.y = event.clientY - rectangle.top;
});

canvas.addEventListener("mousedown", function() {
    mouse.down = true;
});

canvas.addEventListener("mouseup", function() {
    mouse.down = false;
});

function touching(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function movePlayer() {
    if (keys["w"] || keys["arrowup"]) {
        player.y -= player.speed;
    }

    if (keys["s"] || keys["arrowdown"]) {
        player.y += player.speed;
    }

    if (keys["a"] || keys["arrowleft"]) {
        player.x -= player.speed;
    }

    if (keys["d"] || keys["arrowright"]) {
        player.x += player.speed;
    }

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.y < 0) {
        player.y = 0;
    }

    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function shoot() {
    if (player.shootCooldown > 0) {
        return;
    }

    let playerCenterX = player.x + player.width / 2;
    let playerCenterY = player.y + player.height / 2;

    let dx = mouse.x - playerCenterX;
    let dy = mouse.y - playerCenterY;

    let length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
        return;
    }

    dx /= length;
    dy /= length;

    bullets.push({
        x: playerCenterX,
        y: playerCenterY,
        width: 8,
        height: 8,
        dx: dx * 8,
        dy: dy * 8,
        damage: 30
    });

    player.shootCooldown = 9;
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        let bullet = bullets[i];

        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (
            bullet.x < 0 ||
            bullet.x > canvas.width ||
            bullet.y < 0 ||
            bullet.y > canvas.height
        ) {
            bullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            let enemy = enemies[j];

            if (touching(bullet, enemy)) {
                enemy.health -= bullet.damage;
                bullets.splice(i, 1);

                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    coins += 5;
                    score += 10;
                }

                break;
            }
        }
    }
}

function spawnEnemy() {
    let side = Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * canvas.width;
        y = -40;
    } else if (side === 1) {
        x = canvas.width + 40;
        y = Math.random() * canvas.height;
    } else if (side === 2) {
        x = Math.random() * canvas.width;
        y = canvas.height + 40;
    } else {
        x = -40;
        y = Math.random() * canvas.height;
    }

    let enemyHealth = 35 + wave * 8;
    let enemySpeed = 0.6 + wave * 0.06;

    enemies.push({
        x: x,
        y: y,
        width: 30,
        height: 30,
        speed: enemySpeed,
        health: enemyHealth,
        maxHealth: enemyHealth,
        damageCooldown: 0
    });

    enemiesSpawned++;
}

function updateEnemies() {
    for (let enemy of enemies) {
        let targetX = base.x + base.width / 2;
        let targetY = base.y + base.height / 2;

        let enemyCenterX = enemy.x + enemy.width / 2;
        let enemyCenterY = enemy.y + enemy.height / 2;

        let dx = targetX - enemyCenterX;
        let dy = targetY - enemyCenterY;

        let length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
            dx /= length;
            dy /= length;
        }

        if (touching(enemy, base)) {
            if (enemy.damageCooldown <= 0) {
                base.health -= 4;
                enemy.damageCooldown = 40;
            }
        } else {
            enemy.x += dx * enemy.speed;
            enemy.y += dy * enemy.speed;
        }

        if (enemy.damageCooldown > 0) {
            enemy.damageCooldown--;
        }
    }
}

function updateWave() {
    if (enemiesSpawned < enemiesLeft) {
        spawnTimer--;

        if (spawnTimer <= 0) {
            spawnEnemy();
            spawnTimer = 45;
        }
    } else if (enemies.length === 0) {
        if (wave < 10) {
            waveDelay--;

            message = "Next wave in " + Math.ceil(waveDelay / 60);

            if (waveDelay <= 0) {
                wave++;

                enemiesLeft = 5 + wave * 2;
                enemiesSpawned = 0;
                waveDelay = 120;

                message = "Wave " + wave + " started!";
            }
        } else {
            victory = true;
            gameOver = true;
            message = "You survived all 10 waves!";
        }
    }
}

function buyUpgrade() {
    if (coins >= 20) {
        coins -= 20;
        player.speed += 0.5;

        message = "Upgrade purchased! You move faster.";
    } else {
        message = "You need 20 coins for an upgrade.";
    }
}

function update() {
    if (gameOver) {
        return;
    }

    movePlayer();

    if (player.shootCooldown > 0) {
        player.shootCooldown--;
    }

    if (mouse.down) {
        shoot();
    }

    updateBullets();
    updateEnemies();
    updateWave();

    if (base.health <= 0) {
        base.health = 0;
        gameOver = true;
        victory = false;
        message = "Your base was destroyed!";
    }
}

function drawHealthBar(x, y, width, height, health, maxHealth) {
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = "limegreen";
    ctx.fillRect(
        x,
        y,
        width * (health / maxHealth),
        height
    );

    ctx.strokeStyle = "white";
    ctx.strokeRect(x, y, width, height);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Base
    ctx.fillStyle = "blue";
    ctx.fillRect(
        base.x,
        base.y,
        base.width,
        base.height
    );

    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText("BASE", base.x + 28, base.y + 55);

    drawHealthBar(
        base.x,
        base.y - 15,
        base.width,
        10,
        base.health,
        base.maxHealth
    );

    // Bullets
    for (let bullet of bullets) {
        ctx.fillStyle = "yellow";

        ctx.fillRect(
            bullet.x,
            bullet.y,
            bullet.width,
            bullet.height
        );
    }

    // Enemies
    for (let enemy of enemies) {
        ctx.fillStyle = "crimson";

        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height
        );

        drawHealthBar(
            enemy.x,
            enemy.y - 8,
            enemy.width,
            5,
            enemy.health,
            enemy.maxHealth
        );
    }

    // Player
    ctx.fillStyle = "cyan";

    ctx.fillRect(
        player.x,
        player.y,
        player.width,
        player.height
    );

    // Aiming line
    ctx.strokeStyle = "white";

    ctx.beginPath();
    ctx.moveTo(
        player.x + player.width / 2,
        player.y + player.height / 2
    );
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();

    // Text
    ctx.fillStyle = "white";
    ctx.font = "22px Arial";
    ctx.fillText(message, 20, 30);

    ctx.font = "18px Arial";
    ctx.fillText("Wave: " + wave + " / 10", 20, 60);
    ctx.fillText("Coins: " + coins, 20, 85);
    ctx.fillText("Score: " + score, 20, 110);

    ctx.fillText(
        "W/A/S/D: Move | Mouse: Aim and Shoot | U: Upgrade",
        180,
        480
    );

    // Game-over screen
    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = victory
            ? "limegreen"
            : "red";

        ctx.font = "48px Arial";

        ctx.fillText(
            victory ? "YOU WIN!" : "GAME OVER",
            270,
            230
        );

        ctx.fillStyle = "white";
        ctx.font = "26px Arial";

        ctx.fillText(
            "Final Score: " + score,
            300,
            280
        );

        ctx.fillText(
            "Press R to restart",
            290,
            330
        );
    }
}

function restartGame() {
    player.x = 380;
    player.y = 230;
    player.speed = 4;
    player.shootCooldown = 0;

    base.health = 150;

    bullets = [];
    enemies = [];

    wave = 1;
    enemiesLeft = 6;
    enemiesSpawned = 0;
    spawnTimer = 0;
    waveDelay = 120;

    coins = 0;
    score = 0;

    gameOver = false;
    victory = false;

    message = "Survive 10 waves!";
}

restartGame();

function gameLoop() {
    update();
    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();