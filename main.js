import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/* ─── Loader ──────────────────────────────────────────── */
const loader = document.getElementById('loader');
const loaderBar = document.getElementById('loader-bar');
const loaderPct = document.getElementById('loader-pct');
let loaderProgress = 0;
const loaderTick = setInterval(() => {
    loaderProgress = Math.min(100, loaderProgress + Math.random() * 12 + 4);
    loaderBar.style.width = loaderProgress + '%';
    loaderPct.textContent = String(Math.floor(loaderProgress)).padStart(2, '0') + '%';
    if (loaderProgress >= 100) {
        clearInterval(loaderTick);
        setTimeout(() => {
            loader.classList.add('hidden');
            startReveal();
        }, 300);
    }
}, 80);

/* ─── Lenis smooth scroll ─────────────────────────────── */
const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);

/* ─── Custom cursor ───────────────────────────────────── */
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursor-dot');
const cursorPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('mousemove', (e) => {
    cursorTarget.x = e.clientX;
    cursorTarget.y = e.clientY;
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
});
function cursorLoop() {
    cursorPos.x += (cursorTarget.x - cursorPos.x) * 0.18;
    cursorPos.y += (cursorTarget.y - cursorPos.y) * 0.18;
    cursor.style.transform = `translate(${cursorPos.x}px, ${cursorPos.y}px) translate(-50%, -50%)`;
    requestAnimationFrame(cursorLoop);
}
cursorLoop();
document.querySelectorAll('a, button, [data-magnet], .feature-img-wrapper').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
});

/* ─── Mouse-follow gradient blob ──────────────────────── */
const blob = document.getElementById('blob');
const blobPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const blobTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('mousemove', (e) => {
    blobTarget.x = e.clientX;
    blobTarget.y = e.clientY;
});
function blobLoop() {
    blobPos.x += (blobTarget.x - blobPos.x) * 0.06;
    blobPos.y += (blobTarget.y - blobPos.y) * 0.06;
    blob.style.transform = `translate3d(${blobPos.x}px, ${blobPos.y}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(blobLoop);
}
blobLoop();

/* ─── Letter scramble on hover ────────────────────────── */
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________ABCDEF';
function scramble(el, duration = 600) {
    const original = el.dataset.text || el.textContent.trim();
    if (!el.dataset.text) el.dataset.text = original;
    let frame = 0;
    const total = Math.max(20, Math.floor(duration / 16));
    const queue = [...original].map((c, i) => ({
        from: c, to: c,
        start: Math.floor(Math.random() * total / 2),
        end: Math.floor(total / 2 + Math.random() * total / 2),
    }));
    if (el._scramble) cancelAnimationFrame(el._scramble);
    function tick() {
        let out = '';
        let done = 0;
        for (const q of queue) {
            if (frame >= q.end) { out += q.to; done++; }
            else if (frame >= q.start) {
                if (!q.char || Math.random() < 0.28) {
                    q.char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                }
                out += q.char;
            } else out += q.from;
        }
        el.textContent = out;
        if (done < queue.length) {
            frame++;
            el._scramble = requestAnimationFrame(tick);
        } else {
            el._scramble = null;
        }
    }
    tick();
}
document.querySelectorAll('.nav-links span, .feature-tag').forEach(el => {
    el.addEventListener('mouseenter', () => scramble(el, 500));
});

/* ─── Glitch slice on hero title ──────────────────────── */
(function setupGlitch() {
    const title = document.getElementById('hero-title');
    if (!title) return;
    const r = title.cloneNode(true);
    const c = title.cloneNode(true);
    r.classList.add('glitch-layer', 'glitch-layer--r');
    c.classList.add('glitch-layer', 'glitch-layer--c');
    r.removeAttribute('id');
    c.removeAttribute('id');
    title.appendChild(r);
    title.appendChild(c);
    let active = false;
    function fire() {
        if (active) return;
        active = true;
        title.classList.add('glitch-active');
        const tl = gsap.timeline({ onComplete: () => { title.classList.remove('glitch-active'); active = false; } });
        for (let i = 0; i < 5; i++) {
            const dx1 = (Math.random() - 0.5) * 18;
            const dx2 = (Math.random() - 0.5) * 18;
            const top = Math.random() * 70;
            const h = 8 + Math.random() * 30;
            tl.set(r, { x: dx1, clipPath: `inset(${top}% 0 ${100 - top - h}% 0)` })
              .set(c, { x: dx2, clipPath: `inset(${top + 5}% 0 ${100 - top - h - 3}% 0)` })
              .to({}, { duration: 0.04 });
        }
        tl.set([r, c], { x: 0, clipPath: 'inset(0)' });
    }
    setInterval(() => { if (Math.random() > 0.6) fire(); }, 4500);
})();

/* ─── Spotlight on feature cards ──────────────────────── */
document.querySelectorAll('.feature-img-wrapper').forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mx', mx + '%');
        el.style.setProperty('--my', my + '%');
    });
});

/* ─── Magnetic buttons ────────────────────────────────── */
document.querySelectorAll('[data-magnet]').forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: 'power3.out' });
    });
    el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    });
});

/* ─── 3D tilt for feature images ──────────────────────── */
document.querySelectorAll('[data-tilt]').forEach(el => {
    const img = el.querySelector('.feature-img');
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(img, {
            rotationY: x * 14,
            rotationX: -y * 10,
            transformPerspective: 1200,
            duration: 0.6,
            ease: 'power3.out',
        });
    });
    el.addEventListener('mouseleave', () => {
        gsap.to(img, { rotationY: 0, rotationX: 0, duration: 1, ease: 'power3.out' });
    });
});

/* ─── WebGL setup ─────────────────────────────────────── */
const canvas = document.querySelector('#webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.9, 0.5, 0.7);
composer.addPass(bloomPass);

/* ─── Chromatic aberration + scanline post-pass ──────── */
const chromaShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uAmount: { value: 0.0025 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uAmount;
        uniform vec2 uResolution;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
            vec2 uv = vUv;
            vec2 dir = uv - 0.5;
            float aberration = uAmount * (0.4 + length(dir));
            float r = texture2D(tDiffuse, uv + dir * aberration).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - dir * aberration).b;
            vec3 col = vec3(r, g, b);
            float scan = sin(uv.y * uResolution.y * 1.5) * 0.015;
            col += scan;
            float grain = (hash(uv + uTime) - 0.5) * 0.04;
            col += grain;
            gl_FragColor = vec4(col, 1.0);
        }
    `
};
const chromaPass = new ShaderPass(chromaShader);
composer.addPass(chromaPass);

