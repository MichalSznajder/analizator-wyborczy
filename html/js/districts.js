var mainMap = L.map('mapid').setView([51.1043471,17.0189813], 13);

var blueIcon = L.icon({ iconUrl: 'img/marker-icon-blue.png'});
var greenIcon = L.icon({ iconUrl: 'img/marker-icon-green.png'});
var redIcon = L.icon({ iconUrl: 'img/marker-icon-red.png'});
var razemColor = [135, 15, 87];

var election_results_json = null;

var boroughLayers = []
var boroughFeatures = []

var legendColors  = ['#800026', '#BD0026', '#E31A1C', '#FC4E2A', '#FD8D3C', '#FEB24C', '#FED976', '#FFEDA0'].reverse();

$(function() { 
    mainMap.createPane('boroughPane');
    mainMap.getPane('boroughPane').style.zIndex = 620;

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWljaGFsc3puYWpkZXIiLCJhIjoiXy04UjRRYyJ9.p9-mkCAFeXfjZ5vzOhXdPw', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 21,
        id: 'mapbox.streets',
        accessToken: 'your.mapbox.access.token'
    }).addTo(mainMap);

    $.getJSON("data/boroughs.json", function(json) {
        L.geoJSON(json, {
            onEachFeature : onEachFeatureInBorough} );
    }); 

    $.getJSON("data/election_results.json", function(json) {
        election_results_json = json;
    
        var percentageLegendTable = createPercentageLegendTable(election_results_json);
        var election_results_layer = L.geoJSON(json, 
            { 
                onEachFeature : onEachFeatureInResults, 
                style : resultsStyle(percentageLegendTable, results => results.razem * 100 / results.total)
            });
        election_results_layer.addTo(mainMap);
        var percentageLegend = createLegendControl(percentageLegendTable, election_results_layer, results => results.razem * 100 / results.total, '%');

        var absoluteLegendTable = createAbsoluteLegendTable(election_results_json);
        election_results_layer2 = L.geoJSON(json, 
            { 
                onEachFeature : onEachFeatureInResults, 
                style : resultsStyle(absoluteLegendTable, results => results.razem)
            });
        var absoluteLegend = createLegendControl(absoluteLegendTable, election_results_layer, results => results.razem, '');

        var baseLayers = { 
            "Procentowy": election_results_layer,
            "Bezwględny": election_results_layer2
            };
        
        L.control
            .layers(baseLayers, null, { "collapsed": false })
            .addTo(mainMap);

        percentageLegend.addTo(mainMap);
        mainMap.on('baselayerchange', function (eventLayer) {
            if (eventLayer.name === 'Procentowy') {
                mainMap.removeControl(absoluteLegend);
                mainMap.addControl(percentageLegend);
            } else { 
                mainMap.addControl(absoluteLegend);
                mainMap.removeControl(percentageLegend);
            }});
        });
    
    setup_marker_checkboxes();
});

function resultsStyle(legendTable, selector) {

    return function(feature) {
        return {
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillColor: getLegendColorForValue(selector(feature.properties.results), legendTable),
            fillOpacity : 0.7
        };    
    }
}
function onEachFeatureInResults(feature, layer) {
    if (feature.properties && feature.properties.address) {
        layer.on({
            click: onDistrictClick,
            mouseover: highlightDistrict,
            mouseout: resetDistrictHighlight
        });
    }
}

var selectedDistrictNumber = -1;
var district_markers = []

function onDistrictClick(e) {
    var properties = e.target.feature.properties;
    $('#district_address').text(properties.address);
    $('#district_number').text(properties.number);
    $('#district_streets').text(properties.streets);

    var pkw_link_id = 85171 + parseInt(properties.number);
    var pkw_link = 'http://parlament2015.pkw.gov.pl/321_protokol_komisji_obwodowej/' + pkw_link_id +'/1#DataTables_Table_1_wrapper';
    $('#pkw_link').attr('href', pkw_link);
    
    results = properties.results;
    result_val = results.razem * 100 / results.total;
    $('#district_result').text(result_val.toFixed(2) + " % (" + results.razem + " głosów z " + results.total + ")"); 
    selectedDistrictNumber = properties.number;

    boroughLayers.forEach(function (e) { mainMap.removeLayer(e); });
    var boroughId = properties.borough_number-1;
    mainMap.addLayer(boroughLayers[boroughId]);
    $('#borough_name').text(boroughFeatures[boroughId].properties.name);

    district_markers.forEach(function (e) { mainMap.removeLayer(e); })
    district_markers = []

    var showDetails = $('#show_details_points').prop('checked');
    if (showDetails)
    {
        var icons = properties.icons;
        district_markers.push(L.marker(icons.polling_point.coords.slice().reverse()).bindPopup(icons.polling_point.desc).setIcon(blueIcon));
        district_markers.push(L.marker(icons.helper_street.coords.slice().reverse()).bindPopup(icons.helper_street.desc).setIcon(greenIcon));
        district_markers.push(L.marker(icons.avg_point.coords.slice().reverse()).bindPopup(icons.avg_point.desc).setIcon(redIcon));
    
        district_markers.forEach(function (e) { mainMap.addLayer(e); });    
    }
}

