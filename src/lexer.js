// lexer.js — Analizador léxico: un ARREGLO de expresiones regulares.
import { crearError } from './errors.js';

// PUNTO DE MODIFICACIÓN EN VIVO
// Quitar un token = borrar/comentar su línea. Agregar = añadir una línea.
// El ORDEN importa: palabras reservadas antes que IDENT; operadores de
// dos caracteres antes que los de uno.
export const REGLAS = [
  { tipo: 'ESPACIO',     regex: /^[ \t]+/ },            // se ignora
  { tipo: 'SALTO',       regex: /^\r?\n/ },             // se ignora, incrementa línea
  { tipo: 'COMENTARIO',  regex: /^\/\/[^\n]*/ },        // se ignora
  { tipo: 'NUMERO',      regex: /^\d+(\.\d+)?/ },
  { tipo: 'CADENA',      regex: /^"([^"\\]|\\.)*"/ },
  { tipo: 'LET',         regex: /^let\b/ },
  { tipo: 'IF',          regex: /^if\b/ },
  { tipo: 'ELSE',        regex: /^else\b/ },
  { tipo: 'WHILE',       regex: /^while\b/ },
  { tipo: 'TRUE',        regex: /^true\b/ },
  { tipo: 'FALSE',       regex: /^false\b/ },
  { tipo: 'IDENT',       regex: /^[a-zA-Z_][a-zA-Z0-9_]*/ },
  { tipo: 'OP_IGUAL',    regex: /^==/ },                // ANTES que '='
  { tipo: 'OP_DISTINTO', regex: /^!=/ },                // ANTES que '!'
  { tipo: 'OP_MENOR_IG', regex: /^<=/ },                // ANTES que '<'
  { tipo: 'OP_MAYOR_IG', regex: /^>=/ },                // ANTES que '>'
  { tipo: 'OP_AND',      regex: /^&&/ },
  { tipo: 'OP_OR',       regex: /^\|\|/ },
  { tipo: 'ASIGNA',      regex: /^=/ },
  { tipo: 'OP_MENOR',    regex: /^</ },
  { tipo: 'OP_MAYOR',    regex: /^>/ },
  { tipo: 'OP_NOT',      regex: /^!/ },
  { tipo: 'MAS',         regex: /^\+/ },
  { tipo: 'MENOS',       regex: /^-/ },
  { tipo: 'POR',         regex: /^\*/ },
  { tipo: 'DIV',         regex: /^\// },
  { tipo: 'PAR_IZQ',     regex: /^\(/ },
  { tipo: 'PAR_DER',     regex: /^\)/ },
  { tipo: 'LLAVE_IZQ',   regex: /^\{/ },
  { tipo: 'LLAVE_DER',   regex: /^\}/ },
  { tipo: 'PUNTO_COMA',  regex: /^;/ },
];

// Tipos que se consumen pero no generan token.
const IGNORADOS = new Set(['ESPACIO', 'SALTO', 'COMENTARIO']);

// Devuelve { tokens, errores }. Recolecta TODOS los errores léxicos.
export function tokenizar(texto) {
  const tokens = [];
  const errores = [];
  let pos = 0, linea = 1, columna = 1;

  while (pos < texto.length) {
    const resto = texto.slice(pos);
    let hallado = null;

    for (const regla of REGLAS) {
      const m = regla.regex.exec(resto);
      if (m && m[0].length > 0) { hallado = { tipo: regla.tipo, lexema: m[0] }; break; }
    }

    if (!hallado) {
      errores.push(crearError('LEXICO', `Carácter inesperado '${texto[pos]}'`, linea, columna));
      pos++; columna++;
      continue;
    }

    if (!IGNORADOS.has(hallado.tipo)) {
      tokens.push({ tipo: hallado.tipo, valor: hallado.lexema, linea, columna });
    }

    // Actualizar posición según el texto consumido.
    for (const c of hallado.lexema) {
      if (c === '\n') { linea++; columna = 1; } else { columna++; }
    }
    pos += hallado.lexema.length;
  }

  tokens.push({ tipo: 'EOF', valor: '', linea, columna });
  return { tokens, errores };
}
