document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const collisionCanvas = document.getElementById('collisionCanvas');
    const collisionCtx = collisionCanvas.getContext('2d');
    const maskCanvas = document.getElementById('maskCanvas');
    const maskCtx = maskCanvas.getContext('2d');

    // UI Elements
    const scoreDisplay = document.getElementById('score');
    const currentLevelText = document.getElementById('current-level-text');
    const timeLeftDisplay = document.getElementById('time-left');
    const comfortBar = document.getElementById('comfort-bar');
    const comfortFaceImg = document.getElementById('comfort-face');
    const currentToolText = document.getElementById('current-tool-text');
    const toolDescText = document.getElementById('tool-desc-text'); // For tool description
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const actionButton = document.getElementById('action-button');

    // Canvas Setup - Adjusted to new CSS sizes
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    canvas.width = CANVAS_WIDTH; canvas.height = CANVAS_HEIGHT;
    collisionCanvas.width = CANVAS_WIDTH; collisionCanvas.height = CANVAS_HEIGHT;
    maskCanvas.width = CANVAS_WIDTH; maskCanvas.height = CANVAS_HEIGHT;

    // Game Constants - Image sizes increased
    const MAX_COMFORT = 100;
    const COMFORT_DAMAGE_WALL_SMALL = 0.25; // Fine-tuned damage
    const COMFORT_DAMAGE_WALL_LARGE = 0.75;
    const COMFORT_DECREASE_RATE_PASSIVE = 0.02; // Slower passive decrease

    const BACTERIA_DISPLAY_SIZE = 35; // Made bigger
    const PLAYER_TOOL_DISPLAY_WIDTH_FINDER = 30; // Made bigger
    const PLAYER_TOOL_DISPLAY_HEIGHT_FINDER = 60;
    const PLAYER_TOOL_DISPLAY_WIDTH_SHAPER = 34; // Made bigger
    const PLAYER_TOOL_DISPLAY_HEIGHT_SHAPER = 68;
    const ACCESS_TARGET_RADIUS = 25; // Made bigger

    const ZAP_BASE_RADIUS = 40; // Larger zap radius
    const CANAL_DRAW_WIDTH = 35; // Wider canals visually
    const CANAL_COLLISION_WIDTH_BUFFER = 8; // Buffer for collision to be slightly wider than visual

    const TOOLS = {
        FINDER: {
            name: "Finder",
            speed: 4, // Slightly faster
            zapRadiusBonus: 0,
            wallDamage: COMFORT_DAMAGE_WALL_SMALL,
            imageKey: 'endo_file_finder',
            width: PLAYER_TOOL_DISPLAY_WIDTH_FINDER,
            height: PLAYER_TOOL_DISPLAY_HEIGHT_FINDER,
            description: "Finder: Agile & gentle. Faster movement, less comfort penalty on wall contact."
        },
        SHAPER: {
            name: "Shaper",
            speed: 2.8, // Slightly faster
            zapRadiusBonus: 15, // Increased bonus
            wallDamage: COMFORT_DAMAGE_WALL_LARGE,
            imageKey: 'endo_file_shaper',
            width: PLAYER_TOOL_DISPLAY_WIDTH_SHAPER,
            height: PLAYER_TOOL_DISPLAY_HEIGHT_SHAPER,
            description: "Shaper: Powerful cleaner. Slower, wider zap, higher wall penalty."
        }
    };
    let currentTool = TOOLS.FINDER;

    // Game State Variables
    let score = 0;
    let currentComfort = MAX_COMFORT;
    let player = { x: CANVAS_WIDTH / 2, y: 100, width: currentTool.width, height: currentTool.height }; // Adjusted initial Y
    let bacteria = [];
    let accessTargets = [];
    let keysPressed = {};
    let gameState = 'LOADING';
    let currentLevelIndex = 0;
    let levelTimer = 0;
    let gameLoopIntervalId;
    let lastTimestamp = 0;
    let currentProceduralLevelData = {};

    const ASSET_PATH = 'assets/tiles/'; // Ensure this is correct

    const gameLevels = [
        { name: "Molar Initiation", toothImageKey: 'tooth_outline_molar', numCanals: 2, bacteriaCount: 8, timeLimit: 120, accessPointsCount: 2, canalStartPoints: [{ x: CANVAS_WIDTH * 0.45, y: CANVAS_HEIGHT * 0.25 }, { x: CANVAS_WIDTH * 0.55, y: CANVAS_HEIGHT * 0.25 }] },
        { name: "Molar Challenge", toothImageKey: 'tooth_outline_molar', numCanals: 3, bacteriaCount: 12, timeLimit: 100, accessPointsCount: 3, canalStartPoints: [{ x: CANVAS_WIDTH * 0.40, y: CANVAS_HEIGHT * 0.25 }, { x: CANVAS_WIDTH * 0.50, y: CANVAS_HEIGHT * 0.22 }, { x: CANVAS_WIDTH * 0.60, y: CANVAS_HEIGHT * 0.25 }] },
    ];

    const images = {
        access_target: new Image(), bacteria_1: new Image(), bacteria_2: new Image(),
        endo_file_finder: new Image(), endo_file_shaper: new Image(),
        happy_tooth_face: new Image(), inflammation_texture_generic: new Image(),
        sad_tooth_face: new Image(), tooth_outline_molar: new Image(),
    };
    // Sounds are placeholders, actual loading to be implemented if files exist
    const sounds = { drill: null, zap: null, ouch: null, success_level: null, success_game: null, game_over: null, wall_hit: null, tool_switch: null, timer_tick: null, background_music: null };
    let assetsToLoadCount = 0;
    let assetsLoadedCount = 0;

    function countAssets() {
        assetsToLoadCount = Object.keys(images).length; // Sounds not counted for now
    }

    function assetLoadedCallback(type, name) {
        assetsLoadedCount++;
        // console.log(`${type} loaded: ${name} (${assetsLoadedCount}/${assetsToLoadCount})`); // Less verbose
        if (assetsLoadedCount === assetsToLoadCount) {
            console.log("All visual assets loaded.");
            comfortFaceImg.src = `${ASSET_PATH}happy_tooth_face-removebg-preview.png`;
            toolDescText.textContent = currentTool.description; // Initial tool description
            changeGameState('MAIN_MENU');
        }
        updateLoadingProgress();
    }
    function updateLoadingProgress() { /* ... (same as before) ... */ }

    function loadGameAssets() {
        changeGameState('LOADING');
        countAssets();
        updateLoadingProgress();
        images.access_target.src = `${ASSET_PATH}access_target-removebg-preview.png`; images.access_target.onload = () => assetLoadedCallback('Image', 'access_target');
        images.bacteria_1.src = `${ASSET_PATH}bacteria_1-removebg-preview.png`; images.bacteria_1.onload = () => assetLoadedCallback('Image', 'bacteria_1');
        images.bacteria_2.src = `${ASSET_PATH}bacteria_2-removebg-preview.png`; images.bacteria_2.onload = () => assetLoadedCallback('Image', 'bacteria_2');
        images.endo_file_finder.src = `${ASSET_PATH}endo_file_finder-removebg-preview.png`; images.endo_file_finder.onload = () => assetLoadedCallback('Image', 'endo_file_finder');
        images.endo_file_shaper.src = `${ASSET_PATH}endo_file_shaper-removebg-preview.png`; images.endo_file_shaper.onload = () => assetLoadedCallback('Image', 'endo_file_shaper');
        images.happy_tooth_face.src = `${ASSET_PATH}happy_tooth_face-removebg-preview.png`; images.happy_tooth_face.onload = () => assetLoadedCallback('Image', 'happy_tooth_face');
        images.inflammation_texture_generic.src = `${ASSET_PATH}inflammation_texture_generic.png`; images.inflammation_texture_generic.onload = () => assetLoadedCallback('Image', 'inflammation_texture_generic');
        images.sad_tooth_face.src = `${ASSET_PATH}sad_tooth_face-removebg-preview.png`; images.sad_tooth_face.onload = () => assetLoadedCallback('Image', 'sad_tooth_face');
        images.tooth_outline_molar.src = `${ASSET_PATH}tooth_outline_molar.png`; images.tooth_outline_molar.onload = () => assetLoadedCallback('Image', 'tooth_outline_molar');
    }
    function playSound(soundKey, volume = 0.7) { /* ... (same as before) ... */ }

    // --- Procedural Generation ---
    function generateProceduralLevel(levelConfig) {
        currentProceduralLevelData = {
            config: levelConfig, canalPaths: [], accessPoints: [], bacteriaSpawns: []
        };
        for (let i = 0; i < levelConfig.numCanals; i++) {
            const startPoint = levelConfig.canalStartPoints[i] || { x: CANVAS_WIDTH / 2 + (i - levelConfig.numCanals / 2) * 60, y: CANVAS_HEIGHT * 0.3 };
            const path = generateSingleCanalPath(startPoint.x, startPoint.y, 18 + Math.random() * 12, CANAL_DRAW_WIDTH * 0.6); // Longer, more steps
            currentProceduralLevelData.canalPaths.push(path);
        }
        const pulpChamberCenter = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.2 };
        for (let i = 0; i < levelConfig.accessPointsCount; i++) {
            currentProceduralLevelData.accessPoints.push({
                x: pulpChamberCenter.x + (Math.random() - 0.5) * 80,
                y: pulpChamberCenter.y + (Math.random() - 0.5) * 50,
                radius: ACCESS_TARGET_RADIUS, // Use constant
                hit: false
            });
        }
        accessTargets = currentProceduralLevelData.accessPoints;
        generateCollisionMapFromPaths(currentProceduralLevelData.canalPaths);
        spawnBacteriaProcedural(levelConfig.bacteriaCount, currentProceduralLevelData.canalPaths);
    }

    function generateSingleCanalPath(startX, startY, numSteps, stepSize) {
        let path = [{ x: startX, y: startY }];
        let currentX = startX; let currentY = startY;
        let lastAngle = Math.PI / 2; // Start by generally going down

        for (let i = 0; i < numSteps; i++) {
            // Bias angle change to be smoother, less erratic turns
            let angleChange = (Math.random() - 0.5) * Math.PI * 0.4; // Max 36 deg change per step
            let angle = lastAngle + angleChange;

            // Stronger bias downwards, but allow some horizontal spread
            angle = Math.max(Math.PI * 0.20, Math.min(Math.PI * 0.80, angle)); // Confine to a downward cone mostly

            let currentStepSize = stepSize * (0.8 + Math.random() * 0.4); // Vary step length
            let nextX = currentX + Math.cos(angle) * currentStepSize;
            let nextY = currentY + Math.sin(angle) * currentStepSize;

            // Keep within canvas boundaries (generous margins)
            nextX = Math.max(CANVAS_WIDTH * 0.1, Math.min(CANVAS_WIDTH * 0.9, nextX));
            nextY = Math.max(startY - CANVAS_HEIGHT * 0.05, Math.min(CANVAS_HEIGHT * 0.9, nextY));

            currentX = nextX; currentY = nextY;
            path.push({ x: currentX, y: currentY });
            lastAngle = angle; // Remember last angle for smoother transition
        }
        return path;
    }

    function generateCollisionMapFromPaths(paths) {
        collisionCtx.fillStyle = 'black';
        collisionCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        collisionCtx.strokeStyle = 'white';
        collisionCtx.lineWidth = CANAL_DRAW_WIDTH + CANAL_COLLISION_WIDTH_BUFFER; // Collision path wider
        collisionCtx.lineCap = 'round'; collisionCtx.lineJoin = 'round';
        paths.forEach(path => {
            if (path.length < 2) return;
            collisionCtx.beginPath(); collisionCtx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) collisionCtx.lineTo(path[i].x, path[i].y);
            collisionCtx.stroke();
        });
    }

    function spawnBacteriaProcedural(count, paths) {
        bacteria = []; let attempts = 0;
        while (bacteria.length < count && attempts < 1000) { // Increased attempts
            attempts++;
            if (paths.length === 0 || paths.every(p => p.length < 2)) break;

            const randomPath = paths.filter(p => p.length >=2)[Math.floor(Math.random() * paths.filter(p => p.length >=2).length)];
            if (!randomPath) continue;

            const randomSegmentIndex = Math.floor(Math.random() * (randomPath.length - 1));
            const p1 = randomPath[randomSegmentIndex]; const p2 = randomPath[randomSegmentIndex + 1];
            const t = Math.random();
            const spawnX = p1.x + (p2.x - p1.x) * t;
            const spawnY = p1.y + (p2.y - p1.y) * t;

            if (!isWall(spawnX, spawnY)) { // Check center of bacteria
                bacteria.push({
                    x: spawnX - BACTERIA_DISPLAY_SIZE / 2, y: spawnY - BACTERIA_DISPLAY_SIZE / 2,
                    width: BACTERIA_DISPLAY_SIZE, height: BACTERIA_DISPLAY_SIZE,
                    type: Math.random() > 0.5 ? 'bacteria_1' : 'bacteria_2',
                    vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
                    moveCooldown: Math.random() * 1.5 + 0.5 // Move more frequently
                });
            }
        }
        if (attempts >= 1000 && bacteria.length < count) console.warn("Could not spawn all bacteria.");
    }

    // --- Game State Management ---
    function changeGameState(newState) { /* ... (same as before, just ensure title is Endo Madness) ... */
        gameState = newState;
        // console.log("Game state changed to: " + gameState); // Good for debugging
        messageOverlay.classList.add('hidden');
        if (gameLoopIntervalId) { clearInterval(gameLoopIntervalId); gameLoopIntervalId = null; } // Clear robustly

        switch (gameState) {
            case 'LOADING':
                messageTitle.textContent = "Loading Endo Madness...";
                messageText.textContent = `Loaded ${assetsLoadedCount} of ${assetsToLoadCount}`;
                actionButton.style.display = 'none';
                break;
            case 'MAIN_MENU':
                showMessage("Endo Madness", "Ready to face the madness?", "Start Game", () => {
                    currentLevelIndex = 0; score = 0;
                    changeGameState('LEVEL_INTRO');
                });
                break;
            // ... other cases largely same, ensure titles reflect "Endo Madness" if hardcoded
            case 'LEVEL_INTRO':
                const levelConfig = gameLevels[currentLevelIndex];
                showMessage(`Level ${currentLevelIndex + 1}: ${levelConfig.name}`, `Enemies: ${levelConfig.bacteriaCount}, Time: ${levelConfig.timeLimit}s. Prepare!`, "Begin Access", () => {
                    setupProceduralLevel();
                    changeGameState('ACCESS_MINIGAME');
                });
                break;
            case 'ACCESS_MINIGAME':
                hideMessage();
                // Start game loop if not already running
                if (!gameLoopIntervalId) gameLoopIntervalId = setInterval(mainGameLoop, 1000 / 60);
                break;
            case 'PLAYING':
                hideMessage();
                if (!gameLoopIntervalId) gameLoopIntervalId = setInterval(mainGameLoop, 1000 / 60);
                lastTimestamp = performance.now(); // Reset for deltaTime calculation
                break;
            // ... rest of cases
            case 'FILLING_PHASE':
                showMessage("Area Cleared!", "Excellent work. Click to seal.", "Seal Area", () => {
                    playSound('success_level');
                    changeGameState('LEVEL_COMPLETE');
                });
                break;
             case 'GAMEOVER':
                playSound('game_over');
                let reason = currentComfort <= 0 ? "Patient comfort depleted!" : "Time's up!";
                showMessage("Session Failed!", `${reason} Final Score: ${score}`, "Retry Level", () => {
                    // Reset to current level intro instead of main menu to retry
                    // score = 0; // Optionally reset score for the level or keep cumulative
                    changeGameState('LEVEL_INTRO'); 
                });
                break;
        }
        updateUIDisplay();
    }
    function setupProceduralLevel() { /* ... (same as before) ... */ }

    // --- Collision Detection ---
    function isWall(x, y) {
        if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return true;
        try {
            const pixelData = collisionCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
            return pixelData[0] < 128; // Simpler: if R channel is dark, it's a wall
        } catch (e) {
            // console.error("Error reading pixel data from collision canvas at:", x, y, e);
            return true; // Treat errors as walls to be safe
        }
    }

    // --- Game Loop ---
    function updateGameLogic(deltaTime) {
        if (gameState !== 'PLAYING') return; // Strict check

        levelTimer -= deltaTime; // Timer tick down
        if (levelTimer <= 0) { levelTimer = 0; changeGameState('GAMEOVER'); return; }
        if (levelTimer < 10.5 && Math.floor(levelTimer) !== Math.floor(levelTimer + deltaTime) && levelTimer > 0) { // Check before it hits 0
             playSound('timer_tick', 0.5);
        }

        currentComfort -= COMFORT_DECREASE_RATE_PASSIVE * deltaTime;

        // Player movement - refined collision
        let dx = 0, dy = 0;
        const speed = currentTool.speed;
        if (keysPressed['ArrowUp'] || keysPressed['w']) dy -= speed;
        if (keysPressed['ArrowDown'] || keysPressed['s']) dy += speed;
        if (keysPressed['ArrowLeft'] || keysPressed['a']) dx -= speed;
        if (keysPressed['ArrowRight'] || keysPressed['d']) dx += speed;

        const currentX = player.x;
        const currentY = player.y;
        const nextX = player.x + dx;
        const nextY = player.y + dy;

        // Test X movement
        if (dx !== 0) {
            if (!isWall(nextX + (dx > 0 ? player.width : 0), player.y + player.height / 2) &&
                !isWall(nextX + (dx > 0 ? player.width : 0), player.y) && // Check top corner
                !isWall(nextX + (dx > 0 ? player.width : 0), player.y + player.height)) { // Check bottom corner
                player.x = nextX;
            } else {
                currentComfort -= currentTool.wallDamage; playSound('wall_hit', 0.3);
            }
        }
        // Test Y movement
        if (dy !== 0) {
            if (!isWall(player.x + player.width / 2, nextY + (dy > 0 ? player.height : 0)) &&
                !isWall(player.x, nextY + (dy > 0 ? player.height : 0)) && // Check left corner
                !isWall(player.x + player.width, nextY + (dy > 0 ? player.height : 0))) { // Check right corner
                player.y = nextY;
            } else {
                currentComfort -= currentTool.wallDamage; playSound('wall_hit', 0.3);
            }
        }

        player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
        player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));

        // Bacteria movement (same as before)
        bacteria.forEach(b => { /* ... */ });


        // Zapping bacteria
        if (keysPressed[' '] || keysPressed['Spacebar']) {
            let zappedThisPress = false; // Ensure one press doesn't clear multiple frames
            const zapRadius = ZAP_BASE_RADIUS + currentTool.zapRadiusBonus;
            bacteria = bacteria.filter(b => {
                const dist = Math.hypot((player.x + player.width / 2) - (b.x + b.width / 2), (player.y + player.height / 2) - (b.y + b.height / 2));
                if (dist < zapRadius + b.width / 2) {
                    score += 10; // Score update
                    zappedThisPress = true;
                    return false;
                }
                return true;
            });
            if (zappedThisPress) playSound('zap');
            keysPressed[' '] = false; keysPressed['Spacebar'] = false; // Consume the key press
        }


        if (currentComfort <= 0) { currentComfort = 0; playSound('ouch', 1.0); changeGameState('GAMEOVER'); return; }
        if (bacteria.length === 0 && gameState === 'PLAYING') { // Ensure not already in another state
            changeGameState('FILLING_PHASE'); return;
        }
        updateUIDisplay(); // Ensure UI updates after score changes etc.
    }

    function drawGame() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const levelConf = currentProceduralLevelData.config;

        // 1. Draw Tooth Outline - ensure it's drawn opaquely
        if (levelConf && images[levelConf.toothImageKey] && images[levelConf.toothImageKey].complete) {
            const img = images[levelConf.toothImageKey];
            // Draw image centered and scaled to fit if it's larger than canvas, or just centered if smaller.
            // This logic assumes the "tooth" art within the image is centered and fills most of its source dimensions.
            let drawWidth = img.width;
            let drawHeight = img.height;
            let scale = 1;

            // If image is wider or taller than canvas, scale it down to fit while maintaining aspect ratio
            if (img.width > CANVAS_WIDTH || img.height > CANVAS_HEIGHT) {
                scale = Math.min(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
                drawWidth = img.width * scale;
                drawHeight = img.height * scale;
            }
            // Or, if you want it to always fill a certain portion, e.g., 80% of canvas height:
            // scale = (CANVAS_HEIGHT * 0.8) / img.height;
            // drawWidth = img.width * scale;
            // drawHeight = img.height * scale;


            const imgX = (CANVAS_WIDTH - drawWidth) / 2;
            const imgY = (CANVAS_HEIGHT - drawHeight) / 2;
            ctx.globalAlpha = 1.0; // Ensure full opacity for the tooth outline image
            ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
        } else {
            ctx.fillStyle = '#EFEFEF';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Fallback background
        }

        // ... rest of drawing logic for canals, inflammation, fill (largely same) ...
        // Ensure CANAL_DRAW_WIDTH is used for visual canals
        const paths = currentProceduralLevelData.canalPaths || [];
        // ... (masking logic for inflammation/fill remains the same) ...

        // Healthy canal base color
        ctx.strokeStyle = '#FFD1DC'; // Lighter Pink for healthy base
        ctx.lineWidth = CANAL_DRAW_WIDTH;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        paths.forEach(path => {
            if (path.length < 2) return;
            ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
        });

        // Inflammation
        if ((gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME' || gameState === 'GAMEOVER') &&
            images.inflammation_texture_generic && images.inflammation_texture_generic.complete) {
            // ... (masking and drawing inflammation texture as before) ...
            // Ensure mask is generated correctly based on CANAL_DRAW_WIDTH
            maskCtx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
            maskCtx.fillStyle = 'black'; maskCtx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
            if (paths.length > 0) {
                maskCtx.strokeStyle = 'white'; maskCtx.lineWidth = CANAL_DRAW_WIDTH;
                maskCtx.lineCap = 'round'; maskCtx.lineJoin = 'round';
                paths.forEach(path => { /* ... draw path to maskCtx ... */ 
                    if (path.length < 2) return;
                    maskCtx.beginPath(); maskCtx.moveTo(path[0].x, path[0].y);
                    for (let i = 1; i < path.length; i++) maskCtx.lineTo(path[i].x, path[i].y);
                    maskCtx.stroke();
                });
            }
            const inflammationAlpha = Math.min(0.75, Math.max(0.15, 1.2 - (currentComfort / MAX_COMFORT))); // Adjusted alpha
            ctx.globalAlpha = inflammationAlpha;
            const pattern = ctx.createPattern(images.inflammation_texture_generic, 'repeat');
            ctx.fillStyle = pattern; ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(maskCanvas, 0, 0);
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        } else if (gameState === 'LEVEL_COMPLETE' || gameState === 'GAME_WON' || gameState === 'FILLING_PHASE') {
            ctx.strokeStyle = '#FF7F50'; // Coral/Orange for fill
            ctx.lineWidth = CANAL_DRAW_WIDTH;
            // ... (draw filled paths) ...
            paths.forEach(path => {
                if (path.length < 2) return;
                ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
                for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
            });
        }


        // Draw Access Targets / Player / Bacteria (using new display sizes)
        if (gameState === 'ACCESS_MINIGAME') {
            accessTargets.forEach(target => {
                if (!target.hit && images.access_target && images.access_target.complete) {
                    ctx.drawImage(images.access_target, target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2);
                } else if (target.hit) { // Visual feedback for hit targets
                    ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
                    ctx.beginPath(); ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2); ctx.fill();
                }
            });
            if (images[currentTool.imageKey] && images[currentTool.imageKey].complete) {
                 ctx.drawImage(images[currentTool.imageKey], player.x, player.y, currentTool.width, currentTool.height);
            }
        } else if (gameState === 'PLAYING') {
            bacteria.forEach(b => {
                if (images[b.type] && images[b.type].complete) ctx.drawImage(images[b.type], b.x, b.y, b.width, b.height);
            });
            if (images[currentTool.imageKey] && images[currentTool.imageKey].complete) {
                ctx.drawImage(images[currentTool.imageKey], player.x, player.y, currentTool.width, currentTool.height);
            }
             if (currentTool === TOOLS.SHAPER && (keysPressed[' '] || keysPressed['Spacebar'])) { /* ... (zap radius draw) ... */ }
        }
    }

    function mainGameLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp; // Initialize on first frame
        const deltaTime = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        // Cap deltaTime to prevent huge jumps if tab loses focus
        const cappedDeltaTime = Math.min(deltaTime, 0.1); // Max 0.1s jump (10 FPS equivalent for a single frame)

        if (gameState === 'PLAYING') {
            updateGameLogic(cappedDeltaTime); // Use capped deltaTime
        }
        // Always draw, even if paused or in other states, to keep UI responsive
        drawGame();
    }


    function updateUIDisplay() {
        scoreDisplay.textContent = score; // Score update fixed
        currentLevelText.textContent = currentLevelIndex + 1 > gameLevels.length ? gameLevels.length : currentLevelIndex + 1;
        timeLeftDisplay.textContent = Math.max(0, Math.ceil(levelTimer)); // Ensure timer doesn't go negative on display

        currentToolText.textContent = currentTool.name;
        toolDescText.textContent = currentTool.description; // Update tool description

        const comfortPercentage = Math.max(0, (currentComfort / MAX_COMFORT) * 100);
        // ... (comfort bar and face logic same) ...
        if (images.happy_tooth_face.complete && images.sad_tooth_face.complete) { // Ensure images are loaded
            if (comfortPercentage > 65) {
                comfortBar.style.backgroundColor = '#4caf50';
                comfortFaceImg.src = images.happy_tooth_face.src;
            } else if (comfortPercentage > 25) {
                comfortBar.style.backgroundColor = '#ffeb3b';
                comfortFaceImg.src = images.happy_tooth_face.src;
            } else {
                comfortBar.style.backgroundColor = '#f44336';
                comfortFaceImg.src = images.sad_tooth_face.src;
            }
        }
    }
    function showMessage(title, text, buttonText, callback, autoHide = true) { /* ... (same) ... */ }
    function hideMessage() { /* ... (same) ... */ }

    // --- Event Listeners ---
    window.addEventListener('keydown', (e) => {
        // Prevent default for space and arrow keys to avoid page scrolling
        if ([' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        keysPressed[e.key.toLowerCase()] = true; // Store keys as lowercase for consistency (w vs W)

        // Tool Switch: More robust check
        if (e.key.toLowerCase() === 't') {
            if (gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME') {
                currentTool = (currentTool === TOOLS.FINDER) ? TOOLS.SHAPER : TOOLS.FINDER;
                player.width = currentTool.width;
                player.height = currentTool.height;
                playSound('tool_switch');
                updateUIDisplay(); // Update description immediately
            }
        }
    });
    window.addEventListener('keyup', (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    });

    canvas.addEventListener('click', (e) => {
        if (gameState === 'ACCESS_MINIGAME') {
            const rect = canvas.getBoundingClientRect();
            // Calculate scale factors if canvas is styled to a different size than its resolution
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            // console.log(`Click at: ${clickX}, ${clickY}`); // For debugging click coords

            let targetHitThisClick = false;
            accessTargets.forEach(target => {
                if (!target.hit) {
                    const dist = Math.hypot(clickX - target.x, clickY - target.y);
                    // console.log(`Target: ${target.x}, ${target.y}, Radius: ${target.radius}, Dist: ${dist}`);
                    if (dist < target.radius) {
                        target.hit = true;
                        targetHitThisClick = true;
                        // console.log("Target Hit!");
                    }
                }
            });

            if (targetHitThisClick) {
                playSound('drill', 0.5);
                 // Check if all targets hit AFTER iterating, to avoid modifying array during loop implicitly
                if (accessTargets.every(t => t.hit)) {
                    // console.log("All targets hit, changing to PLAYING");
                    changeGameState('PLAYING');
                }
            }
        }
    });

    // --- Initialize ---
    loadGameAssets();
});
