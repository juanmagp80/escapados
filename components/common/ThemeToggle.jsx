"use client";

import { useEffect, useState } from "react";

// Toggle de tema claro/oscuro autónomo: gestiona su propio estado y
// sincroniza la clase .dark del <html> con localStorage.
export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setDark(document.documentElement.classList.contains("dark"));
    }, []);

    function toggle() {
        const nextDark = !dark;
        setDark(nextDark);
        document.documentElement.classList.toggle("dark", nextDark);
        try {
            localStorage.setItem("escapa2-theme", nextDark ? "dark" : "light");
        } catch {
            // ignore
        }
    }

    return (
        <button
            onClick={toggle}
            className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-nightBorder"
            title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {dark ? "☀️" : "🌙"}
        </button>
    );
}