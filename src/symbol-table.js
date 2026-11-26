// symbol-table.js — Pila de ámbitos anidados.

export class TablaSimbolos {
  constructor() {
    this.pila = [new Map()]; // ámbito 0 = global
    this.historial = [];     // todo lo declarado, para la pestaña de UI
  }

  entrarAmbito() { this.pila.push(new Map()); }
  salirAmbito()  { this.pila.pop(); }

  // 🔧 PUNTO DE MODIFICACIÓN EN VIVO
  // Declara en el ámbito actual. Devuelve false si ya existe (redeclaración).
  // Para prohibir redeclaración global o cambiar la regla, editar solo aquí.
  declarar(nombre, info) {
    const actual = this.pila[this.pila.length - 1];
    if (actual.has(nombre)) return false;
    actual.set(nombre, info);
    const nivel = this.pila.length - 1;
    this.historial.push({
      nombre,
      tipo: info.tipo,
      ambito: nivel === 0 ? 'global' : `bloque (nivel ${nivel})`,
      linea: info.linea,
    });
    return true;
  }

  // Busca del ámbito actual hacia los externos; null si no existe.
  resolver(nombre) {
    for (let i = this.pila.length - 1; i >= 0; i--) {
      if (this.pila[i].has(nombre)) return this.pila[i].get(nombre);
    }
    return null;
  }

  // Devuelve el ámbito actual (para mensajes de redeclaración).
  enActual(nombre) {
    return this.pila[this.pila.length - 1].get(nombre) || null;
  }

  // [{ nombre, tipo, ambito, linea }]
  snapshot() { return this.historial.slice(); }
}
