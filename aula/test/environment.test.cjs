const test=require('node:test'),assert=require('node:assert/strict');
test('el entorno rechaza producción y archivos locales',async()=>{
  const {assertTestEnvironment}=await import('../environment.mjs');
  for(const hostname of ['utec-math.github.io','example.com',''])assert.throws(()=>assertTestEnvironment({hostname}));
  assert.doesNotThrow(()=>assertTestEnvironment({hostname:'localhost'}));
});
