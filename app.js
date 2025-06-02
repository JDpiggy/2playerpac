// app.js - v16 (Icosahedron, Bottom-Up Text, Red Lines, No Nav)

// --- Configuration & Global Variables ---
let scene, camera, renderer, controls, icosahedron; // Removed nav/rotation specific globals

// --- COMPLETE FACE DATA ARRAY (Ensure this is correct and complete) ---
const faceDataArray = [
    { lines: ["Element Name:", "Tungsten", "Element Symbol:", "W"] }, // Face 1
    { lines: ["Atomic Number:", "74", "Avg. Atomic Mass:", "183.84"] }, // Face 2
    { lines: ["Electronegativity (Pauling):", "2.36", "First Ionization Energy:", "758.76 kJ/mol"] }, // Face 3
    { lines: ["Bond w/ H:", "Info Missing", "Bond w/ O:", "Info Missing"] }, // Face 4
    { lines: ["Compounds w/ O:", "WO₂", " ", "WO₃", "Name (WO₃):", "Tungsten(VI) oxide"] }, // Face 5
    { lines: ["Protons (Neutral Atom):", "74", "Neutrons (Most Common):", "110", "Electrons (Neutral Atom):", "74"] }, // Face 6
    { lines: ["Discovered:", "1783", "By Whom:", "Fausto & Juan Jose de Elhuyar"] }, // Face 7
    { lines: ["Group Number (1-18):", "6", "Period Number:", "6", "Block:", "d"] }, // Face 8
    { lines: ["Balanced Chemical Rxn:", "Data missing from source.", "Reaction Classification:", "Data missing from source."] }, // Face 9
    { lines: ["Grams for 15.00g Product:", "(From Rxn 9)", "Data missing from source."] }, // Face 10
    { lines: ["Specific Heat (Std State):", "0.13 J g⁻¹ K⁻¹", "Energy to Heat 100g by 10°C:", "Data missing from source."] }, // Face 11
    { lines: ["Moles in 9.50 x 10²⁴ atoms:", "Data missing from source."] }, // Face 12
    { lines: ["Most Common Charge(s):", "(Ionic Compound)", "Data missing from source."] }, // Face 13
    { lines: ["Boiling Point (°C):", "5555", "Melting Point (°C):", "3422", "Density (g/cm³):", "19.3"] }, // Face 14
    { lines: ["Classification:", "metal"] }, // Face 15
    { lines: ["Physical State (Room Temp):", "solid", "Color/Appearance:", "silvery-white, lustrous"] }, // Face 16
    { lines: ["Electron Config:", "(Full & Noble Gas)", "Data missing from source."] }, // Face 17
    { lines: ["Common Stable Isotopes:", "(Symbols & Hyphen Notation)", "Data missing from source."] }, // Face 18
    { lines: ["Uses:", "- Filaments (bulbs, tubes)", "- Halogen tungsten lamps", "- High speed steel (up to 18%)", "Importance to Human Body:", "Limited role; in some enzymes."]},
    { lines: ["Health/Safety Issues:", "Considered low toxicity.", "Handling and Storage:", "Data missing from source."] }
];

// --- Initialization Function ---
function init() {
    console.log("init() called - v16");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111); 
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 4.5); // Keep camera position
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 7, 5).normalize(); scene.add(directionalLight);
    
    try {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05;
        // Removed: controls.addEventListener('start', () => { isRotating = false; }); 
    } catch (e) { console.error("Failed to initialize OrbitControls:", e); }

    const icosahedronRadius = 1.5;
    // The warning about toNonIndexed() means IcosahedronGeometry might already be non-indexed.
    // If issues persist, we could try *without* toNonIndexed() and see if UVs still map correctly
    // for detail=0 IcosahedronGeometry when a material array is used.
    // However, toNonIndexed() is generally safer for guaranteeing unique UVs per face vertex.
    let icosahedronGeometry = new THREE.IcosahedronGeometry(icosahedronRadius, 0); 
    icosahedronGeometry = icosahedronGeometry.toNonIndexed(); 
    
    const uvAttribute = icosahedronGeometry.attributes.uv;
     if (!uvAttribute) { 
        console.error("UV attribute is missing! Creating a dummy one.");
        const numVertices = icosahedronGeometry.attributes.position.count;
        const uvs = new Float32Array(numVertices * 2);
        icosahedronGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    const uvTriangle = [ 
        new THREE.Vector2(0.5, 0.85), 
        new THREE.Vector2(0.15, 0.15),
        new THREE.Vector2(0.85, 0.15) 
    ];

    if (uvAttribute) {
        for (let i = 0; i < icosahedronGeometry.attributes.position.count / 3; i++) { 
            uvAttribute.setXY(i * 3 + 0, uvTriangle[0].x, uvTriangle[0].y); 
            uvAttribute.setXY(i * 3 + 1, uvTriangle[1].x, uvTriangle[1].y); 
            uvAttribute.setXY(i * 3 + 2, uvTriangle[2].x, uvTriangle[2].y); 
        }
        uvAttribute.needsUpdate = true; 
    }

    icosahedronGeometry.clearGroups();
    for (let i = 0; i < 20; i++) { 
        icosahedronGeometry.addGroup(i * 3, 3, i); 
    }

    const materials = [];
    for (let i = 0; i < 20; i++) {
        let currentTextLines = [`Face ${i + 1} Error`]; 
        if (faceDataArray && faceDataArray[i] && Array.isArray(faceDataArray[i].lines)) {
            currentTextLines = faceDataArray[i].lines;
        }
        const canvasTexture = createTextCanvasTexture(currentTextLines, i); 
        materials.push(new THREE.MeshStandardMaterial({
            map: canvasTexture,
            roughness: 0.7, metalness: 0.2,
        }));
    }
    icosahedron = new THREE.Mesh(icosahedronGeometry, materials);
    icosahedron.position.set(0, 0, 0); 
    scene.add(icosahedron);

    // Removed: createNavigationUI();

    window.addEventListener('resize', onWindowResize, false);
    const extraInfoButton = document.getElementById('extraInfoButton');
    if (extraInfoButton) extraInfoButton.addEventListener('click', () => { window.location.href = 'extra_info.html'; });
    console.log("init() finished - v16.");
}

