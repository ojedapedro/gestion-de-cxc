import React, { useState } from 'react';

function Egresos({ egresos, setEgresos, tasas }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [nota, setNota] = useState('');
  const [moneda, setMoneda] = useState('usd'); // usd or ves
  const [monto, setMonto] = useState('');
  const [detalle, setDetalle] = useState('');
  const [cuenta, setCuenta] = useState('caja_usd');
  const [filtroCuenta, setFiltroCuenta] = useState('all');
  const [busqueda, setBusqueda] = useState('');

  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  const handleCurrencyChange = (curr) => {
    setMoneda(curr);
    if (curr === 'usd') {
      setCuenta('caja_usd');
    } else {
      setCuenta('banco_bs');
    }
  };

  const handleRegisterExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(monto);
    if (!amt || amt <= 0) return alert('Por favor ingrese un monto de gasto válido.');
    if (!detalle.trim()) return alert('Por favor detalle el gasto.');

    let bolivares = 0;
    let dolares = 0;

    if (moneda === 'usd') {
      dolares = amt;
    } else {
      bolivares = amt;
    }

    const newExpense = {
      id: `gasto_${Date.now()}`,
      item: egresos.length + 1,
      fecha,
      nota: nota ? parseInt(nota) : null,
      bolivares,
      dolares,
      detalle: detalle.trim(),
      cuenta,
    };

    setEgresos([newExpense, ...egresos]);
    setNota('');
    setMonto('');
    setDetalle('');
    alert('Gasto registrado e imputado a la cuenta seleccionada.');
  };

  // Filter and search logic
  const filteredEgresos = egresos.filter(e => {
    const matchesCuenta = filtroCuenta === 'all' || e.cuenta === filtroCuenta;
    const matchesSearch = e.detalle.toLowerCase().includes(busqueda.toLowerCase()) || 
                          (e.nota && String(e.nota).includes(busqueda));
    return matchesCuenta && matchesSearch;
  });

  // Calculate sum of filtered egresos
  const totalUsdFiltered = filteredEgresos.reduce((sum, e) => sum + e.dolares, 0);
  const totalBsFiltered = filteredEgresos.reduce((sum, e) => sum + e.bolivares, 0);

  return (
    <div className="fade-in-up">
      {/* Title */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Control y Registro de Egresos</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manejo de flujo de egreso e imputación de gastos contra cuentas de caja y banco.</p>
      </header>

      <section className="grid-3" style={{ alignItems: 'flex-start' }}>
        {/* Register Expense Form */}
        <div className="card">
          <h3 className="card-title">💸 Registrar Nuevo Gasto</h3>
          <form onSubmit={handleRegisterExpense}>
            <div className="form-group">
              <label className="form-label">Detalle del Gasto</label>
              <input type="text" required className="form-control" placeholder="Ej: Pago mecánico de camión" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Moneda de Pago</label>
                <select className="form-control" value={moneda} onChange={(e) => handleCurrencyChange(e.target.value)}>
                  <option value="usd">Dólares ($)</option>
                  <option value="ves">Bolívares (Bs)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monto del Gasto</label>
                <input type="number" step="0.01" required className="form-control" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">N° Nota / Recibo</label>
                <input type="number" className="form-control" placeholder="Ej: 045" value={nota} onChange={(e) => setNota(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha del Gasto</label>
                <input type="date" required className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pagar desde la Cuenta</label>
              {moneda === 'usd' ? (
                <select className="form-control" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                  <option value="caja_usd">💵 Caja Principal ($)</option>
                  <option value="banco_usd">🏦 Banco Internacional (Zelle/Binance)</option>
                </select>
              ) : (
                <select className="form-control" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                  <option value="banco_bs">🏦 Banco Nacional (Bs)</option>
                  <option value="caja_bs">💵 Caja Chica (Bs)</option>
                </select>
              )}
            </div>

            <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '0.5rem' }}>
              Registrar Egreso
            </button>
          </form>
        </div>

        {/* Expenses List Card */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>
            <span>📖 Historial General de Egresos</span>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="form-control" placeholder="🔍 Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ width: '150px', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} />
              
              <select className="form-control" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)} style={{ width: '150px', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                <option value="all">Todas las Cuentas</option>
                <option value="caja_usd">💵 Caja ($)</option>
                <option value="caja_bs">💵 Caja Chica (Bs)</option>
                <option value="banco_bs">🏦 Banco (Bs)</option>
                <option value="banco_usd">🏦 Zelle/Binance</option>
              </select>
            </div>
          </div>

          {/* Aggregated view of filters */}
          <div style={{ display: 'flex', gap: '2rem', padding: '0.75rem 1rem', backgroundColor: 'hsla(223, 47%, 6%, 0.4)', borderRadius: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Suma Dólares: </span>
              <strong style={{ color: 'var(--color-expense)' }}>{fmtUSD(totalUsdFiltered)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Suma Bolívares: </span>
              <strong style={{ color: 'var(--color-expense)' }}>{fmtVES(totalBsFiltered)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Equivalente Total: </span>
              <strong style={{ color: 'white' }}>{fmtUSD(totalUsdFiltered + (totalBsFiltered / tasas.bcv))}</strong>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Fecha</th>
                  <th>Detalle / Concepto</th>
                  <th>Origen del Fondo</th>
                  <th style={{ textAlign: 'right' }}>Monto Bs</th>
                  <th style={{ textAlign: 'right' }}>Monto USD</th>
                </tr>
              </thead>
              <tbody>
                {filteredEgresos.length > 0 ? (
                  filteredEgresos.map((e, idx) => (
                    <tr key={idx}>
                      <td style={{ color: 'var(--text-muted)' }}>{e.item}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{e.fecha}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{e.detalle}</div>
                        {e.nota && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nota N° {e.nota}</span>}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem' }}>
                          {e.cuenta === 'caja_usd' && '💵 Caja ($)'}
                          {e.cuenta === 'caja_bs' && '💵 Caja Chica (Bs)'}
                          {e.cuenta === 'banco_bs' && '🏦 Banco (Bs)'}
                          {e.cuenta === 'banco_usd' && '🏦 Zelle/Binance'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-expense)' }}>
                        {e.bolivares > 0 ? fmtVES(e.bolivares) : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-expense)' }}>
                        {e.dolares > 0 ? fmtUSD(e.dolares) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron egresos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Egresos;
