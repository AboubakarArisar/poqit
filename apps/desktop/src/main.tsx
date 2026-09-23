import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Pocket } from "./Pocket";
import "./styles.css";

const component = location.hash === "#/pocket" ? <Pocket /> : <App />;
createRoot(document.getElementById("root")!).render(<StrictMode>{component}</StrictMode>);
