export const isEditableKeyboardTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
    ),
  );

export const keyBoardNavigation = (
  keyCode: string,
  next: () => void,
  prev: () => void,
): void => {
  (keyCode === "ArrowRight" || keyCode === "Space") && next();
  keyCode === "ArrowLeft" && prev();
};

export const keyBoardFullscreen = (keyCode: string) => {
  if (keyCode === "KeyF") {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};
