import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import L from "leaflet";

import { store } from "../src/store/index.js";
import App from "../src/app/App.jsx";

import "leaflet/dist/leaflet.css";
import "./index.css";

/*
|--------------------------------------------------------------------------
| FIX LEAFLET DEFAULT MARKER ICONS
|--------------------------------------------------------------------------
| This prevents missing marker icons in OpenStreetMap (Leaflet bug in bundlers)
*/
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/*
|--------------------------------------------------------------------------
| APP ROOT
|--------------------------------------------------------------------------
*/
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);