import {
  gsInit,
  gsRandomize,
  gsRun,
  gsStep,
  gsReset,
} from "./examples/gale-shapley-ui.js";


/* ================================================================
   NAVIGATION
   ================================================================ */


console.log("app.js loaded");
/**
 * Switch between application screens.
 *
 * The HTML currently uses inline onclick handlers, therefore this
 * function is exported through window below.
 */
function navigate(item, screenId) {
  console.log("navigate:", screenId);
  // Remove active state from sidebar entries
  document
    .querySelectorAll(".nav-item")
    .forEach(navItem => {
      navItem.classList.remove("active");
    });

  // Activate selected sidebar entry
  if (item) {
    item.classList.add("active");
  }

  // Hide all screens
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.remove("active");
    });

  // Show requested screen
  const target =
    document.getElementById(
      `screen-${screenId}`
    );

  if (!target) {
    console.error(
      `Unknown screen: ${screenId}`
    );

    return;
  }

  target.classList.add("active");
}


/* ================================================================
   EXPOSE FUNCTIONS USED BY INLINE HTML EVENTS
   ================================================================ */

/*
 * ES modules do not automatically expose functions globally.
 *
 * Because our HTML currently uses:
 *
 *   onclick="gsRun()"
 *
 * we explicitly attach the functions to window.
 *
 * Later we can replace inline handlers with addEventListener(),
 * but keeping them for now makes the first implementation simpler.
 */

window.navigate = navigate;

window.gsInit = gsInit;
window.gsRandomize = gsRandomize;
window.gsRun = gsRun;
window.gsStep = gsStep;
window.gsReset = gsReset;


/* ================================================================
   APPLICATION INITIALIZATION
   ================================================================ */

function initApplication() {
  gsInit();

  console.info(
    "Byzantine Stable Matching Interactive Companion initialized."
  );
}


/*
 * app.js is loaded at the end of <body>, so the DOM is normally
 * already available. The DOMContentLoaded check also makes the
 * entry point robust if the script location changes later.
 */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initApplication
  );
} else {
  initApplication();
}