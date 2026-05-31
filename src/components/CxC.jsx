import React, { useState } from 'react';

function CxC({ salespersonBalances, vendedores, setVendedores, creditos, setCreditos, abonos, setAbonos, tasas }) {
  const [activeTab, setActiveTab] = useState('vendedores');
  
  // New seller state
  const [nuevoVendedorName, setNuevoVendedorName] = useState('');

  // New Credit Note state
  const [cFecha, setCFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cNota, setCNota] = useState('');
  const [cVendedor, setCVendedor] = useState('');
  const [cMonto, setCMonto] = useState('');

  // New Abono state
  const [aFecha, setAFecha] = useState(new Date().toISOString().split('T')[0]);
  const [aVendedor, setAVendedor] = useState('');
  const [aMoneda, setAMoneda] = useState('usd_efectivo'); // usd_efectivo, usd_zelle, ves_transfer
  const [aMonto, setAMonto] = useState('');
  const [aTasa, setATasa] = useState(tasas.bcv);
  const [aCuenta, setACuenta] = useState('caja_usd');

  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  // Dynamic Vendedor creation
  const handleAddVendedor = (e) => {
    e.preventDefault();
    const name = nuevoVendedorName.trim();
    if (!name) return alert('Por favor ingrese un nombre.');

    const alreadyExists = vendedores.some(v => v.nombre.toUpperCase() === name.toUpperCase());
    if (alreadyExists) return alert('Este vendedor ya existe.');

    const newVendedor = {
      id: name.toLowerCase().replace(/\s+/g, '_'),
      nombre: name,
      fechaCreado: new Date().toISOString().split('T')[0],
    };

    setVendedores([...vendedores, newVendedor]);
    setNuevoVendedorName('');
    alert(`Vendedor "${name}" agregado con éxito.`);
  };

  // Register new Credit Note
  const handleRegisterCredit = (e) => {
    e.preventDefault();
    const amt = parseFloat(cMonto);
    if (!amt || amt <= 0) return alert('Ingrese un monto válido.');
    if (!cVendedor) return alert('Seleccione un vendedor.');

    const newCredit = {
      id: `credito_${Date.now()}`,
      item: creditos.length + 1,
      nota: cNota ? parseInt(cNota) : null,
      fecha: cFecha,
      cliente_vendedor: cVendedor,
      monto: amt,
      total_nota: amt,
    };

    setCreditos([newCredit, ...creditos]);
    setCNota('');
    setCMonto('');
    alert(`Nota de crédito emitida con éxito para ${cVendedor}.`);
  };

  // Adjust account suggestion based on selected currency
  const handleAbonoCurrencyChange = (currency) => {
    setAMoneda(currency);
    if (currency === 'usd_efectivo') {
      setACuenta('caja_usd');
    } else if (currency === 'usd_zelle') {
      setACuenta('banco_usd');
    } else if (currency === 'ves_transfer') {
      setACuenta('banco_bs');
    }
  };

  // Register new Abono
  const handleRegisterAbono = (e) => {
    e.preventDefault();
    const amt = parseFloat(aMonto);
    const tasaVal = parseFloat(aTasa) || 1.0;
    if (!amt || amt <= 0) return alert('Ingrese un monto de abono válido.');
    if (!aVendedor) return alert('Seleccione un vendedor.');

    let bolivares = 0;
    let efectivo_usd = 0;
    let zelle = 0;
    let usd_conv = 0;
    let monto_total_usd = 0;

    if (aMoneda === 'usd_efectivo') {
      efectivo_usd = amt;
      monto_total_usd = amt;
    } else if (aMoneda === 'usd_zelle') {
      zelle = amt;
      monto_total_usd = amt;
    } else if (aMoneda === 'ves_transfer') {
      bolivares = amt;
      usd_conv = amt / tasaVal;
      monto_total_usd = usd_conv;
    }

    // Verify salesperson actually owes money
    const currentBalance = salespersonBalances.find(s => s.nombre.toUpperCase() === aVendedor.toUpperCase());
    if (currentBalance && currentBalance.pendiente <= 0) {
      const confirmAbono = window.confirm(`Aviso: ${aVendedor} no tiene deuda pendiente (Saldo: $0). ¿Desea registrar este abono de todas formas?`);
      if (!confirmAbono) return;
    }

    const newAbono = {
      id: `abono_${Date.now()}`,
      item: abonos.length + 1,
      vendedor: aVendedor,
      fecha: aFecha,
      bolivares,
      tasa: tasaVal,
      usd_conv,
      efectivo_usd,
      zelle,
      monto_total_usd,
      cuenta: aCuenta,
    };

    setAbonos([newAbono, ...abonos]);
    setAMonto('');
    alert(`Abono registrado con éxito para ${aVendedor} por ${fmtUSD(monto_total_usd)}. Fondo acreditado a ${aCuenta === 'caja_usd' ? 'Caja ($)' : aCuenta === 'banco_usd' ? 'Zelle/Binance' : 'Banco (Bs)'}.`);
  };

  return (
    <div className="fade-in-up">
      {/* Header */}
      <header className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Cuentas por Cobrar (CxC)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Módulo independiente para la emisión de créditos de vendedores y cobro de abonos.</p>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', border: '1px solid var(--border-color)', padding: '0.25rem', borderRadius: '0.75rem', backgroundColor: 'var(--bg-secondary)' }}>
          <button className={`btn ${activeTab === 'vendedores' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('vendedores')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            🤝 Vendedores
          </button>
          <button className={`btn ${activeTab === 'creditos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('creditos')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            📝 Notas de Crédito
          </button>
          <button className={`btn ${activeTab === 'abonos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('abonos')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            💵 Registrar Abono
          </button>
        </div>
      </header>

      {/* VIEW 1: Salespersons balances grid */}
      {activeTab === 'vendedores' && (
        <div className="fade-in-up">
          <section className="grid-3" style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
            {/* Create dynamic seller */}
            <div className="card">
              <h3 className="card-title">➕ Agregar Nuevo Vendedor</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Crea cobradores o vendedores de forma dinámica para asignarles notas de venta.
              </p>
              <form onSubmit={handleAddVendedor}>
                <div className="form-group">
                  <label className="form-label">Nombre del Vendedor</label>
                  <input type="text" required className="form-control" placeholder="Ej: CARLOS MENDOZA" value={nuevoVendedorName} onChange={(e) => setNuevoVendedorName(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Registrar Vendedor
                </button>
              </form>
            </div>

            {/* List and credit card summary */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 className="card-title">📋 Estado de Crédito por Vendedor</h3>
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Vendedor / Ficha</th>
                      <th style={{ textAlign: 'right' }}>Crédito Asignado</th>
                      <th style={{ textAlign: 'right' }}>Abonos Pagados</th>
                      <th style={{ textAlign: 'right' }}>Deuda Pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salespersonBalances
                      .filter(s => s.nombre !== 'DONACION' && s.nombre !== 'GARANTIA')
                      .map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>👤 {s.nombre}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtUSD(s.credito)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--color-income)' }}>{fmtUSD(s.abono)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }} className={s.pendiente > 0 ? 'text-pending' : 'text-income'}>
                            {fmtUSD(s.pendiente)}
                          </td>
                        </tr>
                      ))}
                    {/* Donaciones & Garantias at bottom */}
                    <tr style={{ borderTop: '2px solid var(--border-color)', backgroundColor: 'hsla(223, 47%, 6%, 0.4)' }}>
                      <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>🎁 DONACIONES Y GARANTIAS</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {fmtUSD(
                          salespersonBalances.filter(s => s.nombre === 'DONACION' || s.nombre === 'GARANTIA')
                            .reduce((sum, s) => sum + s.credito, 0)
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-income)' }}>
                        {fmtUSD(
                          salespersonBalances.filter(s => s.nombre === 'DONACION' || s.nombre === 'GARANTIA')
                            .reduce((sum, s) => sum + s.abono, 0)
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-pending)' }}>
                        {fmtUSD(
                          salespersonBalances.filter(s => s.nombre === 'DONACION' || s.nombre === 'GARANTIA')
                            .reduce((sum, s) => sum + s.pendiente, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 2: Credit note registry & list */}
      {activeTab === 'creditos' && (
        <div className="fade-in-up">
          <section className="grid-3" style={{ alignItems: 'flex-start' }}>
            {/* Create credit note */}
            <div className="card">
              <h3 className="card-title">📝 Registrar Nota de Crédito (CxC)</h3>
              <form onSubmit={handleRegisterCredit}>
                <div className="form-group">
                  <label className="form-label">Asignar al Vendedor</label>
                  <select className="form-control" required value={cVendedor} onChange={(e) => setCVendedor(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.nombre}>{v.nombre}</option>
                    ))}
                    <option value="DONACION">DONACION (Especial)</option>
                    <option value="GARANTIA">GARANTIA (Especial)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">N° de Nota</label>
                    <input type="number" className="form-control" placeholder="Ej: 460" value={cNota} onChange={(e) => setCNota(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha Emisión</label>
                    <input type="date" required className="form-control" value={cFecha} onChange={(e) => setCFecha(e.target.value)} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Monto del Crédito ($ USD)</label>
                  <input type="number" step="0.01" required className="form-control" placeholder="0.00" value={cMonto} onChange={(e) => setCMonto(e.target.value)} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Emitir Nota Crédito
                </button>
              </form>
            </div>

            {/* List notes */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 className="card-title">📖 Histórico de Créditos Otorgados</h3>
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Fecha</th>
                      <th>Vendedor / Cliente</th>
                      <th>N° Nota</th>
                      <th style={{ textAlign: 'right' }}>Monto Crédito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditos.map((c, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{c.item}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{c.fecha}</td>
                        <td style={{ fontWeight: '600' }}>👤 {c.cliente_vendedor}</td>
                        <td style={{ fontFamily: 'var(--font-heading)' }}>{c.nota ? `N° ${c.nota}` : 'S/N'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-pending)' }}>{fmtUSD(c.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 3: Abono registry & list */}
      {activeTab === 'abonos' && (
        <div className="fade-in-up">
          <section className="grid-3" style={{ alignItems: 'flex-start' }}>
            {/* Register abono */}
            <div className="card">
              <h3 className="card-title">💵 Registrar Abono de Deuda</h3>
              <form onSubmit={handleRegisterAbono}>
                <div className="form-group">
                  <label className="form-label">Vendedor / Cliente</label>
                  <select className="form-control" required value={aVendedor} onChange={(e) => setAVendedor(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {vendedores.map((v) => (
                      <option key={v.id} value={v.nombre}>{v.nombre}</option>
                    ))}
                    <option value="DONACION">DONACION (Especial)</option>
                    <option value="GARANTIA">GARANTIA (Especial)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago</label>
                  <select className="form-control" value={aMoneda} onChange={(e) => handleAbonoCurrencyChange(e.target.value)}>
                    <option value="usd_efectivo">💵 Efectivo USD ($)</option>
                    <option value="usd_zelle">🏦 Zelle / Binance ($)</option>
                    <option value="ves_transfer">🏛️ Pago Móvil / Transferencia (Bs)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Monto Recibido</label>
                    <input type="number" step="0.01" required className="form-control" placeholder="0.00" value={aMonto} onChange={(e) => setAMonto(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha de Recibo</label>
                    <input type="date" required className="form-control" value={aFecha} onChange={(e) => setAFecha(e.target.value)} />
                  </div>
                </div>

                {aMoneda === 'ves_transfer' && (
                  <div className="form-group">
                    <label className="form-label">Tasa de Conversión (Bs/$)</label>
                    <input type="number" step="0.01" className="form-control" value={aTasa} onChange={(e) => setATasa(e.target.value)} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Fondos a Acreditar en Cuenta</label>
                  <select className="form-control" value={aCuenta} onChange={(e) => setACuenta(e.target.value)}>
                    <option value="caja_usd">💵 Caja Principal ($)</option>
                    <option value="caja_bs">💵 Caja Chica (Bs)</option>
                    <option value="banco_usd">🏦 Banco Internacional (Zelle/Bin)</option>
                    <option value="banco_bs">🏦 Banco Nacional (Bs)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Registrar Abono
                </button>
              </form>
            </div>

            {/* List abonos */}
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <h3 className="card-title">📖 Histórico de Abonos Cobrados</h3>
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Fecha</th>
                      <th>Vendedor</th>
                      <th>Desglose de Pago</th>
                      <th style={{ textAlign: 'right' }}>Total Equiv. ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abonos.map((a, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{a.item}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{a.fecha}</td>
                        <td style={{ fontWeight: '600' }}>👤 {a.vendedor}</td>
                        <td>
                          <span style={{ fontSize: '0.78rem' }}>
                            {a.efectivo_usd > 0 && `💵 USD Efectivo: ${fmtUSD(a.efectivo_usd)}`}
                            {a.zelle > 0 && `🏦 Zelle: ${fmtUSD(a.zelle)}`}
                            {a.bolivares > 0 && `🏛️ Bs Transfer: ${fmtVES(a.bolivares)} (@ ${a.tasa})`}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                            Destino: {a.cuenta === 'caja_usd' ? 'Caja ($)' : a.cuenta === 'banco_usd' ? 'Zelle/Bin' : 'Bancos (Bs)'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-income)' }}>{fmtUSD(a.monto_total_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default CxC;
