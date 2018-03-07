#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
from pprint import pprint
from scipy.spatial import ConvexHull

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


def get_json_hull_for_points(points):
    feature = {}
    feature['type'] = 'Feature'
    feature['geometry'] = {}    
    
    hull = ConvexHull(points)
    feature['geometry']['type'] = 'Polygon'
    hull_result = []
    for v in hull.vertices:
        hull_result.append(points[v])
    hull_result.append(hull_result[0])
    feature['geometry']['coordinates'] = []
    feature['geometry']['coordinates'].append(hull_result)
    
    return feature

def create_district_hulls(raw_districts):

    districts_json = {}

    districts_json['type'] = 'FeatureCollection',
    districts_json['features'] = []
    districts_features = districts_json['features'];

    hull_points = [c for item in raw_districts for coords in item['coords'] for c in coords['coords']]
    feature = get_json_hull_for_points(hull_points)
    districts_features.append(feature)

    json_data = json.dumps(districts_json)
    with open('html/districts2.json', 'w') as file:
        file.write(json_data)


raw_districts = json.load(open('data/districts.json'))
create_district_hulls(raw_districts)
