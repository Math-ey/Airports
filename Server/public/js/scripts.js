
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

var myLayer = L.geoJSON().addTo(mapObj);
var myLayer2 = L.geoJSON().addTo(mapObj);
var markerLayer = L.geoJSON().addTo(mapObj);
var lineLayer = L.geoJSON().addTo(mapObj);

var areaDistribution = {
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
            break;
        case "restaurant":
        case "fast_food":
        case "food_court":
            return L.AwesomeMarkers.icon({ icon: 'cutlery', prefix: 'fa', markerColor: 'green' });
            break;
        case "cafe":
            return L.AwesomeMarkers.icon({ icon: 'coffee', prefix: 'fa', markerColor: 'cadetblue' });
            break;
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
    let marker = L.marker([lat, lng], { icon }).addTo(mapObj);
    marker.bindPopup(text)
    return marker;
}

function onEachFeatureAllAirports(feature, layer) {
    polygon = L.polygon(feature.geometry.coordinates);

    var center = polygon.getBounds().getCenter();
    var markerIcon = getAirplaneMarker(feature);

    var markerText = `<h2><b>${feature.properties.title}</b></h2><p>Area: ${feature.properties.area.toFixed(2)} m<sup>2</sup></p>`;
    let marker = setMarker(markerText, markerIcon, center.lng, center.lat);
    marker.on('mouseover', e => marker.openPopup())
        .on('mouseout', e => marker.closePopup())
        .on('click', e => {
            let { lat, lng } = e.latlng;
            mapObj.setView([lat, lng], 13);
            getNearestFoodDrink(lat, lng);
        })
}

function addLayer(layerName) {
    switch (layerName) {
        case 'all-airports-layer':
            getJsonData(`${API}/getAllAirports`).then((res) => {
                let layer = L.geoJSON(res, {
                    style: (feature) => getAirportAreaStyle(feature.properties.area),
                    onEachFeature: onEachFeatureAllAirports
                });
                mapObj.addLayer(layer);
            })
    }
}



function getAllAirports() {
    $.ajax({
        url: "http://localhost:3000/map/getAllAirports",
        dataType: "json",
        success: (res) => {
            clearMap();
            myLayer = L.geoJSON(res, {
                style: (feature) => getAirportAreaStyle(feature.properties.area),
                onEachFeature: function (feature, layer) {
                    polygon = L.polygon(feature.geometry.coordinates);
                    var center = polygon.getBounds().getCenter();

                    var markerStyle = getAirplaneMarker(feature);

                    var markerText = `
                        <h2><b>${feature.properties.title}</b></h2>
                        <p>Area: ${feature.properties.area.toFixed(2)} m<sup>2</sup></p>
                    `;
                    var marker = L.marker([center.lng, center.lat], { icon: markerStyle }).addTo(markerLayer).bindPopup(markerText).on('mouseover', function (e) {
                        marker.openPopup();
                    }).on('mouseout', function (e) {
                        marker.closePopup();
                    }).on('click', function (e) {
                        mapObj.setView([e.latlng.lat, e.latlng.lng], 13);
                        getNearestFoodDrink(e.latlng.lat, e.latlng.lng);

                    });

                    layer.bindPopup(markerText).on('mouseover', function (e) {
                        marker.openPopup();
                    }).on('mouseout', function (e) {
                        marker.closePopup();
                    }).on('click', function (e) {
                        mapObj.setView([e.latlng.lat, e.latlng.lng], 13);
                        getNearestFoodDrink(e.latlng.lat, e.latlng.lng);
                    });

                }
            }).addTo(myLayer);
        }
    });
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

function applyAirportsPagination(airports, totalPages) {
    $('#pagination').empty();
    $('#pagination').twbsPagination({
        totalPages,
        visiblePages: 6,
        onPageClick: (event, page) => {
            displayRecordsIndex = Math.max(page - 1, 0) * pageSize;
            endRec = (displayRecordsIndex) + pageSize;
            displayRecords = airports.slice(displayRecordsIndex, endRec);

            let tr;
            $('#table_body').empty();
            for (let i = 0; i < displayRecords.length; i++) {
                tr = $('<tr/>');
                tr.append("<td>" + `<a href="#" onClick="selectAirport('${displayRecords[i].properties.title}')">${displayRecords[i].properties.title}</a>` + "</td>");
                console.log(displayRecords[i]);
                $('#table_body').append(tr);
            }
        }
    });
}


function airportSearchClick(airportInput) {
    getJsonData(`${API}/getAirport?name=${encodeURI(airportInput)}`).then((res) => {
        $("#airportsDiv").empty();
        if (res.features.length > 0) {
            $("#airportsDiv").append(airportSearchResultsContent);
            let airports = res.features;
            totalPages = Math.ceil(airports.length / pageSize);
            applyAirportsPagination(airports, totalPages);
        }
        else {
            $("#airportsDiv").append(`
                    <br/>
                    <h5>No results</h5>
                `);
        }
    });
}

function selectAirport(name) {
    var feature = airportsGeoJson.features.filter((item) => {
        return item.properties.title == name;
    });

    var clone = JSON.parse(JSON.stringify(airportsGeoJson));
    clone.features = feature;
    clearMap();
    var markerStyle;

    myLayer = L.geoJSON(clone, {
        style: (feature) => getAirportAreaStyle(feature.properties.area),
        onEachFeature: function (feature, layer) {
            var markerText = `
                <h2><b>${feature.properties.title}</b></h2>
                <p>Area: ${feature.properties.area.toFixed(2)} m<sup>2</sup></p>
            `;
            polygon = L.polygon(feature.geometry.coordinates);
            var center = polygon.getBounds().getCenter();
            getNearestFoodDrink(center.lng, center.lat);
            markerStyle = getAirplaneMarker(feature);
            var marker = L.marker([center.lng, center.lat], { icon: markerStyle }).addTo(markerLayer).bindPopup(markerText).openPopup();
            layer.bindPopup(markerText);
            mapObj.setView([center.lng, center.lat], 13);
        }
    }).addTo(mapObj);
    $('#airportSearchModal').modal('hide');
}

function clearMap() {
    myLayer.clearLayers();
    myLayer2.clearLayers();
    markerLayer.clearLayers();
    lineLayer.clearLayers();
    mapObj.setView(mapOptions.center, mapOptions.zoom);
};

$('#clear-button').on('click', (e) => {
    e.preventDefault();
    clearMap();
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
                    L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], { icon: getFoodDrinkMarker(feature) }).addTo(markerLayer).bindPopup(text);
                }
            });
        }
    })
}

