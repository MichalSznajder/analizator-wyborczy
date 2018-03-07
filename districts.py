#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import urllib2, urllib
from pprint import pprint
from scipy.spatial import ConvexHull
from bs4 import BeautifulSoup
import re
import time

def get_raw_districts_list():
    """ Download list of election districts from 2014 elections.
    """
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
    """ Analyze provided string as "compound" street name
    and split it into parts,

    Changes "Kotlarska 2-18, 43 nieparzyste" into
    "Kotlarska 2-18, Kotlarska 43 nieparzyste"
    """

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
    """Create address points from given address.

    From "Kotlarska 2-18" get "Kotlarska 2, Kotlarska 3, ..."
    """ 
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

def perform_geocode(street):
    """ Call OSM to do geocoding 

    1-2 requests per second
    """

    # https://wiki.openstreetmap.org/wiki/Nominatim
    query_params = {}
    query_params['format'] = 'json'
    query_params['street'] = street.encode("utf-8")
    query_params['city'] = u'Wrocław'.encode("utf-8")
    query_params['country'] = 'Polska'
    query_params['viewbox'] = '16.70609,51.22611,17.53831,51.01061'
    query_params['bouded'] = '1'
    query_params['polygon_geojson'] = '1'
    query_params['limit'] = '1'

    query = urllib.urlencode(query_params)
    url = 'https://nominatim.openstreetmap.org/search?' + query
    response = urllib2.urlopen(url)
    json_data = response.read()
    json_data = json.loads(json_data)

    pprint(query)

    ret = {}
    ret['name'] = street
    ret['coords'] = []
    for bbox in json_data:
        if bbox['geojson']['type'] == 'Point':
            ret['coords'].append([bbox['geojson']['coordinates'][0], bbox['geojson']['coordinates'][1]])
        elif bbox['geojson']['type'] == 'LineString':
            ret['coords'].extend(bbox['geojson']['coordinates'])
        elif bbox['geojson']['type'] == 'Polygon':
            ret['coords'].extend([c for p in bbox['geojson']['coordinates'] for c in p])
        else:
            raise Exception('unknon geo type ' + bbox['geojson']['type'])

    time.sleep(0.5)

    return ret

raw_districts = get_raw_districts_list()
with open('data/raw_districts.json', 'w') as outfile:
    json.dump(raw_districts, outfile, indent=4)
# raw_districts = json.load(open('data/districts.json'))

def parse_streets(data):
    split = split_compound_street_name(data['streets'])
    data['addr_points'] = list(generate_unique_address_points(split))
    data['coords'] = [perform_geocode(s) for s in data['addr_points']]
    
    return data

districts = [parse_streets(d) for d in raw_districts[1:2]]

with open('data/districts.json', 'w') as outfile:
    json.dump(districts, outfile, indent=4)

