# Seguimiento docente en Spark

Actualización: 21 de noviembre de 2026. Este documento sustituye la arquitectura con Cloud Functions de los borradores anteriores. El plan real del proyecto fue comprobado en consola: Spark; Google y acceso anónimo habilitados; reglas publicadas con acceso propio únicamente. No se cambió facturación ni configuración real.

## Implementación adaptada

El panel usa ahora Firebase Authentication y el SDK web de Firestore directamente. `aula/firebase.mjs` ya no importa Functions, Admin SDK ni callable functions. `spark/client.mjs` organiza consultas y transacciones. Los permisos se hacen cumplir en servidor mediante el candidato `firestore.spark.rules`, no por ocultar botones en el navegador.

Se conservan: autoservicio docente, grupos, selector de curso, invitaciones aleatorias de 128 bits, ingreso voluntario y consentimiento versionado, avance por páginas, renombrado, renovación del código, salida, retirada y archivo. Se mantienen los espacios visuales y menús separados.

`firebase.spark.json` no declara Functions. Los comandos predeterminados de `package.json` usan este entorno. Los archivos `functions/` y `firebase.testing.json` son el borrador anterior; no se necesitan ni se incluyen en la entrega Spark.

El entorno nuevo sigue restringido al proyecto ficticio local `demo-matematica-pedal`. No hay fallback a producción. El recorrido de actividades original conserva su configuración actual y no debe utilizarse durante las pruebas locales hasta conectarlo expresamente al entorno de prueba.

## Datos y permisos

| Colección | Propósito y permisos |
|---|---|
| `sparkProfiles/{uid}` | Activación docente propia; nombre visible. La suspensión puede marcarse administrativamente y no puede retirarse desde el cliente. |
| `sparkGroups/{groupId}` | Grupo, propietario, estado, nombre, código actual y vencimiento. Los listados del docente exigen filtro de propietario y límite. El propietario no puede cambiarse. |
| `sparkInvites/{code}` | Vista previa mínima de invitación. Sin listado de códigos. Solo un código actual, no vencido, de grupo activo permite consultar la invitación. No es un listado público. |
| `sparkGroups/{groupId}/members/{uid}` | Consentimiento del estudiante, alias, fecha, versión y código con el que ingresó. Solo el propio estudiante puede crear su membresía y debe presentar el código vigente. El docente puede retirarla. |
| `sparkMemberships/{uid}/groups/{groupId}` | Índice por estudiante. Se crea en el mismo lote que la membresía; no permite falsificar una incorporación. |
| `sparkShares/{studentUid}/teachers/{teacherUid}` | Enlace de lectura a un grupo en el que ya existe consentimiento. Solo permite apuntar a un grupo activo del docente con membresía vigente. |
| `users/{uid}/progress/{unidad0…4}` | Conserva escrituras y lecturas propias, incluido el acceso anónimo previo. El docente recibe solo acceso `get` a estas cinco unidades si el enlace, la membresía, el docente y el estado del grupo son válidos. No recibe acceso al perfil personal ni al listado global de usuarios o progreso. |

El enlace de lectura no es un permiso independiente: las reglas vuelven a comprobar grupo y membresía en cada lectura. Archivar o retirar a un integrante invalida el acceso aunque el enlace histórico permanezca. Si un estudiante comparte con el mismo docente en varios grupos, el panel puede ubicar el enlace en el grupo activo que está consultando, sin crear otra inscripción ni ampliar el alcance más allá de un consentimiento ya existente.

Firestore autoriza documentos completos, no campos individuales. Por eso el consentimiento describe el **registro de progreso de las cinco unidades**, incluidos metadatos de actividad que ya existan (tiempo activo y desplazamiento), aunque el panel solo calcule páginas y fechas. No se debe prometer una limitación por campos que las reglas no pueden imponer. El perfil personal permanece denegado.

Los códigos se guardan como secretos aleatorios y no como hashes: las reglas necesitan contrastar el código presentado con el vigente. Docentes e integrantes autorizados pueden conocer el código de su grupo. No se envían a Analytics, no se enumeran y no se incluyen en URL. Al renovar, el documento antiguo puede permanecer, pero las reglas lo vuelven ilegible y no permite volver a ingresar. Este diseño no incluye borrado programado.

Las consultas de progreso se hacen desde servidor, con caché solo en memoria. El cliente revalida el grupo y la existencia de los integrantes al finalizar una carga, y descarta respuestas de sesiones anteriores. Como en la versión original, no es posible retirar información que un docente ya haya visto o copiado.

## Estadísticas y consumo

- El progreso individual y el resumen del grupo se calculan a partir de registros existentes, sin mantener contadores globales de eventos desde el cliente.
- El panel muestra hasta veinte integrantes por página; sus promedios se etiquetan como correspondientes a esa página.
- El número de integrantes se consulta con una agregación acotada a 201 documentos. Un resultado de 201 se muestra como `201+`, sin fingir exactitud para cursos mayores.
- “Sin datos” y “0 completadas” son estados diferentes. Los resultados no se presentan como dominio de contenidos.
- No se incluyeron estadísticas administrativas globales verificadas, series completas, correos automáticos, limpieza por inactividad o límites fuertes de solicitudes por cuenta. Esas funciones requieren otro diseño o un servicio de servidor.
- Las reglas y lecturas del panel consumen cuota, incluidas algunas comprobaciones adicionales de permisos. La cantidad de cursos soportada se medirá durante el piloto; no se garantiza por un número de cuentas.
- Spark evita habilitar facturación, pero su cuota puede agotarse y afectar el servicio compartido con las actividades existentes. Se deberán medir cargas, evitar refrescos continuos y revisar la pestaña Uso de Firestore antes del lanzamiento.

## Verificación

Pasaron **21 pruebas locales**: 15 del cliente Spark y del catálogo, y 6 de interfaz/entorno. Verifican operaciones, consistencia de índices, idempotencia, preservación de progreso y ausencia de dependencia de Functions. El adaptador en memoria de estas pruebas **no evalúa las reglas de seguridad**.

Se escribieron **20 pruebas de reglas reales** en `tests/spark-rules.test.cjs`: creación atómica, suspensión, no enumeración, código vigente, consentimiento, aislamiento entre docentes, acceso limitado a unidades, salida, archivo, rotación y conservación del acceso propio anónimo. Aún no se ejecutaron: faltan herramientas/dependencias para arrancar el emulador y la política de esta sesión rechazó la instalación con permisos adicionales.

El archivo `firestore.rules` original y las reglas publicadas no se modificaron. **No desplegar `firestore.spark.rules` hasta pasar las pruebas de reglas y el flujo completo de navegador.** No se afirma que este candidato ya esté validado para producción.

## Siguiente comprobación

En una estación preparada con Node, gestor de paquetes y Java:

1. Instalar únicamente las dependencias de la raíz: `npm install` (ya no hace falta instalar `functions/`).
2. Ejecutar `npm test`.
3. Ejecutar `npm run test:rules`.
4. Ejecutar `npm run emulators` y abrir `http://127.0.0.1:5000/aula/`.
5. Usar cuentas ficticias y comprobar los dos roles, dos docentes distintos, dos grupos del mismo docente, retirada concurrente, renovación y archivo.
6. Revisar visualmente móvil y teclado; medir lecturas y escrituras por carga.
7. Preparar después la conexión explícita al proyecto real y el enlace desde la web, con respaldo de reglas y código antes de publicar.

El paquete adjunto se aplica sobre el repositorio existente. No requiere servicios pagos ni contiene una orden de despliegue automático.
