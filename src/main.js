// main.js — Orquestador: código → lexer → parser → semántico → UI.
import { tokenizar } from './lexer.js';
import { analizar } from './parser.js';
import { analizarSemantica } from './semantic.js';
import * as ui from './ui.js';
import { EJEMPLOS } from '../examples/samples.js';

const entrada = document.getElementById('codigo');
const selector = document.getElementById('ejemplos');

function ejecutar() {
  const codigo = entrada.value;

  const { tokens, errores: erroresLexicos } = tokenizar(codigo);
  const { ast, errores: erroresSintacticos } = analizar(tokens);

  // Si el parser falla no hay AST válido: se omite el semántico.
  let tablaSimbolos = [];
  let erroresSemanticos = [];
  if (ast) ({ tablaSimbolos, errores: erroresSemanticos } = analizarSemantica(ast));

  const errores = [...erroresLexicos, ...erroresSintacticos, ...erroresSemanticos];

  ui.renderTokens(tokens);
  ui.renderAST(ast, erroresSintacticos.length > 0);
  ui.renderSimbolos(tablaSimbolos);
  ui.renderErrores(errores, (e) => ui.irAPosicion(entrada, e.linea, e.columna));
  ui.renderBadges(errores);
}

// Ejemplos precargados
for (const [clave, ej] of Object.entries(EJEMPLOS)) {
  const op = document.createElement('option');
  op.value = clave;
  op.textContent = ej.nombre;
  selector.appendChild(op);
}
selector.addEventListener('change', () => {
  entrada.value = EJEMPLOS[selector.value].codigo;
  ejecutar();
});

ui.iniciarPestanas();
document.getElementById('analizar').addEventListener('click', ejecutar);

// Estado inicial: cargar el ejemplo válido (sin analizar automáticamente al teclear).
selector.value = 'valido';
entrada.value = EJEMPLOS.valido.codigo;
ejecutar();
