import React, { useState } from 'react';

function VentasTienda({ ventas, setVentas, tasas }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [semana, setSemana] = useState('LUNES');
  const [bolivares, setBolivares] = useState('');
  const [tasa, setTasa] = useState(tasas.binance); // Default wendy uses binance/custom rates
  const [efectivoUsd, setEfectivoUsd] = useState('');
  const [zelle, setZelle] = useState('');
  const [cxc, setCxc] = useState('');

  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  const handleRegisterSale = (e) => {
    e.preventDefault();
    const bs = parseFloat(bolivares) || 0;
    const rate = parseFloat(tasa) || 1.0;
    const cash = parseFloat(efectivoUsd) || 0;
    const zl = parseFloat(zelle) || 0;
    const credit = parseFloat(cxc) || 0;

    if (bs === 0 && cash === 0 && zl === 0 && credit === 0) {
      return alert('Debe ingresar al menos un valor de venta.');
    }

    const usd_conv = bs / rate;
    const venta_diaria = usd_conv + cash + zl + credit;
    const venta_real = usd_conv + cash + zl;

    const newSale = {
      id: `venta_${Date.now()}`,
      item: ventas.length + 1,
      semana,
      fecha,
      bolivares: bs,
      tasa: rate,
      dolares_conv: usd_conv,
      efectivo_usd: cash,
      zelle: zl,
      cxc: credit,
      venta_diaria,
      venta_real_tienda: venta_real,
      cuenta_bs: 'banco_bs',
      cuenta_usd: zl > 0 ? 'banco_usd' : 'caja_usd',
    };

    setVentas([newSale, ...ventas]);
    setBolivares('');
    setEfectivoUsd('');
    setZelle('');
    setCxc('');
    alert('Venta de Tienda Wendy registrada con éxito.');
  };

  return (
    <div className="fade-in-up">
      {/* Header */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Carga de Ventas - Almacén Wendy</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Mantenimiento e histórico de ventas diarias consolidadas en tienda.</p>
      </header>

      <section className="grid-3" style={{ alignItems: 'flex-start' }}>
        {/* Register Wendy Sale */}
        <div className="card">
          <h3 className="card-title">🏪 Registrar Venta Almacén</h3>
          <form onSubmit={handleRegisterSale}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Día de la Semana</label>
                <select className="form-control" value={semana} onChange={(e) => setSemana(e.target.value)}>
                  <option value="LUNES">LUNES</option>
                  <option value="MARTES">MARTES</option>
                  <option value="MIERCOLES">MIERCOLES</option>
                  <option value="JUEVES">JUEVES</option>
                  <option value="VIERNES">VIERNES</option>
                  <option value="SABADO">SABADO</option>
                  <option value="DOMINGO">DOMINGO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" required className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ventas en Bs</label>
                <input type="number" step="0.01" className="form-control" placeholder="0.00" value={bolivares} onChange={(e) => setBolivares(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Tasa de Venta</label>
                <input type="number" step="0.01" required className="form-control" value={tasa} onChange={(e) => setTasa(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Efectivo USD ($)</label>
                <input type="number" step="0.01" className="form-control" placeholder="0.00" value={efectivoUsd} onChange={(e) => setEfectivoUsd(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Zelle ($)</label>
                <input type="number" step="0.01" className="form-control" placeholder="0.00" value={zelle} onChange={(e) => setZelle(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Crédito Concedido (CxC)</label>
              <input type="number" step="0.01" className="form-control" placeholder="0.00" value={cxc} onChange={(e) => setCxc(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Registrar Venta Almacén
            </button>
          </form>
        </div>

        {/* History Wendy list */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="card-title">📖 Histórico de Ventas de la Tienda</h3>
          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Ventas Bs</th>
                  <th>Tasa</th>
                  <th style={{ textAlign: 'right' }}>Efectivo $</th>
                  <th style={{ textAlign: 'right' }}>Zelle $</th>
                  <th style={{ textAlign: 'right' }}>Crédito CxC</th>
                  <th style={{ textAlign: 'right' }}>Venta Real</th>
                  <th style={{ textAlign: 'right' }}>Venta Diaria</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.semana}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{v.fecha}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{v.bolivares > 0 ? fmtVES(v.bolivares) : '-'}</td>
                    <td style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-muted)' }}>{v.tasa}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-teal)' }}>{v.efectivo_usd > 0 ? fmtUSD(v.efectivo_usd) : '-'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-purple)' }}>{v.zelle > 0 ? fmtUSD(v.zelle) : '-'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-pending)' }}>{v.cxc > 0 ? fmtUSD(v.cxc) : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtUSD(v.venta_real_tienda)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-income)' }}>{fmtUSD(v.venta_diaria)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VentasTienda;
