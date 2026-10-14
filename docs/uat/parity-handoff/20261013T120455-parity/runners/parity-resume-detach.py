import pathlib,os,shutil,json
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/20261013T120455-parity')
# Invoke only after the user explicitly resumes testing and sufficient persistent storage is available.
# The pause snapshot shares immutable evidence bytes. Detach mutable audit files before any write.
count=0;needed=sum(p.stat().st_size for p in r.rglob('*') if p.is_file() and not p.is_symlink() and p.suffix!='.png' and p.stat().st_nlink>1)
free=shutil.disk_usage(r).free
if free<needed+200000000:raise SystemExit('Expand persistent storage first: detach requires '+str(needed)+' bytes plus 200 MB reserve')
for p in r.rglob('*'):
 if p.is_file() and not p.is_symlink() and p.suffix!='.png' and p.stat().st_nlink>1:
  tmp=p.with_name(p.name+'.detach');shutil.copy2(p,tmp);os.replace(tmp,p);count+=1
print(json.dumps({'detachedMutableFiles':count,'snapshotPreserved':True}))
