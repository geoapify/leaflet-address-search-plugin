# Geoapify + Leaflet: Address Search Plugin
The Address Autocomplete Plugin adds a convenient way of entering addresses in your Leaflet map. It uses [Geoapify Location Platform](https://www.geoapify.com/) as geocoding service. Learn more about the geocoding service on [the Geocoding API page](https://www.geoapify.com/geocoding-api/).

## Demos
Here are live-demos of the Geoapify Address Search Plugin for Leaflet:

* [Address Autocomplete Field Demo](https://geoapify.github.io/leaflet-address-search-plugin/index.html)
* [Custom styling for the Address Autocomplete](https://geoapify.github.io/leaflet-address-search-plugin/examples/styling.html)
* [Localize Address Autocomplete](https://geoapify.github.io/leaflet-address-search-plugin/examples/localization.html)
* [Bias to the map view](https://geoapify.github.io/leaflet-address-search-plugin/examples/user-location.html)
* [Show locations and address suggestions](https://geoapify.github.io/leaflet-address-search-plugin/examples/icons.html)
## Install
You can add the Address Autocomplete plugin in several different ways, depending on the programming framework and project structure you’re using.
### Option 1. NPM install
You can install the Address Search plugin with the NPM command:
```
npm i @geoapify/leaflet-address-search-plugin
```

You will need to import the stylesheet into your project. You can import Leaflet styles similarly to how you imported the Leaflet styles:
```
"node_modules/leaflet/dist/leaflet.css",
"node_modules/@geoapify/leaflet-address-search-plugin/dist/L.Control.GeoapifyAddressSearch.min.css"
```

Here is an example of importing the plugin to your JavaScript (TypeScript) files:

```
import * as L from 'leaflet';
import '@geoapify/leaflet-address-search-plugin';
```

### Option 2. Link to the library in HTML
You can also add a link to the unpkg CDN in your HTML file:
```
<link rel="stylesheet" href="https://unpkg.com/@geoapify/leaflet-address-search-plugin@^1/dist/L.Control.GeoapifyAddressSearch.min.css" />
<script src="https://unpkg.com/@geoapify/leaflet-address-search-plugin@^1/dist/L.Control.GeoapifyAddressSearch.min.js"></script>

```
## Usage
Here is a step-by-step guide that will help you add the Address Search field to your Leaflet map:

#### Step 1. Get a Geoapify API key
Sign up and get an API key on the [MyProjects.geoapify.com](https://myprojects.geoapify.com/). Or, to make it plain, check the detailed instructions on [the Get Started page](https://www.geoapify.com/get-started-with-maps-api/). 

You can start with Geoapify for Free, with no credit card required. **The Free plan includes 3000 requests per day**. When you need more, choose an appropriate [Geoapify Pricing Plan](https://www.geoapify.com/pricing/).

#### Step 2. Add an Address Search field to the map

Address Autocomplete is a Leaflet control, so you can add it as you would any other Leaflet control:
```javascript
const addressSearchControl = L.control.addressSearch(apiKey, { /* options */ });
map.addControl(addressSearchControl);
```

Here is an example of how to insert the Address Search field:

```javascript
var map = L.map('my-map').setView([48.1500327, 11.5753989], 6);

var myAPIKey = "YOUR_API_KEY"; // Get an API Key on https://myprojects.geoapify.com
var mapURL = L.Browser.retina
  ? `https://maps.geoapify.com/v1/tile/{mapStyle}/{z}/{x}/{y}.png?apiKey={apiKey}`
  : `https://maps.geoapify.com/v1/tile/{mapStyle}/{z}/{x}/{y}@2x.png?apiKey={apiKey}`;

// Add map tiles layer. Set 20 as the maximal zoom and provide map data attribution.
L.tileLayer(mapURL, {
  attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" rel="nofollow" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" rel="nofollow" target="_blank">© OpenStreetMap</a> contributors',
  apiKey: myAPIKey,
  mapStyle: "osm-bright-smooth", // More map styles on https://apidocs.geoapify.com/docs/maps/map-tiles/
  maxZoom: 20
}).addTo(map);

// Add Geoapify Address Search control
const addressSearchControl = L.control.addressSearch(myAPIKey, {
  position: 'topleft',
  resultCallback: (address) => {
    console.log(address)
  },
  suggestionsCallback: (suggestions) => {
    console.log(suggestions);
  }
});
map.addControl(addressSearchControl);
L.control.zoom({ position: 'bottomright' }).addTo(map);
```

Note that you can also use Geoapify to create Leaflet tile layers. [Here](https://apidocs.geoapify.com/docs/maps/map-tiles/) you can find more information about provided map styles and URL examples.

### Options
Here are search options supported by the Address Search Plugin:

| Option | Type | Default value | Description |
| --- | --- | --- | --- |
| **placeholder** | *string* | "Enter an address here" | Text shown in the Address Search field when it's empty |
| **noResultsPlaceholder** | *string* | "No results found" | Text shown when no results found for the entered address |
| **className** | *string* | `undefined` | Custom class name added to the control to customize its style |
| **resultsLimit** | *number* | 5 | Number of address suggestions shown in the Address Search drop-down list |
| **debounceDelay** | *number* | 100 | Timeout in ms to execute the Geocoding API call after a user stops typing. The timeout helps to optimize API calls and avoid running unnecessary API requests. |
| **minTextLength** | *number* | 3 | Minimum text length when the Address Search executed |
| lang | *ISO 2 Letter Language Code* | 'en' | Result language, see the supported languages list on [the Localization Demo](https://geoapify.github.io/leaflet-address-search-plugin/examples/localization.html) |
| mapViewBias | *boolean* | false | Add a bias to the map view to search addresses nearby first |
| resultCallback | *(address) => {}* | `undefined` | Callback to notify when a user has selected an address |
| suggestionsCallback | *(addresses: []) => {}* | `undefined` | Callback to notify when new suggestions have been obtained for the entered text |

### Address data structure
The Address Search plugin returns addresses in the Geoapify format. For more information, see [the documentation page](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/).

## About Geoapify

[Geoapify Location Platform](https://www.geoapify.com/) offers APIs and components for digital maps and spatial solutions:

* Map tiles
* Geocoding / Reverse Geocoding / Address Autocomplete
* Routing / Time-Distance Matrix / Snap-to-Roads
* Vehicle Route Optimization
* Isochrones and Isodistances

Businesses can use the APIs as building blocks to solve various tasks in Logistics, Real Estate, Travel & Entertainment, and other areas.