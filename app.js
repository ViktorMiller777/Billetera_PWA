'use strict';

/* ============================================================
   Persistencia con IndexedDB
   ============================================================ */
const DB_NOMBRE = 'mi-billetera-lite';
const DB_VERSION = 1;
const STORE = 'gastos';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOMBRE, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('fecha', 'fecha');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function transaccion(modo, fn) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, modo);
    const resultado = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(resultado.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

const agregarGasto = (gasto) => transaccion('readwrite', (s) => s.add(gasto));
const eliminarGasto = (id) => transaccion('readwrite', (s) => s.delete(id));
const obtenerGastos = () => transaccion('readonly', (s) => s.getAll());

/* ============================================================
   Interfaz
   ============================================================ */
const form = document.getElementById('form-gasto');
const inputConcepto = document.getElementById('concepto');
const inputMonto = document.getElementById('monto');
const selectCategoria = document.getElementById('categoria');
const lista = document.getElementById('lista');
const vacio = document.getElementById('vacio');
const totalEl = document.getElementById('total');
const errorEl = document.getElementById('error');

const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const formatoFecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

function mostrarError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

async function render() {
  const gastos = await obtenerGastos();

  // Más reciente primero
  gastos.sort((a, b) => b.fecha - a.fecha || b.id - a.id);

  lista.innerHTML = '';
  let total = 0;

  for (const g of gastos) {
    total += g.monto;

    const li = document.createElement('li');
    li.className = 'item';

    const info = document.createElement('div');
    info.className = 'item__info';

    const concepto = document.createElement('div');
    concepto.className = 'item__concepto';
    concepto.textContent = g.concepto; // textContent evita inyección de HTML

    const meta = document.createElement('div');
    meta.className = 'item__meta';
    meta.textContent = `${g.categoria} · ${formatoFecha.format(new Date(g.fecha))}`;

    info.append(concepto, meta);

    const monto = document.createElement('div');
    monto.className = 'item__monto';
    monto.textContent = formatoMoneda.format(g.monto);

    const borrar = document.createElement('button');
    borrar.className = 'item__borrar';
    borrar.type = 'button';
    borrar.setAttribute('aria-label', `Eliminar ${g.concepto}`);
    borrar.textContent = '✕';
    borrar.addEventListener('click', async () => {
      await eliminarGasto(g.id);
      render();
    });

    li.append(info, monto, borrar);
    lista.appendChild(li);
  }

  vacio.hidden = gastos.length > 0;
  totalEl.textContent = formatoMoneda.format(total);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const concepto = inputConcepto.value.trim();
  const monto = parseFloat(inputMonto.value);
  const categoria = selectCategoria.value;

  if (!concepto) return mostrarError('Escribe un concepto.');
  if (!Number.isFinite(monto) || monto <= 0) return mostrarError('Ingresa un monto mayor a 0.');

  mostrarError('');

  try {
    await agregarGasto({
      concepto,
      monto: Math.round(monto * 100) / 100,
      categoria,
      fecha: Date.now()
    });
    form.reset();
    inputConcepto.focus();
    render();
  } catch (err) {
    console.error(err);
    mostrarError('No se pudo guardar el gasto. Intenta de nuevo.');
  }
});

/* ============================================================
   Indicador de conexión
   ============================================================ */
const estadoRed = document.getElementById('estado-red');

function actualizarRed() {
  const online = navigator.onLine;
  estadoRed.textContent = online ? 'En línea' : 'Sin conexión';
  estadoRed.classList.toggle('offline', !online);
}
window.addEventListener('online', actualizarRed);
window.addEventListener('offline', actualizarRed);
actualizarRed();

/* ============================================================
   Instalación (botón "Instalar app")
   ============================================================ */
let promptInstalacion = null;
const btnInstalar = document.getElementById('btn-instalar');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstalacion = e;
  btnInstalar.hidden = false;
});

btnInstalar.addEventListener('click', async () => {
  if (!promptInstalacion) return;
  promptInstalacion.prompt();
  await promptInstalacion.userChoice;
  promptInstalacion = null;
  btnInstalar.hidden = true;
});

window.addEventListener('appinstalled', () => { btnInstalar.hidden = true; });

/* ============================================================
   Service Worker
   ============================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) =>
      console.error('Error al registrar el Service Worker:', err)
    );
  });
}

render();
