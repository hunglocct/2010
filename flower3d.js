// flower3d.js - Procedural 3D Petal & Rose Generation based on 3dviz-pro-max principles
// Sculpted as an authentic English David Austin Rose with 60 layered Fibonacci petals.
const THREE = window.THREE;

export class ProceduralFlowerScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.flowerGroup = null;
    this.petals = [];
    this.fallingPetals = [];
    this.bloomProgress = 0.75; // Nicely bloomed chalice rose
    this.targetBloom = 0.75;
    this.clock = new THREE.Clock();

    // Mouse & Touch Interaction
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    // Start with the flower head tilted towards the viewer so we look into the blooming blossom
    this.flowerRotation = { x: 0.55, y: -0.2 };
    this.targetFlowerRotation = { x: 0.55, y: -0.2 };

    // Rich color themes
    this.themes = {
      pink: {
        outerColor: 0xeb517d,
        innerColor: 0xffa3ba,
        coreColor: 0xffd1dc,
        glow: 0xff3b6f,
        roughness: 0.35,
        metalness: 0.04
      },
      crimson: {
        outerColor: 0x9e0e2a,
        innerColor: 0xd9264e,
        coreColor: 0xff6685,
        glow: 0xcc1133,
        roughness: 0.32,
        metalness: 0.05
      },
      gold: {
        outerColor: 0xd98a24,
        innerColor: 0xffc45c,
        coreColor: 0xffeab3,
        glow: 0xffaa22,
        roughness: 0.30,
        metalness: 0.10
      },
      purple: {
        outerColor: 0x7933ea,
        innerColor: 0xaa72f8,
        coreColor: 0xdec4ff,
        glow: 0x9333ea,
        roughness: 0.36,
        metalness: 0.05
      }
    };
    this.currentTheme = 'pink';

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup - positioned above looking down into the rose chalice
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.updateCameraPosition(width);

    // 3. Renderer with antialiasing
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Studio Lighting tailored for rose petals
    this.setupLights();

    // 5. Build the authentic English David Austin Rose
    this.buildFlower();

    // 6. Build falling drifting petals
    this.initFallingPetals(40);

    // 7. Event listeners
    this.addEventListeners();

    // 8. Animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  updateCameraPosition(width) {
    if (width < 900) {
      // Mobile: centered, looking down into the flower
      this.camera.position.set(0, 1.8, 4.2);
      this.camera.lookAt(0, -0.2, 0);
    } else {
      // Desktop: left half, looking down at ~30 deg into the blossom
      this.camera.position.set(-1.1, 1.6, 3.8);
      this.camera.lookAt(-0.9, -0.2, 0);
    }
  }

  setupLights() {
    // Ambient light with soft warm rose tint
    const ambientLight = new THREE.AmbientLight(0xfff5f8, 1.3);
    this.scene.add(ambientLight);

    // Key Light positioned above and to the right
    const keyLight = new THREE.DirectionalLight(0xfff7ee, 2.0);
    keyLight.position.set(3, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    // Soft Rim Light from behind to highlight translucent petal rims
    const rimLight = new THREE.DirectionalLight(0xffb8c8, 1.4);
    rimLight.position.set(-4, 3, -3);
    this.scene.add(rimLight);

    // Soft Fill Light from below
    const fillLight = new THREE.DirectionalLight(0xffe6ee, 0.8);
    fillLight.position.set(0, -3, 2);
    this.scene.add(fillLight);

    // Inner glowing core point light
    this.innerGlowLight = new THREE.PointLight(0xff5280, 2.2, 3.0);
    this.innerGlowLight.position.set(0, 0.3, 0);
    this.scene.add(this.innerGlowLight);
  }

  /**
   * Generates a curved, spoon-shaped rose petal.
   * - u in [0, 1]: along petal height (20 segments)
   * - v in [-1, 1]: along petal width (16 segments)
   * Features:
   * 1. Cylindrical/spherical wrap across width (embraces neighbor petals)
   * 2. Smooth rounded dome top (never spiky or triangular)
   * 3. S-curve longitudinal profile: cupped bowl with backward reflex at tip
   */
  createPetalGeometry(width, length, cupDepth, curlAmount, wrapCurvature = 0.75) {
    const uSegments = 20;
    const vSegments = 16;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments; // 0 (base) -> 1 (tip)

      // Width envelope: narrow base (0.25), full belly at mid (1.0), rounded dome at upper (0.75)
      const wProfile = width * Math.sin(Math.pow(u, 0.45) * Math.PI * 0.75);

      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments) * 2 - 1; // -1 to +1

        // Wrap angle across width (cylindrical embrace)
        const wrapAngle = v * wrapCurvature;
        const x = Math.sin(wrapAngle) * (wProfile / (wrapCurvature || 0.001));

        // Rounded top edge (dome)
        const dome = -0.15 * length * (v * v) * Math.pow(u, 1.4);
        const y = u * length + dome;

        // Depth profile:
        // 1. Transverse cylindrical wrap:
        const zWrap = (1.0 - Math.cos(wrapAngle)) * (wProfile / (wrapCurvature || 0.001));

        // 2. Transverse bowl cup (hollow):
        const zCup = -cupDepth * (1.0 - v * v) * Math.sin(u * Math.PI * 0.85);

        // 3. Tip reflex curl (gentle backward curl of the rim):
        const zCurl = curlAmount * Math.pow(u, 2.5) * (1.0 - 0.3 * v * v);

        const z = zWrap + zCup + zCurl;

        positions.push(x, y, z);
        uvs.push((v + 1) * 0.5, u);
      }
    }

    // Quad indices
    for (let i = 0; i < uSegments; i++) {
      for (let j = 0; j < vSegments; j++) {
        const a = i * (vSegments + 1) + j;
        const b = (i + 1) * (vSegments + 1) + j;
        const c = (i + 1) * (vSegments + 1) + (j + 1);
        const d = i * (vSegments + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  buildFlower() {
    this.flowerGroup = new THREE.Group();
    // Position flower head nicely in viewport
    this.flowerGroup.position.set(-0.95, -0.4, 0);

    const theme = this.themes[this.currentTheme];

    // Total petals in an English Rose: 58 petals arranged in golden Fibonacci spiral
    const TOTAL_PETALS = 58;
    const goldenAngle = 2.399963; // 137.5 degrees in radians

    for (let n = 0; n < TOTAL_PETALS; n++) {
      // Normalized index from 0 (center bud) to 1 (outer guard petal)
      const t = Math.sqrt(n / (TOTAL_PETALS - 1));

      // 1. Placement parameters
      const phi = n * goldenAngle;
      // Distance from center axis
      const radius = 0.04 + 0.48 * Math.pow(t, 0.95);
      // Height: inner petals sit elevated in the center, outer petals cascade lower
      const yOffset = 0.38 * (1.0 - Math.pow(t, 1.4));

      // 2. Petal dimensions
      const width = 0.38 + 0.72 * Math.pow(t, 0.8);
      const length = 0.50 + 0.65 * Math.pow(t, 0.8);
      const cup = 0.28 + 0.18 * (1.0 - t); // Inner petals are deeper cups
      const curl = 0.04 + 0.36 * Math.pow(t, 1.3); // Outer petals curl at rims
      const wrap = 0.95 - 0.35 * t; // Inner petals wrap more tightly around axis

      // 3. Bloom tilt angles (radians)
      // Inner petals stay upright (nearly vertical), outer petals flare to at most 46 degrees (0.8 rad)
      const tiltBud = 0.06 + 0.32 * Math.pow(t, 1.2);
      const tiltOpen = 0.14 + 0.72 * Math.pow(t, 1.1); // Max ~48 degrees at edge! Never flat!

      const geom = this.createPetalGeometry(width, length, cup, curl, wrap);

      // Color gradient from center out
      const matColor = new THREE.Color();
      if (t < 0.25) {
        // Core bud: light glowing peach/pink
        matColor.setHex(theme.coreColor);
      } else if (t < 0.65) {
        // Mid whorl: soft vibrant pink
        matColor.lerpColors(new THREE.Color(theme.coreColor), new THREE.Color(theme.innerColor), (t - 0.25) / 0.4);
      } else {
        // Outer petals: rich rose velvet
        matColor.lerpColors(new THREE.Color(theme.innerColor), new THREE.Color(theme.outerColor), (t - 0.65) / 0.35);
      }

      const petalMaterial = new THREE.MeshStandardMaterial({
        color: matColor,
        roughness: theme.roughness,
        metalness: theme.metalness,
        side: THREE.DoubleSide,
        shadowSide: THREE.DoubleSide
      });

      const petalMesh = new THREE.Mesh(geom, petalMaterial);
      petalMesh.castShadow = true;
      petalMesh.receiveShadow = true;

      // Subtle natural spiral overlap twist
      petalMesh.rotation.y = 0.22 * (1.0 - 0.4 * t);

      // Decoupled Hierarchical Rig:
      // YawGroup: Heading around flower center
      const yawGroup = new THREE.Group();
      yawGroup.position.set(0, yOffset, 0);
      yawGroup.rotation.y = phi;

      // PitchGroup: Outward radial tilt
      const pitchGroup = new THREE.Group();
      pitchGroup.position.set(0, 0, radius);
      pitchGroup.rotation.x = THREE.MathUtils.lerp(tiltBud, tiltOpen, this.bloomProgress);

      pitchGroup.add(petalMesh);
      yawGroup.add(pitchGroup);
      this.flowerGroup.add(yawGroup);

      this.petals.push({
        yaw: yawGroup,
        pitch: pitchGroup,
        mesh: petalMesh,
        tiltBud: tiltBud,
        tiltOpen: tiltOpen,
        t: t,
        randomPhase: Math.random() * Math.PI * 2,
        randomSpeed: 0.8 + Math.random() * 0.4
      });
    }

    // Add Sepals (Calyx) under the blossom
    this.buildSepals();

    // Add Curved Stem & Sculpted Leaves
    this.buildStemAndLeaves();

    this.scene.add(this.flowerGroup);

    // Initial bloom update
    this.updateBloom();
  }

  buildSepals() {
    const sepalCount = 5;
    const sepalMat = new THREE.MeshStandardMaterial({
      color: 0x3b6635,
      roughness: 0.68,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < sepalCount; i++) {
      const angle = (i / sepalCount) * Math.PI * 2 + 0.3;
      const sepalGeom = this.createPetalGeometry(0.24, 0.65, 0.12, -0.15, 0.3);
      const sepalMesh = new THREE.Mesh(sepalGeom, sepalMat);

      const sepalYaw = new THREE.Group();
      sepalYaw.position.set(0, -0.05, 0);
      sepalYaw.rotation.y = angle;

      const sepalPitch = new THREE.Group();
      sepalPitch.position.set(0, 0, 0.24);
      // Sepals curve downward supporting the flower base
      sepalPitch.rotation.x = 1.35;

      sepalPitch.add(sepalMesh);
      sepalYaw.add(sepalPitch);
      this.flowerGroup.add(sepalYaw);
    }
  }

  buildStemAndLeaves() {
    // Curved organic stem
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.04, 0),
      new THREE.Vector3(0.04, -0.7, -0.05),
      new THREE.Vector3(-0.06, -1.5, 0.08),
      new THREE.Vector3(0.02, -2.4, -0.02)
    ]);

    const stemGeom = new THREE.TubeGeometry(curve, 32, 0.042, 12, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2b5226,
      roughness: 0.65,
      metalness: 0.05
    });
    const stem = new THREE.Mesh(stemGeom, stemMat);
    stem.castShadow = true;
    stem.receiveShadow = true;
    this.flowerGroup.add(stem);

    // Green Leaves
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x36632f,
      roughness: 0.58,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Leaf 1
    const leafGeom1 = this.createPetalGeometry(0.42, 0.80, 0.15, 0.10, 0.3);
    const leafMesh1 = new THREE.Mesh(leafGeom1, leafMat);
    const leafPivot1 = new THREE.Group();
    leafPivot1.position.set(0.04, -0.88, -0.05);
    leafPivot1.rotation.set(0.35, 0.9, -0.85);
    leafPivot1.add(leafMesh1);
    this.flowerGroup.add(leafPivot1);

    // Leaf 2
    const leafGeom2 = this.createPetalGeometry(0.38, 0.72, 0.14, 0.08, 0.3);
    const leafMesh2 = new THREE.Mesh(leafGeom2, leafMat);
    const leafPivot2 = new THREE.Group();
    leafPivot2.position.set(-0.05, -1.6, 0.06);
    leafPivot2.rotation.set(-0.25, -2.2, 0.85);
    leafPivot2.add(leafMesh2);
    this.flowerGroup.add(leafPivot2);
  }

  /*
   * 3D Floating / Falling Petals
   */
  initFallingPetals(count = 40) {
    const theme = this.themes[this.currentTheme];

    for (let i = 0; i < count; i++) {
      const geom = this.createPetalGeometry(0.32 + Math.random() * 0.18, 0.50 + Math.random() * 0.22, 0.20, 0.15, 0.5);
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? theme.outerColor : theme.innerColor,
        roughness: 0.45,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88
      });

      const mesh = new THREE.Mesh(geom, mat);

      mesh.position.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 - 2,
        (Math.random() - 0.5) * 5
      );

      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const scale = 0.42 + Math.random() * 0.42;
      mesh.scale.set(scale, scale, scale);

      this.scene.add(mesh);

      this.fallingPetals.push({
        mesh: mesh,
        vy: 0.007 + Math.random() * 0.010,
        vx: (Math.random() - 0.5) * 0.005,
        vz: (Math.random() - 0.5) * 0.005,
        rotSpeedX: (Math.random() - 0.5) * 0.016,
        rotSpeedY: (Math.random() - 0.5) * 0.016,
        rotSpeedZ: (Math.random() - 0.5) * 0.012,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: 1.4 + Math.random() * 1.6
      });
    }
  }

  /*
   * Burst interactive shower of petals
   */
  burstPetals(count = 35) {
    const theme = this.themes[this.currentTheme];
    const origin = new THREE.Vector3(-0.5, 0.2, 0);

    for (let i = 0; i < count; i++) {
      const geom = this.createPetalGeometry(0.3 + Math.random() * 0.16, 0.46 + Math.random() * 0.20, 0.20, 0.15, 0.5);
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.3 ? theme.outerColor : theme.innerColor,
        roughness: 0.4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(origin);
      mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

      const scale = 0.38 + Math.random() * 0.42;
      mesh.scale.set(scale, scale, scale);

      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.035 + Math.random() * 0.065;

      this.fallingPetals.push({
        mesh: mesh,
        vy: 0.025 + Math.random() * 0.04,
        vx: Math.cos(angle) * speed,
        vz: Math.sin(angle) * speed,
        rotSpeedX: (Math.random() - 0.5) * 0.05,
        rotSpeedY: (Math.random() - 0.5) * 0.05,
        rotSpeedZ: (Math.random() - 0.5) * 0.04,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: 2.8,
        isBurst: true
      });
    }
  }

  setTheme(themeName) {
    if (!this.themes[themeName]) return;
    this.currentTheme = themeName;
    const theme = this.themes[themeName];

    this.petals.forEach(p => {
      const matColor = new THREE.Color();
      if (p.t < 0.25) {
        matColor.setHex(theme.coreColor);
      } else if (p.t < 0.65) {
        matColor.lerpColors(new THREE.Color(theme.coreColor), new THREE.Color(theme.innerColor), (p.t - 0.25) / 0.4);
      } else {
        matColor.lerpColors(new THREE.Color(theme.innerColor), new THREE.Color(theme.outerColor), (p.t - 0.65) / 0.35);
      }
      p.mesh.material.color.copy(matColor);
      p.mesh.material.roughness = theme.roughness;
      p.mesh.material.metalness = theme.metalness;
    });

    if (this.innerGlowLight) {
      this.innerGlowLight.color.setHex(theme.glow);
    }

    this.fallingPetals.forEach(fp => {
      fp.mesh.material.color.setHex(Math.random() > 0.3 ? theme.outerColor : theme.innerColor);
    });
  }

  toggleBloom() {
    this.targetBloom = this.targetBloom > 0.5 ? 0.2 : 0.85;
  }

  setBloomProgress(val) {
    this.targetBloom = Math.max(0.15, Math.min(0.9, val));
  }

  updateBloom() {
    this.petals.forEach(p => {
      const tilt = THREE.MathUtils.lerp(p.tiltBud, p.tiltOpen, this.bloomProgress);
      p.pitch.rotation.x = tilt;
    });
  }

  addEventListeners() {
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.updateCameraPosition(w);
    });

    // Mouse drag rotation on the flower
    const onPointerDown = (e) => {
      this.isDragging = true;
      this.previousMousePosition = {
        x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
        y: e.clientY || (e.touches && e.touches[0].clientY) || 0
      };
    };

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const normX = (clientX / window.innerWidth) * 2 - 1;
      const normY = -(clientY / window.innerHeight) * 2 + 1;
      this.mouse.targetX = normX * 0.12;
      this.mouse.targetY = normY * 0.12;

      if (!this.isDragging) return;

      const deltaX = clientX - this.previousMousePosition.x;
      const deltaY = clientY - this.previousMousePosition.y;

      this.targetFlowerRotation.y += deltaX * 0.008;
      this.targetFlowerRotation.x += deltaY * 0.008;

      // Keep within comfortable viewing angles (from top-down to side view)
      this.targetFlowerRotation.x = Math.max(0.1, Math.min(1.2, this.targetFlowerRotation.x));

      this.previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth Bloom Interpolation
    if (Math.abs(this.bloomProgress - this.targetBloom) > 0.001) {
      this.bloomProgress += (this.targetBloom - this.bloomProgress) * 0.05;
      this.updateBloom();
    }

    // Smooth Flower Rotation damping
    this.flowerRotation.x += (this.targetFlowerRotation.x - this.flowerRotation.x) * 0.08;
    this.flowerRotation.y += (this.targetFlowerRotation.y - this.flowerRotation.y) * 0.08;

    // Organic idle breathing
    const breath = Math.sin(elapsedTime * 1.3) * 0.02;
    if (this.flowerGroup) {
      this.flowerGroup.rotation.x = this.flowerRotation.x + breath;
      this.flowerGroup.rotation.y = this.flowerRotation.y + Math.cos(elapsedTime * 0.6) * 0.02;
      this.flowerGroup.position.y = -0.4 + Math.sin(elapsedTime * 1.1) * 0.03;
    }

    // Individual petal subtle breeze flutter
    this.petals.forEach(p => {
      const flutter = Math.sin(elapsedTime * p.randomSpeed + p.randomPhase) * 0.015;
      p.mesh.rotation.z = flutter;
    });

    // Update Falling Petals
    this.fallingPetals.forEach((p, idx) => {
      if (p.isBurst) {
        p.vy -= 0.0007;
        p.vx *= 0.985;
        p.vz *= 0.985;
      }

      p.mesh.position.y -= p.vy;
      p.mesh.position.x += p.vx + Math.sin(elapsedTime * p.flutterSpeed + p.flutterPhase) * 0.003;
      p.mesh.position.z += p.vz;

      p.mesh.rotation.x += p.rotSpeedX;
      p.mesh.rotation.y += p.rotSpeedY;
      p.mesh.rotation.z += p.rotSpeedZ;

      if (p.mesh.position.y < -3.5) {
        if (p.isBurst) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          this.fallingPetals.splice(idx, 1);
        } else {
          p.mesh.position.y = 3.5 + Math.random() * 2;
          p.mesh.position.x = (Math.random() - 0.5) * 8;
          p.mesh.position.z = (Math.random() - 0.5) * 5;
        }
      }
    });

    // Soft inner glow pulsing
    if (this.innerGlowLight) {
      this.innerGlowLight.intensity = 2.0 + Math.sin(elapsedTime * 2.2) * 0.5;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
