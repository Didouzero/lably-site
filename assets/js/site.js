// Lably — comportements communs (menu mobile, en-tête, apparitions, formulaire)
(function () {
  const entete = document.querySelector(".entete");

  // En-tête : liseré dès qu'on défile
  if (entete) {
    const maj = () => entete.classList.toggle("defile", window.scrollY > 8);
    maj();
    window.addEventListener("scroll", maj, { passive: true });

    // Menu mobile
    const bouton = entete.querySelector(".menu-btn");
    if (bouton) {
      bouton.addEventListener("click", () => {
        const ouvert = document.body.classList.toggle("menu-ouvert");
        bouton.setAttribute("aria-expanded", ouvert);
      });
      entete.querySelectorAll(".nav a").forEach((a) =>
        a.addEventListener("click", () => {
          document.body.classList.remove("menu-ouvert");
          bouton.setAttribute("aria-expanded", "false");
        })
      );
    }
  }

  // Apparitions au défilement
  const elements = document.querySelectorAll(".revele");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entrees) =>
        entrees.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    elements.forEach((el) => obs.observe(el));
  } else {
    elements.forEach((el) => el.classList.add("visible"));
  }

  // Formulaire email → Brevo (liste « Liste d'attente lably.fr »)
  const FORM_ENDPOINT =
    "https://120165d5.sibforms.com/serve/MUIFAF7rs8nZZWLS1-VGyB2F4QbgDdfh9o1w4uMNZDNhEiRXirY3pfo6xv5_2xceo4n3uAFA11XMxEwq49hBn0S3TxjAvWrx6YL3L4fz5rvwgIXoXoSgwVnxVGGXojYYnT8_zmGIVpbiwEdBuSPZZyMcvqnpSsY0JopGlI1mgRHMwJqpg9RZ-c8B-uZU8Wrqby7iE4jwy6XWo5lltw==";

  document.querySelectorAll("form[data-brevo]").forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const bouton = form.querySelector("button");
    const message = form.querySelector(".message");
    const libelle = bouton.textContent;

    const afficher = (texte, type) => {
      message.textContent = texte;
      message.className = "message " + type;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.site_web && form.site_web.value) return; // robot

      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        afficher("Hmm, cet email n'a pas l'air valide. Tu peux vérifier ?", "erreur");
        input.focus();
        return;
      }
      bouton.disabled = true;
      bouton.textContent = "Envoi…";
      try {
        const d = new FormData();
        d.append("EMAIL", email);
        d.append("email_address_check", "");
        d.append("locale", "fr");
        d.append("html_type", "simple");
        await fetch(FORM_ENDPOINT, { method: "POST", body: d, mode: "no-cors" });
        form.classList.add("envoye");
        afficher("C'est noté ✓ On t'écrit très vite.", "ok");
      } catch (err) {
        afficher("Oups, ça n'est pas passé. Réessaie dans un instant.", "erreur");
        bouton.disabled = false;
        bouton.textContent = libelle;
      }
    });
  });
})();
