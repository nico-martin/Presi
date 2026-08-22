import type { DeckStore } from "./deckStore.ts";
import { isEditableKeyboardTarget, keyBoardNavigation } from "./keyboard.ts";
import html from "./notesView.html?raw";

export class NotesPlugin {
  private store: DeckStore;
  private speakerWindow: Window | null = null;
  private lastSlideIndex: number | null = null;
  private unsubscribe: () => void;

  public constructor(store: DeckStore) {
    this.store = store;
    addEventListener("keyup", this.keyup);
    window.addEventListener("message", this.onMessage);
    this.unsubscribe = store.subscribe(this.onStateChange);
  }

  public destroy = () => {
    removeEventListener("keyup", this.keyup);
    window.removeEventListener("message", this.onMessage);
    this.unsubscribe();
  };

  private keyup = (e: KeyboardEvent) => {
    if (isEditableKeyboardTarget(e.target)) return;

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

      if (!this.speakerWindow) {
        alert(
          "Notes view popup failed to open. Please make sure popups are allowed and retry.",
        );
        return;
      }

      this.speakerWindow.document.write(html);
      this.connect();
    }
  };

  private post = (type: string, payload: unknown) => {
    this.speakerWindow &&
      this.speakerWindow.postMessage(JSON.stringify({ type, payload }), "*");
  };

  private onStateChange = () => {
    const current = this.store.getState();
    if (!this.speakerWindow) {
      this.lastSlideIndex = current.slideIndex;
      return;
    }

    this.post("changed-preview-state", {
      current,
      upcoming: this.store.getNextState(),
    });

    if (current.slideIndex !== this.lastSlideIndex) {
      this.post("changed-slide", this.store.getNotesHtml(current.slideIndex));
    }
    this.lastSlideIndex = current.slideIndex;
  };

  private onMessage = (event: MessageEvent) => {
    if (typeof event.data !== "string") return;
    const data = JSON.parse(event.data);
    if (data.type === "navigate") {
      keyBoardNavigation(data.payload, this.store.next, this.store.prev);
    }
  };

  private connect = () => {
    const current = this.store.getState();
    this.post("connect", {
      aspectRatio: this.store.getAspectRatio(),
      current,
      upcoming: this.store.getNextState(),
    });
    this.post("changed-slide", this.store.getNotesHtml(current.slideIndex));
    this.lastSlideIndex = current.slideIndex;
  };
}
