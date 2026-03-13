/**
 * calculations.js
 * ────────────────────────────────────────────────────────
 * REGRA DE NEGÓCIO INTERNA
 * Os valores de tarifa por km JAMAIS devem ser exibidos ao
 * cliente na interface. Apenas o resultado final formatado
 * (ex: "R$ 42,00") pode ser mostrado — sem o cálculo.
 * ────────────────────────────────────────────────────────
 */

const Pricing = (() => {

  /* Tarifas internas — não expor ao cliente */
  const MAX_SEDAN_PASSENGERS = 4;
  const MIN_FARE = 20;               // Tarifa mínima
  const KM_THRESHOLD = 30;           // Faixa de preço: até 30 km vs acima de 30 km

  /* Até 30 km */
  const PRICE_PER_KM_SEDAN_UP_TO_30   = 6.0;   // R$/km — 5 lugares
  const PRICE_PER_KM_VAN_UP_TO_30     = 7.0;   // R$/km — 7 lugares
  /* Acima de 30 km */
  const PRICE_PER_KM_SEDAN_ABOVE_30   = 5.0;
  const PRICE_PER_KM_VAN_ABOVE_30     = 6.0;

  function _getPricePerKm(km, requiresVan) {
    const distance = Math.max(0, parseInt(km, 10) || 0);
    if (distance <= KM_THRESHOLD) {
      return requiresVan ? PRICE_PER_KM_VAN_UP_TO_30 : PRICE_PER_KM_SEDAN_UP_TO_30;
    }
    return requiresVan ? PRICE_PER_KM_VAN_ABOVE_30 : PRICE_PER_KM_SEDAN_ABOVE_30;
  }

  function _tariff(passengers) {
    const requiresVan = passengers > MAX_SEDAN_PASSENGERS;
    return {
      vehicleLabel: requiresVan ? 'Carro 7 lugares' : 'Sedan',
      vehicleIcon:  requiresVan ? 'fa-van-shuttle' : 'fa-car',
      requiresVan,
    };
  }

  /**
   * Calcula o valor estimado (USO INTERNO).
   * Até 30 km: sedan R$ 6,00/km, van R$ 7,00/km.
   * Acima de 30 km: sedan R$ 5,00/km, van R$ 6,00/km.
   * Nunca exibir pricePerKm ao cliente.
   */
  function calculate(km, passengers) {
    const pax = Math.max(1, Math.min(6, parseInt(passengers, 10) || 1));
    const distance = Math.max(1, parseInt(km, 10) || 1);
    const t = _tariff(pax);
    const pricePerKm = _getPricePerKm(distance, t.requiresVan);
    const total = parseFloat(Math.max(distance * pricePerKm, MIN_FARE).toFixed(2));
    return { total, pricePerKm, ...t };
  }

  /**
   * Retorna apenas informações de veículo — seguro para exibir.
   */
  function getVehicleInfo(passengers) {
    return _tariff(Math.max(1, Math.min(6, parseInt(passengers, 10) || 1)));
  }

  /** Formata valor em BRL (ex: "42,00") — sem prefixo R$ (o HTML coloca o sup) */
  function formatAmount(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Formata BRL completo para uso interno (mensagem da equipe) */
  function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  return { calculate, getVehicleInfo, formatAmount, formatBRL, MAX_SEDAN_PASSENGERS };

})();