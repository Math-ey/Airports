const API = 'http://localhost:3000/api';
const WeatherAPI = 'http://api.openweathermap.org/data/2.5/weather';
const accessToken = 'pk.eyJ1IjoiYnJlYWRtYW4iLCJhIjoiY2pvYWN5cmpsMGRrdTN3bzVjejY0dmw3YiJ9._oHtPhbeqmwI-5cECzraBg';
const MAPBOX_API = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';

const mapOptions = {
    center: [54.237933, -2.36967],
    zoom: 6
};

const mapObj = L.map('mapid', mapOptions);

L.tileLayer(MAPBOX_API, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: accessToken
}).addTo(mapObj);

let layers = {
    polygons: L.layerGroup([]).addTo(mapObj),
    markers: L.layerGroup([]).addTo(mapObj),
    lines: L.layerGroup([]).addTo(mapObj)
}

let areaDistribution = {
    markerScale: ["orange", "orange", "orange", "red", "red", "darkred", "darkred"],
    colorScale: ["#F8EF68", "#ECCD5B", "#E0AC4E", "#D48A41", "#C86934", "#BC4727", "#B1261B"]
};

function getJsonData(url, params) {
    return $.ajax({
        url: url,
        type: 'GET',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: params
    });
}

function getAirplaneMarker(feature) {
    const area = feature.properties.area;
    for (let i = 0; i < areaDistribution.values.length; i++) {
        if (area < areaDistribution.values[i]) {
            return L.AwesomeMarkers.icon({
                icon: 'plane',
                prefix: 'fa',
                markerColor: areaDistribution.markerScale[i]
            });
        }
    }
    return L.AwesomeMarkers.icon({
        icon: 'plane',
        prefix: 'fa',
        markerColor: 'darkred'
    });
}

function getFoodDrinkMarker(feature) {
    switch (feature.properties.amenity) {
        case "bar":
            return L.AwesomeMarkers.icon({ icon: 'glass', prefix: 'fa', markerColor: 'purple' });
        case "fast_food":
            return L.AwesomeMarkers.icon({ icon: 'hamburger', prefix: 'fa', markerColor: 'green' });
        case "restaurant":
        case "food_court":
            return L.AwesomeMarkers.icon({ icon: 'cutlery', prefix: 'fa', markerColor: 'green' });
        case "cafe":
            return L.AwesomeMarkers.icon({ icon: 'coffee', prefix: 'fa', markerColor: 'cadetblue' });
        case "ice_cream":
            return L.AwesomeMarkers.icon({ icon: 'ice-cream', prefix: 'fa', markerColor: 'yellow' });
        case "pub":
            return L.AwesomeMarkers.icon({ icon: 'beer', prefix: 'fa', markerColor: 'purple' });
    }
}

function getRangeMarker(type) {
    switch (type) {
        case "src":
            return L.AwesomeMarkers.icon({ icon: 'plane-departure', prefix: 'fa', markerColor: 'green' });
        case "dst":
            return L.AwesomeMarkers.icon({ icon: 'flag', prefix: 'fa', markerColor: 'red' });
    }
}

function getAirportAreaStyle(area) {
    for (let i = 0; i < areaDistribution.values.length; i++) {
        if (area < areaDistribution.values[i]) {
            return {
                color: areaDistribution.colorScale[i],
                fillColor: areaDistribution.colorScale[i],
                fillOpacity: .5
            }
        }
    }

    let lastIdx = areaDistribution.values.length - 1;
    return {
        color: areaDistribution.colorScale[lastIdx],
        fillColor: areaDistribution.colorScale[lastIdx],
        fillOpacity: .5
    }
}

function setMarker(text, icon, lat, lng) {
    let marker = L.marker([lat, lng], { icon }).addTo(layers.markers);
    marker.bindPopup(text)
    return marker;
}

function onEachFeatureAllAirports(feature, layer) {
    const polygon = L.polygon(feature.geometry.coordinates);
    const center = polygon.getBounds().getCenter();
    const markerIcon = getAirplaneMarker(feature);
    const markerText = `<h2><b>${feature.properties.title}</b></h2><p>Area: ${feature.properties.area.toFixed(2)} m<sup>2</sup></p>`;

    let marker = setMarker(markerText, markerIcon, center.lng, center.lat);
    marker.on('mouseover', e => marker.openPopup())
        .on('mouseout', e => marker.closePopup())
        .on('click', e => {
            let { lat, lng } = e.latlng;
            mapObj.setView([lat, lng], 13);
            getNearestFoodDrink(lat, lng);
        })
}

