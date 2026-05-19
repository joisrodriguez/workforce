require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor saludable' });
});

// Guardar nuevo registro de fallas
app.post('/api/registros', async (req, res) => {
  const { operador, cola, fecha, intervalos } = req.body;

  if (!operador || !cola || !fecha) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos (operador, cola, fecha).' });
  }

  // Filtrar los intervalos fallidos (los que tienen causa seleccionada)
  const fallas = Object.entries(intervalos || {}).filter(([_, causa]) => causa);

  if (fallas.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Debe marcar al menos un intervalo con una causa de fallo para registrar.'
    });
  }

  const client = await pool.connect();
  try {
    // Iniciar transacción
    await client.query('BEGIN');

    // Insertar cabecera de registro
    const insertHeaderQuery = `
      INSERT INTO registros (operador, cola, fecha)
      VALUES ($1, $2, $3)
      RETURNING id, operador, cola, TO_CHAR(fecha, 'YYYY-MM-DD') as fecha_fmt;
    `;
    const headerResult = await client.query(insertHeaderQuery, [operador, cola, fecha]);
    const registroId = headerResult.rows[0].id;

    // Insertar cada intervalo fallido
    const insertDetailQuery = `
      INSERT INTO intervalos_fallidos (registro_id, hora, causa)
      VALUES ($1, $2, $3);
    `;
    for (const [hora, causa] of fallas) {
      await client.query(insertDetailQuery, [registroId, hora, causa]);
    }

    // Confirmar transacción
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: registroId,
        operador: headerResult.rows[0].operador,
        cola: headerResult.rows[0].cola,
        fecha: headerResult.rows[0].fecha_fmt,
        fallidosCount: fallas.length
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar registro:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor al procesar el registro.' });
  } finally {
    client.release();
  }
});

// Obtener historial de registros con su detalle
app.get('/api/registros', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id, 
        r.operador, 
        r.cola, 
        TO_CHAR(r.fecha, 'YYYY-MM-DD') as fecha,
        r.creado_en,
        COALESCE(
          json_agg(
            json_build_object('hora', i.hora, 'causa', i.causa)
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'
        ) as detalles
      FROM registros r
      LEFT JOIN intervalos_fallidos i ON r.id = i.registro_id
      GROUP BY r.id
      ORDER BY r.fecha DESC, r.creado_en DESC
      LIMIT 50;
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ success: false, error: 'Error al consultar historial.' });
  }
});

// Inicializar BD y arrancar servidor
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor de Seguimiento NS escuchando en puerto ${PORT}`);
  });
});
