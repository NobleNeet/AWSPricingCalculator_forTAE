from pathlib import Path
p=Path('/tmp/parity-price.mjs');s=p.read_text();s=s.replace("if(label.startsWith('NLBBYTES:'))", "if(label.startsWith('COMBO:')){const combo=aws.locator('input[role=\"combobox\"]:visible').nth(nth);await combo.fill(String(value));await aws.getByRole('option').filter({hasText:String(value)}).first().click();await settle(aws);return;}if(label.startsWith('NLBBYTES:'))",1)
anchor='async function configure(service,plan,region)'
extra="""
const variant=process.argv[5]??'';
if(variant.startsWith('amplify-size-')){const size=variant.slice(13),values={'Large':['Large (16 GB メモリ、vCPU 8 個)','Large (16 GB Memory, 8 vCPUs)'],'XLarge':['XLarge (72 GB メモリ、vCPU 36 個)','XLarge (72 GB Memory, 36 vCPUs)']};plans.amplify.fields.push(['input-profile--buildInstanceSize','SELECT:Select build instance size','Standard (8 GB メモリ、vCPU 4 個)',values[size][0],0,null,{'Standard (8 GB メモリ、vCPU 4 個)':'Standard (8 GB Memory, 4 vCPUs)',[values[size][0]]:values[size][1]}]);plans.amplify.testFields=plans.amplify.fields.slice(-1);}
if(variant.startsWith('codebuild-compute-')){const target=variant.slice(18);plans.codebuild.fields.push(['input-component-build-minutes-computeType','COMBO:computeType','arm1.2xlarge',target]);plans.codebuild.testFields=plans.codebuild.fields.slice(-1);}
if(variant==='codebuild-windows'){plans.codebuild.setup=async()=>{await inputLocal('input-profile--operatingSystem','Windows');await choose('Operating system','Windows');await inputLocal('input-component-build-minutes-computeType','general1.large');await inputAws('COMBO:computeType','general1.large');};}
if(variant.startsWith('s3-boundary-')){const b=Number(variant.slice(12));const f=plans.s3.fields[0];[f[2],f[3]]=b===0?[0,1]:[b-1,b];plans.s3.testFields=[f];}
if(variant.startsWith('s3-after-')){const b=Number(variant.slice(9));const f=plans.s3.fields[0];[f[2],f[3]]=[b,b+1];plans.s3.testFields=[f];}
if(variant==='zero'){for(const service of ['s3','kms','amplify','lambda'])plans[service].fields.forEach(f=>{if(!/DurationMs|memoryMb|MemoryMb|ephemeralStorageMb/.test(f[0]))f[3]=0;});}
if(variant.startsWith('fargate-cpu-')){const cpu=variant.slice(12),memory={'0.25':1,'0.5':1,'1':4,'2':4,'4':8,'8':16,'16':32,'32':60};plans.fargate.fields.find(f=>f[0].endsWith('linuxVcpuPerTask'))[3]=cpu;plans.fargate.testFields=plans.fargate.fields.filter(f=>f[0].endsWith('linuxVcpuPerTask'));plans.fargate.sync=async()=>{const actual=await local.locator('#input-profile--linuxVcpuPerTask').inputValue();await inputLocal('input-profile--linuxMemoryGbPerTask',memory[actual]);await inputAws('Amount of memory allocated Value',memory[actual]);};}
"""
s=s.replace(anchor,extra+'\n'+anchor);# Capture local after dependent synchronization too.
s=s.replace("if(plan.sync)await plan.sync();record.awsAfter=", "if(plan.sync){await plan.sync();record.localAfter=await capture(local,id+'-synced-after','local');}record.awsAfter=")
p.write_text(s)
