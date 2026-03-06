/**
 * maps.js — Google Maps Integration Layer
 * Modo stub (sem API): campos são texto livre.
 * Modo ativo (com API key no index.html): Places Autocomplete
 * + Distance Matrix calcula km real.
 */

const MapsService = (() => {
  let _active = false, _origin = null, _dest = null, _km = null;

  window.initGoogleMaps = function () {
    _active = true;
    _initAC('origin',      p => { _origin = p; _tryDist(); });
    _initAC('destination', p => { _dest   = p; _tryDist(); });
  };

  function _initAC(id, onSelect) {
    const el = document.getElementById(id);
    if (!el) return;
    const ac = new google.maps.places.Autocomplete(el, {
      componentRestrictions: { country: 'br' },
      fields: ['geometry','formatted_address','name'],
    });
    ac.addListener('place_changed', () => {
      const p = ac.getPlace();
      if (!p.geometry) return;
      el.value = p.formatted_address || p.name;
      onSelect(p);
    });
  }

  function _tryDist() {
    if (!_origin?.geometry || !_dest?.geometry) return;
    new google.maps.DistanceMatrixService().getDistanceMatrix(
      { origins: [_origin.geometry.location], destinations: [_dest.geometry.location],
        travelMode: google.maps.TravelMode.DRIVING, unitSystem: google.maps.UnitSystem.METRIC },
      (res, status) => {
        if (status !== 'OK') return;
        const el = res.rows[0]?.elements[0];
        if (el?.status === 'OK') {
          _km = Math.ceil(el.distance.value / 1000);
          // Dispara evento para o ui.js atualizar a cotação
          document.dispatchEvent(new CustomEvent('maps:distance', { detail: { km: _km } }));
        }
      }
    );
  }

  function isActive()     { return _active; }
  function getDistanceKm(){ return _km; }
  function reset()        { _origin = null; _dest = null; _km = null; }

  return { isActive, getDistanceKm, reset };
})();