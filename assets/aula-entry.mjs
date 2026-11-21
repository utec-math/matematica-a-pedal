import {environment,validateEnvironment} from '../aula/environment.mjs';
let enabled=false;
try{enabled=validateEnvironment(environment,location)==='site'}catch{}
if(enabled){
  const utilities=document.querySelector('.map-header-utilities');
  if(utilities&&!document.getElementById('aula-entry')){
    const a=document.createElement('a');a.id='aula-entry';a.className='map-utility';a.href='/matematica-a-pedal/aula/';a.textContent='Mi espacio';utilities.append(a);
  }
}
