# Modelo de datos — Avance 2 (50%): suscripciones y pagos

**Responsable:** Integrante 4 (DBA). **Tarea de la planificación:** *"Estructurar en base de datos las transacciones, suscripciones e historial."*

**Archivos:**

| Archivo | Contenido |
|---|---|
| `database/inicializacion/schema.sql` | Tablas `plan`, `suscripcion`, `pago`, índices y vistas (sección "MÓDULO DE PLANES, SUSCRIPCIONES Y PAGOS") |
| `database/datos-iniciales/seed.sql` | Catálogo inicial de 3 planes |
| `database/mantenimiento/reset_modulo_suscripciones.sql` | Solo para desarrollo: borra y permite recrear el módulo |
| `docs/02-diseno/database/modeloRelacional.png` / `.svg` / `.mmd` | Modelo relacional actualizado (`.mmd` = fuente Mermaid editable) |
| `docs/02-diseno/database/entidadRelacion.png` / `.svg` / `.mmd` | Diagrama entidad-relación actualizado; los atributos nuevos van resaltados |

---

## 1. Cambios respecto al modelo original

Se respetaron todas las tablas, columnas y relaciones del modelo relacional. Se agregó:

| Tabla | Cambio | Por qué |
|---|---|---|
| `plan` | `activo BOOLEAN` | Un plan con suscripciones no se puede borrar (FK). Para quitarlo del catálogo se desactiva |
| `suscripcion` | `estado` limitado a `pendiente`, `activa`, `vencida`, `cancelada` | Evita estados inventados. Las suscripciones no se borran, cambian de estado: así queda el historial |
| `suscripcion` | Índice único parcial: **una sola suscripción `activa` por usuario** | Lo garantiza la base de datos, aunque el backend tenga un error o lleguen dos compras a la vez |
| `pago` | `fecha` pasa de `DATE` a `TIMESTAMPTZ` | Una transacción necesita la hora: puede haber varios pagos el mismo día y el historial debe ordenarse bien |
| `pago` | `estado` limitado a `pendiente`, `aprobado`, `rechazado` | Se guardan también los rechazados, para un historial completo |
| `pago` | `tipo` (`contratacion` / `renovacion`) | Distingue en el historial una compra nueva de una renovación |
| `pago` | `referencia` (única) y `tarjeta_ultimos4` | Comprobante de la transacción simulada. **Nunca se guarda el número de tarjeta completo** |
| `pago` | FK compuesta `(suscripcion_id, usuario_id)` → `suscripcion(id, usuario_id)` | El modelo tiene `usuario_id` en `pago` y en `suscripcion`: así nunca pueden quedar distintos |

---

## 2. Diccionario de datos

### `plan`
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER identity | PK |
| `nombre` | VARCHAR(100) | Obligatorio, único |
| `descripcion` | TEXT | Opcional |
| `precio` | NUMERIC(10,2) | ≥ 0 (en quetzales) |
| `capacidad_almacenamiento` | BIGINT | > 0, en **bytes** |
| `vigencia_dias` | INTEGER | > 0 |
| `activo` | BOOLEAN | Por defecto `TRUE` |

### `suscripcion`
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER identity | PK |
| `usuario_id` | INTEGER | FK → `usuario` (si se borra el usuario, se borran sus suscripciones) |
| `plan_id` | INTEGER | FK → `plan` (no deja borrar un plan en uso) |
| `fecha_inicio` | DATE | Por defecto hoy |
| `fecha_renovacion` | DATE | Debe ser posterior a `fecha_inicio` |
| `estado` | VARCHAR(20) | `pendiente` (por defecto), `activa`, `vencida`, `cancelada`. Máximo una `activa` por usuario |

### `pago`
| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER identity | PK |
| `usuario_id` | INTEGER | FK → `usuario` |
| `suscripcion_id` | INTEGER | FK → `suscripcion`, del **mismo** usuario |
| `monto` | NUMERIC(10,2) | > 0 |
| `fecha` | TIMESTAMPTZ | Por defecto ahora |
| `estado` | VARCHAR(20) | `pendiente` (por defecto), `aprobado`, `rechazado` |
| `tipo` | VARCHAR(20) | `contratacion` o `renovacion` (obligatorio) |
| `referencia` | VARCHAR(50) | Opcional, única (id de la transacción simulada) |
| `tarjeta_ultimos4` | CHAR(4) | Opcional, exactamente 4 dígitos |

### Catálogo inicial (`seed.sql`)
| Plan | Capacidad | Precio | Vigencia |
|---|---|---|---|
| Básico | 50 GB | Q25.00 | 30 días |
| Profesional | 200 GB | Q60.00 | 30 días |
| Empresarial | 1 TB | Q150.00 | 30 días |

