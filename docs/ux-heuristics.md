# Heurísticas UX/UI (Nielsen) — checklist frontend

Todo PR que toque UI debe cumplir estas 10 heurísticas. Marcar en la descripción del PR.

## 1. Visibilidad del estado del sistema

- [ ] Loading states en acciones async (submit, upload, login)
- [ ] Feedback inmediato al guardar / entregar / calificar
- [ ] Indicadores de no leído en notificaciones

## 2. Correspondencia entre el sistema y el mundo real

- [ ] Lenguaje escolar claro (tarea, entrega, examen, ciclo, clase)
- [ ] Fechas/horas en formato local familiar
- [ ] Iconografía coherente con la acción

## 3. Control y libertad del usuario

- [ ] Cancelar formularios y diálogos
- [ ] Confirmar acciones destructivas (eliminar clase, borrar archivo)
- [ ] Poder editar borradores de entrega antes de enviar

## 4. Consistencia y estándares

- [ ] Mismos patrones de botones, formularios y tablas en todo el app
- [ ] Navegación predecible por rol (alumno / profesor / padre / admin)
- [ ] Errores de API mostrados de forma uniforme

## 5. Prevención de errores

- [ ] Validación en cliente alineada a Zod (`packages/shared`)
- [ ] Deshabilitar submit si el formulario es inválido
- [ ] Impedir entrega fuera de plazo con mensaje claro
- [ ] Confirmación al salir con cambios sin guardar

## 6. Reconocimiento antes que recuerdo

- [ ] Listas y filtros visibles (clases, tareas pendientes)
- [ ] Estado de entrega visible (borrador / enviada / calificada)
- [ ] Fechas de entrega destacadas en el feed

## 7. Flexibilidad y eficiencia de uso

- [ ] Atajos útiles para profesores (publicar, calificar en lote cuando exista)
- [ ] Búsqueda/filtrado en listados largos
- [ ] Reutilizar plantillas de tarea/examen (fase posterior OK)

## 8. Diseño estético y minimalista

- [ ] Una intención clara por pantalla/sección
- [ ] Sin ruido visual ni cards innecesarias en el hero de marketing (si aplica)
- [ ] Jerarquía tipográfica clara

## 9. Ayudar a reconocer, diagnosticar y recuperarse de errores

- [ ] Mensajes de error en español, accionables
- [ ] Reintento en fallos de red / upload
- [ ] No perder el contenido del formulario tras error 4xx/5xx

## 10. Ayuda y documentación

- [ ] Textos vacíos con siguiente paso (“Creá tu primera clase”, “Unite con un código”)
- [ ] Tooltips o ayuda corta en flujos críticos (código de clase, vínculo padre)
- [ ] Enlace a ayuda contextual cuando el flujo sea complejo

## Criterio de aceptación UX

Un PR de frontend **no se mergea** sin este checklist completado (o justificación explícita de ítems N/A).
