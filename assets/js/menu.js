(function () {
  "use strict";
  var B = document.getElementById("builder");
  if (!B || !window.PARKA_MENU) return;
  var M = window.PARKA_MENU, P = window.PARKA;
  var byId = {}; M.items.forEach(function (it) { byId[it.id] = it; });
  var tray = P.tray.get(); Object.keys(tray).forEach(function (k) { if (!byId[k]) delete tray[k]; });
  var people = 2, mode = "pickup";
  var ar = function () { return P.lang() === "ar"; };
  var T = function (en, a) { return ar() ? a : en; };
  var ICON = M.icons;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function aed(n) { return ar() ? n + " درهم" : "AED " + n; }
  function name(it) { return ar() ? it.ar : it.en; }
  function save() { P.tray.set(tray); }

  function thumb(it, w) {
    return it.img ? '<img src="' + it.img + "=w" + (w || 240) + '-k-no" alt="" loading="lazy" referrerpolicy="no-referrer">' : ICON[it.icon] || ICON.plate;
  }

  /* ---------- menu list ---------- */
  var list = document.getElementById("menu-list"), tabs = document.getElementById("cat-tabs");
  function renderMenu() {
    tabs.innerHTML = M.cats.map(function (c, i) { return '<button type="button" data-cat="' + c.id + '" aria-pressed="' + (i === 0) + '">' + esc(T(c.en, c.ar)) + "</button>"; }).join("");
    list.innerHTML = M.cats.map(function (c) {
      var items = M.items.filter(function (it) { return it.cat === c.id; });
      return '<section class="menu-cat" id="cat-' + c.id + '"><h3>' + esc(T(c.en, c.ar)) + (c.note_en ? "<small>" + esc(T(c.note_en, c.note_ar)) + "</small>" : "") + '</h3><div class="items">' +
        items.map(function (it) {
          return '<article class="item" data-id="' + it.id + '"><div class="thumb">' + thumb(it) + "</div><div><h4>" + esc(name(it)) + (it.pop ? '<span class="tag">' + T("Popular", "الأكثر طلباً") + "</span>" : "") + "</h4>" +
            (it.den ? "<p>" + esc(T(it.den, it.dar)) + "</p>" : "") + '<div class="row"><b class="price">' + aed(it.p) + '</b><span class="ctl"></span></div></div></article>';
        }).join("") + "</div></section>";
    }).join("");
    tabs.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { document.getElementById("cat-" + b.getAttribute("data-cat")).scrollIntoView({ behavior: "smooth", block: "start" }); });
    });
    paintControls();
    observe();
  }
  function ctlHTML(id) {
    var q = tray[id] || 0;
    if (!q) return '<button type="button" class="add" data-plus="' + id + '">' + M.plus + T("Add", "أضف") + "</button>";
    return '<span class="step"><button type="button" data-minus="' + id + '" aria-label="' + T("Remove one", "أزل واحدة") + '">−</button><output>' + q + '</output><button type="button" data-plus="' + id + '" aria-label="' + T("Add one", "أضف واحدة") + '">+</button></span>';
  }
  function paintControls() { list.querySelectorAll(".item").forEach(function (el) { el.querySelector(".ctl").innerHTML = ctlHTML(el.getAttribute("data-id")); }); }

  var io;
  function observe() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id.replace("cat-", "");
        tabs.querySelectorAll("button").forEach(function (b) {
          var on = b.getAttribute("data-cat") === id; b.setAttribute("aria-pressed", on);
          if (on) b.scrollIntoView({ block: "nearest", inline: "center" });
        });
      });
    }, { rootMargin: "-160px 0px -60% 0px" });
    list.querySelectorAll(".menu-cat").forEach(function (s) { io.observe(s); });
  }

  /* ---------- table + ticket ---------- */
  var plates = document.getElementById("plates"), empty = document.getElementById("table-empty");
  var tlist = document.getElementById("ticket-list"), totalEl = document.getElementById("ticket-total");
  var ppEl = document.getElementById("pp"), peopleEl = document.getElementById("people");
  var upsell = document.getElementById("upsell"), bar = document.getElementById("tray-bar");
  function total() { var s = 0; Object.keys(tray).forEach(function (k) { s += byId[k].p * tray[k]; }); return s; }
  function count() { var s = 0; Object.keys(tray).forEach(function (k) { s += tray[k]; }); return s; }

  function renderTable() {
    var ids = Object.keys(tray);
    empty.style.display = ids.length ? "none" : "";
    var shown = ids.slice(0, 11);
    plates.innerHTML = shown.map(function (id) {
      var it = byId[id], cup = /cup|glass/.test(it.icon);
      return '<div class="plate' + (cup ? " is-cup" : "") + '"><div class="food">' + thumb(it, 220) + '</div><span class="qty">' + tray[id] + '</span><span class="label">' + esc(name(it)) + '</span><button type="button" class="rm" data-minus="' + id + '" aria-label="' + T("Remove one", "أزل واحدة") + " " + esc(name(it)) + '">−</button></div>';
    }).join("") + (ids.length > 11 ? '<div class="plate"><div class="food"><b style="font-size:1.4rem">+' + (ids.length - 11) + "</b></div></div>" : "");

    tlist.innerHTML = ids.length ? ids.map(function (id) {
      return '<li><span><b>' + tray[id] + "×</b> " + esc(name(byId[id])) + '</span><span class="price">' + aed(byId[id].p * tray[id]) + "</span></li>";
    }).join("") : '<li class="empty" style="border:0">' + T("Your table is empty. Add something from the menu or pick a mood.", "طاولتك فارغة. أضف شيئاً من المنيو أو اختر مزاجاً.") + "</li>";
    var t = total();
    totalEl.textContent = aed(t);
    peopleEl.textContent = people;
    ppEl.textContent = t ? (T("About ", "تقريباً ") + aed(Math.round(t / people)) + T(" per person", " للشخص")) : "";
    bar.classList.toggle("is-on", ids.length > 0);
    document.body.classList.toggle("has-tray", ids.length > 0);
    bar.querySelector("b").textContent = aed(t);
    bar.querySelector("[data-bar-count]").textContent = count() + T(" items", " صنف");
    paintUpsell();
    paintControls();
    save();
    if (P.paintPill) P.paintPill();
  }

  function has(fn) { return Object.keys(tray).some(function (k) { return fn(byId[k]); }); }
  function paintUpsell() {
    var s = null;
    var drink = has(function (i) { return /coffee|tea|ube|drinks|pink/.test(i.cat) && i.icon !== "bake"; });
    var sweet = has(function (i) { return /bakes|dessert|cakes|boxes/.test(i.cat) || i.id === "berry-fold"; });
    var savory = has(function (i) { return /sharing|plates|sandos|flatbreads/.test(i.cat); });
    if (drink && !sweet) s = "parka-croissant";
    else if (savory && !drink) s = "mango-passion";
    else if (people >= 3 && count() >= 3 && !tray["bakes-box"]) s = "bakes-box";
    else if (savory && !sweet) s = "mille-feuille";
    if (!s || tray[s]) { upsell.classList.remove("is-on"); return; }
    var it = byId[s];
    upsell.innerHTML = "<span>" + T("Goes well with your order: ", "يناسب طلبك: ") + "<b>" + esc(name(it)) + "</b> · " + aed(it.p) + '</span><button type="button" class="add" data-plus="' + s + '">' + M.plus + T("Add", "أضف") + "</button>";
    upsell.classList.add("is-on");
  }

  function change(id, d) {
    tray[id] = (tray[id] || 0) + d;
    if (tray[id] <= 0) delete tray[id];
    renderTable();
  }
  document.addEventListener("click", function (e) {
    var p = e.target.closest("[data-plus]"), m = e.target.closest("[data-minus]");
    if (p && B.contains(p) || p && p.closest("#finder")) { change(p.getAttribute("data-plus"), 1); }
    else if (m) { change(m.getAttribute("data-minus"), -1); }
  });
  document.getElementById("people-minus").addEventListener("click", function () { people = Math.max(1, people - 1); renderTable(); });
  document.getElementById("people-plus").addEventListener("click", function () { people = Math.min(20, people + 1); renderTable(); });
  document.getElementById("clear").addEventListener("click", function () { tray = {}; renderTable(); });

  /* ---------- moods ---------- */
  var moodsEl = document.getElementById("moods");
  function renderMoods() {
    moodsEl.innerHTML = M.moods.map(function (m, i) {
      var t = 0; Object.keys(m.items).forEach(function (k) { t += byId[k].p * m.items[k]; });
      return '<button type="button" class="mood" data-mood="' + i + '"><span class="emo" aria-hidden="true">' + m.emo + "</span><b>" + esc(T(m.en, m.ar)) + "</b><span>" + esc(T(m.den, m.dar)) + '</span><span class="total">' + aed(t) + "</span></button>";
    }).join("");
    moodsEl.querySelectorAll(".mood").forEach(function (b) {
      b.addEventListener("click", function () {
        var m = M.moods[+b.getAttribute("data-mood")];
        tray = JSON.parse(JSON.stringify(m.items)); people = m.people;
        renderTable();
        P.toast(T("Table set: ", "تم تجهيز الطاولة: ") + T(m.en, m.ar));
        if (innerWidth < 1040) document.getElementById("table").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- mode + send ---------- */
  var modeBtns = document.querySelectorAll("#mode button"), send = document.getElementById("send");
  modeBtns.forEach(function (b) { b.addEventListener("click", function () { mode = b.getAttribute("data-mode"); modeBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); paintSend(); }); });
  function paintSend() {
    send.querySelector("span").textContent = mode === "pickup" ? T("Send pickup order on WhatsApp", "أرسل طلب الاستلام عبر واتساب") : T("Book a table with this order", "احجز طاولة مع هذا الطلب");
    document.getElementById("when-label").textContent = mode === "pickup" ? T("Pickup time", "وقت الاستلام") : T("Date and time", "التاريخ والوقت");
  }
  send.addEventListener("click", function () {
    var ids = Object.keys(tray);
    if (!ids.length) { P.toast(T("Add something to your table first.", "أضف شيئاً إلى طاولتك أولاً.")); return; }
    var nm = document.getElementById("t-name").value.trim(), when = document.getElementById("t-when").value.trim();
    var L = [];
    if (mode === "pickup") L.push(T("Hi PARKA Bakehouse, I'd like to order for pickup:", "مرحباً PARKA Bakehouse، أود طلب استلام:"));
    else L.push(T("Hi PARKA Bakehouse, I'd like to book a table for " + people + " and pre-order:", "مرحباً PARKA Bakehouse، أود حجز طاولة لـ " + people + " أشخاص مع طلب مسبق:"));
    ids.forEach(function (id) { L.push(tray[id] + " × " + name(byId[id]) + " (" + aed(byId[id].p * tray[id]) + ")"); });
    L.push(T("Total: ", "المجموع: ") + aed(total()) + T(" (menu prices)", " (حسب أسعار المنيو)"));
    if (when) L.push((mode === "pickup" ? T("Pickup time: ", "وقت الاستلام: ") : T("Date and time: ", "التاريخ والوقت: ")) + when);
    if (nm) L.push(T("Name: ", "الاسم: ") + nm);
    open(P.wa(L.join("\n")), "_blank", "noopener");
  });

  /* ---------- coffee finder ---------- */
  var F = { temp: "iced", taste: "sweet", base: "coffee" };
  var FIND = M.finder;
  function paintFinder() {
    document.querySelectorAll("#finder .seg").forEach(function (s) {
      s.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", F[s.getAttribute("data-k")] === b.getAttribute("data-v")); });
    });
    var id = FIND[F.base + "-" + F.temp + "-" + F.taste] || FIND[F.base + "-" + F.taste] || "spanish-latte";
    var it = byId[id];
    document.getElementById("match").innerHTML = '<div class="ph">' + thumb(it, 400) + '</div><div class="body"><h3>' + esc(name(it)) + "</h3><p>" + esc(T(it.den, it.dar)) + '</p><div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><b class="price">' + aed(it.p) + '</b><button type="button" class="add" data-plus="' + id + '">' + M.plus + T("Add to table", "أضف للطاولة") + "</button></div></div>";
  }
  document.querySelectorAll("#finder .seg button").forEach(function (b) {
    b.addEventListener("click", function () { F[b.parentElement.getAttribute("data-k")] = b.getAttribute("data-v"); paintFinder(); });
  });

  bar.querySelector("button").addEventListener("click", function () { document.getElementById("ticket").scrollIntoView({ behavior: "smooth", block: "start" }); });

  function all() { renderMenu(); renderMoods(); renderTable(); paintSend(); paintFinder(); }
  document.addEventListener("langchange", all);
  all();
})();
