import Slide from "../theme/Slide.tsx";

export default function TypographySlide() {
  return (
    <Slide title="Typography System">
      <div className="grid grid-cols-2 gap-8 text-neutral-800">
        <div className="rounded-3xl bg-neutral-100 p-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-neutral-500">
            Title / Body
          </p>
          <h2 className="font-heading text-2xl font-extrabold leading-none text-neutral-950">
            Nunito makes headings feel friendly.
          </h2>
          <p className="mt-6 max-w-xl leading-relaxed">
            Nunito Sans keeps longer paragraphs rounded, light, and readable at
            presentation scale.
          </p>
        </div>

        <div className="rounded-3xl bg-blue-700 p-8 text-white">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
            Contrast
          </p>
          <h2 className="font-heading text-2xl font-extrabold leading-tight">
            Big idea, short support.
          </h2>
          <p className="mt-5 text-blue-50">
            Headings use Nunito at weight 800. Body copy uses Nunito Sans at
            weight 200 for a softer reading texture.
          </p>
        </div>
      </div>
    </Slide>
  );
}
