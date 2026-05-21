const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/seguimiento_ns'
});

async function initDb() {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Intentando conectar a la base de datos PostgreSQL...');
      const client = await pool.connect();
      console.log('Conexión exitosa a PostgreSQL. Inicializando tablas si no existen...');

      // Crear tabla registros
      await client.query(`
        CREATE TABLE IF NOT EXISTS registros (
          id SERIAL PRIMARY KEY,
          operador VARCHAR(10) NOT NULL,
          cola VARCHAR(100) NOT NULL,
          fecha DATE NOT NULL,
          observaciones TEXT,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Migración: agregar columna si la tabla ya existía sin ella
      await client.query(`
        ALTER TABLE registros ADD COLUMN IF NOT EXISTS observaciones TEXT;
      `);

      // Crear tabla intervalos_fallidos
      await client.query(`
        CREATE TABLE IF NOT EXISTS intervalos_fallidos (
          id SERIAL PRIMARY KEY,
          registro_id INT REFERENCES registros(id) ON DELETE CASCADE,
          hora VARCHAR(15) NOT NULL,
          causa VARCHAR(100) NOT NULL,
          UNIQUE(registro_id, hora)
        );
      `);

      console.log('Estructura de base de datos verificada y lista.');
      client.release();
      break;
    } catch (err) {
      console.error('Error al conectar a la base de datos:', err.message);
      retries -= 1;
      if (retries === 0) {
        console.error('No se pudo conectar a la base de datos tras varios intentos. Saliendo...');
        process.exit(1);
      }
      console.log('Reintentando conexión en 5 segundos...');
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

module.exports = {
  pool,
  initDb
};
