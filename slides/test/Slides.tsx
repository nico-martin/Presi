import React from "react";
import ReactDOM from "react-dom/client";
import config from "./config.json";

import { Wrapper, Slide } from "@presi/react";

const App: React.FC = () => (
  <Wrapper config={config} aspectRatio="16:9">
    <Slide title="Hello">
      <p>Hello</p>
      <p className="fragment">World 1</p>
      <p className="fragment" data-fragment-index="1">
        World 2
      </p>
      <p className="fragment">World 3</p>
      <p className="fragment" data-fragment-index="7">
        World 4
      </p>
      <p className="fragment" data-fragment-index="7">
        World 5
      </p>
    </Slide>
    <Slide title="test">
      <p>LoremIpsum</p>
    </Slide>
    <Slide title="test">
      <p>Dolor</p>
    </Slide>
  </Wrapper>
);

const root = document.getElementById("app");
root && ReactDOM.createRoot(root).render(<App />);
