/** Reject release clicks inherited from a control removed by a modal transition. */
export function dialogActivation() {
  let pressed: { button: HTMLButtonElement; pointerId: number } | undefined;
  return {
    press(event: PointerEvent) {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      pressed = event.button === 0 && button && !button.disabled ? { button, pointerId: event.pointerId } : undefined;
    },
    cancel() { pressed = undefined; },
    click(event: MouseEvent) {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      const origin = pressed; pressed = undefined;
      if (!button || event.detail === 0 || (origin?.button === button && (!(event instanceof PointerEvent) || origin.pointerId === event.pointerId))) return;
      event.preventDefault(); event.stopPropagation();
    },
  };
}
