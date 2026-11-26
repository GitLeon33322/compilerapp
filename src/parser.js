// parser.js — Descenso recursivo. UNA regla de la gramática = UNA función parseX().
// Decisión consciente: se detiene en el PRIMER error sintáctico.
import { crearError } from './errors.js';

export function analizar(tokens) {
  let i = 0;

  // ---------- Helpers ----------
  const peek = () => tokens[i];
  const anterior = () => tokens[i - 1];
  const avanzar = () => { const t = tokens[i]; if (t.tipo !== 'EOF') i++; return t; };
  const coincide = (...tipos) => {
    if (tipos.includes(peek().tipo)) { avanzar(); return true; }
    return false;
  };
  const describir = (t) => (t.tipo === 'EOF' ? 'fin del archivo' : `'${t.valor}'`);
  const esperar = (tipo, msg) => {
    if (peek().tipo === tipo) return avanzar();
    const t = peek();
    throw crearError('SINTACTICO', `${msg} (se encontró ${describir(t)})`, t.linea, t.columna);
  };
  // Auxiliar para reglas binarias asociativas a la izquierda: sub ( op sub )*
  const izquierdaAsoc = (sub, tipos) => {
    let izq = sub();
    while (coincide(...tipos)) {
      const op = anterior();
      const der = sub();
      izq = { tipo: 'Binaria', op: op.valor, izq, der, linea: op.linea, columna: op.columna };
    }
    return izq;
  };

  // ---------- Reglas ----------
  // programa → sentencia* EOF
  function parsePrograma() {
    const cuerpo = [];
    while (peek().tipo !== 'EOF') cuerpo.push(parseSentencia());
    return { tipo: 'Programa', cuerpo };
  }

  // sentencia → declaracion | asignacion | if | while | bloque
  function parseSentencia() {
    switch (peek().tipo) {
      case 'LET':       return parseDeclaracion();
      case 'IDENT':     return parseAsignacion();
      case 'IF':        return parseIf();
      case 'WHILE':     return parseWhile();
      case 'LLAVE_IZQ': return parseBloque();
      default: {
        const t = peek();
        throw crearError('SINTACTICO', `Sentencia inesperada: ${describir(t)}`, t.linea, t.columna);
      }
    }
  }

  // declaracion → "let" IDENT "=" expresion ";"
  function parseDeclaracion() {
    const t = avanzar(); // let
    const nombre = esperar('IDENT', "Se esperaba un nombre de variable después de 'let'");
    esperar('ASIGNA', "Se esperaba '='");
    const valor = parseExpresion();
    esperar('PUNTO_COMA', "Se esperaba ';'");
    return { tipo: 'Declaracion', nombre: nombre.valor, valor, linea: t.linea, columna: t.columna };
  }

  // asignacion → IDENT "=" expresion ";"
  function parseAsignacion() {
    const t = avanzar(); // IDENT
    esperar('ASIGNA', "Se esperaba '='");
    const valor = parseExpresion();
    esperar('PUNTO_COMA', "Se esperaba ';'");
    return { tipo: 'Asignacion', nombre: t.valor, valor, linea: t.linea, columna: t.columna };
  }

  // 🔧 PUNTO DE MODIFICACIÓN EN VIVO
  // sentencia_if → "if" "(" expresion ")" bloque ( "else" bloque )?
  // (para "else if": en el else, si peek() es IF, usar parseIf() en lugar de parseBloque())
  function parseIf() {
    const t = avanzar(); // if
    esperar('PAR_IZQ', "Se esperaba '(' después de 'if'");
    const condicion = parseExpresion();
    esperar('PAR_DER', "Se esperaba ')'");
    const entonces = parseBloque();
    let sino = null;
    if (coincide('ELSE')) sino = parseBloque();
    return { tipo: 'If', condicion, entonces, sino, linea: t.linea, columna: t.columna };
  }

  // 🔧 PUNTO DE MODIFICACIÓN EN VIVO
  // sentencia_while → "while" "(" expresion ")" bloque
  function parseWhile() {
    const t = avanzar(); // while
    esperar('PAR_IZQ', "Se esperaba '(' después de 'while'");
    const condicion = parseExpresion();
    esperar('PAR_DER', "Se esperaba ')'");
    const cuerpo = parseBloque();
    return { tipo: 'While', condicion, cuerpo, linea: t.linea, columna: t.columna };
  }

  // bloque → "{" sentencia* "}"
  function parseBloque() {
    const t = esperar('LLAVE_IZQ', "Se esperaba '{'");
    const cuerpo = [];
    while (peek().tipo !== 'LLAVE_DER' && peek().tipo !== 'EOF') cuerpo.push(parseSentencia());
    esperar('LLAVE_DER', "Se esperaba '}'");
    return { tipo: 'Bloque', cuerpo, linea: t.linea, columna: t.columna };
  }

  // ---------- Expresiones (precedencia: de menor a mayor) ----------
  // 🔧 PUNTO DE MODIFICACIÓN EN VIVO: reordenar esta cadena cambia la precedencia.
  function parseExpresion()  { return parseOr(); }
  function parseOr()         { return izquierdaAsoc(parseAnd,        ['OP_OR']); }
  function parseAnd()        { return izquierdaAsoc(parseIgualdad,   ['OP_AND']); }
  function parseIgualdad()   { return izquierdaAsoc(parseComparacion, ['OP_IGUAL', 'OP_DISTINTO']); }
  function parseComparacion(){ return izquierdaAsoc(parseTermino,    ['OP_MENOR', 'OP_MENOR_IG', 'OP_MAYOR', 'OP_MAYOR_IG']); }
  function parseTermino()    { return izquierdaAsoc(parseFactor,     ['MAS', 'MENOS']); }
  // Para agregar '%': crear la regla PORCENTAJE en lexer.js y añadirla aquí.
  function parseFactor()     { return izquierdaAsoc(parseUnario,     ['POR', 'DIV']); }

  // unario → ( "!" | "-" ) unario | primario
  function parseUnario() {
    if (coincide('OP_NOT', 'MENOS')) {
      const op = anterior();
      const operando = parseUnario();
      return { tipo: 'Unaria', op: op.valor, operando, linea: op.linea, columna: op.columna };
    }
    return parsePrimario();
  }

  // primario → NUMERO | CADENA | "true" | "false" | IDENT | "(" expresion ")"
  function parsePrimario() {
    const t = peek();
    switch (t.tipo) {
      case 'NUMERO': avanzar();
        return { tipo: 'Literal', tipoDato: 'numero', valor: Number(t.valor), linea: t.linea, columna: t.columna };
      case 'CADENA': avanzar();
        return { tipo: 'Literal', tipoDato: 'cadena', valor: t.valor.slice(1, -1), linea: t.linea, columna: t.columna };
      case 'TRUE': case 'FALSE': avanzar();
        return { tipo: 'Literal', tipoDato: 'booleano', valor: t.tipo === 'TRUE', linea: t.linea, columna: t.columna };
      case 'IDENT': avanzar();
        return { tipo: 'Identificador', nombre: t.valor, linea: t.linea, columna: t.columna };
      case 'PAR_IZQ': {
        avanzar();
        const e = parseExpresion();
        esperar('PAR_DER', "Se esperaba ')'");
        return e;
      }
      default:
        throw crearError('SINTACTICO', `Se esperaba una expresión (se encontró ${describir(t)})`, t.linea, t.columna);
    }
  }

  // ---------- Entrada ----------
  try {
    return { ast: parsePrograma(), errores: [] };
  } catch (e) {
    if (e && e.tipo === 'SINTACTICO') return { ast: null, errores: [e] };
    throw e; // error de programación, no del código analizado
  }
}
