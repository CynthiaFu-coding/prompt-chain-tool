"use client";

import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";

function apply(mode: Mode) {
    const dark =
        mode === "dark" ||
        (mode === "system" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
}

export default function ThemeToggle() {
    const [mode, setMode] = useState<Mode>("system");

    // Load the saved choice once the page is on screen.
    useEffect(() => {
        try {
            const saved = localStorage.getItem("theme");
            if (saved === "light" || saved === "dark" || saved === "system") {
                setMode(saved);
            }
        } catch {}
    }, []);

    // Apply the choice, and follow the computer's setting while in "system".
    useEffect(() => {
        apply(mode);
        if (mode !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => apply("system");
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, [mode]);

    function choose(next: Mode) {
        setMode(next);
        try {
            localStorage.setItem("theme", next);
        } catch {}
    }

    return (
        <select
            aria-label="Theme"
            value={mode}
            onChange={(e) => choose(e.target.value as Mode)}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    );
}