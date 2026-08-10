import React from "react";
import { createRoot } from "react-dom/client";

import { uiBridge } from "../core/ui-bridge";
import { PopupApp } from "../ui/popup";

const container = document.getElementById("root");
if (!container) throw new Error("Ondrift popup root was not found.");

createRoot(container).render(
  <React.StrictMode>
    <PopupApp bridge={uiBridge} />
  </React.StrictMode>,
);
