(function () {
  "use strict";
  var WA = "971524766484";
  var root = document.documentElement;
  function getPref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setPref(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lang() { return root.getAttribute("lang"); }
  window.PARKA = { WA: WA, lang: lang, getPref: getPref, setPref: setPref,
    wa: function (t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); } };

  /* ---------- language ---------- */
  var nodes = [].slice.call(document.querySelectorAll("[data-ar]"));
  var ph = [].slice.call(document.querySelectorAll("[data-ar-placeholder]"));
  var lbl = [].slice.call(document.querySelectorAll("[data-ar-label]"));
  nodes.forEach(function (n) { n.setAttribute("data-en", n.innerHTML); });
  ph.forEach(function (n) { n.setAttribute("data-en-placeholder", n.getAttribute("placeholder") || ""); });
  lbl.forEach(function (n) { n.setAttribute("data-en-label", n.getAttribute("aria-label") || ""); });
  var titleEl = document.querySelector("title"), tEn = titleEl ? titleEl.textContent : "", tAr = titleEl ? titleEl.getAttribute("data-title-ar") : "";
  function setLang(l, save) {
    var ar = l === "ar";
    root.setAttribute("lang", ar ? "ar" : "en"); root.setAttribute("dir", ar ? "rtl" : "ltr");
    nodes.forEach(function (n) { n.innerHTML = n.getAttribute(ar ? "data-ar" : "data-en"); });
    ph.forEach(function (n) { n.setAttribute("placeholder", n.getAttribute(ar ? "data-ar-placeholder" : "data-en-placeholder")); });
    lbl.forEach(function (n) { n.setAttribute("aria-label", n.getAttribute(ar ? "data-ar-label" : "data-en-label")); });
    if (titleEl && tAr) titleEl.textContent = ar ? tAr : tEn;
    document.querySelectorAll(".lang-toggle button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === l)); });
    if (save) setPref("parka-lang", l);
    document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = PARKA.wa(a.getAttribute(ar ? "data-wa-ar" : "data-wa")); });
    paintOpen();
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  }

  function paintOpen() {
    var p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", hour12: false }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var h = parseInt(p.hour, 10) % 24, open = h >= 8, ar = lang() === "ar";
    document.querySelectorAll(".open-now").forEach(function (el) {
      el.classList.toggle("is-closed", !open);
      el.textContent = open ? (ar ? "مفتوح الآن حتى منتصف الليل" : "Open now until midnight") : (ar ? "مغلق الآن، نفتح 8 صباحاً" : "Closed now, opens 8am");
    });
  }

  document.querySelectorAll(".lang-toggle button").forEach(function (b) { b.addEventListener("click", function () { setLang(b.getAttribute("data-lang"), true); }); });

  /* ---------- header ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", scrollY > 8); }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var mb = document.querySelector(".menu-btn");
  if (mb) {
    mb.addEventListener("click", function () { var o = document.body.classList.toggle("menu-open"); mb.setAttribute("aria-expanded", String(o)); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-open")) { document.body.classList.remove("menu-open"); mb.setAttribute("aria-expanded", "false"); mb.focus(); } });
  }

  /* ---------- filters (reviews) ---------- */
  document.querySelectorAll("[data-filter-group]").forEach(function (g) {
    var target = document.getElementById(g.getAttribute("data-filter-group"));
    g.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        g.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        var f = b.getAttribute("data-filter");
        target.querySelectorAll("[data-tags]").forEach(function (it) { it.classList.toggle("is-hidden", !(f === "all" || it.getAttribute("data-tags").split(" ").indexOf(f) > -1)); });
      });
    });
  });

  /* ---------- tray shared across pages ---------- */
  window.PARKA.tray = {
    get: function () { try { return JSON.parse(getPref("parka-tray") || "{}") || {}; } catch (e) { return {}; } },
    set: function (t) { setPref("parka-tray", JSON.stringify(t)); },
    add: function (id, n) { var t = this.get(); t[id] = (t[id] || 0) + (n || 1); if (t[id] <= 0) delete t[id]; this.set(t); return t; }
  };
  function toast(msg) {
    var el = document.querySelector(".toast"); if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("is-on"); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove("is-on"); }, 1800);
  }
  window.PARKA.toast = toast;
  // "Add to table" buttons outside the menu page
  document.querySelectorAll("[data-add]").forEach(function (b) {
    if (document.getElementById("builder")) return;
    b.addEventListener("click", function () {
      PARKA.tray.add(b.getAttribute("data-add"), 1);
      b.classList.add("is-added");
      toast(lang() === "ar" ? "أُضيف إلى طاولتك. افتح المنيو لإكمال الطلب." : "Added to your table. Open the menu to finish.");
      paintPill();
    });
  });
  function paintPill() {
    var t = PARKA.tray.get(), n = 0; Object.keys(t).forEach(function (k) { n += t[k]; });
    document.querySelectorAll("[data-tray-count]").forEach(function (el) { el.textContent = n; el.parentElement.style.display = n ? "" : "none"; });
  }
  window.PARKA.paintPill = paintPill;

  /* ---------- forms -> WhatsApp ---------- */
  document.querySelectorAll("form[data-wa-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ar = lang() === "ar";
      var name = form.querySelector("[name=name]"), err = form.querySelector(".err");
      if (name && !name.value.trim()) { if (err) err.textContent = ar ? "يرجى كتابة الاسم." : "Add your name so the team knows who to reply to."; name.focus(); return; }
      if (err) err.textContent = "";
      var lines = [ar ? form.getAttribute("data-intro-ar") : form.getAttribute("data-intro")];
      form.querySelectorAll("[data-q]").forEach(function (f) {
        var label = ar ? f.getAttribute("data-q-ar") : f.getAttribute("data-q"), val = "";
        if (f.tagName === "FIELDSET") {
          val = [].slice.call(f.querySelectorAll("input:checked")).map(function (c) { return ar ? c.getAttribute("data-ar-value") : c.value; }).join(ar ? "، " : ", ");
        } else if (f.tagName === "SELECT") { val = f.value ? f.selectedOptions[0].text : ""; }
        else { val = f.value.trim(); }
        if (val) lines.push(label + ": " + val);
      });
      open(PARKA.wa(lines.join("\n")), "_blank", "noopener");
    });
    var d = form.querySelector("input[type=date]");
    if (d) { var now = new Date(); d.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  });

  var qs = new URLSearchParams(location.search).get("lang");
  setLang(qs === "ar" || qs === "en" ? qs : (getPref("parka-lang") || "en"), !!qs);
  paintPill();
  document.querySelectorAll("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
document.addEventListener("click", function (e) {
  var b = e.target.closest("[data-pick]"); if (!b) return;
  var r = document.querySelector('input[name=cake][data-key="' + b.getAttribute("data-pick") + '"]'); if (r) r.checked = true;
});
