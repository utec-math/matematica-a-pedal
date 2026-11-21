// Solo emuladores. No usa la configuración Firebase del sitio público.
export const environment=Object.freeze({projectId:'demo-matematica-pedal',authDomain:'demo-matematica-pedal.firebaseapp.com',apiKey:'demo-key',mode:'emulator',host:'127.0.0.1'});
export function assertTestEnvironment(location){
  if(!['localhost','127.0.0.1'].includes(location.hostname)||environment.mode!=='emulator'||!environment.projectId.startsWith('demo-'))throw Error('Esta versión funciona únicamente en el entorno local de pruebas. No se conecta a producción.');
}
