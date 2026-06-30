import { Slide as PresiSlide } from "presi/react";
import { ReactNode } from "react";
export default function Slide({
  children,
  title = "",
  notes = null,
}: {
  children: ReactNode;
  title?: string;
  notes?: Array<string>;
}) {
  return (
    <PresiSlide className="space-y-6 p-10 font-body" title={title} notes={notes}>
      {Boolean(title) && (
        <h1 className="font-heading text-5xl font-extrabold leading-none tracking-tight text-neutral-950">
          {title}
        </h1>
      )}
      {children}
    </PresiSlide>
  );
}