function highlightDistrict(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#57C49F',
        dashArray: '',
        fillColor: "#57C49F",
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetDistrictHighlight(e, ctx) {
    var layer = e.target;
    var parentLayerId = Object.keys(e.target._eventParents)[0]

    layer._eventParents[parentLayerId].resetStyle(e.target);
}

function createPercentageLegendTable(election_results_json)
{
    var avgs = election_results_json.features.map(x => x.properties.results).map(x => x.razem * 100 / x.total).sort();  
    var total_steps = legendColors.length;
    var step = avgs.length / total_steps;
    var legendTable = [];
    for(i = 0; i < total_steps; i++)
    {
        var legend_item = {
            step : i, 
            begin : avgs[Math.round(i * step)],
            end : avgs[Math.round((i+1) * step)],
            color : legendColors[i]
        }
        legendTable.push(legend_item);
    }
    legendTable[0].begin = 0;
    legendTable[legendTable.length-1].end = Infinity;

    return legendTable;
}

function createAbsoluteLegendTable(election_results_json)
{
    var totals = election_results_json.features.map(x => x.properties.results.razem).sort();  
    var total_steps = legendColors.length;
    var step = totals.length / total_steps;
    var legendTable = [];
    for(i = 0; i < total_steps; i++)
    {
        var legend_item = {
            step : i, 
            begin : totals[Math.round(i * step)],
            end : totals[Math.round((i+1) * step)],
            color : legendColors[i]
        }
        legendTable.push(legend_item);
    }
    legendTable[0].begin = 0;
    legendTable[legendTable.length-1].end = Infinity;

    return legendTable;
}

function createLegendControl(legendTable, baseLayer, selector, specialMark)
{
    specialMark = specialMark || ' ';
    var mouseover = function(e) { 
        var step = $(e.target).data().step;
        var legendStep = legendTable[step];

        Object.keys(baseLayer._layers).forEach(function(key, index) {
            var layer = baseLayer._layers[key];

            var r = selector(layer.feature.properties.results);
            
            if (legendStep.begin <= r && r < legendStep.end){
                layer.setStyle({
                    weight: 5,
                    color: '#57C49F',
                    dashArray: '',
                    fillColor: "#57C49F",
                    fillOpacity: 0.7
                });

                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }                
            }
        });
    };
    var mouseout = function(e) { 
        Object.keys(baseLayer._layers).forEach(function(key,index) {
            layer = baseLayer._layers[key];
            baseLayer.resetStyle(layer);
        });
    };

    var legendControl = L.control({position: 'bottomright'});
    legendControl.onAdd = function (map) {
        var legend = L.DomUtil.create('div', 'info legend')
        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < legendTable.length; i++) {
            var div = L.DomUtil.create('div', 'zzz', legend);
            div.style = 'background:' + legendTable[i].color + ';';
            div.dataset.step = i;

            L.DomEvent
                .addListener(div, "mouseover", mouseover)
                .addListener(div, "mouseout", mouseout);
       
            var text =                
                legendTable[i].begin.toFixed(2) + specialMark + ' ' +
                (isFinite(legendTable[i].end) ? '– ' + legendTable[i].end.toFixed(2) + specialMark + ' ' : ' +');
            var text = document.createTextNode(text); 
            legend.appendChild(text);

            var br = L.DomUtil.create('br', '', legend);
        }
    
        return legend;
    };
    
    return legendControl;
}

function getLegendColorForValue(val, table) {
    for (i = 0; i < table.length; i++) {
        if ((table[i].begin <= val) && (val < table[i].end)) {
            return table[i].color;
        }
    }

    return rgbToHex(razemColor)
}

var boroughStyle = { 
    "fill" : false,
    "color" : "#3A0123",
    "dashArray" : "5, 1",
    "weight" : 5
}

function onEachFeatureInBorough(feature, layer) {
    boroughLayers.push(L.geoJSON(feature, { style : boroughStyle, pane : 'boroughPane' }));
    boroughFeatures.push(feature);
}

function setup_marker_checkboxes() {
    var cbx_polling_places = null;
    $.getJSON("data/polling_places.json", function(json) {
        cbx_polling_places = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-blue.png") });
    }); 

    var cbx_helper_streets = null;
    $.getJSON("data/helper_streets.json", function(json) {
        cbx_helper_streets = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-green.png") });
    });

    var cbx_avg_points = null;
    $.getJSON("data/avg_points.json", function(json) {
        cbx_avg_points = L.geoJSON(json, { onEachFeature : getOnEachPointsFeature("marker-icon-red.png") });
    }); 

    $("#cbx_polling_places").click(function() {
        if (!mainMap.hasLayer(cbx_polling_places))
        {
            cbx_polling_places.addTo(mainMap);
        }
        else
        {
            cbx_polling_places.remove();
        }
    });

    $("#cbx_helper_streets").click(function() {
        if (!mainMap.hasLayer(cbx_helper_streets))
        {
            cbx_helper_streets.addTo(mainMap);
        }
        else
        {
            cbx_helper_streets.remove();
        }
    });
 
    $("#cbx_avg_points").click(function() {
        if (!mainMap.hasLayer(cbx_avg_points))
        {
            cbx_avg_points.addTo(mainMap);
        }
        else
        {
            cbx_avg_points.remove();
        }
    });
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

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(color) {
    return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
}
