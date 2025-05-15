document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const collisionCanvas = document.getElementById('collisionCanvas');
    const collisionCtx = collisionCanvas.getContext('2d');
    const maskCanvas = document.getElementById('maskCanvas'); // For texture masking
    const maskCtx = maskCanvas.getContext('2d');

    // UI Elements
    const scoreDisplay = document.getElementById('score');
    const currentLevelText = document.getElementById('current-level-text');
    const timeLeftDisplay = document.getElementById('time-left');
    const comfortBar = document.getElementById('comfort-bar');
    const comfortFaceImg = document.getElementById('comfort-face'); // Changed variable name
    const currentToolText = document.getElementById('current-tool-text');
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const actionButton = document.getElementById('action-button');

    // Canvas Setup
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 450;
    canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT;
    collisionCanvas.width = CANVAS_WIDTH; collisionCanvas.height = CANVAS_HEIGHT;
    maskCanvas.width = CANVAS_WIDTH; maskCanvas.height = CANVAS_HEIGHT;

    // Game Constants
    const MAX_COMFORT = 100;
    const COMFORT_DAMAGE_WALL_SMALL = 0.5; // Reduced damage for finer control
    const COMFORT_DAMAGE_WALL_LARGE = 1.5;
    const COMFORT_DECREASE_RATE_PASSIVE = 0.03; // Passive comfort decrease

    const BACTERIA_SIZE = 18;
    const ZAP_BASE_RADIUS = 25;
    const CANAL_WIDTH = 25; // Width for drawing procedural canals

    const TOOLS = {
        FINDER: { name: "Finder", speed: 3.5, zapRadiusBonus: 0, wallDamage: COMFORT_DAMAGE_WALL_SMALL, imageKey: 'endo_file_finder', width: 15, height: 30 },
        SHAPER: { name: "Shaper", speed: 2.2, zapRadiusBonus: 10, wallDamage: COMFORT_DAMAGE_WALL_LARGE, imageKey: 'endo_file_shaper', width: 17, height: 34 }
    };
    let currentTool = TOOLS.FINDER;

    // Game State Variables
    let score = 0;
    let currentComfort = MAX_COMFORT;
    let player = { x: CANVAS_WIDTH / 2, y: 50, width: currentTool.width, height: currentTool.height };
    let bacteria = [];
    let accessTargets = [];
    let keysPressed = {};
    let gameState = 'LOADING';
    let currentLevelIndex = 0;
    let levelTimer = 0;
    let gameLoopIntervalId; // Renamed for clarity
    let lastTimestamp = 0; // Renamed for clarity
    let currentProceduralLevelData = {}; // To store generated paths, etc.

    // --- Asset Paths (IMPORTANT: Update if your folder structure is different) ---
    const ASSET_PATH = 'assets/tiles/';

    // Level Configuration for Procedural Generation
    const gameLevels = [ // Renamed to avoid conflict
        { name: "Molar Initiation", toothImageKey: 'tooth_outline_molar', numCanals: 2, bacteriaCount: 6, timeLimit: 120, accessPointsCount: 2, canalStartPoints: [{x: 280, y: 150}, {x: 320, y: 150}]},
        { name: "Molar Challenge", toothImageKey: 'tooth_outline_molar', numCanals: 3, bacteriaCount: 10, timeLimit: 100, accessPointsCount: 3, canalStartPoints: [{x: 270, y: 150}, {x: 300, y: 140}, {x: 330, y: 150}]},
        // Add more level configurations here
    ];

    // --- Asset Loading ---
    const images = {
        // Using your filenames
        access_target: new Image(),
        bacteria_1: new Image(),
        bacteria_2: new Image(),
        endo_file_finder: new Image(),
        endo_file_shaper: new Image(),
        happy_tooth_face: new Image(),
        inflammation_texture_generic: new Image(),
        sad_tooth_face: new Image(),
        tooth_outline_molar: new Image(),
        // Add tooth_outline_incisor etc. if you make them
    };
    const sounds = { // Placeholder for sound effects
        drill: null, zap: null, ouch: null, success_level: null,
        success_game: null, game_over: null, wall_hit: null, tool_switch: null,
        timer_tick: null, background_music: null
    };
    let assetsToLoadCount = 0;
    let assetsLoadedCount = 0;

    function countAssets() {
        assetsToLoadCount = Object.keys(images).length + Object.keys(sounds).filter(key => sounds[key] !== null).length; // Only count actual sound objects if you implement them
    }

    function assetLoadedCallback(type, name) {
        assetsLoadedCount++;
        console.log(`${type} loaded: ${name} (${assetsLoadedCount}/${assetsToLoadCount})`);
        if (assetsLoadedCount === assetsToLoadCount) {
            console.log("All assets loaded.");
            comfortFaceImg.src = images.happy_tooth_face.src; // Set initial comfort face
            changeGameState('MAIN_MENU');
        }
        updateLoadingProgress();
    }

    function updateLoadingProgress() {
        if (gameState === 'LOADING') {
            messageTitle.textContent = "Loading Assets...";
            messageText.textContent = `Loaded ${assetsLoadedCount} of ${assetsToLoadCount}`;
            actionButton.style.display = 'none';
        }
    }

    function loadGameAssets() {
        changeGameState('LOADING');
        countAssets(); // Count first
        updateLoadingProgress(); // Show initial loading message

        // Load images with new paths and filenames
        images.access_target.src = `${ASSET_PATH}access_target-removebg-preview.png`; images.access_target.onload = () => assetLoadedCallback('Image', 'access_target');
        images.bacteria_1.src = `${ASSET_PATH}bacteria_1-removebg-preview.png`; images.bacteria_1.onload = () => assetLoadedCallback('Image', 'bacteria_1');
        images.bacteria_2.src = `${ASSET_PATH}bacteria_2-removebg-preview.png`; images.bacteria_2.onload = () => assetLoadedCallback('Image', 'bacteria_2');
        images.endo_file_finder.src = `${ASSET_PATH}endo_file_finder-removebg-preview.png`; images.endo_file_finder.onload = () => assetLoadedCallback('Image', 'endo_file_finder');
        images.endo_file_shaper.src = `${ASSET_PATH}endo_file_shaper-removebg-preview.png`; images.endo_file_shaper.onload = () => assetLoadedCallback('Image', 'endo_file_shaper');
        images.happy_tooth_face.src = `${ASSET_PATH}happy_tooth_face-removebg-preview.png`; images.happy_tooth_face.onload = () => assetLoadedCallback('Image', 'happy_tooth_face');
        images.inflammation_texture_generic.src = `${ASSET_PATH}inflammation_texture_generic.png`; images.inflammation_texture_generic.onload = () => assetLoadedCallback('Image', 'inflammation_texture_generic');
        images.sad_tooth_face.src = `${ASSET_PATH}sad_tooth_face-removebg-preview.png`; images.sad_tooth_face.onload = () => assetLoadedCallback('Image', 'sad_tooth_face');
        images.tooth_outline_molar.src = `${ASSET_PATH}tooth_outline_molar.png`; images.tooth_outline_molar.onload = () => assetLoadedCallback('Image', 'tooth_outline_molar');

        // Placeholder for sound loading - implement if you have sounds
        // for (const key in sounds) { if (sounds[key] !== null) { sounds[key] = new Audio(`sounds/${key}.mp3`); sounds[key].oncanplaythrough = () => assetLoadedCallback('Sound', key); }}
    }

    function playSound(soundKey, volume = 0.7) {
        if (sounds[soundKey] && sounds[soundKey].play) {
            sounds[soundKey].currentTime = 0;
            sounds[soundKey].volume = volume;
            sounds[soundKey].play().catch(e => console.warn("Sound play interrupted or failed:", e));
        }
    }

    // --- Procedural Generation ---
    function generateProceduralLevel(levelConfig) {
        currentProceduralLevelData = {
            config: levelConfig,
            canalPaths: [],
            accessPoints: [],
            bacteriaSpawns: []
        };

        // 1. Generate Canal Paths (Simple Random Walk Example)
        for (let i = 0; i < levelConfig.numCanals; i++) {
            const startPoint = levelConfig.canalStartPoints[i] || { x: CANVAS_WIDTH / 2 + (i - levelConfig.numCanals/2)*40, y: 150 };
            const path = generateSingleCanalPath(startPoint.x, startPoint.y, 15 + Math.random() * 10, CANAL_WIDTH); // Length 15-25 steps
            currentProceduralLevelData.canalPaths.push(path);
        }

        // 2. Generate Access Points (around pulp chamber area - needs refinement based on actual tooth outline)
        const pulpChamberCenter = { x: CANVAS_WIDTH / 2, y: 120 }; // Approximate
        for (let i = 0; i < levelConfig.accessPointsCount; i++) {
            currentProceduralLevelData.accessPoints.push({
                x: pulpChamberCenter.x + (Math.random() - 0.5) * 60,
                y: pulpChamberCenter.y + (Math.random() - 0.5) * 30,
                radius: 15,
                hit: false
            });
        }
        accessTargets = currentProceduralLevelData.accessPoints; // For existing minigame logic

        // 3. Generate Collision Map from Paths
        generateCollisionMapFromPaths(currentProceduralLevelData.canalPaths);

        // 4. Spawn Bacteria along paths (after collision map is ready)
        spawnBacteriaProcedural(levelConfig.bacteriaCount, currentProceduralLevelData.canalPaths);
    }

    function generateSingleCanalPath(startX, startY, numSteps, stepSize) {
        let path = [{ x: startX, y: startY }];
        let currentX = startX;
        let currentY = startY;

        for (let i = 0; i < numSteps; i++) {
            let angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8; // Bias downwards
            if (i < numSteps / 3 && Math.random() < 0.3) { // Initial outward spread
                 angle += (Math.random() < 0.5 ? -1 : 1) * Math.PI / 3;
            }

            let nextX = currentX + Math.cos(angle) * stepSize * (0.7 + Math.random() * 0.6); // Vary step length
            let nextY = currentY + Math.sin(angle) * stepSize * (0.7 + Math.random() * 0.6);

            // Simple boundary to keep canals somewhat contained (improve with actual tooth shape)
            nextX = Math.max(50, Math.min(CANVAS_WIDTH - 50, nextX));
            nextY = Math.max(startY - 20, Math.min(CANVAS_HEIGHT - 50, nextY));

            currentX = nextX;
            currentY = nextY;
            path.push({ x: currentX, y: currentY });
        }
        return path;
    }

    function generateCollisionMapFromPaths(paths) {
        collisionCtx.fillStyle = 'black'; // Walls
        collisionCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        collisionCtx.strokeStyle = 'white'; // Passable paths
        collisionCtx.lineWidth = CANAL_WIDTH + 4; // +4 for a little buffer for player collision
        collisionCtx.lineCap = 'round';
        collisionCtx.lineJoin = 'round';

        paths.forEach(path => {
            if (path.length < 2) return;
            collisionCtx.beginPath();
            collisionCtx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                collisionCtx.lineTo(path[i].x, path[i].y);
            }
            collisionCtx.stroke();
        });
    }

    function spawnBacteriaProcedural(count, paths) {
        bacteria = [];
        let attempts = 0;
        while (bacteria.length < count && attempts < 500) {
            attempts++;
            if (paths.length === 0 || paths[0].length === 0) break; // No paths to spawn on

            const randomPath = paths[Math.floor(Math.random() * paths.length)];
            if (randomPath.length < 2) continue;
            const randomSegmentIndex = Math.floor(Math.random() * (randomPath.length -1));
            const p1 = randomPath[randomSegmentIndex];
            const p2 = randomPath[randomSegmentIndex+1];
            
            // Interpolate a point on the segment
            const t = Math.random();
            const potentialX = p1.x + (p2.x - p1.x) * t - BACTERIA_SIZE / 2;
            const potentialY = p1.y + (p2.y - p1.y) * t - BACTERIA_SIZE / 2;


            // Check against collision map to ensure it's in a passable area
            if (!isWall(potentialX + BACTERIA_SIZE / 2, potentialY + BACTERIA_SIZE / 2)) {
                bacteria.push({
                    x: potentialX, y: potentialY,
                    width: BACTERIA_SIZE, height: BACTERIA_SIZE,
                    type: Math.random() > 0.5 ? 'bacteria_1' : 'bacteria_2',
                    vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, // Slower movement
                    moveCooldown: Math.random() * 2 + 1
                });
            }
        }
         if (attempts >= 500 && bacteria.length < count) {
            console.warn("Could not spawn all bacteria procedurally.");
        }
    }


    // --- Game State Management ---
    function changeGameState(newState) {
        gameState = newState;
        console.log("Game state changed to: " + gameState);
        messageOverlay.classList.add('hidden');
        if (gameLoopIntervalId) clearInterval(gameLoopIntervalId);

        switch (gameState) {
            case 'LOADING':
                showMessage("Loading...", "Please wait for assets to load.", "", null, false);
                actionButton.style.display = 'none';
                break;
            case 'MAIN_MENU':
                if (sounds.background_music && sounds.background_music.paused) playSound('background_music', 0.3);
                showMessage("Canal Cleaners Deluxe", "Ready to save some structures?", "Start Game", () => {
                    currentLevelIndex = 0; score = 0;
                    changeGameState('LEVEL_INTRO');
                });
                break;
            case 'LEVEL_INTRO':
                const levelConfig = gameLevels[currentLevelIndex];
                showMessage(`Level ${currentLevelIndex + 1}: ${levelConfig.name}`, `Bacteria: ${levelConfig.bacteriaCount}, Time: ${levelConfig.timeLimit}s. Get ready!`, "Begin Access", () => {
                    setupProceduralLevel();
                    changeGameState('ACCESS_MINIGAME');
                });
                break;
            case 'ACCESS_MINIGAME':
                // Access targets already set up in setupProceduralLevel
                hideMessage();
                gameLoopIntervalId = setInterval(mainGameLoop, 1000 / 60); // 60 FPS
                break;
            case 'PLAYING':
                hideMessage();
                if (!gameLoopIntervalId) gameLoopIntervalId = setInterval(mainGameLoop, 1000 / 60);
                lastTimestamp = performance.now();
                break;
            case 'FILLING_PHASE':
                showMessage("Structure Cleaned!", "Excellent work. Click to fill.", "Fill Structure", () => {
                    playSound('success_level');
                    changeGameState('LEVEL_COMPLETE');
                });
                break;
            case 'LEVEL_COMPLETE':
                score += Math.max(0, Math.floor(levelTimer * 2)) + Math.max(0, Math.floor(currentComfort));
                updateUIDisplay();
                if (currentLevelIndex < gameLevels.length - 1) {
                    showMessage("Level Complete!", `Great job! Score: ${score}.`, "Next Structure", () => {
                        currentLevelIndex++;
                        changeGameState('LEVEL_INTRO');
                    });
                } else {
                    changeGameState('GAME_WON');
                }
                break;
            case 'GAME_WON':
                playSound('success_game');
                showMessage("Congratulations!", `You've restored all structures! Final Score: ${score}`, "Play Again?", () => {
                    changeGameState('MAIN_MENU');
                });
                break;
            case 'GAMEOVER':
                playSound('game_over');
                let reason = currentComfort <= 0 ? "Comfort proxy reached zero!" : "Time ran out!";
                showMessage("Session Over!", `${reason} Final Score: ${score}`, "Try Again", () => {
                    currentLevelIndex = 0; score = 0;
                    changeGameState('MAIN_MENU');
                });
                break;
        }
        updateUIDisplay();
    }

    function setupProceduralLevel() {
        const levelConfig = gameLevels[currentLevelIndex];
        currentComfort = MAX_COMFORT;
        levelTimer = levelConfig.timeLimit;
        player.x = CANVAS_WIDTH / 2 - player.width / 2;
        player.y = 80; // Initial player Y
        keysPressed = {};

        generateProceduralLevel(levelConfig); // This now sets up paths, access points, collision, bacteria
        updateUIDisplay();
    }

    // --- Collision Detection (using the dynamically generated collisionCanvas) ---
    function isWall(x, y) {
        if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return true;
        const pixelData = collisionCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        // Assuming black (0,0,0) is wall, anything else (white path) is not.
        return pixelData[0] < 128 && pixelData[1] < 128 && pixelData[2] < 128;
    }

    // --- Game Loop ---
    function updateGameLogic(deltaTime) {
        if (gameState === 'PLAYING') {
            levelTimer -= deltaTime;
            if (levelTimer <= 0) { levelTimer = 0; changeGameState('GAMEOVER'); return; }
            if (levelTimer < 10 && Math.floor(levelTimer) !== Math.floor(levelTimer + deltaTime)) playSound('timer_tick', 0.5);

            currentComfort -= COMFORT_DECREASE_RATE_PASSIVE * deltaTime;

            // Player movement
            let dx = 0, dy = 0;
            if (keysPressed['ArrowUp'] || keysPressed['w']) dy -= currentTool.speed;
            if (keysPressed['ArrowDown'] || keysPressed['s']) dy += currentTool.speed;
            if (keysPressed['ArrowLeft'] || keysPressed['a']) dx -= currentTool.speed;
            if (keysPressed['ArrowRight'] || keysPressed['d']) dx += currentTool.speed;

            const targetX = player.x + dx;
            const targetY = player.y + dy;

            // Check multiple points around player for collision
            const checkPoints = [
                { x: targetX + player.width / 2, y: targetY + player.height / 2 }, // Center
                { x: targetX, y: targetY }, // Top-left
                { x: targetX + player.width, y: targetY }, // Top-right
                { x: targetX, y: targetY + player.height }, // Bottom-left
                { x: targetX + player.width, y: targetY + player.height }  // Bottom-right
            ];
            
            let wallHitX = false;
            let wallHitY = false;

            // Check X movement
            let canMoveX = true;
            for(const p of checkPoints) {
                if(isWall(targetX + (p.x - player.x - dx), player.y + (p.y - player.y))) { // Check X with current Y
                    canMoveX = false;
                    wallHitX = true;
                    break;
                }
            }
            if(canMoveX) player.x = targetX;
            else if (dx !== 0) { currentComfort -= currentTool.wallDamage; playSound('wall_hit', 0.4); }
            
            // Check Y movement
            let canMoveY = true;
             for(const p of checkPoints) {
                if(isWall(player.x + (p.x - player.x), targetY + (p.y - player.y - dy))) { // Check Y with current X (or new X if moved)
                    canMoveY = false;
                    wallHitY = true;
                    break;
                }
            }
            if(canMoveY) player.y = targetY;
            else if (dy !== 0) { currentComfort -= currentTool.wallDamage; playSound('wall_hit', 0.4); }


            player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
            player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

            // Bacteria movement
            bacteria.forEach(b => {
                b.moveCooldown -= deltaTime;
                if (b.moveCooldown <= 0) {
                    b.vx = (Math.random() - 0.5) * 0.5; b.vy = (Math.random() - 0.5) * 0.5;
                    b.moveCooldown = Math.random() * 2 + 1;
                }
                const nextBacteriaX = b.x + b.vx;
                const nextBacteriaY = b.y + b.vy;
                if (!isWall(nextBacteriaX + b.width / 2, nextBacteriaY + b.height / 2)) {
                    b.x = nextBacteriaX; b.y = nextBacteriaY;
                } else { b.vx *= -1; b.vy *= -1; }
                b.x = Math.max(0, Math.min(CANVAS_WIDTH - b.width, b.x));
                b.y = Math.max(0, Math.min(CANVAS_HEIGHT - b.height, b.y));
            });

            // Zapping
            if (keysPressed[' '] || keysPressed['Spacebar']) {
                let zapped = false;
                const zapRadius = ZAP_BASE_RADIUS + currentTool.zapRadiusBonus;
                bacteria = bacteria.filter(b => {
                    const dist = Math.hypot((player.x + player.width / 2) - (b.x + b.width / 2), (player.y + player.height / 2) - (b.y + b.height / 2));
                    if (dist < zapRadius + b.width / 2) { score += 10; zapped = true; return false; }
                    return true;
                });
                if (zapped) playSound('zap');
                keysPressed[' '] = keysPressed['Spacebar'] = false;
            }

            if (currentComfort <= 0) { currentComfort = 0; playSound('ouch', 1.0); changeGameState('GAMEOVER'); return; }
            if (bacteria.length === 0) { changeGameState('FILLING_PHASE'); return; }
        }
        updateUIDisplay();
    }

    function drawGame() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const levelConf = currentProceduralLevelData.config;

        // 1. Draw Tooth Outline
        if (levelConf && images[levelConf.toothImageKey] && images[levelConf.toothImageKey].complete) {
            // Center the tooth outline image (assuming it's smaller than canvas)
            const img = images[levelConf.toothImageKey];
            const imgX = (CANVAS_WIDTH - img.width) / 2;
            const imgY = (CANVAS_HEIGHT - img.height) / 2;
            ctx.drawImage(img, imgX, imgY);
        } else { // Fallback if image not loaded or not specified
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100); // Generic box
        }

        // 2. Draw Procedural Canals
        const paths = currentProceduralLevelData.canalPaths || [];

        // Create Mask for textured fill (Inflammation / Gutta Percha)
        maskCtx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
        maskCtx.fillStyle = 'black'; // Mask is black by default
        maskCtx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
        if (paths.length > 0) {
            maskCtx.strokeStyle = 'white'; // Draw paths in white on mask
            maskCtx.fillStyle = 'white';   // Fill paths in white on mask
            maskCtx.lineWidth = CANAL_WIDTH;
            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';
            paths.forEach(path => {
                if (path.length < 2) return;
                maskCtx.beginPath();
                maskCtx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) maskCtx.lineTo(path[i].x, path[i].y);
                maskCtx.stroke(); // Stroke to get the width
                // For filling gaps in strokes if any (optional, stroke usually suffices)
                // path.forEach(p => { maskCtx.beginPath(); maskCtx.arc(p.x, p.y, CANAL_WIDTH/2, 0, Math.PI*2); maskCtx.fill(); });
            });
        }


        if (gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME' || gameState === 'GAMEOVER') {
            // Draw healthy canal base color first (light pink)
            ctx.strokeStyle = '#FFC0CB'; // Light Pink
            ctx.lineWidth = CANAL_WIDTH;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            paths.forEach(path => {
                if (path.length < 2) return;
                ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
            });

            // Draw Inflammation using generic texture and mask
            if (images.inflammation_texture_generic && images.inflammation_texture_generic.complete) {
                const inflammationAlpha = Math.min(0.7, Math.max(0.1, 1 - (currentComfort / MAX_COMFORT)));
                ctx.globalAlpha = inflammationAlpha;
                // Tile the texture over the whole canvas temporarily
                const pattern = ctx.createPattern(images.inflammation_texture_generic, 'repeat');
                ctx.fillStyle = pattern;
                ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
                
                ctx.globalCompositeOperation = 'destination-in'; // Apply mask
                ctx.drawImage(maskCanvas, 0, 0);
                ctx.globalCompositeOperation = 'source-over'; // Reset
                ctx.globalAlpha = 1;
            }
        } else if (gameState === 'LEVEL_COMPLETE' || gameState === 'GAME_WON' || gameState === 'FILLING_PHASE') {
             // Draw "Gutta Percha" fill (stylized pink/orange)
            ctx.strokeStyle = '#FF8C69'; // Orangey-Pink
            ctx.lineWidth = CANAL_WIDTH;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            paths.forEach(path => {
                if (path.length < 2) return;
                ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
            });
        }


        // 3. Draw Access Targets / Player / Bacteria
        if (gameState === 'ACCESS_MINIGAME') {
            accessTargets.forEach(target => {
                if (!target.hit && images.access_target && images.access_target.complete) {
                    ctx.drawImage(images.access_target, target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2);
                }
            });
            if (images[currentTool.imageKey] && images[currentTool.imageKey].complete) { // Show player tool
                 ctx.drawImage(images[currentTool.imageKey], player.x, player.y, player.width, player.height);
            }
        } else if (gameState === 'PLAYING') {
            bacteria.forEach(b => {
                if (images[b.type] && images[b.type].complete) ctx.drawImage(images[b.type], b.x, b.y, b.width, b.height);
            });
            if (images[currentTool.imageKey] && images[currentTool.imageKey].complete) {
                ctx.drawImage(images[currentTool.imageKey], player.x, player.y, player.width, player.height);
            }
            // Optional: Draw Zap Radius for Shaper tool
            if (currentTool === TOOLS.SHAPER && (keysPressed[' '] || keysPressed['Spacebar'])) {
                ctx.beginPath();
                ctx.arc(player.x + player.width / 2, player.y + player.height / 2, ZAP_BASE_RADIUS + currentTool.zapRadiusBonus, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 200, 255, 0.15)"; ctx.fill();
                ctx.strokeStyle = "rgba(0, 200, 255, 0.4)"; ctx.stroke();
            }
        }
    }

    function mainGameLoop(timestamp) { // Renamed for clarity
        const deltaTime = (timestamp - lastTimestamp) / 1000; // Seconds
        lastTimestamp = timestamp;

        if (gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME') {
            if (gameState === 'PLAYING' && deltaTime > 0 && deltaTime < 0.5) { // Cap deltaTime
                updateGameLogic(deltaTime);
            }
            drawGame();
        } else {
            drawGame(); // Draw static screens
        }
    }

    // --- UI Update ---
    function updateUIDisplay() {
        scoreDisplay.textContent = score;
        currentLevelText.textContent = currentLevelIndex + 1 > gameLevels.length ? gameLevels.length : currentLevelIndex + 1;
        timeLeftDisplay.textContent = Math.ceil(levelTimer);
        currentToolText.textContent = currentTool.name;

        const comfortPercentage = Math.max(0, (currentComfort / MAX_COMFORT) * 100);
        comfortBar.style.width = `${comfortPercentage}%`;
        if (comfortPercentage > 65) {
            comfortBar.style.backgroundColor = '#4caf50';
            if (images.happy_tooth_face.complete) comfortFaceImg.src = images.happy_tooth_face.src;
        } else if (comfortPercentage > 25) {
            comfortBar.style.backgroundColor = '#ffeb3b';
            if (images.happy_tooth_face.complete) comfortFaceImg.src = images.happy_tooth_face.src;
        } else {
            comfortBar.style.backgroundColor = '#f44336';
            if (images.sad_tooth_face.complete) comfortFaceImg.src = images.sad_tooth_face.src;
        }
    }

    function showMessage(title, text, buttonText, callback, autoHide = true) {
        messageTitle.textContent = title; messageText.textContent = text;
        actionButton.textContent = buttonText;
        actionButton.style.display = buttonText ? 'inline-block' : 'none';
        actionButton.onclick = () => { if (autoHide) hideMessage(); if (callback) callback(); };
        messageOverlay.classList.remove('hidden');
    }
    function hideMessage() { messageOverlay.classList.add('hidden'); }

    // --- Event Listeners ---
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault();
        if (e.key.toLowerCase() === 't' && (gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME')) {
            currentTool = (currentTool === TOOLS.FINDER) ? TOOLS.SHAPER : TOOLS.FINDER;
            player.width = currentTool.width; player.height = currentTool.height;
            playSound('tool_switch'); updateUIDisplay();
        }
    });
    window.addEventListener('keyup', (e) => { keysPressed[e.key] = false; });

    canvas.addEventListener('click', (e) => {
        if (gameState === 'ACCESS_MINIGAME') {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top;
            accessTargets.forEach(target => {
                if (!target.hit && Math.hypot(clickX - target.x, clickY - target.y) < target.radius) {
                    target.hit = true; playSound('drill', 0.5);
                    if (accessTargets.every(t => t.hit)) changeGameState('PLAYING');
                }
            });
        }
    });

    // --- Initialize ---
    loadGameAssets();
});
