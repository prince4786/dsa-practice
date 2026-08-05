/* ============================================================================
   18-main.js — boot: theme, global keyboard map, router mount.
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var doc = global.document;

  var gPending = false, gTimer = null;

  function typingIn(t) {
    if (!t) return false;
    var tag = t.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
  }

  function onKey(e) {
    var k = e.key;

    if ((e.metaKey || e.ctrlKey) && (k === "k" || k === "K")) {
      e.preventDefault(); App.UI.openPalette(); return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (k === "Escape") {
      if (App.UI.overlayOpen()) { e.preventDefault(); App.UI.closeOverlay(); }
      else App.UI.toggleSidebar(false);
      return;
    }
    if (App.UI.overlayOpen()) return;
    if (typingIn(e.target)) return;

    if (k === "/") { e.preventDefault(); App.UI.openPalette(); return; }
    if (k === "?") { e.preventDefault(); App.UI.openShortcuts(); return; }

    if (gPending) {
      gPending = false;
      if (gTimer) { global.clearTimeout(gTimer); gTimer = null; }
      if (k === "h") { e.preventDefault(); App.Router.go("#/"); return; }
      if (k === "d") { e.preventDefault(); App.Router.go("#/drill"); return; }
      var n = parseInt(k, 10);
      if (n >= 1 && n <= App.TRACKS.length) {
        e.preventDefault(); App.Router.go("#/t/" + App.TRACKS[n - 1].id); return;
      }
      return;
    }
    if (k === "g") {
      gPending = true;
      gTimer = global.setTimeout(function () { gPending = false; }, 1400);
      return;
    }

    if (k === "t" || k === "T") {
      e.preventDefault();
      App.Theme.toggle();   // repaints in place; the player keeps its frame
      return;
    }

    if (k === "[" || k === "]") {
      var r = App.Router.current();
      if (r.name !== "lesson" && r.name !== "viz") return;
      var nb = App.neighbours(r.key);
      var target = k === "[" ? nb.prev : nb.next;
      if (target) {
        e.preventDefault();
        App.Router.go((r.name === "viz" ? "#/t/" + App.keyOf(target) + "/viz" : App.Router.lessonHash(target)));
      }
      return;
    }
  }

  global.__boot = function () {
    try {
      App.Theme.init();
    } catch (e) { /* keep booting */ }

    doc.addEventListener("keydown", onKey);

    global.addEventListener("error", function (ev) {
      if (global.console) console.error("[shell] uncaught:", ev.message, ev.filename, ev.lineno);
    });

    try {
      App.Router.start(function (route) {
        try {
          App.UI.render(route);
        } catch (err) {
          if (global.console) console.error(err);
          var app = doc.getElementById("app");
          if (app) {
            app.textContent = "";
            var box = doc.createElement("div");
            box.className = "error-card";
            box.style.margin = "40px";
            box.innerHTML = "";
            var hd = doc.createElement("h3");
            hd.textContent = "The page failed to render";
            var pre = doc.createElement("pre");
            pre.textContent = (err && err.stack) || String(err);
            var a = doc.createElement("a");
            a.href = "#/"; a.textContent = "Back to the dashboard";
            box.appendChild(hd); box.appendChild(pre); box.appendChild(a);
            app.appendChild(box);
          }
        }
      });
    } catch (e) {
      if (global.console) console.error("[shell] boot failed", e);
    }

    if (!App.Store.persistent() && global.console) {
      console.warn("[shell] localStorage unavailable — progress is session-only.");
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
