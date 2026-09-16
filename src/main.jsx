import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

/* 처음 화면(미궁)에 필요한 것만 여기서 받는다.
   방 안쪽 스타일은 ArchiveLayout 이 들고 있다 — 봉인을 지나야 내려온다. */
import "./styles/tokens.css";
import "./styles/door3d.css";
import "./styles/maze.css";

import App from "./App.jsx";
import { SessionProvider } from "./session/SessionProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>
);
