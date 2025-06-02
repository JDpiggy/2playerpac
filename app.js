// app.js

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5); // Explicitly set camera position

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting (even MeshBasicMaterial doesn't need it, but good to keep for next steps) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased ambient a bit
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Increased directional
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Controls ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// controls.autoRotate = true; // You can uncomment this for automatic rotation test

// --- Icosahedron Geometry ---
const geometry = new THREE.IcosahedronGeometry(2, 0); // Radius 2, detail 0

// --- DEBUGGING MATERIAL: Simple Green Wireframe ---
const debugMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Bright green
    wireframe: true
});

const icosahedron = new THREE.Mesh(geometry, debugMaterial); // Use the single debug material
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

// --- Face Data (not used in this debug step, but keep for later) ---
const faceData = [
    { lines: ["Element Name:", "Tungsten", "Element Symbol:", "W"] },
    { lines: ["Atomic Number:", "74", "Avg. Atomic Mass:", "183.84"] },
    { lines: ["Electronegativity:", "2.36", "1st Ionization:", "758.76 kJ/mol"] },
    { lines: ["Bond w/ H:", "Info Missing", "Bond w/ O:", "Info Missing"] },
    { lines: ["Compounds w/ O:", "WO₂", " ", "WO₃", "Name (WO₃):", "Tungsten(VI) oxide"] },
    { lines: ["Protons:", "74", "Neutrons (common):", "110", "Electrons:", "74"] },
    { lines: ["Discovered:", "1783", "By Whom:", "F. & J.J. de Elhuyar"] },
    { lines: ["Group:", "6", "Period:", "6", "Block:", "d"] },
    { lines: ["Balanced Reaction:", "Info Missing", "Rxn Classification:", "Info Missing"] },
    { lines: ["Grams for 15g Prod:", "See Extra Info"] },
    { lines: ["Specific Heat:", "0.13 J g⁻¹ K⁻¹", "Energy to Heat:", "See Extra Info"] },
    { lines: ["Moles in atoms:", "See Extra Info"] },
    { lines: ["Common Charges:", "See Extra Info"] },
    { lines: ["Boiling Pt (°C):", "5555", "Melting Pt (°C):", "3422", "Density (g/cm³):", "19.3"] },
    { lines: ["Classification:", "metal"] },
    { lines: ["State (Room Temp):", "solid", "Color/Appearance:", "silvery-white, lustrous"] },
    { lines: ["Electron Config:", "See Extra Info"] },
    { lines: ["Common Isotopes:", "See Extra Info"] },
    { lines: ["Uses:", "- Light filaments", "- Halogen lamps", "- High speed steel", "Human Body:", "In some enzymes"] },
    { lines: ["Health/Safety:", "Low toxicity", "Handling/Storage:", "Info Missing"] }
];

// --- Helper Function to Create Text Texture (not used in this debug step, but keep for later) ---
function createTextTexture(textLines, width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Using a SOLID, OPAQUE background for texture debugging first
    ctx.fillStyle = 'rgb(200, 200, 255)'; // Solid Light blueish background
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    let yPos = 30;
    const lineHeight = 20;
    const xPadding = 15;
    const availableWidth = width - (2 * xPadding);

    textLines.forEach(line => {
        if (ctx.measureText(line).width > availableWidth && line.includes(" ")) { // Check if line needs wrapping AND has spaces
            let words = line.split(' ');
            let currentLine = '';
            for (let n = 0; n < words.length; n++) {
                let testLine = currentLine + words[n] + ' ';
                if (ctx.measureText(testLine).width > availableWidth && currentLine !== '') {
                    ctx.fillText(currentLine.trim(), xPadding, yPos);
                    currentLine = words[n] + ' ';
                    yPos += lineHeight;
                } else {
                    currentLine = testLine;
                }
            }
            ctx.fillText(currentLine.trim(), xPadding, yPos);
        } else { // Line fits or is a single long word
            ctx.fillText(line, xPadding, yPos);
        }
        yPos += lineHeight;
        if (yPos > height - lineHeight/2) { // Basic check to stop if overflowing too much
            // Could add '...' or simply break if too much text for the face
            // For now, just let it clip if it overflows badly
            return; // Stop processing more lines for this face if it's too full
        }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}
