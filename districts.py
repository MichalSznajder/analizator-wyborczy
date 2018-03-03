#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
from pprint import pprint
from scipy.spatial import ConvexHull

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
            x = c[0] # 16
            y = c[1] # 51 

            # 51.141357, 16.993146 NW
            # 51.075410, 17.108309 SE
            if 16.993146 < x < 17.108309:
                if 51.075410 < y < 51.141357:   
                    streets[street_name].append(c)
    return streets

def create_district_points(streets):
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


def create_district_hulls(streets):
    hull_points = []
    for street_name in district_streets:
        if not street_name in streets:
            raise Exception('Street not found ', street_name)

        for x in streets[street_name]:
            hull_points.append(x)

    feature = {}
        
    hull = ConvexHull(hull_points)
    feature['type'] = 'Polygon'
    hull_result = []
    for v in hull.vertices:
        hull_result.append(hull_points[v])
    hull_result.append(hull_result[0])
    feature['coordinates'] = []
    feature['coordinates'].append(hull_result)


    json_data = json.dumps(feature)
    with open('html/districts2.json', 'w') as file:
        file.write(json_data)

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

streets = get_streets_coord()
create_district_points(streets)
create_district_hulls(streets)


