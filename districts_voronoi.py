#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import urllib2, urllib
from pprint import pprint
from scipy.spatial import ConvexHull
from bs4 import BeautifulSoup
import re
import time
import codecs


def perform_geocode(street):
    """ Call OSM to do geocoding 

    1-2 requests per second
    """

    street = street.replace("ul.", "").strip()

    # https://wiki.openstreetmap.org/wiki/Nominatim
    query_params = {}
    query_params['format'] = 'json'
    query_params['street'] = street.encode("utf-8")
    query_params['city'] = u'Wrocław'.encode("utf-8")
    query_params['country'] = 'Polska'
    query_params['viewbox'] = '16.70609,51.22611,17.53831,51.01061'
    query_params['bouded'] = '1'
    query_params['polygon_geojson'] = '1'

    # take first (hopefully best) match
    query_params['limit'] = '1'

    query = urllib.urlencode(query_params)
    url = 'https://nominatim.openstreetmap.org/search?' + query
    
    pprint(query)
    response = urllib2.urlopen(url)
    json_data = response.read()
    json_data = json.loads(json_data)

    

    ret = {}
    ret['stret_name'] = street
    
    bbox = json_data[0]
    if bbox['geojson']['type'] == 'Point':
        ret['coords'] = [bbox['geojson']['coordinates'][0], bbox['geojson']['coordinates'][1]]
    elif bbox['geojson']['type'] == 'LineString':
        ret['coords'] = bbox['geojson']['coordinates'][0]
    elif bbox['geojson']['type'] == 'Polygon':
        ret['coords'] = bbox['geojson']['coordinates'][0][0] 
    else:
        raise Exception('unknon geo type ' + bbox['geojson']['type'])

    time.sleep(0.5)

    return ret

#
# based on https://www.wroclaw.pl/files/wybory_prezydenckie_2015/obwody-okw.pdf
#
def get_raw_districts_list_2015():
    districts = []
    
    lines = codecs.open('data/raw_districts_2015.txt', encoding='utf-8', mode='r').readlines()
    lines = [line.replace('\n', '|') for line in lines]

    lines = ''.join(lines)
    lines = lines.split('-----------')
    

    zipped = zip(lines[::3], lines[1::3], lines[2::3])
    for z in zipped:
        raw_data = {}
        raw_data['number'] = z[0].replace("|", "").strip()
        raw_data['streets'] = z[1].strip()
        raw_data['name'] = z[2].split("|")[1].strip()
        raw_data['address'] = z[2].split("|")[2].strip()
        districts.append(raw_data)

    return districts

raw_districts = get_raw_districts_list_2015()



def parse_streets(data):
    pprint('geocoding for ' + data['address'])
    data['address_coords'] = perform_geocode(data['address']) 
    
    return data

districts = [parse_streets(d) for d in raw_districts[0:20+1]]

with open('data/polling_places.json', 'w') as outfile:
    json.dump(districts, outfile, indent=4)

