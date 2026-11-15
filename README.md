# EDÉN

**Oficina virtual para la gestión integral de empresas de instalación y servicios técnicos.**

EDÉN centraliza clientes, solicitudes de cotización, costos, cotizaciones, proyectos, presupuestos, gastos, tareas, documentos y reportes en una sola aplicación. El objetivo es reducir el trabajo disperso entre hojas de cálculo, mensajes y documentos, manteniendo la trazabilidad desde la primera solicitud hasta la ejecución del proyecto.

El repositorio incluye:

- `mock.html`: prototipo navegable y autocontenido de todo el producto.
- SPA de producción con React 18, Vite, JavaScript y CSS propio.
- API REST con FastAPI, autenticación JWT y SQLAlchemy 2.0.
- PostgreSQL 16 como persistencia principal.
- SQLite como respaldo automático si PostgreSQL no está disponible.
- Nginx para servir la SPA y exponer la API bajo el mismo dominio.
- Despliegue coordinado con Docker Compose, preparado para Dokploy.

> Los datos, importes, clientes y documentos incluidos inicialmente son ficticios y sirven únicamente para demostración.

## 1. Alcance del MVP

### Módulos incluidos

- **Acceso y seguridad**
  - Registro e inicio de sesión.
  - Contraseñas cifradas con bcrypt.
  - Tokens JWT.
  - Guardia de rutas en el frontend.
  - Rutas de negocio protegidas en la API.
  - Perfiles de demostración de administrador y operador.

- **Panel principal**
  - Resumen de solicitudes, cotizaciones, proyectos, gastos y tareas.
  - Indicadores y actividad reciente.
  - Accesos directos a los módulos principales.

- **Clientes y solicitudes**
  - Registro y consulta de clientes.
  - Datos de contacto y seguimiento.
  - Solicitudes de cotización con estado y relación con el cliente.

- **Catálogo de costos**
  - Conceptos reutilizables.
  - Costos base y vigencia.
  - Base para construir partidas de cotización.

- **Cotizaciones y presupuestos**
  - Partidas, cantidades, costos, márgenes e impuestos.
  - Totales calculados en servidor.
  - Seguimiento del estado de cada cotización.
  - Relación con clientes, solicitudes y proyectos.

- **Proyectos**
  - Proyectos originados desde una cotización.
  - Presupuesto, estado y avance operativo.
  - Relación con gastos, tareas y documentos.

- **Control de gastos**
  - Gastos por proyecto y partida.
  - Categorías, importes, fechas y comprobantes de referencia.
  - Comparación entre presupuesto y gasto registrado.

- **Coordinación operativa**
  - Tareas, responsables, prioridades, fechas y estados.
  - Vista de trabajo pendiente y actividad del equipo.

- **Documentos**
  - Documentos profesionales asociados a la operación.
  - Contenido listo para consulta, impresión o evolución a PDF corporativo.

- **Comunicaciones**
  - Registro de comunicaciones y referencias de canal.
  - Preparación del modelo para una futura integración con WhatsApp Business API.

- **Reportes y configuración**
  - Resumen operativo y financiero.
  - Parámetros generales de la empresa, moneda e impuestos.

### Fuera del alcance automático actual

- Envío real de mensajes por WhatsApp.
- Verificación telefónica de clientes mediante WhatsApp o SMS.
- Generación de PDF con identidad corporativa definitiva.
- Envío de correo electrónico mediante SMTP.
- Pasarelas de pago.
- Facturación fiscal certificada.
- Integración con sistemas contables externos.

Estas funciones requieren credenciales, validación funcional y decisiones de negocio adicionales. La interfaz puede mostrar flujos de demostración, pero no debe interpretarse como una integración externa activa.

## 2. Arquitectura

```text
Navegador
   │
   ├── React SPA / rutas protegidas
   │
   ▼
Nginx — servicio web
   ├── Archivos estáticos de React
   ├── try_files para navegación SPA
   └── Proxy de /api/
           │
           ▼
       FastAPI — servicio api
           ├── Autenticación JWT
           ├── Reglas de negocio
           ├── SQLAlchemy 2.0
           └── Cálculo de totales en servidor
                   │
                   ├── PostgreSQL 16 — persistencia principal
                   └── SQLite ./app.db — respaldo automático
```

Docker Compose declara tres servicios:

