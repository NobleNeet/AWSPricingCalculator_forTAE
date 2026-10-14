import {chromium} from '/home/ubnadmin/AWSPricingCalculator_forTAE/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const r='/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+fs.readFileSync('/tmp/aws-parity-current','utf8');
const b=await chromium.launch({headless:false});const p=await b.newPage({viewport:{width:1440,height:1100}});
await p.goto('https://nobleneet.github.io/AWSPricingCalculator_forTAE/',{waitUntil:'domcontentloaded'});await p.locator('#price-meta').filter({hasText:/Price Data \d{4}/}).waitFor();const result={observedAt:new Date().toISOString(),url:p.url(),meta:await p.locator('#price-meta').innerText()};const f='observations/public-build-check-'+Date.now();await p.screenshot({path:r+'/'+f+'.png',fullPage:true,timeout:12000});fs.writeFileSync(r+'/'+f+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();
