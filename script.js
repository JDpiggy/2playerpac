document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const collisionCanvas = document.getElementById('collisionCanvas');
    const collisionCtx = collisionCanvas.getContext('2d');

    const scoreDisplay = document.getElementById('score');
    const currentLevelText = document.getElementById('current-level-text');
    const timeLeftDisplay = document.getElementById('time-left');
    const comfortBar = document.getElementById('comfort-bar');
    const comfortFace = document.getElementById('comfort-face');
    const currentToolText = document.getElementById('current-tool-text');
    
    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const actionButton = document.getElementById('action-button');

    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 450;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    collisionCanvas.width = CANVAS_WIDTH; // Must match game canvas for 1:1 collision
    collisionCanvas.height = CANVAS_HEIGHT;

    const WALL_COLOR_R = 0; // Assuming black walls (R=0, G=0, B=0)
    const WALL_COLOR_G = 0;
    const WALL_COLOR_B = 0;
    const PATH_COLOR_R = 255; // Assuming white paths (R=255, G=255, B=255)

    const MAX_COMFORT = 100;
    const COMFORT_DAMAGE_WALL_SMALL = 1;
    const COMFORT_DAMAGE_WALL_LARGE = 3;
    const COMFORT_DECREASE_RATE = 0.05; // Comfort points per second
    
    const BACTERIA_SIZE = 18;
    const ZAP_BASE_RADIUS = 25;

    const TOOLS = {
        FINDER: { 
            name: "Finder", 
            speed: 4, 
            zapRadiusBonus: 0, 
            wallDamage: COMFORT_DAMAGE_WALL_SMALL, 
            imageKey: 'endo_file_finder',
            width: 15, height: 30
        },
        SHAPER: { 
            name: "Shaper", 
            speed: 2.5, 
            zapRadiusBonus: 10, 
            wallDamage: COMFORT_DAMAGE_WALL_LARGE, 
            imageKey: 'endo_file_shaper',
            width: 17, height: 34
        }
    };
    let currentTool = TOOLS.FINDER;

    let score = 0;
    let currentComfort = MAX_COMFORT;
    let player = { x: CANVAS_WIDTH / 2, y: 50, width: currentTool.width, height: currentTool.height };
    let bacteria = [];
    let accessTargets = [];
    let keysPressed = {};
    let gameState = 'LOADING'; // LOADING, MAIN_MENU, LEVEL_INTRO, ACCESS_MINIGAME, PLAYING, FILLING_PHASE, LEVEL_COMPLETE, GAME_OVER, GAME_WON
    let currentLevelIndex = 0;
    let levelTimer = 0;
    let gameLoopInterval;
    let lastTime = 0;

    const levels = [
        {
            name: "Molar Madness",
            bacteriaCount: 8,
            timeLimit: 120, // seconds
            toothBgKey: 'tooth_bg_level1',
            collisionMapKey: 'collision_map_level1',
            pulpInflamedKey: 'pulp_inflamed_level1',
            guttaPerchaKey: 'gutta_percha_fill_level1',
            accessPoints: [{x: 300, y:100}, {x:250, y:150}, {x:350, y:150}] // Example points
        },
        {
            name: "Incisor Intensity",
            bacteriaCount: 12,
            timeLimit: 90,
            toothBgKey: 'tooth_bg_level2',
            collisionMapKey: 'collision_map_level2',
            pulpInflamedKey: 'pulp_inflamed_level2',
            guttaPerchaKey: 'gutta_percha_fill_level2',
            accessPoints: [{x: 300, y:80}, {x:300, y:130}]
        }
        // Add more levels here
    ];

    // --- Asset Loading ---
    const images = {
        endo_file_finder: new Image(), endo_file_shaper: new Image(),
        bacteria_1: new Image(), bacteria_2: new Image(),
        happy_tooth_face: new Image(), sad_tooth_face: new Image(),
        access_target: new Image(),
        // Level specific images will be loaded dynamically
    };
    const sounds = {
        drill: null, zap: null, ouch: null, success_level: null, 
        success_game: null, game_over: null, wall_hit: null, tool_switch: null,
        timer_tick: null, background_music: null
    };

    let assetsToLoad = 0;
    let assetsLoaded = 0;

    function countAssets() {
        assetsToLoad = Object.keys(images).length + Object.keys(sounds).length;
        levels.forEach(level => {
            assetsToLoad += 4; // tooth_bg, collision_map, pulp_inflamed, gutta_percha
        });
    }

    function assetLoaded(type, name) {
        assetsLoaded++;
        console.log(`${type} loaded: ${name} (${assetsLoaded}/${assetsToLoad})`);
        if (assetsLoaded === assetsToLoad) {
            console.log("All assets loaded.");
            // Initialize level-specific images in the main images object for easy access
            levels.forEach((level, index) => {
                images[level.toothBgKey] = new Image(); images[level.toothBgKey].src = `${level.toothBgKey}.png`;
                images[level.collisionMapKey] = new Image(); images[level.collisionMapKey].src = `${level.collisionMapKey}.png`;
                images[level.pulpInflamedKey] = new Image(); images[level.pulpInflamedKey].src = `${level.pulpInflamedKey}.png`;
                images[level.guttaPerchaKey] = new Image(); images[level.guttaPerchaKey].src = `${level.guttaPerchaKey}.png`;
            });
            // Wait for dynamically added level images to confirm load (simple timeout for demo)
            // A more robust solution would use their onload events
            setTimeout(() => {
                 changeGameState('MAIN_MENU');
            }, 1000); // Give time for level-specific images to load
        }
        updateLoadingProgress();
    }
    
    function updateLoadingProgress() {
        if (gameState === 'LOADING') {
            messageTitle.textContent = "Loading Assets...";
            messageText.textContent = `Loaded ${assetsLoaded} of ${assetsToLoad}`;
            actionButton.style.display = 'none';
        }
    }

    function loadAssets() {
        changeGameState('LOADING');
        updateLoadingProgress();

        // Load general images
        images.endo_file_finder.src = 'endo_file_finder.png'; images.endo_file_finder.onload = () => assetLoaded('Image', 'endo_file_finder');
        images.endo_file_shaper.src = 'endo_file_shaper.png'; images.endo_file_shaper.onload = () => assetLoaded('Image', 'endo_file_shaper');
        images.bacteria_1.src = 'bacteria_1.png'; images.bacteria_1.onload = () => assetLoaded('Image', 'bacteria_1');
        images.bacteria_2.src = 'bacteria_2.png'; images.bacteria_2.onload = () => assetLoaded('Image', 'bacteria_2'); // Optional
        images.happy_tooth_face.src = 'happy_tooth_face.png'; images.happy_tooth_face.onload = () => { assetLoaded('Image', 'happy_tooth_face'); comfortFace.src = images.happy_tooth_face.src;};
        images.sad_tooth_face.src = 'sad_tooth_face.png'; images.sad_tooth_face.onload = () => assetLoaded('Image', 'sad_tooth_face');
        images.access_target.src = 'access_target.png'; images.access_target.onload = () => assetLoaded('Image', 'access_target');

        // Load level-specific image paths (actual loading happens when assetLoaded confirms all general assets)
        levels.forEach(level => {
            // These will be properly loaded later, just counting them now
            // The src setting will happen after all base images are loaded.
        });


        // Load sounds
        const soundFiles = {
            drill: 'drill_sound.mp3', zap: 'zap_sound.mp3', ouch: 'ouch_sound.mp3', 
            success_level: 'success_level_sound.mp3', success_game: 'success_game_sound.mp3', 
            game_over: 'game_over_sound.mp3', wall_hit: 'wall_hit_sound.mp3', 
            tool_switch: 'tool_switch_sound.mp3', timer_tick: 'timer_tick_low_sound.mp3',
            background_music: 'background_music.mp3'
        };
        for (const key in soundFiles) {
            sounds[key] = new Audio(soundFiles[key]);
            sounds[key].oncanplaythrough = () => assetLoaded('Sound', key);
            sounds[key].onerror = () => { console.warn(`Could not load sound: ${key}`); assetLoaded('Sound (Error)', key); }; // Still count it
        }
        if(sounds.background_music) sounds.background_music.loop = true;
    }
    
    function playSound(soundKey, volume = 0.7) {
        if (sounds[soundKey]) {
            sounds[soundKey].currentTime = 0;
            sounds[soundKey].volume = volume;
            sounds[soundKey].play().catch(e => console.warn("Sound play interrupted or failed:", e));
        }
    }

    // --- Game State Management ---
    function changeGameState(newState) {
        gameState = newState;
        console.log("Game state changed to: " + gameState);
        messageOverlay.classList.add('hidden'); // Hide message by default

        if (gameLoopInterval) clearInterval(gameLoopInterval); // Clear previous interval

        switch (gameState) {
            case 'LOADING':
                showMessage("Loading...", "Please wait for assets to load.", "", null, false);
                actionButton.style.display = 'none';
                break;
            case 'MAIN_MENU':
                if (sounds.background_music && sounds.background_music.paused) playSound('background_music', 0.3);
                showMessage("Canal Cleaners Deluxe", "Ready to save some teeth?", "Start Game", () => {
                    currentLevelIndex = 0;
                    score = 0;
                    changeGameState('LEVEL_INTRO');
                });
                break;
            case 'LEVEL_INTRO':
                const level = levels[currentLevelIndex];
                showMessage(`Level ${currentLevelIndex + 1}: ${level.name}`, `Bacteria: ${level.bacteriaCount}, Time: ${level.timeLimit}s. Get ready!`, "Begin Access", () => {
                    setupLevel();
                    changeGameState('ACCESS_MINIGAME');
                });
                break;
            case 'ACCESS_MINIGAME':
                startAccessMinigame();
                gameLoopInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
                break;
            case 'PLAYING':
                hideMessage();
                // gameLoopInterval is already running from ACCESS_MINIGAME or resumed
                if (!gameLoopInterval) gameLoopInterval = setInterval(gameLoop, 1000 / 60);
                lastTime = performance.now(); // Reset delta time calculation
                break;
            case 'FILLING_PHASE':
                // Simplified filling phase for now
                showMessage("Canal Cleaned!", "Excellent work. Click to fill the canal.", "Fill Canal", () => {
                    playSound('success_level');
                    changeGameState('LEVEL_COMPLETE');
                });
                break;
            case 'LEVEL_COMPLETE':
                score += Math.max(0, Math.floor(levelTimer * 2)); // Time bonus
                score += Math.max(0, Math.floor(currentComfort)); // Comfort bonus
                updateUI();
                if (currentLevelIndex < levels.length - 1) {
                    showMessage("Level Complete!", `Great job! Score: ${score}.`, "Next Patient", () => {
                        currentLevelIndex++;
                        changeGameState('LEVEL_INTRO');
                    });
                } else {
                    changeGameState('GAME_WON');
                }
                break;
            case 'GAME_WON':
                playSound('success_game');
                showMessage("Congratulations!", `You've saved all the teeth! Final Score: ${score}`, "Play Again?", () => {
                    changeGameState('MAIN_MENU');
                });
                break;
            case 'GAMEOVER':
                playSound('game_over');
                let reason = currentComfort <= 0 ? "Patient comfort reached zero!" : "Time ran out!";
                showMessage("Game Over!", `${reason} Final Score: ${score}`, "Try Again", () => {
                    // Reset to current level intro or main menu
                    currentLevelIndex = 0; // Or keep currentLevelIndex to retry same level
                    score = 0;
                    changeGameState('MAIN_MENU'); // Or LEVEL_INTRO to retry
                });
                break;
        }
        updateUI();
    }

    // --- Level Setup ---
    function setupLevel() {
        const level = levels[currentLevelIndex];
        currentComfort = MAX_COMFORT;
        levelTimer = level.timeLimit;
        player.x = CANVAS_WIDTH / 2 - player.width / 2;
        player.y = 60; // Initial safe Y position
        keysPressed = {};
        
        // Load collision map onto hidden canvas
        collisionCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (images[level.collisionMapKey] && images[level.collisionMapKey].complete) {
            collisionCtx.drawImage(images[level.collisionMapKey], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
            console.error("Collision map not loaded for level: " + level.name);
            // Fallback: make entire canvas white (passable) - not ideal
            collisionCtx.fillStyle = 'white';
            collisionCtx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        }


        spawnBacteria();
        updateUI();
    }

    function startAccessMinigame() {
        const level = levels[currentLevelIndex];
        accessTargets = level.accessPoints.map(p => ({ ...p, radius: 15, hit: false }));
        hideMessage(); // Ensure no other message is showing
    }

    function spawnBacteria() {
        bacteria = [];
        const level = levels[currentLevelIndex];
        let attempts = 0;
        while (bacteria.length < level.bacteriaCount && attempts < 500) {
            attempts++;
            const potentialX = Math.random() * (CANVAS_WIDTH - BACTERIA_SIZE);
            const potentialY = Math.random() * (CANVAS_HEIGHT - BACTERIA_SIZE);

            if (!isWall(potentialX + BACTERIA_SIZE / 2, potentialY + BACTERIA_SIZE / 2, true)) { // Check center
                bacteria.push({
                    x: potentialX,
                    y: potentialY,
                    width: BACTERIA_SIZE,
                    height: BACTERIA_SIZE,
                    type: Math.random() > 0.5 ? 'bacteria_1' : 'bacteria_2',
                    vx: (Math.random() - 0.5) * 1, // Slow random movement
                    vy: (Math.random() - 0.5) * 1,
                    moveCooldown: 0
                });
            }
        }
        if (attempts >= 500 && bacteria.length < level.bacteriaCount) {
            console.warn("Could not spawn all bacteria for level. Check collision map and spawn logic.");
        }
    }
    
    // --- Collision Detection ---
    function isWall(x, y, isBacteriaSpawning = false) {
        if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) return true; // Out of bounds

        // For player, check a few points around its bounding box for more accuracy
        // For bacteria spawning, just check the single point.
        const pointsToCheck = isBacteriaSpawning ? [{x,y}] : [
            { x: x - player.width / 4, y: y - player.height / 4 }, // Top-leftish
            { x: x + player.width / 4, y: y - player.height / 4 }, // Top-rightish
            { x: x - player.width / 4, y: y + player.height / 4 }, // Bottom-leftish
            { x: x + player.width / 4, y: y + player.height / 4 }, // Bottom-rightish
            { x: x, y: y } // Center
        ];
        
        for (const p of pointsToCheck) {
            if (p.x < 0 || p.x >= CANVAS_WIDTH || p.y < 0 || p.y >= CANVAS_HEIGHT) continue; // Skip OOB check points

            const pixelData = collisionCtx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
            // Check if pixel is NOT the path color (e.g., white)
            // This simple check assumes path is pure white (255,255,255) and walls are black (0,0,0)
            // More robust: if (pixelData[0] === WALL_COLOR_R && pixelData[1] === WALL_COLOR_G && pixelData[2] === WALL_COLOR_B)
            if (pixelData[0] < 128 && pixelData[1] < 128 && pixelData[2] < 128) { // Assuming dark colors are walls
                 return true; // It's a wall
            }
        }
        return false; // It's a path
    }


    // --- Game Loop ---
    function update(deltaTime) {
        if (gameState === 'PLAYING') {
            // Timer
            levelTimer -= deltaTime;
            if (levelTimer <= 0) {
                levelTimer = 0;
                changeGameState('GAMEOVER');
                return;
            }
            if (levelTimer < 10 && Math.floor(levelTimer) !== Math.floor(levelTimer + deltaTime)) {
                 playSound('timer_tick', 0.5);
            }

            // Comfort decrease over time
            currentComfort -= COMFORT_DECREASE_RATE * deltaTime;

            // Player movement
            let dx = 0;
            let dy = 0;
            if (keysPressed['ArrowUp'] || keysPressed['w']) dy -= currentTool.speed;
            if (keysPressed['ArrowDown'] || keysPressed['s']) dy += currentTool.speed;
            if (keysPressed['ArrowLeft'] || keysPressed['a']) dx -= currentTool.speed;
            if (keysPressed['ArrowRight'] || keysPressed['d']) dx += currentTool.speed;

            const newX = player.x + dx;
            const newY = player.y + dy;
            
            // Collision check before moving
            // Check center of player's new position
            const collisionPointX = newX + player.width / 2;
            const collisionPointY = newY + player.height / 2;

            if (!isWall(collisionPointX, newY + player.height/2)) {
                player.y = newY;
            } else if (dy !== 0) {
                currentComfort -= currentTool.wallDamage;
                playSound('wall_hit', 0.4);
            }

            if (!isWall(newX + player.width/2, collisionPointY)) { // check Y with the *original* Y if X is blocked
                player.x = newX;
            } else if (dx !== 0) { // If X movement was attempted and failed
                 currentComfort -= currentTool.wallDamage;
                 playSound('wall_hit', 0.4);
            }
            
            // Clamp player to canvas boundaries (should be handled by collision map, but as a fallback)
            player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.width, player.x));
            player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.height, player.y));


            // Bacteria movement
            bacteria.forEach(b => {
                b.moveCooldown -= deltaTime;
                if (b.moveCooldown <=0) {
                    b.vx = (Math.random() - 0.5) * 1; // New direction
                    b.vy = (Math.random() - 0.5) * 1;
                    b.moveCooldown = Math.random() * 2 + 1; // Move every 1-3 seconds
                }

                const nextBacteriaX = b.x + b.vx;
                const nextBacteriaY = b.y + b.vy;
                if (!isWall(nextBacteriaX + b.width / 2, nextBacteriaY + b.height / 2, true)) {
                    b.x = nextBacteriaX;
                    b.y = nextBacteriaY;
                } else { // Hit wall, reverse direction slightly randomized
                    b.vx = -b.vx * (Math.random()*0.5 + 0.5) ;
                    b.vy = -b.vy * (Math.random()*0.5 + 0.5) ;
                }
                // Clamp bacteria to canvas as a safety
                b.x = Math.max(0, Math.min(CANVAS_WIDTH - b.width, b.x));
                b.y = Math.max(0, Math.min(CANVAS_HEIGHT - b.height, b.y));
            });


            // Zapping bacteria
            if (keysPressed[' '] || keysPressed['Spacebar']) {
                let bacteriaZappedThisFrame = false;
                const zapEffectiveRadius = ZAP_BASE_RADIUS + currentTool.zapRadiusBonus;
                bacteria = bacteria.filter(b => {
                    const distX = (player.x + player.width / 2) - (b.x + b.width / 2);
                    const distY = (player.y + player.height / 2) - (b.y + b.height / 2);
                    const distance = Math.sqrt(distX * distX + distY * distY);
                    if (distance < zapEffectiveRadius + b.width / 2) {
                        score += 10;
                        bacteriaZappedThisFrame = true;
                        return false; // Remove bacteria
                    }
                    return true; // Keep bacteria
                });
                if (bacteriaZappedThisFrame) {
                    playSound('zap');
                }
                keysPressed[' '] = false; 
                keysPressed['Spacebar'] = false;
            }

            // Check win/lose conditions
            if (currentComfort <= 0) {
                currentComfort = 0;
                playSound('ouch', 1.0);
                changeGameState('GAMEOVER');
                return;
            }
            if (bacteria.length === 0) {
                changeGameState('FILLING_PHASE');
                return;
            }

        } else if (gameState === 'ACCESS_MINIGAME') {
            // No updates needed here, interaction is click-based handled by event listener
        }
        updateUI();
    }

    function draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        const level = levels[currentLevelIndex];

        // Draw tooth background
        if (images[level.toothBgKey] && images[level.toothBgKey].complete) {
            ctx.drawImage(images[level.toothBgKey], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
            ctx.fillStyle = '#DDD'; // Fallback
            ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
        }

        // Draw inflammation
        if (gameState !== 'LEVEL_COMPLETE' && gameState !== 'GAME_WON' && images[level.pulpInflamedKey] && images[level.pulpInflamedKey].complete) {
             const inflammationAlpha = Math.max(0, 1 - (currentComfort / MAX_COMFORT) * 0.8); // More inflamed as comfort drops
             ctx.globalAlpha = Math.min(0.8, inflammationAlpha + 0.2); // Ensure some inflammation is always visible during play
             if (gameState === 'ACCESS_MINIGAME') ctx.globalAlpha = 0.6; // Consistent for access phase
             ctx.drawImage(images[level.pulpInflamedKey], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
             ctx.globalAlpha = 1;
        }
        
        // Draw Gutta Percha if level complete
        if ((gameState === 'LEVEL_COMPLETE' || gameState === 'GAME_WON' && currentLevelIndex === levels.length -1 ) && images[level.guttaPerchaKey] && images[level.guttaPerchaKey].complete) {
             ctx.drawImage(images[level.guttaPerchaKey], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }


        if (gameState === 'ACCESS_MINIGAME') {
            accessTargets.forEach(target => {
                if (!target.hit) {
                    if (images.access_target && images.access_target.complete) {
                         ctx.drawImage(images.access_target, target.x - target.radius, target.y - target.radius, target.radius * 2, target.radius * 2);
                    } else { // Fallback drawing
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                        ctx.beginPath();
                        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = 'red';
                        ctx.stroke();
                    }
                }
            });
             // Draw player tool even in access minigame, but non-interactive
            ctx.drawImage(images[currentTool.imageKey], player.x, player.y, player.width, player.height);

        } else if (gameState === 'PLAYING') {
            // Draw bacteria
            bacteria.forEach(b => {
                if (images[b.type] && images[b.type].complete) {
                    ctx.drawImage(images[b.type], b.x, b.y, b.width, b.height);
                }
            });

            // Draw player
            if (images[currentTool.imageKey] && images[currentTool.imageKey].complete) {
                 ctx.drawImage(images[currentTool.imageKey], player.x, player.y, player.width, player.height);
            }
             // Draw Zap Radius for Shaper tool as feedback (optional)
            if (currentTool === TOOLS.SHAPER && (keysPressed[' '] || keysPressed['Spacebar'])) {
                ctx.beginPath();
                ctx.arc(player.x + player.width / 2, player.y + player.height / 2, ZAP_BASE_RADIUS + currentTool.zapRadiusBonus, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
                ctx.fill();
                ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
                ctx.stroke();
            }
        }
    }

    function gameLoop(timestamp) {
        const deltaTime = (timestamp - lastTime) / 1000; // Time in seconds
        lastTime = timestamp;

        if (gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME') {
             if (gameState === 'PLAYING' && deltaTime > 0 && deltaTime < 1) { // Avoid huge jumps if tab loses focus
                update(deltaTime); // Pass deltaTime to update
             } else if (gameState === 'ACCESS_MINIGAME') {
                // Access minigame update is mostly event-driven (clicks)
                // but we still need to draw
             }
            draw();
        } else {
            // Draw one last time for static screens like GAME_OVER, LEVEL_COMPLETE
            draw();
        }
    }

    // --- UI Updates ---
    function updateUI() {
        scoreDisplay.textContent = score;
        currentLevelText.textContent = currentLevelIndex + 1 > levels.length ? levels.length : currentLevelIndex + 1;
        timeLeftDisplay.textContent = Math.ceil(levelTimer);
        currentToolText.textContent = currentTool.name;

        const comfortPercentage = Math.max(0,(currentComfort / MAX_COMFORT) * 100);
        comfortBar.style.width = `${comfortPercentage}%`;

        if (comfortPercentage > 65) {
            comfortBar.style.backgroundColor = '#4caf50'; // Green
            if(images.happy_tooth_face.complete) comfortFace.src = images.happy_tooth_face.src;
        } else if (comfortPercentage > 25) {
            comfortBar.style.backgroundColor = '#ffeb3b'; // Yellow
            if(images.happy_tooth_face.complete) comfortFace.src = images.happy_tooth_face.src; // Or a neutral face
        } else {
            comfortBar.style.backgroundColor = '#f44336'; // Red
            if(images.sad_tooth_face.complete) comfortFace.src = images.sad_tooth_face.src;
        }
    }

    function showMessage(title, text, buttonText, callback, autoHide = true) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        actionButton.textContent = buttonText;
        actionButton.style.display = buttonText ? 'inline-block' : 'none';
        
        actionButton.onclick = () => {
            if (autoHide) hideMessage();
            if (callback) callback();
        };
        messageOverlay.classList.remove('hidden');
    }

    function hideMessage() {
        messageOverlay.classList.add('hidden');
    }

    // --- Event Listeners ---
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault(); // Prevent page scroll

        if (e.key.toLowerCase() === 't' && (gameState === 'PLAYING' || gameState === 'ACCESS_MINIGAME')) {
            currentTool = (currentTool === TOOLS.FINDER) ? TOOLS.SHAPER : TOOLS.FINDER;
            player.width = currentTool.width;
            player.height = currentTool.height;
            playSound('tool_switch');
            updateUI();
        }
    });
    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    canvas.addEventListener('click', (e) => {
        if (gameState === 'ACCESS_MINIGAME') {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            accessTargets.forEach(target => {
                if (!target.hit) {
                    const distX = clickX - target.x;
                    const distY = clickY - target.y;
                    if (Math.sqrt(distX * distX + distY * distY) < target.radius) {
                        target.hit = true;
                        playSound('drill', 0.5); // Use drill sound for access clicks
                        // Check if all targets hit
                        if (accessTargets.every(t => t.hit)) {
                            changeGameState('PLAYING');
                        }
                    }
                }
            });
        }
    });

    // --- Initialize ---
    countAssets();
    loadAssets();
});
