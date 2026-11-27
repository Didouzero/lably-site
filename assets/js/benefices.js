/* Section « Ce que vous y gagnez », tuile 02 :
   l'étiquette « à peu près » d'une image générée devient un plan exact, cotes au millimètre. */
(() => {
  const tuile = document.querySelector(".tuile-ia");
  if (!tuile) return;
  const compteurs = [...tuile.querySelectorAll(".compteur")];
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const approx = () => { tuile.classList.remove("exact"); compteurs.forEach((c) => (c.textContent = "≈ ?")); };
  const exact = () => {
    tuile.classList.add("exact");
    const debut = performance.now();
    const pas = (t) => {
      const k = Math.min(1, (t - debut) / 800), e = 1 - Math.pow(1 - k, 3);
      compteurs.forEach((c) => (c.textContent = (c.dataset.val * e).toFixed(1).replace(".", ",")));
      if (k < 1) requestAnimationFrame(pas);
      else compteurs.forEach((c) => (c.textContent = c.dataset.val + ",0"));
    };
    requestAnimationFrame(pas);
  };
  if (calme) { tuile.classList.add("exact"); compteurs.forEach((c) => (c.textContent = c.dataset.val + ",0")); return; }

  let visible = false, minuteur = null;
  const attendre = (ms) => new Promise((r) => (minuteur = setTimeout(r, ms)));
  const boucle = async () => {
    while (visible) {
      approx();
      await attendre(2000);
      if (!visible) return;
      exact();
      await attendre(3800);
    }
  };
  approx();
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) { visible = true; boucle(); }
    else if (!e.isIntersecting && visible) { visible = false; clearTimeout(minuteur); }
  }, { threshold: 0.4 }).observe(tuile);
})();

/* Section « Pas encore de contenant ? » : onglets par catégorie,
   les étiquettes se collent une à une, et se recollent au clic. */
(() => {
  const bloc = document.querySelector(".contenants");
  if (!bloc) return;
  const onglets = [...bloc.querySelectorAll('[role="tab"]')];
  const etageres = [...bloc.querySelectorAll(".etagere")];
  const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let vu = false;

  const coller = (c) => { c.classList.remove("colle"); void c.offsetWidth; c.classList.add("colle"); };
  const collerTout = (etagere) => {
    const items = [...etagere.querySelectorAll(".contenant")];
    items.forEach((c) => c.classList.remove("colle"));
    items.forEach((c, i) => setTimeout(() => coller(c), calme ? 0 : 350 + i * 260));
  };

  const choisir = (onglet, focus) => {
    onglets.forEach((o) => {
      const actif = o === onglet;
      o.setAttribute("aria-selected", actif);
      o.tabIndex = actif ? 0 : -1;
      document.getElementById(o.getAttribute("aria-controls")).hidden = !actif;
    });
    if (focus) onglet.focus();
    if (vu) collerTout(document.getElementById(onglet.getAttribute("aria-controls")));
  };

  onglets.forEach((o, i) => {
    o.addEventListener("click", () => choisir(o));
    o.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); choisir(onglets[(i + d + onglets.length) % onglets.length], true); }
    });
  });
  bloc.querySelectorAll(".contenant").forEach((c) => c.addEventListener("click", () => coller(c)));

  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    vu = true; obs.disconnect();
    collerTout(etageres.find((x) => !x.hidden));
  }, { threshold: 0.35 }).observe(bloc);
})();
