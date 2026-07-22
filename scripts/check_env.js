// scripts/check_env.js
console.log(Object.keys(process.env).filter(k => k.includes('DB') || k.includes('PG') || k.includes('PASS') || k.includes('URL') || k.includes('KEY')));
