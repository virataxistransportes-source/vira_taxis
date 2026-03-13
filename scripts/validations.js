/**
 * validations.js
 * Regras de validação + máscara de telefone + sanitização XSS.
 *
 * Abordagem: normalizar antes de validar, tratar bypass (trim, tipo, tamanho),
 * regras explícitas de obrigatoriedade, limites contra abuso e dados inválidos.
 */

const Validations = (() => {

  /**
   * Normaliza string: trim, remove caracteres de controle e espaços unicode.
   */
  function _normalize(value) {
    if (value == null) return '';
    const s = String(value)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return s;
  }

  /**
   * Sanitiza string para uso em contextos HTML/texto.
   */
  function sanitize(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  /**
   * Sanitiza para uso em texto simples (WhatsApp, logs, etc.)
   */
  function sanitizeText(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[`]/g, "'")
      .trim()
      .slice(0, 500);
  }

  const rules = {
    name: {
      test: v => {
        const clean = _normalize(v);
        if (clean.length < 3) return false;
        if (clean.length > 100) return false;
        if (!/^[\p{L}\s.'-]+$/u.test(clean)) return false;
        if (/^\d+$/.test(clean)) return false;
        if (/(.)\1{20,}/.test(clean)) return false;
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length < 1) return false;
        return true;
      },
      message: 'Nome completo é obrigatório (mín. 3 caracteres, apenas letras e espaços).',
    },
    phone: {
      test: v => {
        const s = _normalize(v);
        if (!s) return false;
        const digits = s.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 16) return false;
        if (/^(\d)\1+$/.test(digits)) return false;
        return true;
      },
      message: 'Telefone é obrigatório. Informe um número válido com DDD/DDD internacional.',
    },
    origin: {
      test: v => {
        const c = _normalize(v);
        if (c.length < 5) return false;
        if (c.length > 300) return false;
        if (/^\d+$/.test(c)) return false;
        if (!/\p{L}/u.test(c)) return false;
        return true;
      },
      message: 'Endereço de origem é obrigatório (mín. 5 caracteres).',
    },
    destination: {
      test: v => {
        const c = _normalize(v);
        if (c.length < 5) return false;
        if (c.length > 300) return false;
        if (/^\d+$/.test(c)) return false;
        if (!/\p{L}/u.test(c)) return false;
        return true;
      },
      message: 'Endereço de destino é obrigatório (mín. 5 caracteres).',
    },
    date: {
      test: v => {
        const s = _normalize(v);
        if (!s) return false;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
        const [y, m, d] = s.split('-').map(Number);
        if (m < 1 || m > 12 || d < 1 || d > 31) return false;
        const sel = new Date(y, m - 1, d);
        if (sel.getFullYear() !== y || sel.getMonth() !== m - 1 || sel.getDate() !== d) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (sel < today) return false;
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5);
        maxDate.setHours(23, 59, 59, 999);
        if (sel > maxDate) return false;
        return true;
      },
      message: 'Data é obrigatória. Selecione uma data a partir de hoje.',
    },
    time: {
      test: v => {
        const s = _normalize(v);
        if (!s) return false;
        if (!/^\d{2}:\d{2}$/.test(s)) return false;
        const [h, m] = s.split(':').map(Number);
        if (h < 0 || h > 23 || m < 0 || m > 59) return false;
        return true;
      },
      message: 'Horário é obrigatório. Selecione um horário válido.',
    },
    passengers: {
      test: v => {
        const s = String(v).trim();
        if (!/^\d+$/.test(s)) return false;
        const n = parseInt(s, 10);
        if (n < 1 || n > 6) return false;
        return true;
      },
      message: 'Selecione entre 1 e 6 passageiros.',
    },
    luggage: {
      test: v => {
        const s = String(v).trim();
        if (!/^\d+$/.test(s)) return false;
        const n = parseInt(s, 10);
        if (n < 0 || n > 20) return false;
        return true;
      },
      message: 'Bagagens: informe de 0 a 20.',
    },
  };

  /**
   * Valida um único campo (valor já normalizado pelo caller se necessário).
   */
  function validateField(field, value) {
    if (!Object.prototype.hasOwnProperty.call(rules, field)) return { valid: true, message: '' };
    const rule = rules[field];
    const normalized = field === 'name' || field === 'phone' || field === 'origin' || field === 'destination' || field === 'date' || field === 'time'
      ? _normalize(value)
      : String(value ?? '').trim();
    const valid = rule.test(normalized);
    return { valid, message: valid ? '' : rule.message };
  }

  /**
   * Valida o formulário inteiro. Recebe objeto com chaves do formulário.
   * Ordem dos erros: name, phone, origin, destination, date, time, passengers, luggage.
   */
  function validateForm(data) {
    const errors = {};
    let valid = true;
    const order = ['name', 'phone', 'origin', 'destination', 'date', 'time', 'passengers', 'luggage'];
    for (const f of order) {
      if (!Object.prototype.hasOwnProperty.call(rules, f)) continue;
      const rawVal = data[f];
      const value = rawVal != null ? (typeof rawVal === 'string' ? _normalize(rawVal) : String(rawVal).trim()) : '';
      const r = validateField(f, value);
      if (!r.valid) {
        errors[f] = r.message;
        valid = false;
      }
    }
    if (valid && _normalize(data.origin) === _normalize(data.destination)) {
      errors.destination = 'Origem e destino devem ser diferentes.';
      valid = false;
    }
    const isoDate = _normalize(data.date);
    const timeStr = _normalize(data.time);
    if (valid && isoDate && timeStr && /^\d{2}:\d{2}$/.test(timeStr)) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (isoDate === todayStr) {
        const [h, m] = timeStr.split(':').map(Number);
        const nowH = today.getHours(), nowM = today.getMinutes();
        if (h < nowH || (h === nowH && m <= nowM)) {
          errors.time = 'Para hoje, selecione um horário que ainda não passou.';
          valid = false;
        }
      }
    }
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
