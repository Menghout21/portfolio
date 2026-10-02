
// Initialize Lucide Icons
lucide.createIcons();

// Mobile Menu Toggle
const mobileBtn = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
mobileBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

function closeMenu() {
    mobileMenu.classList.add('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    toastMsg.textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
    }, 2500);
}

function copyToClipboard(text, successMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
    document.execCommand('copy');
    showToast(successMsg);
    } catch (err) {
    showToast('Unable to copy');
    }
    document.body.removeChild(textarea);
}

function handleFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    showToast(`Thank you ${name}! Message sent.`);
    e.target.reset();
}

let scene, camera, renderer, particlesMesh, linesMesh;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function initThreeScene() {
    const container = document.getElementById('three-bg');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 240;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create Particle Constellation
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 350;
    positions[i + 1] = (Math.random() - 0.5) * 350;
    positions[i + 2] = (Math.random() - 0.5) * 200;

    velocities.push({
        x: (Math.random() - 0.5) * 0.35,
        y: (Math.random() - 0.5) * 0.35,
        z: (Math.random() - 0.5) * 0.2
    });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Points Material
    const pMaterial = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 3.5,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(geometry, pMaterial);
    scene.add(particlesMesh);

    // Interactive Lines linking nearby nodes
    const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending
    });

    const lineGeo = new THREE.BufferGeometry();
    linesMesh = new THREE.LineSegments(lineGeo, lineMaterial);
    scene.add(linesMesh);

    // Window resize listener
    window.addEventListener('resize', onWindowResize, false);

    // Track mouse position
    window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    animateThree(velocities, particleCount);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateThree(velocities, count) {
    requestAnimationFrame(() => animateThree(velocities, count));

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    if (particlesMesh) {
    const pos = particlesMesh.geometry.attributes.position.array;
    const linePositions = [];

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        pos[idx] += velocities[i].x;
        pos[idx + 1] += velocities[i].y;
        pos[idx + 2] += velocities[i].z;

        // Boundary bouncing
        if (pos[idx] < -180 || pos[idx] > 180) velocities[i].x = -velocities[i].x;
        if (pos[idx + 1] < -180 || pos[idx + 1] > 180) velocities[i].y = -velocities[i].y;
        if (pos[idx + 2] < -120 || pos[idx + 2] > 120) velocities[i].z = -velocities[i].z;

        // Calculate node proximity for lines
        for (let j = i + 1; j < count; j++) {
        const jdx = j * 3;
        const dx = pos[idx] - pos[jdx];
        const dy = pos[idx + 1] - pos[jdx + 1];
        const dz = pos[idx + 2] - pos[jdx + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 45) {
            linePositions.push(pos[idx], pos[idx + 1], pos[idx + 2]);
            linePositions.push(pos[jdx], pos[jdx + 1], pos[jdx + 2]);
        }
        }
    }

    particlesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    // Subtle overall scene tilt
    scene.rotation.y = targetX * 0.01 + performance.now() * 0.0001;
    scene.rotation.x = targetY * 0.01;
    }

    renderer.render(scene, camera);
}

const canvas = document.getElementById('cursor-canvas');
const ctx = canvas.getContext('2d');
let points = [];

function resizeCursorCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCursorCanvas);
resizeCursorCanvas();

window.addEventListener('mousemove', (e) => {
    points.push({
    x: e.clientX,
    y: e.clientY,
    size: 7,
    alpha: 0.8
    });
    if (points.length > 25) points.shift();
});

function drawCursorTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    pt.alpha *= 0.92;
    pt.size *= 0.95;

    ctx.save();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(pt.size, 1), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${pt.alpha})`;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
    }

    points = points.filter(p => p.alpha > 0.05);
    requestAnimationFrame(drawCursorTrail);
}
drawCursorTrail();

const heroCard = document.getElementById('hero-card');
if (heroCard) {
    heroCard.addEventListener('mousemove', (e) => {
    const rect = heroCard.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 10;
    const rotateY = (x / (rect.width / 2)) * 10;
    heroCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    heroCard.addEventListener('mouseleave', () => {
    heroCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
}

// Apply interactive hover tilts to all tech cards
document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / (rect.height / 2)) * 8;
    const rotateY = (x / (rect.width / 2)) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
});

window.onload = function () {
    initThreeScene();
};
