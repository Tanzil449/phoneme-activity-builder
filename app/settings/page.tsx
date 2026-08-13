"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1];

    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  function changeTheme(selectedTheme: string) {
    setTheme(selectedTheme);

    document.cookie = `theme=${selectedTheme}; path=/; max-age=31536000`;

    document.documentElement.setAttribute(
      "data-theme",
      selectedTheme
    );
  }

  return (
    <main>
      <h1>Settings</h1>

      <p>
        Choose your preferred appearance for the Phoneme Activity Builder.
      </p>

      <section>
        <h2>Theme</h2>

        <label>
          <input
            type="radio"
            name="theme"
            checked={theme === "light"}
            onChange={() => changeTheme("light")}
          />
          Light Mode
        </label>

        <br />
        <br />

        <label>
          <input
            type="radio"
            name="theme"
            checked={theme === "dark"}
            onChange={() => changeTheme("dark")}
          />
          Dark Mode
        </label>

        <p>
          Current theme: <strong>{theme}</strong>
        </p>
      </section>
    </main>
  );
}