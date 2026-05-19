import React, { useState, useEffect } from 'react';

// ── CONFIGURACIÓN DE LISTAS IDÉNTICAS AL HTML ORIGINAL ──────────────────────
const COLAS = {
  AT: [
    'VQ_FALABELLA_SAC_ATENTO_PE',
    'VQ_FCOM_ATENTO_WSP_CH',
    'VQ_FCOM_SAC_ATENTO_CH',
    'VQ_FCOM_SAC_ATENTO_CO',
    'VQ_FCOM_SAC_ATENTO_PE',
    'VQ_FCOM_WSP_DEVOFFLINE_CO',
    'VQ_FCOM_WSP_DEVOFFLINE_PE',
    'VQ_FCOM_WSP_SAC_CO',
    'VQ_FCOM_WSP_SAC_PE',
    'VQ_SODCOM_ATENTO_WSP_SAC_CH',
    'VQ_SODCOM_SAC_ATENTO_CH',
    'VQ_SODCOM_SAC_PE',
    'VQ_SODCOM_WSP_SAC_PE',
    'VQ_SODIMAC_SAC_AR',
    'VQ_SODIMAC_SAC_UY',
    'VQ_SODIMAC_SERVICIOS_ATENTO_PE',
    'VQ_SODIMAC_VENTAS_AR',
    'VQ_SODIMAC_VENTAS_UY',
    'VQ_SODIMAC_WSP_HSM_BIENVENIDA_OPERADOR_AR/UY',
    'VQ_SODIMAC_WSP_HSM_CLIENTE_HOGAR_AR/UY',
    'VQ_SODIMAC_WSP_SAC_AR/UY',
    'VQ_TOTTUS_SAC_ATENTO_CH',
    'VQ_TOTTUS_SAC_ATENTO_PE',
    'VQ_TOTTUS_SAC_OPC3_ATENTO_CH',
    'VQ_TOTTUS_WSP_SAC_CH',
    'VQ_TOTTUS_WSP_SAC_PE'
  ],
  IH: [
    'VQ_DEVOFFLINE_FCOM_WSP_AG_CH',
    'VQ_DEVOFFLINE_FCOM_WSP_AG_CO',
    'VQ_FALABELLA_SAC_WEBHELP_CO',
    'VQ_FALABELLA_TIENDAS_CONNECT_NOVIOS_CH',
    'VQ_FCOM_SAC_INHOUSE_CH',
    'VQ_FCOM_SAC_INHOUSE_CO',
    'VQ_FCOM_WSP_SAC_CO',
    'VQ_SODCOM_SAC_INHOUSE_CH',
    'VQ_SODIMAC_OZOM_CH',
    'VQ_SODIMAC_SAC_INHOUSE_CH',
    'VQ_SODIMAC_UNIFICAR_CANALES_DE_ATENCION_ASESORIAC_WSP_CH',
    'VQ_SODIMAC_UNIFICAR_CANALES_DE_ATENCION_COMPRAR_WSP_CH',
    'VQ_SODIMAC_UNIFICAR_CANALES_DE_ATENCION_HERRAMIENTAS_WSP_CH',
    'VQ_SODIMAC_VENTA_ARMADO_CH',
    'VQ_SODIMAC_VENTA_OUTBOUND_CH',
    'VQ_SODIMAC_VENTA_TELEFONICA_CE_CH',
    'VQ_SODIMAC_VENTA_TELEFONICA_CH',
    'VQ_SODIMAC_VENTA_TELEFONICA_ESPECIALISTA_CH',
    'VQ_SODIMAC_VENTA_TELEFONICA_PROYECTO_CH',
    'VQ_SODIMAC_WSP_SAC_CH'
  ]
};

const HORAS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
];

const CAUSAS = [
  'Ausentismo',
  'Caída de aplicativos',
  'Falla técnica (Internet)',
  'Picos de interacciones',
  'Retardos',
  'TMO elevados'
];