function onEachFeatureSingleAirport(feature, layer) {
    const polygon = L.polygon(feature.geometry.coordinates);
    const center = polygon.getBounds().getCenter();
    const markerIcon = getAirplaneMarker(feature);
    const markerText = `<h2><b>${feature.properties.title}</b></h2><p>Area: ${feature.properties.area.toFixed(2)} m<sup>2</sup></p>`;

    let marker = setMarker(markerText, markerIcon, center.lng, center.lat);
    marker.openPopup();

    getNearestFoodDrink(center.lng, center.lat);
    mapObj.setView([center.lng, center.lat], 13);
}

function reverse(arr) {
    return arr.map((val, idx) => arr[arr.length - 1 - idx]);
}

function addLayer(layerName, params) {
    switch (layerName) {
        case 'all-airports':
            getJsonData(`${API}/airports`).then((res) => {
                clearMap();
                let layer = L.geoJSON(res.geojson, {
                    style: (feature) => getAirportAreaStyle(feature.properties.area),
                    onEachFeature: onEachFeatureAllAirports
                });
                layer.addTo(layers.polygons);
                mapObj.setView(mapOptions.center, mapOptions.zoom);
            })
            break;
        case 'searched-airport':
            getJsonData(`${API}/airports/${params.id}`).then((res) => {
                clearMap();
                let layer = L.geoJSON(res.geojson, {
                    style: (feature) => getAirportAreaStyle(feature.properties.area),
                    onEachFeature: onEachFeatureSingleAirport
                });
                layer.addTo(layers.polygons);
                $('#airportSearchModal').modal('hide');
            })

            break;
        case 'aircrafts-range':
            getJsonData(`${API}/range`, params).then(res => {
                clearMap();
                const src_polygon = L.polygon(res.source_geojson.features[0].geometry.coordinates);
                const dst_polygon = L.polygon(res.dest_geojson.features[0].geometry.coordinates);

                const src_center = src_polygon.getBounds().getCenter();
                const dst_center = dst_polygon.getBounds().getCenter();

                const srcMarkerText = `<h2><b>Source:</b></h2><p>${res.source_geojson.features[0].properties.title}</p>`;
                const srcMarkerIcon = getRangeMarker("src");

                const dstMarkerText = `<h2><b>Destination:</b></h2><p>${res.dest_geojson.features[0].properties.title}</p>`;
                const dstMarkerIcon = getRangeMarker("dst");

                setMarker(srcMarkerText, srcMarkerIcon, src_center.lng, src_center.lat);
                setMarker(dstMarkerText, dstMarkerIcon, dst_center.lng, dst_center.lat);

                const lerp_geom = res.interpolation_geojson.features[0].geometry;

                if (lerp_geom) {
                    const text = `
                        <div class="row">
                            <div class="col-2 img-container"><img src="../assets/img/error.svg" class="icon" width="40"></div>
                            <div class="col-10"><p>This plane wouldn't make the whole flight with provided amount of fuel. </p></div>
                        </div>
                        <ul>
                            <li>Provided amount of fuel: ${selected_aircraft.fuelLoad} kg</li>
                            <li>Distance between airports: ${res.dist.toFixed(2)} km</li>
                            <li>Max flight distance: ${selected_aircraft.maxDistance.toFixed(2)} km</li>
                            <li>Remaining distance: ${(res.dist - selected_aircraft.maxDistance).toFixed(2)} km</li>
                        </ul>
                    `;
                    L.polyline([[src_center.lng, src_center.lat], reverse(lerp_geom.coordinates[0])], { color: '#339532', weight: 5, opacity: .9 }).addTo(layers.lines).bindPopup(text).openPopup();
                    L.polyline([reverse(lerp_geom.coordinates[0]), [dst_center.lng, dst_center.lat]], { color: '#8A322E', weight: 5, opacity: .9, dashArray: '15' }).addTo(layers.lines);
                }
                else {
                    const timeOfTravel = res.dist / selected_aircraft.description.max_speed;
                    const consumed = selected_aircraft.description.fuel_consumption * timeOfTravel;
                    const text = `
                        <div class="row">
                            <div class="col-2 img-container"><img src="../assets/img/success.svg" class="icon" width="40"></div>
                            <div class="col-10"><p>Selected plane has just enough amount of fuel to reach destination airport.</p></div>
                        </div>
                        <ul>
                            <li>Provided amount of fuel: ${selected_aircraft.fuelLoad} kg</li>
                            <li>Distance between airports: ${res.dist.toFixed(2)} km</li>
                            <li>Max flight distance: ${selected_aircraft.maxDistance.toFixed(2)} km</li>
                            <li>Remaining fuel: ${(selected_aircraft.fuelLoad - consumed).toFixed(2)} kg</li>
                        </ul>
                    `;
                    L.polyline([[src_center.lng, src_center.lat], [dst_center.lng, dst_center.lat]], { color: '#339532', weight: 5, opacity: .9 }).addTo(layers.lines).bindPopup(text).openPopup();
                }

                $('#aircraftRangeModal').modal('hide');
            })
            break;
        case 'flight-weather':

            getJsonData(`${API}/route-segments`, params).then(res => {
                clearMap();

                const pointsForWeaether = res.segment_geojson.features[0].geometry.coordinates;

                const src_polygon = L.polygon(res.source_geojson.features[0].geometry.coordinates);
                const dst_polygon = L.polygon(res.dest_geojson.features[0].geometry.coordinates);

                const src_center = src_polygon.getBounds().getCenter();
                const dst_center = dst_polygon.getBounds().getCenter();

                const srcMarkerText = `<h2><b>Source:</b></h2><p>${res.source_geojson.features[0].properties.title}</p>`;
                const srcMarkerIcon = getRangeMarker("src");

                const dstMarkerText = `<h2><b>Destination:</b></h2><p>${res.dest_geojson.features[0].properties.title}</p>`;
                const dstMarkerIcon = getRangeMarker("dst");

                setMarker(srcMarkerText, srcMarkerIcon, src_center.lng, src_center.lat);
                setMarker(dstMarkerText, dstMarkerIcon, dst_center.lng, dst_center.lat);

                let line = L.polyline([[src_center.lng, src_center.lat], [dst_center.lng, dst_center.lat]], { color: '#339532', weight: 5, opacity: .9, }).addTo(layers.lines);

                pointsForWeaether.forEach((val, idx) => {
                    const [lon, lat] = val;
                    getJsonData(`${API}/weather`, { lon, lat }).then(weatherRes => {
                        if (!isGoodWeather(weatherRes.weather)) {
                            const lineText = `
                                <div class="row">
                                    <div class="col-2 img-container"><img src="../assets/img/error.svg" class="icon" width="40"></div>
                                    <div class="col-10"><p>The flight could be dangerous due to bad weather along this trajectory of flight.</p></div>
                                </div>
                            `;
                            L.marker([lat, lon], { icon: L.icon({ iconUrl: `http://openweathermap.org/img/w/${weatherRes.weather[0].icon}.png`, iconAnchor: [30, 40] }) }).addTo(layers.markers).bindPopup(weatherRes.weather[0].description);
                            line.bindPopup(lineText);
                        }
                        else {
                            const lineText = `
                                <div class="row">
                                    <div class="col-2 img-container"><img src="../assets/img/success.svg" class="icon" width="40"></div>
                                    <div class="col-10"><p>The weather is OK along this trajectory of flight.</p></div>
                                </div>
                            `;
                            line.bindPopup(lineText);
                        }
                        line.openPopup();
                    })
                })
                $('#aviationWeatherModal').modal('hide');
            });
            break;
    }
}

