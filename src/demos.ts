import { COMPANIES, type Ticker } from "./content.ts";
import type { Ctx, Mount } from "./demo-ctx.ts";
import { mount as valuation } from "./demo-valuation.ts";
import { mount as technical } from "./demo-technical.ts";
import { mount as options } from "./demo-options.ts";
import { mount as peers } from "./demo-peers.ts";
import { mount as risk } from "./demo-risk.ts";
const MOUNTS: Record<string, Mount> = { valuation, technical, options, peers, correlation: risk };
const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

// Roving-tabindex tablist: arrows, Home, End.
function tabs(list: HTMLElement) {
  const all = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
  const pick = (tab: HTMLElement, focus = false) => {
    all.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls")!);
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  };
  all.forEach((t, i) => {
    t.addEventListener("click", () => pick(t));
    t.addEventListener("keydown", (ev) => {
      const k = ev.key, next = k === "ArrowRight" ? (i + 1) % all.length : k === "ArrowLeft" ? (i + all.length - 1) % all.length : k === "Home" ? 0 : k === "End" ? all.length - 1 : -1;
      if (next < 0) return;
      ev.preventDefault();
      pick(all[next], true);
    });
  });
  return pick;
}

export function mountDemos() {
  const sel = $<HTMLSelectElement>("#company");
  if (!sel) return;
  const pick = tabs($("#demo-tabs")!);
  const listeners: ((t: Ticker) => void)[] = [];
  const ctx: Ctx = { company: () => sel.value as Ticker, onCompany: (cb) => listeners.push(cb) };
  const apply = () => listeners.forEach((cb) => cb(ctx.company()));
  sel.addEventListener("change", apply);
  // Case cards choose the company, then show the demonstrations.
  document.querySelectorAll<HTMLAnchorElement>("[data-pick]").forEach((a) =>
    a.addEventListener("click", () => {
      if (COMPANIES.some((c) => c.ticker === a.dataset.pick)) { sel.value = a.dataset.pick!; apply(); }
    }),
  );
  document.querySelectorAll<HTMLElement>("[data-demo]").forEach((root) => MOUNTS[root.dataset.demo!]?.(root, ctx));
  const fromHash = () => {
    const t = document.getElementById(`tab-${location.hash.replace("#panel-", "")}`);
    if (location.hash.startsWith("#panel-") && t) {
      pick(t);
      const panel = document.getElementById(location.hash.slice(1))!;
      panel.scrollIntoView({ block: "start" });
      panel.focus({ preventScroll: true });
    }
  };
  fromHash();
  window.addEventListener("hashchange", fromHash);
}
