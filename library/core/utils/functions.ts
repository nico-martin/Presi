export const generateUuidv4 = (): string =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

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

export const parseHash = (
  input: string = "",
): {
  slideReference: string | false;
  fragmentIndex: number | false;
} => {
  const result: {
    slideReference: string | false;
    fragmentIndex: number | false;
  } = { slideReference: false, fragmentIndex: false };
  const match = input.match(/^#\/([^/]+)\/([^/]+)$/);
  if (!match) return result;

  try {
    result.slideReference = decodeURIComponent(match[1]);
  } catch {
    return result;
  }

  if (/^\d+$/.test(match[2])) {
    result.fragmentIndex = Number(match[2]);
  }

  return result;
};
