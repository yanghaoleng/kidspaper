import React, { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
const dialogStack = [];
let scrollLocks = 0,
  initialOverflow = "";

// Keep the dialog mounted through its exit. Latest callbacks also keep keyboard
// navigation aligned with the selected paper, instead of capturing the first one.
export default function PlanetModal({
  open,
  onClose,
  onNext,
  onPrevious,
  label,
  children,
}) {
  const [present, setPresent] = useState(open),
    [shown, setShown] = useState(false);
  const ref = useRef(),
    callbacks = useRef({ onClose, onNext, onPrevious, open });
  callbacks.current = { onClose, onNext, onPrevious, open };
  useEffect(() => {
    let first, second, timer;
    if (open) {
      setPresent(true);
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setShown(true));
      });
    } else {
      setShown(false);
      timer = setTimeout(() => setPresent(false), 240);
    }
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
      clearTimeout(timer);
    };
  }, [open]);
  useEffect(() => {
    if (!present) return;
    const previous = document.activeElement;
    if (scrollLocks++ === 0) {
      initialOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialogStack.push(ref.current);
    ref.current?.focus({ preventScroll: true });
    const handle = (event) => {
      if (!callbacks.current.open || dialogStack.at(-1) !== ref.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        callbacks.current.onClose();
        return;
      }
      const editing =
        event.target instanceof Element &&
        event.target.closest('input,textarea,select,[contenteditable="true"]');
      if (!editing && !event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === "ArrowRight" && callbacks.current.onNext) {
          event.preventDefault();
          callbacks.current.onNext();
          return;
        }
        if (event.key === "ArrowLeft" && callbacks.current.onPrevious) {
          event.preventDefault();
          callbacks.current.onPrevious();
          return;
        }
      }
      if (event.key === "Tab") {
        const items = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ].filter((item) => item.getClientRects().length);
        if (!items.length) {
          event.preventDefault();
          return;
        }
        const first = items[0],
          last = items[items.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    const dialog = ref.current;
    return () => {
      const i = dialogStack.indexOf(dialog);
      if (i !== -1) dialogStack.splice(i, 1);
      if (--scrollLocks === 0) document.body.style.overflow = initialOverflow;
      document.removeEventListener("keydown", handle);
      const restore = previous?.classList?.contains("globe-light")
        ? document.querySelector('.globe-light[aria-pressed="true"]')
        : previous;
      if (
        restore?.isConnected &&
        (dialog.contains(document.activeElement) ||
          document.activeElement === document.body)
      )
        restore.focus({ preventScroll: true });
    };
  }, [present]);
  if (!present) return null;
  return (
    <div
      className="modal-backdrop planet-modal-backdrop"
      data-shown={shown && open ? "true" : "false"}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal planet-modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={ref}
      >
        <button
          className="icon-button"
          aria-label="Close / 关闭对话框"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        {children}
      </section>
    </div>
  );
}
