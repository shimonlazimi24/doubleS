"use client";

import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from "react";

/**
 * Answer options as a radio group (WAI-ARIA radiogroup pattern).
 *
 * Every quiz used to render options as plain buttons, so a screen reader heard
 * "button, finish" with no idea it was one of four answers or which was chosen.
 * The group gives the options a name and a count, each option reports
 * aria-checked, and the arrow keys move between them like native radios:
 * one tab stop per question, Down/Right for the next option, Up/Left for the
 * previous, Home/End for the first and last.
 *
 * Selection on arrow keys is done by clicking the target option, so each quiz
 * keeps its own onClick handler and state.
 */

export function QuizOptionGroup({
  label = "אפשרויות תשובה",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  // A <div>, not <ul>: a list role would be overridden by radiogroup and its
  // <li> children would then be orphans (axe "listitem"). Children are <div>s.
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {children}
    </div>
  );
}

/** One tab stop per group: the checked option, or the first one when nothing is checked yet. */
export function quizOptionTabIndex(checked: boolean, index: number, anyChecked: boolean): 0 | -1 {
  if (checked) return 0;
  return !anyChecked && index === 0 ? 0 : -1;
}

function moveFocus(e: KeyboardEvent<HTMLButtonElement>) {
  const group = e.currentTarget.closest('[role="radiogroup"]');
  if (!group) return;
  const radios = Array.from(group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'));
  const at = radios.indexOf(e.currentTarget);
  if (at < 0 || radios.length === 0) return;

  let next: number | null = null;
  switch (e.key) {
    case "ArrowDown":
    case "ArrowRight":
      next = (at + 1) % radios.length;
      break;
    case "ArrowUp":
    case "ArrowLeft":
      next = (at - 1 + radios.length) % radios.length;
      break;
    case "Home":
      next = 0;
      break;
    case "End":
      next = radios.length - 1;
      break;
    default:
      return;
  }
  e.preventDefault();
  const target = radios[next];
  if (!target) return;
  target.focus();
  target.click();
}

type OptionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "role" | "type"> & {
  checked: boolean;
  /** Position in the group; with `anyChecked` decides the single tab stop. */
  index: number;
  anyChecked: boolean;
};

export function QuizOptionButton({ checked, index, anyChecked, onKeyDown, ...rest }: OptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={quizOptionTabIndex(checked, index, anyChecked)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (!e.defaultPrevented) moveFocus(e);
      }}
      {...rest}
    />
  );
}