/* ─── Particles ───────────────────────────────────────── */
const particleCount = 120000;
const geometry = new THREE.BufferGeometry();
const posArrayA = new Float32Array(particleCount * 3);
const posArrayB = new Float32Array(particleCount * 3);
const posArrayC = new Float32Array(particleCount * 3);
const posArrayD = new Float32Array(particleCount * 3);
const randomArray = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2 * Math.PI;
    const phi = Math.acos(2 * v - 1);
    const rA = 4 + Math.random() * 0.5;
    posArrayA[i3]     = rA * Math.sin(phi) * Math.cos(theta);
    posArrayA[i3 + 1] = rA * Math.sin(phi) * Math.sin(theta);
    posArrayA[i3 + 2] = rA * Math.cos(phi);
    const xB = (Math.random() - 0.5) * 30;
    const yB = (Math.random() - 0.5) * 2;
    const zB = (Math.random() - 0.5) * 10;
    const twist = xB * 0.5;
    posArrayB[i3]     = xB;
    posArrayB[i3 + 1] = yB * Math.cos(twist) - zB * Math.sin(twist);
    posArrayB[i3 + 2] = yB * Math.sin(twist) + zB * Math.cos(twist);
    const rC = Math.sqrt(Math.random()) * 18;
    const thetaC = Math.random() * 2 * Math.PI;
    posArrayC[i3]     = rC * Math.cos(thetaC);
    posArrayC[i3 + 1] = (Math.random() - 0.5) * 0.5;
    posArrayC[i3 + 2] = rC * Math.sin(thetaC);
    posArrayD[i3]     = (Math.random() - 0.5) * 25;
    posArrayD[i3 + 1] = (Math.random() - 0.5) * 30;
    posArrayD[i3 + 2] = (Math.random() - 0.5) * 8;
    randomArray[i] = Math.random();
}
geometry.setAttribute('position', new THREE.BufferAttribute(posArrayA, 3));
geometry.setAttribute('aPosB', new THREE.BufferAttribute(posArrayB, 3));
geometry.setAttribute('aPosC', new THREE.BufferAttribute(posArrayC, 3));
geometry.setAttribute('aPosD', new THREE.BufferAttribute(posArrayD, 3));
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uMouse;
    uniform float uPixelRatio;
    attribute vec3 aPosB;
    attribute vec3 aPosC;
    attribute vec3 aPosD;
    attribute float aRandom;
    varying vec3 vColor;
    varying float vDistance;
    varying float vAlpha;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
        float s1 = smoothstep(0.00, 0.25, uScroll);
        float s2 = smoothstep(0.25, 0.50, uScroll);
        float s3 = smoothstep(0.50, 0.75, uScroll);
        float s4 = smoothstep(0.75, 1.00, uScroll);
        vec3 m1 = mix(position, aPosB, s1);
        vec3 m2 = mix(m1, aPosC, s2);
        vec3 m3 = mix(m2, aPosD, s3);
        vec3 targetPos = mix(m3, position * 1.8 + vec3(0.0, -3.0, 0.0), s4);
        float noiseAmp = 0.5 + s1 * 0.6 + s2 * 0.8 + s3 * 0.6 + s4 * 1.2;
        vec3 noisePos = vec3(targetPos.x * 0.3 + uTime * 0.1, targetPos.y * 0.3 + uTime * 0.12, targetPos.z * 0.3);
        targetPos.x += snoise(noisePos)            * noiseAmp;
        targetPos.y += snoise(noisePos + 100.0)    * noiseAmp;
        targetPos.z += snoise(noisePos + 200.0)    * noiseAmp;
        vec2 mouseNDC = uMouse * 2.0 - 1.0;
        vec3 worldMouse = vec3(mouseNDC.x * 14.0, -mouseNDC.y * 9.0, 0.0);
        float distToMouse = length(targetPos.xy - worldMouse.xy);
        float repel = smoothstep(4.5, 0.0, distToMouse);
        vec2 dir = normalize(targetPos.xy - worldMouse.xy + 0.0001);
        targetPos.xy += dir * repel * 2.5;
        vDistance = length(targetPos);
        vec4 modelPosition = modelMatrix * vec4(targetPos, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
        float pSize = 2.5 * (20.0 / -viewPosition.z) * (0.6 + aRandom);
        gl_PointSize = clamp(pSize, 1.0, 18.0) * uPixelRatio;
        vec3 cA = vec3(1.0, 0.20, 0.40);
        vec3 cB = vec3(1.0, 0.60, 0.20);
        vec3 cC = vec3(0.40, 0.10, 1.00);
        vec3 cD = vec3(0.00, 0.90, 1.00);
        vec3 cE = vec3(1.00, 1.00, 1.00);
        float wave = sin(uTime * 0.4 + targetPos.x * 0.15 + targetPos.y * 0.08);
        vec3 mixA = mix(cA, cB, aRandom + wave * 0.3);
        vec3 mixB = mix(mixA, cC, s2);
        vec3 mixC = mix(mixB, cD, s3 * 0.9);
        vColor = mix(mixC, cE, s4 * aRandom * 0.6);
        vAlpha = 0.55 + 0.35 * smoothstep(0.0, 0.2, uScroll);
    }
