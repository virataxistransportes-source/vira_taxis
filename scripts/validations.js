/**
 * validations.js
 * Regras de validação + máscara de telefone + sanitização XSS.
 */

const Validations = (() => {

  /**
   * Sanitiza string para uso em contextos HTML/texto.
   * Remove caracteres de controle e escapa entidades HTML.
   * Use SEMPRE antes de inserir input do usuário em qualquer contexto.
   */
  function sanitize(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  /**
   * Sanitiza para uso em texto simples (WhatsApp, logs, etc.)
   * Não escapa HTML — apenas remove chars perigosos.
   */
  function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove control chars
      .replace(/[`]/g, "'")                                // normaliza backticks
      .trim()
      .slice(0, 500);                                      // limita tamanho
  }

  const rules = {
    name: {
      test: v => {
        const clean = v.trim();
        return clean.length >= 3 && clean.length <= 100 && /^[\p{L}\s.'-]+$/u.test(clean);
      },
      message: 'Informe seu nome completo (mínimo 3 caracteres, apenas letras).',
    },
    phone: {
      test: v => { const d = v.replace(/\D/g, ''); return d.length === 10 || d.length === 11; },
      message: 'Informe um telefone válido com DDD. Ex: (19) 99999-9999.',
    },
    origin: {
      test: v => { const c = v.trim(); return c.length >= 5 && c.length <= 300; },
      message: 'Informe o endereço de origem.',
    },
    destination: {
      test: v => { const c = v.trim(); return c.length >= 5 && c.length <= 300; },
      message: 'Informe o endereço de destino.',
    },
    date: {
      test: v => {
        if (!v) return false;
        // Valida formato YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
        const sel = new Date(v + 'T00:00:00');
        if (isNaN(sel.getTime())) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        // Não permite datas muito no futuro (5 anos)
        const maxDate = new Date(); maxDate.setFullYear(maxDate.getFullYear() + 5);
        return sel >= today && sel <= maxDate;
      },
      message: 'Selecione uma data válida a partir de hoje.',
    },
    time: {
      test: v => Boolean(v) && /^\d{2}:\d{2}$/.test(v),
      message: 'Informe o horário da viagem.',
    },
    passengers: {
      test: v => { const n = parseInt(v, 10); return !isNaN(n) && n >= 1 && n <= 6; },
      message: 'Selecione entre 1 e 6 passageiros.',
    },
    luggage: {
      test: v => { const n = parseInt(v, 10); return !isNaN(n) && n >= 0 && n <= 20; },
      message: 'Bagagens: 0 a 20.',
    },
  };

  function validateField(field, value) {
    // Proteção contra prototype pollution
    if (!Object.prototype.hasOwnProperty.call(rules, field)) return { valid: true, message: '' };
    const rule = rules[field];
    const valid = rule.test(String(value ?? ''));
    return { valid, message: valid ? '' : rule.message };
  }

  function validateForm(data) {
    const errors = {}; let valid = true;
    // Itera apenas pelas chaves conhecidas — não usa Object.keys(data)
    Object.keys(rules).forEach(f => {
      if (!Object.prototype.hasOwnProperty.call(rules, f)) return;
      const r = validateField(f, data[f] ?? '');
      if (!r.valid) { errors[f] = r.message; valid = false; }
    });
    return { valid, errors };
  }

  /** Máscara de telefone aplicada em tempo real */
  function maskPhone(value) {
    let d = value.replace(/\D/g, '').slice(0, 11);
    if (d.length > 10) d = d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    else               d = d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return d.replace(/-$/, '');
  }

  return { validateField, validateForm, maskPhone, sanitize, sanitizeText };

})();