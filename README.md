# AsisLegal (Interfaz web - prototipo)

Pequeña interfaz web estática para `AsisLegal` con dos pantallas:

- Pantalla de bienvenida (`index.html`) con botón `Crear consulta`.
- Pantalla de interacción con chat central, panel derecho para subir documentos y botón para reproducir audio de la última respuesta.

Tecnologías: HTML, CSS, JavaScript y Bootstrap (CDN).

Cómo probar localmente

1. Abrir el archivo `index.html` en tu navegador (doble clic o `Abrir con...`).
2. En la pantalla principal, pulsa `Crear consulta`.
3. Usa `Subir documentos` para seleccionar archivos (texto, PDF...). Los archivos aparecerán en la lista.
4. Escribe una pregunta en el chat y pulsa `Enviar`. La respuesta es simulada.
5. Pulsa `Reproducir última respuesta` para escuchar la respuesta usando la síntesis de voz del navegador.

Notas y mejoras futuras

- Actualmente las respuestas son simuladas. Se puede conectar `app.js` a un backend o a `AgenteRAC` para respuestas reales.
- Para extraer texto de PDFs es recomendable integrar `pdf.js` o realizar extracción en backend.
- Mejorar accesibilidad y añadir gestión de sesiones/usuario.
