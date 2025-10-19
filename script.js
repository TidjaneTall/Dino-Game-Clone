// ==================== ENHANCED DINO RUNNER - PHASE 1 FOUNDATION ====================
// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    GRAVITY: 0.6,
    JUMP_STRENGTH: -12,
    INITIAL_SPEED: 6,
    SPEED_INCREMENT: 0.005,
    MAX_SPEED: 12,
    GROUND_HEIGHT: 100,
};

// Game State
let gameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    highScore: localStorage.getItem('dinoHighScore') || 0,
    speed: CONFIG.INITIAL_SPEED,
    lastFrameTime: 0,
};

// DOM Elements
const canvas = document.querySelector('[data-canvas]');
const ctx = canvas.getContext('2d');
const scoreElement = document.querySelector('[data-score]');
const highScoreElement = document.querySelector('[data-highscore]');
const startScreen = document.querySelector('[data-start-screen]');
const gameOverScreen = document.querySelector('[data-game-over-screen]');
const finalScoreElement = document.querySelector('[data-final-score]');

// Initialize Canvas
function initCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

// Player Object (Dino)
const player = {
    x: 100,
    y: 0,
    width: 50,
    height: 50,
    velocityY: 0,
    isJumping: false,
    color: '#1a73e8', // Google Blue
    
    draw() {
        const groundY = canvas.height - CONFIG.GROUND_HEIGHT;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, groundY - this.y - this.height, this.width, this.height);
    },
    
    update() {
        if (this.isJumping || this.y > 0) {
            this.velocityY += CONFIG.GRAVITY;
            this.y -= this.velocityY;
            
            if (this.y <= 0) {
                this.y = 0;
                this.velocityY = 0;
                this.isJumping = false;
            }
        }
    },
    
    jump() {
        if (!this.isJumping && this.y === 0) {
            this.velocityY = CONFIG.JUMP_STRENGTH;
            this.isJumping = true;
        }
    },
    
    reset() {
        this.y = 0;
        this.velocityY = 0;
        this.isJumping = false;
    }
};

// Obstacles Array
const obstacles = [];

// Obstacle Class
class Obstacle {
    constructor(x) {
        this.x = x;
        this.width = 30;
        this.height = 60;
        this.color = '#535353';
    }
    
    draw() {
        const groundY = canvas.height - CONFIG.GROUND_HEIGHT;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, groundY - this.height, this.width, this.height);
    }
    
    update() {
        this.x -= gameState.speed;
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    collidesWith(player) {
        const groundY = canvas.height - CONFIG.GROUND_HEIGHT;
        const playerBottom = groundY - player.y;
        const playerTop = playerBottom - player.height;
        const playerRight = player.x + player.width;
        
        const obstacleTop = groundY - this.height;
        const obstacleBottom = groundY;
        const obstacleRight = this.x + this.width;
        
        return (
            player.x < obstacleRight &&
            playerRight > this.x &&
            playerTop < obstacleBottom &&
            playerBottom > obstacleTop
        );
    }
}

// Game Functions
function spawnObstacle() {
    const lastObstacle = obstacles[obstacles.length - 1];
    const minDistance = 400;
    const maxDistance = 700;
    
    if (!lastObstacle || lastObstacle.x < canvas.width - minDistance) {
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        obstacles.push(new Obstacle(canvas.width + distance));
    }
}

function updateObstacles() {
    obstacles.forEach(obstacle => obstacle.update());
    obstacles.forEach(obstacle => {
        if (obstacle.collidesWith(player)) {
            gameOver();
        }
    });
    
    // Remove off-screen obstacles
    while (obstacles.length > 0 && obstacles[0].isOffScreen()) {
        obstacles.shift();
        gameState.score += 10;
    }
}

function drawGround() {
    const groundY = canvas.height - CONFIG.GROUND_HEIGHT;
    
    // Ground
    ctx.fillStyle = '#C2B280';
    ctx.fillRect(0, groundY, canvas.width, CONFIG.GROUND_HEIGHT);
    
    // Ground line
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#E0F6FF');
    gradient.addColorStop(1, '#C2B280');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateScore() {
    if (gameState.isRunning) {
        gameState.score += 0.1;
        scoreElement.textContent = Math.floor(gameState.score);
    }
}

function updateSpeed() {
    if (gameState.speed < CONFIG.MAX_SPEED) {
        gameState.speed += CONFIG.SPEED_INCREMENT;
    }
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw everything
    drawBackground();
    drawGround();
    obstacles.forEach(obstacle => obstacle.draw());
    player.draw();
}

function gameLoop(timestamp) {
    if (!gameState.isRunning) return;
    
    const deltaTime = timestamp - gameState.lastFrameTime;
    gameState.lastFrameTime = timestamp;
    
    // Update
    player.update();
    updateObstacles();
    spawnObstacle();
    updateScore();
    updateSpeed();
    
    // Render
    render();
    
    // Next frame
    requestAnimationFrame(gameLoop);
}

function startGame() {
    // Hide start screen
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    // Reset game state
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.speed = CONFIG.INITIAL_SPEED;
    obstacles.length = 0;
    player.reset();
    
    // Update display
    scoreElement.textContent = '0';
    highScoreElement.textContent = gameState.highScore;
    
    // Start loop
    gameState.lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState.isRunning = false;
    
    // Update high score
    const finalScore = Math.floor(gameState.score);
    if (finalScore > gameState.highScore) {
        gameState.highScore = finalScore;
        localStorage.setItem('dinoHighScore', finalScore);
        highScoreElement.textContent = finalScore;
    }
    
    // Show game over screen
    finalScoreElement.textContent = finalScore;
    gameOverScreen.style.display = 'block';
}

// Event Listeners
function handleJump(e) {
    if (e.code === 'Space' || e.type === 'click') {
        e.preventDefault();
        
        if (!gameState.isRunning && startScreen.style.display !== 'none') {
            startGame();
        } else if (!gameState.isRunning && gameOverScreen.style.display !== 'none') {
            startGame();
        } else if (gameState.isRunning) {
            player.jump();
        }
    }
}

document.addEventListener('keydown', handleJump);
canvas.addEventListener('click', handleJump);

// Window resize handler
window.addEventListener('resize', () => {
    initCanvas();
    if (!gameState.isRunning) {
        render();
    }
});

// Initialize
initCanvas();
highScoreElement.textContent = gameState.highScore;
render(); // Draw initial state
