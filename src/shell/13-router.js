/* ============================================================================
   13-router.js — hash router. No fetch, no history API: `hashchange` only, so
   Back/Forward work identically from file://.
   Routes: #/ | #/t/<track> | #/t/<track>/<id> | #/t/<track>/<id>/viz
           #/drill | #/drill/60s
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var handler = null;

  function parse(hash) {
    var h = (hash == null ? (global.location ? global.location.hash : "") : hash) || "#/";
    h = h.replace(/^#/, "");
    var parts = h.split("/").filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return { name: "home", hash: "#/" };
    if (parts[0] === "t") {
      if (parts.length === 1) return { name: "home", hash: "#/" };
      if (parts.length === 2) return { name: "track", track: parts[1], hash: "#/t/" + parts[1] };
      var key = parts[1] + "/" + parts[2];
      if (parts[3] === "viz") return { name: "viz", track: parts[1], id: parts[2], key: key, hash: "#/t/" + key + "/viz" };
      return { name: "lesson", track: parts[1], id: parts[2], key: key, hash: "#/t/" + key };
    }
    if (parts[0] === "drill") {
      if (parts[1] === "60s") return { name: "sixty", hash: "#/drill/60s" };
      if (parts[1]) return { name: "drill", scope: parts.slice(1).join("/"), hash: "#/drill/" + parts.slice(1).join("/") };
      return { name: "drill", hash: "#/drill" };
    }
    return { name: "notfound", hash: "#" + h };
  }

  var Router = App.Router = {
    parse: parse,
    current: function () { return parse(); },
    go: function (hash) {
      if (!hash) hash = "#/";
      if (hash.charAt(0) !== "#") hash = "#" + hash;
      if (global.location.hash === hash) { if (handler) handler(parse()); return; }
      global.location.hash = hash;
    },
    replace: function (hash) {
      try { global.history.replaceState(null, "", hash); } catch (e) { global.location.hash = hash; }
    },
    lessonHash: function (l) { return "#/t/" + l.track + "/" + l.id; },
    start: function (fn) {
      handler = fn;
      global.addEventListener("hashchange", function () { handler(parse()); });
      handler(parse());
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
