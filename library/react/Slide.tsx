import React from "react";
import { registerPresiStep } from "@presi/core";
import { consumePendingSlideMounts } from "./useSlideMount.ts";

export interface SlideProps {
  children: React.ReactElement | Array<React.ReactElement>;
  title?: string;
  notes?: Array<string>;
}

const Slide: React.FC<SlideProps> = ({
  children,
  title = "",
  notes = null,
}) => {
  const slideMounts = consumePendingSlideMounts();
  slideMounts.map(({ id, run }) => registerPresiStep(id, run));

  return (
    <section
      style={{
        border: "1px solid black",
      }}
    >
      {slideMounts.map(({ id }) => (
        <span key={id} data-presi-step-id={id} data-step-index={0} hidden />
      ))}
      <h1>{title}</h1>
      {children}
      {notes && (
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
