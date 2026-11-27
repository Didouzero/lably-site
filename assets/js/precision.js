/* Section « La précision » : l'étiquette se dessine au rythme du défilement. */
(function () {
  var section = document.getElementById("precision");
  if (!section) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.documentElement.classList.add("js-precision");

  var piste = section.querySelector(".precision-piste");
  var scene = section.querySelector(".precision-scene");
  var svgNS = "http://www.w3.org/2000/svg";

  /* ---------- Règles graduées (en mm), générées une fois ---------- */
  var regles = section.querySelector(".regles");
  function el(nom, attrs, parent) {
    var e = document.createElementNS(svgNS, nom);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || regles).appendChild(e);
    return e;
  }
  var svgPlan = section.querySelector(".plan-svg");
  var LARG = +svgPlan.dataset.l, HAUT = +svgPlan.dataset.h;
  var vb = svgPlan.viewBox.baseVal;
  el("rect", { x: vb.x, y: vb.y, width: vb.width, height: 6, fill: "#F1EFEA" });
  el("rect", { x: vb.x, y: vb.y, width: 6, height: vb.height, fill: "#F1EFEA" });
  var traits = el("g", { stroke: "#111", "stroke-opacity": ".45", "stroke-width": ".2" });
  var chiffres = el("g", { fill: "#6B6862", "font-family": "ui-monospace, Menlo, monospace", "font-size": "2.4" });
  for (var x = 0; x <= LARG; x += 5) {
    var long = x % 10 === 0;
    el("line", { x1: x, x2: x, y1: -22, y2: long ? -25.5 : -23.8 }, traits);
    if (x % 50 === 0 && x > 0 || x === 0) el("text", { x: x + 0.8, y: -25.6 }, chiffres).textContent = x;
  }
  for (var y = 0; y <= HAUT; y += 5) {
    var longY = y % 10 === 0;
    el("line", { y1: y, y2: y, x1: -24, x2: longY ? -27.5 : -25.8 }, traits);
    if (y % 50 === 0) el("text", { x: -29.4, y: y + 3 }, chiffres).textContent = y;
  }

  /* ---------- Éléments animés ---------- */
  var anims = [].slice.call(section.querySelectorAll(".anim")).map(function (e) {
    return {
      e: e,
      trace: e.classList.contains("trace") || e.classList.contains("trace-texte"),
      longueur: e.dataset.longueur ? parseFloat(e.dataset.longueur) : 1,
      balayage: e.classList.contains("balayage") ? parseFloat(e.dataset.h) + 6 : 0,
      de: parseFloat(e.dataset.de),
      a: parseFloat(e.dataset.a),
      sortie: e.dataset.sortie ? parseFloat(e.dataset.sortie) : null,
      compteurs: [].slice.call(e.querySelectorAll(".compteur"))
    };
  });

  anims.forEach(function (A) { if (A.longueur !== 1) A.e.style.strokeDasharray = A.longueur; });

  var etapes = [].slice.call(section.querySelectorAll(".precision-etapes li"));
  var barre = section.querySelector(".plan-progression i");
  var champs = {};
  [].forEach.call(section.querySelectorAll("[data-champ]"), function (c) { champs[c.dataset.champ] = c; });
  var inspecteur = [
    { calque: "Gabarit", format: "160 × 230 mm", detail: "Fond perdu 3 mm", couleur: "Soudure 10 mm · soufflet 44 mm" },
    { calque: "Construction", format: "Grille 5 mm", detail: "Marges 10 mm", couleur: "Tracés vectoriels" },
    { calque: "Typographie", format: "Archivo Italic", detail: "Corps mini 6 pt", couleur: "Logo client intégré" },
    { calque: "Export", format: "PDF/X-4", detail: "300 dpi", couleur: "CMJN 0 · 95 · 60 · 5" }
  ];

  function borne(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var etapeCourante = -1;

  function rendre() {
    var r = piste.getBoundingClientRect();
    var course = piste.offsetHeight - scene.offsetHeight;
    var haut = parseFloat(getComputedStyle(scene).top) || 0;   // hauteur de l'en-tête (position sticky)
    var p = borne((haut - r.top) / (course || 1));             // 0 = début de la section, 1 = étiquette terminée

    for (var i = 0; i < anims.length; i++) {
      var A = anims[i];
      var t = borne((p - A.de) / (A.a - A.de));
      if (A.balayage) {
        // Impression : le visuel se révèle de haut en bas entre 74 % et 90 % du défilement
        A.e.setAttribute("height", A.balayage * borne((p - 0.74) / 0.16));
        continue;
      }
      if (A.trace) {
        A.e.style.strokeDashoffset = A.longueur * (1 - t);
      } else {
        var o = t;
        if (A.sortie !== null && p > A.sortie) o = t * (1 - 0.8 * borne((p - A.sortie) / 0.06));
        A.e.style.opacity = o;
      }
      for (var j = 0; j < A.compteurs.length; j++) {
        var c = A.compteurs[j];
        c.textContent = Math.round(parseFloat(c.dataset.cible) * t) + c.dataset.unite;
      }
    }

    if (barre) barre.style.width = (p * 100).toFixed(1) + "%";

    var n = Math.min(3, Math.floor(p * 4));
    if (n !== etapeCourante) {
      etapeCourante = n;
      etapes.forEach(function (li, k) { li.classList.toggle("actif", k === n); });
      var d = inspecteur[n];
      for (var cle in d) if (champs[cle]) champs[cle].textContent = d[cle];
    }
  }

  var enAttente = false;
  function demander() {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(function () { enAttente = false; rendre(); });
  }
  window.addEventListener("scroll", demander, { passive: true });
  window.addEventListener("resize", demander);
  rendre();
})();
