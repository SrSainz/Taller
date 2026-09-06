# Auditoría SOBRE RUEDAS — 6 septiembre 2026

## Diagnóstico comprobado

No está lleno el almacenamiento. El límite excedido es **tráfico saliente (egress)**.
Panel Supabase, ciclo 11 agosto–11 septiembre: **35,378 GB / 5 GB (708%)**.
El aviso actual del panel termina la gracia el **7 septiembre 2026** y advierte de posibles respuestas 402. Las optimizaciones no descuentan el tráfico ya consumido ni garantizan que Supabase no aplique restricciones.

Mediciones de solo lectura:

| Medida | Resultado |
|---|---:|
| Archivos originales de documentos | 226; 360.076.284 bytes |
| Informe de comisiones | 1; 2.753 bytes |
| Tamaño de PostgreSQL medido por SQL | 16.673.939 bytes |
| Almacenamiento medio del ciclo mostrado por el panel | 0,087 GB de 1 GB |
| Tamaño máximo de base mostrado por el panel | 30,47 MB |
| Invocaciones Edge del ciclo | 260.452 de 500.000 |
| Mensajes Realtime | 28.754 de 2.000.000 |
| Pico de conexiones Realtime | 8 de 200 |

El tamaño SQL puntual, máximo mostrado por el panel y almacenamiento medio facturable son medidas distintas; no deben confundirse.

### Origen del tráfico

En el pico del **4 septiembre**, el gráfico diario del panel muestra:

| Servicio | Descarga | Porcentaje de ese día |
|---|---:|---:|
| PostgREST (consultas) | 13,965 GB | 91,6 % |
| Storage | 964,561 MB | 6,2 % |
| Auth | 139,304 MB | 0,9 % |
| Realtime | 127,79 MB | 0,8 % |
| Functions | 80,179 MB | 0,5 % |

El 5 septiembre PostgREST baja a 200,107 MB (97,4 % del tráfico de ese día). Estos porcentajes NO son el desglose de todo el ciclo.

`pg_stat_statements`, acumulado desde 11 agosto, registra **255.674** ejecuciones de una variante de la consulta general de documentos y 31.311 de otra. Dos mediciones de esta auditoría mantuvieron los contadores; no prueba un bucle activo ahora. El contador `rows` de PostgREST corresponde a la respuesta agregada, no al número de documentos descargados.

El historial Git confirma que antes de `e9e219c` (4 septiembre, 20:39 Madrid) existían refrescos cada 15 s en administración y 30 s en conductor. La caída posterior es coherente con esa corrección, aunque no permite atribuir cada byte individualmente. **La causa dominante documentada es releer datos, no duplicar fotos ni llenar el disco.**

## Integridad y enlaces

- 226 documentos, 181 movimientos y 94 registros diarios en el inventario inicial.
- Ningún documento sin archivo ni propietario; ningún movimiento con documento o conductor inexistente.
- Ningún archivo original huérfano en `documents`; ningún duplicado de propietario/huella detectado entre huellas existentes.
- Ningún registro diario duplicado por conductor/fecha.
- Ningún movimiento de un documento de conductor asignado a otro conductor.
- Dos avisos de mantenimiento revisados conservan autor y fecha de creación.
- Todas las nueve tablas públicas revisadas tienen RLS activado.
- Facturación, gasolina, nóminas, comisiones, cálculo semanal y limpieza documental cuentan con pruebas de sus reglas. La nómina no reemplaza la facturación documental.

**Discrepancia pendiente de confirmar:** un documento de facturación tiene fecha 26/08/2023 (también en extracción), pero sus movimientos de 261,22 € y reembolso 0,60 € figuran el 26/08/2022. No se ha alterado ninguna fecha ni importe sin confirmar el justificante. Es un documento con dos movimientos discordantes, no dos facturas.

## Correcciones de esta auditoría

