document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const player1ScoreDisplay = document.getElementById('player1Score');
    const player2ScoreDisplay = document.getElementById('player2Score');
    const player1RoleDisplay = document.getElementById('player1Role');
    const player2RoleDisplay = document.getElementById('player2Role');
    const currentRoundDisplay = document.getElementById('currentRoundDisplay');
    const maxRoundsDisplay = document.getElementById('maxRoundsDisplay'); // Not used yet, but good for future
    const gameMessageDisplay = document.getElementById('gameMessage');
    const startButton = document.getElementById('startButton');

    const TILE_SIZE = 30;
    const MAZE_COLS = 21; // Odd number for better maze structure
    const MAZE_ROWS = 15; // Odd number

    canvas.width = MAZE_COLS * TILE_SIZE;
    canvas.height = MAZE_ROWS * TILE_SIZE;

    const WALL = 1;
    const PATH = 0;
    const GEM = 2;
    const POWERUP = 3; // Future use

    // Simple predefined maze (1 = wall, 0 = path, 2 = gem)
    // Ensure borders are walls.
    let maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,1,2,0,2,0,2,1,2,0,2,0,2,1,0,2,0,1],
        [1,2,1,2,1,0,1,1,1,0,1,0,1,1,1,0,1,2,1,2,1],
        [1,0,1,0,0,2,0,2,0,2,0,2,0,2,0,2,0,0,1,0,1],
        [1,2,1,0,1,1,2,1,1,0,1,0,1,1,2,1,1,0,1,2,1],
        [1,0,0,2,0,2,0,2,1,2,1,2,1,2,0,2,0,2,0,0,1],
        [1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1],
        [1,0,0,2,1,2,0,2,0,2,0,2,0,2,0,2,1,2,0,0,1], // Middle row
        [1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1],
        [1,0,0,2,0,2,0,2,1,2,1,2,1,2,0,2,0,2,0,0,1],
        [1,2,1,0,1,1,2,1,1,0,1,0,1,1,2,1,1,0,1,2,1],
        [1,0,1,0,0,2,0,2,0,2,0,2,0,2,0,2,0,0,1,0,1],
        [1,2,1,2,1,0,1,1,1,0,1,0,1,1,1,0,1,2,1,2,1],
        [1,0,2,0,1,2,0,2,0,2,1,2,0,2,0,2,1,0,2,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];
    let originalMazeState; // To store the initial maze with gems for reset

    const PLAYER_SPEED = TILE_SIZE / 6; // Moves a fraction of a tile per frame

    let player1, player2;
    let currentRound = 0;
    const MAX_POINTS_TO_WIN = 3;
    let totalGems = 0;
    let gemsCollected = 0;

    let gameState = 'INITIAL'; // INITIAL, READY, PLAYING, ROUND_OVER, GAME_OVER

    // --- Player Class ---
    class Player {
        constructor(x, y, color, isPlayer1) {
            this.x = x * TILE_SIZE + TILE_SIZE / 2; // Center of the tile
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.radius = TILE_SIZE / 3;
            this.color = color;
            this.dx = 0;
            this.dy = 0;
            this.nextDx = 0;
            this.nextDy = 0;
            this.role = null; // 'RUNNER' or 'CHASER'
            this.isPlayer1 = isPlayer1;
            this.score = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            if (this.role === 'CHASER') {
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.closePath();
        }

        update() {
            this.tryMove();
        }
        
        tryMove() {
            const currentTileX = Math.floor(this.x / TILE_SIZE);
            const currentTileY = Math.floor(this.y / TILE_SIZE);

            // Check if at center of a tile to allow turning
            const atCenterOfTileX = Math.abs(this.x - (currentTileX * TILE_SIZE + TILE_SIZE / 2)) < PLAYER_SPEED /2;
            const atCenterOfTileY = Math.abs(this.y - (currentTileY * TILE_SIZE + TILE_SIZE / 2)) < PLAYER_SPEED /2;

            if (atCenterOfTileX && atCenterOfTileY) {
                 // Snap to center if very close, prevents drifting
                this.x = currentTileX * TILE_SIZE + TILE_SIZE / 2;
                this.y = currentTileY * TILE_SIZE + TILE_SIZE / 2;

                // Try to apply next direction
                if (this.nextDx !== 0 || this.nextDy !== 0) {
                    const nextTileX_check = currentTileX + this.nextDx;
                    const nextTileY_check = currentTileY + this.nextDy;
                    if (!isWall(nextTileX_check, nextTileY_check)) {
                        this.dx = this.nextDx;
                        this.dy = this.nextDy;
                    }
                }
            }
            
            // Continue with current direction if possible
            const nextPotentialX = this.x + this.dx * PLAYER_SPEED;
            const nextPotentialY = this.y + this.dy * PLAYER_SPEED;

            const targetTileX = Math.floor((this.x + this.dx * (this.radius + PLAYER_SPEED) ) / TILE_SIZE);
            const targetTileY = Math.floor((this.y + this.dy * (this.radius + PLAYER_SPEED) ) / TILE_SIZE);
            
            if (!isWall(targetTileX, targetTileY) || (this.dx === 0 && this.dy === 0) ) {
                 if (isWallForDirection(this.x, this.y, this.dx, this.dy, this.radius)) {
                    // If moving towards a wall, stop
                    if (atCenterOfTileX && atCenterOfTileY) { // Only stop if at center
                         this.dx = 0;
                         this.dy = 0;
                    }
                 } else {
                    this.x = nextPotentialX;
                    this.y = nextPotentialY;
                 }
            } else if (atCenterOfTileX && atCenterOfTileY) { // Hit a wall and at center
                this.dx = 0;
                this.dy = 0;
            }


            // Collect Gem if Runner
            if (this.role === 'RUNNER') {
                const runnerTileX = Math.floor(this.x / TILE_SIZE);
                const runnerTileY = Math.floor(this.y / TILE_SIZE);
                if (maze[runnerTileY] && maze[runnerTileY][runnerTileX] === GEM) {
                    maze[runnerTileY][runnerTileX] = PATH;
                    gemsCollected++;
                    if (gemsCollected >= totalGems) {
                        endRound(this); // Runner wins
                    }
                }
            }
        }

        setDirection(dx, dy) {
            this.nextDx = dx;
            this.nextDy = dy;
            // If standing still, apply immediately if possible
            if (this.dx === 0 && this.dy === 0) {
                const currentTileX = Math.floor(this.x / TILE_SIZE);
                const currentTileY = Math.floor(this.y / TILE_SIZE);
                const nextTileX_check = currentTileX + this.nextDx;
                const nextTileY_check = currentTileY + this.nextDy;
                if (!isWall(nextTileX_check, nextTileY_check)) {
                    this.dx = this.nextDx;
                    this.dy = this.nextDy;
                }
            }
        }

        resetPosition(x, y) {
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.dx = 0;
            this.dy = 0;
            this.nextDx = 0;
            this.nextDy = 0;
        }
    }
    
    function isWallForDirection(x, y, dx, dy, radius) {
        if (dx === 0 && dy === 0) return false; // Not moving

        // Calculate the leading edge of the player
        let checkX = x;
        let checkY = y;

        if (dx > 0) checkX += radius;
        if (dx < 0) checkX -= radius;
        if (dy > 0) checkY += radius;
        if (dy < 0) checkY -= radius;
        
        // Project slightly into the next tile
        checkX += dx * (PLAYER_SPEED * 0.5); // Check slightly ahead
        checkY += dy * (PLAYER_SPEED * 0.5);

        const tileX = Math.floor(checkX / TILE_SIZE);
        const tileY = Math.floor(checkY / TILE_SIZE);
        
        return isWall(tileX, tileY);
    }


    // --- Game Logic ---
    function initGame() {
        originalMazeState = JSON.parse(JSON.stringify(maze)); // Deep copy
        countTotalGems();

        player1 = new Player(1, 1, '#42A5F5', true); // Blue
        player2 = new Player(MAZE_COLS - 2, MAZE_ROWS - 2, '#FFEE58', false); // Yellow
        
        player1.score = 0;
        player2.score = 0;
        currentRound = 0;
        gameState = 'INITIAL';
        gameMessageDisplay.textContent = "Press Enter or Click Start";
        startButton.style.display = 'inline-block';
        startButton.onclick = () => {
            if (gameState === 'INITIAL' || gameState === 'GAME_OVER') {
                startGameSequence();
            }
        };
        updateScoreboard();
        draw(); // Draw initial state
    }

    function startGameSequence() {
        player1.score = 0;
        player2.score = 0;
        currentRound = 0;
        startButton.style.display = 'none';
        startNewRound();
    }
    
    function countTotalGems() {
        totalGems = 0;
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                if (originalMazeState[r][c] === GEM) {
                    totalGems++;
                }
            }
        }
    }

    function resetMaze() {
        maze = JSON.parse(JSON.stringify(originalMazeState));
        gemsCollected = 0;
    }

    function startNewRound() {
        currentRound++;
        if (currentRound > 1 && (player1.score >= MAX_POINTS_TO_WIN || player2.score >= MAX_POINTS_TO_WIN)) {
            endGame();
            return;
        }

        resetMaze();
        
        // Assign roles (Player 1 is Runner in odd rounds, Chaser in even)
        if (currentRound % 2 === 1) {
            player1.role = 'RUNNER';
            player1.color = '#FFEB3B'; // Yellow
            player2.role = 'CHASER';
            player2.color = '#F44336'; // Red
        } else {
            player1.role = 'CHASER';
            player1.color = '#F44336';
            player2.role = 'RUNNER';
            player2.color = '#FFEB3B';
        }

        // Reset positions
        // Runner starts top-left, Chaser bottom-right, or vice-versa
        if (player1.role === 'RUNNER') {
            player1.resetPosition(1, 1);
            player2.resetPosition(MAZE_COLS - 2, MAZE_ROWS - 2);
        } else {
            player2.resetPosition(1, 1);
            player1.resetPosition(MAZE_COLS - 2, MAZE_ROWS - 2);
        }
        
        updateScoreboard();
        currentRoundDisplay.textContent = currentRound;
        maxRoundsDisplay.textContent = "First to " + MAX_POINTS_TO_WIN;


        gameState = 'READY';
        let countdown = 3;
        gameMessageDisplay.textContent = `Round ${currentRound}! Get Ready... ${countdown}`;
        
        const readyInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                gameMessageDisplay.textContent = `Get Ready... ${countdown}`;
            } else {
                clearInterval(readyInterval);
                gameMessageDisplay.textContent = `${player1.role === 'RUNNER' ? "P1 (Runner)" : "P2 (Runner)"} GO!`;
                gameState = 'PLAYING';
                if (currentRound === 1 && animationFrameId === null) { // Start game loop only once
                     gameLoop();
                }
            }
        }, 1000);
    }

    function endRound(winnerPlayer) {
        if (gameState !== 'PLAYING') return; // Prevent multiple triggers

        gameState = 'ROUND_OVER';
        let roundWinnerMessage;

        if (winnerPlayer.role === 'RUNNER') {
            roundWinnerMessage = `${winnerPlayer.isPlayer1 ? "Player 1" : "Player 2"} (Runner) wins the round!`;
            winnerPlayer.score++;
        } else { // Chaser won by catching
            roundWinnerMessage = `${winnerPlayer.isPlayer1 ? "Player 1" : "Player 2"} (Chaser) wins the round!`;
            winnerPlayer.score++;
        }
        gameMessageDisplay.textContent = roundWinnerMessage;
        updateScoreboard();

        setTimeout(() => {
            if (player1.score >= MAX_POINTS_TO_WIN || player2.score >= MAX_POINTS_TO_WIN) {
                endGame();
            } else {
                startNewRound();
            }
        }, 3000); // 3 seconds pause before next round or game over
    }
    
    function endGame() {
        gameState = 'GAME_OVER';
        let finalMessage;
        if (player1.score > player2.score) {
            finalMessage = `Player 1 Wins the Game! (${player1.score}-${player2.score})`;
        } else if (player2.score > player1.score) {
            finalMessage = `Player 2 Wins the Game! (${player2.score}-${player1.score})`;
        } else {
            finalMessage = `It's a Tie! (${player1.score}-${player2.score})`; // Should not happen with MAX_POINTS logic
        }
        gameMessageDisplay.textContent = finalMessage + " Press Enter or Start to Play Again.";
        startButton.style.display = 'inline-block';
        currentRoundDisplay.textContent = "-"; // Reset round display
    }

    function updateScoreboard() {
        player1ScoreDisplay.textContent = player1.score;
        player2ScoreDisplay.textContent = player2.score;

        player1RoleDisplay.textContent = `(${player1.role || ''})`;
        player2RoleDisplay.textContent = `(${player2.role || ''})`;
        
        player1RoleDisplay.className = player1.role === 'RUNNER' ? 'runner-role' : (player1.role === 'CHASER' ? 'chaser-role' : '');
        player2RoleDisplay.className = player2.role === 'RUNNER' ? 'runner-role' : (player2.role === 'CHASER' ? 'chaser-role' : '');
    }

    function isWall(x, y) {
        if (x < 0 || x >= MAZE_COLS || y < 0 || y >= MAZE_ROWS) {
            return true; // Out of bounds is a wall
        }
        return maze[y][x] === WALL;
    }

    function checkCollision() {
        let runner, chaser;
        if (player1.role === 'RUNNER') {
            runner = player1;
            chaser = player2;
        } else {
            runner = player2;
            chaser = player1;
        }

        const dx = runner.x - chaser.x;
        const dy = runner.y - chaser.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < runner.radius + chaser.radius) {
            endRound(chaser); // Chaser wins by catching
        }
    }

    // --- Drawing ---
    function drawMaze() {
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                ctx.fillStyle = '#000'; // Path base
                if (maze[r][c] === WALL) {
                    ctx.fillStyle = '#3F51B5'; // Indigo Wall
                }
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                if (maze[r][c] === GEM) {
                    ctx.beginPath();
                    ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700'; // Gold Gem
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        drawMaze();
        if (player1) player1.draw();
        if (player2) player2.draw();
    }

    // --- Game Loop ---
    let animationFrameId = null;
    function gameLoop() {
        if (gameState === 'PLAYING') {
            player1.update();
            player2.update();
            checkCollision();
        }
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    // --- Event Listeners ---
    document.addEventListener('keydown', (e) => {
        if (gameState === 'INITIAL' || gameState === 'GAME_OVER') {
            if (e.key === 'Enter') {
                startGameSequence();
            }
            return;
        }
        if (gameState !== 'PLAYING') return;

        // Player 1 (WASD)
        if (player1) {
            if (e.key === 'w' || e.key === 'W') player1.setDirection(0, -1); // Up
            else if (e.key === 's' || e.key === 'S') player1.setDirection(0, 1); // Down
            else if (e.key === 'a' || e.key === 'A') player1.setDirection(-1, 0); // Left
            else if (e.key === 'd' || e.key === 'D') player1.setDirection(1, 0); // Right
        }

        // Player 2 (Arrow Keys)
        if (player2) {
            if (e.key === 'ArrowUp') player2.setDirection(0, -1);
            else if (e.key === 'ArrowDown') player2.setDirection(0, 1);
            else if (e.key === 'ArrowLeft') player2.setDirection(-1, 0);
            else if (e.key === 'ArrowRight') player2.setDirection(1, 0);
        }
    });

    // Start
    initGame();
});
