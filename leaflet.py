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


def get_geometry_hull_for_points(points):
    geometry = {}    
    
    hull = ConvexHull(points)
    geometry['type'] = 'Polygon'
    hull_result = []
    for v in hull.vertices:
        hull_result.append(points[v])
    hull_result.append(hull_result[0])
    geometry['coordinates'] = []
    geometry['coordinates'].append(hull_result)
    
    return geometry

def create_district_hulls(districts):
    districts_json = {}

    districts_json['type'] = 'FeatureCollection'
    districts_json['features'] = []
    districts_features = districts_json['features'];

    for district_data in districts:
        pprint('creating for ' + district_data['address'])
        hull_points = [c for coords in district_data['coords'] for c in coords['coords']]

        feature = {}
        feature['type'] = 'Feature'
        feature['properties'] = {
            'address' : district_data['address'], 
            'number' : district_data['number'] 
        } 
        feature['geometry'] = get_geometry_hull_for_points(hull_points)    

        districts_features.append(feature)

    return districts_json

def create_address_points(districts):
    
    for district in districts:
        pprint("points for district " + str(district['number']))
        
        districts_json = {}

        districts_json['type'] = 'FeatureCollection',
        districts_json['features'] = []
        districts_features = districts_json['features'];

        points = [(c, coords['name']) for coords in district['coords'] for c in coords['coords']]
        
        for point in points:
            feature = {}
            feature['type'] = 'Feature'
            feature['geometry'] = {}    
            feature['geometry']['type'] = 'Point'
            feature['geometry']['coordinates'] = point[0]
            feature['properties'] = {} 
            feature['properties']['street_name'] = point[1]
            districts_features.append(feature)

        json_data = json.dumps(districts_json)
        with open('html/address_points_' + str(district['number']) + '.json', 'w') as file:
            file.write(json_data)


districts = json.load(open('data/districts.json'))
districts_json = create_district_hulls(districts)
json_data = json.dumps(districts_json, indent=4)
with open('html/election_results.json', 'w') as file:
    file.write(json_data)

create_address_points(districts)


