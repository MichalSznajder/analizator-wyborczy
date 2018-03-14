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
    election_results.resetStyle(e.target);
}

var selectedDistrictNumber = -1;
var district_markers = []

blueIcon = L.icon({ iconUrl: 'img/marker-icon-blue.png'});
greenIcon = L.icon({ iconUrl: 'img/marker-icon-green.png'});
redIcon = L.icon({ iconUrl: 'img/marker-icon-red.png'});

bigDistrictsNames = [
    "1 STARE MIASTO, PRZEDMIEŚCIE ŚWIDNICKIE, GAJOWICE, GRABISZYN - GRABISZYNEK, NADODRZE, KLECZKÓW",
    "2 OŁBIN, PL. GRUNWALDZKI, ZACISZE - ZALESIE - SZCZYTNIKI, BISKUPIN - SĘPOLNO - DĄBIE - BARTOSZOWICE",
    "3 POWSTAŃCÓW ŚLĄSKICH, BOREK, GAJ, HUBY, TARNOGAJ",
    "4 PRZEDMIEŚCIE OŁAWSKIE, KSIĘŻE, BROCHÓW, BIEŃKOWICE, JAGODNO, WOJSZYCE, OŁTASZYN, KRZYKI - PARTYNICE, KLECINA, OPORÓW",
    "5 SZCZEPIN, GĄDÓW – POPOWICE PŁD., PILCZYCE – KOZANÓW – POPOWICE PŁN.",
    "6 MUCHOBÓR MAŁY, NOWY DWÓR, KUŹNIKI, MUCHOBÓR WIELKI, ŻERNIKI, JERZMANOWO – JARNOŁTÓW – STRACHOWICE – OSINIEC, LEŚNICA, MAŚLICE, PRACZE ODRZAŃSKIE",
    "7 KARŁOWICE – RÓŻANKA, KOWALE, SWOJCZYCE – STRACHOCIN – WOJNÓW, PSIE POLE – ZAWIDAWIE, PAWŁOWICE, SOŁTYSOWICE, POLANOWICE – POŚWIĘTNE – LIGOTA, WIDAWA, LIPA PIOTROWSKA, ŚWINIARY, OSOBOWICE – REDZIN",
]

function onDistrictClick(e) {
    $('#district_address').text(e.target.feature.properties.address);
    $('#district_number').text(e.target.feature.properties.number);
    $('#district_streets').text(e.target.feature.properties.streets);
    results = e.target.feature.properties.results;
    result_val = results.Razem * 100 / results.Total;
    $('#district_result').text(result_val.toFixed(2) + " %"); 
    selectedDistrictNumber = e.target.feature.properties.number;

    bigDistricts.forEach(function (e) { mymap.removeLayer(e); });
    var biDistrictId = e.target.feature.properties.big_district-1;
    mymap.addLayer(bigDistricts[biDistrictId]);
    $('#big_district').text(bigDistrictsNames[biDistrictId]);

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

mymap.createPane('bigDistrict');
mymap.getPane('bigDistrict').style.zIndex = 620;

var bigDistrictsStyle = { 
    "fill" : false,
    "color" : "#3A0123",
    "dashArray" : "5, 1",
    "weight" : 5
}

var bigDistricts = []

function onEachFeatureInBigDistrict(feature, layer) {
    bigDistricts.push(L.geoJSON(feature, { style : bigDistrictsStyle, pane : 'bigDistrict' }));
}

$(function() { 
    var cbx_polling_places = null;

    $.getJSON("data/big_district.json", function(json) {
        L.geoJSON(json, {
            onEachFeature : onEachFeatureInBigDistrict} );
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