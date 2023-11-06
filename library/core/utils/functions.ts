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
  slideIndex: number | false;
  fragmentIndex: number | false;
} => {
  const parts = input.split("/");
  parts.shift();
  const result: {
    slideIndex: number | false;
    fragmentIndex: number | false;
  } = { slideIndex: false, fragmentIndex: false };
  if (parts.length >= 2) {
    const slideIndex = parseInt(parts[0]);
    const fragmentIndex = parseInt(parts[1]);
    if (!isNaN(slideIndex)) {
      result.slideIndex = slideIndex;
    }

    if (!isNaN(fragmentIndex)) {
      result.fragmentIndex = fragmentIndex;
    }
  }

  return result;
};
