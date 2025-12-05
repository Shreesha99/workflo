// components/ui/Input.tsx
"use client";

import React from "react";
import styles from "./Input.module.scss";

type InputProps = {
  label?: React.ReactNode;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  // optional right-side icon (e.g. eye toggle). We'll render it inside a container.
  rightIcon?: React.ReactNode;
  onRightIconClick?: (e: React.MouseEvent) => void;
};

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rightIcon,
  onRightIconClick,
}: InputProps) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />

        {rightIcon && (
          <button
            type="button"
            aria-label="input-action"
            onClick={onRightIconClick}
            className={styles.rightIconBtn}
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
}
