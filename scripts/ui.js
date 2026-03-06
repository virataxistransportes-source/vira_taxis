/**
 * ui.js
 * Controlador de UI do Vira Táxis.
 * Coordena header, menu, reveal, FAQ, stepper, máscara de
 * telefone, validação inline, submit e redirecionamento WhatsApp.
 *
 * REGRA: nenhum valor monetário é exibido ao cliente em nenhum
 * momento — a lógica de preço vive em calculations.js e é
 * transmitida apenas na mensagem interna para a equipe.
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ── Utilitários ─────────────────────────────────────────── */
  const $  = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

  /* ══════════════════════════════════════════════════════════
     1. HEADER SCROLL
  ══════════════════════════════════════════════════════════ */
  const header = $("#header");
  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 50);
  }, { passive: true });

  /* ══════════════════════════════════════════════════════════
     2. MENU MOBILE
  ══════════════════════════════════════════════════════════ */
  const hamburger  = $("#hamburger");
  const mobileMenu = $("#mobileMenu");

  function closeMenu() {
    mobileMenu?.classList.remove("open");
    hamburger?.classList.remove("open");
    hamburger?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }

  hamburger?.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
  });

  $$(".mobile-nav__link").forEach(l => l.addEventListener("click", closeMenu));

  document.addEventListener("click", e => {
    if (!mobileMenu?.contains(e.target) && !hamburger?.contains(e.target)) closeMenu();
  });

  /* ══════════════════════════════════════════════════════════
     3. SCROLL SUAVE (com offset do header fixo)
  ══════════════════════════════════════════════════════════ */
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    const offset = (header?.offsetHeight ?? 72) + 8;
    window.scrollTo({ top: target.offsetTop - offset, behavior: "smooth" });
  });

  /* ══════════════════════════════════════════════════════════
     4. REVEAL ANIMATIONS (IntersectionObserver)
  ══════════════════════════════════════════════════════════ */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    $$(".reveal").forEach(el => io.observe(el));
  } else {
    $$(".reveal").forEach(el => el.classList.add("visible"));
  }

  /* ══════════════════════════════════════════════════════════
     5. COUNTER ANIMATION (stats)
  ══════════════════════════════════════════════════════════ */
  if ("IntersectionObserver" in window) {
    const counterIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        counterIO.unobserve(e.target);
        const el     = e.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix ?? "";
        const dur    = 1400;
        const start  = performance.now();
        const tick   = (now) => {
          const p     = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString("pt-BR") + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    $$("[data-target]").forEach(el => counterIO.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     6. DATA MÍNIMA
  ══════════════════════════════════════════════════════════ */
  const dateInput = $("#date");
  if (dateInput) {
    const t  = new Date();
    const yy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    const iso = `${yy}-${mm}-${dd}`;
    dateInput.min   = iso;
    dateInput.value = iso;
  }

  /* ══════════════════════════════════════════════════════════
     7. MÁSCARA DE TELEFONE
  ══════════════════════════════════════════════════════════ */
  const phoneInput = $("#phone");
  phoneInput?.addEventListener("input", () => {
    phoneInput.value = Validations.maskPhone(phoneInput.value);
  });

  /* ══════════════════════════════════════════════════════════
     8. STEPPER DE PASSAGEIROS
  ══════════════════════════════════════════════════════════ */
  const display    = $("#passengerDisplay");
  const hiddenPax  = $("#passengers");
  const btnMinus   = $("#btnMinus");
  const btnPlus    = $("#btnPlus");
  const vehicleTag = $("#vehicleTag");
  const vanNotice  = $("#vanNotice");

  let passengers = 1;
  const MIN_PAX = 1, MAX_PAX = 6;

  function updatePassengers(val) {
    passengers = Math.max(MIN_PAX, Math.min(MAX_PAX, val));
    if (display)   display.textContent = passengers;
    if (hiddenPax) hiddenPax.value     = passengers;

    btnMinus?.classList.toggle("disabled", passengers <= MIN_PAX);
    btnPlus?.classList.toggle("disabled",  passengers >= MAX_PAX);
    if (btnMinus) btnMinus.disabled = passengers <= MIN_PAX;
    if (btnPlus)  btnPlus.disabled  = passengers >= MAX_PAX;

    // Atualizar tag de veículo (sem exibir preço)
    const info = Pricing.getVehicleInfo(passengers);
    if (vehicleTag) {
      const icon = info.requiresVan ? "fa-van-shuttle" : "fa-car";
      vehicleTag.innerHTML = `<i class="fa-solid ${icon}"></i> ${info.vehicleLabel}`;
      vehicleTag.classList.toggle("vehicle-tag--sedan", !info.requiresVan);
      vehicleTag.classList.toggle("vehicle-tag--van",    info.requiresVan);
    }
    vanNotice?.classList.toggle("show", info.requiresVan);
  }

  btnMinus?.addEventListener("click", () => updatePassengers(passengers - 1));
  btnPlus?.addEventListener("click",  () => updatePassengers(passengers + 1));
  updatePassengers(1);

  /* ══════════════════════════════════════════════════════════
     9. VALIDAÇÃO INLINE POR CAMPO (blur)
  ══════════════════════════════════════════════════════════ */
  function setFieldError(fieldId, message) {
    const input = $(`#${fieldId}`);
    const errEl = $(`#err-${fieldId}`);
    if (!input) return;
    if (message) {
      input.classList.add("field-error");
      if (errEl) { errEl.textContent = message; errEl.classList.add("show"); }
    } else {
      input.classList.remove("field-error");
      if (errEl) { errEl.textContent = ""; errEl.classList.remove("show"); }
    }
  }

  function clearErrors() {
    $$(".form-input").forEach(el => el.classList.remove("field-error"));
    $$(".field-msg").forEach(el => { el.textContent = ""; el.classList.remove("show"); });
  }

  ["name","phone","origin","destination","date","time","luggage"].forEach(id => {
    $(`#${id}`)?.addEventListener("blur", e => {
      const { valid, message } = Validations.validateField(id, e.target.value);
      setFieldError(id, valid ? "" : message);
    });
  });

  /* ══════════════════════════════════════════════════════════
     10. FAQ ACCORDION
  ══════════════════════════════════════════════════════════ */
  $$(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const item   = btn.closest(".faq-item");
      const answer = item?.querySelector(".faq-answer");
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      // Fecha todos
      $$(".faq-item").forEach(i => {
        i.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
        i.classList.remove("open");
        const a = i.querySelector(".faq-answer");
        if (a) a.style.maxHeight = null;
      });

      // Abre o clicado (se estava fechado)
      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        item.classList.add("open");
        if (answer) answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* ══════════════════════════════════════════════════════════
     11. SUBMIT DO FORMULÁRIO
  ══════════════════════════════════════════════════════════ */
  const form      = $("#quoteForm");
  const submitBtn = $("#submitBtn");

  form?.addEventListener("submit", e => {
    e.preventDefault();
    clearErrors();

    const raw = {
      name:        $("#name")?.value        ?? "",
      phone:       $("#phone")?.value       ?? "",
      origin:      $("#origin")?.value      ?? "",
      destination: $("#destination")?.value ?? "",
      date:        $("#date")?.value        ?? "",
      time:        $("#time")?.value        ?? "",
      passengers:  String(passengers),
      luggage:     $("#luggage")?.value     ?? "0",
    };

    const { valid, errors } = Validations.validateForm(raw);

    if (!valid) {
      Object.entries(errors).forEach(([f, m]) => setFieldError(f, m));
      form.querySelector(".field-error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Montar dados para o WhatsApp
    const pax      = parseInt(raw.passengers, 10);
    const luggage  = parseInt(raw.luggage, 10);
    const info     = Pricing.getVehicleInfo(pax);

    // Distância do Google Maps (se disponível) ou null
    const estimatedKm = MapsService.isActive() ? MapsService.getDistanceKm() : null;

    // Calcular valor internamente (nunca exibido ao cliente)
    let pricing = {};
    if (estimatedKm) {
      pricing = Pricing.calculate(estimatedKm, pax);
    }

    const payload = {
      name:         raw.name,
      phone:        raw.phone,
      origin:       raw.origin,
      destination:  raw.destination,
      date:         raw.date,
      time:         raw.time,
      passengers:   pax,
      luggage,
      vehicleLabel: info.vehicleLabel,
      requiresVan:  info.requiresVan,
      estimatedKm,
      total:        pricing.total     ?? null,
      pricePerKm:   pricing.pricePerKm ?? null,
    };

    // Loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
      WhatsApp.redirect(payload);
      MapsService.reset();
    }, 800);
  });

  /* ══════════════════════════════════════════════════════════
     12. WHATSAPP FLOAT — aparecer após scroll
  ══════════════════════════════════════════════════════════ */
  const waFloat = $(".wa-float");
  if (waFloat) {
    let shown = false;
    const show = () => { if (shown) return; shown = true; waFloat.classList.add("show"); };
    window.addEventListener("scroll", () => { if (window.scrollY > 300) show(); }, { passive: true });
    setTimeout(show, 4000);
  }

});