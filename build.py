"""Rebuild index.html from src/. Usage: python3 build.py"""
import json
snap=json.load(open('data/snapshot.json'))
data=open('src/data.js').read().replace('__SNAP_UP__',json.dumps(snap['up'])).replace('__SNAP_PAST__',json.dumps(snap['past']))
js='const LAND='+open('data/land.json').read()+';\n'+data+'\n'+open('data/countries.js').read()+'\n'+open('src/geo.js').read()+'\n'+open('src/shim.js').read()+'\n'+open('ext/blackhole.js').read()+'\n'+open('ext/shader.js').read()+'\n'
js+='\n'.join(open('src/'+f).read() for f in ['rockets.js','core.js','cockpit.js','xray.js','earth.js','launch.js','hangar.js','moon.js','solar.js','sats.js','theme.js','intro.js','main.js'])
open('index.html','w').write(open('src/shell.html').read().replace('__JS__',js))
print('index.html rebuilt')
