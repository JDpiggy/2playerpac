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
    const MIN_SPAWN_DISTANCE_TILES = 7; // Minimum distance between player spawns

    // --- MAZE DEFINITIONS --- (Same as before)
    const mazeLayout1 = [
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
    const mazeLayout2 = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,2,0,2,0,2,0,1,0,2,0,2,0,2,0,2,0,1],
        [1,2,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,2,1],
        [1,0,2,0,2,0,2,0,0,0,0,0,0,0,2,0,2,0,2,0,1],
        [1,2,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,2,1],
        [1,0,2,0,0,0,1,2,0,2,0,2,0,2,1,0,0,0,2,0,1],
        [1,2,1,0,1,2,1,1,1,0,1,0,1,1,1,2,1,0,1,2,1],
        [1,0,0,0,2,0,0,0,2,0,2,0,2,0,0,0,2,0,0,0,1],
        [1,2,1,0,1,2,1,1,1,0,1,0,1,1,1,2,1,0,1,2,1],
        [1,0,2,0,0,0,1,2,0,2,0,2,0,2,1,0,0,0,2,0,1],
        [1,2,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,2,1],
        [1,0,2,0,2,0,2,0,0,0,0,0,0,0,2,0,2,0,2,0,1],
        [1,2,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,2,1],
        [1,0,2,0,2,0,2,0,2,0,1,0,2,0,2,0,2,0,2,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];
    const mazeLayout3 = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,1],
        [1,2,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,2,1],
        [1,0,0,0,0,0,0,0,1,2,0,2,1,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
        [1,2,0,0,0,0,1,2,0,0,0,0,0,2,1,0,0,0,0,2,1],
        [1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1],
        [1,0,0,0,0,2,0,0,1,2,0,2,1,0,0,2,0,0,0,0,1],
        [1,1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1],
        [1,2,0,0,0,0,1,2,0,0,0,0,0,2,1,0,0,0,0,2,1],
        [1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,1,2,0,2,1,0,0,0,0,0,0,0,1],
        [1,2,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,2,1],
        [1,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    const mazes = [mazeLayout1, mazeLayout2, mazeLayout3];
    let activeMazeDefinition;
    let maze;
    let originalMazeState;

    const PLAYER_SPEED = TILE_SIZE / 6;

    let player1, player2;
    let currentRound = 0;
    const MAX_POINTS_TO_WIN = 5;
    let totalGems = 0;
    let gemsCollected = 0;

    let gameState = 'INITIAL';
    let animationFrameId = null;

    // --- Player Class (Movement logic from previous good version) ---
    class Player { // Player class is the same as the previous version with forgiving turns
        constructor(x, y, color, isPlayer1) {
            this.startX = x;
            this.startY = y;
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.radius = TILE_SIZE / 3;
            this.color = color;
            this.dx = 0; 
            this.dy = 0; 
            this.intentDx = 0; 
            this.intentDy = 0; 
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
            const tileCenterX = currentTileX * TILE_SIZE + TILE_SIZE / 2;
            const tileCenterY = currentTileY * TILE_SIZE + TILE_SIZE / 2;

            const decisionThreshold = PLAYER_SPEED; 
            const atDecisionPointX = Math.abs(this.x - tileCenterX) < decisionThreshold;
            const atDecisionPointY = Math.abs(this.y - tileCenterY) < decisionThreshold;

            if (atDecisionPointX && atDecisionPointY) {
                this.x = tileCenterX;
                this.y = tileCenterY;

                if (this.intentDx !== 0 || this.intentDy !== 0) {
                    let newDx = 0;
                    let newDy = 0;
                    let canMakeIntentTurn = false;

                    if (this.intentDx !== 0) { 
                        if (!isWall(currentTileX + this.intentDx, currentTileY)) {
                            newDx = this.intentDx;
                            newDy = 0;
                            canMakeIntentTurn = true;
                        }
                    } else if (this.intentDy !== 0) { 
                        if (!isWall(currentTileX, currentTileY + this.intentDy)) {
                            newDy = this.intentDy;
                            newDx = 0;
                            canMakeIntentTurn = true;
                        }
                    }

                    if (canMakeIntentTurn) {
                        this.dx = newDx;
                        this.dy = newDy;
                    }
                }

                if (isWall(currentTileX + this.dx, currentTileY + this.dy) && (this.dx !== 0 || this.dy !== 0)) {
                    this.dx = 0; 
                    this.dy = 0;
                }
            }

            const nextX = this.x + this.dx * PLAYER_SPEED;
            const nextY = this.y + this.dy * PLAYER_SPEED;

            if (this.dx !== 0 || this.dy !== 0) {
                let wallHit = false;
                if (this.dx > 0 && isWall(Math.floor((this.x + this.radius + PLAYER_SPEED) / TILE_SIZE), currentTileY)) {
                    wallHit = true; this.x = tileCenterX; 
                } else if (this.dx < 0 && isWall(Math.floor((this.x - this.radius - PLAYER_SPEED) / TILE_SIZE), currentTileY)) {
                    wallHit = true; this.x = tileCenterX;
                } else if (this.dy > 0 && isWall(currentTileX, Math.floor((this.y + this.radius + PLAYER_SPEED) / TILE_SIZE))) {
                    wallHit = true; this.y = tileCenterY;
                } else if (this.dy < 0 && isWall(currentTileX, Math.floor((this.y - this.radius - PLAYER_SPEED) / TILE_SIZE))) {
                    wallHit = true; this.y = tileCenterY;
                }

                if (wallHit) {
                    this.dx = 0;
                    this.dy = 0;
                } else {
                    this.x = nextX;
                    this.y = nextY;
                }
            }

            const playerAtTileX = Math.floor(this.x / TILE_SIZE);
            const playerAtTileY = Math.floor(this.y / TILE_SIZE);
            if (this.role === 'RUNNER') {
                if (maze[playerAtTileY] && maze[playerAtTileY][playerAtTileX] === GEM) {
                    maze[playerAtTileY][playerAtTileX] = PATH;
                    gemsCollected++;
                    if (gemsCollected >= totalGems) {
                        endRound(this);
                    }
                }
            }
        }

        setDirection(newDx, newDy) {
            this.intentDx = newDx;
            this.intentDy = newDy;
        }

        resetPosition(tileX, tileY) { // tileX, tileY are COL, ROW
            this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
            this.y = tileY * TILE_SIZE + TILE_SIZE / 2;
            this.dx = 0;
            this.dy = 0;
            this.intentDx = 0;
            this.intentDy = 0;
        }
    }

    function getValidSpawnPoints(mazeArray) {
        const points = [];
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                // Ensure it's a path and not too close to the very edge if desired
                // For now, any path tile is fine.
                if (mazeArray[r][c] === PATH) {
                    // Could add more conditions, e.g. !isWall(c-1,r) && !isWall(c+1,r) etc. for more open spawns
                    points.push({ r, c });
                }
            }
        }
        return points;
    }


    function initGame() {
        player1 = new Player(1, 1, '#42A5F5', true); // Initial dummy positions
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
        
        activeMazeDefinition = mazes[0]; // Default to first map for initial UI draw
        originalMazeState = JSON.parse(JSON.stringify(activeMazeDefinition));
        maze = JSON.parse(JSON.stringify(originalMazeState));
        countTotalGems();

        updateScoreboard();
        draw();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
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

        const mapIndex = (currentRound - 1) % mazes.length;
        activeMazeDefinition = mazes[mapIndex];
        originalMazeState = JSON.parse(JSON.stringify(activeMazeDefinition));
        countTotalGems();
        resetMaze();
        
        if (currentRound % 2 === 1) {
            player1.role = 'RUNNER'; player1.color = '#FFEB3B';
            player2.role = 'CHASER'; player2.color = '#F44336';
        } else {
            player1.role = 'CHASER'; player1.color = '#F44336';
            player2.role = 'RUNNER'; player2.color = '#FFEB3B';
        }

        // --- Randomized Spawn Logic ---
        let validSpawns = getValidSpawnPoints(activeMazeDefinition);
        if (validSpawns.length < 2) {
            console.error("Not enough valid spawn points on the map!");
            // Fallback to fixed spawns if not enough points
            player1.resetPosition(1,1);
            player2.resetPosition(MAZE_COLS - 2, MAZE_ROWS - 2);
        } else {
            let p1SpawnIndex = Math.floor(Math.random() * validSpawns.length);
            let p1Spawn = validSpawns.splice(p1SpawnIndex, 1)[0]; // Get and remove P1's spawn

            let p2Spawn = null;
            const maxSpawnRetries = 50;
            let retries = 0;

            while(retries < maxSpawnRetries && validSpawns.length > 0) {
                let p2SpawnIndex = Math.floor(Math.random() * validSpawns.length);
                let potentialP2Spawn = validSpawns[p2SpawnIndex];
                
                const distC = p1Spawn.c - potentialP2Spawn.c;
                const distR = p1Spawn.r - potentialP2Spawn.r;
                const distance = Math.sqrt(distC * distC + distR * distR);

                if (distance >= MIN_SPAWN_DISTANCE_TILES) {
                    p2Spawn = validSpawns.splice(p2SpawnIndex, 1)[0]; // Get and remove P2's spawn
                    break; 
                }
                retries++;
            }

            if (!p2Spawn && validSpawns.length > 0) { // If couldn't find distant, just pick any remaining
                p2Spawn = validSpawns.splice(Math.floor(Math.random() * validSpawns.length), 1)[0];
                console.warn("Could not find a spawn for P2 far enough, placing randomly.");
            } else if (!p2Spawn) { // Should be very rare if P1 spawn was found
                 console.error("Could not find any spawn for P2!");
                 // Fallback for P2 if all else fails (e.g. P1 took the only other spot)
                 p2Spawn = (p1Spawn.c === 1 && p1Spawn.r === 1) ? {r: MAZE_ROWS - 2, c: MAZE_COLS - 2} : {r:1, c:1};
            }

            player1.resetPosition(p1Spawn.c, p1Spawn.r);
            player2.resetPosition(p2Spawn.c, p2Spawn.r);
        }
        // --- End Randomized Spawn Logic ---
        
        updateScoreboard();
        currentRoundDisplay.textContent = currentRound;
        maxRoundsDisplay.textContent = "First to " + MAX_POINTS_TO_WIN;

        gameState = 'READY';
        let countdown = 3;
        gameMessageDisplay.textContent = `Map ${mapIndex + 1} - Round ${currentRound}! Get Ready... ${countdown}`;
        
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

    function endRound(winnerPlayer) { // Same as before
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
    
    function endGame() { // Same as before
        gameState = 'GAME_OVER';
        let finalMessage;
        if (player1.score > player2.score) {
            finalMessage = `Player 1 Wins the Game! (${player1.score}-${player2.score})`;
        } else if (player2.score > player1.score) {
            finalMessage = `Player 2 Wins the Game! (${player2.score}-${player1.score})`;
        } else {
            finalMessage = `It's a Tie! (${player1.score}-${player2.score})`;
        }
        gameMessageDisplay.textContent = finalMessage + " Press Enter or Start to Play Again.";
        startButton.style.display = 'inline-block';
        currentRoundDisplay.textContent = "-";
    }

    function updateScoreboard() { // Same as before
        player1ScoreDisplay.textContent = player1.score;
        player2ScoreDisplay.textContent = player2.score;
        player1RoleDisplay.textContent = `(${player1.role || ''})`;
        player2RoleDisplay.textContent = `(${player2.role || ''})`;
        player1RoleDisplay.className = player1.role === 'RUNNER' ? 'runner-role' : (player1.role === 'CHASER' ? 'chaser-role' : '');
        player2RoleDisplay.className = player2.role === 'RUNNER' ? 'runner-role' : (player2.role === 'CHASER' ? 'chaser-role' : '');
    }

    function isWall(x, y) { // Same as before
        if (x < 0 || x >= MAZE_COLS || y < 0 || y >= MAZE_ROWS) return true;
        // Check against the current working 'maze'
        return maze[y][x] === WALL;
    }

    function checkCollision() { // Same as before
        let runner, chaser;
        if (player1.role === 'RUNNER') { runner = player1; chaser = player2; } 
        else { runner = player2; chaser = player1; }

        const dxCollide = runner.x - chaser.x;
        const dyCollide = runner.y - chaser.y;
        const distance = Math.sqrt(dxCollide * dxCollide + dyCollide * dyCollide);

        if (distance < runner.radius + chaser.radius - (PLAYER_SPEED * 0.5)) {
            endRound(chaser);
        }
    }

    function drawMaze() { // Same as before
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                ctx.fillStyle = '#000';
                if (maze[r][c] === WALL) ctx.fillStyle = '#3F51B5';
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

    function draw() { // Same as before
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        if (player1) player1.draw();
        if (player2) player2.draw();
    }
    
    function gameLoop() { // Same as before
        if (gameState === 'PLAYING') {
            if (player1) player1.update();
            if (player2) player2.update();
            checkCollision();
        }
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => { // Same as before
        if (gameState === 'INITIAL' || gameState === 'GAME_OVER') {
            if (e.key === 'Enter') startGameSequence();
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
