# Solucionarios de las paradas de control

Cuatro PDF descargables, con los 40 ejercicios de las etapas 1–4, soluciones explicadas, comprobaciones y propiedades con condiciones de aplicación. Cada archivo contiene 10 páginas de ejercicios y 2 páginas de propiedades. La cabecera utiliza `assets/bici-espiral.png`, el mismo recurso de la cabecera del sitio.

## Actualizar contenidos

Editar `contenidos.json` y ejecutar desde la raíz del repositorio:

```sh
node solucionarios/generar.cjs
```

El generador no requiere paquetes externos. Crea los cuatro PDF en `descargas/`, con texto seleccionable, fórmulas vectoriales y el logo indexado sobre fondo blanco. Si cambia el formato del logo, hay que adaptar su lectura en el generador.

Los enlaces en `unidad1/mini-evaluacion.html` a `unidad4/mini-evaluacion.html` usan el atributo `download`; los desarrollos de los PDF no se incrustan en las páginas.

## Correspondencia con la web

Fuente: versión `44109d42779b28f3b0a9b5303d88a52ba806ecf0`. Se mantienen numeración, valores y apartados de los ejercicios, con enunciados reformulados cuando facilita su lectura independiente. El calentamiento y el autodiagnóstico no forman parte de estas cuatro paradas.

Se corrige la solución del ejercicio 5c de la etapa 1: `9 ÷ (-1/3) = -27`. Se añade `x ≠ 0` a la simplificación del ejercicio 6 de la etapa 2. Los PDF conservan todas las restricciones de las fracciones algebraicas.

## Validación

Se verificaron la coincidencia de los archivos guardados con los generados, los índices y longitudes internos de los PDF, la regeneración de los cuatro archivos y los enlaces de descarga. Se revisaron las derivaciones matemáticas y se comprobaron numéricamente las operaciones sensibles de fracciones, radicales y trigonometría.

La revisión visual en un lector PDF sigue pendiente: las herramientas locales y de navegador de esta sesión fallaron al inicializarse. Antes de publicar, revisar signos, fracciones, radicales, logo y cortes de página en los cuatro PDF. La propuesta se conserva como borrador mientras falta esa revisión.
