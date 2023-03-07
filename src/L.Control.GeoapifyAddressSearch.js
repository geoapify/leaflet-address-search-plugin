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
        _map: null,
        _apiKey: null,
        _focusedItemIndex: -1,
        _currentPromiseReject: null,
        _currentTimeout: null,
        _currentItems: null,
        _autocompleteItemsElement: null,
        _noResultsElement: null,
        options: {
            autocompleteUrl: 'https://api.geoapify.com/v1/geocode/autocomplete',
            resultsLimit: 5,
            debounceDelay: 100,
            minTextLength: 3,
            className: null,
            placeholder: "Enter an address here",
            noResultsPlaceholder: "No results found",
            resultCallback: null,
            suggestionsCallback: null,
            lang: null,
            mapViewBias: false
        },
        onAdd: function (map) {
            const classPrefix = 'geoapify';
            this._map = map;
            const container = L.DomUtil.create('div', `leaflet-control leaflet-bar ${classPrefix}-leaflet-control ${this.options.className || ''}`);
            // create input element
            const form = this._form = L.DomUtil.create('form', `${classPrefix}-form`, container);
            const input = this._input = L.DomUtil.create('input', `${classPrefix}-address-input`, form);
            input.type = "text";
            input.placeholder = this.options.placeholder || "Enter an address here";

            L.DomEvent.addListener(input, 'input', this._userInput, this);
            L.DomEvent.addListener(input, 'keydown', this._keydown, this);

            L.DomEvent.addListener(input, 'click', this._click, this);
            L.DomEvent.addListener(input, 'down', this._click, this);

            L.DomEvent.on(input, 'focus', (ev) => {
                L.DomEvent.stopPropagation(ev);
            });

            L.DomEvent.disableClickPropagation(input);

            L.DomEvent.addListener(input, 'dblclick', L.DomEvent.stopPropagation);

            L.DomEvent.addListener(container, 'mouseover', () => {
                this._map.dragging.disable();
            });

            L.DomEvent.addListener(container, 'mouseout', () => {
                this._map.dragging.enable();
            });

            const clearButton = this._clearButton = L.DomUtil.create("div", `${classPrefix}-clear-button`, container);
            this._addIcon(clearButton, 'search');

            L.DomEvent.addListener(clearButton, 'click', this._clearFieldAndNotify, this);
            map.on('click', () => {
                this._closeDropDownList();
            });

            return container;
        },
        initialize: function (apiKey, options) {
            this._apiKey = apiKey;
            L.Util.setOptions(this, options);
        },
        _addIcon: (element, iconKey, rotate) => {

            while (element.firstChild) {
                element.removeChild(element.lastChild);
            }

            // Material Design Icons (https://materialdesignicons.com/)
            const icons = {
                "close": {
                    path: "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",
                    viewbox: "0 0 24 24"
                },
                "search": {
                    path: "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
                    viewbox: "0 0 24 24"
                },
                "spinner": {
                    path: "m19.79,10.22c0.13,0.57 0.21,1.17 0.21,1.78c0,4.42 -3.58,8 -8,8s-8,-3.58 -8,-8c0,-4.42 3.58,-8 8,-8c1.58,0 3.04,0.46 4.28,1.25l1.44,-1.44c-1.62,-1.14 -3.59,-1.81 -5.72,-1.81c-5.52,0 -10,4.48 -10,10c0,5.52 4.48,10 10,10s10,-4.48 10,-10c0,-1.19 -0.22,-2.33 -0.6,-3.39l-1.61,1.61z",
                    viewbox: "0 0 24 24"
                }
            }

            var svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
            svgElement.setAttribute('viewBox', icons[iconKey].viewbox);
            svgElement.setAttribute('height', "24");

            var iconElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
            iconElement.setAttribute("d", icons[iconKey].path);
            iconElement.setAttribute('fill', 'currentColor');
            svgElement.appendChild(iconElement);
            element.appendChild(svgElement);

            if (rotate) {
                element.classList.add("geoapify-icon-rotate");                                  
            } else {
                element.classList.remove("geoapify-icon-rotate");                                  
            }
        },
        _clearFieldAndNotify: function (event) {
            L.DomEvent.stopPropagation(event);

            this._input.value = '';
            this._clearButton.classList.remove("visible");
            this._addIcon(this._clearButton, 'search');

            // Cancel previous request
            if (this._currentPromiseReject) {
                this._currentPromiseReject({
                    canceled: true
                });
                this._currentPromiseReject = null;
            }

            // Cancel previous timeout
            if (this._currentTimeout) {
                window.clearTimeout(this._currentTimeout);
                this._currentTimeout = null;
            }

            this._closeDropDownList();
            this._notifyValueSelected(null);
        },
        _setActive: function (items, index) {
            if (!items || !items.length) return false;

            for (var i = 0; i < items.length; i++) {
                items[i].classList.remove("active");
            }

            /* Add class "autocomplete-active" to the active element*/
            items[index].classList.add("active");

            // Change input value and notify
            this._input.value = this._currentItems[index].formatted;
            this._notifyValueSelected(this._currentItems[index]);
        },
        _setValueAndNotify: function (address) {
            this._input.value = address.formatted;
            this._notifyValueSelected(address);
            this._closeDropDownList();
        },
        _userInput: function () {
            const currentValue = this._input.value;

            this._closeDropDownList();
            this._focusedItemIndex = -1;
            this._currentItems = null;

            // Cancel previous request
            if (this._currentPromiseReject) {
                this._currentPromiseReject({
                    canceled: true
                });
                this._currentPromiseReject = null;
            }

            // Cancel previous timeout
            if (this._currentTimeout) {
                window.clearTimeout(this._currentTimeout);
                this._currentTimeout = null;
            }

            if (!currentValue) {
                this._notifyValueSelected(null);
                this._clearButton.classList.remove("visible");
                this._addIcon(this._clearButton, 'search');
                return false;
            }

            // Show clearButton when there is a text
            this._clearButton.classList.add("visible");
            this._addIcon(this._clearButton, 'close');

            if (currentValue.length >= this.options.minTextLength) {
                this._geocodeWithDelay(currentValue);
            }
        },
        _keydown: function (event) {
            if (this._autocompleteItemsElement) {
                const itemElements = this._autocompleteItemsElement.getElementsByTagName("div");
                if (event.keyCode === 40) {
                    L.DomEvent.preventDefault(event);

                    /*If the arrow DOWN key is pressed, increase the focusedItemIndex variable:*/
                    this._focusedItemIndex++;
                    if (this._focusedItemIndex >= itemElements.length) this._focusedItemIndex = 0;
                    /*and and make the current item more visible:*/
                    this._setActive(itemElements, this._focusedItemIndex);
                } else if (event.keyCode === 38) {
                    L.DomEvent.preventDefault(event);

                    /*If the arrow UP key is pressed, decrease the focusedItemIndex variable:*/
                    this._focusedItemIndex--;
                    if (this._focusedItemIndex < 0) this._focusedItemIndex = (itemElements.length - 1);
                    /*and and make the current item more visible:*/
                    this._setActive(itemElements, this._focusedItemIndex);
                } else if (event.keyCode === 13) {
                    /* If the ENTER key is pressed and value as selected, close the list*/
                    L.DomEvent.preventDefault(event);

                    if (this._focusedItemIndex > -1) {
                        this._closeDropDownList();
                    } else {
                        this._setActive(itemElements, 0);
                        this._closeDropDownList();
                    }
                }
            } else {
                if (event.keyCode === 40 || event.keyCode === 38) {
                    this._openDropDownList();
                }
            }
        },
        _openDropDownList: function () {
            if (this._currentItems && this._currentItems.length) {
                /* create a DIV element that will contain the items (values): */
                this._autocompleteItemsElement = L.DomUtil.create('div', `geoapify-autocomplete-items`, this._container);

                /* For each item in the results */
                this._currentItems.forEach((address, index) => {
                    /* Create a DIV element for each element: */
                    const itemElement = L.DomUtil.create('div', `geoapify-autocomplete-item result`, this._autocompleteItemsElement);

                    const textElement = L.DomUtil.create('span', 'address', itemElement)
                    textElement.innerHTML = this._getStyledAddress(address, this._input.value);

                    itemElement.addEventListener("click", (event) => {
                        L.DomEvent.stopPropagation(event);
                        this._setValueAndNotify(this._currentItems[index])
                    });
                });
            } else if (this._currentItems && !this._currentItems.length) {
                /* create a DIV element with NoResults */
                this._noResultsElement = L.DomUtil.create('div', `geoapify-autocomplete-items`, this._container);
                const item = L.DomUtil.create('div', `geoapify-autocomplete-item empty`, this._noResultsElement);
                item.innerHTML = `<span class="no-results">${this.options.noResultsPlaceholder}</span>`
            }
        },
        _closeDropDownList: function () {
            if (this._autocompleteItemsElement) {
                this._container.removeChild(this._autocompleteItemsElement);
                this._autocompleteItemsElement = null;
            }

            if (this._noResultsElement) {
                this._container.removeChild(this._noResultsElement);
                this._noResultsElement = null;
            }

            if (!this._input.value) {
                this._currentItems = null;
            }

            this._map.dragging.enable();
        },
        _click: function (event) {
            if (!this._autocompleteItemsElement && !this._noResultsElement) {
                // open dropdown list again
                this._openDropDownList();
            }

            L.DomEvent.stopPropagation(event);
        },
        _notifyValueSelected: function (address) {
            if (this.options.resultCallback) {
                this.options.resultCallback(address);
            }
        },
        _notifySuggestions: function (addresses) {
            if (this.options.suggestionsCallback) {
                this.options.suggestionsCallback(addresses);
            }
        },
        _generateUrl: function (value) {
            let url = `${this.options.autocompleteUrl}?text=${encodeURIComponent(value)}&apiKey=${this._apiKey}&format=json`;
            // Add type of the location if set. Learn more about possible parameters on https://apidocs.geoapify.com/docs/geocoding/api/api

            if (this.options.resultsLimit) {
                url += `&limit=${this.options.resultsLimit}`;
            }

            if (this.options.lang) {
                url += `&lang=${this.options.lang}`;
            }

            if (this.options.mapViewBias) {
                const rect = this._map.getBounds();

                url += `&bias=rect:${rect.toBBoxString()}`;
            }

            return url;
        },
        _geocodeWithDelay: function (value) {
            this._currentTimeout = window.setTimeout(() => {
                /* Create a new promise and send geocoding request */
                const promise = new Promise((resolve, reject) => {
                    this._currentPromiseReject = reject;
                    
                    this._addIcon(this._clearButton, "spinner", true);

                    let url = this._generateUrl(value);

                    fetch(url)
                        .then((response) => {

                            this._addIcon(this._clearButton, "close");

                            if (response.ok) {
                                response.json().then(data => resolve(data));
                            } else {
                                response.json().then(data => reject(data));
                            }
                        });
                });

                promise.then((data) => {
                    this._currentItems = data.results;
                    this._notifySuggestions(this._currentItems);
                    this._openDropDownList();
                }, (err) => {
                    if (!err.canceled) {
                        // no results

                    }
                });
            }, this.options.debounceDelay);
        },
        _getStyledAddress: function (address, currentValue) {
            let mainPart;
            let secondaryPart;
            const parts = address.formatted.split(',').map((part) => part.trim());

            if (address.name) {
                mainPart = parts[0];
                secondaryPart = parts.slice(1).join(', ');
            } else {
                const mainElements = Math.min(2, Math.max(parts.length - 2, 1));
                mainPart = parts.slice(0, mainElements).join(', ');
                secondaryPart = parts.slice(mainElements).join(', ');
            }

            const valueIndex = mainPart.toLowerCase().indexOf(currentValue.toLowerCase());
            if (valueIndex >= 0) {
                mainPart = mainPart.substring(0, valueIndex) +
                    `<strong>${mainPart.substring(valueIndex, valueIndex + currentValue.length)}</strong>` +
                    mainPart.substring(valueIndex + currentValue.length);

            }

            return `<span class="main-part">${mainPart}</span><span class="secondary-part">${secondaryPart}</span>`
        }
    });

    L.control.addressSearch = function (apiKey, options) {
        return new L.Control.GeoapifyAddressSearch(apiKey, options);
    };
}, window));