// --- Text Texture Creation Function (v16 - Bottom-up fill, Red lines ON, iterative font like v12/v13) ---
function createTextCanvasTexture(textLines, faceIndex, debugLabel = `Face ${faceIndex + 1}`) {
    const canvasWidth = 512; 
    const canvasHeight = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth; canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(210, 220, 255)'; 
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const uvTrianglePoints = [ 
        { x: 0.5, y: 0.85 }, { x: 0.15, y: 0.15 }, { x: 0.85, y: 0.15 } 
    ];

    const topPx =    { x: uvTrianglePoints[0].x * canvasWidth, y: (1 - uvTrianglePoints[0].y) * canvasHeight };
    const blPx =     { x: uvTrianglePoints[1].x * canvasWidth, y: (1 - uvTrianglePoints[1].y) * canvasHeight };
    const brPx =     { x: uvTrianglePoints[2].x * canvasWidth, y: (1 - uvTrianglePoints[2].y) * canvasHeight };

    // --- RE-ENABLED DEBUG: Draw the RED UV triangle on the canvas ---
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'; // Red, semi-transparent
    ctx.lineWidth = 2; 
    ctx.beginPath();
    ctx.moveTo(topPx.x, topPx.y); ctx.lineTo(blPx.x, blPx.y); ctx.lineTo(brPx.x, brPx.y);
    ctx.closePath(); ctx.stroke();
    // --- END DEBUG ---

    const boxMinX = Math.min(topPx.x, blPx.x, brPx.x);
    const boxMaxX = Math.max(topPx.x, blPx.x, brPx.x);
    const boxMinY = Math.min(topPx.y, blPx.y, brPx.y); // Canvas Y: top of triangle
    const boxMaxY = Math.max(topPx.y, blPx.y, brPx.y); // Canvas Y: bottom of triangle base
    let boxWidth = boxMaxX - boxMinX;
    let boxHeight = boxMaxY - boxMinY;

    // --- Optional DEBUG: Draw the BLUE bounding box (uncomment to see it) ---
    // ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)'; ctx.lineWidth = 1;
    // ctx.strokeRect(boxMinX, boxMinY, boxWidth, boxHeight);

    let bestFit = { fontSize: 8, lines: [], width: 0, height: 0, actualDrawnLines: 0 }; 
    const initialFontSizeGuess = 20; // Slightly smaller initial guess
    const minFontSize = 8;
    const lineHeightFactor = 1.2; 
    const targetBoxPaddingFactor = 0.15; // Increased padding to 15% (7.5% each side)
    
    const targetTextWidth = boxWidth * (1 - targetBoxPaddingFactor * 2);
    const targetTextHeight = boxHeight * (1 - targetBoxPaddingFactor * 2);

    for (let currentFontSize = initialFontSizeGuess; currentFontSize >= minFontSize; currentFontSize -= 1) {
        ctx.font = `bold ${currentFontSize}px Arial`;
        let currentLineHeight = Math.round(currentFontSize * lineHeightFactor);
        if (currentLineHeight === 0) currentLineHeight = 1;
        let laidOutLines = []; let currentBlockHeight = 0; let currentBlockMaxWidth = 0;
        let possibleToFitThisFont = true;

        for (const originalLine of textLines) {
            let words = originalLine.split(' '); let lineToDraw = '';
            for (let n = 0; n < words.length; n++) {
                let testLine = lineToDraw + words[n] + ' ';
                if (ctx.measureText(testLine).width > targetTextWidth && n > 0) {
                    laidOutLines.push(lineToDraw.trim()); currentBlockHeight += currentLineHeight;
                    if (ctx.measureText(lineToDraw.trim()).width > currentBlockMaxWidth) currentBlockMaxWidth = ctx.measureText(lineToDraw.trim()).width;
                    lineToDraw = words[n] + ' ';
                } else { lineToDraw = testLine; }
            }
            laidOutLines.push(lineToDraw.trim()); currentBlockHeight += currentLineHeight;
            if (ctx.measureText(lineToDraw.trim()).width > currentBlockMaxWidth) currentBlockMaxWidth = ctx.measureText(lineToDraw.trim()).width;
            if (currentBlockHeight > targetTextHeight) { possibleToFitThisFont = false; break; }
        }
        if (possibleToFitThisFont && currentBlockMaxWidth <= targetTextWidth) {
            bestFit = { fontSize: currentFontSize, lines: laidOutLines, width: currentBlockMaxWidth, height: currentBlockHeight, actualDrawnLines: laidOutLines.length };
            break; 
        }
        if (currentFontSize === minFontSize && !possibleToFitThisFont) {
             bestFit.fontSize = minFontSize; let newLH = Math.round(minFontSize*lineHeightFactor); if(newLH===0)newLH=1;
             let tLines = []; let tHeight = 0; laidOutLines = []; // Reset laidOutLines before re-populating
            ctx.font = `bold ${minFontSize}px Arial`; // Ensure context font is set for measurements
            for (const oLine of textLines) {
                if (tHeight + newLH > targetTextHeight) break; let words = oLine.split(' '); let lToDraw = '';
                for (let n = 0; n < words.length; n++) { let tLine = lToDraw+words[n]+' ';
                    if (ctx.measureText(tLine).width > targetTextWidth && n>0) { // Use targetTextWidth for wrapping
                        if (tHeight + newLH <= targetTextHeight) {tLines.push(lToDraw.trim()); tHeight += newLH;} else {possibleToFitThisFont=false;break;}
                        lToDraw=words[n]+' ';
                    } else {lToDraw=tLine;}
                } if (!possibleToFitThisFont) break;
                if (tHeight + newLH <= targetTextHeight) {tLines.push(lToDraw.trim()); tHeight += newLH;} else break;
            } 
            bestFit.lines = tLines; bestFit.height = tHeight; bestFit.actualDrawnLines = tLines.length; 
            bestFit.width = targetTextWidth; // Max width will be targetTextWidth due to wrapping
            break;
        }
    }
    
    ctx.font = `bold ${bestFit.fontSize}px Arial`;
    let finalLineHeight = Math.round(bestFit.fontSize * lineHeightFactor);
    if (finalLineHeight === 0) finalLineHeight = 1;

    ctx.fillStyle = 'black';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle'; 

    const textBlockActualX = boxMinX + (boxWidth / 2); 
    // Start drawing from the bottom of the padded text area
    const bottomPadding = boxHeight * targetBoxPaddingFactor;
    const textBlockEndY = boxMaxY - bottomPadding; // Bottom-most Y for text (considering padding)
    
    let currentY = textBlockEndY - (finalLineHeight / 2); // Y for the middle of the LAST line

    for (let i = bestFit.actualDrawnLines - 1; i >= 0; i--) { // Draw from last available line upwards
        if (bestFit.lines[i] !== undefined) {
             // Check if this line would go above the padded top area
            if (currentY - (finalLineHeight/2) < boxMinY + bottomPadding ) break; // Stop if it overflows top
            ctx.fillText(bestFit.lines[i], textBlockActualX, currentY);
        }
        currentY -= finalLineHeight; 
    }

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const debugFontSize = 12; ctx.fillStyle = 'rgba(0,0,100,0.4)'; 
    ctx.font = `${debugFontSize}px Arial`; ctx.fillText(debugLabel, 10, debugFontSize + 5); 
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
    return texture;
}

// --- Animation Loop & Resize & Start (No rotation logic) ---
function animate() { 
    requestAnimationFrame(animate); 
    if(controls) controls.update(); 
    if(renderer&&scene&&camera)renderer.render(scene,camera); 
}
function onWindowResize() { if(camera&&renderer){camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);} }
try {init();animate();console.log("App started - v16.");} catch(e){console.error("Startup Error:",e);
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'absolute'; errorDiv.style.top = '10px'; errorDiv.style.left = '10px';
    errorDiv.style.padding = '10px'; errorDiv.style.backgroundColor = 'red'; errorDiv.style.color = 'white';
    errorDiv.style.fontFamily = 'monospace'; errorDiv.style.zIndex = '1000';
    errorDiv.innerText = `FATAL ERROR: ${e.message}\nSee console for details.`;
    document.body.appendChild(errorDiv);
}
