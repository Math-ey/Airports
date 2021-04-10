
const API = 'http://localhost:3000/map'
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

getJsonData(`${API}/area-distribution`).then((res) => {
    if (res.length > 0) {
        areaDistribution["values"] = res;
    }
})

function getAirplaneMarker(feature) {
    var area = feature.properties.area;
    for (var i = 0; i < areaDistribution.values.length; i++) {
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
        case "restaurant":
        case "fast_food":
        case "food_court":
            return L.AwesomeMarkers.icon({ icon: 'cutlery', prefix: 'fa', markerColor: 'green' });
        case "cafe":
            return L.AwesomeMarkers.icon({ icon: 'coffee', prefix: 'fa', markerColor: 'cadetblue' });
    }
}

function getAirportAreaStyle(area) {
    for (var i = 0; i < areaDistribution.values.length; i++) {
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

function addLayer(layerName, params) {
    switch (layerName) {
        case 'all-airports-layer':
            getJsonData(`http://localhost:3000/api/airports`).then((res) => {
                clearMap();
                let layer = L.geoJSON(res.geojson, {
                    style: (feature) => getAirportAreaStyle(feature.properties.area),
                    onEachFeature: onEachFeatureAllAirports
                });
                layer.addTo(layers.polygons);
                mapObj.setView(mapOptions.center, mapOptions.zoom);
            })
            break;
        case 'searched-airport-layer':
            getJsonData(`http://localhost:3000/api/airports/${params.id}`).then((res) => {
                clearMap();
                let layer = L.geoJSON(res.geojson, {
                    style: (feature) => getAirportAreaStyle(feature.properties.area),
                    onEachFeature: onEachFeatureSingleAirport
                });
                layer.addTo(layers.polygons);
                $('#airportSearchModal').modal('hide');
            })

            break;


    }
}

const pageSize = 6;
const airportSearchResultsContent = `
    <br/>
    <h5>Search results:</h5>
    <table id="airportTable" class="table table-bordered table table-hover" cellspacing="0" width="100%">
        <colgroup>
            <col>
        </colgroup>
        <thead>

        </thead>
        <tbody id="table_body">
        </tbody>
    </table>
    <div id="pager">
        <ul id="pagination" class="pagination-sm"></ul>
    </div>
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

            displayRecords.forEach(x => {
                let tr = $('<tr/>');
                tr.append("<td>" + `<a href="#" id="airport-choice" data-id="${x.id}" data-layerName="searched-airport-layer">${x.title}</a>` + "</td>");
                $('#table_body').append(tr);
            })
        }
    });
}


function airportSearchClick(airportInput) {
    getJsonData(`http://localhost:3000/api/airports/names?searchVal=${encodeURI(airportInput)}`).then((res) => {
        $("#airportsDiv").empty();
        if (res.length > 0) {
            $("#airportsDiv").append(airportSearchResultsContent);
            totalPages = Math.ceil(res.length / pageSize);
            applyAirportsPagination(res, totalPages);
        }
        else {
            $("#airportsDiv").append(`
                    <br/>
                    <h5>No results</h5>
                `);
        }
    });
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

function getNearestFoodDrink(lat, lon) {
    $.ajax({
        url: `http://localhost:3000/map/getNearestFoodDrink?lon=${lon}&lat=${lat}`,
        dataType: "json",
        success: function (response) {
            myLayer2 = L.geoJSON(response, {
                onEachFeature: function (feature, layer) {
                    var text = `
                            <h2><b>${feature.properties.name}</b></h2>
                            <ul>
                                <li>Type: ${feature.properties.amenity}</li>
                                <li>Distance: ${feature.properties.dist.toFixed(2)} m</li>
                            </ul>
                        `;
                    L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], { icon: getFoodDrinkMarker(feature) }).addTo(layers.markers).bindPopup(text);
                }
            });
        }
    })
}

