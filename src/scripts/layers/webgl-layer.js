import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clamp, damp, inverseLerp, lerp, seeded, smoothstep } from "../utils/math.js";

const modelUrls = {
  hello: new URL("../../assets/models/hello.gltf", import.meta.url).href,
  cursor: new URL("../../assets/models/cursor.glb", import.meta.url).href,
  contact: new URL("../../assets/models/cnt.gltf", import.meta.url).href
};

function degrees(value) {
  return THREE.MathUtils.degToRad(value);
}

function createBlueMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#07168f"),
    roughness: 0.2,
    metalness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    reflectivity: 1,
    sheen: 0.28,
    sheenColor: new THREE.Color("#5e74ff"),
    iridescence: 0.24,
    iridescenceIOR: 1.35,
    iridescenceThicknessRange: [100, 460],
    transparent: true,
    opacity: 1
  });
}

function applyMaterial(root, materialFactory) {
  const materials = [];
  root.traverse((child) => {
    if (child.isLight) child.visible = false;
    if (!child.isMesh) return;
    const material = materialFactory();
    child.material = material;
    child.castShadow = false;
    child.receiveShadow = false;
    materials.push(material);
  });
  return materials;
}

function normalizeModel(model, targetWidth) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const scale = targetWidth / Math.max(size.x, size.y, 0.001);
  model.scale.setScalar(scale);
  return model;
}

function setOpacity(materials, opacity) {
  for (const material of materials) {
    material.opacity = clamp(opacity);
    material.visible = opacity > 0.002;
    material.depthWrite = opacity > 0.92;
  }
}

