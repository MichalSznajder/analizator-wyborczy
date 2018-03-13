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
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetDistrictHighlight(e) {
    election_results.resetStyle(e.target);
}

var selectedDistrictNumber = -1;

function onDistrictClick(e) {
    $('#district_address').text(e.target.feature.properties.address);
    $('#district_number').text(e.target.feature.properties.number);
    $('#district_streets').text(e.target.feature.properties.streets);
    results = e.target.feature.properties.results;
    result_val = results.Razem * 100 / results.Total;
    $('#district_result').text(result_val.toFixed(2) + " %"); 
    selectedDistrictNumber = e.target.feature.properties.number;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(color) {
    return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
}

var razemColor = [135, 15, 87];



function resultsStyle(feature) {
    return {
        fillColor: rgbToHex(razemColor),
        weight: 2,
        opacity: 0.7,
        color: '#57C49F',
        dashArray: '3',
        fillOpacity: feature.properties.results.RazemOpacity
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

var election_results

$.getJSON("data/election_results.json", function(json) {
    election_results = L.geoJSON(json, 
        { 
            onEachFeature : onEachFeatureInResults, 
            style : resultsStyle
        });
    election_results.addTo(mymap);
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

$(function() { 
    var cbx_polling_places = null;
    $("#cbx_polling_places").click(function() {
        if (cbx_polling_places === null)
        {
            $.getJSON("data/polling_places.json", function(json) {
                cbx_polling_places = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-blue.png") }).addTo(mymap);
            });                               
        }
        else
        {
            cbx_polling_places.remove();
            cbx_polling_places = null;
        }
    });

    var cbx_helper_streets = null;
    $("#cbx_helper_streets").click(function() {
        if (cbx_helper_streets === null)
        {
            $.getJSON("data/helper_streets.json", function(json) {
                cbx_helper_streets = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-green.png") }).addTo(mymap);
            });                               
        }
        else
        {
            cbx_helper_streets.remove();
            cbx_helper_streets = null;
        }
    });

    var cbx_avg_points = null;
    $("#cbx_avg_points").click(function() {
        if (cbx_avg_points === null)
        {
            $.getJSON("data/avg_points.json", function(json) {
                cbx_avg_points = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-red.png") }).addTo(mymap);
            });                               
        }
        else
        {
            cbx_avg_points.remove();
            cbx_avg_points = null;
        }
    });
});