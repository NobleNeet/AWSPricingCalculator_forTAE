import pathlib,json,os,time
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text())
paths=list((r/'observations').glob('*.json'))+[r/f for f in ['aws-field-inventory.json','local-field-inventory.json','local-field-index.json','official-field-index.json','official-field-inventory.json','consolidated-cases.json']]
saved=0;files=0
for p in paths:
 if not p.exists() or time.time()-p.stat().st_mtime<60:continue
 b=p.read_bytes();data=json.loads(b);out=(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 if len(out)>=len(b):continue
 if json.loads(out)!=data:raise RuntimeError('Serialization changed data')
 tmp=p.with_name(p.name+'.compact-'+str(time.time_ns()));tmp.write_bytes(out);os.replace(tmp,p);saved+=len(b)-len(out);files+=1
print(json.dumps({'files':files,'savedBytes':saved,'method':'Lossless JSON whitespace compaction, parsed data and GUI text unchanged; no screenshot modification; active/recent files excluded.'}))
