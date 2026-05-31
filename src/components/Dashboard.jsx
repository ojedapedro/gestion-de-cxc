import React, { useState } from 'react';

function Dashboard({ balances, tasas, setTasas, ventas, egresos, cxcTotal }) {
  const [editing, setEditing] = useState(false);
  const [tempTasas, setTempTasas] = useState({ ...tasas });

  // Calculate totals
  const totalStoreSalesUsd = ventas.reduce((sum, v) => sum + v.efectivo_usd + v.zelle + (v.bolivares / v.tasa), 0);
  const totalExpensesUsd = egresos.reduce((sum, e) => sum + e.dolares + (e.bolivares / tasas.bcv), 0);
  const totalExpensesBs = egresos.reduce((sum, e) => sum + e.bolivares, 0);
  const totalExpensesUSDOnly = egresos.reduce((sum, e) => sum + e.dolares, 0);
  
  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  const handleRateChange = (e, key) => {
    setTempTasas({ ...tempTasas, [key]: parseFloat(e.target.value) || 0 });
  };

  const saveRates = () => {
    setTasas({ ...tempTasas });
    setEditing(false);
  };

  // Get recent 5 movements
  const getRecentMovements = () => {
    const movements = [];
    ventas.forEach(v => {
      if (v.fecha) {
        movements.push({
          tipo: 'Venta Store',
          fecha: v.fecha,
          ref: `Wendy #${v.item}`,
          montoUsd: v.efectivo_usd + v.zelle,
          montoBs: v.bolivares,
          color: 'income',
        });
      }
    });

    egresos.forEach(e => {
      if (e.fecha) {
        movements.push({
          tipo: 'Egreso / Gasto',
          fecha: e.fecha,
          ref: e.detalle,
          montoUsd: -e.dolares,
          montoBs: -e.bolivares,
          color: 'expense',
        });
      }
    });

    return movements
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5);
  };

  const recentMovements = getRecentMovements();

  return (
    <div className="fade-in-up">
      {/* Top Banner & Date Summary */}
      <header className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Resumen Financiero</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visión consolidada de liquidez, efectivo, bancos y cuentas por cobrar.</p>
        </div>
        
        {/* Quick Exchange Rates Panel */}
        <div className="rate-editor">
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="rate-item">
                <span>BCV:</span>
                <input type="number" step="0.01" className="form-control" value={tempTasas.bcv} onChange={(e) => handleRateChange(e, 'bcv')} style={{ width: '80px', padding: '0.25rem 0.5rem' }} />
              </div>
              <div className="rate-item">
                <span>Euro:</span>
                <input type="number" step="0.01" className="form-control" value={tempTasas.euro} onChange={(e) => handleRateChange(e, 'euro')} style={{ width: '80px', padding: '0.25rem 0.5rem' }} />
              </div>
              <div className="rate-item">
                <span>Binance:</span>
                <input type="number" step="0.01" className="form-control" value={tempTasas.binance} onChange={(e) => handleRateChange(e, 'binance')} style={{ width: '80px', padding: '0.25rem 0.5rem' }} />
              </div>
              <button className="btn btn-primary" onClick={saveRates} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>Guardar</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div className="rate-item">
                <span>💵 BCV:</span>
                <strong style={{ color: 'var(--accent-teal)' }}>{tasas.bcv.toFixed(2)}</strong>
              </div>
              <div className="rate-item">
                <span>💶 EURO:</span>
                <strong style={{ color: 'var(--accent-purple)' }}>{tasas.euro.toFixed(2)}</strong>
              </div>
              <div className="rate-item">
                <span>🪙 BINANCE:</span>
                <strong style={{ color: 'var(--color-pending)' }}>{tasas.binance.toFixed(2)}</strong>
              </div>
              <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--border-color)' }}>✍️ Editar</button>
            </div>
          )}
        </div>
      </header>

      {/* Main Liquidity Balance Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2.25rem', borderLeft: '4px solid var(--accent-teal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <span className="metric-label" style={{ fontSize: '0.95rem' }}>Balance de Liquidez Consolidado</span>
            <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', marginTop: '0.5rem', background: 'linear-gradient(to right, #fff, var(--accent-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {fmtUSD(balances.totalUsd + (balances.totalBs / tasas.bcv))}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Equivalente total neto combinando todas las cajas físicas y cuentas bancarias.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span className="metric-label" style={{ fontSize: '0.75rem' }}>Total USD ($)</span>
              <h3 style={{ fontSize: '1.75rem', color: 'white', marginTop: '0.25rem' }}>{fmtUSD(balances.totalUsd)}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Caja & Bancos USD</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="metric-label" style={{ fontSize: '0.75rem' }}>Total Bs (VES)</span>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--accent-purple)', marginTop: '0.25rem' }}>{fmtVES(balances.totalBs)}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtUSD(balances.totalBs / tasas.bcv)} equiv.</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <div>
            <span className="metric-label" style={{ fontSize: '0.75rem' }}>Ingresos Brutos Históricos</span>
            <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--color-income)', marginTop: '0.25rem' }}>
              {fmtUSD(totalStoreSalesUsd)}
            </div>
          </div>
          <div>
            <span className="metric-label" style={{ fontSize: '0.75rem' }}>Egresos / Gastos Totales</span>
            <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--color-expense)', marginTop: '0.25rem' }}>
              {fmtUSD(totalExpensesUsd)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fmtVES(totalExpensesBs)} + {fmtUSD(totalExpensesUSDOnly)}</span>
          </div>
          <div>
            <span className="metric-label" style={{ fontSize: '0.75rem' }}>Rentabilidad Neta (Almacén)</span>
            <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'white', marginTop: '0.25rem' }}>
              {fmtUSD(totalStoreSalesUsd - totalExpensesUsd)}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="metrics-grid">
        <div className="card metric-card metric-cxc">
          <span className="metric-label">Cuentas por Cobrar (CxC)</span>
          <div className="metric-value">{fmtUSD(cxcTotal)}</div>
          <div className="metric-sub">
            🤝 <span>Crédito pendiente vendedores</span>
          </div>
        </div>

        <div className="card metric-card metric-caja">
          <span className="metric-label">Efectivo en Caja Principal</span>
          <div className="metric-value">{fmtUSD(balances.cajaUsd)}</div>
          <div className="metric-sub">
            💵 <span>{fmtVES(balances.cajaBs)} en Caja Bs</span>
          </div>
        </div>

        <div className="card metric-card metric-bancos">
          <span className="metric-label">Dinero en Bancos</span>
          <div className="metric-value">{fmtUSD(balances.bancoUsd)}</div>
          <div className="metric-sub">
            🏦 <span>{fmtVES(balances.bancoBs)} en Cuentas Bs</span>
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="grid-2">
        <div className="card">
          <h3 className="card-title">💵 Distribución de Caja y Cuentas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="flex-between" style={{ padding: '0.85rem', backgroundColor: 'hsla(223, 47%, 6%, 0.4)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💵</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Caja Principal (Efectivo)</div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fondo de caja física</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{fmtUSD(balances.cajaUsd)}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmtVES(balances.cajaBs)}</div>
              </div>
            </div>

            <div className="flex-between" style={{ padding: '0.85rem', backgroundColor: 'hsla(223, 47%, 6%, 0.4)', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏦</span>
                <div>
                  <div style={{ fontWeight: '600' }}>Cuentas Bancarias</div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zelle, Banco Tesoro, Binance</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: 'var(--accent-purple)' }}>{fmtUSD(balances.bancoUsd)}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{fmtVES(balances.bancoBs)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">⚡ Actividad Reciente</h3>
          <div className="table-container" style={{ border: 'none', marginTop: '0.5rem' }}>
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Monto Equiv.</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length > 0 ? (
                  recentMovements.map((m, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{m.tipo}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.ref}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.fecha}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }} className={m.color === 'income' ? 'text-income' : 'text-expense'}>
                        {m.montoUsd !== 0 ? fmtUSD(m.montoUsd) : fmtVES(m.montoBs)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay movimientos recientes.</td>
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

export default Dashboard;
