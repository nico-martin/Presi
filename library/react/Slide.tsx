import React from "react";
import { registerPresiStep, unregisterPresiStep } from "presi-js/core";

declare const PRESI_INCLUDE_NOTES: string | undefined;

const includeNotes = () =>
  typeof PRESI_INCLUDE_NOTES === "undefined" || PRESI_INCLUDE_NOTES !== "false";

export interface SlideProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  notes?: Array<string>;
  onMount?: () => void;
  onUnmount?: () => void;
}

const Slide: React.FC<SlideProps> = ({
  children,
  className,
  title = "",
  notes = null,
  onMount,
  onUnmount,
  style,
  ...props
}) => {
  const mountStepIdRef = React.useRef<string>(null);
  const onMountRef = React.useRef(onMount);
  const onUnmountRef = React.useRef(onUnmount);
  onMountRef.current = onMount;
  onUnmountRef.current = onUnmount;

  if (!mountStepIdRef.current) {
    mountStepIdRef.current = `presi-slide-mount-${Math.random().toString(36).slice(2)}`;
  }

  const hasMountEffect = Boolean(onMount || onUnmount);

  if (hasMountEffect) {
    registerPresiStep(mountStepIdRef.current, () => {
      onMountRef.current?.();

      return () => {
        onUnmountRef.current?.();
      };
    });
  }

  React.useEffect(() => {
    const id = mountStepIdRef.current;

    return () => {
      id && unregisterPresiStep(id);
    };
  }, []);

  return (
    <section
      className={className}
      data-title={title}
      style={{
        ...style,
      }}
      {...props}
    >
      {hasMountEffect && (
        <span data-presi-step-id={mountStepIdRef.current} data-step-index={0} hidden />
      )}
      {children}
      {includeNotes() && notes && (
        <aside>
          {notes.map((note, i) => (
            <p key={i}>{note}</p>
          ))}
        </aside>
      )}
    </section>
  );
};

export default Slide;
