import { useCallback, useEffect, useState } from "react";

import Quill, { Delta } from "quill";
import { EmitterSource } from "quill/core/emitter";
import "quill/dist/quill.snow.css";

const useQuillTextChange = (
  quill: Quill | null,
  handler: (delta: Delta, oldDelta: Delta, source: EmitterSource) => void,
) => {
  useEffect(() => {
    if (!quill) return;

    quill.on(Quill.events.TEXT_CHANGE, handler);

    return () => {
      quill.off(Quill.events.TEXT_CHANGE, handler);
    };
  }, [quill]);
};

export default function Editor() {
  const [quill, setQuill] = useState<Quill | null>(null);

  const ref = useCallback((wrapper: HTMLDivElement) => {
    if (!wrapper) return;
    // cleanup before re-render
    wrapper.innerHTML = "";
    // make child div
    const editor = document.createElement("div");
    wrapper.append(editor);
    // bind quill editor to new child div
    const q = new Quill(editor, { theme: "snow" });
    setQuill(q);
  }, []);

  useQuillTextChange(quill, (delta, _, source) => {
    if (source !== Quill.sources.USER) return;
    console.log(delta.ops);
  });

  return <div ref={ref} className="container" />;
}
