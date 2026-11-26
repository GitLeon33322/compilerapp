// semantic.js — Recorre el AST con la tabla de símbolos.
// Recolecta TODOS los errores semánticos (no se detiene en el primero).
import { crearError } from './errors.js';
import { TablaSimbolos } from './symbol-table.js';

export function analizarSemantica(ast) {
  const tabla = new TablaSimbolos();
  const errores = [];
  const error = (mensaje, nodo) =>
    errores.push(crearError('SEMANTICO', mensaje, nodo.linea, nodo.columna));

  // 🔧 PUNTO DE MODIFICACIÓN EN VIVO
  // Decisión: la condición de if/while debe ser estrictamente booleana.
  // Para permitir numérica: aceptar también `t === 'numero'` en el if de abajo.
  function verificarCondicion(expr, estructura) {
    const t = tipoDe(expr);
    if (t !== 'booleano' && t !== 'desconocido') {
      error(`La condición de '${estructura}' debe ser booleana, pero es ${t}`, expr);
    }
  }

  // Infiere el tipo de una expresión. Ante un error devuelve 'desconocido'
  // para no encadenar errores falsos.
  function tipoDe(n) {
    switch (n.tipo) {
      case 'Literal': return n.tipoDato;
      case 'Identificador': {
        const s = tabla.resolver(n.nombre);
        if (!s) { error(`Variable '${n.nombre}' usada antes de ser declarada`, n); return 'desconocido'; }
        return s.tipo;
      }
      case 'Unaria': return tipoUnaria(n);
      case 'Binaria': return tipoBinaria(n);
      default: return 'desconocido';
    }
  }

  function tipoUnaria(n) {
    const t = tipoDe(n.operando);
    if (t === 'desconocido') return n.op === '!' ? 'booleano' : 'numero';
    if (n.op === '!') {
      if (t === 'booleano') return 'booleano';
      error(`El operador '!' solo aplica a booleanos, no a ${t}`, n);
      return 'desconocido';
    }
    if (t === 'numero') return 'numero'; // menos unario
    error(`El operador '-' unario solo aplica a números, no a ${t}`, n);
    return 'desconocido';
  }

  function tipoBinaria(n) {
    const a = tipoDe(n.izq);
    const b = tipoDe(n.der);
    const hayDesconocido = a === 'desconocido' || b === 'desconocido';
    const incompat = () =>
      error(`Operación '${n.op}' incompatible entre ${a} y ${b}`, n);

    switch (n.op) {
      case '+':
        if (hayDesconocido) return a !== 'desconocido' ? a : b;
        if (a === b && (a === 'numero' || a === 'cadena')) return a;
        incompat(); return 'desconocido';
      case '-': case '*': case '/':
        if (hayDesconocido) return 'numero';
        if (a === 'numero' && b === 'numero') return 'numero';
        incompat(); return 'desconocido';
      case '<': case '<=': case '>': case '>=':
        if (hayDesconocido) return 'booleano';
        if (a === 'numero' && b === 'numero') return 'booleano';
        incompat(); return 'desconocido';
      case '==': case '!=':
        if (hayDesconocido || a === b) return 'booleano';
        incompat(); return 'desconocido';
      case '&&': case '||':
        if (hayDesconocido) return 'booleano';
        if (a === 'booleano' && b === 'booleano') return 'booleano';
        incompat(); return 'desconocido';
      default: return 'desconocido';
    }
  }

  function recorrer(n) {
    switch (n.tipo) {
      case 'Programa':
        n.cuerpo.forEach(recorrer);
        break;
      case 'Declaracion': {
        // Primero la expresión: `let x = x + 1;` debe marcar x como no declarada.
        const t = tipoDe(n.valor);
        if (!tabla.declarar(n.nombre, { tipo: t, linea: n.linea, columna: n.columna })) {
          const previa = tabla.enActual(n.nombre);
          error(`La variable '${n.nombre}' ya fue declarada en este ámbito (línea ${previa.linea})`, n);
        }
        break;
      }
      case 'Asignacion': {
        const t = tipoDe(n.valor);
        const s = tabla.resolver(n.nombre);
        if (!s) { error(`Variable '${n.nombre}' usada antes de ser declarada`, n); break; }
        if (t !== 'desconocido' && s.tipo !== 'desconocido' && t !== s.tipo) {
          error(`No se puede asignar ${t} a '${n.nombre}' (es ${s.tipo})`, n);
        }
        break;
      }
      case 'If':
        verificarCondicion(n.condicion, 'if');
        recorrer(n.entonces);
        if (n.sino) recorrer(n.sino);
        break;
      case 'While':
        verificarCondicion(n.condicion, 'while');
        recorrer(n.cuerpo);
        break;
      case 'Bloque':
        tabla.entrarAmbito();
        n.cuerpo.forEach(recorrer);
        tabla.salirAmbito();
        break;
    }
  }

  recorrer(ast);
  return { errores, tablaSimbolos: tabla.snapshot() };
}
