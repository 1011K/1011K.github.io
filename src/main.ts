import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./style.css";
import { mountLabs } from "./lab.ts";
import { mountDemos } from "./demos.ts";
const root = document.documentElement;
const menu = document.querySelector<HTMLButtonElement>(".menu-toggle")!;
const nav = document.getElementById("main-nav")!;
const themeBtn = document.getElementById("theme") as HTMLButtonElement;
const store = {
  get: () => { try { return localStorage.getItem("theme"); } catch { return null; } },
  set: (v: string) => { try { localStorage.setItem("theme", v); } catch { /* storage unavailable: choice lasts for this visit */ } },
};
const applyTheme = (t: "light" | "dark") => {
  root.dataset.theme = t;
  themeBtn.textContent = t === "dark" ? "Light" : "Dark";
  themeBtn.setAttribute("aria-pressed", String(t === "dark"));
};
const saved = store.get();
applyTheme(saved === "dark" || saved === "light" ? saved : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  store.set(next);
});
menu.addEventListener("click", () => {
  const expanded = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(expanded));
  nav.classList.toggle("open", expanded);
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    menu.focus();
  }
});
const focusHash = () => {
  let id: string;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (target) {
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }
};
window.addEventListener("hashchange", focusHash);
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", () => {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    if (a.hash === location.hash) focusHash();
  }),
);
mountDemos();
mountLabs();
if (location.hash) requestAnimationFrame(focusHash);
