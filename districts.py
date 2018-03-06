#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import urllib2
from pprint import pprint
from scipy.spatial import ConvexHull
from bs4 import BeautifulSoup
import re

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


def get_points_for_district(district_streets):
    points = []
    for street_name in district_streets:
        if not street_name in streets:
            raise Exception('Street not found ', street_name)

        for x in streets[street_name]:
            points.append(x)

    return points    

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

def create_district_hulls(streets):

    districts_json = {}

    districts_json['type'] = 'FeatureCollection',
    districts_json['features'] = []
    districts_features = districts_json['features'];

    hull_points = get_points_for_district(district_streets)
    feature = get_json_hull_for_points(hull_points)
    districts_features.append(feature)

    hull_points = get_points_for_district(district_streets2)
    feature = get_json_hull_for_points(hull_points)
    districts_features.append(feature)

    json_data = json.dumps(districts_json)
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

district_streets2 = [
    u"Biskupia", 
    u"Kazimierza Wielkiego",
    u"Krawiecka", 
    u"Kurzy Targ", 
    u"Kuźnicza", 
    u"Łaciarska",
    u"Ofiar Oświęcimskich",
    u"Oławska",
    u"Plac Świętego Krzysztofa",
    u"Szewska", 
    u"Świdnicka",
    u"Wita Stwosza"]

# streets = get_streets_coord()
# create_district_points(streets)
# create_district_hulls(streets)



def get_raw_districts_list():
    response = urllib2.urlopen('http://wybory2011.pkw.gov.pl/geo/020000/pl/026401.html')
    html = response.read()
    soup = BeautifulSoup(html, 'lxml')
    tbody = soup.html.body.div.contents[5].contents[3].table.tbody

    districts = []
    for row in tbody.find_all('tr')[2:]:
        raw_data = {}
        cells = row.find_all('td')
        raw_data['number'] = cells[0].string
        raw_data['address'] = cells[1].string
        raw_data['streets'] = cells[5].string
        raw_data['gmap_link'] = cells[6].a['href']
        districts.append(raw_data)
       
    return districts


def split_compound_street_name(street_name):
    streets = [street.strip() for street in street_name.split(',')]

    ret = []
    last_street = ""
    for street in streets:
        is_broken_street = street[0].isnumeric()

        if is_broken_street:
            ret.append(last_street + ' ' + street)
        else:
            ret.append(street)

        if not is_broken_street:
            last_street = [s for s in street.split()]
            last_street = filter(lambda x: not x[0].isnumeric(), last_street)
            last_street = filter(lambda x: not x == u'parzyste', last_street)
            last_street = filter(lambda x: not x == u'nieparzyste', last_street)
            last_street = u' '.join(last_street)

    return ret


numbers_regex = re.compile('(\d+)-(\d+)')

def generate_unique_address_points(streets):
    for street in streets:
        split = numbers_regex.split(street)
        split_len = len(split)

        if split_len == 1:
            yield street
        elif split_len == 4:
            step = 1 if split[3] == u'' else 2

            street_name = split[0]
            start = int(split[1])
            end = int(split[2])

            for point in range(start, end, step):
                yield street_name + str(point)
        else:
            raise Exception('unknown split for ' + street)

#raw_districts = get_raw_districts_list()
#with open('data/districts.json', 'w') as outfile:
#    json.dump(raw_districts, outfile, indent=4)
raw_districts = json.load(open('data/districts.json'))

for item in raw_districts:
    item['streets'] = split_compound_street_name(item['streets'])
    item['streets'] = list(generate_unique_address_points(item['streets'])

with open('data/districtsX.json', 'w') as outfile:
    json.dump(raw_districts, outfile, indent=4)


