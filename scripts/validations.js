/**
 * validations.js
 * Regras de validação + máscara de telefone.
 */

const Validations = (() => {

  const rules = {
    name: {
      test: v => v.trim().length >= 3,
      message: 'Informe seu nome completo (mínimo 3 caracteres).',
    },
    phone: {
      test: v => { const d = v.replace(/\D/g, ''); return d.length === 10 || d.length === 11; },
      message: 'Informe um telefone válido com DDD. Ex: (19) 99999-9999.',
    },
    origin: {
      test: v => v.trim().length >= 5,
      message: 'Informe o endereço de origem.',
    },
    destination: {
      test: v => v.trim().length >= 5,
      message: 'Informe o endereço de destino.',
    },
    date: {
      test: v => {
        if (!v) return false;
        const sel = new Date(v + 'T00:00:00');
        const today = new Date(); today.setHours(0,0,0,0);
        return sel >= today;
      },
      message: 'Selecione uma data a partir de hoje.',
    },
    time: {
      test: v => Boolean(v),
      message: 'Informe o horário da viagem.',
    },
    passengers: {
      test: v => { const n = parseInt(v,10); return !isNaN(n) && n >= 1 && n <= 6; },
      message: 'Selecione entre 1 e 6 passageiros.',
    },
    luggage: {
      test: v => { const n = parseInt(v,10); return !isNaN(n) && n >= 0 && n <= 20; },
      message: 'Bagagens: 0 a 20.',
    },
  };

  function validateField(field, value) {
    const rule = rules[field];
    if (!rule) return { valid: true, message: '' };
    const valid = rule.test(String(value ?? ''));
    return { valid, message: valid ? '' : rule.message };
  }

  function validateForm(data) {
    const errors = {}; let valid = true;
    Object.keys(rules).forEach(f => {
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

  return { validateField, validateForm, maskPhone };

})();