const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const result=spawnSync('npm',['audit','--json'],{encoding:'utf8'});
fs.writeFileSync('npm-audit.json',result.stdout||'{}');
const report=JSON.parse(result.stdout||'{}');
console.log('DEPENDENCY_AUDIT',JSON.stringify({error:report.error,counts:report.metadata?.vulnerabilities,packages:Object.values(report.vulnerabilities||{}).map(v=>({name:v.name,severity:v.severity,isDirect:v.isDirect,fixAvailable:v.fixAvailable,via:v.via.filter(x=>typeof x==='object').map(x=>({name:x.name,title:x.title,range:x.range}))}))}));
