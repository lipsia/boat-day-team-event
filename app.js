/* ============================================================
   Lipsia Digital — Team Event
   Essenswünsche + Mitfahrgelegenheiten

   Persistenz: Supabase REST API (kein Build, keine Abhängigkeiten).
   Ohne Zugangsdaten in config.js läuft die Seite im lokalen
   Vorschau-Modus (localStorage, nur im eigenen Browser sichtbar).
   ============================================================ */

(function () {
  "use strict";

  var cfg = window.CONFIG || {};
  var EVENT = cfg.EVENT || {};
  var url = (cfg.SUPABASE_URL || "").replace(/\/+$/, "");
  var key = cfg.SUPABASE_ANON_KEY || "";
  var live = Boolean(url && key);

  var $ = function (id) {
    return document.getElementById(id);
  };

  /* ---------------------------------------------------- Storage */

  var store = live
    ? {
        list: function (table) {
          return rest("GET", table + "?select=*&order=created_at.asc");
        },
        insert: function (table, row) {
          return rest("POST", table, row).then(function (rows) {
            return rows[0];
          });
        },
        remove: function (table, id) {
          return rest("DELETE", table + "?id=eq." + encodeURIComponent(id));
        },
      }
    : localStore();

  function rest(method, path, body) {
    var headers = {
      apikey: key,
      Authorization: "Bearer " + key,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
      headers.Prefer = "return=representation";
    }
    return fetch(url + "/rest/v1/" + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (text) {
          var msg = text;
          try {
            var parsed = JSON.parse(text);
            msg = parsed.message || parsed.hint || text;
          } catch (e) {
            /* Klartext-Antwort */
          }
          throw new Error(msg || "HTTP " + res.status);
        });
      }
      if (res.status === 204) return [];
      return res.json();
    });
  }

  function localStore() {
    var prefix = "ld-teamevent:";
    var read = function (table) {
      try {
        return JSON.parse(localStorage.getItem(prefix + table) || "[]");
      } catch (e) {
        return [];
      }
    };
    var write = function (table, rows) {
      localStorage.setItem(prefix + table, JSON.stringify(rows));
    };
    return {
      list: function (table) {
        return Promise.resolve(read(table));
      },
      insert: function (table, row) {
        var rows = read(table);
        row = Object.assign({}, row, {
          id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
          created_at: new Date().toISOString(),
        });
        rows.push(row);
        write(table, rows);
        return Promise.resolve(row);
      },
      remove: function (table, id) {
        write(
          table,
          read(table).filter(function (r) {
            return String(r.id) !== String(id);
          })
        );
        return Promise.resolve([]);
      },
    };
  }

  /* ---------------------------------------------------- Helpers */

  function esc(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (ch) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[ch];
      }
    );
  }

  /* Feld per Name holen. Wichtig: form.elements.item liefert die
     eingebaute item()-Methode der Collection, nicht das Input-Feld —
     namedItem() umgeht diese Kollision (auch bei "length", "namedItem"). */
  function field(form, name) {
    return form.elements.namedItem(name);
  }

  function setError(el, message) {
    el.textContent = message || "";
    el.hidden = !message;
  }

  function validate(form, fields) {
    var missing = null;
    fields.forEach(function (name) {
      var input = field(form, name);
      if (!input) return;
      var empty = !String(input.value || "").trim();
      /* Radio-Gruppen liefern eine RadioNodeList ohne setAttribute/focus */
      if (input.setAttribute) {
        input.setAttribute("aria-invalid", empty ? "true" : "false");
      }
      if (empty && !missing) missing = input;
    });
    if (missing && missing.focus) missing.focus();
    return !missing;
  }

  function submitting(form, busy) {
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = busy;
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.textContent = busy ? "Speichern …" : btn.dataset.label;
  }

  /* ---------------------------------------------------- Event-Infos */

  function renderEvent() {
    if (EVENT.company) $("event-company").textContent = EVENT.company;
    if (EVENT.title) {
      $("event-title").textContent = EVENT.title;
      document.title =
        EVENT.title + " · " + (EVENT.company || "Lipsia Digital");
    }
    if (EVENT.subtitle) $("event-subtitle").textContent = EVENT.subtitle;
    if (EVENT.date) {
      $("event-date").textContent = EVENT.date;
      $("event-date").hidden = false;
    }
    if (EVENT.locationName)
      $("event-location").textContent = EVENT.locationName;
    if (EVENT.mapsUrl) {
      $("event-maps-link").href = EVENT.mapsUrl;
      $("event-maps-link-2").href = EVENT.mapsUrl;
    }
    if (EVENT.mapsEmbedUrl) $("map-frame").src = EVENT.mapsEmbedUrl;

    if (!live) {
      var banner = $("banner");
      banner.innerHTML =
        "<strong>Vorschau-Modus:</strong> Einträge liegen nur in diesem Browser. " +
        "Für die geteilte Liste <code>SUPABASE_URL</code> und " +
        "<code>SUPABASE_ANON_KEY</code> in <code>config.js</code> eintragen " +
        "(siehe <code>README.md</code>).";
      banner.hidden = false;
    }
  }

  /* ---------------------------------------------------- Essen */

  var wishes = [];

  function renderWishes() {
    var listEl = $("wish-list");
    $("wish-count").textContent = String(wishes.length);
    $("wish-empty").hidden = wishes.length > 0;

    listEl.innerHTML = wishes
      .map(function (w) {
        return (
          '<li class="item">' +
          '<div class="item__body">' +
          '<div class="item__title">' +
          esc(w.item) +
          "</div>" +
          '<div class="item__meta">von <strong>' +
          esc(w.author) +
          "</strong></div>" +
          "</div>" +
          '<span class="tag">' +
          esc(w.amount) +
          "</span>" +
          '<button class="del" type="button" data-table="wishes" data-id="' +
          esc(w.id) +
          '" title="Wunsch löschen" aria-label="Wunsch von ' +
          esc(w.author) +
          ' löschen">×</button>' +
          "</li>"
        );
      })
      .join("");
  }

  /* ---------------------------------------------------- Transport */

  var rides = [];

  function renderRides() {
    var offers = rides.filter(function (r) {
      return r.kind === "offer";
    });
    var needs = rides.filter(function (r) {
      return r.kind !== "offer";
    });

    $("ride-count").textContent = String(rides.length);
    $("offer-list").innerHTML = offers.map(rideItem).join("");
    $("need-list").innerHTML = needs.map(rideItem).join("");
    $("offer-empty").hidden = offers.length > 0;
    $("need-empty").hidden = needs.length > 0;

    var sum = function (arr) {
      return arr.reduce(function (total, r) {
        return total + (Number(r.seats) || 0);
      }, 0);
    };
    $("stat-offered").textContent = String(sum(offers));
    $("stat-needed").textContent = String(sum(needs));
    $("ride-stats").hidden = rides.length === 0;
  }

  function rideItem(r) {
    var isOffer = r.kind === "offer";
    var seats = Number(r.seats) || 1;
    return (
      '<li class="item' +
      (isOffer ? "" : " item--need") +
      '">' +
      '<div class="item__body">' +
      '<div class="item__title">' +
      esc(r.author) +
      (isOffer
        ? " nimmt " + seats + (seats === 1 ? " Person" : " Personen") + " mit"
        : " braucht " +
          (seats === 1 ? "einen Platz" : seats + " Plätze")) +
      "</div>" +
      '<div class="item__meta">' +
      (isOffer ? "Treffpunkt: " : "Startpunkt: ") +
      "<strong>" +
      esc(r.pickup) +
      "</strong>" +
      (r.note ? " · " + esc(r.note) : "") +
      "</div>" +
      "</div>" +
      '<span class="tag">' +
      (isOffer ? seats + " frei" : "gesucht") +
      "</span>" +
      '<button class="del" type="button" data-table="rides" data-id="' +
      esc(r.id) +
      '" title="Eintrag löschen" aria-label="Eintrag von ' +
      esc(r.author) +
      ' löschen">×</button>' +
      "</li>"
    );
  }

  /* Formular-Beschriftungen an "biete/suche" anpassen */
  function syncRideForm() {
    var form = $("ride-form");
    var isOffer = field(form, "kind").value === "offer";
    $("ride-seats-label").textContent = isOffer
      ? "Freie Plätze"
      : "Wie viele Personen?";
    $("ride-pickup-label").textContent = isOffer
      ? "Treffpunkt / Abfahrtsort"
      : "Wo möchtest du abgeholt werden?";
    field(form, "pickup").placeholder = isOffer
      ? "z. B. Büro Lipsia Digital, 13:30"
      : "z. B. Hauptbahnhof Ostseite";
  }

  /* ---------------------------------------------------- Wiring */

  function loadAll() {
    return Promise.all([store.list("wishes"), store.list("rides")])
      .then(function (results) {
        wishes = results[0] || [];
        rides = results[1] || [];
        renderWishes();
        renderRides();
      })
      .catch(function (err) {
        var banner = $("banner");
        banner.innerHTML =
          "<strong>Daten konnten nicht geladen werden:</strong> " +
          esc(err.message);
        banner.hidden = false;
      });
  }

  function init() {
    renderEvent();
    renderWishes();
    renderRides();
    syncRideForm();

    /* Essenswunsch */
    $("wish-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var errorEl = $("wish-error");
      setError(errorEl, "");

      if (!validate(form, ["item", "amount", "author"])) {
        setError(errorEl, "Bitte alle Felder ausfüllen.");
        return;
      }

      submitting(form, true);
      store
        .insert("wishes", {
          item: field(form, "item").value.trim(),
          amount: field(form, "amount").value.trim(),
          author: field(form, "author").value.trim(),
        })
        .then(function (row) {
          wishes.push(row);
          renderWishes();
          var author = field(form, "author").value;
          form.reset();
          field(form, "author").value = author; /* Name merken */
          field(form, "item").focus();
        })
        .catch(function (err) {
          setError(errorEl, "Speichern fehlgeschlagen: " + err.message);
        })
        .then(function () {
          submitting(form, false);
        });
    });

    /* Mitfahrgelegenheit */
    $("ride-form").addEventListener("change", function (event) {
      if (event.target.name === "kind") syncRideForm();
    });

    $("ride-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var errorEl = $("ride-error");
      setError(errorEl, "");

      if (!validate(form, ["author", "seats", "pickup"])) {
        setError(errorEl, "Bitte Name, Plätze und Treffpunkt angeben.");
        return;
      }

      var seats = Math.max(1, Math.min(20, parseInt(field(form, "seats").value, 10) || 1));

      submitting(form, true);
      store
        .insert("rides", {
          kind: field(form, "kind").value,
          author: field(form, "author").value.trim(),
          seats: seats,
          pickup: field(form, "pickup").value.trim(),
          note: field(form, "note").value.trim() || null,
        })
        .then(function (row) {
          rides.push(row);
          renderRides();
          var author = field(form, "author").value;
          var kind = field(form, "kind").value;
          form.reset();
          field(form, "author").value = author;
          field(form, "kind").value = kind;
          syncRideForm();
        })
        .catch(function (err) {
          setError(errorEl, "Speichern fehlgeschlagen: " + err.message);
        })
        .then(function () {
          submitting(form, false);
        });
    });

    /* Löschen (beide Listen) */
    document.addEventListener("click", function (event) {
      var btn = event.target.closest(".del");
      if (!btn) return;

      var table = btn.dataset.table;
      var id = btn.dataset.id;
      if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;

      btn.disabled = true;
      store
        .remove(table, id)
        .then(function () {
          var keep = function (r) {
            return String(r.id) !== String(id);
          };
          if (table === "wishes") {
            wishes = wishes.filter(keep);
            renderWishes();
          } else {
            rides = rides.filter(keep);
            renderRides();
          }
        })
        .catch(function (err) {
          btn.disabled = false;
          window.alert("Löschen fehlgeschlagen: " + err.message);
        });
    });

    loadAll();

    /* Beim Zurückkehren auf den Tab neu laden, damit fremde
       Einträge sichtbar werden. */
    if (live) {
      document.addEventListener("visibilitychange", function () {
        if (!document.hidden) loadAll();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
