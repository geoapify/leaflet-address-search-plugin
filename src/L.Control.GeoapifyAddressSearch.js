(function (factory, window) {
    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);

    // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        factory(window.L);
    }
}(function (L) {
    L.Control.GeoapifyAddressSearch = L.Control.extend({
        map: null,
        apiKey: null,
        options: {},
        onAdd: function (map) {    
            this.map = map;

            var el = L.DomUtil.create('div', 'geoapify-leaflet-control');
            el.innerHTML = 'GeoapifyAddressSearch Control';
        
            return el;  
        },
        onRemove: function () {
            console.log("removed");
        },
        initialize: function (apiKey, options) {
            this.apiKey = apiKey;
            L.Util.setOptions(this, options);
        }
    });
    
	L.control.addressSearch = function(apiKey, options) {
		return new L.Control.GeoapifyAddressSearch(apiKey, options);
	};
}, window));