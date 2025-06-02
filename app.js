// app.js

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5); // Explicitly set camera position

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x000000); // Set background to black explicitly (was default)
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Good ambient light
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Stronger directional
directionalLight.position.set(5, 10, 7.5).normalize(); // Normalize for consistent lighting
scene.add(directionalLight);

// --- Controls ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// controls.autoRotate = true;

// --- Face Data (ensure this is defined before use in material creation) ---
const faceData = [
    { lines: ["Element Name:", "Tungsten", "Element Symbol:", "W"] }, // Face 1
    { lines: ["Atomic Number:", "74", "Avg. Atomic Mass:", "183.84"] }, // Face 2
    { lines: ["Electronegativity:", "2.36", "1st Ionization:", "758.76 kJ/mol"] }, // Face 3
    { lines: ["Bond w/ H:", "Info Missing", "Bond w/ O:", "Info Missing"] }, // Face 4
    { lines: ["Compounds w/ O:", "WO₂", " ", "WO₃", "Name (WO₃):", "Tungsten(VI) oxide"] }, // Face 5
    { lines: ["Protons:", "74", "Neutrons (common):", "110", "Electrons:", "74"] }, // Face 6
    { lines: ["Discovered:", "1783", "By Whom:", "F. & J.J. de Elhuyar"] }, // Face 7
    { lines: ["Group:", "6", "Period:", "6", "Block:", "d"] }, // Face 8
    { lines: ["Balanced Reaction:", "Info Missing", "Rxn Classification:", "Info Missing"] }, // Face 9
    { lines: ["Grams for 15g Prod:", "See Extra Info"] }, // Face 10
    { lines: ["Specific Heat:", "0.13 J g⁻¹ K⁻¹", "Energy to Heat:", "See Extra Info"] }, // Face 11
    { lines: ["Moles in atoms:", "See Extra Info"] }, // Face 12
    { lines: ["Common Charges:", "See Extra Info"] }, // Face 13
    { lines: ["Boiling Pt (°C):", "5555", "Melting Pt (°C):", "3422", "Density (g/cm³):", "19.3"] }, // Face 14
    { lines: ["Classification:", "metal"] }, // Face 15
    { lines: ["State (Room Temp):", "solid", "Color/Appearance:", "silvery-white, lustrous"] }, // Face 16
    { lines: ["Electron Config:", "See Extra Info"] }, // Face 17
    { lines: ["Common Isotopes:", "See Extra Info"] }, // Face 18
    { lines: ["Uses:", "- Light filaments", "- Halogen lamps", "- High speed steel", "Human Body:", "In some enzymes"] }, // Face 19
    { lines: ["Health/Safety:", "Low toxicity", "Handling/Storage:", "Info Missing"] } // Face 20
];

// --- Helper Function to Create Text Texture ---
function createTextTexture(textLines, faceIndex, width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Face background color - you can customize this
    ctx.fillStyle = 'rgb(210, 210, 230)'; // Light greyish-blue, opaque
    ctx.fillRect(0, 0, width, height);

    // Optional: Draw a subtle triangle guide if needed for positioning text
    // ctx.beginPath();
    // ctx.moveTo(width / 2, 10);
    // ctx.lineTo(10, height - 10);
    // ctx.lineTo(width - 10, height - 10);
    // ctx.closePath();
    // ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    // ctx.stroke();

    // Text properties
    ctx.fillStyle = 'black';
    ctx.font = 'bold 15px Arial'; // Slightly smaller font for potentially more text
    let yPos = 25; // Start y-position for text
    const lineHeight = 18; // Line height
    const xPadding = 12; // Padding from canvas edges
    const availableWidth = width - (2 * xPadding);

    textLines.forEach(line => {
        if (yPos > height - lineHeight) return; // Stop if no more space

        // Basic word wrapping
        let words = line.split(' ');
        let currentLine = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = currentLine + words[n] + ' ';
            if (ctx.measureText(testLine).width > availableWidth && currentLine !== '') {
                ctx.fillText(currentLine.trim(), xPadding, yPos);
                currentLine = words[n] + ' ';
                yPos += lineHeight;
                if (yPos > height - lineHeight) return; // Stop if no more space after wrap
            } else {
                currentLine = testLine;
            }
        }
        ctx.fillText(currentLine.trim(), xPadding, yPos);
        yPos += lineHeight;
    });

    // // DEBUG: Add face index to texture
    // ctx.fillStyle = 'rgba(255,0,0,0.5)';
    // ctx.font = 'bold 30px Arial';
    // ctx.fillText((faceIndex + 1).toString(), width - 40, 40);


    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // Important for canvas textures
    return texture;
}

// --- Icosahedron Geometry ---
const geometry = new THREE.IcosahedronGeometry(2, 0); // Radius 2, detail 0

// --- Create Materials for Each Face ---
const materials = [];
for (let i = 0; i < 20; i++) {
    const dataForFace = faceData[i] || { lines: [`Face ${i + 1}`, "Data Missing"] }; // Fallback
    const texture = createTextTexture(dataForFace.lines, i); // Pass face index for potential debugging
    materials.push(new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8, // Adjust for desired shininess
        metalness: 0.2, // Adjust for desired metallic look
        // side: THREE.DoubleSide // Uncomment for debugging if faces seem inside out
    }));
}

// --- Create the Mesh ---
const icosahedron = new THREE.Mesh(geometry, materials); // Apply the array of materials
icosahedron.position.set(0,0,0); // Ensure it's at the origin
scene.add(icosahedron);

// --- Event Listener for the Extra Info Button ---
document.getElementById('extraInfoButton').addEventListener('click', () => {
    window.location.href = 'extra_info.html';
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
