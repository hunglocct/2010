// tulip-garden.js - 3D Blue Tulip Garden Diorama in the aesthetic of Image 2 (Crystal Conservatory)
// Powered by real botanical textures extracted from Plant_B090543152 (Tulipa batalinii)
const THREE = window.THREE;

export class TulipGardenScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.worldGroup = null;
    this.tulips = [];
    this.clock = new THREE.Clock();

    // Interaction & Animation States
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };
    this.targetRotation = { x: 0.36, y: 0.0 };
    this.currentRotation = { x: 0.36, y: 0.0 };

    // Diorama Parameters
    this.luminescence = 0.4;
    this.windSpeed = 0.65;
    this.isCanopyVisible = true;
    this.isPaused = false;

    // Camera viewpoints: Centered frontal hero view (Góc chính diện)
    this.views = {
      overview: { pos: new THREE.Vector3(0, 4.6, 9.6), target: new THREE.Vector3(0, -0.6, 0) },
      detail: { pos: new THREE.Vector3(0, 1.3, 4.2), target: new THREE.Vector3(0, -0.8, 0.4) }
    };
    this.currentCameraTarget = this.views.overview.target.clone();

    // Load authentic textures from Plant_B090543152
    this.loadTextures();

    this.init();
  }

  loadTextures() {
    const loader = new THREE.TextureLoader();
    this.textures = {
      petalBlue: loader.load('assets/tulip/petal_blue.png'),
      petalSapphire: loader.load('assets/tulip/petal_sapphire.png'),
      petalCyan: loader.load('assets/tulip/petal_cyan.png'),
      petalPink: loader.load('assets/tulip/petal_pink.png'),
      petalBump: loader.load('assets/tulip/petal_bump.png'),
      leaf1: loader.load('assets/tulip/leaf1.png'),
      leaf2: loader.load('assets/tulip/leaf2.png'),
      stem: loader.load('assets/tulip/stem.png')
    };

    // Configure textures
    Object.values(this.textures).forEach(tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
    });
  }

  init() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x081316, 0.015);

    const initialFov = isMobile ? 54 : 40;
    this.camera = new THREE.PerspectiveCamera(initialFov, width / height, 0.1, 100);
    this.camera.position.copy(this.views.overview.pos);
    this.camera.lookAt(this.views.overview.target);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.setupLighting();
    this.buildDiorama();
    this.addEventListeners();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x82b5b8, 1.25);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xbbe6e8, 2.2);
    key.position.set(5, 9, 6);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x38bdf8, 1.3);
    fill.position.set(-6, 3, -4);
    this.scene.add(fill);

    const accent = new THREE.DirectionalLight(0xfef08a, 0.6);
    accent.position.set(0, -4, 4);
    this.scene.add(accent);

    // Moonlight rim light from upper rear
    const moonRim = new THREE.DirectionalLight(0xa5f3fc, 1.5);
    moonRim.position.set(2.8, 6.5, -7.5);
    this.scene.add(moonRim);
  }

  createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2b4d42';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      const g = 80 + Math.floor(Math.random() * 55);
      const b = 65 + Math.floor(Math.random() * 45);
      ctx.fillStyle = `rgba(35, ${g}, ${b}, 0.22)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    return tex;
  }

  buildDiorama() {
    this.worldGroup = new THREE.Group();

    // 1. Earth Bedrock Pedestal
    const earthMat = new THREE.MeshStandardMaterial({ color: 0x162624, roughness: 0.92, metalness: 0.05 });
    const earth = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 2.9, 0.6, 84), earthMat);
    earth.position.set(0, -1.88, 0);
    earth.receiveShadow = true;
    this.worldGroup.add(earth);

    // 2. Grassy Top Soil
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d6652, roughness: 0.95, map: this.createGrassTexture() });
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(3.32, 3.3, 0.1, 84), soilMat);
    soil.position.set(0, -1.55, 0);
    soil.receiveShadow = true;
    this.worldGroup.add(soil);

    // 3. Central Water Pond
    this.buildPond();
    this.buildWaterLilies();

    // 4. Stepping Stones around Pond
    this.buildPondStones();

    // 5. Arched Wooden Bridge
    this.buildBridge();

    // 6. Ancient Stone Canopy Archway & Columns
    this.buildStoneCanopy();

    // 7. Bioluminescent Mushrooms & Crystals
    this.buildMushrooms();
    this.buildCrystals();

    // 8. The Blue Tulip Garden with Plant_B090543152 Textures
    this.buildTulipGarden();

    // 9. Floating Fairy Light Motes
    this.buildFairyMotes();

    // 10. Satellite Floating Islands & Cloud Mist
    this.buildSatelliteIslands();
    this.buildCloudMist();

    // 11. Celestial Starfield & Moon in Background
    this.buildCelestialBackground();

    this.scene.add(this.worldGroup);
  }

  buildPond() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, '#22d3ee');
    grad.addColorStop(0.6, '#0891b2');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const waterTex = new THREE.CanvasTexture(canvas);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x168087,
      roughness: 0.15,
      metalness: 0.25,
      map: waterTex,
      transparent: true,
      opacity: 0.92
    });

    this.pondMesh = new THREE.Mesh(new THREE.CircleGeometry(1.05, 64), waterMat);
    this.pondMesh.position.set(0.0, -1.52, 0.35);
    this.pondMesh.rotation.x = -Math.PI / 2;
    this.pondMesh.scale.set(1.45, 1.15, 1);
    this.worldGroup.add(this.pondMesh);
  }

  buildPondStones() {
    const stoneGeom = new THREE.IcosahedronGeometry(0.14, 1);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6e8074, roughness: 0.85 });

    const count = 44;
    const instancedStones = new THREE.InstancedMesh(stoneGeom, stoneMat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x = 0.0 + 1.58 * Math.cos(a) + (Math.random() - 0.5) * 0.08;
      const z = 0.35 + 1.25 * Math.sin(a) + (Math.random() - 0.5) * 0.08;
      dummy.position.set(x, -1.50, z);
      dummy.scale.set(1.0 + Math.random() * 0.5, 0.6 + Math.random() * 0.5, 0.9 + Math.random() * 0.4);
      dummy.rotation.set(Math.random(), Math.random() * 3, Math.random());
      dummy.updateMatrix();
      instancedStones.setMatrixAt(i, dummy.matrix);
    }

    instancedStones.castShadow = true;
    instancedStones.receiveShadow = true;
    this.worldGroup.add(instancedStones);
  }

  buildBridge() {
    const bridgeGroup = new THREE.Group();
    // Anchor the bridge firmly at ground level in the center
    bridgeGroup.position.set(0.0, -1.50, 0.88);
    bridgeGroup.rotation.y = 0.0;

    const span = 1.62;
    const halfSpan = span / 2;
    const archMaxH = 0.28;
    const bridgeWidth = 0.46;
    const halfWidth = bridgeWidth / 2;

    const archY = (x) => {
      const t = x / halfSpan;
      return Math.max(0, archMaxH * (1 - t * t));
    };

    // Materials with authentic rich cedar timber & brass fittings
    const woodDeck1 = new THREE.MeshStandardMaterial({ color: 0x824927, roughness: 0.72, metalness: 0.05 });
    const woodDeck2 = new THREE.MeshStandardMaterial({ color: 0x6e3b1c, roughness: 0.75, metalness: 0.05 });
    const woodBeamMat = new THREE.MeshStandardMaterial({ color: 0x542c14, roughness: 0.8, metalness: 0.05 });
    const handrailMat = new THREE.MeshStandardMaterial({ color: 0x7a4322, roughness: 0.6, metalness: 0.1 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.75 });
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffea78,
      emissive: 0xffaa22,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });

    // 1. Two curved longitudinal arch beams (girders) underneath
    [-halfWidth + 0.02, halfWidth - 0.02].forEach(z => {
      const beamPts = [];
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const bx = -halfSpan + (s / steps) * span;
        const by = archY(bx) - 0.038;
        beamPts.push(new THREE.Vector3(bx, by, z));
      }
      const beamCurve = new THREE.CatmullRomCurve3(beamPts);
      const beamGeom = new THREE.TubeGeometry(beamCurve, 28, 0.028, 8, false);
      const beamMesh = new THREE.Mesh(beamGeom, woodBeamMat);
      beamMesh.castShadow = true;
      beamMesh.receiveShadow = true;
      bridgeGroup.add(beamMesh);
    });

    // 2. Transverse deck planks neatly laid along the arch with tangent rotation
    const plankCount = 17;
    for (let i = 0; i < plankCount; i++) {
      const x = -halfSpan + 0.05 + (i / (plankCount - 1)) * (span - 0.1);
      const y = archY(x);

      // Slope derivative: dy/dx = -2 * archMaxH * x / (halfSpan^2)
      const slope = -2 * archMaxH * x / (halfSpan * halfSpan);
      const angle = Math.atan(slope);

      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(0.082, 0.032, bridgeWidth),
        i % 2 === 0 ? woodDeck1 : woodDeck2
      );
      plank.position.set(x, y + 0.016, 0);
      plank.rotation.z = angle;
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }

    // 3. Pier foundation piles rooted in the pond bed & bank
    const pierX = [-halfSpan * 0.52, halfSpan * 0.52];
    pierX.forEach(px => {
      [-halfWidth + 0.02, halfWidth - 0.02].forEach(pz => {
        const topY = archY(px) - 0.02;
        const bottomY = -0.32; // anchored deep into soil/pond bed
        const h = topY - bottomY;
        const postGeom = new THREE.CylinderGeometry(0.022, 0.024, h, 8);
        const post = new THREE.Mesh(postGeom, woodBeamMat);
        post.position.set(px, bottomY + h / 2, pz);
        post.castShadow = true;
        bridgeGroup.add(post);

        // Brass waterline collar ring
        const ringGeom = new THREE.TorusGeometry(0.026, 0.006, 6, 12);
        const ring = new THREE.Mesh(ringGeom, brassMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(px, -0.02, pz); // near water level
        bridgeGroup.add(ring);
      });
    });

    // 4. Balustrade posts & decorative finials
    const postCount = 6;
    for (let i = 0; i < postCount; i++) {
      const px = -halfSpan + 0.08 + (i / (postCount - 1)) * (span - 0.16);
      const py = archY(px);

      [-halfWidth, halfWidth].forEach((pz, sideIdx) => {
        const postH = 0.32;
        const postGeom = new THREE.CylinderGeometry(0.015, 0.015, postH, 8);
        const post = new THREE.Mesh(postGeom, woodBeamMat);
        post.position.set(px, py + postH / 2, pz);
        post.castShadow = true;
        bridgeGroup.add(post);

        // Brass finial ball on top
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), brassMat);
        finial.position.set(px, py + postH + 0.02, pz);
        bridgeGroup.add(finial);

        // Add romantic glowing lanterns to the 2 front bridge entry posts
        if ((i === 0 || i === postCount - 1) && sideIdx === 1) {
          const lantern = new THREE.Group();
          lantern.position.set(px, py + postH + 0.05, pz);

          const lanternGlass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.022, 0.018, 0.045, 6),
            lanternGlowMat
          );
          lantern.add(lanternGlass);

          const lanternCap = new THREE.Mesh(
            new THREE.ConeGeometry(0.034, 0.025, 6),
            woodBeamMat
          );
          lanternCap.position.y = 0.035;
          lantern.add(lanternCap);

          const lanternLight = new THREE.PointLight(0xffbe55, 0.4, 1.4);
          lanternLight.position.y = 0;
          lantern.add(lanternLight);

          bridgeGroup.add(lantern);
        }
      });
    }

    // 5. Arched Handrails (Top rail & Mid rail) following the arch curve
    [-halfWidth, halfWidth].forEach(pz => {
      const topPts = [];
      const midPts = [];
      const steps = 20;
      for (let s = 0; s <= steps; s++) {
        const rx = -halfSpan + 0.06 + (s / steps) * (span - 0.12);
        const ry = archY(rx);
        topPts.push(new THREE.Vector3(rx, ry + 0.32, pz));
        midPts.push(new THREE.Vector3(rx, ry + 0.16, pz));
      }
      const topCurve = new THREE.CatmullRomCurve3(topPts);
      const topRail = new THREE.Mesh(
        new THREE.TubeGeometry(topCurve, 28, 0.014, 8, false),
        handrailMat
      );
      topRail.castShadow = true;
      bridgeGroup.add(topRail);

      const midCurve = new THREE.CatmullRomCurve3(midPts);
      const midRail = new THREE.Mesh(
        new THREE.TubeGeometry(midCurve, 24, 0.009, 8, false),
        handrailMat
      );
      bridgeGroup.add(midRail);
    });

    // 6. Natural stone landing thresholds at both bridge entrances
    [-halfSpan - 0.02, halfSpan + 0.02].forEach(sx => {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a6d63, roughness: 0.88 });
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, bridgeWidth + 0.06), stoneMat);
      step.position.set(sx, 0.01, 0);
      step.receiveShadow = true;
      bridgeGroup.add(step);
    });

    this.worldGroup.add(bridgeGroup);
  }

  buildStoneCanopy() {
    this.canopyGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x384a4d, roughness: 0.88, metalness: 0.05 });
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x6e8478, roughness: 0.6, metalness: 0.12 });

    for (let i = 0; i < 13; i++) {
      const a = 0.08 + (i / 12) * Math.PI;
      const b = 2.65 + Math.sin(i * 7) * 0.15;
      const h = 1.1 + Math.sin(i * 0.38) * 1.5;

      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.46, h, 6, 1), stoneMat);
      column.position.set(Math.cos(a) * b, h / 2 - 1.55, -Math.sin(a) * b);
      column.rotation.y = i * 0.7;
      column.castShadow = true;
      column.receiveShadow = true;
      this.canopyGroup.add(column);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.30, 0.024, 6), bandMat);
      band.position.set(column.position.x, h * 0.68 - 1.55, column.position.z);
      band.rotation.y = column.rotation.y;
      this.canopyGroup.add(band);
    }

    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.3, -1.5, -2.1),
      new THREE.Vector3(-0.9, 0.8, -2.3),
      new THREE.Vector3(0, 1.45, -2.4),
      new THREE.Vector3(0.9, 0.8, -2.3),
      new THREE.Vector3(1.3, -1.5, -2.1)
    ]);
    const archGeom = new THREE.TubeGeometry(archCurve, 32, 0.22, 8, false);
    const arch = new THREE.Mesh(archGeom, stoneMat);
    arch.castShadow = true;
    this.canopyGroup.add(arch);

    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x7ef2e3,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), orbMat);
    orb.position.set(0, 1.58, -2.38);
    this.canopyGroup.add(orb);

    this.worldGroup.add(this.canopyGroup);
  }

  buildMushrooms() {
    const count = 35;
    const capGeom = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x5eead4,
      emissive: 0x2dd4bf,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });
    this.mushroomCaps = new THREE.InstancedMesh(capGeom, capMat, count);

    const stemGeom = new THREE.CylinderGeometry(0.016, 0.022, 1, 8);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x99b8a8, roughness: 0.7 });
    const mushroomStems = new THREE.InstancedMesh(stemGeom, stemMat, count);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 1.9 + Math.random() * 0.95;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      const h = 0.12 + Math.random() * 0.28;

      dummy.position.set(x, -1.52 + h, z);
      dummy.scale.set(h * 0.45, h * 0.22, h * 0.45);
      dummy.rotation.set(0, Math.random() * 6, 0);
      dummy.updateMatrix();
      this.mushroomCaps.setMatrixAt(i, dummy.matrix);

      dummy.position.y = -1.52 + h / 2;
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      mushroomStems.setMatrixAt(i, dummy.matrix);
    }

    this.mushroomCaps.castShadow = true;
    this.worldGroup.add(this.mushroomCaps, mushroomStems);
  }

  /*
   * 3D Tulip Petal Geometry with precise UV mapping to the Plant_B090543152 texture
   */
  createTexturedPetalGeometry(width, length, cupDepth) {
    const uSegments = 16;
    const vSegments = 12;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments; // 0 (base) -> 1 (tip)

      // Tulip width silhouette
      const w = width * Math.sin(Math.pow(u, 0.5) * Math.PI * 0.85);

      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments) * 2 - 1; // -1 to +1

        const x = v * (w * 0.5);
        const y = u * length;

        // Inward cup forming egg shape
        const cup = -cupDepth * (1.0 - v * v) * Math.sin(u * Math.PI);
        const tipInward = -0.06 * Math.pow(u, 2.2);
        const z = cup + tipInward;

        positions.push(x, y, z);
        // Map UV coordinates (v: 0->1 horizontally, u: 0->1 vertically)
        uvs.push((v + 1) * 0.5, u);
      }
    }

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

  createTexturedLeafGeometry(width, length) {
    const uSegments = 18;
    const vSegments = 8;
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= uSegments; i++) {
      const u = i / uSegments;
      const w = width * Math.sin(Math.pow(u, 0.42) * Math.PI);

      for (let j = 0; j <= vSegments; j++) {
        const v = (j / vSegments) * 2 - 1;

        const x = v * (w * 0.5);
        const y = u * length;
        // Arching outward
        const z = -0.19 * length * Math.sin(u * Math.PI * 0.65) * (1.0 - 0.25 * v * v);

        positions.push(x, y, z);
        uvs.push((v + 1) * 0.5, u);
      }
    }

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

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /*
   * Build an authentic Tulip using textures from Plant_B090543152
   */
  createTulip(petalTex, emissiveColor, scale = 1.0) {
    const tulipGroup = new THREE.Group();

    // Material using actual petal texture from Plant_B090543152
    const petalMat = new THREE.MeshStandardMaterial({
      map: petalTex,
      bumpMap: this.textures.petalBump,
      bumpScale: 0.02,
      emissive: emissiveColor,
      emissiveIntensity: this.luminescence,
      roughness: 0.35,
      metalness: 0.04,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.05
    });

    const blossomGroup = new THREE.Group();
    const petalW = 0.30 * scale;
    const petalH = 0.54 * scale;
    const petalCup = 0.15 * scale;
    const petalGeom = this.createTexturedPetalGeometry(petalW, petalH, petalCup);

    // 6 Petals in 2 alternating whorls (3 inner, 3 outer)
    for (let i = 0; i < 6; i++) {
      const isOuter = (i % 2 === 1);
      const angle = (i * Math.PI) / 3;
      const radius = isOuter ? 0.068 * scale : 0.052 * scale;

      const petalMesh = new THREE.Mesh(petalGeom, petalMat);
      petalMesh.castShadow = true;

      const petalPivot = new THREE.Group();
      petalPivot.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      petalPivot.rotation.y = -angle + Math.PI / 2;
      petalPivot.rotation.x = isOuter ? 0.07 : 0.02;

      petalPivot.add(petalMesh);
      blossomGroup.add(petalPivot);
    }

    // Glowing Golden Stamen inside tulip
    const stamenMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xeab308,
      emissiveIntensity: 0.5,
      roughness: 0.2
    });
    const stamen = new THREE.Mesh(new THREE.CylinderGeometry(0.015 * scale, 0.015 * scale, 0.18 * scale, 6), stamenMat);
    stamen.position.set(0, 0.09 * scale, 0);
    blossomGroup.add(stamen);

    // Stem using actual stem texture from Plant_B090543152
    const stemH = (0.75 + Math.random() * 0.45) * scale;
    const stemMat = new THREE.MeshStandardMaterial({
      map: this.textures.stem,
      roughness: 0.65,
      side: THREE.DoubleSide
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.026 * scale, 0.032 * scale, stemH, 8), stemMat);
    stem.position.set(0, stemH / 2, 0);
    stem.castShadow = true;
    tulipGroup.add(stem);

    blossomGroup.position.set(0, stemH, 0);
    tulipGroup.add(blossomGroup);

    // Leaves using actual leaf textures from Plant_B090543152
    const leafMat1 = new THREE.MeshStandardMaterial({
      map: this.textures.leaf1,
      roughness: 0.58,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.05
    });
    const leafGeom1 = this.createTexturedLeafGeometry(0.25 * scale, stemH * 0.9);
    const leaf1 = new THREE.Mesh(leafGeom1, leafMat1);
    leaf1.position.set(0, stemH * 0.08, 0);
    leaf1.rotation.y = Math.random() * Math.PI * 2;
    leaf1.rotation.x = 0.22;
    tulipGroup.add(leaf1);

    const leafMat2 = new THREE.MeshStandardMaterial({
      map: this.textures.leaf2,
      roughness: 0.58,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.05
    });
    const leafGeom2 = this.createTexturedLeafGeometry(0.23 * scale, stemH * 0.75);
    const leaf2 = new THREE.Mesh(leafGeom2, leafMat2);
    leaf2.position.set(0, stemH * 0.14, 0);
    leaf2.rotation.y = leaf1.rotation.y + Math.PI * 0.85;
    leaf2.rotation.x = 0.20;
    tulipGroup.add(leaf2);

    return {
      group: tulipGroup,
      blossom: blossomGroup,
      petalMaterial: petalMat,
      phase: Math.random() * Math.PI * 2,
      swaySpeed: 1.2 + Math.random() * 0.8
    };
  }

  buildTulipGarden() {
    this.tulips = [];

    const blueTex = this.textures.petalBlue;
    const sapphireTex = this.textures.petalSapphire;
    const cyanTex = this.textures.petalCyan;
    const pinkTex = this.textures.petalPink;

    const flowerSpots = [];

    // 1. FRONT-LEFT EMPTY MEADOW - 14 pink tulips filling empty meadow
    for (let k = 0; k < 14; k++) {
      const a = 1.6 + (k / 13) * 1.3;
      const rad = 1.35 + (k % 3) * 0.42;
      const x = Math.cos(a) * rad - 0.2;
      const z = Math.sin(a) * rad + 0.45;
      flowerSpots.push({
        x, z,
        tex: pinkTex,
        emissive: k % 2 === 0 ? 0xf43f5e : 0xec4899,
        scale: 0.75 + Math.random() * 0.4
      });
    }

    // 2. FRONT-RIGHT EMPTY MEADOW - 14 pink tulips filling empty meadow
    for (let k = 0; k < 14; k++) {
      const a = 0.2 + (k / 13) * 1.3;
      const rad = 1.35 + (k % 3) * 0.42;
      const x = Math.cos(a) * rad + 0.2;
      const z = Math.sin(a) * rad + 0.45;
      flowerSpots.push({
        x, z,
        tex: pinkTex,
        emissive: k % 2 === 0 ? 0xf43f5e : 0xf472b6,
        scale: 0.75 + Math.random() * 0.4
      });
    }

    // 3. FLANKING BRIDGE ENTRANCE - 8 flowers (mostly pink) welcoming to bridge
    const bridgeFlankers = [
      { x: -0.92, z: 0.78, isPink: true },
      { x: -0.75, z: 1.05, isPink: true },
      { x: -0.55, z: 1.30, isPink: false },
      { x: -0.85, z: 1.45, isPink: true },
      { x: 0.92, z: 0.78, isPink: true },
      { x: 0.75, z: 1.05, isPink: true },
      { x: 0.55, z: 1.30, isPink: false },
      { x: 0.85, z: 1.45, isPink: true }
    ];
    bridgeFlankers.forEach(bf => {
      flowerSpots.push({
        x: bf.x,
        z: bf.z,
        tex: bf.isPink ? pinkTex : cyanTex,
        emissive: bf.isPink ? 0xf43f5e : 0x0f766e,
        scale: 0.8 + Math.random() * 0.35
      });
    });

    // 4. MID-LEFT MAIN GARDEN BED - 16 flowers (blue, sapphire & pink)
    for (let k = 0; k < 16; k++) {
      const x = -1.1 - Math.random() * 1.4;
      const z = -0.1 - Math.random() * 1.2;
      const isPink = k % 3 === 0;
      flowerSpots.push({
        x, z,
        tex: isPink ? pinkTex : (k % 2 === 0 ? blueTex : sapphireTex),
        emissive: isPink ? 0xec4899 : (k % 2 === 0 ? 0x0284c7 : 0x075985),
        scale: 0.75 + Math.random() * 0.42
      });
    }

    // 5. MID-RIGHT MAIN GARDEN BED - 16 flowers (blue, sapphire & pink)
    for (let k = 0; k < 16; k++) {
      const x = 1.1 + Math.random() * 1.4;
      const z = -0.1 - Math.random() * 1.2;
      const isPink = k % 3 === 0;
      flowerSpots.push({
        x, z,
        tex: isPink ? pinkTex : (k % 2 === 0 ? blueTex : cyanTex),
        emissive: isPink ? 0xf43f5e : (k % 2 === 0 ? 0x0284c7 : 0x0f766e),
        scale: 0.75 + Math.random() * 0.42
      });
    }

    // 6. BACK SANCTUARY NEAR ARCHWAY - 12 flowers
    for (let k = 0; k < 12; k++) {
      const x = -1.6 + (k / 11) * 3.2 + (Math.random() - 0.5) * 0.2;
      const z = -1.4 - Math.random() * 0.9;
      const isPink = k % 3 === 0;
      flowerSpots.push({
        x, z,
        tex: isPink ? pinkTex : blueTex,
        emissive: isPink ? 0xf43f5e : 0x0369a1,
        scale: 0.75 + Math.random() * 0.4
      });
    }

    // Spawn flowers and ensure pond distance clearance
    flowerSpots.forEach(sp => {
      const pDist = Math.sqrt((sp.x) ** 2 + ((sp.z - 0.35) * 1.3) ** 2);
      if (pDist < 0.85) {
        sp.x += sp.x >= 0 ? 0.65 : -0.65;
      }
      const d = Math.sqrt(sp.x * sp.x + sp.z * sp.z);
      if (d > 3.05) {
        sp.x *= (2.95 / d);
        sp.z *= (2.95 / d);
      }

      const tulip = this.createTulip(sp.tex, sp.emissive, sp.scale);
      tulip.group.position.set(sp.x, -1.52, sp.z);
      tulip.group.rotation.set((Math.random() - 0.5) * 0.12, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.12);
      this.worldGroup.add(tulip.group);
      this.tulips.push(tulip);
    });
  }

  buildFairyMotes() {
    const count = 260;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(0x7ef2e3);
    const c2 = new THREE.Color(0xfef08a);
    const c3 = new THREE.Color(0x38bdf8);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7.5;
      positions[i * 3 + 1] = -1.6 + Math.random() * 4.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7.0;

      const pick = Math.random();
      const col = pick < 0.6 ? c1 : (pick < 0.85 ? c2 : c3);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const motesMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.052,
      transparent: true,
      opacity: 0.82,
      depthWrite: false
    });

    this.fairyMotes = new THREE.Points(geom, motesMat);
    this.worldGroup.add(this.fairyMotes);
  }

  buildWaterLilies() {
    const lilyGroup = new THREE.Group();
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1b4a3a,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xfdf2f8,
      emissive: 0xec4899,
      emissiveIntensity: 0.45,
      roughness: 0.3
    });

    const stamenMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    const padPositions = [
      { x: 0.55, z: 0.15, r: 0.16 },
      { x: -0.10, z: 0.65, r: 0.19 },
      { x: 0.90, z: 0.60, r: 0.15 },
      { x: -0.28, z: 0.22, r: 0.18 },
      { x: 0.40, z: 0.88, r: 0.14 },
      { x: 0.12, z: 0.32, r: 0.12 }
    ];

    padPositions.forEach((pos, idx) => {
      const padGeom = new THREE.CircleGeometry(pos.r, 24, 0.25, Math.PI * 1.85);
      const pad = new THREE.Mesh(padGeom, padMat);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = Math.random() * Math.PI * 2;
      pad.position.set(pos.x, -1.508, pos.z);
      pad.receiveShadow = true;
      lilyGroup.add(pad);

      if (idx === 0 || idx === 1) {
        const lotus = new THREE.Group();
        lotus.position.set(pos.x, -1.505, pos.z);

        const petalCount = 8;
        for (let p = 0; p < petalCount; p++) {
          const angle = (p / petalCount) * Math.PI * 2;
          const petalGeom = new THREE.ConeGeometry(0.022, 0.065, 5);
          const petal = new THREE.Mesh(petalGeom, flowerMat);
          petal.position.set(Math.cos(angle) * 0.025, 0.025, Math.sin(angle) * 0.025);
          petal.rotation.x = 0.55;
          petal.rotation.y = angle;
          lotus.add(petal);
        }

        const centerStamen = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), stamenMat);
        centerStamen.position.set(0, 0.028, 0);
        lotus.add(centerStamen);

        const lotusGlow = new THREE.PointLight(0xf472b6, 0.35, 0.8);
        lotusGlow.position.set(0, 0.06, 0);
        lotus.add(lotusGlow);

        lilyGroup.add(lotus);
      }
    });

    this.worldGroup.add(lilyGroup);
  }

  buildCrystals() {
    const crystalGroup = new THREE.Group();
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.12,
      metalness: 0.25,
      transparent: true,
      opacity: 0.92
    });

    const clusterCenters = [
      { x: -1.4, z: -1.0 },
      { x: 1.5, z: -0.9 },
      { x: -1.8, z: 0.8 },
      { x: 1.8, z: 0.9 }
    ];

    clusterCenters.forEach(center => {
      const count = 3 + Math.floor(Math.random() * 3);
      for (let c = 0; c < count; c++) {
        const h = 0.18 + Math.random() * 0.28;
        const r = 0.025 + Math.random() * 0.02;
        const geom = new THREE.CylinderGeometry(r * 0.5, r, h, 6);
        const mesh = new THREE.Mesh(geom, crystalMat);
        const ox = (Math.random() - 0.5) * 0.25;
        const oz = (Math.random() - 0.5) * 0.25;
        mesh.position.set(center.x + ox, -1.50 + h / 2, center.z + oz);
        mesh.rotation.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI, (Math.random() - 0.5) * 0.35);
        mesh.castShadow = true;
        crystalGroup.add(mesh);
      }
    });

    this.worldGroup.add(crystalGroup);
  }

  buildSatelliteIslands() {
    this.satelliteIslands = [];
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x162624, roughness: 0.92, metalness: 0.05 });
    const mossMat = new THREE.MeshStandardMaterial({ color: 0x365e4d, roughness: 0.95 });
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x7ef2e3,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    // Kept in deep background depths so they never block frontal diorama view
    const islandConfigs = [
      { x: -4.2, y: -1.6, z: -4.5, r: 0.45, h: 0.65, speed: 0.7, phase: 0 },
      { x: 4.2, y: -1.4, z: -4.8, r: 0.48, h: 0.7, speed: 0.85, phase: 1.8 },
      { x: 0.0, y: -2.0, z: -5.5, r: 0.40, h: 0.6, speed: 0.6, phase: 3.5 }
    ];

    islandConfigs.forEach(cfg => {
      const miniGroup = new THREE.Group();
      miniGroup.position.set(cfg.x, cfg.y, cfg.z);

      const rockGeom = new THREE.ConeGeometry(cfg.r, cfg.h, 7);
      rockGeom.rotateX(Math.PI);
      const rock = new THREE.Mesh(rockGeom, rockMat);
      rock.position.y = -cfg.h / 2;
      rock.castShadow = true;
      miniGroup.add(rock);

      const capGeom = new THREE.CylinderGeometry(cfg.r * 1.02, cfg.r * 0.95, 0.08, 8);
      const cap = new THREE.Mesh(capGeom, mossMat);
      cap.position.y = 0.04;
      cap.receiveShadow = true;
      miniGroup.add(cap);

      const crystal = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.22, 6), crystalMat);
      crystal.position.set(0.06, 0.15, -0.04);
      crystal.rotation.set(0.15, 0.4, -0.2);
      miniGroup.add(crystal);

      const pLight = new THREE.PointLight(0x38bdf8, 0.25, 1.2);
      pLight.position.set(0, 0.25, 0);
      miniGroup.add(pLight);

      this.worldGroup.add(miniGroup);
      this.satelliteIslands.push({ mesh: miniGroup, baseY: cfg.y, speed: cfg.speed, phase: cfg.phase });
    });
  }

  buildCloudMist() {
    const mistGroup = new THREE.Group();
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x1f474d,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });

    for (let i = 0; i < 4; i++) {
      const r = 3.3 + i * 0.35;
      const mistRing = new THREE.Mesh(new THREE.TorusGeometry(r, 0.28, 8, 36), mistMat);
      mistRing.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.1;
      mistRing.position.set(0, -2.15 - i * 0.18, 0);
      mistGroup.add(mistRing);
    }

    this.worldGroup.add(mistGroup);
  }

  buildCelestialBackground() {
    const bgGroup = new THREE.Group();

    // 1. Celestial Moon centered directly above stone archway
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
      transparent: true,
      opacity: 0.96
    });
    this.moonMesh = new THREE.Mesh(new THREE.CircleGeometry(0.95, 36), moonMat);
    this.moonMesh.position.set(0.0, 5.8, -8.6);
    bgGroup.add(this.moonMesh);

    // Glowing Moon Halos
    const haloMat1 = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    this.moonHalo = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.8, 36), haloMat1);
    this.moonHalo.position.copy(this.moonMesh.position);
    this.moonHalo.position.z -= 0.05;
    bgGroup.add(this.moonHalo);

    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide
    });
    const haloOuter = new THREE.Mesh(new THREE.RingGeometry(1.8, 3.2, 36), haloMat2);
    haloOuter.position.copy(this.moonHalo.position);
    haloOuter.position.z -= 0.05;
    bgGroup.add(haloOuter);

    // 2. Cosmic Starfield (650 shimmering stars)
    const starCount = 650;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xbae6fd),
      new THREE.Color(0x7dd3fc),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xfbcfe8)
    ];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 18.0 + Math.random() * 16.0;

      const sx = radius * Math.sin(phi) * Math.cos(theta);
      const sy = radius * Math.sin(phi) * Math.sin(theta);
      const sz = radius * Math.cos(phi);

      starPositions[i * 3] = sx;
      starPositions[i * 3 + 1] = sy;
      starPositions[i * 3 + 2] = sz;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.065,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });

    this.starfield = new THREE.Points(starGeom, starMat);
    bgGroup.add(this.starfield);

    this.scene.add(bgGroup);
  }

  setLuminescence(val) {
    this.luminescence = val;
    this.tulips.forEach(t => {
      t.petalMaterial.emissiveIntensity = val;
    });
    if (this.mushroomCaps) {
      this.mushroomCaps.material.emissiveIntensity = val * 0.8;
    }
  }

  setWindSpeed(val) {
    this.windSpeed = val;
  }

  toggleCanopy() {
    this.isCanopyVisible = !this.isCanopyVisible;
    if (this.canopyGroup) {
      this.canopyGroup.visible = this.isCanopyVisible;
    }
    return this.isCanopyVisible;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setCameraView(viewName) {
    const view = this.views[viewName];
    if (!view) return;
    this.targetCameraPos = view.pos.clone();
    this.targetCameraTarget = view.target.clone();
  }

  resetView() {
    this.setCameraView('overview');
    this.targetRotation = { x: 0.36, y: 0.0 };
    this.rotationVelocity = { x: 0, y: 0 };
  }

  addEventListeners() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.fov = (w < 768) ? 54 : 40;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    const getPos = (e) => {
      if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    };

    const onDown = (e) => {
      this.isDragging = true;
      this.rotationVelocity = { x: 0, y: 0 };
      const p = getPos(e);
      this.previousMousePosition = { x: p.x, y: p.y };
    };

    const onMove = (e) => {
      if (!this.isDragging) return;
      const p = getPos(e);
      const deltaX = p.x - this.previousMousePosition.x;
      const deltaY = p.y - this.previousMousePosition.y;

      // Sensitivity tuned for smooth 360 rotation on touch and mouse
      const sens = (window.innerWidth < 768) ? 0.010 : 0.008;
      this.targetRotation.y += deltaX * sens;
      this.targetRotation.x += deltaY * sens;
      this.targetRotation.x = Math.max(0.08, Math.min(0.92, this.targetRotation.x));

      // Calculate inertia momentum velocity for ultra-smooth 360 spinning
      this.rotationVelocity = {
        x: deltaY * sens * 0.25,
        y: deltaX * sens * 0.35
      };

      this.previousMousePosition = { x: p.x, y: p.y };
    };

    const onUp = () => {
      this.isDragging = false;
    };

    // Mouse listeners
    this.canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    // Touch listeners on canvas & window with smooth 360 gestures & pinch-to-zoom
    let initialPinchDist = null;
    let initialFov = 40;
    const getTouchDist = (t1, t2) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        this.isDragging = false;
        initialPinchDist = getTouchDist(e.touches[0], e.touches[1]);
        initialFov = this.camera.fov;
      } else if (e.touches.length === 1) {
        onDown(e);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialPinchDist) {
        const currentDist = getTouchDist(e.touches[0], e.touches[1]);
        if (currentDist > 5) {
          const ratio = initialPinchDist / currentDist;
          const newFov = Math.max(25, Math.min(68, initialFov * ratio));
          this.camera.fov = newFov;
          this.camera.updateProjectionMatrix();
        }
      } else if (e.touches.length === 1 && this.isDragging) {
        if (e.cancelable) e.preventDefault();
        onMove(e);
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
      }
      if (e.touches.length === 0) {
        onUp();
      }
    });

    window.addEventListener('touchcancel', onUp);

    window.addEventListener('wheel', (e) => {
      const zoomDelta = e.deltaY * 0.004;
      const newFov = Math.max(25, Math.min(68, this.camera.fov + zoomDelta));
      this.camera.fov = newFov;
      this.camera.updateProjectionMatrix();
    }, { passive: true });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (!this.isPaused) {
      if (this.targetCameraPos) {
        this.camera.position.lerp(this.targetCameraPos, 0.06);
        this.currentCameraTarget.lerp(this.targetCameraTarget, 0.06);
        this.camera.lookAt(this.currentCameraTarget);

        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.05) {
          this.targetCameraPos = null;
        }
      }

      // Smooth momentum inertia for free 360-degree rotation
      if (!this.isDragging && this.rotationVelocity) {
        this.targetRotation.y += this.rotationVelocity.y;
        this.targetRotation.x += this.rotationVelocity.x;
        this.targetRotation.x = Math.max(0.08, Math.min(0.92, this.targetRotation.x));
        this.rotationVelocity.x *= 0.90;
        this.rotationVelocity.y *= 0.92;
      }

      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.09;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.09;

      if (this.worldGroup) {
        this.worldGroup.rotation.x = this.currentRotation.x;
        this.worldGroup.rotation.y = this.currentRotation.y;
      }

      if (this.windSpeed > 0) {
        const pace = this.windSpeed;
        this.tulips.forEach(t => {
          const swayX = Math.sin(elapsedTime * t.swaySpeed * pace + t.phase) * 0.04 * pace;
          const swayZ = Math.cos(elapsedTime * t.swaySpeed * pace + t.phase) * 0.03 * pace;
          t.blossom.rotation.x = swayX;
          t.blossom.rotation.z = swayZ;
        });
      }

      if (this.pondMesh && this.pondMesh.material.map) {
        this.pondMesh.material.map.offset.x = (elapsedTime * 0.015) % 1;
      }

      if (this.fairyMotes) {
        this.fairyMotes.rotation.y = elapsedTime * 0.035;
      }

      if (this.starfield) {
        this.starfield.rotation.y = elapsedTime * 0.006;
      }

      if (this.moonHalo) {
        const pulse = 1.0 + Math.sin(elapsedTime * 1.5) * 0.05;
        this.moonHalo.scale.set(pulse, pulse, 1);
      }

      if (this.satelliteIslands) {
        this.satelliteIslands.forEach(isl => {
          isl.mesh.position.y = isl.baseY + Math.sin(elapsedTime * isl.speed + isl.phase) * 0.08;
        });
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
