// ui.js — Render de pestañas y clic-en-error. Sin lógica de análisis.

const $ = (id) => document.getElementById(id);

function celda(tr, texto) {
  const td = document.createElement('td');
  td.textContent = texto;
  tr.appendChild(td);
}

function tabla(cabeceras, filas) {
  const t = document.createElement('table');
  const head = t.createTHead().insertRow();
  cabeceras.forEach((h) => { const th = document.createElement('th'); th.textContent = h; head.appendChild(th); });
  const body = t.createTBody();
  filas.forEach((fila) => { const tr = body.insertRow(); fila.forEach((v) => celda(tr, v)); });
  return t;
}

export function renderTokens(tokens) {
  const cont = $('panel-tokens');
  cont.replaceChildren(
    tabla(['#', 'Tipo', 'Valor', 'Línea', 'Col'],
      tokens.map((t, i) => [i + 1, t.tipo, t.valor, t.linea, t.columna])));
}

// ----- AST colapsable -----
function resumen(n) {
  const datos = [];
  if (n.nombre !== undefined) datos.push(n.nombre);
  if (n.op !== undefined) datos.push(n.op);
  if (n.tipoDato !== undefined) datos.push(`${n.tipoDato}: ${JSON.stringify(n.valor)}`);
  const pos = n.linea ? ` [${n.linea}:${n.columna}]` : '';
  return `${n.tipo}${datos.length ? ' ' + datos.join(' ') : ''}${pos}`;
}

const esNodo = (v) => v && typeof v === 'object' && typeof v.tipo === 'string';

function nodoDOM(n, etiqueta) {
  const hijos = [];
  for (const [clave, v] of Object.entries(n)) {
    if (esNodo(v)) hijos.push([clave, v]);
    else if (Array.isArray(v)) v.forEach((x) => esNodo(x) && hijos.push([clave, x]));
  }
  const texto = (etiqueta ? etiqueta + ': ' : '') + resumen(n);
  if (!hijos.length) {
    const d = document.createElement('div');
    d.className = 'hoja';
    d.textContent = texto;
    return d;
  }
  const det = document.createElement('details');
  det.open = true;
  const sum = document.createElement('summary');
  sum.textContent = texto;
  det.appendChild(sum);
  hijos.forEach(([clave, h]) => det.appendChild(nodoDOM(h, clave)));
  return det;
}

export function renderAST(ast, hayErrorSintactico) {
  const cont = $('panel-ast');
  if (!ast) {
    cont.textContent = hayErrorSintactico
      ? 'No se generó AST: el análisis sintáctico falló (ver pestaña Errores).'
      : 'Sin AST.';
    return;
  }
  cont.replaceChildren(nodoDOM(ast, ''));
}

export function renderSimbolos(simbolos) {
  const cont = $('panel-simbolos');
  if (!simbolos.length) { cont.textContent = 'Sin símbolos.'; return; }
  cont.replaceChildren(
    tabla(['Nombre', 'Tipo', 'Ámbito', 'Línea'],
      simbolos.map((s) => [s.nombre, s.tipo, s.ambito, s.linea])));
}

export function renderErrores(errores, alClic) {
  const cont = $('panel-errores');
  if (!errores.length) {
    cont.innerHTML = '<p class="ok">✔ Sin errores</p>';
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'errores';
  errores.forEach((e) => {
    const li = document.createElement('li');
    li.className = e.tipo.toLowerCase();
    li.textContent = `[${e.tipo}] línea ${e.linea}, col ${e.columna} — ${e.mensaje}`;
    li.addEventListener('click', () => alClic(e));
    ul.appendChild(li);
  });
  cont.replaceChildren(ul);
}

export function renderBadges(errores) {
  const cuenta = { LEXICO: 0, SINTACTICO: 0, SEMANTICO: 0 };
  errores.forEach((e) => cuenta[e.tipo]++);
  $('badges').innerHTML =
    `<span class="badge lexico">Léxicos: ${cuenta.LEXICO}</span>` +
    `<span class="badge sintactico">Sintácticos: ${cuenta.SINTACTICO}</span>` +
    `<span class="badge semantico">Semánticos: ${cuenta.SEMANTICO}</span>`;
}

// Selecciona la línea del error en el textarea y hace scroll hasta ella.
export function irAPosicion(textarea, linea, columna) {
  const lineas = textarea.value.split('\n');
  let inicio = 0;
  for (let i = 0; i < linea - 1 && i < lineas.length; i++) inicio += lineas[i].length + 1;
  const fin = inicio + (lineas[linea - 1] ?? '').length;
  textarea.focus();
  textarea.setSelectionRange(inicio, fin);
  const alto = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
  textarea.scrollTop = Math.max(0, (linea - 3) * alto);
}

export function iniciarPestanas() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('activa', b === btn));
      document.querySelectorAll('.panel').forEach((p) =>
        p.classList.toggle('activo', p.id === 'panel-' + btn.dataset.tab));
    });
  });
}
