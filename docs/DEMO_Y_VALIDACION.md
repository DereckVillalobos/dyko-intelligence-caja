# DEMO de DYKO Caja — checklist reproducible
**Actualización: 17-10-2026.** Este documento es un guion de validación, **no un informe de pruebas aprobadas**.

## Estado y fuente del código
- **GitHub `main`:** base histórica con dependencias de Grok y permisos aún inseguros.
- **PR #1:** correcciones adicionales parciales.
- **ZIP de Claude:** evolución fuera de GitHub a reconciliar antes del despliegue.
- **No hay una URL pública de Vercel validada ni un POS apto para producción.**

## Requisitos
Node compatible con el proyecto, npm y un navegador moderno. Para demo usar **SOLO datos inventados** y un perfil local sin acceso real a pagos. Evitar compartir la demo públicamente.

### Comandos base
```bash
git clone https://github.com/DereckVillalobos/dyko-intelligence-caja.git
cd dyko-intelligence-caja
npm ci
npm run dev
```
Abrir la dirección local que imprima Vite. El ZIP más reciente de Claude configura el puerto **8080**, pero GitHub `main` puede usar infraestructura distinta y requerir ajustes. En el ZIP de Claude, sin `DATABASE_URL`, PGlite de desarrollo utiliza almacenamiento en memoria y se reinicia sin conservar datos. **Nunca utilizarlo para transacciones reales.**

### Ruta sugerida de revisión funcional
| Paso | Usuario | Escenario de validación | Resultado esperado |
|---|---|---|---|
| 1 | Gerente | Configurar primer gerente con código de instalación cuando corresponda | Se registra una vez; segundo intento NO suplanta el existente |
| 2 | Gerente | Registrar empleado y asignar puesto | Cajero solo ve funciones permitidas |
| 3 | Cajero | Buscar y escanear un producto, añadir 2 unidades | Carrito y cantidades coherentes |
| 4 | Cajero | Cobrar en efectivo inventado (₡5.000 por total menor) | Vuelto correcto; ticket único |
| 5 | Cajero | Registrar tarjeta y SINPE **simulados** | Historial distingue medios de pago |
| 6 | Gondolero | Ajustar producto de demostración con motivo | Movimiento ligado al empleado; stock consistente |
| 7 | Gerente | Consultar panel diario/semanal y ventas por empleado | Indicadores coinciden con ventas simuladas |
| 8 | Gerente | Realizar cierre con efectivo ficticio | Diferencia contra efectivo teórico calculada |

### Pruebas mínimas antes de publicar
- `npm run typecheck`, `npm test`, `npm run build`: registrar salidas exactas y versiones de Node.
- Intentar acceder a operaciones de gerente con sesión de cajero, empleado pendiente o sin sesión; todas deben denegarse.
- Doble toque de cobrar y dos dispositivos: **una sola venta por solicitud**, ticket sin colisiones y stock correcto.
- Forzar error entre inserción de cabecera y detalle: sin venta parcial.
- Revisar restablecimiento de PIN, caducidad/revocación de sesiones, código de instalación, acceso concurrente, URLs PWA y HTTPS.
- Confirmar `DATABASE_URL`, secretos y migraciones en **staging aislado** (no instalar migraciones como efecto de compilar).

**Resultado a reportar:** `OK`, `FALLÓ`, `NO EJECUTADO` por cada caso. Capturas sin PII ni credenciales.

Ver [estado y coordinación](ESTADO_Y_HANDOFF.md) para el orden de integración y enlace al trabajo de Claude.
