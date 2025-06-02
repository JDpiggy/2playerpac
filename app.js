// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Controls ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// --- Data for Faces (abbreviated for example) ---
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
    { lines: ["Grams for 15g Prod:", "See Extra Info"] }, // Face 10 (Updated)
    { lines: ["Specific Heat:", "0.13 J g⁻¹ K⁻¹", "Energy to Heat:", "See Extra Info"] }, // Face 11 (Updated)
    { lines: ["Moles in atoms:", "See Extra Info"] }, // Face 12 (Updated)
    { lines: ["Common Charges:", "See Extra Info"] }, // Face 13 (Updated)
    { lines: ["Boiling Pt (°C):", "5555", "Melting Pt (°C):", "3422", "Density (g/cm³):", "19.3"] }, // Face 14
    { lines: ["Classification:", "metal"] }, // Face 15
    { lines: ["State (Room Temp):", "solid", "Color/Appearance:", "silvery-white, lustrous"] }, // Face 16
    { lines: ["Electron Config:", "See Extra Info"] }, // Face 17 (Updated)
    { lines: ["Common Isotopes:", "See Extra Info"] }, // Face 18 (Updated)
    { lines: ["Uses:", "- Light filaments", "- Halogen lamps", "- High speed steel", "Human Body:", "In some enzymes"] }, // Face 19
    { lines: ["Health/Safety:", "Low toxicity", "Handling/Storage:", "Info Missing"] } // Face 20
];


// --- Helper Function to Create Text Texture ---
function createTextTexture(textLines, width = 256, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(200, 200, 255, 0.9)';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    let yPos = 30;
    const lineHeight = 20;
    const xPadding = 15;
    const availableWidth = width - (2 * xPadding);

    textLines.forEach(line => {
        // Simple text wrapping
        if (ctx.measureText(line).width > availableWidth) {
            let words = line.split(' ');
            let currentLine = '';
            for (let i = 0; i < words.length; i++) {
                let testLine = currentLine + words[i] + ' ';
                if (ctx.measureText(testLine).width > availableWidth && i > 0) {
                    ctx.fillText(currentLine.trim(), xPadding, yPos);
                    currentLine = words[i] + ' ';
                    yPos += lineHeight;
                } else {
                    currentLine = testLine;
                }
            }
            ctx.fillText(currentLine.trim(), xPadding, yPos);
        } else {
            ctx.fillText(line, xPadding, yPos);
        }
        yPos += lineHeight;
        if (yPos > height - 20) { // Prevent text from overflowing canvas
             // Potentially add "..." or stop adding lines
        }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// --- Create Materials for Each Face ---
const materials = [];
for (let i = 0; i < 20; i++) {
    const dataForFace = faceData[i] || { lines: [`Face ${i + 1}`, "Data TBD"] };
    const texture = createTextTexture(dataForFace.lines);
    materials.push(new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.1,
    }));
}

// --- Icosahedron ---
const geometry = new THREE.IcosahedronGeometry(2, 0);
const icosahedron = new THREE.Mesh(geometry, materials);
scene.add(icosahedron);

// --- Event Listener for the Extra Info Button ---
document.getElementById('extraInfoButton').addEventListener('click', () => {
    window.location.href = 'extra_info.html'; // Or window.open('extra_info.html', '_blank'); for a new tab
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
