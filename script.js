document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreDisplay = document.getElementById('score');
    const comfortBar = document.getElementById('comfort-bar');
    const comfortFace = document.getElementById('comfort-face');

    const messageOverlay = document.getElementById('message-overlay');
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    const actionButton = document.getElementById('action-button');

    // Game settings
    const CANVAS_WIDTH = 600;
    const CANVAS_HEIGHT = 450; // Adjust if your tooth_background.png is different aspect ratio
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const PLAYER_SPEED = 4;
    const PLAYER_WIDTH = 15; // Adjust to match endo_file.png aspect
    const PLAYER_HEIGHT = 30;
    const BACTERIA_SIZE = 20;
    const MAX_COMFORT = 100;
    const COMFORT_DAMAGE_WALL = 5;
    const COMFORT_DAMAGE_BACTERIA_MISSED = 2; // Not implemented yet, but good idea
    const BACTERIA_SPAWN_COUNT = 10;
    const ZAP_RADIUS = 30; // Radius for spacebar zap

    let score = 0;
    let currentComfort = MAX_COMFORT;
    let player = { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: 50, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
    let bacteria = [];
    let keysPressed = {};
    let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER, SUCCESS

    // Image assets
    const images = {
        tooth_bg: new Image(),
        pulp_inflamed: new Image(),
        endo_file: new Image(),
        bacteria_1: new Image(),
        bacteria_2: new Image(), // Optional
        gutta_percha_fill: new Image(),
        happy_tooth_face: new Image(),
        sad_tooth_face: new Image()
    };

    let imagesLoaded = 0;
    const totalImages = Object.keys(images).length;

    function loadImage(key, src) {
        images[key].src = src;
        images[key].onload = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                console.log("All images loaded.");
                showMessage("Welcome!", "Click 'Start Game' to begin cleaning canals.", "Start Game", () => {
                    changeGameState('ACCESS_PHASE'); // Change to a new state before starting
                });
            }
        };
        images[key].onerror = () => console.error(`Failed to load image: ${src}`);
    }

    function loadAllImages() {
        loadImage('tooth_bg', 'tooth_background.png');
        loadImage('pulp_inflamed', 'pulp_inflamed.png');
        loadImage('endo_file', 'endo_file.png');
        loadImage('bacteria_1', 'bacteria_1.png');
        loadImage('bacteria_2', 'bacteria_2.png'); // Make sure you have this or remove
        loadImage('gutta_percha_fill', 'gutta_percha_fill.png');
        loadImage('happy_tooth_face', 'happy_tooth_face.png');
        loadImage('sad_tooth_face', 'sad_tooth_face.png');
        // Set comfort face images directly as they are also used in HTML
        comfortFace.src = images.happy_tooth_face.src;
    }

    // Define canal boundaries (these are example values, adjust to your tooth_background.png)
    // This is a simplified rectangular playable area. For complex canals, this would be more involved.
    const canalArea = {
        x: CANVAS_WIDTH * 0.3,  // Starts 30% from the left
        y: CANVAS_HEIGHT * 0.2,  // Starts 20% from the top
        width: CANVAS_WIDTH * 0.4, // 40% of canvas width
        height: CANVAS_HEIGHT * 0.7 // 70% of canvas height
    };

    function spawnBacteria() {
        bacteria = [];
        for (let i = 0; i < BACTERIA_SPAWN_COUNT; i++) {
            bacteria.push({
                x: canalArea.x + Math.random() * (canalArea.width - BACTERIA_SIZE),
                y: canalArea.y + Math.random() * (canalArea.height - BACTERIA_SIZE),
                width: BACTERIA_SIZE,
                height: BACTERIA_SIZE,
                type: Math.random() > 0.5 ? 'bacteria_1' : 'bacteria_2'
            });
        }
    }
    
    function resetGame() {
        score = 0;
        currentComfort = MAX_COMFORT;
        player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
        player.y = canalArea.y + 10; // Start near top of canal area
        keysPressed = {};
        updateUI();
    }

    function changeGameState(newState) {
        gameState = newState;
        console.log("Game state changed to: " + gameState);
        
        if (gameState === 'ACCESS_PHASE') {
            hideMessage();
            resetGame();
            spawnBacteria(); // Spawn bacteria for the new level
            // Simulate "drilling access" - for now, just a brief pause or visual
            showMessage("Drilling Access...", "Click to prepare the tooth.", "Prepare Tooth", () => {
                // Player can't move yet, just show the inflamed tooth
                changeGameState('PLAYING');
                hideMessage();
                gameLoop();
            }, false); // false means button won't auto-start game loop
             draw(); // Draw initial state
        } else if (gameState === 'PLAYING') {
             // gameLoop is typically started by the button action from ACCESS_PHASE
        } else if (gameState === 'SUCCESS') {
            showMessage("Success!", `You saved the tooth! Score: ${score}`, "Next Patient", () => {
                 changeGameState('ACCESS_PHASE'); // Restart the cycle
            });
        } else if (gameState === 'GAMEOVER') {
            showMessage("Game Over!", `Patient comfort too low! Final Score: ${score}`, "Try Again", () => {
                 changeGameState('ACCESS_PHASE'); // Restart the cycle
            });
        }
    }

    function updateUI() {
        scoreDisplay.textContent = score;
        const comfortPercentage = (currentComfort / MAX_COMFORT) * 100;
        comfortBar.style.width = `${comfortPercentage}%`;

        if (comfortPercentage > 70) {
            comfortBar.style.backgroundColor = '#4caf50'; // Green
            comfortFace.src = images.happy_tooth_face.src;
        } else if (comfortPercentage > 30) {
            comfortBar.style.backgroundColor = '#ffeb3b'; // Yellow
            comfortFace.src = images.happy_tooth_face.src; // Or a neutral face
        } else {
            comfortBar.style.backgroundColor = '#f44336'; // Red
            comfortFace.src = images.sad_tooth_face.src;
        }
    }

    function draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw background
        ctx.drawImage(images.tooth_bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (gameState === 'PLAYING' || gameState === 'ACCESS_PHASE' || gameState === 'GAMEOVER') {
            // Draw inflammation if game is active or just ended due to low comfort
            if (currentComfort < MAX_COMFORT * 0.8 || gameState === 'ACCESS_PHASE') { // Show some inflammation
                 ctx.globalAlpha = Math.max(0, 1 - (currentComfort / MAX_COMFORT)); // More inflamed as comfort drops
                 if (gameState === 'ACCESS_PHASE') ctx.globalAlpha = 0.7; // Consistently inflamed look for access
                 ctx.drawImage(images.pulp_inflamed, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                 ctx.globalAlpha = 1;
            }
        }
        
        if (gameState === 'SUCCESS') {
             ctx.drawImage(images.gutta_percha_fill, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }


        if (gameState === 'PLAYING') {
            // Draw bacteria
            bacteria.forEach(b => {
                ctx.drawImage(images[b.type], b.x, b.y, b.width, b.height);
            });

            // Draw player
            ctx.drawImage(images.endo_file, player.x, player.y, player.width, player.height);
        }
         // For debugging canalArea:
        // ctx.strokeStyle = 'blue';
        // ctx.strokeRect(canalArea.x, canalArea.y, canalArea.width, canalArea.height);
    }

    function update() {
        if (gameState !== 'PLAYING') return;

        // Player movement
        let moved = false;
        const prevX = player.x;
        const prevY = player.y;

        if (keysPressed['ArrowUp'] || keysPressed['w']) {
            player.y -= PLAYER_SPEED;
            moved = true;
        }
        if (keysPressed['ArrowDown'] || keysPressed['s']) {
            player.y += PLAYER_SPEED;
            moved = true;
        }
        if (keysPressed['ArrowLeft'] || keysPressed['a']) {
            player.x -= PLAYER_SPEED;
            moved = true;
        }
        if (keysPressed['ArrowRight'] || keysPressed['d']) {
            player.x += PLAYER_SPEED;
            moved = true;
        }

        // Boundary collision (with canalArea)
        let hitWall = false;
        if (player.x < canalArea.x) {
            player.x = canalArea.x;
            hitWall = true;
        }
        if (player.x + player.width > canalArea.x + canalArea.width) {
            player.x = canalArea.x + canalArea.width - player.width;
            hitWall = true;
        }
        if (player.y < canalArea.y) {
            player.y = canalArea.y;
            hitWall = true;
        }
        if (player.y + player.height > canalArea.y + canalArea.height) {
            player.y = canalArea.y + canalArea.height - player.height;
            hitWall = true;
        }
        
        if (hitWall && moved) { // Only penalize if movement caused the collision
            currentComfort -= COMFORT_DAMAGE_WALL;
            if (currentComfort < 0) currentComfort = 0;
        }


        // Bacteria collision / zapping (using spacebar)
        if (keysPressed[' '] || keysPressed['Spacebar']) { // Spacebar zaps
            let bacteriaZappedThisFrame = false;
            bacteria = bacteria.filter(b => {
                const distX = (player.x + player.width / 2) - (b.x + b.width / 2);
                const distY = (player.y + player.height / 2) - (b.y + b.height / 2);
                const distance = Math.sqrt(distX * distX + distY * distY);
                if (distance < ZAP_RADIUS + b.width / 2) { // Simple circular zap area
                    score += 10;
                    bacteriaZappedThisFrame = true;
                    return false; // Remove bacteria
                }
                return true; // Keep bacteria
            });
            if(bacteriaZappedThisFrame){
                // Add a small visual cue for zap if desired
            }
            keysPressed[' '] = false; // Consume spacebar press
            keysPressed['Spacebar'] = false;
        }


        updateUI();

        // Check win/lose conditions
        if (currentComfort <= 0) {
            changeGameState('GAMEOVER');
            return;
        }
        if (bacteria.length === 0 && gameState === 'PLAYING') {
            // All bacteria cleared, now filling phase
            // Simplified: just show success message
            changeGameState('SUCCESS');
            return;
        }
    }

    function gameLoop() {
        if (gameState === 'PLAYING') {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        } else {
            // If not PLAYING, draw one last time to show final state (e.g., GAMEOVER screen or SUCCESS with gutta percha)
            draw();
        }
    }

    function showMessage(title, text, buttonText, callback, autoStartLoop = true) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        actionButton.textContent = buttonText;
        
        actionButton.onclick = () => {
            if (callback) callback();
            // Only hide message and start loop if autoStartLoop is true and we are moving to PLAYING
            // Or if the specific callback handles the state change (like in loadAllImages)
            if (autoStartLoop && (gameState === 'PLAYING' || gameState === 'ACCESS_PHASE' && buttonText !== "Prepare Tooth")) { // ACCESS_PHASE needs two clicks
                hideMessage();
                if (gameState === 'PLAYING') gameLoop(); // Ensure loop starts if we transition to playing
            } else if (!autoStartLoop && gameState !== 'PLAYING'){
                // if it's not auto starting, and we're not playing, we just hide the message
                // this is for multi-step messages like "Drilling Access"
            } else {
                 hideMessage(); // For cases like initial start
            }
        };
        messageOverlay.classList.remove('hidden');
    }

    function hideMessage() {
        messageOverlay.classList.add('hidden');
    }

    // Event Listeners
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;
        // Prevent spacebar from scrolling the page
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    // Start loading images
    loadAllImages();
});
