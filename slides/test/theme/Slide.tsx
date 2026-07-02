import { Slide as PresiSlide } from "presi-js/react";
import { ComponentProps, ReactNode } from "react";

type ThemeSlideProps = Omit<ComponentProps<typeof PresiSlide>, "children"> & {
  children: ReactNode;
};

export default function Slide({
  children,
  title = "",
  notes = null,
  className = "",
  ...props
}: ThemeSlideProps) {
  return (
    <PresiSlide
      className={`space-y-6 p-10 font-body ${className}`}
      title={title}
      notes={notes}
      {...props}
    >
      {Boolean(title) && (
        <h1 className="font-heading text-5xl font-extrabold leading-none tracking-tight text-neutral-950">
          {title}
        </h1>
      )}
      {children}
    </PresiSlide>
  );
}
