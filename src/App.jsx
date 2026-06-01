import React, { useState, useEffect, useRef } from 'react';
import { initialDb } from './data/initialDb';
import Dashboard from './components/Dashboard';
import CajaBancos from './components/CajaBancos';
import CxC from './components/CxC';
import Egresos from './components/Egresos';
import VentasTienda from './components/VentasTienda';
import Recibos from './components/Recibos';
import Reportes from './components/Reportes';

// Firebase Services & Utilities
import { 
  db, 
  isFirebaseConfigured, 
  saveDocument, 
  deleteDocument, 
  seedCollectionIfEmpty 
} from './services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  
  // Real Local States
  const [vendedores, setVendedoresState] = useState([]);
  const [ventas, setVentasState] = useState([]);
  const [creditos, setCreditosState] = useState([]);
  const [abonos, setAbonosState] = useState([]);
  const [egresos, setEgresosState] = useState([]);
  const [transfers, setTransfersState] = useState([]);
  const [tasas, setTasasState] = useState({
    bcv: 523.67,
    euro: 609.34,
    binance: 712.74,
  });

  const isFirebaseMode = isFirebaseConfigured();

  // Ref to always hold the latest state values to avoid React stale closures in handlers
  const stateRef = useRef({ vendedores, ventas, creditos, abonos, egresos, transfers, tasas });
  useEffect(() => {
    stateRef.current = { vendedores, ventas, creditos, abonos, egresos, transfers, tasas };
  }, [vendedores, ventas, creditos, abonos, egresos, transfers, tasas]);

  // Helper to create state setters that synchronize with Firestore in real-time or fallback locally
  const createFirebaseSyncSetter = (collectionName, localSetter) => {
    return async (updatedVal) => {
      const currentState = stateRef.current[collectionName];
      const newList = typeof updatedVal === 'function' ? updatedVal(currentState) : updatedVal;
      
      // Update local state immediately for instant optimistic UI
      localSetter(newList);

      if (isFirebaseMode && db) {
        try {
          // Identify added or modified items
          const addedOrModified = newList.filter(newItem => {
            const oldItem = currentState.find(item => item.id === newItem.id);
            return !oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem);
          });

          // Identify deleted items
          const deleted = currentState.filter(oldItem => !newList.some(newItem => newItem.id === oldItem.id));

          // Save added or modified to Firestore
          for (const item of addedOrModified) {
            await saveDocument(collectionName, item);
          }

          // Delete from Firestore
          for (const item of deleted) {
            await deleteDocument(collectionName, item.id);
          }
        } catch (err) {
          console.error(`Error syncing state to Firestore for ${collectionName}:`, err);
        }
      } else {
        // LocalStorage fallback
        localStorage.setItem(`cxc_${collectionName}`, JSON.stringify(newList));
      }
    };
  };

  // Wrapped Sync Setters matching original signatures
  const setVendedores = createFirebaseSyncSetter('vendedores', setVendedoresState);
  const setVentas = createFirebaseSyncSetter('ventas', setVentasState);
  const setCreditos = createFirebaseSyncSetter('creditos', setCreditosState);
  const setAbonos = createFirebaseSyncSetter('abonos', setAbonosState);
  const setEgresos = createFirebaseSyncSetter('egresos', setEgresosState);
  const setTransfers = createFirebaseSyncSetter('transfers', setTransfersState);

  const setTasas = async (updatedVal) => {
    const newTasas = typeof updatedVal === 'function' ? updatedVal(tasas) : updatedVal;
    setTasasState(newTasas);
    if (isFirebaseMode && db) {
      try {
        await saveDocument('config', { id: 'tasas', ...newTasas });
      } catch (err) {
        console.error('Error saving tasas to Firestore:', err);
      }
    } else {
      localStorage.setItem('cxc_tasas', JSON.stringify(newTasas));
    }
  };

  // Initialize and Sync State with Firebase Firestore (or LocalStorage fallback)
  useEffect(() => {
    if (isFirebaseMode && db) {
      // 1. Define Seeding Logic
      const checkAndSeedDatabase = async () => {
        // Vendedores
        const initialSellers = initialDb.meta.vendedores.map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          nombre: name,
          fechaCreado: '2026-05-07',
        }));

        // Wendy Store Sales
        const initialVentas = initialDb.ventas_store.map((v, idx) => ({
          id: `venta_h_${idx}`,
          fecha: v.fecha,
          semana: v.semana,
          bolivares: v.bolivares,
          tasa: v.tasa,
          efectivo_usd: v.efectivo_usd,
          zelle: v.zelle,
          cxc: v.cxc,
          venta_diaria: v.venta_diaria,
          venta_real_tienda: v.venta_real_tienda,
          cuenta_bs: 'banco_bs',
          cuenta_usd: v.zelle > 0 ? 'banco_usd' : 'caja_usd',
        }));

        // Credits (CxC Notes)
        const initialCreditos = initialDb.cxc_notes.map((c, idx) => ({
          id: `credito_h_${idx}`,
          nota: c.nota,
          fecha: c.fecha,
          cliente_vendedor: c.cliente_vendedor,
          monto: c.monto,
          total_nota: c.total_nota,
          estado: 'pendiente',
        }));

        // Abonos (Payments)
        const initialAbonos = initialDb.abonos.map((a, idx) => {
          let cuenta_destino = 'caja_usd';
          if (a.zelle > 0) {
            cuenta_destino = 'banco_usd';
          } else if (a.bolivares > 0) {
            cuenta_destino = 'banco_bs';
          }
          return {
            id: `abono_h_${idx}`,
            vendedor: a.vendedor,
            fecha: a.fecha,
            bolivares: a.bolivares,
            tasa: a.tasa,
            usd_conv: a.usd_conv,
            efectivo_usd: a.efectivo_usd,
            zelle: a.zelle,
            monto_total_usd: a.monto_total_usd,
            cuenta: cuenta_destino,
          };
        });

        // Egresos (Expenses)
        const initialEgresos = initialDb.expenses.map((e, idx) => {
          let cuenta_origen = 'caja_usd';
          const det = e.detalle.toLowerCase();
          if (e.bolivares > 0) {
            cuenta_origen = 'banco_bs';
          } else if (det.includes('zelle')) {
            cuenta_origen = 'banco_usd';
          }
          return {
            id: `gasto_h_${idx}`,
            fecha: e.fecha,
            nota: e.nota,
            bolivares: e.bolivares,
            dolares: e.dolares,
            detalle: e.detalle,
            cuenta: cuenta_origen,
          };
        });

        // Run seeds
        await seedCollectionIfEmpty('vendedores', initialSellers);
        await seedCollectionIfEmpty('ventas', initialVentas);
        await seedCollectionIfEmpty('creditos', initialCreditos);
        await seedCollectionIfEmpty('abonos', initialAbonos);
        await seedCollectionIfEmpty('egresos', initialEgresos);
        
        // Also seed initial tasas if configuration doesn't exist
        try {
          await seedCollectionIfEmpty('config', [{
            id: 'tasas',
            bcv: 523.67,
            euro: 609.34,
            binance: 712.74,
          }]);
        } catch (e) {
          console.error("Error seeding config rates:", e);
        }
      };

      checkAndSeedDatabase();

      // 2. Set up real-time listeners for each collection
      const unsubs = [];

      // Sort helpers
      const sortByIdOrItem = (a, b) => (b.item || 0) - (a.item || 0);

      // Listen to Vendedores
      unsubs.push(onSnapshot(collection(db, 'vendedores'), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        list.sort((a, b) => a.nombre.localeCompare(b.nombre));
        setVendedoresState(list);
      }));

      // Listen to Ventas
      unsubs.push(onSnapshot(collection(db, 'ventas'), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        list.sort(sortByIdOrItem);
        setVentasState(list);
      }));

      // Listen to Creditos
      unsubs.push(onSnapshot(collection(db, 'creditos'), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        list.sort(sortByIdOrItem);
        setCreditosState(list);
      }));

      // Listen to Abonos
      unsubs.push(onSnapshot(collection(db, 'abonos'), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        list.sort(sortByIdOrItem);
        setAbonosState(list);
      }));

      // Listen to Egresos
      unsubs.push(onSnapshot(collection(db, 'egresos'), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        list.sort(sortByIdOrItem);
        setEgresosState(list);
      }));

      // Listen to Transfers
      unsubs.push(onSnapshot(collection(db, 'transfers'), (snapshot) => {
        const list = snapshot.docs.map(doc => doc.data());
        list.sort(sortByIdOrItem);
        setTransfersState(list);
      }));

      // Listen to Tasas
      unsubs.push(onSnapshot(collection(db, 'config'), (snapshot) => {
        const docObj = snapshot.docs.find(d => d.id === 'tasas');
        if (docObj) {
          const data = docObj.data();
          setTasasState({
            bcv: data.bcv,
            euro: data.euro,
            binance: data.binance
          });
        }
      }));

      return () => {
        unsubs.forEach(unsub => unsub());
      };

    } else {
      // LocalStorage Fallback Initialization
      const storedVendedores = localStorage.getItem('cxc_vendedores');
      const storedVentas = localStorage.getItem('cxc_ventas');
      const storedCreditos = localStorage.getItem('cxc_creditos');
      const storedAbonos = localStorage.getItem('cxc_abonos');
      const storedEgresos = localStorage.getItem('cxc_egresos');
      const storedTasas = localStorage.getItem('cxc_tasas');
      const storedTransfers = localStorage.getItem('cxc_transfers');

      if (storedVendedores && storedVentas && storedCreditos && storedAbonos && storedEgresos) {
        setVendedoresState(JSON.parse(storedVendedores));
        setVentasState(JSON.parse(storedVentas));
        setCreditosState(JSON.parse(storedCreditos));
        setAbonosState(JSON.parse(storedAbonos));
        setEgresosState(JSON.parse(storedEgresos));
        if (storedTasas) setTasasState(JSON.parse(storedTasas));
        if (storedTransfers) setTransfersState(JSON.parse(storedTransfers));
      } else {
        // Initial setup from initialDb.js
        const initialSellers = initialDb.meta.vendedores.map(name => ({
          id: name.toLowerCase().replace(/\s+/g, '_'),
          nombre: name,
          fechaCreado: '2026-05-07',
        }));
        setVendedoresState(initialSellers);

        const initialVentas = initialDb.ventas_store.map((v, idx) => ({
          id: `venta_h_${idx}`,
          fecha: v.fecha,
          semana: v.semana,
          bolivares: v.bolivares,
          tasa: v.tasa,
          efectivo_usd: v.efectivo_usd,
          zelle: v.zelle,
          cxc: v.cxc,
          venta_diaria: v.venta_diaria,
          venta_real_tienda: v.venta_real_tienda,
          cuenta_bs: 'banco_bs',
          cuenta_usd: v.zelle > 0 ? 'banco_usd' : 'caja_usd',
        }));
        setVentasState(initialVentas);

        const initialCreditos = initialDb.cxc_notes.map((c, idx) => ({
          id: `credito_h_${idx}`,
          nota: c.nota,
          fecha: c.fecha,
          cliente_vendedor: c.cliente_vendedor,
          monto: c.monto,
          total_nota: c.total_nota,
          estado: 'pendiente',
        }));
        setCreditosState(initialCreditos);

        const initialAbonos = initialDb.abonos.map((a, idx) => {
          let cuenta_destino = 'caja_usd';
          if (a.zelle > 0) {
            cuenta_destino = 'banco_usd';
          } else if (a.bolivares > 0) {
            cuenta_destino = 'banco_bs';
          }
          return {
            id: `abono_h_${idx}`,
            vendedor: a.vendedor,
            fecha: a.fecha,
            bolivares: a.bolivares,
            tasa: a.tasa,
            usd_conv: a.usd_conv,
            efectivo_usd: a.efectivo_usd,
            zelle: a.zelle,
            monto_total_usd: a.monto_total_usd,
            cuenta: cuenta_destino,
          };
        });
        setAbonosState(initialAbonos);

        const initialEgresos = initialDb.expenses.map((e, idx) => {
          let cuenta_origen = 'caja_usd';
          const det = e.detalle.toLowerCase();
          if (e.bolivares > 0) {
            cuenta_origen = 'banco_bs';
          } else if (det.includes('zelle')) {
            cuenta_origen = 'banco_usd';
          }
          return {
            id: `gasto_h_${idx}`,
            fecha: e.fecha,
            nota: e.nota,
            bolivares: e.bolivares,
            dolares: e.dolares,
            detalle: e.detalle,
            cuenta: cuenta_origen,
          };
        });
        setEgresosState(initialEgresos);

        setTransfersState([]);
        setTasasState({
          bcv: 523.67,
          euro: 609.34,
          binance: 712.74,
        });
      }
    }
  }, [isFirebaseMode]);

  // Calculations for CXC Balances
  // Calculate each salesperson's credits, abonos and pending debt
  const getSalespersonBalances = () => {
    const list = {};
    
    // Seed list with current sellers
    vendedores.forEach(v => {
      list[v.nombre.toUpperCase()] = {
        nombre: v.nombre,
        credito: 0,
        abono: 0,
        pendiente: 0,
      };
    });

    // Add extra sellers from historic data if not present
    const extraSellers = ["DONACION", "GARANTIA"];
    extraSellers.forEach(s => {
      list[s] = { nombre: s, credito: 0, abono: 0, pendiente: 0 };
    });

    // Sum Credits
    creditos.forEach(c => {
      const clientName = (c.cliente_vendedor || 'OTRO').toUpperCase();
      if (!list[clientName]) {
        list[clientName] = { nombre: c.cliente_vendedor, credito: 0, abono: 0, pendiente: 0 };
      }
      list[clientName].credito += c.monto;
    });

    // Sum Abonos
    abonos.forEach(a => {
      let clientName = (a.vendedor || 'OTRO').toUpperCase();
      // Match common names
      if (clientName.includes("JESUS RUIZ") || clientName === "JESUS") clientName = "JESUS RUIZ 1";
      if (clientName.includes("ISAAC") || clientName.includes("ISACC")) clientName = "ISAAC RANGEL 2";
      if (clientName.includes("BETSY") || clientName.includes("BETSI")) clientName = "BETSI";
      if (clientName.includes("ELIZABETH")) clientName = "ELIZABETH G";
      if (clientName.includes("DANYELLO") || clientName.includes("DANYELO")) clientName = "DANYELLO C";
      if (clientName.includes("TOTI") || clientName.includes("TOTY")) clientName = "TOTY";

      if (!list[clientName]) {
        list[clientName] = { nombre: a.vendedor, credito: 0, abono: 0, pendiente: 0 };
      }
      list[clientName].abono += a.monto_total_usd;
    });

    // Calculate Pendiente
    Object.keys(list).forEach(key => {
      list[key].pendiente = list[key].credito - list[key].abono;
    });

    return Object.values(list);
  };

  // Liquidity and Accounts Ledger Calculations
  const getAccountBalances = () => {
    // Initial balances from Excel
    let cajaUsd = 158.0;
    let cajaBs = 490.0;
    let bancoBs = 0.0;
    let bancoUsd = 0.0;

    // Process Wendy Store Sales
    ventas.forEach(v => {
      // Bs sale went to Bank Bs
      bancoBs += v.bolivares;
      // USD went to Caja Usd or Banco Usd depending on destination
      if (v.cuenta_usd === 'banco_usd') {
        bancoUsd += v.zelle;
      } else {
        cajaUsd += v.efectivo_usd;
      }
    });

    // Process Abonos (payments from sellers)
    abonos.forEach(a => {
      const amountUsd = a.efectivo_usd + a.zelle + a.usd_conv;
      if (a.cuenta === 'caja_usd') {
        cajaUsd += a.efectivo_usd;
      } else if (a.cuenta === 'banco_usd') {
        bancoUsd += a.zelle;
      } else if (a.cuenta === 'banco_bs') {
        bancoBs += a.bolivares;
      } else if (a.cuenta === 'caja_bs') {
        cajaBs += a.bolivares;
      }
    });

    // Process Expenses (deductions)
    egresos.forEach(e => {
      if (e.cuenta === 'caja_usd') {
        cajaUsd -= e.dolares;
      } else if (e.cuenta === 'banco_usd') {
        bancoUsd -= e.dolares;
      } else if (e.cuenta === 'banco_bs') {
        bancoBs -= e.bolivares;
      } else if (e.cuenta === 'caja_bs') {
        cajaBs -= e.bolivares;
      }
    });

    // Process Account Transfers
    transfers.forEach(t => {
      const amt = t.monto;
      // Deduct from source
      if (t.desde === 'caja_usd') cajaUsd -= amt;
      else if (t.desde === 'caja_bs') cajaBs -= amt;
      else if (t.desde === 'banco_usd') bancoUsd -= amt;
      else if (t.desde === 'banco_bs') bancoBs -= amt;

      // Add to destination
      if (t.hacia === 'caja_usd') cajaUsd += amt;
      else if (t.hacia === 'caja_bs') cajaBs += amt;
      else if (t.hacia === 'banco_usd') bancoUsd += amt;
      else if (t.hacia === 'banco_bs') bancoBs += amt;
    });

    return {
      cajaUsd,
      cajaBs,
      bancoBs,
      bancoUsd,
      totalUsd: cajaUsd + bancoUsd,
      totalBs: cajaBs + bancoBs,
    };
  };

  // Backups export
  const exportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      vendedores, ventas, creditos, abonos, egresos, tasas, transfers
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CxC_Liquidez_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Backups import
  const importBackup = (e) => {
    const fileReader = new FileReader();
    fileReader.readAsText(e.target.files[0], "UTF-8");
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.vendedores && parsed.ventas && parsed.creditos && parsed.abonos && parsed.egresos) {
          setVendedores(parsed.vendedores);
          setVentas(parsed.ventas);
          setCreditos(parsed.creditos);
          setAbonos(parsed.abonos);
          setEgresos(parsed.egresos);
          if (parsed.tasas) setTasas(parsed.tasas);
          if (parsed.transfers) setTransfers(parsed.transfers);
          alert('¡Copia de seguridad restaurada con éxito!');
        } else {
          alert('El archivo JSON no tiene la estructura correcta.');
        }
      } catch (err) {
        alert('Error al leer el archivo de copia de seguridad.');
      }
    };
  };

  const balances = getAccountBalances();
  const salespersonBalances = getSalespersonBalances();

  // Render subview
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            balances={balances} 
            tasas={tasas} 
            setTasas={setTasas} 
            ventas={ventas} 
            egresos={egresos} 
            cxcTotal={salespersonBalances.reduce((sum, s) => sum + s.pendiente, 0)}
          />
        );
      case 'cajabancos':
        return (
          <CajaBancos 
            balances={balances}
            ventas={ventas}
            abonos={abonos}
            egresos={egresos}
            transfers={transfers}
            setTransfers={setTransfers}
          />
        );
      case 'cxc':
        return (
          <CxC 
            salespersonBalances={salespersonBalances}
            vendedores={vendedores}
            setVendedores={setVendedores}
            creditos={creditos}
            setCreditos={setCreditos}
            abonos={abonos}
            setAbonos={setAbonos}
            tasas={tasas}
          />
        );
      case 'egresos':
        return (
          <Egresos 
            egresos={egresos}
            setEgresos={setEgresos}
            tasas={tasas}
          />
        );
      case 'ventastienda':
        return (
          <VentasTienda 
            ventas={ventas}
            setVentas={setVentas}
            tasas={tasas}
          />
        );
      case 'recibos':
        return (
          <Recibos 
            abonos={abonos}
          />
        );
      case 'reportes':
        return (
          <Reportes 
            ventas={ventas}
            egresos={egresos}
            abonos={abonos}
            creditos={creditos}
            salespersonBalances={salespersonBalances}
            balances={balances}
          />
        );
      default:
        return <Dashboard balances={balances} tasas={tasas} setTasas={setTasas} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">C</div>
          <span className="logo-text">Gesti&oacute;n de CxC</span>
        </div>

        {/* Database Connection Status Banner */}
        <div style={{ padding: '0.25rem 1rem 0.75rem 1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '2rem',
            fontSize: '0.72rem',
            fontWeight: '600',
            backgroundColor: isFirebaseMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: isFirebaseMode ? '#10b981' : '#f59e0b',
            border: `1px solid ${isFirebaseMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isFirebaseMode ? '#10b981' : '#f59e0b',
              boxShadow: isFirebaseMode ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
            }}></span>
            {isFirebaseMode ? 'Sincronizado con Firebase' : 'Modo Local (Configurar .env)'}
          </div>
        </div>
        
        <nav>
          <ul className="nav-links">
            <li className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('dashboard')}>
                📊 Dashboard
              </button>
            </li>
            <li className={`nav-item ${activeView === 'cajabancos' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('cajabancos')}>
                🏦 Caja y Bancos
              </button>
            </li>
            <li className={`nav-item ${activeView === 'cxc' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('cxc')}>
                🤝 Cuentas por Cobrar
              </button>
            </li>
            <li className={`nav-item ${activeView === 'egresos' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('egresos')}>
                💸 Control de Egresos
              </button>
            </li>
            <li className={`nav-item ${activeView === 'ventastienda' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('ventastienda')}>
                🏪 Ventas Wendy
              </button>
            </li>
            <li className={`nav-item ${activeView === 'recibos' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('recibos')}>
                🧾 Recibos de Pago
              </button>
            </li>
            <li className={`nav-item ${activeView === 'reportes' ? 'active' : ''}`}>
              <button onClick={() => setActiveView('reportes')}>
                📈 Reportes Cierre
              </button>
            </li>
          </ul>
        </nav>

        {/* Footer Backup Tools */}
        <div className="nav-footer">
          <button className="nav-footer-btn" onClick={exportBackup}>
            💾 Exportar Respaldo
          </button>
          <label className="nav-footer-btn" style={{ textAlign: 'center', cursor: 'pointer' }}>
            📂 Importar Respaldo
            <input type="file" accept=".json" onChange={importBackup} style={{ display: 'none' }} />
          </label>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