El **plan gratuito de 5 GB no es una fila** de `plan`: es la capacidad por defecto de `usuario.espacio_disponible` para quien no tiene suscripción activa (así funciona ya el registro).

---

## 3. Vistas para el backend (historial)

| Vista | Para qué | Ejemplo |
|---|---|---|
| `v_historial_pagos` | "Historial de pagos": cada pago con su plan y su usuario | `SELECT * FROM v_historial_pagos WHERE usuario_id = $1 ORDER BY fecha DESC;` |
| `v_suscripcion_actual` | "Mi suscripción": la suscripción activa con los datos del plan y `dias_restantes` | `SELECT * FROM v_suscripcion_actual WHERE usuario_id = $1;` |

---

## 4. Cómo debe usarlo el backend (Integrante 2)

**Contratar un plan.** Todo dentro de una transacción (`BEGIN` … `COMMIT`):
1. `INSERT INTO suscripcion (usuario_id, plan_id, fecha_renovacion) VALUES ($1, $2, CURRENT_DATE + vigencia_dias)` → queda `pendiente`.
2. `INSERT INTO pago (usuario_id, suscripcion_id, monto, tipo) VALUES (…, 'contratacion')` → queda `pendiente`.
3. Si la pasarela simulada aprueba:
   - `UPDATE pago SET estado='aprobado', referencia=…, tarjeta_ultimos4=…`;
   - si había otra suscripción activa, pasarla a `cancelada`;
   - `UPDATE suscripcion SET estado='activa'`;
   - actualizar `usuario.espacio_disponible` con la capacidad del plan.
4. Si rechaza: `UPDATE pago SET estado='rechazado'` y `UPDATE suscripcion SET estado='cancelada'`.

**Renovar.** Nuevo `pago` con `tipo='renovacion'` sobre la misma suscripción y, si se aprueba, `fecha_renovacion = fecha_renovacion + vigencia_dias`.

**Vencimiento.** Las suscripciones `activa` con `fecha_renovacion < CURRENT_DATE` deben pasar a `vencida`, y la capacidad del usuario volver a 5 GB.

Si se intenta activar una segunda suscripción, PostgreSQL responde con el error `23505` sobre `uq_suscripcion_activa_por_usuario`: el backend debe responder `409`.

---

## 5. Cómo actualizar tu base de datos local

**Si nunca creaste las tablas `plan`, `suscripcion` o `pago`:**

```bash
cd Back_
npm run db:init
```

**Si ya las tenías** (por ejemplo, con la versión de la rama `back_` o de alguna prueba): `schema.sql` usa `CREATE TABLE IF NOT EXISTS` y no modifica tablas existentes, así que `db:init` fallaría al crear las vistas. Primero ejecuta el reset (borra **solo** planes, suscripciones y pagos) y después `db:init`:

```bash
psql -U postgres -d almacenamiento_db -f database/mantenimiento/reset_modulo_suscripciones.sql
```

Luego, en `Back_`: `npm run db:init`.

---

## 6. Coordinación con la rama `back_` (Andrés)

La rama `back_` también agrega `plan`, `suscripcion` y `pago` al final de `schema.sql`, con la versión literal del modelo original. Al unir `back_` con `main` habrá un conflicto en `schema.sql`. Para resolverlo:
- conservar las tablas **`carpeta` y `archivo`** (y sus índices) de `back_`;
- conservar el bloque **"MÓDULO DE PLANES, SUSCRIPCIONES Y PAGOS"** de esta versión (Integrante 4).

Se probó que ambos módulos funcionan juntos en la misma base de datos.

---

## 7. Pruebas realizadas

En una base PostgreSQL 16 temporal:

| Prueba | Resultado |
|---|---|
| `db:init` crea todo desde cero y se puede ejecutar dos veces sin errores | ✅ |
| Seed: 3 planes, sin duplicarse | ✅ |
| Flujo de contratación (pendiente → aprobado/activa), renovación y pago rechazado | ✅ |
| Dos suscripciones activas para el mismo usuario: rechazado | ✅ |
| Cambio de plan (cancelar la anterior y activar la nueva): permitido | ✅ |
| Pago apuntando a la suscripción de otro usuario: rechazado | ✅ |
| Restricciones de estado, tipo, monto, tarjeta, fechas, precio y referencia única | ✅ |
| Un plan con suscripciones no se puede borrar (se desactiva) | ✅ |
| Las vistas devuelven el historial y la suscripción activa correctos | ✅ |
| Borrar un usuario borra sus suscripciones y pagos | ✅ |
| El script de reset funciona, también sobre las tablas de la rama `back_` | ✅ |
