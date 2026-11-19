"use client";

import { useRef } from "react";

export function MobileNavigation() {
  const menuRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  return (
    <details
      ref={menuRef}
      className="mobile-menu"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeMenu();
          menuRef.current?.querySelector("summary")?.focus();
        }
      }}
    >
      <summary aria-label="Toggle navigation">
        <span />
        <span />
        <span />
      </summary>
      <nav aria-label="Mobile navigation">
        <a href="/login" onClick={closeMenu}>
          Sign in
        </a>
        <a href="#features" onClick={closeMenu}>
          Features
        </a>
        <a href="#how-it-works" onClick={closeMenu}>
          How It Works
        </a>
        <a href="#demo" onClick={closeMenu}>
          Sample Workspace
        </a>
        <a href="#faq" onClick={closeMenu}>
          FAQs
        </a>
      </nav>
    </details>
  );
}
