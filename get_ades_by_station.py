import sys
import requests
import csv

stations=set()
with open(sys.argv[1],newline='') as f:
    reader=csv.reader(f,delimiter=';',quotechar='"')
    for row in reader:
        if len(row)>=11 and row[10] in ("35","39","63"):
            stations.add(row[0])
total=len(stations)
i=0
for sta in stations:
    i=i+1
    print("{}/{} - {}".format(i,total,sta),file=sys.stderr)
    params={'bss_id':sta,'code_param':'1506,1907','size':'20000','code_unite':"133"}
    res=requests.get("http://hubeau.eaufrance.fr/api/v1/qualite_nappes/analyses.csv",params=params)
    if res.status_code==requests.codes.ok:
        if i==1:
            print(res.text,end='')
        else:
            content=res.text
            print(content[content.find('\n')+1:],end='')
    else:
        print('Erreur {} dans "{}"'.format(res.status_code,res.url),file=sys.stderr)
