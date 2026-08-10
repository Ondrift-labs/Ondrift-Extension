import type { RuntimeRequest } from "../shared/types";
import { handleRuntimeRequest } from "./message-handler";

chrome.runtime.onMessage.addListener((message: RuntimeRequest, _sender, sendResponse) => {
  void handleRuntimeRequest(message).then(sendResponse);
  return true;
});
