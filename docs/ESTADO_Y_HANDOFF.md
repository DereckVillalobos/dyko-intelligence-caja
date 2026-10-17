# DYKO — Estado, funcionalidades y entrega a Claude
**Corte:** 17 de octubre de 2026 · **Destinatarios:** responsables de Dyko, Claude y otros asistentes de desarrollo.

> **Fuente de verdad:** este documento describe qué existe y qué falta, NO declara que todo esté probado. El código de `main`, el PR de seguridad y los ZIP de Claude son **tres versiones distintas**. No ejecutar cobros reales en una rama de pruebas.

## 1. Objetivo del ecosistema
Dyko Intelligence será el sistema central futuro. Hasta entonces, dos extensiones independientes capturan operaciones de empleados y producen datos confiables:
- **Caja / POS:** ventas, personal, movimiento de productos y seguimiento gerencial.
- **InventarioIA / MermaIA:** motores deterministas de análisis, propuestas de compra, vencimiento, rotación y discrepancias de conteo.

La integración entre extensiones y Dyko Intelligence **queda para el final**. Diseñar desde ya `branch_id`, auditoría y eventos versionados, pero no acoplar el runtime a un sistema central inexistente. Priorizar interfaz mínima por puesto.

## 2. Estado de versiones — leer antes de editar

| Ubicación | Qué contiene | ¿Código operativo vigente? |
|---|---|---|
| `main` de este repo | Caja con UI, rutas por puesto, lógica y restos de Grok; seguridad original incompleta | **Base histórica; no publicar como producción** |
| [PR #1 — seguridad inicial](https://github.com/DereckVillalobos/dyko-intelligence-caja/pull/1), rama `dyko/seguridad-base-20261014` | Cambios posteriores: protecciones de inicialización, bloqueo de alta privilegiada insegura, configuración, diferencia entre margen y recargo, demo seed restringida, build sin migraciones | **Borrador, SIN fusionar ni validar integralmente** |
| ZIP `dyko-intelligence-caja.zip` y `dyko-intelligence-caja.patch` entregados por Claude al propietario (15-10-2026) | Sesiones firmadas, autorización servidor, venta transaccional e idempotente, migración 0008, limpieza Grok/PWA, README y configuración Vercel/Neon | **Código suministrado fuera de GitHub; NO aplicado todavía** |
| [Issue #2](https://github.com/DereckVillalobos/dyko-intelligence-caja/issues/2) | Integración del trabajo pendiente y validaciones para producción | **Backlog activo** |

**Advertencia de integración:** las protecciones temporales del PR #1 no sustituyen la sesión firmada de Claude; por ejemplo, la creación adicional de gerentes está bloqueada intencionalmente hasta poder exigir un `requireGerente` real. Al consolidar, priorizar la arquitectura autenticada del ZIP sin perder los cambios y pruebas del PR. No fusionar código inseguro solo para que arranque la demo.

## 3. Inventario de interfaz / módulos actuales

| Perfil / módulo | Operaciones presentes en el código | Limitaciones conocidas |
|---|---|---|
| Inicio y empleados | Acceso por PIN, selección de perfil, avatars, vinculación de dispositivo, alta de empleados y asignación de roles | Proceso de recuperación de PIN y permisos requiere revisión integral |
| Ventas / Caja | Catálogo, búsqueda, escáner, carrito, cantidades, efectivo y cálculo de vuelto, registro manual de tarjeta o SINPE, ticket, venta, historial | No es conciliación bancaria automática; devoluciones/anulaciones y pago mixto no están terminados |
| Ficha producto | Código de barras, descripción, categoría, precios, costo, stock, mínimo, proveedor, unidad, vencimiento, IVA, CABYS | Un vencimiento por producto; faltan lotes FEFO y conversiones completas de unidades |
| Inventario operativo | Alta y edición de productos, entradas/salidas, registro de merma con motivo | Falta recepción formal por proveedor, conteo cíclico y transacciones concurrentes consistentes en `main` |
| Gerencia | Panel de ventas, objetivos, mix de pagos, alertas de stock/vencimiento, equipo, indicadores semanales y rendimiento por empleado | Indicadores históricos limitados; no reemplaza contabilidad ni conciliación bancaria |
| Cierre de caja | Cierre diario, efectivo teórico y declarado, diferencia | Falta apertura y movimientos por turno, depósitos y autorizaciones completas |

**Origen verificable:** `src/routes/caja/*`, `src/routes/gerente/*`, `src/lib/pos/{api,staff-api,types}.ts`. **No confundir existencia de pantalla con funcionamiento verificado en móvil.**

## 4. Ejecución y demostración
La versión **ZIP de Claude** tiene scripts `npm ci` y `npm run dev`; Vite muestra la app en desarrollo y puede usar base de datos efímera para pruebas. En la versión de este GitHub hay dependencias y envoltorios heredados de Grok y podría requerir ajustes. No hay una URL Vercel validada.

Para demostración: usar base aislada y **datos ficticios**, indicar visualmente `DEMO`, evitar pagos reales y acceso público. Flujo sugerido: gerente → empleado → asignar puesto → productos → simular ventas → movimientos → cierre → panel. **Si algo falla, documentar el fallo, no señalarlo como probado.**

No almacenar contraseñas, claves de modelos, credenciales Neon ni datos reales en GitHub. Credenciales mediante variables de entorno privadas.

## 5. Prioridades vinculantes para siguientes cambios
1. **Conciliar** ZIP/parche de Claude y PR #1 en una rama nueva, resolviendo conflictos con tests; NO asumir que ya existen en `main`.
2. Seguridad: sesiones firmadas y roles validados en servidor; empleados pendientes bloqueados; PIN protegido y sesiones revocables.
3. Ventas/inventario: transacciones, idempotencia, no sobreescritura concurrente; costo/IVA congelados al vender; definir cómo manejar stock negativo.
4. Unidades, proveedor, lotes, conteos, anulaciones y movimientos de caja.
5. Demo estable en navegador/teléfono y despliegue Vercel **de prueba**, nunca con datos reales mientras exista riesgo.
6. Motores de InventarioIA consumen instantáneas generadas en servidor; `LLM_PROVIDER=none` mantiene cálculos esenciales.
7. Outbox de eventos (append-only, versionados y transaccionales) para conectar al DYKO central posteriormente.

**Convención de eventos futura:** `sale.completed`, `sale.voided`, `stock.received`, `stock.adjusted`, `count.submitted`, `cash.closed`, `proposal.decided`; incluir `event_id`, `schema_version`, `branch_id`, `employee_id`, `occurred_at`, `payload` e idempotencia.

## 6. Acuerdo de trabajo para Claude y otras herramientas
- Antes de tocar código: **leer este documento, PR #1, issue #2 y las ramas**. Confrontar `main` vs ZIP y no sobrescribir trabajo ya desarrollado.
- Cada avance requiere commit, PR o referencia, lista de archivos, pruebas ejecutadas (con resultado real), limitaciones y pasos de ejecución local.
- No declarar `npm test`, `typecheck`, Vercel ni un agente real como aprobado sin ejecutarlo.
- No introducir dependencia obligatoria de Grok, un proveedor de IA o del futuro Dyko Intelligence.
- **Regla del producto:** menos pasos para el empleado; cálculos y validaciones en servidor; no inventar datos faltantes.

**Repositorio hermano:** https://github.com/DereckVillalobos/AgenteInventarioDyko — ver su documento equivalente y PR #1.
