import React from "react";
import Presi from "../core/Presi.ts";

const Wrapper: React.FC<{
  children: React.ReactElement | Array<React.ReactElement>;
  aspectRatio: `${number}:${number}`;
  config: TalkConfig;
}> = ({ children, aspectRatio }) => {
  const [presiInstance, setPresiInstance] = React.useState<Presi>(null);
  const [presiInstanceInit, setPresiInstanceInit] =
    React.useState<boolean>(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref?.current && !presiInstanceInit) {
      setPresiInstanceInit(true);
      const p = new Presi(ref.current, { aspectRatio });
      p.on("fragmentChange", (data) => console.log("fragmentChanged", data));
      p.on("slideChange", (data) => console.log("slideChange", data));
      setPresiInstance(p);
    }
  }, [ref, presiInstanceInit]);

  React.useEffect(() => {
    return () => {
      presiInstance && presiInstance.cleanUp();
      setPresiInstanceInit(false);
      setPresiInstance(null);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
};

export default Wrapper;
