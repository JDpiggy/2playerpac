document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const player1ScoreDisplay = document.getElementById('player1Score');
    const player2ScoreDisplay = document.getElementById('player2Score');
    const player1RoleDisplay = document.getElementById('player1Role');
    const player2RoleDisplay = document.getElementById('player2Role');
    const currentRoundDisplay = document.getElementById('currentRoundDisplay');
    const maxRoundsDisplay = document.getElementById('maxRoundsDisplay');
    const gameMessageDisplay = document.getElementById('gameMessage');
    const startButton = document.getElementById('startButton');

    const TILE_SIZE = 30;
    const MAZE_COLS = 21;
    const MAZE_ROWS = 15;

    canvas.width = MAZE_COLS * TILE_SIZE;
    canvas.height = MAZE_ROWS * TILE_SIZE;

    const WALL = 1;
    const PATH = 0;
    const GEM = 2;

    let maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,1,2,0,2,0,2,1,2,0,2,0,2,1,0,2,0,1],
        [1,2,1,2,1,0,1,1,1,0,1,0,1,1,1,0,1,2,1,2,1],
        [1,0,1,0,0,2,0,2,0,2,0,2,0,2,0,2,0,0,1,0,1],
        [1,2,1,0,1,1,2,1,1,0,1,0,1,1,2,1,1,0,1,2,1],
        [1,0,0,2,0,2,0,2,1,2,1,2,1,2,0,2,0,2,0,0,1],
        [1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1],
        [1,0,0,2,1,2,0,2,0,2,0,2,0,2,0,2,1,2,0,0,1],
        [1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1],
        [1,0,0,2,0,2,0,2,1,2,1,2,1,2,0,2,0,2,0,0,1],
        [1,2,1,0,1,1,2,1,1,0,1,0,1,1,2,1,1,0,1,2,1],
        [1,0,1,0,0,2,0,2,0,2,0,2,0,2,0,2,0,0,1,0,1],
        [1,2,1,2,1,0,1,1,1,0,1,0,1,1,1,0,1,2,1,2,1],
        [1,0,2,0,1,2,0,2,0,2,1,2,0,2,0,2,1,0,2,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];
    let originalMazeState;

    const PLAYER_SPEED = TILE_SIZE / 5; // Slightly faster

    let player1, player2;
    let currentRound = 0;
    const MAX_POINTS_TO_WIN = 5; // Changed to 5
    let totalGems = 0;
    let gemsCollected = 0;

    let gameState = 'INITIAL';
    let animationFrameId = null;

    class Player {
        constructor(x, y, color, isPlayer1) {
            this.startX = x;
            this.startY = y;
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.radius = TILE_SIZE / 3;
            this.color = color;
            this.dx = 0; // Current horizontal speed component (-1, 0, or 1)
            this.dy = 0; // Current vertical speed component (-1, 0, or 1)
            this.queuedDx = 0; // Next intended horizontal direction
            this.queuedDy = 0; // Next intended vertical direction
            this.role = null;
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
            const currentTileX = Math.floor(this.x / TILE_SIZE);
            const currentTileY = Math.floor(this.y / TILE_SIZE);
            const targetX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
            const targetY = currentTileY * TILE_SIZE + TILE_SIZE / 2;

            const atCenterOfTile = Math.abs(this.x - targetX) < PLAYER_SPEED / 2 &&
                                   Math.abs(this.y - targetY) < PLAYER_SPEED / 2;

            if (atCenterOfTile) {
                // Snap to center
                this.x = targetX;
                this.y = targetY;

                // Try to apply queued direction
                if (this.queuedDx !== 0 || this.queuedDy !== 0) {
                    const nextTileX_check = currentTileX + this.queuedDx;
                    const nextTileY_check = currentTileY + this.queuedDy;
                    if (!isWall(nextTileX_check, nextTileY_check)) {
                        this.dx = this.queuedDx;
                        this.dy = this.queuedDy;
                    }
                    this.queuedDx = 0; // Clear queue whether successful or not for this logic
                    this.queuedDy = 0;
                }
            }

            // Calculate potential next position based on current direction (dx, dy)
            const nextX = this.x + this.dx * PLAYER_SPEED;
            const nextY = this.y + this.dy * PLAYER_SPEED;

            // Determine the tile the player would move into
            // For collision, check the *center* of the tile they are trying to enter
            const nextTileCenterX = currentTileX + this.dx;
            const nextTileCenterY = currentTileY + this.dy;

            if (this.dx !== 0 || this.dy !== 0) { // Only check for wall if moving
                if (!isWall(nextTileCenterX, nextTileCenterY)) {
                    this.x = nextX;
                    this.y = nextY;
                } else {
                    // Hit a wall, stop at the center of the current tile
                    this.x = targetX;
                    this.y = targetY;
                    this.dx = 0;
                    this.dy = 0;
                    // If there was a queued turn that also leads to a wall, it won't be taken.
                    // Player must input a new valid direction.
                }
            }


            // Collect Gem if Runner
            if (this.role === 'RUNNER') {
                // Use the tile the player's center is currently in
                const runnerTileX = Math.floor(this.x / TILE_SIZE);
                const runnerTileY = Math.floor(this.y / TILE_SIZE);
                if (maze[runnerTileY] && maze[runnerTileY][runnerTileX] === GEM) {
                    maze[runnerTileY][runnerTileX] = PATH;
                    gemsCollected++;
                    if (gemsCollected >= totalGems) {
                        endRound(this);
                    }
                }
            }
        }

        setDirection(newDx, newDy) {
            // Don't allow reversing direction instantly unless at center of tile
            const currentTileX = Math.floor(this.x / TILE_SIZE);
            const currentTileY = Math.floor(this.y / TILE_SIZE);
            const targetX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
            const targetY = currentTileY * TILE_SIZE + TILE_SIZE / 2;
            const atCenterOfTile = Math.abs(this.x - targetX) < PLAYER_SPEED / 2 &&
                                   Math.abs(this.y - targetY) < PLAYER_SPEED / 2;

            if (atCenterOfTile) {
                // If at center, try to apply new direction immediately if valid
                const nextTileX_check = currentTileX + newDx;
                const nextTileY_check = currentTileY + newDy;
                if (!isWall(nextTileX_check, nextTileY_check)) {
                    this.dx = newDx;
                    this.dy = newDy;
                    this.queuedDx = 0; // Clear queue
                    this.queuedDy = 0;
                } else { // If immediate turn is into a wall, queue it
                    this.queuedDx = newDx;
                    this.queuedDy = newDy;
                }
            } else {
                 // If not at center, queue the direction
                 this.queuedDx = newDx;
                 this.queuedDy = newDy;
            }
        }

        resetPosition(tileX, tileY) {
            this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
            this.y = tileY * TILE_SIZE + TILE_SIZE / 2;
            this.dx = 0;
            this.dy = 0;
            this.queuedDx = 0;
            this.queuedDy = 0;
        }
    }

    function initGame() {
        originalMazeState = JSON.parse(JSON.stringify(maze));
        countTotalGems();

        player1 = new Player(1, 1, '#42A5F5', true);
        player2 = new Player(MAZE_COLS - 2, MAZE_ROWS - 2, '#FFEE58', false);
        
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
        draw();
        if (animationFrameId) cancelAnimationFrame(animationFrameId); // Stop any previous loop
        animationFrameId = requestAnimationFrame(gameLoop); // Start the main game loop
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
        
        if (currentRound % 2 === 1) {
            player1.role = 'RUNNER';
            player1.color = '#FFEB3B';
            player2.role = 'CHASER';
            player2.color = '#F44336';
        } else {
            player1.role = 'CHASER';
            player1.color = '#F44336';
            player2.role = 'RUNNER';
            player2.color = '#FFEB3B';
        }

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
            }
        }, 1000);
    }

    function endRound(winnerPlayer) {
        if (gameState !== 'PLAYING') return;

        gameState = 'ROUND_OVER';
        let roundWinnerMessage;

        if (winnerPlayer.role === 'RUNNER') {
            roundWinnerMessage = `${winnerPlayer.isPlayer1 ? "Player 1" : "Player 2"} (Runner) wins the round!`;
            winnerPlayer.score++;
        } else {
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
        }, 3000);
    }
    
    function endGame() {
        gameState = 'GAME_OVER';
        let finalMessage;
        if (player1.score > player2.score) {
            finalMessage = `Player 1 Wins the Game! (${player1.score}-${player2.score})`;
        } else if (player2.score > player1.score) {
            finalMessage = `Player 2 Wins the Game! (${player2.score}-${player1.score})`;
        } else { // Should be rare with MAX_POINTS_TO_WIN
            finalMessage = `It's a Tie! (${player1.score}-${player2.score})`;
        }
        gameMessageDisplay.textContent = finalMessage + " Press Enter or Start to Play Again.";
        startButton.style.display = 'inline-block';
        currentRoundDisplay.textContent = "-";
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
            return true;
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

        if (distance < runner.radius + chaser.radius - (PLAYER_SPEED / 2)) { // Slightly more lenient collision
            endRound(chaser);
        }
    }

    function drawMaze() {
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                ctx.fillStyle = '#000';
                if (maze[r][c] === WALL) {
                    ctx.fillStyle = '#3F51B5';
                }
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                if (maze[r][c] === GEM) {
                    ctx.beginPath();
                    ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700';
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        if (player1) player1.draw();
        if (player2) player2.draw();
    }
    
    function gameLoop() {
        if (gameState === 'PLAYING') {
            if (player1) player1.update();
            if (player2) player2.update();
            checkCollision();
        }
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (gameState === 'INITIAL' || gameState === 'GAME_OVER') {
            if (e.key === 'Enter') {
                startGameSequence();
            }
            return;
        }
        if (gameState !== 'PLAYING') return;

        if (player1) {
            if (e.key === 'w' || e.key === 'W') player1.setDirection(0, -1);
            else if (e.key === 's' || e.key === 'S') player1.setDirection(0, 1);
            else if (e.key === 'a' || e.key === 'A') player1.setDirection(-1, 0);
            else if (e.key === 'd' || e.key === 'D') player1.setDirection(1, 0);
        }

        if (player2) {
            if (e.key === 'ArrowUp') player2.setDirection(0, -1);
            else if (e.key === 'ArrowDown') player2.setDirection(0, 1);
            else if (e.key === 'ArrowLeft') player2.setDirection(-1, 0);
            else if (e.key === 'ArrowRight') player2.setDirection(1, 0);
        }
    });

    initGame();
});
