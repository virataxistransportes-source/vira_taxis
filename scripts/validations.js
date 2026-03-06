/**
 * validations.js
 * Regras de validação do formulário de agendamento Vira Táxis.
 */

const Validations = (() => {

  /* ── Regras por campo ──────────────────────────────────── */
  const rules = {

    name: {
      test: (v) => v.trim().length >= 3,
      message: "Informe seu nome completo (mínimo 3 caracteres).",
    },

    phone: {
      /**
       * Aceita formatos: (11) 99999-9999 | (11) 9999-9999 | 11999999999
       * Remove máscara e valida 10 ou 11 dígitos.
       */
      test: (v) => {
        const digits = v.replace(/\D/g, "");
        return digits.length === 10 || digits.length === 11;
      },
      message: "Informe um telefone válido com DDD. Ex: (11) 99999-9999.",
    },

    origin: {
      test: (v) => v.trim().length >= 5,
      message: "Informe o endereço de origem (mínimo 5 caracteres).",
    },

    destination: {
      test: (v) => v.trim().length >= 5,
      message: "Informe o endereço de destino (mínimo 5 caracteres).",
    },

    date: {
      test: (v) => {
        if (!v) return false;
        const sel   = new Date(v + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return sel >= today;
      },
      message: "Selecione uma data a partir de hoje.",
    },

    time: {
      test: (v) => Boolean(v),
      message: "Informe o horário da viagem.",
    },

    passengers: {
      test: (v) => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 1 && n <= 6;
      },
      message: "Selecione entre 1 e 6 passageiros.",
    },

    luggage: {
      test: (v) => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 0 && n <= 20;
      },
      message: "Informe a quantidade de bagagens (0 a 20).",
    },
  };

  /* ── Helpers ───────────────────────────────────────────── */

  /**
   * Valida campo individual.
   * @param {string} field
   * @param {string|number} value
   * @returns {{ valid: boolean, message: string }}
   */
  function validateField(field, value) {
    const rule = rules[field];
    if (!rule) return { valid: true, message: "" };
    const valid = rule.test(String(value ?? ""));
    return { valid, message: valid ? "" : rule.message };
  }

  /**
   * Valida o formulário completo.
   * @param {object} data
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  function validateForm(data) {
    const errors = {};
    let valid = true;
    Object.keys(rules).forEach((field) => {
      const result = validateField(field, data[field] ?? "");
      if (!result.valid) { errors[field] = result.message; valid = false; }
    });
    return { valid, errors };
  }

  /**
   * Aplica máscara de telefone ao digitar.
   * (11) 99999-9999 ou (11) 9999-9999
   * @param {string} value
   * @returns {string}
   */
  function maskPhone(value) {
    let d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length > 10) {
      // Celular: (XX) XXXXX-XXXX
      d = d.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    } else {
      // Fixo: (XX) XXXX-XXXX
      d = d.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    }
    return d.replace(/-$/, "");
  }

  return { validateField, validateForm, maskPhone };

})();