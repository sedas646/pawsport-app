import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DogsProvider } from "./context/DogsContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DogsProvider>
        <App />
      </DogsProvider>
    </BrowserRouter>
  </StrictMode>
);
