import React, { useState } from 'react';

function Reportes({ ventas, egresos, abonos, creditos, salespersonBalances, balances }) {
  const [reportDateRange, setReportDateRange] = useState('all'); // all, month, week

  // Format currency helpers
  const fmtUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
  const fmtVES = (val) => new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val || 0);

  // Totals calculations
  const totalStoreSalesUsd = ventas.reduce((sum, v) => sum + v.efectivo_usd + v.zelle + (v.bolivares / v.tasa), 0);
  const totalStoreCredits = creditos.reduce((sum, c) => sum + c.monto, 0);
  const totalSellerAbonos = abonos.reduce((sum, a) => sum + a.monto_total_usd, 0);
  const totalPendingCollection = salespersonBalances.reduce((sum, s) => sum + s.pendiente, 0);

  const totalExpensesUSD = egresos.reduce((sum, e) => sum + e.dolares, 0);
  const totalExpensesVES = egresos.reduce((sum, e) => sum + e.bolivares, 0);

  // Group incomes and expenses by Date for Chart
  const getChartData = () => {
    const dataByDate = {};

    // Group sales
    ventas.forEach(v => {
      if (v.fecha) {
        const date = v.fecha;
        if (!dataByDate[date]) dataByDate[date] = { fecha: date, ingresos: 0, egresos: 0 };
        dataByDate[date].ingresos += v.efectivo_usd + v.zelle + (v.bolivares / v.tasa);
      }
    });

    // Group expenses
    egresos.forEach(e => {
      if (e.fecha) {
        const date = e.fecha;
        if (!dataByDate[date]) dataByDate[date] = { fecha: date, ingresos: 0, egresos: 0 };
        // Approximate Ves to USD using bcv rate
        dataByDate[date].egresos += e.dolares + (e.bolivares / 523.67);
      }
    });

    return Object.values(dataByDate)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(-10); // Take last 10 active dates
  };

  const chartData = getChartData();

  // Find max value in chart data for scaling SVG
  const maxChartValue = Math.max(
    ...chartData.map(d => Math.max(d.ingresos, d.egresos)),
    100
  );

  return (
    <div className="fade-in-up">
      {/* Header */}
      <header className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.25rem' }}>Módulo de Reportes Detallados</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Auditoría completa de cierres, rentabilidad de almacén y comportamiento de CxC.</p>
        </div>
      </header>

      {/* Overview Consolidated Audit Cards */}
      <section className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h4 className="metric-label" style={{ fontSize: '0.75rem' }}>Estructura de Ingresos (USD)</h4>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ventas Almacén (Efectivo/Zelle/Bs):</span>
              <strong style={{ color: 'var(--color-income)' }}>{fmtUSD(totalStoreSalesUsd)}</strong>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abonos de Deuda Cobrados:</span>
              <strong style={{ color: 'var(--accent-teal)' }}>{fmtUSD(totalSellerAbonos)}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }} className="flex-between">
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Ingreso Consolidado:</span>
              <strong style={{ fontSize: '1.1rem', color: 'white' }}>{fmtUSD(totalStoreSalesUsd + totalSellerAbonos)}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="metric-label" style={{ fontSize: '0.75rem' }}>Estructura de Egresos (USD)</h4>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gastos en Dólares ($):</span>
              <strong style={{ color: 'var(--color-expense)' }}>{fmtUSD(totalExpensesUSD)}</strong>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gastos en Bolívares (Bs):</span>
              <strong style={{ color: 'var(--color-expense)' }}>{fmtVES(totalExpensesVES)}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }} className="flex-between">
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Gasto Consolidado Equiv.:</span>
              <strong style={{ fontSize: '1.1rem', color: 'white' }}>{fmtUSD(totalExpensesUSD + (totalExpensesVES / 523.67))}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="metric-label" style={{ fontSize: '0.75rem' }}>Auditoría de Crédito (CxC)</h4>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Notas de Crédito Emitidas:</span>
              <strong style={{ color: 'var(--color-pending)' }}>{fmtUSD(totalStoreCredits)}</strong>
            </div>
            <div className="flex-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abonos Recibidos:</span>
              <strong style={{ color: 'var(--color-income)' }}>{fmtUSD(totalSellerAbonos)}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }} className="flex-between">
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>CxC Por Recaudar:</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--color-pending)' }}>{fmtUSD(totalPendingCollection)}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* SVG Analytical Charts */}
      <section className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Income vs Expenses Chart */}
        <div className="card">
          <h3 className="card-title">📈 Tendencia de Liquidez Diaria (Historial Reciente)</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Comparativa diaria de flujo de ingresos (Tienda) vs egresos totales (Gastos) en USD.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            {chartData.length > 0 ? (
              <svg width="100%" height="240" viewBox="0 0 500 240" style={{ overflow: 'visible' }}>
                {/* Grid lines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="var(--border-color)" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="480" y2="90" stroke="var(--border-color)" strokeDasharray="4 4" />
                <line x1="40" y1="150" x2="480" y2="150" stroke="var(--border-color)" strokeDasharray="4 4" />
                <line x1="40" y1="210" x2="480" y2="210" stroke="var(--border-color)" />

                {/* Y Axis Labels */}
                <text x="32" y="35" fill="var(--text-muted)" fontSize="8" textAnchor="end">{fmtUSD(maxChartValue)}</text>
                <text x="32" y="120" fill="var(--text-muted)" fontSize="8" textAnchor="end">{fmtUSD(maxChartValue / 2)}</text>
                <text x="32" y="213" fill="var(--text-muted)" fontSize="8" textAnchor="end">$0</text>

                {/* Draw Bars */}
                {chartData.map((d, idx) => {
                  const spacing = 440 / chartData.length;
                  const x = 50 + (idx * spacing);
                  
                  const incomeHeight = (d.ingresos / maxChartValue) * 170;
                  const expenseHeight = (d.egresos / maxChartValue) * 170;

                  return (
                    <g key={idx}>
                      {/* Income Bar (Green) */}
                      <rect 
                        x={x} 
                        y={210 - incomeHeight} 
                        width="12" 
                        height={incomeHeight || 1} 
                        fill="var(--color-income)" 
                        rx="2"
                        opacity="0.85"
                      />
                      {/* Expense Bar (Red) */}
                      <rect 
                        x={x + 15} 
                        y={210 - expenseHeight} 
                        width="12" 
                        height={expenseHeight || 1} 
                        fill="var(--color-expense)" 
                        rx="2"
                        opacity="0.85"
                      />
                      {/* Date label */}
                      <text 
                        x={x + 13} 
                        y="228" 
                        fill="var(--text-secondary)" 
                        fontSize="7" 
                        textAnchor="middle"
                        transform={`rotate(-15, ${x + 13}, 228)`}
                      >
                        {d.fecha.slice(5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ color: 'var(--text-muted)', height: '240px', display: 'flex', alignItems: 'center' }}>No hay suficientes datos.</div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-income)', borderRadius: '2px' }}></div>
              <span>Ingresos Consolidados</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-expense)', borderRadius: '2px' }}></div>
              <span>Egresos / Gastos</span>
            </div>
          </div>
        </div>

        {/* CxC Collection Chart by Salesperson */}
        <div className="card">
          <h3 className="card-title">🤝 Distribución de CxC Pendiente</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            Monto de crédito total a cobrar desagregado por cada vendedor activo.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {salespersonBalances
              .filter(s => s.pendiente > 0 && s.nombre !== 'GARANTIA' && s.nombre !== 'DONACION')
              .map((s, idx) => {
                const totalPend = salespersonBalances.reduce((sum, sb) => sum + sb.pendiente, 0);
                const percent = Math.min(100, Math.max(5, (s.pendiente / totalPend) * 100));
                
                return (
                  <div key={idx}>
                    <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '500' }}>👤 {s.nombre}</span>
                      <strong style={{ color: 'var(--color-pending)' }}>{fmtUSD(s.pendiente)}</strong>
                    </div>
                    {/* Bar background */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'hsla(223, 47%, 6%, 0.6)', borderRadius: '4px', overflow: 'hidden' }}>
                      {/* Bar indicator */}
                      <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(to right, var(--color-pending), #fbbf24)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Audited breakdown tables */}
      <section className="card">
        <h3 className="card-title">📁 Desglose y Cierre Conciliado (Almacén vs Vendedores)</h3>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="custom-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'hsla(223, 47%, 6%, 0.8)' }}>
                <th>Vendedor / Almacén</th>
                <th style={{ textAlign: 'right' }}>Crédito Inicial Asignado</th>
                <th style={{ textAlign: 'right' }}>Comisiones Estimadas</th>
                <th style={{ textAlign: 'right' }}>Abonos Recaudados</th>
                <th style={{ textAlign: 'right' }}>Saldo Neto Cobrar</th>
                <th style={{ textAlign: 'right' }}>Cobrado en Efectivo</th>
                <th style={{ textAlign: 'right' }}>Cobrado en Zelle</th>
              </tr>
            </thead>
            <tbody>
              {salespersonBalances.map((s, idx) => {
                // Find abono details for this seller
                const sellerAbonos = abonos.filter(a => {
                  let name = a.vendedor.toUpperCase();
                  if (name.includes("JESUS RUIZ") || name === "JESUS") name = "JESUS RUIZ 1";
                  if (name.includes("ISAAC") || name.includes("ISACC")) name = "ISAAC RANGEL 2";
                  if (name.includes("BETSY") || name.includes("BETSI")) name = "BETSI";
                  if (name.includes("ELIZABETH")) name = "ELIZABETH G";
                  if (name.includes("DANYELLO") || name.includes("DANYELO")) name = "DANYELLO C";
                  if (name.includes("TOTI") || name.includes("TOTY")) name = "TOTY";
                  return name === s.nombre.toUpperCase();
                });

                const cashCol = sellerAbonos.reduce((sum, a) => sum + a.efectivo_usd, 0);
                const zelleCol = sellerAbonos.reduce((sum, a) => sum + a.zelle, 0);
                const commissions = s.credito * 0.04; // 4% average commission estimation

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{s.nombre === 'DONACION' || s.nombre === 'GARANTIA' ? `🎁 ${s.nombre}` : `👤 ${s.nombre}`}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{fmtUSD(s.credito)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{s.nombre !== 'DONACION' && s.nombre !== 'GARANTIA' ? fmtUSD(commissions) : '-'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-income)' }}>{fmtUSD(s.abono)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }} className={s.pendiente > 0 ? 'text-pending' : 'text-income'}>
                      {fmtUSD(s.pendiente)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-teal)' }}>{cashCol > 0 ? fmtUSD(cashCol) : '-'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-purple)' }}>{zelleCol > 0 ? fmtUSD(zelleCol) : '-'}</td>
                  </tr>
                );
              })}
              
              {/* Consolidation Row */}
              <tr style={{ borderTop: '2px solid var(--border-color)', fontWeight: '700', backgroundColor: 'hsla(223, 47%, 6%, 0.6)' }}>
                <td>TOTAL CONSOLIDADO:</td>
                <td style={{ textAlign: 'right' }}>{fmtUSD(salespersonBalances.reduce((sum, s) => sum + s.credito, 0))}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{fmtUSD(salespersonBalances.reduce((sum, s) => sum + (s.nombre !== 'DONACION' && s.nombre !== 'GARANTIA' ? s.credito * 0.04 : 0), 0))}</td>
                <td style={{ textAlign: 'right', color: 'var(--color-income)' }}>{fmtUSD(totalSellerAbonos)}</td>
                <td style={{ textAlign: 'right', color: 'var(--color-pending)' }}>{fmtUSD(totalPendingCollection)}</td>
                <td style={{ textAlign: 'right', color: 'var(--accent-teal)' }}>{fmtUSD(abonos.reduce((sum, a) => sum + a.efectivo_usd, 0))}</td>
                <td style={{ textAlign: 'right', color: 'var(--accent-purple)' }}>{fmtUSD(abonos.reduce((sum, a) => sum + a.zelle, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Reportes;
