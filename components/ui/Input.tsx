"use client";

import React from "react";
import styles from "./Input.module.scss";

type InputProps = {
  label?: React.ReactNode;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  rightIcon?: React.ReactNode;
  onRightIconClick?: (e: React.MouseEvent) => void;
  disabled?: boolean; // NEW
};

export default function Input({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  rightIcon,
  onRightIconClick,
  disabled = false,
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
          disabled={disabled} // NEW
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
