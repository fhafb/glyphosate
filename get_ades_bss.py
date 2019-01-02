import sys
import requests

deps=list(map(lambda x:"{:02}".format(x),range(1,96)))
deps[19:20]=["2A","2B"]
first=True
for dep in deps:
    print(dep,file=sys.stderr)
    params={'num_departement':dep,'size':'20000'}
    res=requests.get("http://hubeau.eaufrance.fr/api/v1/qualite_nappes/stations.csv",params=params)
    if res.status_code==requests.codes.ok:
        if first:
            print(res.text,end='')
            first=False
        else:
            content=res.text
            print(content[content.find('\n')+1:],end='')
    else:
        print('Erreur {} dans "{}"'.format(res.status_code,res.url),file=sys.stderr)
