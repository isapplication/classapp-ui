import { getApiUrl } from "./api";
import type { Consent, LaunchResult } from "./types";

/**
 * Handoff to the Class Analytics extension. Its bridge script runs only on this join page: it marks
 * the page and relays the launch to the extension, which opens the class panel beside the meeting.
 */
export function extensionInstalled(): boolean {
  return document.documentElement.dataset.classappExtension === "1";
}

export type HandoffResult = { delivered: boolean; panelOpened: boolean };

export function handOffToExtension(launch: LaunchResult, consent: Consent): Promise<HandoffResult> {
  return new Promise((resolve) => {
    const id = crypto.randomUUID();
    const timer = window.setTimeout(() => finish({ delivered: false, panelOpened: false }), 2500);
    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.source !== "classapp-extension" || data.type !== "launch-ack" || data.id !== id) return;
      finish({ delivered: Boolean(data.delivered), panelOpened: Boolean(data.panelOpened) });
    }
    function finish(result: HandoffResult) {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(result);
    }
    window.addEventListener("message", onMessage);
    window.postMessage({ source: "classapp-web", type: "launch", id, launch, consent, apiUrl: getApiUrl() }, window.location.origin);
  });
}
