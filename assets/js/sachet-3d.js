/* Sachet doypack en 3D, tournable à la souris ou au doigt.
   Utilisation : <div class="sachet-3d" data-avant="…webp" data-dos="…webp"> … </div> */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const boite = document.querySelector(".sachet-3d");
if (boite) demarrer(boite);

function demarrer(boite) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    return; // pas de WebGL : l'image de secours reste affichée
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;   // garde les couleurs exactes du fichier
  const toile = renderer.domElement;
  toile.className = "sachet-toile";
  boite.querySelector(".sachet-scene").appendChild(toile);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  const CIBLE = new THREE.Vector3(0, 1.0, 0);
  const RAYON = 7.4;
  camera.position.copy(CIBLE).add(new THREE.Vector3().setFromSpherical(new THREE.Spherical(RAYON, Math.PI / 2 - 0.1, 0.45)));

  const lumiere = new THREE.DirectionalLight(0xffffff, 0.9);
  lumiere.position.set(3, 5, 4);
  scene.add(lumiere, new THREE.HemisphereLight(0xfff4ec, 0x6a3040, 0.25));

  /* ---------- Géométrie du sachet ---------- */
  const L = 1.6, H = 2.3, P = 0.3; // largeur, hauteur, demi-épaisseur max (unités = décimètres)
  const NU = 60, NV = 80;

  function enveloppe(u, v) {
    const eu = Math.pow(Math.sin(Math.PI * u), 0.55);
    let ev;
    if (v > 0.93) ev = 0;                                       // soudure du haut : plate
    else if (v > 0.55) ev = 0.5 - 0.5 * Math.cos(Math.PI * (0.93 - v) / 0.38);
    else ev = 1;
    return eu * ev;
  }

  function panneau(signe) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      for (let i = 0; i <= NU; i++) {
        const u = i / NU;
        const e = enveloppe(u, v);
        const x = (u - 0.5) * L * (1 - 0.045 * e);
        pos.push(signe > 0 ? x : -x, v * H, signe * P * e);
        uv.push(u, v);
      }
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  function fond() {
    const pos = [], idx = [];
    for (let i = 0; i <= NU; i++) {
      const u = i / NU, e = enveloppe(u, 0), x = (u - 0.5) * L * (1 - 0.045 * e);
      pos.push(x, 0, P * e, x, 0, -P * e);
    }
    for (let i = 0; i < NU; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // Coins arrondis du sachet (masque de transparence)
  function masqueCoins() {
    const c = document.createElement("canvas"); c.width = 320; c.height = 460;
    const x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, 320, 460);
    x.fillStyle = "#fff"; x.beginPath(); x.roundRect(0, 0, 320, 460, [26, 26, 10, 10]); x.fill();
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  const chargeur = new THREE.TextureLoader();
  const masque = masqueCoins();
  function matiere(url) {
    const t = chargeur.load(url, rendre);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return new THREE.MeshPhysicalMaterial({
      map: t, alphaMap: masque, alphaTest: 0.5, side: THREE.DoubleSide,
      roughness: 0.62, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.45, envMapIntensity: 0.55
    });
  }

  const sachet = new THREE.Group();
  sachet.add(new THREE.Mesh(panneau(1), matiere(boite.dataset.avant)));
  sachet.add(new THREE.Mesh(panneau(-1), matiere(boite.dataset.dos)));
  sachet.add(new THREE.Mesh(fond(), new THREE.MeshStandardMaterial({ color: 0x9c0e33, roughness: 0.6, side: THREE.DoubleSide })));
  scene.add(sachet);

  // Ombre douce au sol
  const co = document.createElement("canvas"); co.width = co.height = 256;
  const xo = co.getContext("2d");
  const gr = xo.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(60,10,25,.38)"); gr.addColorStop(1, "rgba(60,10,25,0)");
  xo.fillStyle = gr; xo.fillRect(0, 0, 256, 256);
  const ombre = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(co), transparent: true, depthWrite: false }));
  ombre.rotation.x = -Math.PI / 2; ombre.position.y = -0.005;
  scene.add(ombre);

  /* ---------- Contrôles ---------- */
  const controles = new OrbitControls(camera, toile);
  controles.target.copy(CIBLE);
  controles.enableZoom = false;        // la molette fait défiler la page, pas le zoom
  controles.enablePan = false;
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minPolarAngle = 0.15;
  controles.maxPolarAngle = Math.PI - 0.15;
  controles.autoRotate = true;
  controles.autoRotateSpeed = 1.6;

  let reprise;
  controles.addEventListener("start", () => { controles.autoRotate = false; clearTimeout(reprise); boite.classList.add("touche"); });
  controles.addEventListener("end", () => { reprise = setTimeout(() => (controles.autoRotate = true), 5000); });

  // Boutons de vue : face, dos, trois-quarts
  let anim = null;
  // Boutons dans la vue 3D, et vignettes « face / dos » placées à côté (même bloc .vitrine)
  const zoneBoutons = boite.closest(".vitrine") || boite;
  zoneBoutons.querySelectorAll("[data-vue]").forEach((b) => b.addEventListener("click", () => {
    const angle = { face: 0, dos: Math.PI, troisquarts: Math.PI / 5 }[b.dataset.vue];
    const depart = new THREE.Spherical().setFromVector3(camera.position.clone().sub(CIBLE));
    let dTheta = angle - depart.theta;
    dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
    anim = { depart, dTheta, phiCible: Math.PI / 2 - 0.08, t0: performance.now() };
    controles.autoRotate = false; clearTimeout(reprise);
    reprise = setTimeout(() => (controles.autoRotate = true), 6000);
  }));

  /* ---------- Rendu ---------- */
  function taille() {
    const r = boite.querySelector(".sachet-scene").getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    rendre();
  }
  new ResizeObserver(taille).observe(boite);

  let visible = false, enCours = false;
  function rendre() { if (!enCours) requestAnimationFrame(boucle); enCours = true; }
  function boucle(t) {
    enCours = false;
    if (anim) {
      const k = Math.min(1, (t - anim.t0) / 900), e = 1 - Math.pow(1 - k, 3);
      const s = new THREE.Spherical(RAYON, anim.depart.phi + (anim.phiCible - anim.depart.phi) * e, anim.depart.theta + anim.dTheta * e);
      camera.position.copy(CIBLE).add(new THREE.Vector3().setFromSpherical(s));
      if (k === 1) anim = null;
    }
    controles.update();
    renderer.render(scene, camera);
    if (visible) rendre();
  }

  new IntersectionObserver((entrees) => {
    visible = entrees[0].isIntersecting;
    if (visible) rendre();
  }).observe(boite);

  boite.classList.add("pret");
  taille();
}