| Servicio | Función | Puerto |
|---|---|---|
| `web` | Construye la SPA y la sirve mediante Nginx | `8080:80` |
| `api` | API FastAPI con Uvicorn | `8000`, interno |
| `db` | PostgreSQL 16 Alpine | `5432`, interno |

La API no necesita exponerse públicamente de forma independiente: el navegador accede a ella mediante Nginx.

## 3. Estructura del repositorio

```text
.
├── README.md
├── docker-compose.yml
├── index.html
├── mock.html
├── nginx.conf
├── package.json
├── vite.config.js
├── web.Dockerfile
├── src
│   ├── App.jsx
│   ├── main.jsx
│   └── style.css
└── api
    ├── Dockerfile
    ├── requirements.txt
    └── app
        └── main.py
```

## 4. Prototipo navegable

`mock.html` es el recorrido funcional completo del producto antes de la SPA. Está construido únicamente con HTML, CSS y JavaScript, sin React, frameworks, CDN ni proceso de compilación.

Para abrirlo:

1. Localiza `mock.html` en la raíz del proyecto.
2. Ábrelo directamente en un navegador moderno.
3. Recorre login, registro, panel y todos los módulos mediante la navegación interna.

El prototipo incluye datos demo y permite revisar los flujos de punta a punta. No guarda cambios en PostgreSQL, no emite JWT reales y no envía comunicaciones externas.

## 5. Puesta en marcha con Docker Compose

### Requisitos

- Docker actualizado.
- Docker Compose con soporte para el comando `docker compose`.
- Puerto `8080` libre en la máquina.

### Arranque

Desde la raíz del repositorio:

```bash
export AUTH_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"
docker compose up --build -d
```

También puede crearse un fichero `.env` local, no destinado a control de versiones:

```env
AUTH_SECRET=sustituir-por-un-secreto-largo-y-aleatorio
```

Después:

```bash
docker compose up --build -d
docker compose ps
```

Para revisar el arranque:

```bash
docker compose logs -f api
```

### Direcciones locales

| Recurso | URL |
|---|---|
| Aplicación | http://localhost:8080 |
| Comprobación de salud | http://localhost:8080/api/health |
| Documentación interactiva | http://localhost:8080/api/docs |
| Esquema OpenAPI | http://localhost:8080/api/openapi.json |

### Detener la aplicación

```bash
docker compose down
```

Para borrar también los datos y volver a una instalación limpia:

```bash
docker compose down -v
```

> `down -v` elimina el volumen de PostgreSQL. No debe utilizarse en un entorno con información que se quiera conservar.

## 6. Usuarios de prueba

En una base nueva se preparan los siguientes accesos de demostración:

| Perfil | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin@eden.local` | `Admin123!` |
| Operador | `operador@eden.local` | `Operador123!` |

El campo `username` del formulario de autenticación admite el correo completo del usuario.

También puede probarse el registro desde la pantalla correspondiente. En producción se deben cambiar o retirar las credenciales demo, restringir el registro según la política de la organización y utilizar contraseñas únicas.

## 7. Autenticación y comportamiento del frontend

La SPA guarda el JWT en `localStorage` después del inicio de sesión. Cada petición autenticada añade:

```http
Authorization: Bearer <token>
```

Las rutas privadas comprueban la sesión antes de mostrar el panel. Al cerrar sesión se eliminan las credenciales locales y se vuelve a la pantalla de acceso.

### Formato obligatorio de login y registro

`/api/auth/login` y `/api/auth/register` reciben:

```text
application/x-www-form-urlencoded
```

Campos:

- `username`
- `password`

El frontend utiliza `URLSearchParams`; no envía estos formularios como JSON.

Ejemplo de inicio de sesión:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=admin@eden.local" \
  --data-urlencode "password=Admin123!"
```

La respuesta contiene el token de acceso y su tipo:

```json
{
  "access_token": "TOKEN_JWT",
  "token_type": "bearer"
}
```

Consulta del usuario autenticado:

```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer TOKEN_JWT"
```

Ejemplo de registro:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "username=nuevo@eden.local" \
  --data-urlencode "password=UnaClaveSegura123!"
