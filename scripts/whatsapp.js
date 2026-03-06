/**
 * whatsapp.js
 * Monta a mensagem estruturada e redireciona ao WhatsApp.
 * NOTA: o valor estimado (pricing) é incluído APENAS na mensagem
 * interna enviada para a equipe — nunca exibido na interface.
 */

const WhatsApp = (() => {

  /** Número da equipe Vira Táxis (somente dígitos + DDI) */
  const WHATSAPP_NUMBER = "5511999999999";

  /**
   * Formata data YYYY-MM-DD → DD/MM/YYYY.
   */
  function _fmtDate(iso) {
    if (!iso) return "Não informada";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  /**
   * Formata hora HH:MM para exibição.
   */
  function _fmtTime(t) {
    return t || "Não informado";
  }

  /**
   * Constrói a mensagem de agendamento.
   * O campo de valor estimado é incluído para uso interno da equipe.
   *
   * @param {{
   *   name: string,
   *   phone: string,
   *   origin: string,
   *   destination: string,
   *   date: string,
   *   time: string,
   *   passengers: number,
   *   luggage: number,
   *   vehicleLabel: string,
   *   requiresVan: boolean,
   *   estimatedKm?: number,   // opcional — preenchido pelo Google Maps
   *   total?: number,         // interno — calculado em calculations.js
   *   pricePerKm?: number,    // interno
   * }} data
   * @returns {string}
   */
  function buildMessage(data) {
    const vehicle   = data.requiresVan ? "🚐 Van 7 lugares" : "🚗 Sedan";
    const vanFlag   = data.requiresVan ? "\n   ⚠️ _Grupo grande — van de 7 lugares necessária_" : "";
    const kmLine    = data.estimatedKm
      ? `\n📏 *Distância estimada:* ${data.estimatedKm} km`
      : "";

    // Referência interna de valor — somente para a equipe
    const internalPricing = (data.total && data.pricePerKm)
      ? `\n\n━━━━━━━━━━━━━━━━━━━━\n`
        + `📋 *REFERÊNCIA INTERNA (equipe)*\n`
        + `   Tarifa: ${Pricing.formatBRL(data.pricePerKm)}/km\n`
        + `   Estimativa: ${Pricing.formatBRL(data.total)}\n`
        + `   _(confirme e ajuste antes de responder ao cliente)_`
      : "";

    return (
      `Olá, Vira Táxis! 👋\n\n`
    + `Gostaria de agendar uma viagem. Seguem os detalhes:\n\n`
    + `━━━━━━━━━━━━━━━━━━━━\n`
    + `👤 *Nome:* ${data.name}\n`
    + `📱 *Telefone/WhatsApp:* ${data.phone}\n`
    + `━━━━━━━━━━━━━━━━━━━━\n`
    + `📍 *Origem:* ${data.origin}\n`
    + `🏁 *Destino:* ${data.destination}\n`
    + kmLine + `\n`
    + `━━━━━━━━━━━━━━━━━━━━\n`
    + `📅 *Data:* ${_fmtDate(data.date)}\n`
    + `🕐 *Horário:* ${_fmtTime(data.time)}\n`
    + `━━━━━━━━━━━━━━━━━━━━\n`
    + `👥 *Passageiros:* ${data.passengers} pessoa${data.passengers > 1 ? "s" : ""}\n`
    + `🧳 *Bagagens:* ${data.luggage} volume${data.luggage !== 1 ? "s" : ""}\n`
    + `${vehicle}${vanFlag}\n`
    + `━━━━━━━━━━━━━━━━━━━━\n\n`
    + `Aguardo confirmação. Obrigado! 🙏`
    + internalPricing
    );
  }

  /**
   * Abre o WhatsApp com a mensagem montada.
   * @param {object} data — mesmo objeto de buildMessage
   */
  function redirect(data) {
    const msg = buildMessage(data);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return { redirect, buildMessage };

})();