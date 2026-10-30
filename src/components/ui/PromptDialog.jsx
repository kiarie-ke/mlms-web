import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function PromptDialog({
  title,
  message,
  defaultValue = '',
  placeholder = '',
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
      if (event.key !== 'Tab') return;

      const controls = dialogRef.current?.querySelectorAll('input:not(:disabled), button:not(:disabled)');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={message ? `${id}-message` : undefined}
        className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-2xl sm:p-6"
      >
        <h2 id={`${id}-title`} className="font-display text-lg font-bold text-ink">{title}</h2>
        {message && <p id={`${id}-message`} className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{message}</p>}
        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(value);
          }}
        >
          <input
            ref={inputRef}
            className="input"
            aria-label={title}
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={onCancel}>{cancelText}</button>
            <button type="submit" className="btn-primary">{confirmText}</button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
