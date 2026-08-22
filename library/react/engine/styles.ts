export const styles = {
  wrapper: "presi-wrapper",
  slide: "presi-slide",
  fragment: "presi-fragment",
  slideBackground: "data-presi-slide-background",
  slideContent: "data-presi-slide-content",
};

export const injectBaseStyles = () => {
  if (document.getElementById("presi-base-styles")) return;

  const presiStyles = document.createElement("style");
  presiStyles.id = "presi-base-styles";
  presiStyles.innerHTML = `body {
  margin: 0;
  padding: 0;
  background-color: #000;
}

.${styles.wrapper} {
  position: fixed;
  left: 50%;
  top: 50%;
  aspect-ratio: var(--aspect-ratio);
  background-color: white;
  min-height: 0;
  overflow: hidden;
  transform: translate(-50%, -50%);
  width: 100vw;
}

.${styles.slide} {
  inset: 0;
  background-color: #fff;
  display: none;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: absolute;
  width: 100%;
  aspect-ratio: var(--aspect-ratio);
}

.${styles.slide}:has(> [${styles.slideBackground}]) {
  background-color: transparent;
}

.${styles.slide} > [${styles.slideContent}] {
  height: 100%;
  inset: 0;
  position: absolute;
  width: 100%;
}

:where(.${styles.slide} > [${styles.slideBackground}]) {
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  height: 100%;
  inset: 0;
  pointer-events: none;
  position: absolute;
  width: 100%;
}

.${styles.fragment}:not(.visible) {
  opacity: 0;
}

[data-presi-static],
[data-presi-static] *,
[data-presi-static] *::before,
[data-presi-static] *::after {
  animation: none !important;
  transition: none !important;
}`;
  document.head.appendChild(presiStyles);
};

export const injectInstanceStyles = (aspect: string) => {
  const existingPresiStyles = document.getElementById("presi-styles");
  existingPresiStyles && existingPresiStyles.remove();

  const presiStyles = document.createElement("style");
  presiStyles.id = "presi-styles";
  presiStyles.innerHTML = `@media (min-aspect-ratio: ${aspect}) {
  .${styles.wrapper} {
    width: auto;
    height: 100vh;
  }
}`;
  document.head.appendChild(presiStyles);
};
