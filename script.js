const cubeElement = document.getElementById('cube');
const shuffleBtn = document.getElementById('shuffleBtn');
const resetBtn = document.getElementById('resetBtn');

let cubilets = [];
const size = 3;
const offset = (size - 1) / 2;
const cubiletSize = 60 + 2; // size + gap

// Cube state
let cubeRotation = { x: -30, y: 45 };

// Initialize Cube
function initCube() {
    cubeElement.innerHTML = '';
    cubilets = [];

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            for (let z = 0; z < size; z++) {
                createCubilet(x, y, z);
            }
        }
    }
}

function createCubilet(x, y, z) {
    const el = document.createElement('div');
    el.className = 'cubilet';
    
    // Position
    const posX = (x - offset) * cubiletSize;
    const posY = (y - offset) * cubiletSize;
    const posZ = (z - offset) * cubiletSize;
    
    el.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px)`;
    el.dataset.x = x;
    el.dataset.y = y;
    el.dataset.z = z;

    // Faces
    const faces = ['up', 'down', 'left', 'right', 'front', 'back'];
    faces.forEach(face => {
        const faceEl = document.createElement('div');
        faceEl.className = `face ${face}`;
        
        // Hide internal faces
        let isInternal = false;
        if (face === 'up' && y > 0) isInternal = true;
        if (face === 'down' && y < size - 1) isInternal = true;
        if (face === 'left' && x > 0) isInternal = true;
        if (face === 'right' && x < size - 1) isInternal = true;
        if (face === 'front' && z > 0) isInternal = true;
        if (face === 'back' && z < size - 1) isInternal = true;
        
        if (isInternal) faceEl.classList.add('internal');
        
        el.appendChild(faceEl);
    });

    cubeElement.appendChild(el);
    cubilets.push({
        element: el,
        x: x,
        y: y,
        z: z,
        matrix: new DOMMatrix()
    });
}

// Global Rotation (Drag)
let isDragging = false;
let lastMousePos = { x: 0, y: 0 };

document.addEventListener('mousedown', (e) => {
    if (e.target.closest('.controls') || e.target.closest('button')) return;
    isDragging = true;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    cubeRotation.y += deltaX * 0.5;
    cubeRotation.x -= deltaY * 0.5;
    
    cubeElement.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`;
    lastMousePos = { x: e.clientX, y: e.clientY };
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Layer Rotation Logic
function rotateLayer(face) {
    let axis, layerIndex, angle;
    
    switch(face) {
        case 'U': axis = 'y'; layerIndex = 0; angle = -90; break;
        case 'D': axis = 'y'; layerIndex = 2; angle = 90; break;
        case 'L': axis = 'x'; layerIndex = 0; angle = 90; break;
        case 'R': axis = 'x'; layerIndex = 2; angle = -90; break;
        case 'F': axis = 'z'; layerIndex = 2; angle = -90; break;
        case 'B': axis = 'z'; layerIndex = 0; angle = 90; break;
    }
    
    performRotation(axis, layerIndex, angle);
}

function performRotation(axis, layerIndex, angle) {
    const layer = cubilets.filter(c => Math.round(c[axis]) === layerIndex);
    
    layer.forEach(cubilet => {
        // Calculate new positions and orientation
        const m = new DOMMatrix();
        if (axis === 'x') m.rotateSelf(angle, 0, 0);
        if (axis === 'y') m.rotateSelf(0, angle, 0);
        if (axis === 'z') m.rotateSelf(0, 0, angle);
        
        // Update logical positions
        const oldX = cubilet.x - offset;
        const oldY = cubilet.y - offset;
        const oldZ = cubilet.z - offset;
        
        let newX, newY, newZ;
        
        if (axis === 'x') {
            const rad = angle * Math.PI / 180;
            newX = oldX;
            newY = oldY * Math.cos(rad) - oldZ * Math.sin(rad);
            newZ = oldY * Math.sin(rad) + oldZ * Math.cos(rad);
        } else if (axis === 'y') {
            const rad = angle * Math.PI / 180;
            newX = oldX * Math.cos(rad) + oldZ * Math.sin(rad);
            newY = oldY;
            newZ = -oldX * Math.sin(rad) + oldZ * Math.cos(rad);
        } else if (axis === 'z') {
            const rad = angle * Math.PI / 180;
            newX = oldX * Math.cos(rad) - oldY * Math.sin(rad);
            newY = oldX * Math.sin(rad) + oldY * Math.cos(rad);
            newZ = oldZ;
        }
        
        cubilet.x = newX + offset;
        cubilet.y = newY + offset;
        cubilet.z = newZ + offset;
        
        // Update visual rotation
        cubilet.matrix = m.multiply(cubilet.matrix);
        
        const posX = (newX) * cubiletSize;
        const posY = (newY) * cubiletSize;
        const posZ = (newZ) * cubiletSize;
        
        cubilet.element.style.transform = `translate3d(${posX}px, ${posY}px, ${posZ}px) ${cubilet.matrix.toString()}`;
    });
}

// Shuffle
shuffleBtn.addEventListener('click', () => {
    const moves = ['U', 'D', 'L', 'R', 'F', 'B'];
    let count = 0;
    const interval = setInterval(() => {
        const move = moves[Math.floor(Math.random() * moves.length)];
        rotateLayer(move);
        count++;
        if (count >= 20) clearInterval(interval);
    }, 100);
});

// Reset
resetBtn.addEventListener('click', () => {
    initCube();
    cubeRotation = { x: -30, y: 45 };
    cubeElement.style.transform = `rotateX(${cubeRotation.x}deg) rotateY(${cubeRotation.y}deg)`;
});

// Start
initCube();