function isGoodWeather(weather) {
    const badWeatherIdIntervals = [[200, 232], [500, 513], [600, 622]];
    const otherBadWeatherIds = [762, 771, 781];

    weather.forEach(w => {
        badWeatherIdIntervals.forEach(ids => {
            if (w.id >= ids[0] && w.id <= ids[1]) {
                return false;
            }
        })
        if (otherBadWeatherIds.includes(w.id)) {
            return false;
        }
    })

    return true;
}

const pageSize = 6;
const airportSearchResultsContent = `
    <br/>
    <h5>Search results:</h5>
    <table id="airportTable" class="table table-bordered table table-hover" cellspacing="0" width="100%">
        <colgroup><col></colgroup>
        <thead></thead>
        <tbody id="table_body"></tbody>
    </table>
    <div id="pager"><ul id="pagination" class="pagination-sm"></ul></div>
`;

function applyAirportsPagination(arr, totalPages) {
    $('#pagination').empty();
    $('#pagination').twbsPagination({
        totalPages,
        visiblePages: 6,
        onPageClick: (event, page) => {
            displayRecordsIndex = Math.max(page - 1, 0) * pageSize;
            endRec = (displayRecordsIndex) + pageSize;
            displayRecords = arr.slice(displayRecordsIndex, endRec);

            $('#table_body').empty();
            displayRecords.forEach(x => $('#table_body').append('<tr>').append(`<td><a href="#" id="airport-choice" data-id="${x.id}" data-layerName="searched-airport">${x.title}</a></td>`))
        }
    });
}


function airportSearchClick(airportInput) {
    getJsonData(`${API}/airports/names?searchVal=${encodeURI(airportInput)}`).then((res) => {
        $("#airportsDiv").empty();
        if (res.length > 0) {
            $("#airportsDiv").append(airportSearchResultsContent);
            totalPages = Math.ceil(res.length / pageSize);
            applyAirportsPagination(res, totalPages);
        }
        else {
            $("#airportsDiv").append(`<br/><h5>No results</h5>`);
        }
    });
}

