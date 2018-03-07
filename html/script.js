var mymap = L.map('mapid').setView([51.1043471,17.0189813], 13);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWljaGFsc3puYWpkZXIiLCJhIjoiXy04UjRRYyJ9.p9-mkCAFeXfjZ5vzOhXdPw', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(mymap);


function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.street_name) {
        layer.bindPopup(feature.properties.street_name);
    }
}



$.getJSON("election_results.json", function(json) {
    L.geoJSON(json).addTo(mymap);
});


var address_points_layer = null;

$(function() {
    $("#toogle_address_points").click( function()
         {
            if (address_points_layer === null)
            {
                $.getJSON("address_points.json", function(json) {
                    address_points_layer = L.geoJSON(json, { onEachFeature : onEachFeature }).addTo(mymap);
                });                           
            } 
            else
            {
                address_points_layer.remove();
                address_points_layer = null;
            }
         }
    );
});