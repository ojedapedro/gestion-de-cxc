import React, { useState } from 'react';

function CajaBancos({ balances, ventas, abonos, egresos, transfers, setTransfers }) {
  const [desde, setDesde] = useState('caja_usd');
  const [hacia, setHacia] = useState('banco_usd');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  const getAccountLabel = (id) => {
    switch (id) {
      case 'caja_usd': return '💵 Caja Principal ($)';
      case 'caja_bs': return '💵 Caja Chica (Bs)';
      case 'banco_bs': return '🏦 Banco Nacional (Bs)';
      case 'banco_usd': return '🏦 Banco Internacional (Zelle/Binance)';
      default: return id;
    }
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    const amt = parseFloat(monto);
    if (!amt || amt <= 0) return alert('Por favor ingrese un monto válido.');

    // Limit check
    let limit = 0;
    if (desde === 'caja_usd') limit = balances.cajaUsd;
    else if (desde === 'caja_bs') limit = balances.cajaBs;
    else if (desde === 'banco_bs') limit = balances.bancoBs;
    else if (desde === 'banco_usd') limit = balances.bancoUsd;

    if (amt > limit) {
      return alert(`Fondos insuficientes en la cuenta de origen. Saldo actual: ${desde.includes('usd') ? fmtUSD(limit) : fmtVES(limit)}`);
    }

    const newTransfer = {
      id: `trans_${Date.now()}`,
      fecha,
      desde,
      hacia,
      monto: amt,
      concepto: concepto || 'Transferencia de fondos',
    };

    setTransfers([newTransfer, ...transfers]);
    setMonto('');
    setConcepto('');
    alert('Movimiento de fondos registrado con éxito.');
  };

  // Compile unified account ledger
  const compileLedger = () => {
    const ledger = [];

    // Store sales
    ventas.forEach(v => {
      if (v.fecha) {
        if (v.bolivares > 0) {
          ledger.push({
            fecha: v.fecha,
            cuenta: 'banco_bs',
            concepto: `Venta Wendy (Bs)`,
            ingresoUsd: 0,
            ingresoBs: v.bolivares,
            egresoUsd: 0,
            egresoBs: 0,
          });
        }
        if (v.efectivo_usd > 0) {
          ledger.push({
            fecha: v.fecha,
            cuenta: 'caja_usd',
            concepto: `Venta Wendy (Efectivo)`,
            ingresoUsd: v.efectivo_usd,
            ingresoBs: 0,
            egresoUsd: 0,
            egresoBs: 0,
          });
        }
        if (v.zelle > 0) {
          ledger.push({
            fecha: v.fecha,
            cuenta: 'banco_usd',
            concepto: `Venta Wendy (Zelle)`,
            ingresoUsd: v.zelle,
            ingresoBs: 0,
            egresoUsd: 0,
            egresoBs: 0,
          });
        }
      }
    });

    // Abonos
    abonos.forEach(a => {
      if (a.fecha) {
        ledger.push({
          fecha: a.fecha,
          cuenta: a.cuenta,
          concepto: `Abono Vendedor (${a.vendedor})`,
          ingresoUsd: a.cuenta.includes('usd') ? (a.efectivo_usd || a.zelle || a.monto_total_usd) : 0,
          ingresoBs: a.cuenta.includes('bs') ? a.bolivares : 0,
          egresoUsd: 0,
          egresoBs: 0,
        });
      }
    });

    // Expenses
    egresos.forEach(e => {
      if (e.fecha) {
        ledger.push({
          fecha: e.fecha,
          cuenta: e.cuenta,
          concepto: `Gasto: ${e.detalle}`,
          ingresoUsd: 0,
          ingresoBs: 0,
          egresoUsd: e.dolares,
          egresoBs: e.bolivares,
        });
      }
    });

    // Internal transfers
    transfers.forEach(t => {
      if (t.fecha) {
        // Output from source
        ledger.push({
          fecha: t.fecha,
          cuenta: t.desde,
          concepto: `Traspaso (Hacia ${getAccountLabel(t.hacia)}): ${t.concepto}`,
          ingresoUsd: 0,
          ingresoBs: 0,
          egresoUsd: t.desde.includes('usd') ? t.monto : 0,
          egresoBs: t.desde.includes('bs') ? t.monto : 0,
        });
        // Input to destination
        ledger.push({
          fecha: t.fecha,
          cuenta: t.hacia,
          concepto: `Traspaso (Desde ${getAccountLabel(t.desde)}): ${t.concepto}`,
          ingresoUsd: t.hacia.includes('usd') ? t.monto : 0,
          ingresoBs: t.hacia.includes('bs') ? t.monto : 0,
          egresoUsd: 0,
          egresoBs: 0,
        });
      }
    });

    return ledger.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  const ledger = compileLedger();

  return (
    <div className="fade-in-up">
      {/* Title */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Efectivo y Cuentas Bancarias</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Separación estricta de fondos líquidos. Monitoreo e intermediación de saldos.</p>
      </header>

      {/* Grid of Ledger Accounts */}
      <section className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Effective Drawer */}
        <div className="card">
          <h3 className="card-title">💵 Efectivo en Caja Chica / Principal</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
              <div>
                <span className="metric-label" style={{ fontSize: '0.75rem' }}>Caja Principal USD ($)</span>
                <h4 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--accent-teal)' }}>{fmtUSD(balances.cajaUsd)}</h4>
              </div>
              <span style={{ fontSize: '2rem' }}>🇺🇸</span>
            </div>

            <div className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
              <div>
                <span className="metric-label" style={{ fontSize: '0.75rem' }}>Caja Chica VES (Bs)</span>
                <h4 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--accent-teal)' }}>{fmtVES(balances.cajaBs)}</h4>
              </div>
              <span style={{ fontSize: '2rem' }}>🇻🇪</span>
            </div>
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="card">
          <h3 className="card-title">🏦 Cuentas Bancarias & Electrónicas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
              <div>
                <span className="metric-label" style={{ fontSize: '0.75rem' }}>Zelle / Binance (USD)</span>
                <h4 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--accent-purple)' }}>{fmtUSD(balances.bancoUsd)}</h4>
              </div>
              <span style={{ fontSize: '2rem' }}>🌐</span>
            </div>

            <div className="flex-between" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }}>
              <div>
                <span className="metric-label" style={{ fontSize: '0.75rem' }}>Banco del Tesoro / Banesco (VES)</span>
                <h4 style={{ fontSize: '1.5rem', marginTop: '0.25rem', color: 'var(--accent-purple)' }}>{fmtVES(balances.bancoBs)}</h4>
              </div>
              <span style={{ fontSize: '2rem' }}>🏛️</span>
            </div>
          </div>
        </div>
      </section>

      {/* Transfer Funds & History Grid */}
      <section className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Transfer Funds Form */}
        <div className="card">
          <h3 className="card-title">🔄 Traspaso y Depósito de Fondos</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Registra traslados de efectivo físicos a cuentas bancarias o cambios de fondos internos.
          </p>

          <form onSubmit={handleTransfer}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Desde la Cuenta</label>
                <select className="form-control" value={desde} onChange={(e) => setDesde(e.target.value)}>
                  <option value="caja_usd">💵 Caja Principal ($)</option>
                  <option value="caja_bs">💵 Caja Chica (Bs)</option>
                  <option value="banco_bs">🏦 Banco Nacional (Bs)</option>
                  <option value="banco_usd">🏦 Banco Internacional ($)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hacia la Cuenta</label>
                <select className="form-control" value={hacia} onChange={(e) => setHacia(e.target.value)}>
                  <option value="caja_usd">💵 Caja Principal ($)</option>
                  <option value="caja_bs">💵 Caja Chica (Bs)</option>
                  <option value="banco_bs">🏦 Banco Nacional (Bs)</option>
                  <option value="banco_usd">🏦 Banco Internacional ($)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Monto a Traspasar</label>
                <input type="number" step="0.01" required className="form-control" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha del Movimiento</label>
                <input type="date" required className="form-control" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Concepto / Detalle del Traspaso</label>
              <input type="text" className="form-control" placeholder="Ej: Depósito de efectivo en Banco del Tesoro" value={concepto} onChange={(e) => setConcepto(e.target.value)} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Registrar Traspaso
            </button>
          </form>
        </div>

        {/* Unified Ledger History */}
        <div className="card" style={{ maxExpandedHeight: '500px' }}>
          <h3 className="card-title">📖 Libro Mayor de Movimientos</h3>
          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '0.82rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Fecha</th>
                  <th>Cuenta</th>
                  <th>Detalle</th>
                  <th style={{ textAlign: 'right' }}>Ingreso</th>
                  <th style={{ textAlign: 'right' }}>Egreso</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.fecha}</td>
                    <td style={{ fontWeight: '500' }}>
                      <span style={{ fontSize: '0.75rem' }}>
                        {row.cuenta === 'caja_usd' && '💵 Caja ($)'}
                        {row.cuenta === 'caja_bs' && '💵 Caja Chica'}
                        {row.cuenta === 'banco_bs' && '🏛️ Banco (Bs)'}
                        {row.cuenta === 'banco_usd' && '🌐 Zelle/Bin'}
                      </span>
                    </td>
                    <td>{row.concepto}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-income)' }}>
                      {row.ingresoUsd > 0 && fmtUSD(row.ingresoUsd)}
                      {row.ingresoBs > 0 && fmtVES(row.ingresoBs)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-expense)' }}>
                      {row.egresoUsd > 0 && fmtUSD(row.egresoUsd)}
                      {row.egresoBs > 0 && fmtVES(row.egresoBs)}
                    </td>
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

export default CajaBancos;