```

## 8. Contrato de API

Todas las rutas de aplicación se consumen bajo `/api`. El frontend no mezcla llamadas con y sin prefijo.

### Rutas públicas

| Método | Ruta | Finalidad |
|---|---|---|
| `GET` | `/api/health` | Comprobación de disponibilidad |
| `POST` | `/api/auth/register` | Registro mediante formulario |
| `POST` | `/api/auth/login` | Obtención del JWT mediante formulario |

### Sesión y operación protegida

| Método | Ruta | Finalidad |
|---|---|---|
| `GET` | `/api/auth/me` | Usuario autenticado |
| `GET`, `POST` | `/api/clientes` | Listar y crear clientes |
| `GET`, `PUT`, `DELETE` | `/api/clientes/{id}` | Consultar, actualizar o retirar un cliente |
| `GET`, `POST` | `/api/solicitudes` | Gestionar solicitudes |
| `GET`, `PUT`, `DELETE` | `/api/solicitudes/{id}` | Operar sobre una solicitud |
| `GET`, `POST` | `/api/costos` | Gestionar el catálogo de costos |
| `GET`, `PUT`, `DELETE` | `/api/costos/{id}` | Operar sobre un costo |
| `GET`, `POST` | `/api/cotizaciones` | Gestionar cotizaciones |
| `GET`, `PUT`, `DELETE` | `/api/cotizaciones/{id}` | Operar sobre una cotización |
| `GET`, `POST` | `/api/proyectos` | Gestionar proyectos |
| `GET`, `PUT`, `DELETE` | `/api/proyectos/{id}` | Operar sobre un proyecto |
| `GET`, `POST` | `/api/gastos` | Registrar y consultar gastos |
| `GET`, `PUT`, `DELETE` | `/api/gastos/{id}` | Operar sobre un gasto |
| `GET`, `POST` | `/api/tareas` | Coordinar tareas |
| `GET`, `PUT`, `DELETE` | `/api/tareas/{id}` | Operar sobre una tarea |
| `GET`, `POST` | `/api/documentos` | Gestionar documentos |
| `GET`, `PUT`, `DELETE` | `/api/documentos/{id}` | Operar sobre un documento |
| `GET`, `POST` | `/api/mensajes` | Consultar o registrar comunicaciones |
| `GET` | `/api/reportes/resumen` | Indicadores del panel y reportes |
| `GET`, `PUT` | `/api/configuracion` | Consultar o actualizar la configuración |

La documentación OpenAPI es la referencia para los campos admitidos por cada modelo. Las operaciones de negocio requieren un JWT válido; las rutas públicas se limitan a salud y autenticación.

### Reglas importantes

- Los totales económicos relevantes se derivan en servidor, no se aceptan como un total arbitrario del navegador.
- Las cotizaciones y proyectos conservan sus relaciones con clientes y solicitudes.
- Los estados cerrados no deben reabrirse o modificarse sin pasar por el flujo previsto.
- Los registros de comunicaciones no implican entrega real en WhatsApp.
- Los reportes dependen de los datos almacenados; los valores demo no constituyen un baseline empresarial.

## 9. Variables de entorno

| Variable | Valor o comportamiento |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg://studio:studio@db:5432/producto` en Compose |
| `AUTH_SECRET` | Clave de firma JWT; debe ser larga, aleatoria y privada |

Credenciales internas de PostgreSQL en el entorno Compose:

```text
Base de datos: producto
Usuario: studio
Contraseña: studio
Host interno: db
Puerto interno: 5432
```

Estas credenciales son adecuadas para desarrollo local. Para un despliegue real deben sustituirse y protegerse mediante el gestor de secretos de la plataforma.

## 10. Persistencia y respaldo SQLite

Al arrancar, la API intenta utilizar `DATABASE_URL`. Si la conexión, el driver o la inicialización de PostgreSQL fallan por cualquier motivo, captura la excepción y utiliza:

```text
./app.db
```

Esto evita que la aplicación deje de arrancar por una indisponibilidad temporal de PostgreSQL.

Consideraciones:

- El respaldo SQLite está pensado para desarrollo, demostración y continuidad básica.
- Los datos de SQLite y PostgreSQL no se sincronizan automáticamente.
- En producción debe revisarse el log de la API para confirmar qué motor está activo.
- Un fallo de PostgreSQL no debe pasar inadvertido por el simple hecho de que `/api/health` responda.
- PostgreSQL utiliza un volumen persistente; el fichero SQLite depende del almacenamiento del contenedor o proceso local.

## 11. Datos de ejemplo en la SPA

Cuando una petición a la API falla, el frontend puede mostrar datos de ejemplo como respaldo visual. Este mecanismo permite revisar la interfaz aunque el servicio todavía no esté disponible.

No equivale a una operación real:

- Los cambios locales pueden perderse al recargar.
- No sustituyen la autentic