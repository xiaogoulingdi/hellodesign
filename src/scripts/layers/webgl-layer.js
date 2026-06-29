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

function createRefractionBackground() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uScroll: { value: 0 },
      uDark: { value: 1 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uTime;
      uniform float uScroll;
      uniform float uDark;
      varying vec2 vUv;

      float lineGrid(vec2 uv, float scale, float width) {
        vec2 g = abs(fract(uv * scale - 0.5) - 0.5) / fwidth(uv * scale);
        float line = min(g.x, g.y);
        return 1.0 - min(line / width, 1.0);
      }

      float dots(vec2 uv) {
        vec2 grid = fract(uv * 84.0) - 0.5;
        float d = length(grid);
        return smoothstep(0.055, 0.015, d);
      }

      void main() {
        vec2 uv = vUv;
        vec2 centered = uv - 0.5;
        centered.x *= uResolution.x / max(uResolution.y, 1.0);

        float radial = 1.0 - smoothstep(0.05, 0.92, length(centered));
        float wave = sin((uv.x * 7.0 + uv.y * 4.0 + uTime * 0.00045) * 6.28318) * 0.5 + 0.5;
        float grid = lineGrid(uv + vec2(uScroll * 0.018, -uScroll * 0.011), 4.0, 0.8);
        float micro = dots(uv + vec2(sin(uTime * 0.0002) * 0.01, cos(uTime * 0.00017) * 0.01));
        float pointerGlow = 1.0 - smoothstep(0.0, 0.55, distance(uv, uPointer));

        vec3 deep = mix(vec3(0.015, 0.025, 0.075), vec3(0.72, 0.77, 0.92), 1.0 - uDark);
        vec3 blue = mix(vec3(0.02, 0.13, 0.62), vec3(0.23, 0.34, 0.9), 1.0 - uDark);
        vec3 cyan = vec3(0.05, 0.82, 1.0);
        vec3 violet = vec3(0.72, 0.22, 1.0);

        vec3 color = deep;
        color += blue * (0.32 + radial * 0.62);
        color += cyan * grid * 0.045;
        color += mix(cyan, violet, wave) * micro * (uDark > 0.5 ? 0.075 : 0.035);
        color += vec3(0.45, 0.66, 1.0) * pointerGlow * 0.2;

        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  return { scene, camera, material };
}

function createGlassMaterial(texture, options = {}) {
  const baseColor = new THREE.Color(options.baseColor || "#061bb8");
  const rimColor = new THREE.Color(options.rimColor || "#9cecff");
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uSceneTexture: { value: texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uBaseColor: { value: baseColor },
      uRimColor: { value: rimColor },
      uIorR: { value: options.iorR ?? 1.17 },
      uIorG: { value: options.iorG ?? 1.21 },
      uIorB: { value: options.iorB ?? 1.27 },
      uRefractPower: { value: options.refractPower ?? 0.17 },
      uChromaticAberration: { value: options.chromaticAberration ?? 0.018 },
      uFresnelPower: { value: options.fresnelPower ?? 2.2 },
      uRippleStrength: { value: options.rippleStrength ?? 0.85 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerSpeed: { value: 0 },
      uLightA: { value: new THREE.Vector3(-8, 9, 11) },
      uLightB: { value: new THREE.Vector3(9, -4, 8) }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewNormal;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform sampler2D uSceneTexture;
      uniform vec2 uResolution;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uIorR;
      uniform float uIorG;
      uniform float uIorB;
      uniform float uRefractPower;
      uniform float uChromaticAberration;
      uniform float uFresnelPower;
      uniform float uRippleStrength;
      uniform float uPointerSpeed;
      uniform vec2 uPointer;
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform vec3 uLightA;
      uniform vec3 uLightB;
      varying vec3 vWorldPosition;
      varying vec3 vWorldNormal;
      varying vec3 vViewNormal;

      vec3 sampleDispersion(vec2 uv, vec2 bend, float split) {
        vec2 safeUv = clamp(uv, 0.002, 0.998);
        vec3 a = texture2D(uSceneTexture, clamp(safeUv + bend * 0.55, 0.002, 0.998)).rgb;
        vec3 b = texture2D(uSceneTexture, clamp(safeUv + bend * 1.00, 0.002, 0.998)).rgb;
        vec3 c = texture2D(uSceneTexture, clamp(safeUv + bend * 1.45, 0.002, 0.998)).rgb;
        return vec3(a.r, b.g, c.b) + vec3(split * 0.34, split * 0.16, split * 0.42);
      }

      void main() {
        vec2 screenUv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
        vec3 normal = normalize(vWorldNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 viewNormal = normalize(vViewNormal);
        vec2 pointerDelta = screenUv - uPointer;
        pointerDelta.x *= uResolution.x / max(uResolution.y, 1.0);
        float pointerDistance = length(pointerDelta);
        float hover = smoothstep(0.52, 0.035, pointerDistance) * uRippleStrength;
        float waveRaw = sin(pointerDistance * 118.0 - uTime * 0.018);
        float ripple = waveRaw * 0.5 + 0.5;
        float fineRipple = sin(pointerDistance * 230.0 + vWorldPosition.y * 2.2 - uTime * 0.026) * 0.5 + 0.5;
        float rippleMask = hover * (0.32 + uPointerSpeed * 1.25);

        float fresnel = pow(1.0 - clamp(dot(viewDir, normal), 0.0, 1.0), uFresnelPower);
        float tube = pow(abs(viewNormal.z), 0.32);
        vec2 rippleNormal = normalize(pointerDelta + 0.0001) * waveRaw * rippleMask;
        vec2 normalBend = viewNormal.xy * (0.38 + fresnel * 1.35) + rippleNormal * 0.86;
        vec3 rVec = refract(-viewDir, normal, 1.0 / uIorR);
        vec3 gVec = refract(-viewDir, normal, 1.0 / uIorG);
        vec3 bVec = refract(-viewDir, normal, 1.0 / uIorB);
        vec2 bend = (normalBend + rVec.xy + gVec.xy * 0.55 + bVec.xy * 0.28) * uRefractPower;
        vec2 tangent = normalize(vec2(-bend.y, bend.x) + 0.0001);
        float split = uChromaticAberration * (0.45 + fresnel * 2.2 + rippleMask * 2.3);

        vec3 refracted = vec3(
          sampleDispersion(screenUv, bend + tangent * split, split).r,
          sampleDispersion(screenUv, bend, split).g,
          sampleDispersion(screenUv, bend - tangent * split, split).b
        );

        vec3 lightA = normalize(uLightA - vWorldPosition);
        vec3 lightB = normalize(uLightB - vWorldPosition);
        vec3 halfA = normalize(lightA + viewDir);
        vec3 halfB = normalize(lightB + viewDir);
        float specA = pow(max(dot(normal, halfA), 0.0), 92.0);
        float specB = pow(max(dot(normal, halfB), 0.0), 42.0);
        float sweep = pow(max(0.0, sin(vWorldPosition.x * 0.85 + vWorldPosition.y * 0.34 + uTime * 0.0011)), 8.0);
        float rippleSpec = pow(ripple, 3.0) * fineRipple * rippleMask;
        float rippleShadow = (1.0 - ripple) * rippleMask * 0.18;

        vec3 body = mix(refracted, uBaseColor, 0.74 + tube * 0.14);
        body += uRimColor * fresnel * 0.9;
        body += vec3(1.0, 0.96, 0.92) * specA * 1.25;
        body += vec3(0.2, 0.95, 1.0) * specB * 0.65;
        body += vec3(0.8, 0.95, 1.0) * sweep * 0.12;
        body += vec3(0.72, 0.95, 1.0) * rippleSpec * 0.88;
        body -= vec3(0.02, 0.05, 0.16) * rippleShadow;
        body = pow(body, vec3(0.92));

        float alpha = uOpacity * mix(0.78, 0.98, clamp(fresnel + tube * 0.48, 0.0, 1.0));
        gl_FragColor = vec4(body, alpha);
      }
    `
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
    if (material.uniforms?.uOpacity) material.uniforms.uOpacity.value = clamp(opacity);
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
  const refractionTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    samples: renderer.capabilities.isWebGL2 ? 4 : 0
  });
  refractionTarget.texture.name = "liquid-glass-refraction";
  const refractionBackground = createRefractionBackground();

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
    loadModel("hello", 14.8, () => createGlassMaterial(refractionTarget.texture, {
      baseColor: "#0716b7",
      rimColor: "#b8f7ff",
      refractPower: 0.105,
      chromaticAberration: 0.011,
      rippleStrength: 1
    })).then(({ model }) => model && helloGroup.add(model)),
    loadModel("cursor", 3.1, () => {
      return createGlassMaterial(refractionTarget.texture, {
        baseColor: "#075bf0",
        rimColor: "#8beeff",
        refractPower: 0.085,
        chromaticAberration: 0.009,
        fresnelPower: 1.85,
        rippleStrength: 0.45
      });
    }).then(({ model }) => model && cursorGroup.add(model)),
    loadModel("contact", 15.6, () => createGlassMaterial(refractionTarget.texture, {
      baseColor: "#0716b7",
      rimColor: "#c1f7ff",
      refractPower: 0.1,
      chromaticAberration: 0.01,
      rippleStrength: 0.35
    })).then(({ model }) => model && contactGroup.add(model))
  ]);

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderWidth = Math.max(1, Math.floor(width * pixelRatio));
    const renderHeight = Math.max(1, Math.floor(height * pixelRatio));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    refractionTarget.setSize(renderWidth, renderHeight);
    refractionBackground.material.uniforms.uResolution.value.set(width, height);
    for (const keyName of Object.keys(modelState)) {
      for (const material of modelState[keyName].materials) {
        material.uniforms?.uResolution?.value.set(renderWidth, renderHeight);
      }
    }
    camera.aspect = width / height;
    camera.fov = width >= 1024 ? 34 : 48;
    camera.updateProjectionMatrix();
  }

  function render() {
    const p = state.position;
    const delta = state.delta;
    const heroProgress = smoothstep(inverseLerp(0, 2.75, p));
    const contactProgress = smoothstep(inverseLerp(14.75, 16.75, p));
    const hyperProgress = inverseLerp(8.55, 14.85, p);
    const heroOpacity = 1 - smoothstep(inverseLerp(2.25, 3.05, p));
    const contactOpacity = smoothstep(inverseLerp(14.7, 15.25, p));
    const hyperReveal = smoothstep(inverseLerp(8.65, 10.55, p));
    const hyperArrowIntro = smoothstep(inverseLerp(8.45, 9.7, p)) * (1 - smoothstep(inverseLerp(10.45, 11.35, p)));
    const hyperArrowOutro = smoothstep(inverseLerp(12.9, 13.65, p)) * (1 - smoothstep(inverseLerp(14.35, 14.85, p)));
    const hyperArrowOpacity = Math.max(hyperArrowIntro, hyperArrowOutro);
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

    cursorGroup.visible = heroOpacity > 0.002 || hyperArrowOpacity > 0.002;
    if (hyperArrowOpacity > heroOpacity) {
      const outroTurn = smoothstep(inverseLerp(13.0, 14.25, p));
      const introScale = lerp(0.92, isMobile ? 9.5 : 16.5, smoothstep(inverseLerp(8.45, 10.2, p)));
      const outroScale = lerp(isMobile ? 7.5 : 12.5, 0.95, smoothstep(inverseLerp(13.55, 14.75, p)));
      cursorGroup.position.set(
        lerp(isMobile ? -1.2 : -2.8, 0, hyperReveal),
        lerp(isMobile ? 0.6 : 0.8, isMobile ? -0.1 : 0.1, hyperReveal),
        lerp(-7.2, -5.8, hyperReveal)
      );
      cursorGroup.rotation.x = degrees(52 + outroTurn * 145 + hyperReveal * 8);
      cursorGroup.rotation.y = degrees(lerp(-26, 14, hyperReveal) + lerp(0, 182, outroTurn) + Math.sin(state.time * 0.001) * 4);
      cursorGroup.rotation.z = degrees(lerp(-22, -4, hyperReveal) + lerp(0, 18, outroTurn));
      cursorGroup.scale.setScalar(Math.max(introScale * hyperArrowIntro, outroScale * hyperArrowOutro));
      setOpacity(modelState.cursor.materials, hyperArrowOpacity * lerp(0.92, 0.28, hyperReveal));
    } else {
      cursorGroup.position.set(isMobile ? 4.6 : 9.6, isMobile ? -5.2 : -4.25, -2.4);
      cursorGroup.rotation.x = degrees(45);
      cursorGroup.rotation.y = degrees(heroProgress * 720 + state.time * 0.008);
      cursorGroup.rotation.z = degrees(10 + Math.sin(state.time * 0.0012) * 7);
      cursorGroup.scale.setScalar(1);
      setOpacity(modelState.cursor.materials, heroOpacity);
    }

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

    refractionBackground.material.uniforms.uTime.value = state.time;
    refractionBackground.material.uniforms.uScroll.value = p;
    refractionBackground.material.uniforms.uDark.value = dark ? 1 : 0;
    refractionBackground.material.uniforms.uPointer.value.set(
      state.pointer.x / Math.max(window.innerWidth, 1),
      1 - state.pointer.y / Math.max(window.innerHeight, 1)
    );
    for (const keyName of Object.keys(modelState)) {
      for (const material of modelState[keyName].materials) {
        if (!material.uniforms) continue;
        material.uniforms.uTime.value = state.time;
        material.uniforms.uPointer?.value.set(
          state.pointer.x / Math.max(window.innerWidth, 1),
          1 - state.pointer.y / Math.max(window.innerHeight, 1)
        );
        if (material.uniforms.uPointerSpeed) {
          material.uniforms.uPointerSpeed.value = state.pointer.speed;
        }
        material.uniforms.uLightA.value.copy(key.position);
        material.uniforms.uLightB.value.copy(cyan.position);
      }
    }

    renderer.setRenderTarget(refractionTarget);
    renderer.render(refractionBackground.scene, refractionBackground.camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", resize);

  return { ready, render, resize, renderer };
}
