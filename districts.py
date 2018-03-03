#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
from pprint import pprint

def get_streets_coord():
    raw_data = json.load(open('only-wro-only-names.geojson'))

    features = raw_data['features']

    streets = {}
    for f in features:
        prop = f['properties']
        street_name = prop['name']
        coords = f['geometry']['coordinates']
        if not street_name in streets:
            streets[street_name] = []

        for c in coords:
            streets[street_name].append(c)
    return streets

streets = get_streets_coord()


district_streets = [
    u'Bożego Ciała', 
    u'Kazimierza Wielkiego', 
    u'Księdza Piotra Skargi', 
    u'Stanisława Leszczyńskiego', 
    u'Mennicza', 
    u'Nowa', 
    u'Ofiar Oświęcimskich', 
    u'Plac Franciszkański', 
    u'Plac Solny', 
    u'Plac Teatralny', 
    u'Plac Wolności', 
    u'Świdnicka', 
    u'Świętej Doroty', 
    u'Teatralna', 
    u'Widok', 
    u'Wierzbowa']

districts_json = {}

districts_json['type'] = 'FeatureCollection',
districts_json['features'] = []
districts_features = districts_json['features'];


for street_name in district_streets:
    if not street_name in streets:
        raise Exception('Street not found ', street_name)

    feature = {}
    feature['type'] = 'Feature'
    feature['geometry'] = {}
    feature['geometry']['type'] = 'MultiPoint'
    feature['geometry']['coordinates'] = streets[street_name]
    districts_features.append(feature)


json_data = json.dumps(districts_json)
with open('html/districts.json', 'w') as file:
    file.write(json_data)

