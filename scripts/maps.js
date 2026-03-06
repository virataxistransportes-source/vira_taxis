/**
 * maps.js
 * ─────────────────────────────────────────────────────────────
 * Camada de integração com Google Maps.
 * Funciona em dois modos:
 *
 *   MODO STUB (padrão, sem API key):
 *     → Campos de endereço funcionam como texto livre.
 *     → Distância não é calculada automaticamente.
 *
 *   MODO ATIVO (com API key configurada no index.html):
 *     → Places Autocomplete nos campos origin e destination.
 *     → Distance Matrix API calcula km entre os pontos.
 *     → Valor calculado internamente e enviado na mensagem.
 *
 * Para ativar:
 *   1. Descomente a tag <script> no index.html com sua API Key
 *   2. As APIs necessárias são:
 *      - Maps JavaScript API
 *      - Places API
 *      - Distance Matrix API
 *      - Geocoding API
 * ─────────────────────────────────────────────────────────────
 */

const MapsService = (() => {

  /* Estado interno */
  let _isActive     = false;  // true quando Google Maps carregou
  let _originPlace  = null;   // google.maps.places.PlaceResult
  let _destPlace    = null;   // google.maps.places.PlaceResult
  let _distanceKm   = null;   // km calculado pela Distance Matrix

  /* ── Callback chamado pela API após carregar ─────────────── */

  /**
   * Ponto de entrada da API do Google Maps.
   * O parâmetro `callback=initGoogleMaps` na URL da API chama esta função.
   */
  window.initGoogleMaps = function () {
    _isActive = true;
    console.info("[MapsService] Google Maps carregado com sucesso.");
    _initAutocomplete("origin",      (place) => { _originPlace = place; _tryResolveDistance(); });
    _initAutocomplete("destination", (place) => { _destPlace   = place; _tryResolveDistance(); });
  };

  /* ── Places Autocomplete ─────────────────────────────────── */

  /**
   * Inicializa o autocomplete de endereços em um campo.
   * @param {string} fieldId - id do input HTML
   * @param {function} onSelect - callback quando o usuário selecionar um lugar
   */
  function _initAutocomplete(fieldId, onSelect) {
    const input = document.getElementById(fieldId);
    if (!input) return;

    const options = {
      componentRestrictions: { country: "br" },
      fields: ["geometry", "formatted_address", "name"],
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        console.warn(`[MapsService] Lugar sem geometria para: ${place.name}`);
        return;
      }
      // Preenche o campo com o endereço formatado
      input.value = place.formatted_address || place.name;
      onSelect(place);
    });
  }

  /* ── Distance Matrix ─────────────────────────────────────── */

  /**
   * Tenta calcular a distância quando ambos os lugares estão selecionados.
   */
  function _tryResolveDistance() {
    if (!_originPlace?.geometry || !_destPlace?.geometry) return;

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins:      [_originPlace.geometry.location],
        destinations: [_destPlace.geometry.location],
        travelMode:   google.maps.TravelMode.DRIVING,
        unitSystem:   google.maps.UnitSystem.METRIC,
        language:     "pt-BR",
      },
      (response, status) => {
        if (status !== "OK") {
          console.warn("[MapsService] Distance Matrix falhou:", status);
          return;
        }

        const element = response.rows[0]?.elements[0];
        if (!element || element.status !== "OK") {
          console.warn("[MapsService] Rota não encontrada.");
          return;
        }

        // Converte metros → km arredondado
        _distanceKm = Math.ceil(element.distance.value / 1000);
        console.info(`[MapsService] Distância calculada: ${_distanceKm} km`);
      }
    );
  }

  /* ── API pública ─────────────────────────────────────────── */

  /**
   * Retorna se a API está ativa.
   * @returns {boolean}
   */
  function isActive() { return _isActive; }

  /**
   * Retorna a distância calculada em km, ou null se não disponível.
   * @returns {number|null}
   */
  function getDistanceKm() { return _distanceKm; }

  /**
   * Limpa o estado (útil para resetar o formulário).
   */
  function reset() {
    _originPlace  = null;
    _destPlace    = null;
    _distanceKm   = null;
  }

  return { isActive, getDistanceKm, reset };

})();