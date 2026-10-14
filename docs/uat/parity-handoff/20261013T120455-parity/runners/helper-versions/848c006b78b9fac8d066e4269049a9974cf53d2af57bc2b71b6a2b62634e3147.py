import pathlib,hashlib,os,json,time
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text());index={};groups=[];saved=0
for p in sorted(r.rglob('*.png')):
 st=p.stat()
 if time.time()-st.st_mtime<60:continue
 data=p.read_bytes()
 if not data.startswith(b'\x89PNG\r\n\x1a\n') or not data.endswith(b'IEND\xaeB`\x82') or p.stat().st_mtime_ns!=st.st_mtime_ns:continue
 h=hashlib.sha256(data).hexdigest()
 if h in index:
  src=index[h]
  if not os.path.samefile(src,p):
   temp=p.with_name(p.name+'.dedup-'+str(time.time_ns()));os.link(src,temp);os.replace(temp,p);saved+=len(data);groups.append({'retained':str(src.relative_to(r)),'duplicate':str(p.relative_to(r)),'sha256':h,'bytes':len(data)})
 else:index[h]=p
p=r/'evidence-storage-dedup.json';prior=json.loads(p.read_text()) if p.exists() else {'groups':[],'savedBytes':0};prior['method']='Byte-identical completed PNG evidence hardlinked, preserving image bytes and paths. Active/recent captures excluded; subsequent copies replace aliases atomically.';prior['savedBytes']+=saved;prior['groups']+=groups;prior['checkedAt']=__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat();p.write_text(json.dumps(prior,indent=2)+'\n');print('bytes saved',saved,'groups',len(groups))
