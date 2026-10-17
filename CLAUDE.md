# Instrucciones de colaboración — DYKO Caja

**LEER ANTES DE MODIFICAR CÓDIGO:**
1. [Estado real y funcionalidades](docs/ESTADO_Y_HANDOFF.md).
2. [Guion de demostración y validación](docs/DEMO_Y_VALIDACION.md).
3. [PR #1: mejoras parciales de seguridad](https://github.com/DereckVillalobos/dyko-intelligence-caja/pull/1) y [issue #2: integración pendiente](https://github.com/DereckVillalobos/dyko-intelligence-caja/issues/2).
4. [Repo hermano InventarioIA](https://github.com/DereckVillalobos/AgenteInventarioDyko) y su propio `CLAUDE.md`.

## Reconciliación de ramas: IMPORTANTE
- El propietario compartió los archivos `dyko-intelligence-caja.zip` y `dyko-intelligence-caja.patch` generados por Claude el 15-10-2026. **No están aplicados a este `main`**.
- La rama `dyko/seguridad-base-20261014` sí contiene cambios posteriores no consolidados.
- Trabajar en una rama nueva, reconciliar ambos conjuntos (ZIP + PR), revisar conflictos y ejecutar pruebas. No tratar un parche adjunto en otra conversación como si ya estuviera en GitHub.
- El ZIP implementa sesiones firmadas y ventas transaccionales; no retroceder a `actorId`/`employeeId` confiados desde el navegador.
- Mantener separación explícita `npm run build` y migraciones, no semillar productos demo en producción; recuperar funciones de gerentes con autenticación real antes de desbloquear altas privilegiadas.

## Principios del producto
- PWA sencilla por puesto: **ventas / gondolero / gerente**.
- Operación ininterrumpida si se desactiva cualquier LLM. Sin dependencia obligatoria de Grok.
- Datos reales únicamente cuando servidor, DB, rol y seguridad estén verificados.
- Inventario y ventas consistentes (transacciones, idempotencia, historia de costos); los informes no inventan hechos.
- DYKO Intelligence central **aún no existe**. Dejar contrato de eventos/outbox para conectar al final.

## Definición de avance listo para revisión
En cada PR o entrega incluir: módulo, archivos, riesgos, comandos ejecutados, pruebas aprobadas/fallidas/no ejecutadas, requisitos de variables privadas, ruta de demo y referencia al repo hermano.
No afirmar despliegue ni funcionamiento en móvil sin pruebas comprobadas. No incluir secretos ni PII. 
