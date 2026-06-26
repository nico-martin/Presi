import { Slide as PresiSlide } from "@presi/react";
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
    <PresiSlide className="space-y-3 p-6" title={title} notes={notes}>
      {Boolean(title) && (
        <h1 className="text-4xl font-black tracking-tight text-neutral-950">
          {title}
        </h1>
      )}
      {children}
    </PresiSlide>
  );
}
