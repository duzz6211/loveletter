import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/tokens.css";
import "./styles/door3d.css";
import "./styles/maze.css";
import "./styles/rooms.css";
import "./styles/room-shell.css";
import "./styles/room-features.css";
import "./styles/secret-letter.css";
import "./styles/archive.css";

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