function getNearestFoodDrink(lat, lon) {
    getJsonData(`${API}/amenity/sustenance/near-to`, { lat, lon }).then((res) => {
        L.geoJSON(res.geojson, {
            onEachFeature: (feature, layer) => {
                const { name, dist, amenity } = feature.properties;
                const { coordinates } = feature.geometry;

                const markerText = `
                    <h2><b>${name}</b></h2>
                    <ul><li>Type: ${amenity}</li><li>Distance: ${dist.toFixed(2)} m</li></ul>`;
                const markerIcon = getFoodDrinkMarker(feature);

                setMarker(markerText, markerIcon, ...reverse(coordinates));
            }
        })
    })
}

function loadAirportsToSelect(startingChars, selectId) {
    $(selectId).prop("disabled", true);
    getJsonData(`${API}/airports/names`, { startingChars }).then(res => {
        $(selectId).empty();
        $(selectId).append('<option value="" disabled selected>Select your option</option>');
        if (res.length > 0) {
            $.each(res, (index, value) => {
                $(selectId).append(`<option value="${value.id}">${value.title}</option>`);
            })
            $(selectId).prop("disabled", false);
        }
    })
}

let selected_aircraft = {};
function aircraftSelected(id) {
    getJsonData(`${API}/aircrafts/${id}`).then(res => {
        if (res) {
            selected_aircraft['description'] = res;
            console.log(selected_aircraft);
            $("#aircraft-div")
                .prop('hidden', false)
                .empty()
                .append(`
                    <div class="row">
                        <div class="col-md-6">
                            <img src="${selected_aircraft.description.img_url}" width="220">
                        </div>
                        <div class="col-md-6">
                            <p>Name: ${selected_aircraft.description.name}</p>
                            <p> Max speed: ${selected_aircraft.description.max_speed} km/h</p>
                            <p>Fuel consumption: ${selected_aircraft.description.fuel_consumption} kg/h</p>
                            <div class="form-group">
                                <label for="fuelLoadInput">Fuel load in kg</label>
                                <input type="number" class="form-control" onkeyup='validateRangeForm()' id="fuelLoadInput" placeholder="Enter fuel load" required>
                            </div>
                        </div>
                    </div>
				`);
        }
    })
}

function validateRangeForm() {
    if ($("#fuelLoadInput").val().length > 0 && $("#sourceAirportSelect").prop("selectedIndex") != 0 && $("#destinationAirportSelect").prop("selectedIndex") != 0) {
        $("#range-button").prop('disabled', false);
    } else {
        $("#range-button").prop('disabled', true);
    }
}

function validateFlightWeatherForm() {
    if ($("#sourceAirportSelect2").prop("selectedIndex") != 0 && $("#destinationAirportSelect2").prop("selectedIndex") != 0) {
        $("#weather-button").prop('disabled', false);
    } else {
        $("#weather-button").prop('disabled', true);
    }
}

function clearMap() {
    layers.polygons.clearLayers();
    layers.markers.clearLayers();
    layers.lines.clearLayers();
};

$('#clear-button').on('click', (e) => {
    e.preventDefault();
    clearMap();
});

$(document).on("click", "#airport-choice", (e) => {
    addLayer(e.currentTarget.dataset.layername, { id: e.currentTarget.dataset.id })
});

$('#aircraft-select').on('change', (e) => {
    aircraftSelected(e.currentTarget.value);
});

$(document).on("click", "#range-button", (e) => {
    const fuelLoad = $("#fuelLoadInput").val();
    const timeToConsumeAll = fuelLoad / selected_aircraft.description.fuel_consumption;
    const maxDistance = selected_aircraft.description.max_speed * timeToConsumeAll;

    selected_aircraft['fuelLoad'] = fuelLoad;
    selected_aircraft['timeToConsumeAll'] = timeToConsumeAll;
    selected_aircraft['maxDistance'] = maxDistance;

    addLayer("aircrafts-range", {
        sourceId: $("#sourceAirportSelect option:selected").val(),
        destinationId: $("#destinationAirportSelect option:selected").val(),
        maxDistance
    })
})

$(document).on("click", "#weather-button", (e) => {
    addLayer('flight-weather', {
        sourceId: $("#sourceAirportSelect2 option:selected").val(),
        destinationId: $("#destinationAirportSelect2 option:selected").val()
    })
})

$(document).ready(() => {
    getJsonData(`${API}/airports/areal-percentiles`).then((res) => {
        if (res.length > 0) {
            areaDistribution["values"] = res;
        }
    })
    
    getJsonData(`${API}/aircrafts/names`).then(res => {
        if (res.length > 0) {
            $('#aircraft-select').prop('disabled', false);
            res.forEach(x => {
                $("#aircraft-select").append(`<option 
                value="${x.id}">${x.name}</option>`);
            })
        }
    })
    
    validateRangeForm();
    validateFlightWeatherForm();
})