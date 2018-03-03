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


district = [
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


for d in district:
    if not d in streets:
        raise Exception('Street not found ', d)

pprint(streets)