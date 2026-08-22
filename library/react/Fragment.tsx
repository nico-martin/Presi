import React from "react";
import { SlideContext } from "./context.ts";
import type { FragmentRegistration } from "./engine/deckStore.ts";
import { styles } from "./engine/styles.ts";
import type { TransitionName } from "./engine/transitions.ts";

export interface FragmentOwnProps {
  transitionIn?: TransitionName;
  transitionOut?: TransitionName;
  order?: number;
  stepIndex?: number;
}

export type FragmentProps<T extends React.ElementType = "span"> =
  FragmentOwnProps & { as?: T } & Omit<
      React.ComponentPropsWithoutRef<T>,
      "as" | keyof FragmentOwnProps
    >;

const Fragment = <T extends React.ElementType = "span">(
  props: FragmentProps<T>,
) => {
  const {
    as,
    transitionIn,
    transitionOut,
    order,
    stepIndex,
    className,
    ...rest
  } = props as FragmentOwnProps & {
    as?: React.ElementType;
    className?: string;
    [key: string]: unknown;
  };
  const slide = React.useContext(SlideContext);
  if (!slide) {
    throw new Error("<Fragment> must be used inside a <Slide>.");
  }
  const ref = React.useRef<HTMLElement>(null);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const registration: FragmentRegistration = {
      element,
      transitionIn,
      transitionOut,
      order,
      stepIndex,
    };
    slide.registration.fragments.add(registration);
    slide.store.invalidate();

    return () => {
      slide.registration.fragments.delete(registration);
      slide.store.invalidate();
    };
  }, [slide, transitionIn, transitionOut, order, stepIndex]);

  const Component = as || "span";

  return (
    <Component
      ref={ref}
      className={
        className ? `${styles.fragment} ${className}` : styles.fragment
      }
      {...rest}
    />
  );
};

export default Fragment;