`;

const fragmentShader = /* glsl */ `
    varying vec3 vColor;
    varying float vDistance;
    varying float vAlpha;
    void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        float strength = smoothstep(0.5, 0.0, r);
        strength = pow(strength, 2.2);
        float halo = smoothstep(0.5, 0.18, r) * 0.4;
        float fadeOut = smoothstep(35.0, 8.0, vDistance);
        vec3 col = vColor + halo * 0.5;
        gl_FragColor = vec4(col, (strength + halo * 0.4) * fadeOut * vAlpha);
    }
`;

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
        uTime:        { value: 0 },
        uScroll:      { value: 0 },
        uMouse:       { value: new THREE.Vector2(0.5, 0.5) },
        uPixelRatio:  { value: Math.min(window.devicePixelRatio, 2) }
    }
});

const points = new THREE.Points(geometry, material);
scene.add(points);

const mouse = new THREE.Vector2(0.5, 0.5);
const targetMouse = new THREE.Vector2(0.5, 0.5);
window.addEventListener('mousemove', (e) => {
    targetMouse.x = e.clientX / window.innerWidth;
    targetMouse.y = e.clientY / window.innerHeight;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    chromaShader.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

/* ─── Scroll-driven uniforms ─────────────────────────── */
ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
        gsap.to(material.uniforms.uScroll, { value: self.progress, duration: 0.6, ease: 'power2.out' });
        gsap.to(camera.position, {
            y: -self.progress * 12,
            z: 15 - self.progress * 4,
            duration: 0.6,
            ease: 'power2.out',
        });
        points.rotation.y = self.progress * Math.PI * 1.4;
        points.rotation.x = self.progress * 0.4;
        const v = self.getVelocity();
        const target = THREE.MathUtils.clamp(0.0025 + Math.abs(v) * 0.000004, 0.0025, 0.012);
        gsap.to(chromaPass.uniforms.uAmount, { value: target, duration: 0.4, ease: 'power2.out' });
    }
});

/* ─── Hero text reveal ───────────────────────────────── */
function startReveal() {
    gsap.to('.hero-title .line-inner', {
        y: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.15,
        delay: 0.2,
    });
    gsap.to('.gsap-fade', {
        scrollTrigger: {
            trigger: '.gsap-fade',
            start: 'top 90%',
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.05,
    });
    document.querySelectorAll('.gsap-fade').forEach((el) => {
        gsap.to(el, {
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
            opacity: 1,
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
        });
    });
}

/* ─── Manifesto: word-by-word fade ───────────────────── */
const manifesto = document.getElementById('manifesto-text');
if (manifesto) {
    const html = manifesto.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    function wrapWords(node) {
        const out = document.createDocumentFragment();
        node.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const words = child.textContent.split(/(\s+)/);
                words.forEach(w => {
                    if (w.trim().length === 0) {
                        out.appendChild(document.createTextNode(w));
                    } else {
                        const s = document.createElement('span');
                        s.className = 'word';
                        s.textContent = w;
                        out.appendChild(s);
                    }
                });
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const wrapped = document.createElement(child.tagName.toLowerCase());
                wrapped.className = child.className;
                wrapped.appendChild(wrapWords(child));
                out.appendChild(wrapped);
            }
        });
        return out;
    }
    manifesto.innerHTML = '';
    manifesto.appendChild(wrapWords(tmp));

    gsap.to(manifesto.querySelectorAll('.word'), {
        scrollTrigger: {
            trigger: manifesto,
            start: 'top 70%',
            end: 'bottom 30%',
            scrub: 0.8,
        },
        opacity: 1,
        stagger: 0.04,
        ease: 'none',
    });
}

/* ─── Marquee ────────────────────────────────────────── */
gsap.to('#marquee-track', {
    xPercent: -50,
    ease: 'none',
    scrollTrigger: {
        trigger: '.marquee-section',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8
    }
});

/* ─── Scroll-velocity skew on feature images ──────────── */
(function setupSkew() {
    const imgs = document.querySelectorAll('.feature-img-wrapper');
    if (!imgs.length) return;
    const skewSetters = [...imgs].map(img => gsap.quickTo(img, 'skewY', { duration: 0.8, ease: 'power3.out' }));
    const scaleYSetters = [...imgs].map(img => gsap.quickTo(img.querySelector('.feature-img'), 'scaleY', { duration: 0.8, ease: 'power3.out' }));
    ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate(self) {
            const v = THREE.MathUtils.clamp(self.getVelocity() / 4500, -0.5, 0.5);
            skewSetters.forEach(s => s(v * 6));
            scaleYSetters.forEach(s => s(1 + Math.abs(v) * 0.06));
        }
    });
})();

/* ─── Image reveal with clip-path mask ────────────────── */
document.querySelectorAll('.feature-img-wrapper').forEach((wrap) => {
    gsap.set(wrap, { clipPath: 'inset(0 100% 0 0)' });
    gsap.to(wrap, {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: wrap, start: 'top 85%', once: true }
    });
});

/* ─── Section reveal: cinematic dim on enter ──────────── */
gsap.utils.toArray('section').forEach((sec) => {
    gsap.fromTo(sec,
        { filter: 'brightness(0.55) saturate(0.6)' },
        {
            filter: 'brightness(1) saturate(1)',
            ease: 'power2.out',
            scrollTrigger: { trigger: sec, start: 'top 70%', end: 'top 30%', scrub: true }
        }
    );
});

/* ─── Stat counters ──────────────────────────────────── */
document.querySelectorAll('.stat-counter').forEach(el => {
    const target = parseFloat(el.dataset.target || el.textContent || el.parentElement?.dataset?.target || '0');
    const obj = { v: 0 };
    ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: () => {
            gsap.to(obj, {
                v: target,
                duration: 2.2,
                ease: 'power3.out',
                onUpdate: () => { el.textContent = Math.floor(obj.v); }
            });
        }
    });
});

/* ─── Stat lines: slide in left → right ──────────────── */
document.querySelectorAll('.stat-line').forEach((el) => {
    gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        width: '100%',
        duration: 1.2,
        ease: 'expo.out',
    });
});

/* ─── Animate ────────────────────────────────────────── */
const clock = new THREE.Clock();
function animate() {
    const t = clock.getElapsedTime();
    mouse.lerp(targetMouse, 0.06);
    material.uniforms.uTime.value = t * 0.18;
    material.uniforms.uMouse.value = mouse;
    chromaPass.uniforms.uTime.value = t;

    points.rotation.x += Math.sin(t * 0.04) * 0.0008;
    points.rotation.z = Math.cos(t * 0.06) * 0.05;

    composer.render();
    requestAnimationFrame(animate);
}
animate();
