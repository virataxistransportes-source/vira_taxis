/**
 * ui.js — Controlador de UI do Vira Táxis
 *
 * REGRA DE NEGÓCIO: O resultado de cotação exibe apenas o VALOR
 * ESTIMADO formatado (ex: "R$ 42,00") e o tipo de veículo.
 * Nunca exibe a tarifa por km nem o cálculo.
 *
 * A cotação aparece automaticamente quando todos os campos
 * do formulário estão preenchidos corretamente.
 */

document.addEventListener('DOMContentLoaded', () => {

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ── 1. HEADER SCROLL ──────────────────────────────────── */
  const header = $('#header');
  window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  /* ── 2. MENU MOBILE ────────────────────────────────────── */
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobileMenu');

  function closeMenu() {
    mobileMenu?.classList.remove('open');
    hamburger?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }
  hamburger?.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  });
  $$('.mobile-nav__link').forEach(l => l.addEventListener('click', closeMenu));
  document.addEventListener('click', e => {
    if (!mobileMenu?.contains(e.target) && !hamburger?.contains(e.target)) closeMenu();
  });

  /* ── 3. SCROLL SUAVE ───────────────────────────────────── */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = (header?.offsetHeight ?? 72) + 8;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });

  /* ── 4. REVEAL ─────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ── 5. COUNTER ANIMATION ──────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix ?? '';
        const dur = 1400, start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1-p, 3);
          const val = Math.round(target * eased);
          el.textContent = val >= 1000
            ? (val/1000).toFixed(0) + 'k' + suffix
            : val + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    $$('[data-target]').forEach(el => cio.observe(el));
  }

  /* ── 6. DATA MÍNIMA ────────────────────────────────────── */
  const dateHidden = $('#date');
  if (dateHidden) {
    const t = new Date();
    const iso = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
    dateHidden.min = iso;
  }

  /* ── 6b. PICKERS DE DATA E HORÁRIO ──────────────────────── */
  const dateOverlay   = $('#datePickerOverlay');
  const dateTrigger  = $('#dateTrigger');
  const dateDisplay  = $('#dateDisplay');
  const calGrid      = $('#calGrid');
  const calMonthYear = $('#calMonthYear');
  const datePrevBtn  = $('#datePrevMonth');
  const dateNextBtn  = $('#dateNextMonth');
  const dateCancelBtn = $('#dateCancelBtn');

  const timeOverlay    = $('#timePickerOverlay');
  const timeTrigger   = $('#timeTrigger');
  const timeDisplay   = $('#timeDisplay');
  const timeHidden    = $('#time');
  const hourDisp      = $('#hourDisplay');
  const minDisp       = $('#minDisplay');
  const timeCancelBtn = $('#timeCancelBtn');
  const timeConfirmBtn = $('#timeConfirmBtn');

  const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  let calView = new Date();
  calView.setDate(1);
  let selectedDate = null;
  let tHour = 8, tMin = 0;

  function openDatePicker() {
    const now = new Date();
    if (!selectedDate) calView = new Date(now.getFullYear(), now.getMonth(), 1);
    renderCalendar();
    dateOverlay?.classList.add('is-open');
    dateOverlay?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function closeDatePicker() {
    dateOverlay?.classList.remove('is-open');
    dateOverlay?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function renderCalendar() {
    const today = new Date(); today.setHours(0,0,0,0);
    const year = calView.getFullYear();
    const month = calView.getMonth();
    calMonthYear.textContent = `${MONTHS_PT[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calGrid.innerHTML = '';
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('span');
      empty.className = 'cal-day empty';
      calGrid.appendChild(empty);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = d;
      const thisDate = new Date(year, month, d);
      thisDate.setHours(0,0,0,0);
      if (thisDate < today) btn.disabled = true;
      if (thisDate.getTime() === today.getTime()) btn.classList.add('today');
      if (selectedDate && thisDate.getTime() === selectedDate.getTime()) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        selectedDate = thisDate;
        const iso = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        dateHidden.value = iso;
        dateDisplay.textContent = `${String(d).padStart(2,'0')}/${String(month+1).padStart(2,'0')}/${year}`;
        dateTrigger?.classList.add('has-value');
        closeDatePicker();
        quoteResult?.classList.remove('show');
        const errDate = $('#err-date');
        if (errDate) { errDate.textContent = ''; errDate.classList.remove('show'); }
        dateHidden?.classList.remove('field-error');
      });
      calGrid.appendChild(btn);
    }
  }

  dateTrigger?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openDatePicker(); });
  dateCancelBtn?.addEventListener('click', closeDatePicker);
  dateOverlay?.querySelector('.picker-modal')?.addEventListener('click', (e) => e.stopPropagation());
  dateOverlay?.addEventListener('click', (e) => { if (e.target === dateOverlay) closeDatePicker(); });
  datePrevBtn?.addEventListener('click', () => { calView.setMonth(calView.getMonth()-1); renderCalendar(); });
  dateNextBtn?.addEventListener('click', () => { calView.setMonth(calView.getMonth()+1); renderCalendar(); });

  function openTimePicker() {
    if (hourDisp) hourDisp.textContent = String(tHour).padStart(2,'0');
    if (minDisp) minDisp.textContent = String(tMin).padStart(2,'0');
    timeOverlay?.classList.add('is-open');
    timeOverlay?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function closeTimePicker() {
    timeOverlay?.classList.remove('is-open');
    timeOverlay?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  timeTrigger?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openTimePicker(); });
  timeCancelBtn?.addEventListener('click', closeTimePicker);
  timeOverlay?.querySelector('.picker-modal')?.addEventListener('click', (e) => e.stopPropagation());
  timeOverlay?.addEventListener('click', (e) => { if (e.target === timeOverlay) closeTimePicker(); });

  $$('.time-arr').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = parseInt(btn.dataset.dir, 10);
      const unit = btn.dataset.unit;
      if (unit === 'h') tHour = (tHour + dir + 24) % 24;
      if (unit === 'm') tMin = (tMin + dir + 60) % 60;
      if (hourDisp) hourDisp.textContent = String(tHour).padStart(2,'0');
      if (minDisp) minDisp.textContent = String(tMin).padStart(2,'0');
    });
  });

  timeConfirmBtn?.addEventListener('click', () => {
    const val = `${String(tHour).padStart(2,'0')}:${String(tMin).padStart(2,'0')}`;
    if (timeHidden) timeHidden.value = val;
    if (timeDisplay) timeDisplay.textContent = val;
    timeTrigger?.classList.add('has-value');
    closeTimePicker();
    quoteResult?.classList.remove('show');
    const errTime = $('#err-time');
    if (errTime) { errTime.textContent = ''; errTime.classList.remove('show'); }
    timeHidden?.classList.remove('field-error');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (dateOverlay?.classList.contains('is-open')) closeDatePicker();
    else if (timeOverlay?.classList.contains('is-open')) closeTimePicker();
  });

  /* ── 7. MÁSCARA TELEFONE ───────────────────────────────── */
  const phoneInput = $('#phone');
  phoneInput?.addEventListener('input', () => {
    phoneInput.value = Validations.maskPhone(phoneInput.value);
  });

  /* ── 8. STEPPER DE PASSAGEIROS ─────────────────────────── */
  const display    = $('#passengerDisplay');
  const hiddenPax  = $('#passengers');
  const btnMinus   = $('#btnMinus');
  const btnPlus    = $('#btnPlus');
  const vehicleTag = $('#vehicleTag');
  const vanNotice  = $('#vanNotice');
  let passengers = 1;

  function updatePassengers(val) {
    passengers = Math.max(1, Math.min(6, val));
    if (display)   display.textContent = passengers;
    if (hiddenPax) hiddenPax.value     = passengers;
    btnMinus.disabled = passengers <= 1;
    btnPlus.disabled  = passengers >= 6;

    const info = Pricing.getVehicleInfo(passengers);
    if (vehicleTag) {
      vehicleTag.innerHTML = `<i class="fa-solid ${info.vehicleIcon}"></i> ${info.vehicleLabel}`;
      vehicleTag.classList.toggle('vehicle-tag--sedan', !info.requiresVan);
      vehicleTag.classList.toggle('vehicle-tag--van',    info.requiresVan);
    }
    vanNotice?.classList.toggle('show', info.requiresVan);
  }
  btnMinus?.addEventListener('click', () => updatePassengers(passengers - 1));
  btnPlus?.addEventListener('click',  () => updatePassengers(passengers + 1));
  updatePassengers(1);

  /* ── 9. COTAÇÃO ─────────────────────────────────────────── */
  const quoteResult      = $('#quoteResult');
  const quoteAmount      = $('#quoteAmount');
  const quoteVehicleIcon = $('#quoteVehicleIcon');
  const quoteVehicleLabel = $('#quoteVehicleLabel');
  const quoteDistNote    = $('#quoteDistNote');

  let _currentKm = null;

  function _guessKm() {
    const origin = $('#origin')?.value ?? '';
    const dest   = $('#destination')?.value ?? '';
    const match  = (origin + dest).match(/(\d+)\s*km/i);
    if (match) return parseInt(match[1], 10);
    if (origin.length >= 10 && dest.length >= 10) return 15;
    return null;
  }

  // Atualiza km quando Maps API retorna distância real
  document.addEventListener('maps:distance', e => {
    _currentKm = e.detail.km;
  });

  // Ao alterar campos, esconde a cotação (usuário deve clicar em Realizar cotação novamente)
  ['name','phone','origin','destination','date','time','luggage'].forEach(id => {
    $('#' + id)?.addEventListener('input', () => quoteResult?.classList.remove('show'));
    $('#' + id)?.addEventListener('change', () => quoteResult?.classList.remove('show'));
  });
  btnMinus?.addEventListener('click', () => quoteResult?.classList.remove('show'));
  btnPlus?.addEventListener('click', () => quoteResult?.classList.remove('show'));

  /* ── 10. VALIDAÇÃO INLINE ──────────────────────────────── */
  function setFieldError(id, msg) {
    const input = $('#' + id);
    const errEl = $('#err-' + id);
    if (!input) return;
    if (msg) {
      input.classList.add('field-error');
      if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
    } else {
      input.classList.remove('field-error');
      if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
    }
  }
  function clearErrors() {
    $$('.form-input').forEach(el => el.classList.remove('field-error'));
    $$('.field-msg').forEach(el => { el.textContent = ''; el.classList.remove('show'); });
  }
  ['name','phone','origin','destination','date','time','luggage'].forEach(id => {
    $('#' + id)?.addEventListener('blur', e => {
      const r = Validations.validateField(id, e.target.value);
      setFieldError(id, r.valid ? '' : r.message);
    });
  });

  /* ── 11. REALIZAR COTAÇÃO + AGENDAR VIA WHATSAPP ───────── */
  const form       = $('#quoteForm');
  const quoteBtn   = $('#quoteBtn');
  const whatsappBtn = $('#whatsappBtn');

  form?.addEventListener('submit', e => {
    e.preventDefault();
    quoteBtn?.click();
  });

  quoteBtn?.addEventListener('click', () => {
    clearErrors();

    const raw = {
      name:        $('#name')?.value        ?? '',
      phone:       $('#phone')?.value       ?? '',
      origin:      $('#origin')?.value      ?? '',
      destination: $('#destination')?.value ?? '',
      date:        $('#date')?.value        ?? '',
      time:        $('#time')?.value        ?? '',
      passengers:  String(passengers),
      luggage:     $('#luggage')?.value     ?? '0',
    };

    const { valid, errors } = Validations.validateForm(raw);
    if (!valid) {
      Object.entries(errors).forEach(([f,m]) => setFieldError(f, m));
      form?.querySelector('.field-error')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const pax     = parseInt(raw.passengers, 10);
    const luggage = parseInt(raw.luggage, 10);
    const info    = Pricing.getVehicleInfo(pax);
    const km      = MapsService.isActive() ? MapsService.getDistanceKm() : (_currentKm || _guessKm());
    const pricing = km ? Pricing.calculate(km, pax) : {};

    quoteBtn.classList.add('loading');
    quoteBtn.disabled = true;

    quoteResult?.classList.add('show');

    if (quoteVehicleIcon)  quoteVehicleIcon.className  = `fa-solid ${info.vehicleIcon}`;
    if (quoteVehicleLabel) quoteVehicleLabel.textContent = info.vehicleLabel;
    if (quoteAmount) quoteAmount.textContent = km ? Pricing.formatAmount(pricing.total) : '--';
    if (quoteDistNote) quoteDistNote.textContent = km ? `~${km} km estimados` : 'Preço confirmado via WhatsApp';

    whatsappBtn?.setAttribute('href', WhatsApp.getUrl({
      name: raw.name, phone: raw.phone,
      origin: raw.origin, destination: raw.destination,
      date: raw.date, time: raw.time,
      passengers: pax, luggage,
      vehicleLabel: info.vehicleLabel,
      requiresVan: info.requiresVan,
      estimatedKm: km,
      total: pricing.total ?? null,
      pricePerKm: pricing.pricePerKm ?? null,
    }));

    quoteResult?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      quoteBtn.classList.remove('loading');
      quoteBtn.disabled = false;
    }, 400);
  });

  /* ── 12. WHATSAPP FLOAT ────────────────────────────────── */
  const waFloat = $('.wa-float');
  if (waFloat) {
    let shown = false;
    const show = () => { if (shown) return; shown = true; waFloat.classList.add('show'); };
    window.addEventListener('scroll', () => { if (window.scrollY > 320) show(); }, { passive: true });
    setTimeout(show, 5000);
  }

});