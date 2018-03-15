var mainMap = null;
var boroughs = null;

function highlightBorough(e) {
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

function resetBoroughHighlight(e) {
    boroughs.resetStyle(e.target);
}

function onBoroughClick(e) {
    $('#borough_name').text(e.target.feature.properties.name);

    results = e.target.feature.properties.results;
    result_val = results.razem * 100 / results.total;
    $('#borough_result').text(result_val.toFixed(2) + " % (" + results.razem + " głosów z " + results.total + ")"); 
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(color) {
    return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
}

var razemColor = [135, 15, 87];


var boroughsStyle = { 
    "fill" : rgbToHex(razemColor),
    opacity : 0.7,
    "color" : "#3A0123",
    "dashArray" : "3",
    "weight" : 2
}


function onEachFeatureInBoroughs(feature, layer) {    
    layer.on({
        click: onBoroughClick,
        mouseover: highlightBorough,
        mouseout: resetBoroughHighlight
    })
}

$(function() { 
    mainMap = L.map('mapid').setView([51.1043471,17.0189813], 13);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWljaGFsc3puYWpkZXIiLCJhIjoiXy04UjRRYyJ9.p9-mkCAFeXfjZ5vzOhXdPw', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 21,
        id: 'mapbox.streets',
        accessToken: 'your.mapbox.access.token'
    }).addTo(mainMap);


    $.getJSON("data/boroughs.json", function(json) {
        boroughs = L.geoJSON(json, { 
            onEachFeature : onEachFeatureInBoroughs,
            style : boroughsStyle } )
        .addTo(mainMap);

    }); 
});