(function (global) {
  "use strict";

  const protocol = (global.location && global.location.protocol) || "";
  const isCapacitor =
    protocol === "capacitor:" ||
    protocol === "ionic:" ||
    typeof global.Capacitor !== "undefined";
  const isStaticMode =
    Boolean(global.__ASSO_STATIC_MODE__) || protocol === "file:" || isCapacitor;

  if (!isStaticMode) {
    return;
  }

  if (global.document && global.document.documentElement) {
    global.document.documentElement.classList.add("is-static-mode");
    if (isCapacitor) {
      global.document.documentElement.classList.add("is-capacitor-app");
    }
  }

  const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const ICS_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const HOLIDAY_PERIODS = ["Toussaint", "Noël", "Hiver", "Printemps", "Été", "Toutes vacances"];
  const TIME_BUCKET_RANGES = {
    morning: [0, 720],
    noon: [720, 840],
    afternoon: [840, 1020],
    afterschool: [990, 1140],
    evening: [1140, 1440],
    aprem: [840, 1080],
    soir: [1080, 1440],
  };

  const CATEGORIES = [
    "Sports collectifs",
    "Sports individuels & raquettes",
    "Arts martiaux & combat",
    "Danse & expression",
    "Bien-être & santé",
    "Musique, chant & théâtre",
    "Arts plastiques & création",
    "Langues & jeux",
  ];

  const DEFAULT_AUDIENCE_GROUPS = [
    { code: "maternelle", label: "Maternelle (3–5 ans)", age_min: 3, age_max: 5 },
    { code: "primaire", label: "Primaire (6–10 ans)", age_min: 6, age_max: 10 },
    { code: "college", label: "Collège (11–14 ans)", age_min: 11, age_max: 14 },
    { code: "lycee", label: "Lycée (15–17 ans)", age_min: 15, age_max: 17 },
    { code: "adulte", label: "Adultes (18+)", age_min: 18, age_max: 59 },
    { code: "senior", label: "Seniors (60+)", age_min: 60, age_max: 110 },
  ];

  const GRADES = [
    { order: 1, code: "PS", label: "Petite Section (PS - 3 ans)", short: "PS", age: 3 },
    { order: 2, code: "MS", label: "Moyenne Section (MS - 4 ans)", short: "MS", age: 4 },
    { order: 3, code: "GS", label: "Grande Section (GS - 5 ans)", short: "GS", age: 5 },
    { order: 4, code: "CP", label: "CP (6 ans)", short: "CP", age: 6 },
    { order: 5, code: "CE1", label: "CE1 (7 ans)", short: "CE1", age: 7 },
    { order: 6, code: "CE2", label: "CE2 (8 ans)", short: "CE2", age: 8 },
    { order: 7, code: "CM1", label: "CM1 (9 ans)", short: "CM1", age: 9 },
    { order: 8, code: "CM2", label: "CM2 (10 ans)", short: "CM2", age: 10 },
    { order: 9, code: "6E", label: "6ème (11 ans)", short: "6e", age: 11 },
    { order: 10, code: "5E", label: "5ème (12 ans)", short: "5e", age: 12 },
    { order: 11, code: "4E", label: "4ème (13 ans)", short: "4e", age: 13 },
    { order: 12, code: "3E", label: "3ème (14 ans)", short: "3e", age: 14 },
    { order: 13, code: "2DE", label: "Seconde (15 ans)", short: "2de", age: 15 },
    { order: 14, code: "1ERE", label: "Première (16 ans)", short: "1ère", age: 16 },
    { order: 15, code: "TLE", label: "Terminale (17 ans)", short: "Tle", age: 17 },
    { order: 20, code: "ADULTE", label: "Adulte (18+ ans)", short: "Adulte", age: 18 },
    { order: 25, code: "SENIOR", label: "Senior (60+ ans)", short: "Senior", age: 60 },
  ];

  const GRADE_BY_ORDER = new Map(GRADES.map((g) => [g.order, g]));
  const GRADE_BY_CODE = new Map(GRADES.map((g) => [g.code, g]));
  const GRADE_ALIASES = {
    ps: 1,
    "petite section": 1,
    ms: 2,
    "moyenne section": 2,
    gs: 3,
    "grande section": 3,
    cp: 4,
    ce1: 5,
    ce2: 6,
    cm1: 7,
    cm2: 8,
    "6e": 9,
    "6eme": 9,
    sixieme: 9,
    "5e": 10,
    "5eme": 10,
    cinquieme: 10,
    "4e": 11,
    "4eme": 11,
    quatrieme: 11,
    "3e": 12,
    "3eme": 12,
    troisieme: 12,
    "2de": 13,
    "2nde": 13,
    seconde: 13,
    "1ere": 14,
    premiere: 14,
    tle: 15,
    term: 15,
    terminale: 15,
    adulte: 20,
    adultes: 20,
    senior: 25,
    seniors: 25,
  };

  function stripAccents(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function norm(value) {
    if (value === null || value === undefined) return "";
    return stripAccents(value).toLowerCase().trim().replace(/\s+/g, " ");
  }

  const CANONICAL_CAT_BY_NORM = {};
  CATEGORIES.forEach((cat) => {
    CANONICAL_CAT_BY_NORM[norm(cat)] = cat;
  });

  const CATEGORY_ALIASES = {
    ...CANONICAL_CAT_BY_NORM,
    "sports individuels et raquettes": "Sports individuels & raquettes",
    "arts martiaux et combat": "Arts martiaux & combat",
    "danse et expression": "Danse & expression",
    "bien-etre et sante": "Bien-être & santé",
    "bien etre & sante": "Bien-être & santé",
    "bien etre et sante": "Bien-être & santé",
    "musique, chant et theatre": "Musique, chant & théâtre",
    "musique chant & theatre": "Musique, chant & théâtre",
    "musique chant et theatre": "Musique, chant & théâtre",
    "arts plastiques et creation": "Arts plastiques & création",
    "langues et jeux": "Langues & jeux",
    sport: "Sports individuels & raquettes",
    sports: "Sports individuels & raquettes",
    "arts martiaux": "Arts martiaux & combat",
    danse: "Danse & expression",
    "arts & culture": "Arts plastiques & création",
    "arts et culture": "Arts plastiques & création",
    "musique & theatre": "Musique, chant & théâtre",
    "musique et theatre": "Musique, chant & théâtre",
    "bien-etre & fitness": "Bien-être & santé",
    "bien-etre et fitness": "Bien-être & santé",
    "bien etre & fitness": "Bien-être & santé",
    "multisport & culture": "Sports collectifs",
    "multisport et culture": "Sports collectifs",
    langues: "Langues & jeux",
    "loisirs & jeux": "Langues & jeux",
    "loisirs et jeux": "Langues & jeux",
  };

  const COMMA_CATEGORY_SENTINEL = "__CAT_MUSIQUE_CHANT_THEATRE__";
  const COMMA_CATEGORY_RE = /musique\s*,\s*chant\s*(?:&|et)\s*th[eéê]âtre/gi;
  const COMMA_CATEGORY_ASCII_RE = /musique\s*,\s*chant\s*(?:&|et)\s*theatre/gi;

  function normalizeCategory(raw) {
    if (!raw || !String(raw).trim()) return "";
    const key = norm(raw);
    if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, key)) {
      return CATEGORY_ALIASES[key];
    }
    return String(raw).trim();
  }

  function splitCategoryString(raw) {
    if (!raw || !String(raw).trim()) return [];
    const text = String(raw).trim();
    if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, norm(text))) {
      return [text];
    }
    const parts = [];
    text.split(/[|;]/).forEach((chunkRaw) => {
      const chunk = chunkRaw.trim();
      if (!chunk) return;
      if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, norm(chunk))) {
        parts.push(chunk);
        return;
      }
      const protectedChunk = chunk
        .replace(COMMA_CATEGORY_RE, COMMA_CATEGORY_SENTINEL)
        .replace(COMMA_CATEGORY_ASCII_RE, COMMA_CATEGORY_SENTINEL);
      protectedChunk.split(",").forEach((subRaw) => {
        const tok = subRaw.trim();
        if (!tok) return;
        if (tok === COMMA_CATEGORY_SENTINEL) {
          parts.push("Musique, chant & théâtre");
        } else {
          parts.push(tok.replace(new RegExp(COMMA_CATEGORY_SENTINEL, "g"), "Musique, chant & théâtre"));
        }
      });
    });
    return parts;
  }

  function parseSimpleListParam(multiValues, singleValue) {
    const rawItems = [];
    if (singleValue) rawItems.push(singleValue);
    if (Array.isArray(multiValues)) {
      multiValues.forEach((v) => {
        if (v) rawItems.push(v);
      });
    }
    const out = [];
    rawItems.forEach((item) => {
      String(item)
        .replace(/\|/g, ",")
        .split(",")
        .forEach((chunk) => {
          const tok = chunk.trim();
          if (tok) out.push(tok);
        });
    });
    return out;
  }

  function parseCategoryParams(multiValues, singleValue) {
    const rawItems = [];
    if (singleValue) rawItems.push(singleValue);
    if (Array.isArray(multiValues)) {
      multiValues.forEach((v) => {
        if (v) rawItems.push(v);
      });
    }
    const selected = new Set();
    rawItems.forEach((item) => {
      const str = String(item);
      const tokens = str.includes("|")
        ? str.split("|").map((p) => p.trim()).filter(Boolean)
        : splitCategoryString(str);
      tokens.forEach((tok) => {
        const canon = normalizeCategory(tok);
        if (canon) selected.add(stripAccents(canon).toLowerCase());
      });
    });
    return selected;
  }

  function parseDisciplineParams(multiValues, singleValue) {
    const rawItems = [];
    if (singleValue) rawItems.push(singleValue);
    if (Array.isArray(multiValues)) {
      multiValues.forEach((v) => {
        if (v) rawItems.push(v);
      });
    }
    const selected = new Set();
    rawItems.forEach((item) => {
      const str = String(item);
      let tokens;
      if (str.includes("|")) tokens = str.split("|");
      else if (str.includes(",")) tokens = str.split(",");
      else tokens = [str];
      tokens.forEach((tok) => {
        const clean = stripAccents(tok.trim()).toLowerCase();
        if (clean) selected.add(clean);
      });
    });
    return selected;
  }

  function parseOptionalInt(val) {
    if (val === null || val === undefined || val === "") return null;
    const str = String(val).trim();
    if (!/^-?\d+$/.test(str)) return null;
    const n = Number(str);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  function gradeCodeToOrder(grade) {
    if (grade === null || grade === undefined || grade === "") return null;
    if (typeof grade === "number" && Number.isInteger(grade)) {
      return GRADE_BY_ORDER.has(grade) ? grade : null;
    }
    const raw = String(grade).trim();
    if (/^\d+$/.test(raw)) {
      const num = Number(raw);
      return GRADE_BY_ORDER.has(num) ? num : null;
    }
    const key = stripAccents(raw).toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(GRADE_ALIASES, key)) {
      return GRADE_ALIASES[key];
    }
    const upper = raw.toUpperCase();
    if (GRADE_BY_CODE.has(upper)) {
      return GRADE_BY_CODE.get(upper).order;
    }
    return null;
  }

  function gradeOrderToAge(order) {
    if (order === null || order === undefined) return null;
    const item = GRADE_BY_ORDER.get(order);
    return item ? item.age : null;
  }

  function gradeOrderToCode(order) {
    if (order === null || order === undefined) return null;
    const item = GRADE_BY_ORDER.get(order);
    return item ? item.code : null;
  }

  function gradeOrderToLabel(order) {
    if (order === null || order === undefined) return null;
    const item = GRADE_BY_ORDER.get(order);
    return item ? item.label : null;
  }

  function ageToGradeOrder(age) {
    if (age === null || age === undefined) return null;
    if (age <= 3) return 1;
    if (age <= 17) return age - 2;
    if (age < 60) return 20;
    return 25;
  }

  function resolvePersonProfile({ age = null, grade = null, birthYear = null, seasonStartYear = 2026 }) {
    const year = seasonStartYear || 2026;
    const gradeOrder = gradeCodeToOrder(grade);

    let resolvedAge = age;
    if (resolvedAge === null && gradeOrder !== null) {
      resolvedAge = gradeOrderToAge(gradeOrder);
    }
    if (resolvedAge === null && birthYear !== null) {
      resolvedAge = Math.max(0, year - birthYear);
    }

    const resolvedGrade = gradeOrder !== null ? gradeOrder : ageToGradeOrder(resolvedAge);
    const resolvedBirthYear =
      birthYear !== null ? birthYear : resolvedAge !== null ? year - resolvedAge : null;

    let sourceMode = "any";
    if (gradeOrder !== null) sourceMode = "grade";
    else if (birthYear !== null) sourceMode = "birth_year";
    else if (age !== null) sourceMode = "age";

    return {
      age: resolvedAge,
      grade_order: resolvedGrade,
      grade_code: gradeOrderToCode(resolvedGrade),
      grade_label: gradeOrderToLabel(resolvedGrade),
      birth_year: resolvedBirthYear,
      source_mode: sourceMode,
    };
  }

  function inRange(value, minV, maxV) {
    if (value === null || value === undefined) return true;
    if (minV !== null && minV !== undefined && value < minV) return false;
    if (maxV !== null && maxV !== undefined && value > maxV) return false;
    return true;
  }

  function slotMatchesPerson(slot, { age = null, grade = null, birthYear = null, seasonStartYear = 2026 }) {
    if (age === null && (grade === null || grade === "") && birthYear === null) {
      return true;
    }

    const profile = resolvePersonProfile({ age, grade, birthYear, seasonStartYear });
    const hasAgeBounds = slot.age_min !== null && slot.age_min !== undefined
      || slot.age_max !== null && slot.age_max !== undefined;
    const hasGradeBounds = slot.grade_min !== null && slot.grade_min !== undefined
      || slot.grade_max !== null && slot.grade_max !== undefined;
    const hasByBounds = slot.birth_year_min !== null && slot.birth_year_min !== undefined
      || slot.birth_year_max !== null && slot.birth_year_max !== undefined;

    if (!hasAgeBounds && !hasGradeBounds && !hasByBounds) {
      return true;
    }

    const mode = profile.source_mode;
    if (mode === "grade" && hasGradeBounds) {
      return inRange(profile.grade_order, slot.grade_min, slot.grade_max);
    }
    if (mode === "birth_year" && hasByBounds) {
      return inRange(profile.birth_year, slot.birth_year_min, slot.birth_year_max);
    }
    if (hasAgeBounds) {
      return inRange(profile.age, slot.age_min, slot.age_max);
    }
    if (hasGradeBounds) {
      return inRange(profile.grade_order, slot.grade_min, slot.grade_max);
    }
    return inRange(profile.birth_year, slot.birth_year_min, slot.birth_year_max);
  }

  function getAudienceGroupMap(catalog) {
    const groups =
      catalog && catalog.meta && Array.isArray(catalog.meta.audience_groups) && catalog.meta.audience_groups.length
        ? catalog.meta.audience_groups
        : DEFAULT_AUDIENCE_GROUPS;
    const map = new Map();
    groups.forEach((g) => map.set(g.code, g));
    return map;
  }

  function slotMatchesAudienceGroup(slot, groupCode, groupMap) {
    const group = groupMap.get(groupCode);
    if (!group) return false;

    let slotMin = slot.age_min;
    if ((slotMin === null || slotMin === undefined) && slot.grade_min !== null && slot.grade_min !== undefined) {
      slotMin = gradeOrderToAge(slot.grade_min);
    }
    const slotMinVal = slotMin === null || slotMin === undefined ? 0 : Number(slotMin);

    let slotMax = slot.age_max;
    if (
      (slotMax === null || slotMax === undefined) &&
      slot.grade_max !== null &&
      slot.grade_max !== undefined &&
      slot.grade_max < 20
    ) {
      slotMax = gradeOrderToAge(slot.grade_max);
    }
    const slotMaxVal = slotMax === null || slotMax === undefined ? 110 : Number(slotMax);

    if (groupCode === "senior") {
      if (
        (slot.age_max === null || slot.age_max === undefined) &&
        (slot.grade_max === null || slot.grade_max === undefined || slot.grade_max >= 20) &&
        ((slot.age_min !== null && slot.age_min !== undefined && slot.age_min <= 60) || slot.grade_max === 25)
      ) {
        return true;
      }
    }

    return slotMinVal <= group.age_max && group.age_min <= slotMaxVal;
  }

  function campMatchesAudienceGroup(camp, groupCode, groupMap) {
    const group = groupMap.get(groupCode);
    if (!group) return false;
    const campMin = camp.age_min === null || camp.age_min === undefined ? 0 : Number(camp.age_min);
    const campMax = camp.age_max === null || camp.age_max === undefined ? 110 : Number(camp.age_max);
    return campMin <= group.age_max && group.age_min <= campMax;
  }

  function timeToMinutes(hhmm) {
    if (!hhmm || typeof hhmm !== "string") return null;
    const parts = hhmm.trim().split(":");
    if (parts.length < 2) return null;
    const hRaw = parts[0].trim();
    const mRaw = parts[1].trim();
    if (!/^\d+$/.test(hRaw) || !/^\d+$/.test(mRaw)) return null;
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (h < 0 || h > 24 || m < 0 || m >= 60 || (h === 24 && m > 0)) return null;
    return h * 60 + m;
  }

  function parseTimeBuckets(rawTimeBuckets) {
    if (!rawTimeBuckets) return [];
    const ranges = [];
    String(rawTimeBuckets)
      .replace(/\|/g, ",")
      .split(",")
      .forEach((rawTok) => {
        const key = rawTok.trim().toLowerCase();
        if (Object.prototype.hasOwnProperty.call(TIME_BUCKET_RANGES, key)) {
          ranges.push(TIME_BUCKET_RANGES[key]);
        }
      });
    return ranges;
  }

  function parseDaySlots(rawDaySlots) {
    if (!rawDaySlots) return [];
    const pairs = [];
    String(rawDaySlots)
      .replace(/\|/g, ",")
      .split(",")
      .forEach((rawTok) => {
        const tok = rawTok.trim();
        const colonIdx = tok.indexOf(":");
        if (colonIdx < 0) return;
        const rawDay = tok.slice(0, colonIdx).trim();
        const bucketKey = tok.slice(colonIdx + 1).trim().toLowerCase();
        if (!/^\d+$/.test(rawDay)) return;
        const dayVal = Number(rawDay);
        if (dayVal < 0 || dayVal > 6) return;
        if (!Object.prototype.hasOwnProperty.call(TIME_BUCKET_RANGES, bucketKey)) return;
        pairs.push([dayVal, TIME_BUCKET_RANGES[bucketKey]]);
      });
    return pairs;
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371.0;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const p1 = toRad(lat1);
    const p2 = toRad(lat2);
    const dp = toRad(lat2 - lat1);
    const dl = toRad(lng2 - lng1);
    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function walkMinutes(km) {
    return Math.max(1, Math.round((km / 4.5) * 60));
  }

  function getItemCategories(item) {
    if (Array.isArray(item.categories) && item.categories.length) {
      return item.categories;
    }
    return item.category ? [item.category] : [];
  }

  /* -------------------------------------------------------------------------
   * Chargement unique et mise en cache mémoire de ./data/catalog.json
   * ------------------------------------------------------------------------- */
  const origFetch = typeof global.fetch === "function" ? global.fetch.bind(global) : null;
  let catalogPromise = null;

  function loadCatalogViaScriptFallback() {
    return new Promise((resolve, reject) => {
      if (global.__ASSO_STATIC_CATALOG__) {
        resolve(global.__ASSO_STATIC_CATALOG__);
        return;
      }
      const script = document.createElement("script");
      script.src = "./data/catalog.js";
      script.async = true;
      script.onload = () => {
        if (global.__ASSO_STATIC_CATALOG__) {
          resolve(global.__ASSO_STATIC_CATALOG__);
        } else {
          reject(new Error("Catalogue hors-ligne introuvable dans ./data/catalog.js"));
        }
      };
      script.onerror = () => {
        reject(new Error("Impossible de charger le catalogue hors-ligne (./data/catalog.json)."));
      };
      document.head.appendChild(script);
    });
  }

  function prepareCatalogIndexes(catalog) {
    if (!catalog || catalog._haystackPrepared) return catalog;
    const slots = Array.isArray(catalog.slots) ? catalog.slots : [];
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const slotCats = getItemCategories(s);
      s._haystack = stripAccents(
        [
          s.title || "",
          s.discipline || "",
          slotCats.join(" "),
          s.audience_label || "",
          s.notes || "",
          s.organization_name || "",
          s.venue_name || "",
        ].join(" ")
      ).toLowerCase();
    }
    const camps = Array.isArray(catalog.camps) ? catalog.camps : [];
    for (let i = 0; i < camps.length; i++) {
      const c = camps[i];
      const campCats = getItemCategories(c);
      c._haystack = stripAccents(
        [
          c.title || "",
          c.discipline || "",
          campCats.join(" "),
          c.holiday_period || "",
          c.dates_label || "",
          c.format_label || "",
          c.audience_label || "",
          c.notes || "",
          c.organization_name || "",
          c.venue_name || "",
        ].join(" ")
      ).toLowerCase();
    }
    catalog._haystackPrepared = true;
    return catalog;
  }

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    catalogPromise = (async () => {
      if (global.__ASSO_STATIC_CATALOG__) {
        return prepareCatalogIndexes(global.__ASSO_STATIC_CATALOG__);
      }
      if (protocol !== "file:" && origFetch) {
        try {
          const resp = await origFetch("./data/catalog.json", {
            cache: isCapacitor ? "default" : "no-cache",
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.meta && Array.isArray(data.slots)) {
              prepareCatalogIndexes(data);
              global.__ASSO_STATIC_CATALOG__ = data;
              return data;
            }
          }
        } catch {
          // Bascule vers catalog.js si fetch relatif échoue (ex: file://)
        }
      }
      const fallback = await loadCatalogViaScriptFallback();
      return prepareCatalogIndexes(fallback);
    })();
    return catalogPromise;
  }

  /* -------------------------------------------------------------------------
   * Implémentations hors-ligne des endpoints API
   * ------------------------------------------------------------------------- */

  function handleGetHealth(catalog) {
    return {
      status: "ok",
      app: "AssoPlanning",
      season: (catalog.meta && catalog.meta.season) || "2026-2027",
      env: "static-offline",
    };
  }

  function handleGetMeta(catalog) {
    return catalog.meta;
  }

  function handleGetSlots(urlObj, catalog) {
    const sp = urlObj.searchParams;
    const allSlots = Array.isArray(catalog.slots) ? catalog.slots : [];
    const seasonStartYear = (catalog.meta && catalog.meta.season_start_year) || 2026;
    const groupMap = getAudienceGroupMap(catalog);

    let daySet = null;
    const rawDays = sp.get("days");
    if (rawDays) {
      const parsed = new Set();
      rawDays.split(",").forEach((chunk) => {
        const t = chunk.trim();
        if (/^\d+$/.test(t)) parsed.add(Number(t));
      });
      if (parsed.size > 0) daySet = parsed;
    }

    const citySet = new Set(
      parseSimpleListParam(sp.getAll("city_slugs"), sp.get("city_slug")).map((c) => c.toLowerCase())
    );
    const structSet = new Set(
      parseSimpleListParam(sp.getAll("structure_types"), sp.get("structure_type")).map((s) => s.toLowerCase())
    );
    const catSet = parseCategoryParams(sp.getAll("categories"), sp.get("category"));
    const discSet = parseDisciplineParams(sp.getAll("disciplines"), sp.get("discipline"));
    const audienceCodes = parseSimpleListParam(sp.getAll("audiences"), null)
      .map((x) => stripAccents(x).toLowerCase())
      .filter((code) => groupMap.has(code));

    const age = parseOptionalInt(sp.get("age"));
    const grade = sp.get("grade") || null;
    const birthYear = parseOptionalInt(sp.get("birth_year"));
    const organizationId = parseOptionalInt(sp.get("organization_id"));

    const minT = timeToMinutes(sp.get("time_from"));
    const maxT = timeToMinutes(sp.get("time_to"));
    const rawTimeMode = (sp.get("time_mode") || "contained").trim().toLowerCase();
    const timeMode = rawTimeMode === "starts_between" ? "starts_between" : "contained";
    const bucketRanges = parseTimeBuckets(sp.get("time_buckets"));
    const daySlotPairs = parseDaySlots(sp.get("day_slots"));
    const durationMin = parseOptionalInt(sp.get("duration_min"));
    const durationMax = parseOptionalInt(sp.get("duration_max"));
    const availability = sp.get("availability") || "";
    const verifiedRaw = (sp.get("verified_only") || "").trim().toLowerCase();
    const verifiedOnly = verifiedRaw === "true" || verifiedRaw === "1" || verifiedRaw === "yes" || verifiedRaw === "on";
    const qRaw = (sp.get("q") || "").trim();
    const qNorm = qRaw ? stripAccents(qRaw).toLowerCase() : null;

    const filtered = [];
    for (let i = 0; i < allSlots.length; i++) {
      const s = allSlots[i];

      if (citySet.size > 0) {
        const slotCity = String(s.city_slug || "").toLowerCase();
        if (!citySet.has(slotCity)) continue;
      }

      const rawDayVal = s.day_of_week;
      const parsedDayVal =
        rawDayVal === null || rawDayVal === undefined || rawDayVal === "" ? NaN : Number(rawDayVal);
      const slotDay = Number.isFinite(parsedDayVal) ? parsedDayVal : null;
      const startMin = timeToMinutes(s.start_time);
      const endMin = timeToMinutes(s.end_time);

      if (daySlotPairs.length > 0) {
        const matchedDaySlot =
          slotDay !== null &&
          startMin !== null &&
          daySlotPairs.some(([d, [lo, hi]]) => slotDay === d && startMin >= lo && startMin < hi);
        if (!matchedDaySlot) continue;
      } else {
        if (daySet !== null && (slotDay === null || !daySet.has(slotDay))) continue;
        if (bucketRanges.length > 0) {
          const matchedBucket =
            startMin !== null && bucketRanges.some(([lo, hi]) => startMin >= lo && startMin < hi);
          if (!matchedBucket) continue;
        }
      }

      if (minT !== null && (startMin === null || startMin < minT)) continue;
      if (maxT !== null) {
        if (timeMode === "starts_between") {
          if (startMin === null || startMin > maxT) continue;
        } else if (endMin === null || endMin > maxT) {
          continue;
        }
      }

      if (durationMin !== null || durationMax !== null) {
        if (startMin === null || endMin === null) continue;
        const dur = endMin - startMin;
        if (durationMin !== null && dur < durationMin) continue;
        if (durationMax !== null && dur > durationMax) continue;
      }

      const slotCats = getItemCategories(s);
      if (catSet.size > 0) {
        const matchedCat = slotCats.some((c) => catSet.has(stripAccents(c).toLowerCase()));
        if (!matchedCat) continue;
      }

      if (discSet.size > 0) {
        if (!discSet.has(stripAccents(s.discipline || "").toLowerCase())) continue;
      }

      if (structSet.size > 0) {
        if (!structSet.has(String(s.structure_type || "").toLowerCase())) continue;
      }

      if (availability === "available_only") {
        if (s.availability !== "open" && s.availability !== "limited") continue;
      } else if (availability && s.availability !== availability) {
        continue;
      }

      if (verifiedOnly && !s.is_verified_by_org) continue;

      if (organizationId !== null && Number(s.organization_id) !== organizationId) continue;

      if (audienceCodes.length > 0) {
        const matchedAud = audienceCodes.some((code) => slotMatchesAudienceGroup(s, code, groupMap));
        if (!matchedAud) continue;
      }

      if (!slotMatchesPerson(s, { age, grade, birthYear, seasonStartYear })) continue;

      if (qNorm) {
        const haystack =
          s._haystack ||
          stripAccents(
            [
              s.title || "",
              s.discipline || "",
              slotCats.join(" "),
              s.audience_label || "",
              s.notes || "",
              s.organization_name || "",
              s.venue_name || "",
            ].join(" ")
          ).toLowerCase();
        if (!haystack.includes(qNorm)) continue;
      }

      filtered.push(s);
    }

    const profile = resolvePersonProfile({ age, grade, birthYear, seasonStartYear });
    return {
      count: filtered.length,
      person_profile: profile,
      slots: filtered,
    };
  }

  function handleGetCamps(urlObj, catalog) {
    const sp = urlObj.searchParams;
    const allCamps = Array.isArray(catalog.camps) ? catalog.camps : [];
    const groupMap = getAudienceGroupMap(catalog);

    const periodTokens = [
      ...parseSimpleListParam(sp.getAll("periods"), null),
      ...parseSimpleListParam(sp.getAll("holiday_periods"), null),
    ];
    const periodSet = new Set(periodTokens.map((p) => stripAccents(p).toLowerCase()));

    const audienceCodes = parseSimpleListParam(sp.getAll("audiences"), null)
      .map((x) => stripAccents(x).toLowerCase())
      .filter((code) => groupMap.has(code));

    const catSet = parseCategoryParams(sp.getAll("categories"), sp.get("category"));
    const citySet = new Set(
      parseSimpleListParam(sp.getAll("city_slugs"), sp.get("city_slug")).map((c) => c.toLowerCase())
    );
    const structSet = new Set(
      parseSimpleListParam(sp.getAll("structure_types"), sp.get("structure_type")).map((s) => s.toLowerCase())
    );
    const qRaw = (sp.get("q") || "").trim();
    const qNorm = qRaw ? stripAccents(qRaw).toLowerCase() : null;

    const filtered = [];
    for (let i = 0; i < allCamps.length; i++) {
      const c = allCamps[i];

      if (periodSet.size > 0) {
        const campPeriodNorm = stripAccents(c.holiday_period || "").toLowerCase();
        if (campPeriodNorm !== "toutes vacances" && !periodSet.has(campPeriodNorm)) continue;
      }

      if (audienceCodes.length > 0) {
        const matchedAud = audienceCodes.some((code) => campMatchesAudienceGroup(c, code, groupMap));
        if (!matchedAud) continue;
      }

      const campCats = getItemCategories(c);
      if (catSet.size > 0) {
        const matchedCat = campCats.some((cat) => catSet.has(stripAccents(cat).toLowerCase()));
        if (!matchedCat) continue;
      }

      if (citySet.size > 0) {
        const campCity = String(c.city_slug || "").toLowerCase();
        if (!citySet.has(campCity)) continue;
      }

      if (structSet.size > 0) {
        if (!structSet.has(String(c.structure_type || "").toLowerCase())) continue;
      }

      if (qNorm) {
        const haystack =
          c._haystack ||
          stripAccents(
            [
              c.title || "",
              c.discipline || "",
              campCats.join(" "),
              c.holiday_period || "",
              c.dates_label || "",
              c.format_label || "",
              c.audience_label || "",
              c.notes || "",
              c.organization_name || "",
              c.venue_name || "",
            ].join(" ")
          ).toLowerCase();
        if (!haystack.includes(qNorm)) continue;
      }

      filtered.push(c);
    }

    return {
      count: filtered.length,
      camps: filtered,
      periods: (catalog.meta && catalog.meta.holiday_periods) || HOLIDAY_PERIODS,
    };
  }

  function cartesianProduct(lists) {
    if (!lists.length) return [];
    let acc = [[]];
    for (let i = 0; i < lists.length; i++) {
      const next = [];
      const current = lists[i];
      for (let a = 0; a < acc.length; a++) {
        for (let b = 0; b < current.length; b++) {
          next.push(acc[a].concat([current[b]]));
        }
      }
      acc = next;
    }
    return acc;
  }

  function handlePostFamilyCombos(rawBody, catalog) {
    const req = typeof rawBody === "string" ? JSON.parse(rawBody || "{}") : rawBody || {};
    const members = Array.isArray(req.members) ? req.members : [];
    const allSlots = Array.isArray(catalog.slots) ? catalog.slots : [];
    const seasonStartYear = (catalog.meta && catalog.meta.season_start_year) || 2026;

    const dayOfWeek = req.day_of_week !== null && req.day_of_week !== undefined && req.day_of_week !== ""
      ? Number(req.day_of_week)
      : null;
    const minT = timeToMinutes(req.time_from);
    const maxT = timeToMinutes(req.time_to);
    const maxWalkMinutes =
      req.max_walk_minutes !== null && req.max_walk_minutes !== undefined
        ? Number(req.max_walk_minutes)
        : 15;
    const includeFull = Boolean(req.include_full);

    const cityFilterSet = new Set();
    if (req.city_slug) cityFilterSet.add(String(req.city_slug).toLowerCase());
    if (Array.isArray(req.city_slugs)) {
      req.city_slugs.forEach((c) => {
        if (c) cityFilterSet.add(String(c).toLowerCase());
      });
    }

    const eligibleSlots = allSlots.filter((s) => {
      if (dayOfWeek !== null && Number(s.day_of_week) !== dayOfWeek) return false;
      if (!includeFull && s.availability === "full") return false;
      if (cityFilterSet.size > 0 && !cityFilterSet.has(String(s.city_slug || "").toLowerCase())) {
        return false;
      }
      if (minT !== null) {
        const sStart = timeToMinutes(s.start_time);
        if (sStart !== null && sStart < minT) return false;
      }
      if (maxT !== null) {
        const sEnd = timeToMinutes(s.end_time);
        if (sEnd !== null && sEnd > maxT) return false;
      }
      return true;
    });

    const membersOut = [];
    const perMemberByDay = [];

    members.forEach((m) => {
      const mAge = parseOptionalInt(m.age);
      const mGrade = m.grade || null;
      const mBy = parseOptionalInt(m.birth_year);
      const targetCat = m.category ? stripAccents(normalizeCategory(m.category)).toLowerCase() : null;

      const profile = resolvePersonProfile({
        age: mAge,
        grade: mGrade,
        birthYear: mBy,
        seasonStartYear,
      });

      const matched = [];
      const byDay = {};
      eligibleSlots.forEach((s) => {
        if (targetCat) {
          const cats = getItemCategories(s);
          if (!cats.some((c) => stripAccents(c).toLowerCase() === targetCat)) return;
        }
        if (slotMatchesPerson(s, { age: mAge, grade: mGrade, birthYear: mBy, seasonStartYear })) {
          matched.push(s);
          const d = Number(s.day_of_week);
          if (!byDay[d]) byDay[d] = [];
          byDay[d].push(s);
        }
      });

      perMemberByDay.push(byDay);
      membersOut.push({
        name: m.name || "Membre",
        profile,
        matching_count: matched.length,
        matching_slots: matched.slice(0, 20),
      });
    });

    const combos = [];
    const candidateDays = dayOfWeek !== null ? [dayOfWeek] : [0, 1, 2, 3, 4, 5, 6];

    candidateDays.forEach((d) => {
      const dayLists = perMemberByDay.map((mDays) => (mDays[d] || []).slice(0, 12));
      if (!dayLists.length || dayLists.some((lst) => lst.length === 0)) return;

      const choices = cartesianProduct(dayLists);
      for (let idxC = 0; idxC < choices.length; idxC++) {
        const choice = choices[idxC];
        const allHaveVenue = choice.every((s) => s.venue_id !== null && s.venue_id !== undefined);
        const venueIds = new Set(choice.filter((s) => s.venue_id != null).map((s) => s.venue_id));
        const sameVenue = allHaveVenue && venueIds.size === 1;

        let maxWalk = 0;
        if (sameVenue) {
          maxWalk = 0;
        } else if (!allHaveVenue) {
          maxWalk = null;
        } else {
          let missingCoords = false;
          for (let i = 0; i < choice.length; i++) {
            for (let j = i + 1; j < choice.length; j++) {
              const s1 = choice[i];
              const s2 = choice[j];
              if (s1.venue_id !== s2.venue_id) {
                if (
                  s1.venue_lat == null ||
                  s1.venue_lng == null ||
                  s2.venue_lat == null ||
                  s2.venue_lng == null
                ) {
                  missingCoords = true;
                } else {
                  const km = haversineKm(
                    Number(s1.venue_lat),
                    Number(s1.venue_lng),
                    Number(s2.venue_lat),
                    Number(s2.venue_lng)
                  );
                  maxWalk = Math.max(maxWalk, walkMinutes(km));
                }
              }
            }
          }
          if (missingCoords) maxWalk = null;
        }

        if (maxWalk !== null && maxWalk > maxWalkMinutes) continue;

        const starts = choice.map((s) => timeToMinutes(s.start_time) || 0);
        const ends = choice.map((s) => timeToMinutes(s.end_time) || 0);
        const overlapMin = Math.max(0, Math.min(...ends) - Math.max(...starts));

        const intervals = starts
          .map((st, i) => [st, ends[i]])
          .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        let gapMin = 0;
        for (let i = 0; i < intervals.length - 1; i++) {
          const curEnd = intervals[i][1];
          const nxtStart = intervals[i + 1][0];
          if (nxtStart > curEnd) {
            gapMin = Math.max(gapMin, nxtStart - curEnd);
          }
        }
        if (gapMin > 120) continue;

        let score = 0.0;
        if (sameVenue) {
          score += 60.0;
        } else if (maxWalk !== null) {
          score += Math.max(0.0, 40.0 - maxWalk * 2.5);
        }
        if (overlapMin > 0) {
          score += 35.0 + Math.min(30.0, overlapMin * 0.5);
        } else {
          score += Math.max(0.0, 20.0 - gapMin * 0.4);
        }
        if (choice.every((s) => s.availability === "open")) {
          score += 10.0;
        }

        const locText = sameVenue
          ? `Même lieu (${choice[0].venue_name})`
          : maxWalk !== null
            ? `À ~${maxWalk} min à pied`
            : "Lieux à vérifier";

        const timeText =
          overlapMin > 0
            ? `${overlapMin} min en simultané`
            : gapMin === 0
              ? "Enchaînement sans attente"
              : `${gapMin} min d'écart`;

        combos.push({
          day_of_week: d,
          day_label: DAYS_FR[d],
          same_venue: sameVenue,
          walk_minutes: maxWalk,
          overlap_minutes: overlapMin,
          gap_minutes: gapMin,
          score: Math.round(score * 10) / 10,
          summary: `${DAYS_FR[d]} • ${locText} • ${timeText}`,
          items: choice.map((s, idx) => ({
            member_name: (members[idx] && members[idx].name) || `Membre ${idx + 1}`,
            slot: s,
          })),
        });
      }
    });

    combos.sort((a, b) => b.score - a.score);
    const topCombos = combos.slice(0, 20);
    return {
      members: membersOut,
      combos_count: topCombos.length,
      combos: topCombos,
    };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function buildIcsContent(urlObj, catalog) {
    const sp = urlObj.searchParams;
    const rawIds = sp.get("ids") || "";
    const slotIds = rawIds
      .split(",")
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x))
      .map(Number);

    if (!slotIds.length) {
      throw new Error("Aucun identifiant de créneau valide.");
    }

    const memberBySlot = new Map();
    const rawMemberMap = sp.get("member_map") || "";
    if (rawMemberMap) {
      rawMemberMap.split(",").forEach((entryRaw) => {
        const entry = entryRaw.trim();
        const colonIdx = entry.indexOf(":");
        if (colonIdx < 0) return;
        const rawId = entry.slice(0, colonIdx).trim();
        const rawName = entry.slice(colonIdx + 1).trim();
        if (/^\d+$/.test(rawId) && rawName) {
          memberBySlot.set(Number(rawId), rawName);
        }
      });
    }

    const idSet = new Set(slotIds);
    const slots = (catalog.slots || []).filter((s) => idSet.has(Number(s.id)));
    if (!slots.length) {
      throw new Error("Aucun créneau trouvé.");
    }

    const now = new Date();
    const todayWeekday = (now.getDay() + 6) % 7; // 0 = Lundi ... 6 = Dimanche

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AssoPlanning//Activites//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    slots.forEach((s) => {
      const dow = Number(s.day_of_week);
      const daysAhead = (((dow - todayWeekday) % 7) + 7) % 7;
      const firstDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
      const dateStamp = `${firstDate.getFullYear()}${pad2(firstDate.getMonth() + 1)}${pad2(firstDate.getDate())}`;
      const dtStart = `${dateStamp}T${String(s.start_time || "00:00").replace(":", "")}00`;
      const dtEnd = `${dateStamp}T${String(s.end_time || "00:00").replace(":", "")}00`;
      const rruleDay = dow >= 0 && dow < 7 ? ICS_DAYS[dow] : "WE";

      let baseSummary = `${s.title || ""} (${s.organization_name || ""})`;
      const memberName = memberBySlot.get(Number(s.id));
      if (memberName) {
        baseSummary = `[${memberName}] ${baseSummary}`;
      }
      const summary = baseSummary.replace(/,/g, "\\,");

      const fallbackCity = s.city_name || "AssoPlanning";
      const cityDomain = s.city_slug || "assoplanning";
      const locRaw = s.venue_name
        ? s.venue_address
          ? `${s.venue_name}, ${s.venue_address}`
          : s.venue_name
        : fallbackCity;
      const location = locRaw.replace(/,/g, "\\,");

      const desc = `Public : ${s.audience_label || ""}\\nStatut : ${s.availability || ""}\\n${s.notes || ""}`.replace(
        /\r?\n/g,
        "\\n"
      );

      lines.push(
        "BEGIN:VEVENT",
        `UID:assoplanning-slot-${s.id}@${cityDomain}.local`,
        `DTSTART;TZID=Europe/Paris:${dtStart}`,
        `DTEND;TZID=Europe/Paris:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${rruleDay}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${desc}`,
        "END:VEVENT"
      );
    });

    lines.push("END:VCALENDAR");
    return `${lines.join("\r\n")}\r\n`;
  }

  async function downloadIcsFromUrl(rawUrl) {
    try {
      const catalog = await loadCatalog();
      const urlObj = new URL(rawUrl, "https://assoplanning.local");
      const icsBody = buildIcsContent(urlObj, catalog);
      const filename = "planning-asso.ics";
      const blob = new Blob([icsBody], { type: "text/calendar;charset=utf-8" });

      // Sur Capacitor Android/iOS : écriture en cache local + Share natif (ouvre Agenda / WhatsApp)
      const plugins = (global.Capacitor && global.Capacitor.Plugins) || {};
      if (isCapacitor && plugins.Filesystem && plugins.Share) {
        try {
          const writeRes = await plugins.Filesystem.writeFile({
            path: filename,
            data: icsBody,
            directory: "CACHE",
            encoding: "utf8",
          });
          await plugins.Share.share({
            title: "Planning AssoPlanning",
            text: "Votre planning d'activités au format calendrier (.ics)",
            files: [writeRes.uri],
            dialogTitle: "Ouvrir ou partager votre planning",
          });
          return;
        } catch (natShareErr) {
          if (natShareErr && /cancel/i.test(String(natShareErr.message || natShareErr))) return;
          // Poursuit vers navigator.share / Blob si indisponible
        }
      }

      // Sur PWA moderne : partage natif Web Share API
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof File === "function"
      ) {
        try {
          const file = new File([blob], filename, { type: "text/calendar" });
          if (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "Planning AssoPlanning",
              text: "Votre planning d'activités au format calendrier (.ics)",
              files: [file],
            });
            return;
          }
        } catch (shareErr) {
          if (shareErr && shareErr.name === "AbortError") return;
          // Poursuit vers le téléchargement Blob classique
        }
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(blobUrl);
      }, 1500);

      if (global.AP && typeof global.AP.showToast === "function") {
        global.AP.showToast("Calendrier planning-asso.ics généré hors-ligne !", "success");
      }
    } catch (err) {
      if (global.AP && typeof global.AP.showToast === "function") {
        global.AP.showToast(err.message || "Impossible de générer le fichier .ics", "error");
      }
    }
  }

  function handlePostReport() {
    return {
      id: null,
      offline: true,
      status: "offline_notice",
      message:
        "Mode hors-ligne : le signalement d'erreur nécessite la version en ligne d'AssoPlanning.",
    };
  }

  /* -------------------------------------------------------------------------
   * Routeur interne API hors-ligne
   * ------------------------------------------------------------------------- */

  function extractApiPath(rawUrl) {
    try {
      const urlObj = new URL(rawUrl, "https://assoplanning.local");
      const match = urlObj.pathname.match(/(\/api\/.*)$/);
      if (!match) return null;
      return { apiPath: match[1], urlObj };
    } catch {
      return null;
    }
  }

  async function dispatchOfflineApi(rawUrl, options = {}) {
    const parsed = extractApiPath(rawUrl);
    if (!parsed) return null;
    const { apiPath, urlObj } = parsed;
    const method = String((options && options.method) || "GET").toUpperCase();
    const catalog = await loadCatalog();

    if (method === "GET" && apiPath === "/api/health") {
      return { kind: "json", status: 200, data: handleGetHealth(catalog) };
    }
    if (method === "GET" && apiPath === "/api/meta") {
      return { kind: "json", status: 200, data: handleGetMeta(catalog) };
    }
    if (method === "GET" && apiPath === "/api/slots") {
      return { kind: "json", status: 200, data: handleGetSlots(urlObj, catalog) };
    }
    if (method === "GET" && apiPath === "/api/camps") {
      return { kind: "json", status: 200, data: handleGetCamps(urlObj, catalog) };
    }
    if (method === "POST" && apiPath === "/api/family-combos") {
      return {
        kind: "json",
        status: 200,
        data: handlePostFamilyCombos(options ? options.body : null, catalog),
      };
    }
    if (method === "GET" && apiPath === "/api/slots/export.ics") {
      const icsBody = buildIcsContent(urlObj, catalog);
      return { kind: "ics", status: 200, data: icsBody };
    }
    if (method === "POST" && apiPath === "/api/reports") {
      return { kind: "json", status: 201, data: handlePostReport() };
    }
    return {
      kind: "error",
      status: 501,
      detail: "Cette fonctionnalité nécessite la version serveur en ligne d'AssoPlanning.",
    };
  }

  async function offlineApiFetch(url, options = {}) {
    const res = await dispatchOfflineApi(url, options);
    if (res === null) {
      if (origFetch) {
        const resp = await origFetch(url, options);
        const ct = resp.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await resp.json() : await resp.text();
        if (!resp.ok) {
          throw new Error((data && data.detail) || `Erreur HTTP ${resp.status}`);
        }
        return data;
      }
      throw new Error(`Requête réseau indisponible hors-ligne : ${url}`);
    }
    if (res.kind === "error") {
      throw new Error(res.detail);
    }
    return res.data;
  }

  if (origFetch) {
    global.fetch = async function staticFetchInterceptor(input, init) {
      const rawUrl =
        typeof input === "string"
          ? input
          : input && typeof input.url === "string"
            ? input.url
            : String(input || "");
      const method = (init && init.method) || (input && input.method) || "GET";
      const body = init && init.body !== undefined ? init.body : undefined;
      const parsed = extractApiPath(rawUrl);
      if (!parsed) {
        return origFetch(input, init);
      }
      try {
        const res = await dispatchOfflineApi(rawUrl, { method, body });
        if (res.kind === "ics") {
          return new Response(res.data, {
            status: 200,
            headers: {
              "Content-Type": "text/calendar; charset=utf-8",
              "Content-Disposition": 'attachment; filename="planning-asso.ics"',
            },
          });
        }
        if (res.kind === "error") {
          return new Response(JSON.stringify({ detail: res.detail }), {
            status: res.status || 501,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          });
        }
        return new Response(JSON.stringify(res.data), {
          status: res.status || 200,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ detail: err.message || "Erreur hors-ligne" }), {
          status: 400,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
    };
  }

  // Remplace window.AP.apiFetch et window.apiFetch avant l'initialisation de public.js
  global.apiFetch = offlineApiFetch;
  if (global.AP) {
    global.AP.apiFetch = offlineApiFetch;
    global.AP.downloadIcsFromUrl = downloadIcsFromUrl;
    global.AP.buildIcsContent = buildIcsContent;
    global.AP.preloadStaticCatalog = loadCatalog;
    global.AP.isStaticMode = true;
    global.AP.isCapacitor = isCapacitor;
  } else {
    global.AP = {
      apiFetch: offlineApiFetch,
      downloadIcsFromUrl,
      buildIcsContent,
      preloadStaticCatalog: loadCatalog,
      isStaticMode: true,
      isCapacitor,
    };
  }

  // Intercepte les liens <a> vers /api/slots/export.ics, pages serveur (/espace-asso, /admin) et liens externes APK
  document.addEventListener(
    "click",
    (e) => {
      const link = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.includes("/api/slots/export.ics")) {
        e.preventDefault();
        downloadIcsFromUrl(href);
        return;
      }
      if (href === "/espace-asso" || href === "/admin") {
        e.preventDefault();
        if (global.AP && typeof global.AP.showToast === "function") {
          global.AP.showToast(
            "Cet espace d'administration nécessite la version serveur en ligne d'AssoPlanning.",
            "info"
          );
        }
        return;
      }
      if (
        isCapacitor &&
        /^https?:\/\//i.test(href) &&
        !href.startsWith(global.location.origin) &&
        !href.includes("/releases/latest/download/") &&
        !/\.apk(?:\?|$)/i.test(href)
      ) {
        e.preventDefault();
        if (global.AssoNative && typeof global.AssoNative.openExternalUrl === "function") {
          global.AssoNative.openExternalUrl(href);
        } else {
          global.open(href, "_blank", "noopener,noreferrer");
        }
      }
    },
    true
  );

  // Pré-charge le catalogue en arrière-plan dès que possible
  loadCatalog().catch(() => {
    // L'erreur sera remontée proprement lors du premier apiFetch
  });
})(window);
