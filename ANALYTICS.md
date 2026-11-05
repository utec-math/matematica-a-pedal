# Medición de visitas

Se conserva GA4 G-ZY88YE7ZJJ. El módulo compartido del encabezado cubre las 42 páginas del sitio, incluso las antiguas que no tienen un elemento head escrito explícitamente. Se retira la etiqueta exclusiva de la portada para evitar duplicaciones. No se cambian datos ni reglas de Firestore.

## Qué se mide

- Usuarios totales: visitantes únicos estimados por GA4, deduplicados para el período elegido.
- Sesiones: visitas, usando la métrica Sesiones del informe de adquisición, no el conteo bruto del evento session_start.
- Vistas: page_view, una por carga de documento. Iniciar o cerrar sesión no añade una vista adicional.
- visitor_type: anonimo, utec o desconocido. Es un parámetro de evento; clasifica el estado en el momento del evento, no un tipo permanente de persona.
- user_id: UID de Firebase solo para usuarios no anónimos con correo institucional permitido. Se borra con null al salir o al usar una sesión anónima.
- auth_state_change: cambios del estado anterior, incluyendo la resolución tardía de una identidad inicialmente desconocida.

No se envían nombres ni correos por esta integración. Se eliminan parámetros y fragmentos de las URL de página y referente enviadas explícitamente. Google sigue procesando los datos técnicos propios de su etiqueta. Se desactivan Google Signals y las señales de personalización publicitaria en la configuración de la etiqueta.

La identidad institucional se comprueba con el estado Firebase y el dominio permitido, no con la mera existencia de una cuenta Firebase: el sitio crea cuentas anónimas automáticamente. Si Firebase falla o tarda más de tres segundos, la vista se registra como desconocido. Un cambio posterior de identidad no repite la vista. Una salida muy rápida antes de resolver la identidad puede no medirse; bloquear Analytics también impide medir.

Los únicos anónimos son estimaciones por navegador/dispositivo: borrar cookies o cambiar dispositivo puede contar de nuevo. User-ID mejora la deduplicación institucional entre dispositivos. Una persona puede aparecer en los segmentos anónimo e institucional durante un mismo período; no sumar los únicos de esos segmentos para calcular el total. No se recupera retroactivamente la identidad ni la navegación interna que antes no se registró.

## Activación y verificación

1. Confirmar en Administrar → Flujos de datos que el flujo web corresponde al sitio y a G-ZY88YE7ZJJ.
2. Mantener accesible el aviso de sobre.html#privacidad, enlazado desde el encabezado global. Informa de GA4 y del identificador seudónimo de sesión institucional. Esta integración no cambia una elección de consentimiento existente.
3. En el flujo web, revisar Medición mejorada → Vistas de página → Configuración avanzada. Desactivar las vistas basadas en cambios del historial del navegador: este sitio es de varias páginas y el módulo envía manualmente una vista por documento. Revisar otros eventos mejorados antes de activarlos para no incorporar parámetros de URL innecesarios.
4. Crear una dimensión personalizada llamada Tipo de visitante, ámbito Evento, parámetro visitor_type. No registrar user_id como dimensión personalizada.
5. Publicar los archivos de la propuesta, conservando el ID de GA4 y retirando la etiqueta vieja de index.html en el mismo cambio.
6. Validar en Tiempo real/DebugView: portada y una página interna, sesión anónima, ingreso UTEC, vinculación al mismo UID y salida. Comprobar un page_view por carga y ningún correo ni nombre en las cargas enviadas.
7. Consultar Usuarios totales, Sesiones y Vistas con idéntico rango de fechas; comparar por Tipo de visitante o por la dimensión de User-ID. Esperar el procesamiento de GA4 antes de interpretar los informes agregados.

La publicación y la configuración fueron autorizadas por el responsable del sitio el 5 de noviembre de 2026. Se comprobó el flujo G-ZY88YE7ZJJ, con Medición mejorada desactivada e identidad para los informes Mezclado (incluye User-ID). Se creó Tipo de visitante con ámbito Evento y parámetro visitor_type. Las pruebas locales usan una etiqueta simulada, sin enviar eventos reales. La comprobación del sitio publicado puede generar visitas de prueba en producción.

## Verificación local

Ejecutar node --test tests/analytics.test.cjs. Se comprueban cobertura de las 42 páginas, duplicaciones, sesiones restauradas, cuentas institucionales y anónimas, vinculación al mismo UID, salida, errores y demora de Firebase, eliminación de parámetros URL y exclusión de localhost.

## Referencias

- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://developers.google.com/analytics/devguides/collection/ga4/user-id
- https://firebase.google.com/docs/reference/js/auth#onidtokenchanged
