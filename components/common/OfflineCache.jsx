"use client";

import { useEffect, useState } from "react";

// Caché offline: guarda en IndexedDB los favoritos y el último itinerario
// para consultarlos sin conexión.
const DB_NAME = "escapa2-offline";
const DB_VERSION = 1;
const STORE = "cache";

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB no disponible"));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function setItem(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getItem(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// Guarda datos importantes en IndexedDB para consulta offline.
export default function OfflineCache({ data, cacheKey }) {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        if (!data || !cacheKey) return;
        setItem(cacheKey, { data, savedAt: Date.now() })
            .then(() => setStatus("saved"))
            .catch(() => setStatus(null));
    }, [data, cacheKey]);

    if (status !== "saved") return null;

    return (
        <p className="mt-2 text-center text-[10px] text-stone-400">
            📴 Disponible sin conexión
        </p>
    );
}

export { getItem, setItem };