1. El conductor conserva la misma suscripción Realtime al cambiar el calendario. Los manejadores actualizados reciben los cambios sin reconectar.
2. Fallos de red y regreso a la pestaña respetan 60 s mínimos. Se separa el último intento de la última sincronización correcta, para no omitir cambios tras un error.
3. Administración evita duplicar la carga de usuarios cuando llegan juntos foco y visibilidad.
4. Nuevas fotos: miniaturas privadas WebP de hasta 480 px, generadas antes de subir, sin usar transformaciones de pago de Supabase. Original intacto; no se descarga automáticamente como alternativa si falta miniatura. Caché de firmas y de errores durante 60 s; invalidación al borrar y cerrar sesión.
5. El visor ya no pierde la referencia de la nueva ventana por `noopener` antes de poder abrir la URL. Desvincula `opener` inmediatamente y vuelve a comprobar la firma al pulsar, evitando enlaces caducados persistentes.
6. Un fallo al marcar un aviso como revisado ya no aparece falsamente como éxito.
7. El borrado directo de Storage ya no permite saltarse la regla de semana actual. El RPC validado concede permiso temporal de limpieza del original y miniatura; las facturas históricas siguen protegidas. Prueba SQL: conductor sin rol de administrador no puede borrar directamente original ni miniatura existentes; sí limpiar una subida fallida propia de la semana.
8. `private.is_admin()` devuelve `false`, nunca `NULL`, cuando un JWT no incluye rol de aplicación. Evita saltarse comprobaciones `IF NOT` en funciones privilegiadas.
9. El análisis documental exige un token verificado por Supabase y un perfil activo antes de llamar a IA; las peticiones anónimas quedan bloqueadas.
10. La PWA excluye APIs privadas de su caché y reutiliza recursos compilados inmutables. Cada compilación cambia el service worker para que no permanezca instalada una versión antigua con polling.
11. Se reparó la configuración pública local de Supabase, que tenía marcadores `[SENSITIVE]` en vez de valores utilizables. Las claves privadas no se han publicado ni modificado.

## Validación y límites del alcance

Pruebas automatizadas: 78 casos, incluidos autenticación de análisis, cálculos, fechas, borrado, asociaciones, mantenimiento, caché y PWA. Prueba de navegador aislada a 390 × 844 con respuestas simuladas: pantallas principales de administración y conductor, cambio de periodo y observación de 32 s en reposo por rol. Esta prueba no sustituye una carga y borrado reales desde cada teléfono; no se han enviado fotos ficticias a producción ni borrado justificantes para probar.

Pendientes conocidos:

- **Cuota ya consumida:** consultar con Supabase la restricción/gracia o decidir expresamente una ampliación. No se ha contratado nada. El panel tarda hasta una hora en refrescar.
- **Miniaturas históricas:** los 226 originales previos no se han descargado masivamente ni regenerado; mantienen apertura bajo demanda. Regenerarlas requiere una pasada controlada que por sí misma descargaría hasta unos 360 MB. Las nuevas fotos sí generan miniatura.
- **Histórico inicial:** continúa una carga inicial completa necesaria para las gráficas históricas actuales; las reconciliaciones posteriores se limitan a periodo/modificaciones. Para escalar mucho más, conviene separar agregados mensuales y paginación del archivo documental, con pruebas de coherencia antes de sustituirla.
- **Copias de seguridad:** no se encontró tarea de backup en el repositorio, cron Vercel ni extensión `pg_cron` instalada. No se ha demostrado una copia diaria recuperable ni una restauración; GitHub/Vercel no son un backup de documentos de Supabase. Requiere definir destino seguro, retención y prueba de recuperación.
- Asesor de seguridad: protección de contraseñas filtradas desactivada. La tabla privada de permisos temporales tiene RLS sin políticas deliberadamente (ningún acceso directo a clientes). Cinco índices sin uso son avisos informativos, no justifican borrado preventivo.
- La compilación avisa de un paquete JS grande (~1,47 MB sin comprimir). Afecta al arranque móvil en Vercel, no explica el exceso de tráfico de Supabase. No se ha rediseñado la interfaz.

Referencias: [Usage de la organización](https://supabase.com/dashboard/org/ygzczcaktezlglrffxmt/usage), [egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress), [transformaciones solo en planes de pago](https://supabase.com/docs/guides/storage/serving/image-transformations), [seguridad de contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
