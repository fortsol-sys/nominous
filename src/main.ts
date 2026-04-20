import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

const appInstance = mount(App, { target: document.getElementById("app")! });

export default appInstance;
