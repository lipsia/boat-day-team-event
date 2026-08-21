/* ============================================================
   Lipsia Digital — Boat Day
   Snack wishes + carpool sign-up

   Persistence: Supabase REST API (no build step, no dependencies).
   Without credentials in config.js the page runs in preview mode
   (localStorage, visible only in your own browser).
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
            /* plain-text response */
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

  /* Look a field up by name. Careful: form.elements.item returns the
     collection's built-in item() method, not the input — namedItem()
     sidesteps that collision (same for "length" and "namedItem"). */
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
      /* radio groups yield a RadioNodeList, which has no setAttribute/focus */
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
    btn.textContent = busy ? "Saving …" : btn.dataset.label;
  }

  /* ---------------------------------------------------- Event info */

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
      var startMapLink = $("start-map-link");
      if (startMapLink) startMapLink.href = EVENT.mapsUrl;
    }
    if (EVENT.mapsEmbedUrl) $("map-frame").src = EVENT.mapsEmbedUrl;

    if (!live) {
      var banner = $("banner");
      banner.innerHTML =
        "<strong>🛟 Preview mode:</strong> entries only live in this browser. " +
        "For the shared list, put <code>SUPABASE_URL</code> and " +
        "<code>SUPABASE_ANON_KEY</code> into <code>config.js</code> " +
        "(see <code>README.md</code>).";
      banner.hidden = false;
    }
  }

  /* ---------------------------------------------------- Fun ticker

     Read out by the paperclip in the sidebar, so a few of these lean into
     the "It looks like you're…" voice he is remembered for. */

  var TICKER_LINES = [
    "It looks like you're planning a boat trip! Would you like help with that?",
    "It looks like you're writing a snack list. I have opinions.",
    "Did you know… the person holding the snacks decides the route?",
    "Sunscreen is not a personality trait, but it is a requirement.",
    "Nobody has ever regretted bringing too many grapes.",
    "The lake is not a spreadsheet. You cannot sort it.",
    "Standup is cancelled. Standing up in the boat also is.",
    "Leipzig has more water than you think. Respect it.",
    "Bring a jumper — the sun clocks off earlier than you do.",
    "If the potato salad has been warm since noon, let it go.",
    "Whoever forgets the bottle opener rows back alone.",
    "Yes, someone will fall in. No, we are not taking bets. (We are.)",
    "This window cannot be resized, minimised, or closed. Sorry.",
    "Press Start to go somewhere. Any Start. There is only one.",
    "You cannot dismiss me. Nobody ever could.",
  ];

  /* ---------------------------------------------------- Office assistant

     The real Clippy, via clippyjs (github.com/pithings/clippy), pulled off
     a CDN as an ES module so there is still no build step and nothing to
     vendor. He is about 1.3 MB of sprite sheet, which is roughly twenty
     times the rest of the site, so he is fetched lazily and never holds up
     first paint. If the CDN is blocked or the user is offline the page
     simply carries on without him.

     His mp3 pack is deliberately not loaded — the boot chime stays the only
     sound in the app. */

  var CLIPPY_CDN = "https://cdn.jsdelivr.net/npm/clippyjs@0.1.0/dist/";

  /* the agent, once he has landed; the shutdown line talks through him */
  var clippy = null;

  /* Everything he says goes through here, so the sr-only live region stays
     in step with the balloon. */
  function say(text) {
    if (!clippy) return;
    clippy.speak(text);
    var live = $("assistant-say");
    if (live) live.textContent = text;
  }

  function loadClippy() {
    return Promise.all([
      import(CLIPPY_CDN + "index.mjs"),
      import(CLIPPY_CDN + "agents/clippy/index.mjs"),
    ]).then(function (mods) {
      var loaders = mods[1].default;
      return mods[0].initAgent({
        agent: loaders.agent,
        map: loaders.map,
        /* skip sounds-mp3.mjs; initAgent only wants a default export here */
        sound: function () {
          return Promise.resolve({ default: {} });
        },
      });
    });
  }

  /* The boot overlay sits above everything, and the agent parks itself at
     z-index 10001 — so hold him back until the overlay has gone. */
  function whenBooted(done) {
    var boot = $("boot");
    if (!boot || boot.hidden) return done();
    var obs = new MutationObserver(function () {
      if (!boot.hidden) return;
      obs.disconnect();
      done();
    });
    obs.observe(boot, { attributes: true, attributeFilter: ["hidden"] });
  }

  function startAssistant() {
    loadClippy()
      .then(function (agent) {
        whenBooted(function () {
          clippy = agent;
          agent.show();
          /* bottom right, clear of the taskbar. He is draggable from there,
             and the library clamps him back on screen when the window
             resizes, so this is the only placement we do. */
          agent.moveTo(
            Math.max(24, window.innerWidth - 180),
            Math.max(24, window.innerHeight - 190),
            0
          );

          /* start on the current minute, so he does not restart the list
             from the top on every reload */
          var i = new Date().getMinutes() % TICKER_LINES.length;
          say(TICKER_LINES[i]);
          setInterval(function () {
            i = (i + 1) % TICKER_LINES.length;
            /* every fourth line, do something with his hands first —
               more often than that and the action queue backs up */
            if (i % 4 === 0) agent.animate();
            say(TICKER_LINES[i]);
          }, 10000);
        });
      })
      .catch(function () {
        /* offline, blocked, or the CDN moved: no assistant, no error */
      });
  }

  /* ---------------------------------------------------- Sounds

     Everything is synthesised with the Web Audio API — no audio files in
     the repo, and no reuse of Microsoft's actual sounds. Browsers refuse
     to start audio before a user gesture, so the context is created on
     the first click or keypress; the startup chime plays then, if the
     boot screen is still up. The tray speaker mutes and unmutes, and the
     choice is remembered. */
  var Sound = (function () {
    var ctx = null;
    var muted = false;
    try {
      muted = localStorage.getItem("ld-muted") === "1";
    } catch (e) {
      /* storage disabled — default to audible */
    }

    function context() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (e) {
        ctx = null;
      }
      return ctx;
    }

    /* One enveloped oscillator. The defaults are deliberately crude — a
       square wave, a near-instant attack, barely any filtering up top —
       because that is what reads as old hardware instead of as a jingle. */
    function voice(o) {
      var c = context();
      if (!c) return;
      var t0 = c.currentTime + (o.delay || 0);
      var dur = o.dur;
      var attack = o.attack || 0.004;
      var hold = o.hold || 0;
      var peak = o.gain || 0.05;
      var osc = c.createOscillator();
      var gain = c.createGain();
      var filter = c.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.value = o.cutoff || 9500;
      osc.type = o.type || "square";
      osc.frequency.setValueAtTime(o.from, t0);
      if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);

      /* click on, sit still, drop away — no gentle swells */
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + attack);
      if (hold) gain.gain.setValueAtTime(peak, t0 + attack + hold);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.04);
    }

    /* One tune, and only one: the boot chime. Everything sits on a coarse
       tempo grid so it comes out blocky on purpose. */
    var STEP = 0.085;
    var RECIPES = {
      startup: function () {
        /* staccato arpeggio — C5 E5 G5 C6, blipped out on the beat */
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
          voice({ from: f, dur: STEP * 0.8, gain: 0.05, delay: i * STEP });
          /* an octave down and a hair flat: a two-oscillator chorus, cheaply */
          voice({ from: (f / 2) * 0.997, dur: STEP * 0.8, gain: 0.03, delay: i * STEP });
        });

        /* the landing chord, held: top C with a fifth underneath */
        var land = 4 * STEP;
        voice({ from: 1046.5, dur: 0.66, gain: 0.055, delay: land, hold: 0.4 });
        voice({ from: 783.99, dur: 0.66, gain: 0.038, delay: land, hold: 0.4 });
        /* and a pulse bass for the thump */
        voice({ from: 130.81, dur: 0.7, gain: 0.05, delay: land, hold: 0.45, cutoff: 2200 });
      },
    };

    function play(name) {
      if (muted) return;
      var c = context();
      /* still blocked by the autoplay policy — stay silent rather than throw */
      if (!c || c.state === "suspended") return;
      var recipe = RECIPES[name];
      if (!recipe) return;
      try {
        recipe();
      } catch (e) {
        /* audio is a nicety; never let it break the page */
      }
    }

    function setMuted(next) {
      muted = next;
      try {
        localStorage.setItem("ld-muted", muted ? "1" : "0");
      } catch (e) {
        /* ignore */
      }
      var icon = $("sound-icon");
      var btn = $("sound-toggle");
      if (icon) icon.textContent = muted ? "🔇" : "🔊";
      if (btn) {
        btn.setAttribute("aria-pressed", muted ? "false" : "true");
        var label = btn.querySelector(".sr-only");
        if (label) label.textContent = muted ? "Turn sounds on" : "Turn sounds off";
      }
    }

    /* create/resume the context on the first gesture the browser gives us */
    function arm(onUnlock) {
      var unlock = function () {
        var c = context();
        if (!c) return;
        if (c.state === "suspended" && c.resume) {
          c.resume().then(function () {
            if (onUnlock) onUnlock();
          }, function () {});
        } else if (onUnlock) {
          onUnlock();
        }
        document.removeEventListener("pointerdown", unlock, true);
        document.removeEventListener("keydown", unlock, true);
      };
      document.addEventListener("pointerdown", unlock, true);
      document.addEventListener("keydown", unlock, true);
    }

    return {
      play: play,
      arm: arm,
      isMuted: function () {
        return muted;
      },
      toggle: function () {
        setMuted(!muted);
      },
      sync: function () {
        setMuted(muted);
      },
    };
  })();

  /* Wire the speaker in the tray and arm the audio context. The chime on
     boot is the only sound in the app; clicking around stays silent. */
  function soundUi() {
    Sound.sync();

    var btn = $("sound-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        Sound.toggle();
      });
    }

    Sound.arm(function () {
      var boot = $("boot");
      /* only greet you if the boot screen is actually still on screen */
      if (boot && !boot.hidden) Sound.play("startup");
    });
  }

  /* ---------------------------------------------------- Boot screen

     The overlay clears itself via CSS, so this only adds the niceties:
     click or any key skips it, and it plays once per browser session so
     it does not get tedious for people checking the list repeatedly.
     Append ?boot to the URL to watch it again. */
  function bootScreen() {
    var boot = $("boot");
    if (!boot) return;

    var dismiss = function () {
      boot.hidden = true;
    };

    var replay = window.location.search.indexOf("boot") !== -1;
    if (!replay) {
      try {
        if (sessionStorage.getItem("ld-booted")) {
          dismiss();
          return;
        }
        sessionStorage.setItem("ld-booted", "1");
      } catch (e) {
        /* private mode / storage disabled — just play it */
      }
    }

    /* belt and braces: never let the overlay outlive its animation */
    setTimeout(dismiss, 5000);
    boot.addEventListener("click", dismiss);
    document.addEventListener("keydown", function onKey() {
      dismiss();
      document.removeEventListener("keydown", onKey);
    });
  }

  /* ---------------------------------------------------- Desktop chrome */

  /* Taskbar clock, in the user's locale, ticking every 15s. */
  function startClock() {
    var el = $("clock");
    if (!el) return;
    var tick = function () {
      var now = new Date();
      el.textContent = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    };
    tick();
    setInterval(tick, 15000);
  }

  /* Start button opens the menu; Escape, outside clicks and picking an
     item all close it again. */
  function startMenu() {
    var btn = $("start-btn");
    var menu = $("start-menu");
    if (!btn || !menu) return;

    var open = function (state) {
      menu.hidden = !state;
      btn.setAttribute("aria-expanded", state ? "true" : "false");
    };

    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      var opening = menu.hidden;
      open(opening);
    });

    document.addEventListener("click", function (event) {
      if (!menu.hidden && !menu.contains(event.target)) open(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        open(false);
        btn.focus();
      }
    });

    /* the two decorative entries do not navigate anywhere */
    menu.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link) return;
      if (link.hasAttribute("data-noop")) {
        event.preventDefault();
        if (clippy) {
          clippy.stop();
          say("It is now safe to turn off your computer.");
        }
      }
      open(false);
    });
  }

  /* ---------------------------------------------------- Snacks */

  /* Guess a fitting emoji for the wish — decoration only, has a fallback. */
  var FOOD_EMOJI = [
    [/pizza|margherita|salami/i, "🍕"],
    [/beer|bier|pils|lager|ale/i, "🍺"],
    [/wine|wein|prosecco|sekt|champ/i, "🍷"],
    [/water|wasser|sprudel/i, "💧"],
    [/cola|soda|limo|fanta|sprite|juice|saft/i, "🥤"],
    [/coffee|kaffee|espresso/i, "☕"],
    [/cake|kuchen|torte|muffin|brownie/i, "🍰"],
    [/cookie|keks|biscuit/i, "🍪"],
    [/ice|eis|sorbet/i, "🍦"],
    [/chips|crisps|nacho|pretzel|brezel/i, "🥨"],
    [/melon|melone/i, "🍉"],
    [/grape|traube/i, "🍇"],
    [/strawberr|erdbeer/i, "🍓"],
    [/apple|apfel/i, "🍎"],
    [/banana|banane/i, "🍌"],
    [/salad|salat|slaw/i, "🥗"],
    [/potato|kartoffel|fries|pommes/i, "🥔"],
    [/bread|brot|baguette|roll|brötchen/i, "🥖"],
    [/cheese|käse/i, "🧀"],
    [/sausage|wurst|bratwurst|grill|bbq/i, "🌭"],
    [/burger/i, "🍔"],
    [/wrap|burrito|taco/i, "🌯"],
    [/sushi|maki/i, "🍣"],
    [/noodle|pasta|nudel|spaghetti/i, "🍝"],
    [/hummus|dip|sauce|soße/i, "🥣"],
    [/veg|gemüse|carrot|karotte|cucumber|gurke/i, "🥕"],
    [/nut|nuss|mandel|peanut/i, "🥜"],
    [/choco|schoko/i, "🍫"],
    [/tea|tee/i, "🍵"],
  ];
  var FALLBACK_EMOJI = ["🍽️", "🧺", "🥪", "🍱", "🛟", "🌞", "🧊"];

  function foodEmoji(text) {
    var value = String(text || "");
    for (var i = 0; i < FOOD_EMOJI.length; i++) {
      if (FOOD_EMOJI[i][0].test(value)) return FOOD_EMOJI[i][1];
    }
    /* stable fallback: same input -> same emoji */
    var hash = 0;
    for (var c = 0; c < value.length; c++) {
      hash = (hash * 31 + value.charCodeAt(c)) % 100000;
    }
    return FALLBACK_EMOJI[hash % FALLBACK_EMOJI.length];
  }

  var wishes = [];

  function renderWishes() {
    var listEl = $("wish-list");
    $("wish-count").textContent = String(wishes.length);
    $("wish-empty").hidden = wishes.length > 0;

    listEl.innerHTML = wishes
      .map(function (w) {
        return (
          '<li class="item">' +
          '<span class="item__emoji" aria-hidden="true">' +
          foodEmoji(w.item) +
          "</span>" +
          '<div class="item__body">' +
          '<div class="item__title">' +
          esc(w.item) +
          "</div>" +
          '<div class="item__meta">wanted by <strong>' +
          esc(w.author) +
          "</strong></div>" +
          "</div>" +
          '<span class="tag">' +
          esc(w.amount) +
          "</span>" +
          '<button class="del" type="button" data-table="wishes" data-id="' +
          esc(w.id) +
          '" title="Throw overboard" aria-label="Remove the snack added by ' +
          esc(w.author) +
          '">×</button>' +
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
      '<span class="item__emoji" aria-hidden="true">' +
      (isOffer ? "🚗" : "🙋") +
      "</span>" +
      '<div class="item__body">' +
      '<div class="item__title">' +
      esc(r.author) +
      (isOffer
        ? " can take " + seats + (seats === 1 ? " person" : " people")
        : " needs " + (seats === 1 ? "a seat" : seats + " seats")) +
      "</div>" +
      '<div class="item__meta">' +
      (isOffer ? "Leaving from: " : "Pick me up at: ") +
      "<strong>" +
      esc(r.pickup) +
      "</strong>" +
      (r.note ? " · " + esc(r.note) : "") +
      "</div>" +
      "</div>" +
      '<span class="tag">' +
      (isOffer
        ? seats + (seats === 1 ? " seat free" : " seats free")
        : "needs a lift") +
      "</span>" +
      '<button class="del" type="button" data-table="rides" data-id="' +
      esc(r.id) +
      '" title="Throw overboard" aria-label="Remove the entry added by ' +
      esc(r.author) +
      '">×</button>' +
      "</li>"
    );
  }

  /* Relabel the form: driving vs. needing a lift */
  function syncRideForm() {
    var form = $("ride-form");
    var isOffer = field(form, "kind").value === "offer";
    $("ride-seats-label").textContent = isOffer
      ? "Free seats"
      : "How many of you?";
    $("ride-pickup-label").textContent = isOffer
      ? "Where are you leaving from?"
      : "Where should we pick you up?";
    field(form, "pickup").placeholder = isOffer
      ? "e.g. the office, 1:30 pm sharp-ish"
      : "e.g. Hauptbahnhof, east side";
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
          "<strong>🪣 Could not load the lists:</strong> " +
          esc(err.message);
        banner.hidden = false;
      });
  }

  function init() {
    soundUi();
    bootScreen();
    renderEvent();
    startClock();
    startMenu();
    startAssistant();
    renderWishes();
    renderRides();
    syncRideForm();

    /* snack wish */
    $("wish-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var errorEl = $("wish-error");
      setError(errorEl, "");

      if (!validate(form, ["item", "amount", "author"])) {
        setError(errorEl, "Every field, please — snacks need an owner. 🍽️");
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
          field(form, "author").value = author; /* keep the name for the next entry */
          field(form, "item").focus();
        })
        .catch(function (err) {
          setError(errorEl, "Could not save that: " + err.message);
        })
        .then(function () {
          submitting(form, false);
        });
    });

    /* carpool entry */
    $("ride-form").addEventListener("change", function (event) {
      if (event.target.name === "kind") syncRideForm();
    });

    $("ride-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var errorEl = $("ride-error");
      setError(errorEl, "");

      if (!validate(form, ["author", "seats", "pickup"])) {
        setError(errorEl, "Need a name, a seat count and a pickup point. 🚗");
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
          setError(errorEl, "Could not save that: " + err.message);
        })
        .then(function () {
          submitting(form, false);
        });
    });

    /* delete (both lists) */
    document.addEventListener("click", function (event) {
      var btn = event.target.closest(".del");
      if (!btn) return;

      var table = btn.dataset.table;
      var id = btn.dataset.id;
      if (!window.confirm("Delete this entry? It disappears for everyone.")) return;

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
          window.alert("Could not remove that: " + err.message);
        });
    });

    loadAll();

    /* Reload when the tab regains focus so entries added by other
       people show up. */
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
