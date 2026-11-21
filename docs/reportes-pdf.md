# Reportes personales y guía de contenidos

Implementación del 21-11-2026, basada en main `315c85f1bb343e689957ac3feaab7a1832d92d88`. Esta propuesta es independiente del borrador de grupos docentes. No incluye ni activa esos grupos, sus reglas o sus enlaces.

## Experiencia

En `progreso.html`, una persona identificada con Google elige todo el recorrido o una unidad, indica el nombre que desea mostrar, agrega una reflexión opcional y descarga el PDF. Solo se incluyen sus propios registros. No se envía el PDF a terceros ni se almacenan las reflexiones en Firestore.

El informe conserva la identidad visual de la plataforma y su logo transparente. Distingue páginas completadas, ausencia de registros, respuestas del autodiagnóstico y autoevaluación declarada. Las sugerencias de repaso se generan a partir de respuestas incorrectas o «No sé», con hasta tres temas enlazados; las preguntas pendientes no se interpretan como errores.

La guía pública `descargas/guia-contenidos-docentes.pdf` contiene las cinco unidades y enlaces a las 38 páginas, más orientaciones de selección e interpretación. Se enlaza desde la portada y Mi progreso, sin exigir registro. Para regenerarla: `node scripts/generate-guide.mjs`. Sus descripciones y fecha requieren revisión cuando cambien los contenidos.

## Datos y permisos

Se mantienen las reglas existentes de acceso propio, sin ampliar permisos docentes ni cambiar facturación. Los dos registros nuevos se guardan dentro de las rutas propias ya autorizadas:

- `users/{uid}/progress/report-autodiagnostico-v1`: versión del cuestionario y respuestas del último estado guardado.
- `users/{uid}/progress/report-autoevaluacion-v1`: casillas de autocorrección del calentamiento y valoración de confianza. Un puntaje no declarado no se convierte en cero sobre diez.

El autodiagnóstico se extrae a un catálogo compartido con el reporte; conserva sus preguntas y recomendaciones. No se implementa historial de intentos ni una medición de mejora entre intentos.

La lectura del PDF se hace desde servidor. Una conexión fallida cancela la descarga; no fabrica resultados vacíos. Se vuelve a comprobar la identidad antes de descargar. Los borradores locales son por UID; una escritura atrasada no usa la cuenta siguiente. Si hay un borrador propio pendiente, se sincroniza antes de incluirlo en el reporte.

La vinculación anónimo→Google conserva el registro completo más reciente; no mezcla respuestas de dos intentos. La recuperación de avances locales antiguos requiere atribución expresa. Se conservan los originales. La autoevaluación antigua del calentamiento también ofrece recuperación voluntaria, sin asignarla automáticamente a otra persona.

La separación local por cuenta se aplica al recorrido, casillas y sesiones existentes. La caché de Firestore propuesta es en memoria. No se asegura haber borrado cachés históricas de navegadores que ya utilizaron la web.

Los registros del navegador siguen siendo declaraciones o marcas de actividad. El PDF no certifica identidad, dominio, calificación ni integridad frente a modificaciones. No se incluyen horas de estudio, que no tienen una medición consolidada fiable.

## Generación y dependencias

El PDF se genera en el dispositivo, sin Functions ni servidor de generación. jsPDF 4.2.1 y Roboto Mono están incluidos y licenciados en `assets/vendor/`, cargados solo al solicitar el PDF. No se utiliza conversión de HTML ni se envían respuestas a una API de generación.

`report-model.mjs` calcula el alcance; `report-records.mjs` valida y coordina los registros por cuenta; `report-account-store.mjs` adapta Firestore; `report-pdf.mjs` compone páginas y enlaces; `report-ui.mjs` conecta el formulario. `report-catalog.mjs` deriva de `assets/nav.json`; comprobar ambos al editar la ruta. Al cambiar preguntas, respuestas o su interpretación hay que cambiar `diagnosticVersion` para no reinterpretar respuestas anteriores.

## Validación y límites

- `node --test tests/*.test.mjs`: aislamiento de cuentas, migración, fallos de red, borradores, filtros y formulario con dependencias simuladas.
- `node scripts/check-report.mjs`: genera PDF reales con la misma biblioteca, fuentes y motor de la web para los seis alcances y textos largos.
- Se renderizaron PDF reales de recorrido completo, de una unidad, de textos largos y de la guía; se revisó la presentación y la extracción de acentos y π.

No se completó una prueba del formulario en navegador, de móvil ni de la ventana real de Google: el servidor local no fue accesible desde la vista de navegador ni desde otro proceso de comprobación. Las pruebas simuladas de formulario no se presentan como una prueba de navegador. Antes de difusión general, comprobar con dos cuentas de prueba el ingreso, guardado, cambio de cuenta, selección, reflexión, descarga y lectura de los PDF en un entorno accesible.

El cambio no contiene una orden para publicar reglas. La web pública y el borrador anterior permanecen sin modificar hasta integrar esta propuesta.
