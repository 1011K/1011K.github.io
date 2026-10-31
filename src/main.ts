import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "./style.css";
import { mountLabs } from "./lab";
import { escapeHTML as e, isReleased } from "./publication";
import manifest from "../publication-manifest.json";
mountLabs();
const menu = document.querySelector<HTMLButtonElement>(".menu-toggle")!;
const nav = document.getElementById("main-nav")!;
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
if (location.hash) requestAnimationFrame(focusHash);
document
  .querySelectorAll<HTMLButtonElement>(".radial-node button")
  .forEach((button) => {
    const node = button.parentElement!;
    button.addEventListener("click", () => node.classList.toggle("selected"));
  });
const released = (manifest.research as unknown[]).filter(isReleased);
document.getElementById("released-research")!.innerHTML = released
  .map(
    (r) =>
      `<article class="research-study"><h3>${e(r.title)}</h3><p>${e(r.synopsis)}</p><p>${e(r.asOf)} · ${e(r.scope)} · ${e(r.methodology)}</p><p>${e(r.authoredContributions.join("; "))}</p><p>${e(r.limitations.join("; "))}</p>${r.assets
        .filter((a) => a.path.endsWith(".pdf"))
        .map((a) => `<a href="${e(a.path)}">Read full reviewed PDF</a>`)
        .join("")}</article>`,
  )
  .join("");
