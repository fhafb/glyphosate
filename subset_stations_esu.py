#! /usr/bin/env python3

import sys
import csv
import osgeo.ogr as ogr
import osgeo.osr as osr
import json

stations={}
with open(sys.argv[2],newline='') as esu:
    reader=csv.reader(esu,delimiter=';',quotechar=None)
    for row in reader:
        if row[0] not in stations:
            stations[row[0]]=[]
        if (row[7]=='2'):
            stations[row[0]].append((row[3],int(row[4]),0,int(row[7])))
        else:
            stations[row[0]].append((row[3],int(row[4]),float(row[5]),int(row[7])))
for code in stations.keys():
    stations[code].sort(key=lambda dat:dat[0])
sds=ogr.Open(sys.argv[1])
if sds is None:
    print("Could not open {}".format(sys.argv[1]))
    sys.exit()
slayer=sds.GetLayer()
nb=slayer.GetFeatureCount()
ssrs=slayer.GetSpatialRef()
dsrs=osr.SpatialReference()
dsrs.ImportFromEPSG(4326)
coordTrans=osr.CoordinateTransformation(ssrs,dsrs)
geojson={"type":"FeatureCollection","name":"stations","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}},"features":[]}
#i=0
#percent=0
for feature in slayer:
    code=feature.GetFieldAsString('CdStationM')
    nom=feature.GetFieldAsString('LbStationM')
    #i=i+1
    #if int(i*100/nb)>percent:
    #    percent=percent+1
    #    print("{}%".format(percent))
    if code not in stations:
        continue
    geom=feature.GetGeometryRef()
    geom.Transform(coordTrans)
    dfeature={"type":"Feature","properties":{"code":code,"nom":nom,"data":[]},"geometry":{"type":"Point","coordinates":[round(geom.GetX(),4),round(geom.GetY(),4)]}}
    for dat in stations[code]:
        dfeature["properties"]["data"].append(dat)
    geojson["features"].append(dfeature)
slayer=None
json.dump(geojson,sys.stdout,separators=(',',':'))
