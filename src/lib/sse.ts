export type SseMessage = { event: string; data: string; id?: string };

/**
 * Incremental server-sent-events parser. Feed it decoded text chunks; it calls onMessage for every
 * complete event. Comment lines (": ping") are ignored.
 */
export function createSseParser(onMessage: (message: SseMessage) => void) {
  let buffer = "";
  let event = "message";
  let data: string[] = [];
  let id: string | undefined;

  function dispatch() {
    if (data.length > 0) {
      onMessage({ event, data: data.join("\n"), id });
    }
    event = "message";
    data = [];
    id = undefined;
  }

  return (chunk: string) => {
    buffer += chunk;
    let newline: number;
    while ((newline = buffer.search(/\r\n|\n|\r/)) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + (buffer.startsWith("\r\n", newline) ? 2 : 1));
      if (line === "") {
        dispatch();
      } else if (!line.startsWith(":")) {
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
        if (field === "event") event = value;
        else if (field === "data") data.push(value);
        else if (field === "id") id = value;
      }
    }
  };
}
