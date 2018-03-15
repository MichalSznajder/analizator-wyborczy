var mymap = L.map('mapid').setView([51.1043471,17.0189813], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWljaGFsc3puYWpkZXIiLCJhIjoiXy04UjRRYyJ9.p9-mkCAFeXfjZ5vzOhXdPw', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 21,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(mymap);


function highlightDistrict(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#E7C49F',
        dashArray: '',
        fillColor: "#E7C49F",
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetDistrictHighlight(e) {
    election_results_layer.resetStyle(e.target);
}

var selectedDistrictNumber = -1;
var district_markers = []

blueIcon = L.icon({ iconUrl: 'img/marker-icon-blue.png'});
greenIcon = L.icon({ iconUrl: 'img/marker-icon-green.png'});
redIcon = L.icon({ iconUrl: 'img/marker-icon-red.png'});

function onDistrictClick(e) {
    $('#district_address').text(e.target.feature.properties.address);
    $('#district_number').text(e.target.feature.properties.number);
    $('#district_streets').text(e.target.feature.properties.streets);

    results = e.target.feature.properties.results;
    result_val = results.Razem * 100 / results.Total;
    $('#district_result').text(result_val.toFixed(2) + " % (" + results.Razem + " głosów z " + results.Total + ")"); 
    selectedDistrictNumber = e.target.feature.properties.number;

    boroughLayers.forEach(function (e) { mymap.removeLayer(e); });
    var boroughId = e.target.feature.properties.borough_number-1;
    mymap.addLayer(boroughLayers[boroughId]);
    $('#borough_name').text(boroughFeatures[boroughId].properties.name);

    district_markers.forEach(function (e) { mymap.removeLayer(e); })
    district_markers = []

    var showDetails = $('#show_details_points').prop('checked');
    if (showDetails)
    {
        var icons = e.target.feature.properties.icons;
        district_markers.push(L.marker(icons.polling_point.coords.slice().reverse()).bindPopup(icons.polling_point.desc).setIcon(blueIcon));
        district_markers.push(L.marker(icons.helper_street.coords.slice().reverse()).bindPopup(icons.helper_street.desc).setIcon(greenIcon));
        district_markers.push(L.marker(icons.avg_point.coords.slice().reverse()).bindPopup(icons.avg_point.desc).setIcon(redIcon));
    
        district_markers.forEach(function (e) { mymap.addLayer(e); });    
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(color) {
    return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
}

var razemColor = [135, 15, 87];


var info_steps = []

function getInfoStep(val) {
    for (i = 0; i < info_steps.length; i++) {
        if ((info_steps[i].begin <= val) && (val < info_steps[i].end)) {
            return info_steps[i].color;
        }
    }

    return rgbToHex(razemColor)
}

function resultsStyle(feature) {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillColor: getInfoStep(feature.properties.results.Razem * 100 / feature.properties.results.Total),
        fillOpacity : 0.7
    };
}

function onEachFeatureInResults(feature, layer) {
    if (feature.properties && feature.properties.address) {
        layer.on({
            click: onDistrictClick,
            mouseover: highlightDistrict,
            mouseout: resetDistrictHighlight
        })
    }
}



var election_results_layer = null;
var election_results_json = null;

var colors  = ['#800026', '#BD0026', '#E31A1C', '#FC4E2A', '#FD8D3C', '#FEB24C', '#FED976', '#FFEDA0'].reverse();

$.getJSON("data/election_results.json", function(json) {
    election_results_json = json;
    var avgs = election_results_json.features.map(x => x.properties.results).map(x => x.Razem * 100 / x.Total).sort();  
    var total_steps = colors.length;
    var step = avgs.length / total_steps;
    for(i = 1; i < total_steps; i++)
    {
        var info_step = {
            step : i, 
            begin : avgs[Math.round((i - 1 ) * step)],
            end : avgs[Math.round(i * step)],
            color : colors[i]
        }
        info_steps.push(info_step)
    }

    var info_step = {
        step : total_steps, 
        begin : info_steps[total_steps-2].end,
        end : Infinity,
        color : colors[total_steps - 1]
    }
    info_steps.push(info_step)

    election_results_layer = L.geoJSON(json, 
        { 
            onEachFeature : onEachFeatureInResults, 
            style : resultsStyle
        });
    election_results_layer.addTo(mymap);
});

function onEachPointsFeature(feature, layer) {
    if (feature.properties && feature.properties.name) {
        layer.bindPopup(feature.properties.name);
    }
}

function getOnEachPointsFeature(icon_image)
{
    icon = L.icon({ iconUrl: 'img/' + icon_image });

    return function (feature, layer) {
        if (feature.properties && feature.properties.name) {
            layer.bindPopup(feature.properties.name);
        }
        layer.setIcon(icon)
    }
}

mymap.createPane('boroughPane');
mymap.getPane('boroughPane').style.zIndex = 620;

var boroughStyle = { 
    "fill" : false,
    "color" : "#3A0123",
    "dashArray" : "5, 1",
    "weight" : 5
}

var boroughLayers = []
var boroughFeatures = []

function onEachFeatureInBorough(feature, layer) {
    boroughLayers.push(L.geoJSON(feature, { style : boroughStyle, pane : 'boroughPane' }));
    boroughFeatures.push(feature);
}

$(function() { 
    var cbx_polling_places = null;

    $.getJSON("data/boroughs.json", function(json) {
        L.geoJSON(json, {
            onEachFeature : onEachFeatureInBorough} );
    }); 

    $.getJSON("data/polling_places.json", function(json) {
        cbx_polling_places = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-blue.png") });
    }); 

    $.getJSON("data/helper_streets.json", function(json) {
        cbx_helper_streets = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-green.png") });
    });

    $.getJSON("data/avg_points.json", function(json) {
        cbx_avg_points = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-red.png") });
    }); 

    $("#cbx_polling_places").click(function() {
        if (!mymap.hasLayer(cbx_polling_places))
        {
            cbx_polling_places.addTo(mymap);
        }
        else
        {
            cbx_polling_places.remove();
        }
    });

    var cbx_helper_streets = null;
    $("#cbx_helper_streets").click(function() {
        if (!mymap.hasLayer(cbx_helper_streets))
        {
            cbx_helper_streets.addTo(mymap);
        }
        else
        {
            cbx_helper_streets.remove();
        }
    });

    var cbx_avg_points = null;
    $("#cbx_avg_points").click(function() {
        if (!mymap.hasLayer(cbx_avg_points))
        {
            cbx_avg_points.addTo(mymap);
        }
        else
        {
            cbx_avg_points.remove();
        }
    });
});