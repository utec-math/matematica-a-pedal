// Solo emuladores. No usa la configuración Firebase del sitio público.
export const environment=Object.freeze({projectId:'demo-matematica-pedal',authDomain:'demo-matematica-pedal.firebaseapp.com',apiKey:'demo-key',mode:'emulator',host:'127.0.0.1',enableSite:false});
export function validateEnvironment(config,location){
  if(config.mode==='site'&&config.enableSite===true&&location.hostname==='utec-math.github.io'&&location.pathname.startsWith('/matematica-a-pedal/'))return 'site';
  if(config.mode==='emulator'&&['localhost','127.0.0.1'].includes(location.hostname)&&config.projectId.startsWith('demo-'))return 'emulator';
  throw Error('Esta versión funciona únicamente en el entorno local de pruebas. No se conecta a producción.');
}
export function assertTestEnvironment(location){
  return validateEnvironment(environment,location);
}
