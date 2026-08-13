"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <div className="brand">Phoneme Activity Builder</div>

        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link href="/" onClick={closeMenu}>
          Home
        </Link>

        <Link href="/wordle" onClick={closeMenu}>
          Wordle
        </Link>

        <Link href="/word-search" onClick={closeMenu}>
          Word Search
        </Link>

        <Link href="/about" onClick={closeMenu}>
          About
        </Link>

        <Link href="/settings" onClick={closeMenu}>
          Settings
        </Link>
      </div>
    </nav>
  );
}