import React from "react";

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
  return (
    <section
      style={{
        border: "1px solid black",
      }}
    >
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
