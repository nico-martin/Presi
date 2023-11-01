import React from "react";

export interface SlideProps {
  children: React.ReactElement | Array<React.ReactElement>;
  title?: string;
}

const Slide: React.FC<SlideProps> = ({ children, title = "" }) => {
  return (
    <section
      style={{
        border: "1px solid black",
      }}
    >
      <h1>{title}</h1>
      {children}
    </section>
  );
};

export default Slide;
