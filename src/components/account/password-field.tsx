"use client";

import { useId, useState } from "react";
import { passwordMaxLength } from "@/lib/auth/credentials";

export function PasswordField({
  label, name, autoComplete,
}: {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const toggleLabel = `${visible ? "Hide" : "Show"} ${label.toLowerCase()}`;

  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input id={id} name={name} type={visible ? "text" : "password"}
          autoComplete={autoComplete} maxLength={passwordMaxLength} required />
        <button type="button" aria-label={toggleLabel} aria-controls={id}
          onClick={() => setVisible((current) => !current)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
