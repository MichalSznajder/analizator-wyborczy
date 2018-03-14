var mymap = null;
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


bigDistrictsNames = [
    "1 STARE MIASTO, PRZEDMIEŚCIE ŚWIDNICKIE, GAJOWICE, GRABISZYN - GRABISZYNEK, NADODRZE, KLECZKÓW",
    "2 OŁBIN, PL. GRUNWALDZKI, ZACISZE - ZALESIE - SZCZYTNIKI, BISKUPIN - SĘPOLNO - DĄBIE - BARTOSZOWICE",
    "3 POWSTAŃCÓW ŚLĄSKICH, BOREK, GAJ, HUBY, TARNOGAJ",
    "4 PRZEDMIEŚCIE OŁAWSKIE, KSIĘŻE, BROCHÓW, BIEŃKOWICE, JAGODNO, WOJSZYCE, OŁTASZYN, KRZYKI - PARTYNICE, KLECINA, OPORÓW",
    "5 SZCZEPIN, GĄDÓW – POPOWICE PŁD., PILCZYCE – KOZANÓW – POPOWICE PŁN.",
    "6 MUCHOBÓR MAŁY, NOWY DWÓR, KUŹNIKI, MUCHOBÓR WIELKI, ŻERNIKI, JERZMANOWO – JARNOŁTÓW – STRACHOWICE – OSINIEC, LEŚNICA, MAŚLICE, PRACZE ODRZAŃSKIE",
    "7 KARŁOWICE – RÓŻANKA, KOWALE, SWOJCZYCE – STRACHOCIN – WOJNÓW, PSIE POLE – ZAWIDAWIE, PAWŁOWICE, SOŁTYSOWICE, POLANOWICE – POŚWIĘTNE – LIGOTA, WIDAWA, LIPA PIOTROWSKA, ŚWINIARY, OSOBOWICE – REDZIN",
]

function onBoroughClick(e) {
    $('#district_address').text(e.target.feature.properties.address);
    $('#district_number').text(e.target.feature.properties.number);
    $('#district_streets').text(e.target.feature.properties.streets);
    results = e.target.feature.properties.results;
    result_val = results.Razem * 100 / results.Total;
    $('#district_result').text(result_val.toFixed(2) + " % (" + results.Razem + " głosów z " + results.Total + ")"); 
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

var boroughsStyle = { 
    "fill" : rgbToHex(razemColor),
    opacity : 0.7,
    "color" : "#3A0123",
    "dashArray" : "5, 1",
    "weight" : 5
}


function onEachFeatureInBoroughs(feature, layer) {    
    layer.on({
        click: onBoroughClick,
        mouseover: highlightBorough,
        mouseout: resetBoroughHighlight
    })
}

$(function() { 
    mymap = L.map('mapid').setView([51.1043471,17.0189813], 13);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWljaGFsc3puYWpkZXIiLCJhIjoiXy04UjRRYyJ9.p9-mkCAFeXfjZ5vzOhXdPw', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 21,
        id: 'mapbox.streets',
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);


    $.getJSON("data/big_district.json", function(json) {
        boroughs = L.geoJSON(json, { 
            onEachFeature : onEachFeatureInBoroughs,
            style : boroughsStyle } )
        .addTo(mymap);

    }); 
});