function createDust() {
  const count = 880;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const angle = seeded(index, 1) * Math.PI * 2;
    const radius = 4 + seeded(index, 2) * 8.5;
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = (seeded(index, 3) - 0.5) * 7.4;
    positions[index * 3 + 2] = (seeded(index, 4) - 0.5) * 5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: "#90a4ff",
    size: 0.035,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createWebglLayer({ canvas, state, onProgress }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(0, 0, 28);

  const ambient = new THREE.HemisphereLight(0xb7c7ff, 0x02051c, 1.25);
  const key = new THREE.PointLight(0xffffff, 190, 80, 1.6);
  const cyan = new THREE.PointLight(0x47c7ff, 145, 70, 1.8);
  const magenta = new THREE.PointLight(0xff4ca7, 42, 65, 1.7);
  const pointerLight = new THREE.PointLight(0xffffff, 160, 36, 1.6);
  key.position.set(-8, 9, 11);
  cyan.position.set(10, 3, 8);
  magenta.position.set(-5, -8, 6);
  pointerLight.position.set(0, 0, 10);
  scene.add(ambient, key, cyan, magenta, pointerLight);

  const helloGroup = new THREE.Group();
  const cursorGroup = new THREE.Group();
  const contactGroup = new THREE.Group();
  const dust = createDust();
  scene.add(helloGroup, cursorGroup, contactGroup, dust);

  const modelState = {
    hello: { materials: [], model: null },
    cursor: { materials: [], model: null },
    contact: { materials: [], model: null }
  };

  const loader = new GLTFLoader();
  let loaded = 0;
  const total = Object.keys(modelUrls).length;

  function loadModel(keyName, targetWidth, materialFactory) {
    return new Promise((resolve) => {
      loader.load(
        modelUrls[keyName],
        (gltf) => {
          const model = normalizeModel(gltf.scene, targetWidth);
          const materials = applyMaterial(model, materialFactory);
          modelState[keyName] = { model, materials };
          loaded += 1;
          onProgress?.(loaded / total);
          resolve(modelState[keyName]);
        },
        undefined,
        (error) => {
          console.error(`Unable to load ${keyName} model`, error);
          loaded += 1;
          onProgress?.(loaded / total);
          resolve(modelState[keyName]);
        }
      );
    });
  }

  const ready = Promise.all([
    loadModel("hello", 16.6, createBlueMaterial).then(({ model }) => model && helloGroup.add(model)),
    loadModel("cursor", 3.1, () => {
      const material = createBlueMaterial();
      material.color.set("#0968ee");
      material.sheenColor.set("#66c7ff");
      return material;
    }).then(({ model }) => model && cursorGroup.add(model)),
    loadModel("contact", 16.4, createBlueMaterial).then(({ model }) => model && contactGroup.add(model))
  ]);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width >= 1024 ? 34 : 48;
    camera.updateProjectionMatrix();
  }

  function render() {
    const p = state.position;
    const delta = state.delta;
    const heroProgress = smoothstep(inverseLerp(0, 2.75, p));
    const contactProgress = smoothstep(inverseLerp(14.1, 16.5, p));
    const heroOpacity = 1 - smoothstep(inverseLerp(2.25, 3.05, p));
    const contactOpacity = smoothstep(inverseLerp(14.05, 14.75, p));
    const isMobile = window.innerWidth < 900;

    helloGroup.visible = heroOpacity > 0.002;
    helloGroup.position.x = lerp(isMobile ? 0.1 : -0.1, isMobile ? -1.1 : -2.2, heroProgress);
    helloGroup.position.y = lerp(isMobile ? 0.7 : -0.1, 5.8, heroProgress);
    helloGroup.position.z = 2;
    helloGroup.rotation.x = degrees(lerp(-2, 7, heroProgress));
    helloGroup.rotation.y = degrees(lerp(4, 90, heroProgress));
    helloGroup.rotation.z = degrees(lerp(-3, 8, heroProgress));
    const helloScale = isMobile ? 0.64 : 1;
    helloGroup.scale.setScalar(helloScale * lerp(1, 0.86, heroProgress));
    setOpacity(modelState.hello.materials, heroOpacity);

    cursorGroup.visible = heroOpacity > 0.002;
    cursorGroup.position.set(isMobile ? 4.6 : 9.6, isMobile ? -5.2 : -4.25, -2.4);
    cursorGroup.rotation.x = degrees(45);
    cursorGroup.rotation.y = degrees(heroProgress * 720 + state.time * 0.008);
    cursorGroup.rotation.z = degrees(10 + Math.sin(state.time * 0.0012) * 7);
    setOpacity(modelState.cursor.materials, heroOpacity);

    contactGroup.visible = contactOpacity > 0.002;
    contactGroup.position.set(0, isMobile ? -0.4 : -0.2, 1.5);
    contactGroup.rotation.x = degrees(lerp(-180, 0, contactProgress));
    contactGroup.rotation.y = degrees(Math.sin(state.time * 0.00035) * 2.5);
    contactGroup.rotation.z = degrees(lerp(7, 0, contactProgress));
    contactGroup.scale.setScalar((isMobile ? 0.68 : 1) * lerp(0.72, 1, contactProgress));
    setOpacity(modelState.contact.materials, contactOpacity);

    dust.visible = heroOpacity > 0.01 || contactOpacity > 0.01;
    dust.material.opacity = Math.max(heroOpacity, contactOpacity) * 0.52;
    dust.position.y = contactOpacity > heroOpacity ? 0 : lerp(0, 4, heroProgress);
    dust.rotation.y += delta * (0.05 + Math.abs(state.velocity) * 0.005);
    dust.rotation.z = state.time * 0.00003;

    const targetCameraX = isMobile ? 0 : -state.pointer.nx * 0.78;
    const targetCameraY = isMobile ? 0 : -state.pointer.ny * 0.42;
    camera.position.x = damp(camera.position.x, targetCameraX, 4.8, delta);
    camera.position.y = damp(camera.position.y, targetCameraY, 4.8, delta);
    camera.lookAt(0, 0, 0);

    pointerLight.position.x = state.pointer.nx * 10;
    pointerLight.position.y = state.pointer.ny * 6;
    pointerLight.intensity = 145 + state.pointer.speed * 250 + Math.abs(state.velocity) * 7;
    cyan.position.x = 9 + Math.sin(state.time * 0.0007) * 3;
    magenta.position.y = -6 + Math.cos(state.time * 0.0006) * 3;

    const dark = document.documentElement.classList.contains("dark");
    ambient.intensity = dark ? 1.25 : 2.15;
    renderer.toneMappingExposure = dark ? 1.05 : 1.2;

    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", resize);

  return { ready, render, resize, renderer };
}
