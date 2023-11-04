import Presi from "../Presi.ts";
import html from "./notesView.html?raw";
import { keyBoardNavigation } from "../../utils/functions.ts";

class Notes {
  private presi: Presi;
  private speakerWindow: Window = null;

  public constructor(presi: Presi) {
    this.presi = presi;
    addEventListener("keyup", this.keyup);
    window.addEventListener("message", this.onMessage);
    this.presi.onSlideChange(this.onSlideChange);
  }

  private keyup = (e: KeyboardEvent) => {
    e.code === "KeyS" && this.openPopup();
  };

  private openPopup = () => {
    if (this.speakerWindow && !this.speakerWindow.closed) {
      this.speakerWindow.focus();
    } else {
      this.speakerWindow = window.open(
        "about:blank",
        "Speaker Notes",
        "width=1100,height=700",
      );
      this.speakerWindow.document.write(html);

      if (!this.speakerWindow) {
        alert(
          "Notes view popup failed to open. Please make sure popups are allowed and retry.",
        );
        return;
      }

      this.connect();
    }
  };

  private onSlideChange = (event: PresiEventsSlideChange) => {
    const notes = event.slide.querySelector("aside");
    this.speakerWindow &&
      this.speakerWindow.postMessage(
        JSON.stringify({
          type: "changed-slide",
          payload: notes ? notes.innerHTML : "",
        }),
        "*",
      );
  };

  private onMessage = (event: MessageEvent) => {
    if (typeof event.data !== "string") return;
    const data = JSON.parse(event.data);
    if (data.type === "keyup") {
      keyBoardNavigation(data.payload, this.presi.next, this.presi.prev);
    }
  };

  private connect = () => {
    this.speakerWindow.postMessage(
      JSON.stringify({
        type: "connect",
      }),
      "*",
    );

    const notes = this.presi.getCurrentSlide().querySelector("aside");
    this.speakerWindow.postMessage(
      JSON.stringify({
        type: "changed-slide",
        payload: notes ? notes.innerHTML : "",
      }),
      "*",
    );
  };
}

export default Notes;