// Obtener fecha de hoy en formato local YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  // ── ESTADO DEL FORMULARIO ─────────────────────────────────────────────────
  const [operador, setOperador] = useState('');
  const [cola, setCola] = useState('');
  const [fecha, setFecha] = useState(getTodayDateString());
  const [intervalos, setIntervalos] = useState(
    HORAS.reduce((acc, h) => ({ ...acc, [h]: '' }), {})
  );

  // ── ESTADO DE LA APLICACIÓN ──────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // ── EFECTOS ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchHistorial();
  }, []);

  // Limpiar cola si cambia operador
  const handleOperadorChange = (val) => {
    setOperador(val);
    setCola('');
  };

  // Cambiar causa en intervalo horario
  const handleCausaChange = (hora, causa) => {
    setIntervalos(prev => ({
      ...prev,
      [hora]: causa
    }));
  };

  // Cantidad de fallos marcados
  const failedCount = Object.values(intervalos).filter(v => v).length;

  // ── TOAST MANAGEMENT ──────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // ── API CALLS ─────────────────────────────────────────────────────────────
  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      // Usando el proxy configurado en Vite (/api/registros -> backend:5000)
      const res = await fetch('/api/registros');
      const data = await res.json();
      if (data.success) {
        setHistorial(data.data);
      } else {
        showToast('Error al cargar historial: ' + data.error, 'error');
      }
    } catch (err) {
      console.error(err);
      // No alertar demasiado si es local sin docker corriendo, pero informar amigablemente
      showToast('No se pudo conectar al servidor backend. Verifica la conexión.', 'error');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();

    if (!operador || !cola || !fecha) {
      showToast('Completa Operador, Cola y Fecha antes de guardar.', 'error');
      return;
    }

    if (failedCount === 0) {
      showToast('No marcaste ningún intervalo fallido. Si todos cumplieron NS no hay nada que registrar.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operador, cola, fecha, intervalos })
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Registro guardado exitosamente — ${cola}`, 'success');
        resetForm();
        fetchHistorial();
      } else {
        showToast('Error al guardar: ' + (data.error || 'Desconocido'), 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de red al guardar el registro. Inténtalo de nuevo.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOperador('');
    setCola('');
    setFecha(getTodayDateString());
    setIntervalos(HORAS.reduce((acc, h) => ({ ...acc, [h]: '' }), {}));
  };

  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div className="logo">FALABELLA<span>.</span></div>
        <div className="header-title">Seguimiento Nivel de Servicio</div>
      </div>

      <div className="container">
        {/* NOTIFICACIONES TOAST */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span>{t.type === 'success' ? '⚡' : '⚠️'}</span>
              <div>{t.message}</div>
            </div>
          ))}
        </div>

        {/* Barra decorativa */}
        <div className="filtros-bar">
          <span><span className="icon">▼</span> REGISTRO DE FALLOS NS</span>
          <span style={{ fontSize: '11px', color: '#5a6a85', fontWeight: '400', letterSpacing: '0.5px' }}>
            React + PostgreSQL Engine
          </span>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={submitForm}>
          {/* Identificación */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Identificación</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Operador</label>
                <div className="select-wrapper">
                  <select 
                    id="operador" 
                    value={operador} 
                    onChange={(e) => handleOperadorChange(e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    <option value="AT">Atento (AT)</option>
                    <option value="IH">InHouse (IH)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Cola</label>
                <div className="select-wrapper">
                  <select 
                    id="cola" 
                    value={cola} 
                    onChange={(e) => setCola(e.target.value)}
                    disabled={!operador}
                  >
                    {!operador ? (
                      <option value="">— Primero selecciona el operador —</option>
                    ) : (
                      <>
                        <option value="">Selecciona cola...</option>
                        {COLAS[operador].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fecha</label>
                <input 
                  type="date" 
                  id="fecha" 
                  value={fecha} 
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Intervalos */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Intervalos horarios</span>
              <span className={`counter ${failedCount > 0 ? 'visible' : ''}`}>
                {failedCount} {failedCount === 1 ? 'fallido' : 'fallidos'}
              </span>
            </div>
            <p className="grid-hint">Deja en blanco si el intervalo cumplió el NS. Selecciona la causa si no cumplió.</p>
            
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Causa del fallo</th>
                </tr>
              </thead>
              <tbody>
                {HORAS.map(hora => {
                  const valorCausa = intervalos[hora] || '';
                  const esFallido = !!valorCausa;
                  
                  return (
                    <tr key={hora} className={esFallido ? 'failed' : ''}>
                      <td>{hora}</td>
                      <td>
                        <select 
                          className={`causa-select ${esFallido ? 'selected' : ''}`}
                          value={valorCausa}
                          onChange={(e) => handleCausaChange(hora, e.target.value)}
                        >
                          <option value="">— Cumplió NS —</option>
                          {CAUSAS.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botón de Guardado */}
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isSubmitting || !operador || !cola || !fecha || failedCount === 0}
          >
            {isSubmitting ? 'Guardando registro...' : 'Guardar registro'}
          </button>
        </form>

        <div style={{ margin: '40px 0' }}></div>

        {/* Panel Historial (Panel Vivo) */}
        <div className="card">
          <div className="card-header historial-title-row">
            <span className="card-title">Historial de registros recientes</span>
            <button className="refresh-btn" onClick={fetchHistorial} disabled={loadingHistorial}>
              {loadingHistorial ? 'Cargando...' : '🔄 Actualizar'}
            </button>
          </div>

          <div className="historial-list">
            {historial.length === 0 ? (
              <div className="empty-state">
                {loadingHistorial ? 'Conectando al servidor...' : 'No hay registros guardados en la base de datos.'}
              </div>
            ) : (
              historial.map(item => (
                <div key={item.id} className="historial-item">
                  <div className="historial-item-header">
                    <div className="historial-item-info">
                      <span className={`tag-op ${item.operador.toLowerCase()}`}>
                        {item.operador === 'AT' ? 'Atento' : 'InHouse'}
                      </span>
                      <span className="historial-cola" title={item.cola}>{item.cola}</span>
                    </div>
                    <span className="historial-fecha">{item.fecha}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="historial-chips">
                      {item.detalles.map((det, idx) => (
                        <div key={idx} className="chip-fallo">
                          <span>{det.hora}:</span> {det.causa}
                        </div>
                      ))}
                    </div>
                    <span className="historial-fallidos-pill">
                      {item.detalles.length} {item.detalles.length === 1 ? 'fallo' : 'fallos'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
