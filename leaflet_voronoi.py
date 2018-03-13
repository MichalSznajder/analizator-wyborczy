#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
from pprint import pprint
from shapely.geometry import LineString, Polygon, Point, box
from shapely.ops import polygonize
from scipy.spatial import Voronoi
import numpy as np

def write_points_file(points, file_name):
    districts_json = {}

    districts_json['type'] = 'FeatureCollection',
    districts_json['features'] = []
    districts_features = districts_json['features'];

    for point in points:
        feature = {}
        feature['type'] = 'Feature'
        feature['geometry'] = {}
        
        feature['geometry']['type'] = 'Point'
        feature['geometry']['coordinates'] = point[1]

        feature['properties'] = {}
        feature['properties']['name'] = point[0]

        districts_features.append(feature)

    json_data = json.dumps(districts_json)
    with open('html/data/' + file_name + '.json', 'w') as file:
        file.write(json_data)


def get_geometry_for_points(points):
    geometry = {}    
    
    geometry['type'] = 'Polygon'
    coords = points.tolist()
    coords.append(coords[0])
    geometry['coordinates'] = [coords]
    
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

def voronoi_finite_polygons_2d(vor, radius=None):
    """
    Reconstruct infinite voronoi regions in a 2D diagram to finite
    regions.

    Parameters
    ----------
    vor : Voronoi
        Input diagram
    radius : float, optional
        Distance to 'points at infinity'.

    Returns
    -------
    regions : list of tuples
        Indices of vertices in each revised Voronoi regions.
    vertices : list of tuples
        Coordinates for revised Voronoi vertices. Same as coordinates
        of input vertices, with 'points at infinity' appended to the
        end.

    """

    if vor.points.shape[1] != 2:
        raise ValueError("Requires 2D input")

    new_regions = []
    new_vertices = vor.vertices.tolist()

    center = vor.points.mean(axis=0)
    if radius is None:
        radius = vor.points.ptp().max()

    # Construct a map containing all ridges for a given point
    all_ridges = {}
    for (p1, p2), (v1, v2) in zip(vor.ridge_points, vor.ridge_vertices):
        all_ridges.setdefault(p1, []).append((p2, v1, v2))
        all_ridges.setdefault(p2, []).append((p1, v1, v2))

    # Reconstruct infinite regions
    for p1, region in enumerate(vor.point_region):
        vertices = vor.regions[region]

        if all(v >= 0 for v in vertices):
            # finite region
            new_regions.append(vertices)
            continue

        # reconstruct a non-finite region
        if not p1 in all_ridges:
            raise Exception('incovered region found')

        ridges = all_ridges[p1]
        new_region = [v for v in vertices if v >= 0]

        for p2, v1, v2 in ridges:
            if v2 < 0:
                v1, v2 = v2, v1
            if v1 >= 0:
                # finite ridge: already in the region
                continue

            # Compute the missing endpoint of an infinite ridge

            t = vor.points[p2] - vor.points[p1] # tangent
            t /= np.linalg.norm(t)
            n = np.array([-t[1], t[0]])  # normal

            midpoint = vor.points[[p1, p2]].mean(axis=0)
            direction = np.sign(np.dot(midpoint - center, n)) * n
            far_point = vor.vertices[v2] + direction * radius

            new_region.append(len(new_vertices))
            new_vertices.append(far_point.tolist())

        # sort region counterclockwise
        vs = np.asarray([new_vertices[v] for v in new_region])
        c = vs.mean(axis=0)
        angles = np.arctan2(vs[:,1] - c[1], vs[:,0] - c[0])
        new_region = np.array(new_region)[np.argsort(angles)]

        # finish
        new_regions.append(new_region.tolist())

    return new_regions, np.asarray(new_vertices)


def get_voronoi_polygons(points):
    vor = Voronoi(points)

    (regions, vertices) = voronoi_finite_polygons_2d(vor, radius=1)

    return [vertices[region] for region in regions]

def get_avg_points(polling_places):
    return [[(p["voting_point"]["coords"][0] + p["helper_street"]["coords"][0])/2, (p["voting_point"]["coords"][1] + p["helper_street"]["coords"][1])/2] for p in polling_places]

def create_districts(polling_places):

    avg_points = get_avg_points(polling_places)
    
    vor = get_voronoi_polygons(avg_points)
    districts_json = {}

    districts_json['type'] = 'FeatureCollection'
    districts_json['features'] = []
    districts_features = districts_json['features'];
    for place, points in zip(polling_places, vor):
        pprint('creating for ' + place['voting_point']['address'])

        feature = {}
        feature['type'] = 'Feature'
        feature['properties'] = {
            'address' : place['voting_point']['address'], 
            'number' : place['number'] 
        } 
        feature['geometry'] = get_geometry_for_points(points)    

        districts_features.append(feature)

    return districts_json


def get_results():
    lines = open('data/results_2015.csv', 'r').readlines()
    lines = lines[1:]
    lines = [line.split(';') for line in lines]

    return { int(line[4]) : { "Razem" : int(line[88-1]), "Total" : line[27-1] } for line in lines }


polling_places = json.load(open('data/polling_places.json'))
districts_json = create_districts(polling_places)

results = get_results()
razem_min = int(min([val["Razem"] for (key, val) in results.items()]))
razem_max = int(max([val["Razem"] for (key, val) in results.items()]))

for d in districts_json['features']:
    number = int(d['properties']['number'])
    d['properties']['results'] = results[number]
    o = d['properties']['results']['Razem'] * 1.0 / (razem_max - razem_min)
    d['properties']['results']['RazemOpacity'] = 0.1 + o * (1 - 0.1)

json_data = json.dumps(districts_json, indent=4)
with open('html/data/election_results.json', 'w') as file:
    file.write(json_data)

polling_points = [(p['voting_point']['name'], p['voting_point']['coords']) for p in polling_places]
write_points_file(polling_points, "polling_places")

helper_streets = [('pomocnicza ulica ' + p['helper_street']['name'] + " dla " + p['voting_point']['name'], p['helper_street']['coords']) for p in polling_places]
write_points_file(helper_streets, "helper_streets")

avg_points = [p for p in get_avg_points(polling_places)]
avg_points = [('srednia dla ' + z[0]['voting_point']['name'], z[1]) for z in zip(polling_places, avg_points)]
write_points_file(avg_points, 'avg_points')


