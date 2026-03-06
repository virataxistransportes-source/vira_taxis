/**
 * calculations.js
 * ─────────────────────────────────────────────────────────────
 * REGRA DE NEGÓCIO INTERNA — os valores deste arquivo JAMAIS
 * devem ser exibidos ao cliente na interface pública.
 * São usados apenas internamente para compor a mensagem
 * enviada à equipe via WhatsApp.
 * ─────────────────────────────────────────────────────────────
 */

const Pricing = (() => {

  /* ── Tarifas internas (não exibir ao cliente) ────────────── */

  /** R$ por km — Sedan (até 4 passageiros) */
  const PRICE_PER_KM_SEDAN = 1.5;

  /** R$ por km — Van 7 lugares (5–6 passageiros) */
  const PRICE_PER_KM_VAN = 2.2;

  /** Passageiros máximos no sedan antes de exigir van */
  const MAX_SEDAN_PASSENGERS = 4;

  /** Tarifa mínima independente da distância */
  const MIN_FARE = 15;

  /* ── Helpers privados ────────────────────────────────────── */

  /**
   * Retorna a tarifa correta pelo número de passageiros.
   * @param {number} passengers
   * @returns {{ pricePerKm: number, vehicleLabel: string, requiresVan: boolean }}
   */
  function _getTariff(passengers) {
    if (passengers > MAX_SEDAN_PASSENGERS) {
      return { pricePerKm: PRICE_PER_KM_VAN, vehicleLabel: "Van 7 lugares", requiresVan: true };
    }
    return { pricePerKm: PRICE_PER_KM_SEDAN, vehicleLabel: "Sedan", requiresVan: false };
  }

  /* ── API pública ─────────────────────────────────────────── */

  /**
   * Calcula o valor estimado — USO INTERNO APENAS.
   * Nunca exibir `total` ou `pricePerKm` ao cliente.
   *
   * @param {number} km
   * @param {number} passengers
   * @returns {{ total: number, pricePerKm: number, vehicleLabel: string, requiresVan: boolean }}
   */
  function calculate(km, passengers) {
    const tariff = _getTariff(passengers);
    const raw    = km * tariff.pricePerKm;
    const total  = parseFloat(Math.max(raw, MIN_FARE).toFixed(2));
    return { total, pricePerKm: tariff.pricePerKm, vehicleLabel: tariff.vehicleLabel, requiresVan: tariff.requiresVan };
  }

  /**
   * Retorna apenas o tipo de veículo (seguro para exibir ao cliente).
   * @param {number} passengers
   * @returns {{ vehicleLabel: string, requiresVan: boolean }}
   */
  function getVehicleInfo(passengers) {
    const t = _getTariff(passengers);
    return { vehicleLabel: t.vehicleLabel, requiresVan: t.requiresVan };
  }

  /** Formata BRL — uso interno na mensagem da equipe */
  function formatBRL(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }

  return { calculate, getVehicleInfo, formatBRL, MAX_SEDAN_PASSENGERS };

})();