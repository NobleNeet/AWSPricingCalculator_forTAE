from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import json,time,hashlib
ROOT=Path.cwd(); MODE=ROOT/'.work/uat/mode';MODE.write_text('normal')
BASE=Path('pricing/generated/builds/20261003T195959Z-2abe18f7')
PRODUCT=BASE/'sources/AmazonS3/ap-northeast-1/products.json'
d=json.loads((ROOT/PRODUCT).read_text())
for p in d['products']:
 if p['productFamily']=='Storage':p['attributes']['storageClass']='UAT-Unresolvable';p['attributes']['volumeType']='UAT-Unresolvable';p['productFamily']='UAT-Unresolvable'
INVALID=json.dumps(d,ensure_ascii=False,indent=2).encode()
manifest=json.loads((ROOT/BASE/'build-manifest.json').read_text());s=manifest['sources']['AmazonS3']['ap-northeast-1'];s['productsSha256']=hashlib.sha256(INVALID).hexdigest();s['productsBytes']=len(INVALID)
INVALID_MANIFEST=json.dumps(manifest).encode()
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  mode=MODE.read_text().strip();path=urlsplit(self.path).path.lstrip('/')
  if path==str(PRODUCT) and mode=='delay':time.sleep(12)
  if (path==str(PRODUCT) and mode=='unavailable') or (path=='pricing/generated/manifest.json' and mode=='stale'):
   self.send_error(503,'UAT intentionally unavailable');return
  data=None
  if mode=='invalid':
   if path==str(PRODUCT):data=INVALID
   elif path==str(BASE/'build-manifest.json'):data=INVALID_MANIFEST
  if data is not None:
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
  super().do_GET()
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
ThreadingHTTPServer(('127.0.0.1',4181),Handler).serve_forever()
