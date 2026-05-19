# Seguimiento Nivel de Servicio - Falabella

Este proyecto recrea el formulario de Registro de Fallos de Nivel de Servicio (NS) de Falabella en una aplicación web interactiva moderna. Está construido con **React (Vite)**, respaldado por un servidor **Node.js (Express)** y una base de datos **PostgreSQL**, todo empaquetado en **Docker** mediante **Docker Compose** para un despliegue inmediato.

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose.
- [Docker Compose](https://docs.docker.com/compose/) (viene incluido por defecto con Docker Desktop).

---

##  Cómo Levantar la Aplicación en Local
1. Abre una terminal (PowerShell, Command Prompt o terminal Git) en la carpeta raíz donde se encuentra el proyecto:
   `C:\Users\usuario\formulario-seguimiento-ns`

2. Ejecuta el comando para compilar e iniciar todos los servicios:
   ```bash
   docker compose up --build
   ```

3. Docker descargará las imágenes correspondientes, creará la base de datos PostgreSQL, construirá el servidor Backend de Express y compilará la aplicación Frontend de React.

4. Una vez levantado, abre tu navegador favorito y accede a:
   * **Frontend (Aplicación Principal)**: [http://localhost:3000](http://localhost:3000)
   * **Backend API (Prueba de salud)**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Arquitectura y Servicios

El entorno de Docker Compose levanta tres servicios conectados en red:

1. **`db` (PostgreSQL 15)**:
   - Base de datos relacional persistida a través de un volumen de Docker (`pgdata`).
   - Se auto-inicializa con el usuario y contraseñas por defecto detalladas en el archivo `docker-compose.yml`.
2. **`backend` (Node.js/Express)**:
   - Expone la API RESTful.
   - Detecta si la base de datos ya está lista (si no, espera con auto-reintentos progresivos).
   - Crea automáticamente las tablas `registros` e `intervalos_fallidos` la primera vez que se inicia.
3. **`frontend` (React + Nginx)**:
   - Compila la SPA de React en modo producción.
   - Sirve los recursos estáticos mediante un servidor ligero **Nginx**.
   - Integra un proxy inverso de Nginx para redirigir las solicitudes a `/api` hacia el contenedor del backend automáticamente.

---

## Detalle de Endpoints de la API

* **`POST /api/registros`**: Guarda el registro del formulario.
  - *Payload*:
    ```json
    {
      "operador": "AT",
      "cola": "VQ_FALABELLA_SAC_ATENTO_PE",
      "fecha": "2026-05-19",
      "intervalos": {
        "7:00 AM": "Ausentismo",
        "8:00 AM": "",
        "9:00 AM": "Caída de aplicativos"
      }
    }
    ```
* **`GET /api/registros`**: Recupera el historial de registros con sus detalles de horas e intervalos de fallas asociados, ordenados por fecha de registro en orden descendente.

---

## Estructura de Tablas en la Base de Datos

### Tabla `registros`
Almacena la cabecera identificativa de cada reporte de fallos.
- `id` (SERIAL, PRIMARY KEY)
- `operador` (VARCHAR(10)) - *'AT' para Atento o 'IH' para InHouse*
- `cola` (VARCHAR(100)) - *Nombre de la cola telefónica/canal*
- `fecha` (DATE) - *Fecha registrada*
- `creado_en` (TIMESTAMP)

### Tabla `intervalos_fallidos`
Almacena el detalle por hora de cada fallo asociado a una cabecera.
- `id` (SERIAL, PRIMARY KEY)
- `registro_id` (INT, FOREIGN KEY referencing `registros(id) ON DELETE CASCADE`)
- `hora` (VARCHAR(15)) - *Ej: "8:00 AM"*
- `causa` (VARCHAR(100)) - *Ej: "Ausentismo"*
