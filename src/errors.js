// errors.js — Formato único de error para las tres fases.
// { tipo: 'LEXICO' | 'SINTACTICO' | 'SEMANTICO', mensaje, linea, columna }

export function crearError(tipo, mensaje, linea, columna) {
  return { tipo, mensaje, linea, columna };
}
