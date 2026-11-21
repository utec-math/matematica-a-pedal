const test=require('node:test'),assert=require('node:assert/strict');
test('el entorno rechaza producción y archivos locales',async()=>{
  const {assertTestEnvironment}=await import('../environment.mjs');
  for(const hostname of ['utec-math.github.io','example.com',''])assert.throws(()=>assertTestEnvironment({hostname}));
  assert.doesNotThrow(()=>assertTestEnvironment({hostname:'localhost'}));
});
test('la integración en el sitio exige activación explícita y dominio correcto',async()=>{
  const {validateEnvironment}=await import('../environment.mjs');
  const config={mode:'site',enableSite:false};const site={hostname:'utec-math.github.io',pathname:'/matematica-a-pedal/aula/'};
  assert.throws(()=>validateEnvironment(config,site));
  assert.equal(validateEnvironment({...config,enableSite:true},site),'site');
  assert.throws(()=>validateEnvironment({...config,enableSite:true},{...site,hostname:'otro.github.io'}));
  assert.throws(()=>validateEnvironment({...config,enableSite:true},{...site,pathname:'/otro/'}));
});
