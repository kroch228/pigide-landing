
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const lenis = new Lenis({
    duration: 1.2,
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

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.0;
bloomPass.strength = 0.6;
bloomPass.radius = 0.8;
composer.addPass(bloomPass);

const particleCount = 120000;
const geometry = new THREE.BufferGeometry();

const posArrayA = new Float32Array(particleCount * 3);
const posArrayB = new Float32Array(particleCount * 3);
const posArrayC = new Float32Array(particleCount * 3);
const randomArray = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const rA = 4.0 + Math.random() * 0.5;
    posArrayA[i3] = rA * Math.sin(phi) * Math.cos(theta);
    posArrayA[i3 + 1] = rA * Math.sin(phi) * Math.sin(theta);
    posArrayA[i3 + 2] = rA * Math.cos(phi);

    const xB = (Math.random() - 0.5) * 30;
    const yB = (Math.random() - 0.5) * 2;
    const zB = (Math.random() - 0.5) * 10;
    const twist = xB * 0.5;
    posArrayB[i3] = xB;
    posArrayB[i3 + 1] = yB * Math.cos(twist) - zB * Math.sin(twist);
    posArrayB[i3 + 2] = yB * Math.sin(twist) + zB * Math.cos(twist);

    const rC = Math.sqrt(Math.random()) * 18;
    const thetaC = Math.random() * 2 * Math.PI;
    posArrayC[i3] = rC * Math.cos(thetaC);
    posArrayC[i3 + 1] = (Math.random() - 0.5) * 0.5;
    posArrayC[i3 + 2] = rC * Math.sin(thetaC);

    randomArray[i] = Math.random();
}

geometry.setAttribute('position', new THREE.BufferAttribute(posArrayA, 3));
geometry.setAttribute('aPosB', new THREE.BufferAttribute(posArrayB, 3));
geometry.setAttribute('aPosC', new THREE.BufferAttribute(posArrayC, 3));
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1));

const vertexShader = `
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uMouse;
    
    attribute vec3 aPosB;
    attribute vec3 aPosC;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying vec3 vColor;
    varying float vDistance;

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
        vUv = uv;
        
        vec3 targetPos;
        float stage1 = smoothstep(0.0, 0.3, uScroll);
        float stage2 = smoothstep(0.3, 0.6, uScroll);
        float stage3 = smoothstep(0.6, 1.0, uScroll);
        
        vec3 mix1 = mix(position, aPosB, stage1);
        vec3 mix2 = mix(mix1, aPosC, stage2);
        targetPos = mix(mix2, position * 1.5 + vec3(0.0, -5.0, 0.0), stage3);

        float noiseFreq = 0.3;
        float noiseAmp = 0.6 + (stage1 * 1.0) - (stage2 * 0.3) + (stage3 * 0.8);
        vec3 noisePos = vec3(targetPos.x * noiseFreq + uTime * 0.1, targetPos.y * noiseFreq + uTime * 0.1, targetPos.z * noiseFreq);
        targetPos.x += snoise(noisePos) * noiseAmp;
        targetPos.y += snoise(noisePos + 100.0) * noiseAmp;
        targetPos.z += snoise(noisePos + 200.0) * noiseAmp;

        vec2 mouseNDCp = uMouse * 2.0 - 1.0;
        vec4 worldMouse = vec4(mouseNDCp.x * 15.0, -mouseNDCp.y * 10.0, 0.0, 1.0);
        float distToMouse = length(targetPos.xy - worldMouse.xy);
        float repelFactor = smoothstep(4.0, 0.0, distToMouse);
        vec2 repelDir = normalize(targetPos.xy - worldMouse.xy);
        targetPos.xy += repelDir * repelFactor * 2.0;

        vDistance = length(targetPos);

        vec4 modelPosition = modelMatrix * vec4(targetPos, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        
        gl_Position = projectedPosition;
        
        float basePointSize = 2.0;
        float pSize = basePointSize * (20.0 / -viewPosition.z) * (1.0 + aRandom);
        gl_PointSize = clamp(pSize, 1.0, 15.0);

        vec3 colorA = vec3(1.0, 0.2, 0.4); // pinkish
        vec3 colorB = vec3(1.0, 0.6, 0.2); // warm orange
        vec3 colorC = vec3(0.6, 0.0, 1.0); // purple
        vec3 colorD = vec3(0.0, 0.9, 1.0); // neon blue
        
        vec3 colMix1 = mix(colorA, colorB, aRandom + (sin(uTime * 0.1 + targetPos.x)*0.5));
        vec3 colMix2 = mix(colMix1, colorC, stage2 * aRandom);
        vColor = mix(colMix2, colorD, stage3 * aRandom);
    }
`;

const fragmentShader = `
    varying vec3 vColor;
    varying float vDistance;

    void main() {
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        
        float strength = smoothstep(0.5, 0.0, distanceToCenter);
        strength = pow(strength, 2.0);
        
        float fadeOut = smoothstep(30.0, 10.0, vDistance);
        
        gl_FragColor = vec4(vColor, strength * fadeOut * 0.7);
    }
`;

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    }
});

const points = new THREE.Points(geometry, material);
scene.add(points);

const mouse = new THREE.Vector2(0.5, 0.5);
let targetMouse = new THREE.Vector2(0.5, 0.5);

window.addEventListener('mousemove', (e) => {
    targetMouse.x = e.clientX / window.innerWidth;
    targetMouse.y = e.clientY / window.innerHeight;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});

ScrollTrigger.create({
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
        gsap.to(material.uniforms.uScroll, {
            value: self.progress,
            duration: 0.5,
            ease: "power2.out"
        });
        
        camera.position.y = -self.progress * 15;
        camera.position.z = 15 - self.progress * 5;
        points.rotation.y = self.progress * Math.PI * 1.5;
        points.rotation.x = self.progress * 0.5;
    }
});

const reveals = document.querySelectorAll('.gsap-reveal');
reveals.forEach((el) => {
    gsap.to(el, {
        scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
        },
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power4.out"
    });
});

gsap.to('.marquee', {
    xPercent: -50,
    ease: "none",
    scrollTrigger: {
        trigger: ".marquee-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
    }
});

const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();
    
    mouse.lerp(targetMouse, 0.05);
    
    material.uniforms.uTime.value = elapsedTime * 0.15;
    material.uniforms.uMouse.value = mouse;
    
    points.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1;
    points.rotation.z = Math.cos(elapsedTime * 0.05) * 0.1;

    composer.render();
    requestAnimationFrame(animate);
}

animate();
