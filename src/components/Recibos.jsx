import React, { useState } from 'react';

// Number to words in Spanish helper for premium feel
const numeroALetras = (num) => {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenasDiez = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SIETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num === 100) return 'CIEN';

  let n = Math.floor(num);
  let letras = '';

  if (n >= 1000) {
    const miles = Math.floor(n / 1000);
    letras += (miles === 1 ? 'MIL ' : numeroALetras(miles) + ' MIL ');
    n %= 1000;
  }

  if (n >= 100) {
    letras += centenas[Math.floor(n / 100)] + ' ';
    n %= 100;
  }

  if (n >= 20) {
    const dec = Math.floor(n / 10);
    const uni = n % 10;
    if (uni === 0) letras += decenasDiez[dec];
    else letras += decenasDiez[dec] + ' Y ' + unidades[uni];
  } else if (n >= 10) {
    letras += decenas[n - 10];
  } else if (n > 0) {
    letras += unidades[n];
  }

  // Decimals
  const cents = Math.round((num - Math.floor(num)) * 100);
  const decimalsStr = cents > 0 ? ` CON ${cents}/100` : ' CON 00/100';

  return letras.trim() + decimalsStr;
};

function Recibos({ abonos }) {
  const [selectedAbonoId, setSelectedAbonoId] = useState(abonos[0]?.id || '');

  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  const selectedAbono = abonos.find(a => a.id === selectedAbonoId) || abonos[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in-up">
      {/* Title (Hidden in print) */}
      <header className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Generador de Recibos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Seleccione y emita un recibo de pago oficial imprimible para cualquier abono.</p>
        </div>

        {abonos.length > 0 && (
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨️ Imprimir Recibo
          </button>
        )}
      </header>

      {abonos.length > 0 ? (
        <section className="grid-3" style={{ alignItems: 'flex-start' }}>
          {/* Abonos Selector Panel (Hidden in print) */}
          <div className="card" style={{ gridColumn: 'span 1' }}>
            <h3 className="card-title">🔍 Seleccionar Abono</h3>
            <div className="form-group">
              <label className="form-label">Lista de Abonos Recientes</label>
              <select className="form-control" value={selectedAbonoId} onChange={(e) => setSelectedAbonoId(e.target.value)}>
                {abonos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fecha} - {a.vendedor} ({fmtUSD(a.monto_total_usd)})
                  </option>
                ))}
              </select>
            </div>

            {selectedAbono && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div><strong>Cobrado el:</strong> {selectedAbono.fecha}</div>
                <div><strong>Vendedor:</strong> {selectedAbono.vendedor}</div>
                <div>
                  <strong>Monto en moneda original:</strong>
                  {selectedAbono.efectivo_usd > 0 && ` Dólares en Efectivo ($${selectedAbono.efectivo_usd})`}
                  {selectedAbono.zelle > 0 && ` Zelle ($${selectedAbono.zelle})`}
                  {selectedAbono.bolivares > 0 && ` Bolívares (${fmtVES(selectedAbono.bolivares)} @ ${selectedAbono.tasa})`}
                </div>
                <div><strong>Imputado a cuenta:</strong> {selectedAbono.cuenta.toUpperCase()}</div>
              </div>
            )}
          </div>

          {/* Printable Receipt Layout (Standard Card in app, print-optimized in print) */}
          {selectedAbono && (
            <div className="card" style={{ gridColumn: 'span 2', padding: '2.5rem', backgroundColor: 'white', color: '#1a1a2e', position: 'relative', overflow: 'hidden', border: '1px dashed #cbd5e1' }}>
              
              {/* Receipt Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #334155', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', color: '#0f172a', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>ALMACEN WENDY</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Control de Cuentas y Caja</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ef4444' }}>RECIBO N° {String(selectedAbono.item).padStart(4, '0')}</div>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>Fecha: {selectedAbono.fecha}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>VALOR:</span>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', fontFamily: 'var(--font-heading)' }}>
                  {selectedAbono.bolivares > 0 ? fmtVES(selectedAbono.bolivares) : fmtUSD(selectedAbono.monto_total_usd)}
                </span>
              </div>

              {/* Receipt Body fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.95rem', color: '#334155' }}>
                <div style={{ display: 'flex', borderBottom: '1px dotted #cbd5e1', paddingBottom: '0.25rem' }}>
                  <span style={{ width: '180px', fontWeight: '700', color: '#64748b' }}>QUIEN RECIBE SR.(A):</span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedAbono.vendedor.toUpperCase()}</span>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px dotted #cbd5e1', paddingBottom: '0.25rem' }}>
                  <span style={{ width: '180px', fontWeight: '700', color: '#64748b' }}>LA CANTIDAD DE:</span>
                  <span style={{ color: '#0f172a', fontSize: '0.85rem', fontWeight: '600' }}>
                    {numeroALetras(selectedAbono.bolivares > 0 ? selectedAbono.bolivares : selectedAbono.monto_total_usd)}
                    {selectedAbono.bolivares > 0 ? ' BOLIVARES CON TODO' : ' DOLARES AMERICANOS'}
                  </span>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px dotted #cbd5e1', paddingBottom: '0.25rem' }}>
                  <span style={{ width: '180px', fontWeight: '700', color: '#64748b' }}>POR CONCEPTO DE:</span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>
                    ABONO DE CUENTA DE CRÉDITO PENDIENTE
                    {selectedAbono.zelle > 0 && ' (PAGO VIA ZELLE / BANCO)'}
                    {selectedAbono.efectivo_usd > 0 && ' (PAGO VIA EFECTIVO DOLAR)'}
                    {selectedAbono.bolivares > 0 && ' (PAGO VIA PAGO MOVIL / VES)'}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4.5rem', gap: '4rem' }}>
                <div style={{ flex: 1, textAlign: 'center', borderTop: '1px solid #94a3b8', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>ENTREGUÉ CONFORME</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginTop: '0.25rem' }}>{selectedAbono.vendedor}</div>
                </div>

                <div style={{ flex: 1, textAlign: 'center', borderTop: '1px solid #94a3b8', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>RECIBÍ CONFORME</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginTop: '0.25rem' }}>Wendy / Almacén</div>
                </div>
              </div>

              {/* Decorative Watermark */}
              <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', fontSize: '8rem', color: '#f1f5f9', zIndex: 0, fontWeight: '900', pointerEvents: 'none', userSelect: 'none' }}>
                W
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Aún no se han registrado abonos para emitir recibos de pago.</p>
        </div>
      )}
    </div>
  );
}

export default Recibos;
