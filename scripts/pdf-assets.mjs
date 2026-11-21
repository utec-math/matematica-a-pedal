import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';
export const {jsPDF}=createRequire(import.meta.url)('../assets/vendor/jspdf-4.2.1.umd.min.js');
const read=name=>readFileSync(new URL('../assets/'+name,import.meta.url)).toString('base64');
export const pdfAssets={logo:'data:image/png;base64,'+read('bici-espiral.png'),fontBase64:read('vendor/RobotoMono-Regular.ttf'),fontBoldBase64:read('vendor/RobotoMono-Bold.ttf')};
