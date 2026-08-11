import fs from "fs";
import os from "os";
import path from "path";

// Caché persistente en disco (por defecto /tmp, vivo entre instancias en
// desarrollo/self-host y dentro de la vida de una instancia en serverless).
// Misma interfaz que inMemoryCache, para poder intercambiarlos.
// IMPORTANTE: este módulo importa módulos de Node (fs/os/path) y solo puede
// usarse en código de servidor, nunca desde componentes cliente.
export function fileCache(
  namespace = "cache",
  ttlMs = 24 * 60 * 60 * 1000,
  dir = process.env.CACHE_DIR || path.join(os.tmpdir(), "escapa2")
) {
  const file = path.join(dir, `${namespace}.json`);
  let store = null;

  function load() {
    if (store) return store;
    try {
      store = JSON.parse(fs.readFileSync(file, "utf8")) || {};
    } catch {
      store = {};
    }
    return store;
  }

  async function persist() {
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(file, JSON.stringify(store), "utf8");
    } catch {
      // Sin permisos o entorno de solo lectura: seguimos con memoria.
    }
  }

  return {
    get(key) {
      const data = load();
      const record = data[key];
      if (!record) return null;
      if (Date.now() > record.expires) {
        delete data[key];
        return null;
      }
      return record.value;
    },
    set(key, value) {
      const data = load();
      data[key] = { value, expires: Date.now() + ttlMs };
      persist();
      return value;
    },
  };
}