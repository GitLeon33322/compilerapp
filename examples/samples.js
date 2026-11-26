// samples.js — Ejemplos precargados: 1 válido + 1 por tipo de error.
export const EJEMPLOS = {
  valido: {
    nombre: 'Válido (sin errores)',
    codigo: `// Programa válido
let contador = 0;
let limite = 5;
let saludo = "hola";
let activo = true;
while (contador < limite) {
  let doble = contador * 2;
  if (doble >= 4 && activo) {
    saludo = saludo + "!";
  } else {
    activo = !activo;
  }
  contador = contador + 1;
}
let resultado = (contador + 1) * 3 - 2 / 1;
`,
  },
  error_lexico: {
    nombre: 'Error léxico ($)',
    codigo: `let a = 10;
let b = $5;
let c = a + b;
`,
  },
  error_sintactico: {
    nombre: 'Error sintáctico (falta ;)',
    codigo: `let a = 10;
let b = 20
let c = a + b;
`,
  },
  error_semantico_tipo: {
    nombre: 'Error semántico (tipos)',
    codigo: `let x = "texto" + 5;
let y = 1;
if (y) {
  y = 2;
}
`,
  },
  error_semantico_uso: {
    nombre: 'Error semántico (uso/redeclaración)',
    codigo: `let a = 1;
let b = z + a;
let a = 2;
{
  let a = 3;
}
`,
  },
};
