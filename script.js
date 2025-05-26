document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // UI Elements (same as before)
    const player1ScoreDisplay = document.getElementById('player1Score');
    const player2ScoreDisplay = document.getElementById('player2Score');
    const player1RoleDisplay = document.getElementById('player1Role');
    const player2RoleDisplay = document.getElementById('player2Role');
    const currentRoundDisplay = document.getElementById('currentRoundDisplay');
    const maxRoundsDisplay = document.getElementById('maxRoundsDisplay');
    const gameMessageDisplay = document.getElementById('gameMessage');
    const startButton = document.getElementById('startButton');

    // Game Constants (same as before, plus new ones)
    const TILE_SIZE = 30;
    const MAZE_COLS = 21;
    const MAZE_ROWS = 15;

    canvas.width = MAZE_COLS * TILE_SIZE;
    canvas.height = MAZE_ROWS * TILE_SIZE;

    const WALL = 1;
    const PATH = 0;
    const GEM = 2;
    const POWER_GEM = 3; // New type for Power-Up Gem
    const MIN_SPAWN_DISTANCE_TILES = 7;
    const PLAYER_SPEED = TILE_SIZE / 6;
    const MAX_POINTS_TO_WIN = 5;

    const POWER_GEM_THRESHOLD = 2; // How many regular gems must be left to spawn a power gem
    const POWER_UP_DURATION_SECONDS = 5;
    const CHASER_RESPAWN_STUN_SECONDS = 1.5; // How long chaser is stunned after being tagged

    // Maze Definitions (same as before)
    const mazeLayout1 = [/*...*/]; const mazeLayout2 = [/*...*/]; const mazeLayout3 = [/*...*/];
    // (Copy the maze layouts from the previous version here to save space in this response)
    const mazeLayout1 = [
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

    const mazeLayout2 = [ // More open
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

    const mazeLayout3 = [ // Long corridors
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

    // Game State Variables
    let player1, player2;
    let currentRound = 0;
    let totalGemsInLevel = 0; // Renamed for clarity
    let gemsCollectedThisRound = 0; // Renamed
    let powerGemActiveOnMap = false; // Flag to ensure only one power gem at a time

    let gameState = 'INITIAL';
    let animationFrameId = null;

    // --- Player Class ---
    class Player {
        constructor(x, y, color, isPlayer1) {
            this.startX = x;
            this.startY = y;
            this.x = x * TILE_SIZE + TILE_SIZE / 2;
            this.y = y * TILE_SIZE + TILE_SIZE / 2;
            this.radius = TILE_SIZE / 3;
            this.baseColor = color; // Store base color
            this.color = color;
            this.dx = 0; 
            this.dy = 0; 
            this.intentDx = 0; 
            this.intentDy = 0; 
            this.role = null;
            this.isPlayer1 = isPlayer1;
            this.score = 0;

            // Power-up state
            this.isPoweredUp = false;
            this.powerUpTimer = 0; // In frames
            this.isStunned = false; // For chaser after being tagged
            this.stunTimer = 0;
        }

        draw() {
            ctx.save(); // Save context for flashing effect

            if (this.isPoweredUp && this.role === 'RUNNER') {
                // Flashing effect for powered-up runner
                const flash = Math.floor(Date.now() / 150) % 2 === 0;
                ctx.fillStyle = flash ? '#FFFFFF' : this.baseColor; // Flash white
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2); // Slightly larger aura
                ctx.fill();
                ctx.closePath();
            } else if (this.isStunned && this.role === 'CHASER') {
                ctx.globalAlpha = 0.5; // Make stunned chaser semi-transparent
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color; // Use current color (might be base or temp)
            ctx.fill();
            if (this.role === 'CHASER' && !this.isStunned) { // Don't draw chaser outline if stunned
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.closePath();
            ctx.restore(); // Restore context
        }

        update() {
            // Handle Stun Timer (for Chaser)
            if (this.isStunned) {
                this.stunTimer--;
                if (this.stunTimer <= 0) {
                    this.isStunned = false;
                    this.color = this.baseColor; // Restore color
                    // Optionally re-enable movement if it was disabled during stun
                } else {
                    return; // Skip movement updates if stunned
                }
            }

            // Handle Power-Up Timer (for Runner)
            if (this.isPoweredUp) {
                this.powerUpTimer--;
                if (this.powerUpTimer <= 0) {
                    this.isPoweredUp = false;
                    this.color = this.baseColor; // Restore color
                }
            }

            // Movement Logic (same as previous good version)
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
                    let newDx = 0; let newDy = 0; let canMakeIntentTurn = false;
                    if (this.intentDx !== 0 && !isWall(currentTileX + this.intentDx, currentTileY)) {
                        newDx = this.intentDx; newDy = 0; canMakeIntentTurn = true;
                    } else if (this.intentDy !== 0 && !isWall(currentTileX, currentTileY + this.intentDy)) {
                        newDy = this.intentDy; newDx = 0; canMakeIntentTurn = true;
                    }
                    if (canMakeIntentTurn) { this.dx = newDx; this.dy = newDy; }
                }
                if (isWall(currentTileX + this.dx, currentTileY + this.dy) && (this.dx !== 0 || this.dy !== 0)) {
                    this.dx = 0; this.dy = 0;
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
                if (wallHit) { this.dx = 0; this.dy = 0; } 
                else { this.x = nextX; this.y = nextY; }
            }
            // End Movement Logic

            // Gem Collection
            const playerAtTileX = Math.floor(this.x / TILE_SIZE);
            const playerAtTileY = Math.floor(this.y / TILE_SIZE);
            if (this.role === 'RUNNER') {
                if (maze[playerAtTileY] && maze[playerAtTileY][playerAtTileX] === GEM) {
                    maze[playerAtTileY][playerAtTileX] = PATH;
                    gemsCollectedThisRound++;
                    checkAndSpawnPowerGem(); // Check if power gem should spawn
                    if (gemsCollectedThisRound >= totalGemsInLevel) { // All original gems collected
                        endRound(this);
                    }
                } else if (maze[playerAtTileY] && maze[playerAtTileY][playerAtTileX] === POWER_GEM) {
                    maze[playerAtTileY][playerAtTileX] = PATH;
                    this.isPoweredUp = true;
                    this.powerUpTimer = POWER_UP_DURATION_SECONDS * 60; // Convert seconds to frames (assuming 60fps)
                    this.color = '#FF4081'; // Bright pink while powered up
                    powerGemActiveOnMap = false; // Power gem collected
                    gameMessageDisplay.textContent = "POWER UP!";
                    setTimeout(() => { 
                        if(gameState === 'PLAYING') gameMessageDisplay.textContent = `${player1.role === 'RUNNER' ? "P1 (Runner)" : "P2 (Runner)"} GO!`;
                    }, 1500);
                }
            }
        }

        setDirection(newDx, newDy) {
            if (this.isStunned) return; // Cannot set direction if stunned
            this.intentDx = newDx;
            this.intentDy = newDy;
        }

        resetPosition(tileX, tileY) {
            this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
            this.y = tileY * TILE_SIZE + TILE_SIZE / 2;
            this.dx = 0; this.dy = 0;
            this.intentDx = 0; this.intentDy = 0;
            this.isPoweredUp = false; this.powerUpTimer = 0;
            this.isStunned = false; this.stunTimer = 0;
            this.color = this.baseColor; // Reset to base color
        }

        stunChaser() { // Method for Chaser
            this.isStunned = true;
            this.stunTimer = CHASER_RESPAWN_STUN_SECONDS * 60; // Frames
            this.color = '#777777'; // Grey out stunned chaser
            this.dx = 0; this.dy = 0; this.intentDx = 0; this.intentDy = 0; // Stop movement
            
            // Find a new random spawn for the chaser
            let validSpawns = getValidSpawnPoints(activeMazeDefinition);
            if (validSpawns.length > 0) {
                const spawn = validSpawns[Math.floor(Math.random() * validSpawns.length)];
                this.resetPosition(spawn.c, spawn.r); // Reset to new random pos
            } else { // Fallback if no valid spawns (should not happen)
                this.resetPosition(this.startX, this.startY); 
            }
        }
    }

    // --- Game Logic Functions ---
    function getValidSpawnPoints(mazeArray) { /* Same as before */
        const points = [];
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                if (mazeArray[r][c] === PATH) {
                    points.push({ r, c });
                }
            }
        }
        return points;
    }

    function initGame() { /* Mostly same, ensure powerGemActiveOnMap is reset */
        player1 = new Player(1, 1, '#42A5F5', true); 
        player2 = new Player(MAZE_COLS - 2, MAZE_ROWS - 2, '#FFEE58', false);
        
        player1.score = 0; player2.score = 0; currentRound = 0;
        gameState = 'INITIAL';
        gameMessageDisplay.textContent = "Press Enter or Click Start";
        startButton.style.display = 'inline-block';
        startButton.onclick = () => {
            if (gameState === 'INITIAL' || gameState === 'GAME_OVER') startGameSequence();
        };
        
        activeMazeDefinition = mazes[0]; 
        originalMazeState = JSON.parse(JSON.stringify(activeMazeDefinition));
        maze = JSON.parse(JSON.stringify(originalMazeState));
        countTotalGems();
        powerGemActiveOnMap = false; // Reset this

        updateScoreboard();
        draw();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function startGameSequence() { /* Same as before */
        player1.score = 0; player2.score = 0; currentRound = 0;
        startButton.style.display = 'none';
        startNewRound();
    }
    
    function countTotalGems() { /* Counts only original GEMs */
        totalGemsInLevel = 0;
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                if (originalMazeState[r][c] === GEM) { // Count only original type 2 gems
                    totalGemsInLevel++;
                }
            }
        }
    }

    function resetMaze() { /* Same, also resets powerGemActiveOnMap */
        maze = JSON.parse(JSON.stringify(originalMazeState));
        gemsCollectedThisRound = 0;
        powerGemActiveOnMap = false;
    }

    function checkAndSpawnPowerGem() {
        if (powerGemActiveOnMap) return; // Only one power gem at a time

        const remainingGems = totalGemsInLevel - gemsCollectedThisRound;
        if (remainingGems > 0 && remainingGems <= POWER_GEM_THRESHOLD) {
            let potentialPowerGemLocations = [];
            for (let r = 0; r < MAZE_ROWS; r++) {
                for (let c = 0; c < MAZE_COLS; c++) {
                    if (maze[r][c] === GEM) { // Look for remaining regular gems
                        potentialPowerGemLocations.push({ r, c });
                    }
                }
            }

            if (potentialPowerGemLocations.length > 0) {
                const chosenLocation = potentialPowerGemLocations[Math.floor(Math.random() * potentialPowerGemLocations.length)];
                maze[chosenLocation.r][chosenLocation.c] = POWER_GEM;
                powerGemActiveOnMap = true;
                totalGemsInLevel++; // Increment because power gem replaces a regular one but is still a "collectible"
                                    // This might need adjustment if power gem doesn't count towards "all gems collected" win
                                    // For now, let's assume collecting power gem counts towards clearing the level
            }
        }
    }


    function startNewRound() { /* Mostly same, ensure powerGemActiveOnMap reset */
        currentRound++;
        if (currentRound > 1 && (player1.score >= MAX_POINTS_TO_WIN || player2.score >= MAX_POINTS_TO_WIN)) {
            endGame(); return;
        }

        const mapIndex = (currentRound - 1) % mazes.length;
        activeMazeDefinition = mazes[mapIndex];
        originalMazeState = JSON.parse(JSON.stringify(activeMazeDefinition));
        countTotalGems();
        resetMaze(); // This also resets powerGemActiveOnMap
        
        // Role assignment (same)
        if (currentRound % 2 === 1) { player1.role = 'RUNNER'; player1.baseColor = '#FFEB3B'; player2.role = 'CHASER'; player2.baseColor = '#F44336'; }
        else { player1.role = 'CHASER'; player1.baseColor = '#F44336'; player2.role = 'RUNNER'; player2.baseColor = '#FFEB3B'; }
        player1.color = player1.baseColor; player2.color = player2.baseColor; // Apply base colors

        // Randomized Spawns (same)
        let validSpawns = getValidSpawnPoints(activeMazeDefinition);
        if (validSpawns.length < 2) { player1.resetPosition(1,1); player2.resetPosition(MAZE_COLS - 2, MAZE_ROWS - 2); }
        else { /* ... (spawn logic from previous version) ... */
            let p1SpawnIndex = Math.floor(Math.random() * validSpawns.length);
            let p1Spawn = validSpawns.splice(p1SpawnIndex, 1)[0];
            let p2Spawn = null; const maxSpawnRetries = 50; let retries = 0;
            while(retries < maxSpawnRetries && validSpawns.length > 0) {
                let p2SpawnIndex = Math.floor(Math.random() * validSpawns.length);
                let potentialP2Spawn = validSpawns[p2SpawnIndex];
                const distC = p1Spawn.c - potentialP2Spawn.c; const distR = p1Spawn.r - potentialP2Spawn.r;
                const distance = Math.sqrt(distC * distC + distR * distR);
                if (distance >= MIN_SPAWN_DISTANCE_TILES) { p2Spawn = validSpawns.splice(p2SpawnIndex, 1)[0]; break; }
                retries++;
            }
            if (!p2Spawn && validSpawns.length > 0) p2Spawn = validSpawns.splice(Math.floor(Math.random() * validSpawns.length), 1)[0];
            else if (!p2Spawn) p2Spawn = (p1Spawn.c === 1 && p1Spawn.r === 1) ? {r: MAZE_ROWS - 2, c: MAZE_COLS - 2} : {r:1, c:1};
            player1.resetPosition(p1Spawn.c, p1Spawn.r);
            player2.resetPosition(p2Spawn.c, p2Spawn.r);
        }
        
        updateScoreboard();
        currentRoundDisplay.textContent = currentRound;
        maxRoundsDisplay.textContent = "First to " + MAX_POINTS_TO_WIN;

        gameState = 'READY';
        let countdown = 3;
        gameMessageDisplay.textContent = `Map ${mapIndex + 1} - Round ${currentRound}! Get Ready... ${countdown}`;
        
        const readyInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) gameMessageDisplay.textContent = `Get Ready... ${countdown}`;
            else {
                clearInterval(readyInterval);
                gameMessageDisplay.textContent = `${player1.role === 'RUNNER' ? "P1 (Runner)" : "P2 (Runner)"} GO!`;
                gameState = 'PLAYING';
            }
        }, 1000);
    }

    function endRound(winnerPlayer) { /* Same as before */
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
            if (player1.score >= MAX_POINTS_TO_WIN || player2.score >= MAX_POINTS_TO_WIN) endGame();
            else startNewRound();
        }, 3000);
    }
    
    function endGame() { /* Same as before */
        gameState = 'GAME_OVER';
        let finalMessage;
        if (player1.score > player2.score) finalMessage = `Player 1 Wins the Game! (${player1.score}-${player2.score})`;
        else if (player2.score > player1.score) finalMessage = `Player 2 Wins the Game! (${player2.score}-${player1.score})`;
        else finalMessage = `It's a Tie! (${player1.score}-${player2.score})`;
        gameMessageDisplay.textContent = finalMessage + " Press Enter or Start to Play Again.";
        startButton.style.display = 'inline-block';
        currentRoundDisplay.textContent = "-";
    }

    function updateScoreboard() { /* Same, but ensures baseColor is used for role logic if needed */
        player1ScoreDisplay.textContent = player1.score;
        player2ScoreDisplay.textContent = player2.score;
        player1RoleDisplay.textContent = `(${player1.role || ''})`;
        player2RoleDisplay.textContent = `(${player2.role || ''})`;
        player1RoleDisplay.className = player1.role === 'RUNNER' ? 'runner-role' : (player1.role === 'CHASER' ? 'chaser-role' : '');
        player2RoleDisplay.className = player2.role === 'RUNNER' ? 'runner-role' : (player2.role === 'CHASER' ? 'chaser-role' : '');
    }

    function isWall(x, y) { /* Same as before */
        if (x < 0 || x >= MAZE_COLS || y < 0 || y >= MAZE_ROWS) return true;
        return maze[y][x] === WALL;
    }

    function checkCollision() {
        let runner, chaser;
        if (player1.role === 'RUNNER') { runner = player1; chaser = player2; } 
        else { runner = player2; chaser = player1; }

        if (runner.isStunned || chaser.isStunned) return; // No collision checks if anyone is stunned

        const dxCollide = runner.x - chaser.x;
        const dyCollide = runner.y - chaser.y;
        const distance = Math.sqrt(dxCollide * dxCollide + dyCollide * dyCollide);

        if (distance < runner.radius + chaser.radius - (PLAYER_SPEED * 0.5)) {
            if (runner.isPoweredUp) {
                // Runner tags Chaser
                chaser.stunChaser(); // Stun and respawn chaser
                gameMessageDisplay.textContent = "CHASER TAGGED!";
                setTimeout(() => { 
                    if(gameState === 'PLAYING' && !runner.isPoweredUp) gameMessageDisplay.textContent = `${player1.role === 'RUNNER' ? "P1 (Runner)" : "P2 (Runner)"} GO!`;
                    else if(gameState === 'PLAYING' && runner.isPoweredUp) gameMessageDisplay.textContent = "POWER UP!";
                }, 1500);

            } else {
                // Chaser catches Runner
                endRound(chaser);
            }
        }
    }

    function drawMaze() { /* Updated to draw POWER_GEM */
        for (let r = 0; r < MAZE_ROWS; r++) {
            for (let c = 0; c < MAZE_COLS; c++) {
                ctx.fillStyle = '#000';
                if (maze[r][c] === WALL) ctx.fillStyle = '#3F51B5';
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                
                if (maze[r][c] === GEM) {
                    ctx.beginPath();
                    ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 5, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFD700'; // Gold Gem
                    ctx.fill();
                    ctx.closePath();
                } else if (maze[r][c] === POWER_GEM) {
                    ctx.beginPath();
                    // Slightly larger than regular gem, smaller than player
                    ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#FF69B4'; // Hot Pink for Power Gem
                    ctx.fill();
                    // Optional: add an outline or shimmer
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }

    function draw() { /* Same as before */
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
        if (player1) player1.draw();
        if (player2) player2.draw();
    }
    
    function gameLoop() { /* Same as before */
        if (gameState === 'PLAYING') {
            if (player1) player1.update();
            if (player2) player2.update();
            checkCollision();
        }
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => { /* Same as before */
        if (gameState === 'INITIAL' || gameState === 'GAME_OVER') {
            if (e.key === 'Enter') startGameSequence();
            return;
        }
        // Allow input during READY for pre-emptive moves, but actual movement starts in PLAYING
        // if (gameState !== 'PLAYING' && gameState !== 'READY') return; // Allow input during ready

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
