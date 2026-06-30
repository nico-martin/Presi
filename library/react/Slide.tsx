import React from "react";
import { registerPresiStep } from "presi/core";
import { consumePendingSlideMounts } from "./useSlideMount.ts";

declare const PRESI_INCLUDE_NOTES: string | undefined;

const includeNotes = () =>
  typeof PRESI_INCLUDE_NOTES === "undefined" || PRESI_INCLUDE_NOTES !== "false";

export interface SlideProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  notes?: Array<string>;
}

const Slide: React.FC<SlideProps> = ({
  children,
  className,
  title = "",
  notes = null,
}) => {
  const slideMounts = consumePendingSlideMounts();
  slideMounts.map(({ id, run }) => registerPresiStep(id, run));

  return (
    <section
      className={className}
      data-title={title}
      style={{
        border: "1px solid black",
      }}
    >
      {slideMounts.map(({ id }) => (
        <span key={id} data-presi-step-id={id} data-step-index={0} hidden />
      ))}
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
