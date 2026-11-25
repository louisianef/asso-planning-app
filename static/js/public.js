(function () {
  "use strict";
  const { DAYS_FR, escapeHtml, showToast, apiFetch, availabilityBadge, verifiedBadge, structureTypeBadge, formatFee } = window.AP;

  const FAV_STORAGE_KEY = "assoplanning_favorites_v1";
  const WISHLISTS_STORAGE_KEY = "assoplanning_wishlists_v1";
  const FAMILY_PROFILE_KEY = "assoplanning_family_profile_v1";
  const FAMILY_SETUP_DONE_KEY = "assoplanning_family_setup_done_v1";
  const TERRITORY_STORAGE_KEY = "assoplanning_territory_v1";
  const INTERESTS_STORAGE_KEY = "assoplanning_interests_v1";
  const MEMBER_COLORS = ["#105c97", "#046273", "#b4832c", "#7c3aed"];
  const GRADE_DEFAULT_AGES = {
    PS: 3, MS: 4, GS: 5, CP: 6, CE1: 7, CE2: 8, CM1: 9, CM2: 10,
    "6e": 11, "5e": 12, "4e": 13, "3e": 14, "2de": 15, "1ere": 16, Term: 17,
    ADULTE: 30, SENIOR: 65,
  };
  const PLANNER_COLOR_PALETTE = [
    "#105c97",
    "#046273",
    "#b4832c",
    "#7c3aed",
    "#b91c1c",
    "#15803d",
    "#0f766e",
    "#be185d",
  ];
  const DEFAULT_FAMILY_PROFILE = [
    { id: "m1", name: "Moi", color: "#105c97", grade: "ADULTE", age: "" },
    { id: "m2", name: "Enfant 1", color: "#046273", grade: "CE2", age: "" },
    { id: "m3", name: "Enfant 2", color: "#b4832c", grade: "MS", age: "" },
  ];
  const DEFAULT_HOLIDAY_PERIODS = ["Toussaint", "Noël", "Hiver", "Printemps", "Été"];
  const CAMP_AUDIENCE_QUICK = [
    { code: "maternelle", label: "Maternelle" },
    { code: "primaire", label: "Primaire" },
    { code: "college", label: "Collège" },
    { code: "lycee", label: "Lycée" },
    { code: "adulte", label: "Adultes" },
  ];

  /* ---- Moteur visuel d'icônes & palettes pastel ---- */
  const DEFAULT_VISUAL = {
    icon: "✨",
    shortLabel: "Tout",
    bg: "#eef4fa",
    fg: "#105c97",
    border: "#c5dbf0",
  };

  const CATEGORY_VISUALS = {
    "sports collectifs": {
      icon: "⚽",
      shortLabel: "Sports collectifs",
      bg: "#e8f5ee",
      fg: "#166534",
      border: "#b7e4c7",
    },
    "sports individuels & raquettes": {
      icon: "🎾",
      shortLabel: "Raquettes & indiv.",
      bg: "#e6f2fb",
      fg: "#105c97",
      border: "#b8d6f0",
    },
    "arts martiaux & combat": {
      icon: "🥋",
      shortLabel: "Arts martiaux",
      bg: "#fef2f2",
      fg: "#991b1b",
      border: "#fecaca",
    },
    "danse & expression": {
      icon: "💃",
      shortLabel: "Danse",
      bg: "#fdf2f8",
      fg: "#9d174d",
      border: "#fbcfe8",
    },
    "bien-etre & sante": {
      icon: "🧘",
      shortLabel: "Bien-être",
      bg: "#ecfdf5",
      fg: "#065f46",
      border: "#a7f3d0",
    },
    "musique, chant & theatre": {
      icon: "🎵",
      shortLabel: "Musique & scène",
      bg: "#f5f3ff",
      fg: "#5b21b6",
      border: "#ddd6fe",
    },
    "arts plastiques & creation": {
      icon: "🎨",
      shortLabel: "Arts & création",
      bg: "#fff7ed",
      fg: "#9a3412",
      border: "#fed7aa",
    },
    "langues & jeux": {
      icon: "🌍",
      shortLabel: "Langues & jeux",
      bg: "#eff6ff",
      fg: "#1e40af",
      border: "#bfdbfe",
    },
  };

  const DISCIPLINE_VISUAL_RULES = [
    // Arts martiaux & combat (spécifiques d'abord)
    { re: /\bcapoeira\b/, icon: "🤸", bg: "#fdf2f8", fg: "#9d174d", border: "#fbcfe8" },
    { re: /\b(?:escrime|kendo|chanbara)\b/, icon: "🤺", bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
    { re: /\b(?:boxe|muay\s*thai|kick[\s-]?boxing|mma|grappling|jjb|jiu[\s-]?jitsu\s*bresilien|savate)\b/, icon: "🥊", bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },
    { re: /\b(?:judo|jujitsu|jiu[\s-]?jitsu|karate|aikido|krav\s*maga|self[\s-]?defense|taekwondo|kung[\s-]?fu|wushu|viet\s*vo\s*dao|taiso|ninjutsu|hapkido)\b/, icon: "🥋", bg: "#fef2f2", fg: "#991b1b", border: "#fecaca" },

    // Sports collectifs
    { re: /\b(?:basketball|basket[\s-]?ball|basket)\b/, icon: "🏀", bg: "#fff7ed", fg: "#9a3412", border: "#fed7aa" },
    { re: /\b(?:football|futsal|foot)\b/, icon: "⚽", bg: "#e8f5ee", fg: "#166534", border: "#b7e4c7" },
    { re: /\b(?:handball|hand)\b/, icon: "🤾", bg: "#e6f2fb", fg: "#105c97", border: "#b8d6f0" },
    { re: /\b(?:volley[\s-]?ball|volleyball|volley)\b/, icon: "🏐", bg: "#fefce8", fg: "#854d0e", border: "#fde68a" },
    { re: /\brugby\b/, icon: "🏉", bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },

    // Raquettes & Sports individuels (tennis de table AVANT tennis)
    { re: /\b(?:tennis de table|ping[\s-]?pong|ping)\b/, icon: "🏓", bg: "#e6f2fb", fg: "#105c97", border: "#b8d6f0" },
    { re: /\btennis\b/, icon: "🎾", bg: "#f0fdf4", fg: "#166534", border: "#bbf7d0" },
    { re: /\b(?:badminton|squash|padel)\b/, icon: "🏸", bg: "#e6f2fb", fg: "#105c97", border: "#b8d6f0" },
    { re: /\b(?:escalade|grimpe|bloc)\b/, icon: "🧗", bg: "#fff7ed", fg: "#9a3412", border: "#fed7aa" },
    { re: /\b(?:natation|water[\s-]?polo|aquagym|aquabike|aquafitness|plongee|subaquatique|bebe[s]?\s*nageur[s]?|nage)\b/, icon: "🏊", bg: "#e0f2fe", fg: "#0369a1", border: "#bae6fd" },
    { re: /\b(?:equitation|poney|cheval|hippique)\b/, icon: "🐴", bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
    { re: /\b(?:athletisme|athle|running|triathlon|course\s*a\s*pied|marche\s*nordique)\b/, icon: "🏃", bg: "#e6f2fb", fg: "#105c97", border: "#b8d6f0" },
    { re: /\bgolf\b/, icon: "⛳", bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },
    { re: /\b(?:tir a l'?arc|archerie)\b/, icon: "🏹", bg: "#fef3c7", fg: "#92400e", border: "#fde68a" },
    { re: /\b(?:aviron|kayak|canoe|voile)\b/, icon: "🚣", bg: "#e0f2fe", fg: "#0369a1", border: "#bae6fd" },
    { re: /\b(?:roller|patinage|patin|skate)\b/, icon: "🛼", bg: "#f0f9ff", fg: "#075985", border: "#bae6fd" },
    { re: /\b(?:cyclisme|velo|vtt|bmx)\b/, icon: "🚴", bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },

    // Musique, Théâtre & Cirque (avant danse générique pour "Ateliers Rock")
    { re: /\b(?:cirque|jonglage|trapeze)\b/, icon: "🎪", bg: "#fff7ed", fg: "#9a3412", border: "#fed7aa" },
    { re: /\b(?:theatre|impro|improvisation|art dramatique|comedie)\b/, icon: "🎭", bg: "#f5f3ff", fg: "#5b21b6", border: "#ddd6fe" },
    { re: /\b(?:musique|piano|guitare|basse|batterie|chant|chorale|eveil musical|violon|violoncelle|flute|saxophone|trompette|solfege|orchestre|atelier[s]?\s*rock|percussion|harpe|clarinette|ukulele|accordeon)\b/, icon: "🎵", bg: "#f5f3ff", fg: "#5b21b6", border: "#ddd6fe" },

    // Danse, Gym & Bien-être
    { re: /\b(?:danse|ballet|modern[' ]?jazz|hip[\s-]?hop|street\s*jazz|barre au sol|zumba|salsa|tango|flamenco)\b/, icon: "💃", bg: "#fdf2f8", fg: "#9d174d", border: "#fbcfe8" },
    { re: /\b(?:gymnastique|baby[\s-]?gym|grs|trampoline|parkour|acrosport|gym)\b/, icon: "🤸", bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },
    { re: /\b(?:yoga|pilates|qi\s*gong|qigong|tai\s*chi|taichi|sophrologie|meditation|stretching|relaxation|fitness|sport[\s-]?sante)\b/, icon: "🧘", bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },

    // Arts plastiques & Création
    { re: /\b(?:arts?\s*plastiques?|dessin|peinture|aquarelle|bd|manga|ceramique|poterie|sculpture|modelage|couture|broderie|tricot|photo|photographie|illustration|gravure|calligraphie|origami)\b/, icon: "🎨", bg: "#fff7ed", fg: "#9a3412", border: "#fed7aa" },

    // Jeux, Langues, Nature, Sciences & Lecture
    { re: /\bechecs?\b/, icon: "♟️", bg: "#eff6ff", fg: "#1e40af", border: "#bfdbfe" },
    { re: /\b(?:anglais|langues?|espagnol|allemand|italien|japonais|chinois|arabe|portugais|russe|fle|lsf)\b/, icon: "🌍", bg: "#eff6ff", fg: "#1e40af", border: "#bfdbfe" },
    { re: /\b(?:scoutisme|scouts?|nature|jardinage)\b/, icon: "🏕️", bg: "#ecfdf5", fg: "#065f46", border: "#a7f3d0" },
    { re: /\b(?:codage|robotique|sciences?|informatique|programmation|numerique|astronomie)\b/, icon: "🤖", bg: "#f0f9ff", fg: "#075985", border: "#bae6fd" },
    { re: /\b(?:lecture|bebe[s]?\s*lecteur[s]?|ecriture|conte|bibliotheque)\b/, icon: "📚", bg: "#fefce8", fg: "#854d0e", border: "#fde68a" },
    { re: /\b(?:bridge|jeux de societe|ludotheque)\b/, icon: "🎲", bg: "#eff6ff", fg: "#1e40af", border: "#bfdbfe" },
    { re: /\bmultisport\b/, icon: "🏅", bg: "#e8f5ee", fg: "#166534", border: "#b7e4c7" },
  ];

  let meta = null;
  let currentSlots = [];
  let currentCamps = [];
  let slotsById = new Map();
  let campsById = new Map();
  const SLOTS_PAGE_SIZE_GROUPED = 18;
  const SLOTS_PAGE_SIZE_FLAT = 24;
  let renderedSlotsCount = 0;
  let slotsObserver = null;
  let leafletLoadPromise = null;
  let lastBackExitAt = 0;
  let lastWasMobile = window.innerWidth <= 768;
  const delegatedContainers = new WeakSet();
  const disciplineVisualCache = new Map();
  let selectedAudiences = new Set();
  let selectedDays = new Set();
  let selectedTimeBuckets = new Set();
  let selectedDaySlots = new Set();
  let scheduleFilterMode = "simple"; // "simple" | "matrix"
  let selectedTimeMode = "contained"; // "contained" | "starts_between"
  let selectedDurationRange = ""; // "" | "0-45" | "46-65" | "66-95" | "96-999"
  let selectedCategories = new Set();
  let selectedDisciplines = new Set();
  let selectedCities = new Set();
  let selectedStructureTypes = new Set();
  let listGroupingMode = "grouped"; // "grouped" | "flat"
  let expandedActivityGroups = new Set();
  let currentActivityGroups = [];
  let groupsByKey = new Map();
  let latestLoadSeq = 0;
  let currentView = "list";
  let currentMode = "simple";
  let familyProfile = loadFamilyProfile();
  let activePlannerMemberId = "all";
  let activePlannerMobileDay = "all";
  let selectedWhoMemberIds = new Set();
  let selectedCampMemberIds = new Set();
  let favorites = loadFavorites();
  let wishlistsData = loadWishlists();
  let currentDetailContext = null;
  let leafletMap = null;
  let markersLayer = null;
  let venueMarkersByKey = new Map();
  let deferredInstallPrompt = null;

  const TIME_BUCKET_LABELS = {
    morning: "Matin <12h",
    noon: "Midi 12–14h",
    afternoon: "Après-midi 14–17h",
    afterschool: "Sortie d'école 16h30–19h",
    evening: "Soirée 19h+",
    aprem: "Apr 14–18h",
    soir: "Soir 18h+",
  };
  const TIME_BUCKET_SHORT = {
    morning: "Mat",
    noon: "Midi",
    afternoon: "Après-midi",
    afterschool: "Sortie d'école",
    evening: "Soirée",
    aprem: "Apr",
    soir: "Soir",
  };
  const MATRIX_MOMENTS = [
    { key: "morning", label: "Mat <12h", shortLabel: "Mat" },
    { key: "noon", label: "Midi 12–14h", shortLabel: "Midi" },
    { key: "aprem", label: "Apr 14–18h", shortLabel: "Apr" },
    { key: "soir", label: "Soir 18h+", shortLabel: "Soir" },
  ];
  const DURATION_LABELS = {
    "": "Toutes",
    "0-45": "≤ 45 min",
    "46-65": "1h",
    "66-95": "1h15–1h30",
    "96-999": "≥ 2h",
  };

  function getListPageSize() {
    return listGroupingMode === "grouped" ? SLOTS_PAGE_SIZE_GROUPED : SLOTS_PAGE_SIZE_FLAT;
  }

  // Stages vacances state
  let exploreWhenMode = "yearly"; // "yearly" | "camp"
  let selectedBudgetMax = null; // null | 150 | 250 | 400
  let selectedCampPeriods = new Set();
  let selectedCampAudiences = new Set();
  let latestCampsLoadSeq = 0;
  let campsLoadedOnce = false;
  let categoryCountsMap = new Map();
  let lastActiveTagsCount = 0;
  let onboardingStep = 1;
  let activeObInterestProfile = "all";
  let activeProfileInterestProfile = "all";

  const INTERESTS_V2_KEY = "assoplanning_interests_v2";
  const DEPT_LABELS = {
    "75": "Paris (75)",
    "77": "Seine-et-Marne (77)",
    "78": "Yvelines (78)",
    "91": "Essonne (91)",
    "92": "Hauts-de-Seine (92)",
    "93": "Seine-Saint-Denis (93)",
    "94": "Val-de-Marne (94)",
    "95": "Val-d'Oise (95)",
  };

  function loadInterestsByProfile() {
    try {
      const rawV2 = localStorage.getItem(INTERESTS_V2_KEY);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      }
      // Migration automatique depuis v1
      const rawV1 = localStorage.getItem(INTERESTS_STORAGE_KEY);
      if (rawV1) {
        const parsedV1 = JSON.parse(rawV1);
        if (Array.isArray(parsedV1) && parsedV1.length) {
          return { all: parsedV1.filter(Boolean) };
        }
      }
    } catch {
      // ignore storage errors
    }
    return { all: [] };
  }

  let interestsByProfile = loadInterestsByProfile();

  function saveInterestsByProfile() {
    try {
      localStorage.setItem(INTERESTS_V2_KEY, JSON.stringify(interestsByProfile));
    } catch {
      // ignore storage errors
    }
  }

  function getProfileInterestsSet(profileId) {
    const arr = interestsByProfile[profileId];
    return new Set(Array.isArray(arr) ? arr : []);
  }

  function toggleProfileInterest(profileId, cat) {
    const s = getProfileInterestsSet(profileId);
    if (s.has(cat)) s.delete(cat);
    else s.add(cat);
    interestsByProfile[profileId] = Array.from(s);
    saveInterestsByProfile();
  }

  function getInterestsContextForExplore() {
    const selectedMembers = Array.from(selectedWhoMemberIds).map(getMemberById).filter(Boolean);
    if (selectedMembers.length === 1) {
      const m = selectedMembers[0];
      const own = getProfileInterestsSet(m.id);
      const effective = own.size > 0 ? own : getProfileInterestsSet("all");
      return { categories: effective, label: `Envies de ${m.name}` };
    }
    if (selectedMembers.length > 1) {
      const union = new Set();
      selectedMembers.forEach((m) => {
        const own = getProfileInterestsSet(m.id);
        (own.size > 0 ? own : getProfileInterestsSet("all")).forEach((c) => union.add(c));
      });
      return { categories: union, label: "Envies sélectionnées" };
    }
    const unionAll = new Set(getProfileInterestsSet("all"));
    familyProfile.forEach((m) => {
      getProfileInterestsSet(m.id).forEach((c) => unionAll.add(c));
    });
    return {
      categories: unionAll,
      label: familyProfile.length <= 1 ? "Mes envies" : "Envies du foyer",
    };
  }

  // Multi-territoires state
  let territoryOptions = [];
  let territoryMap = new Map();
  let activeTerritoryKey = "all";
  let territoryStatsCache = new Map();
  let latestTerritoryStatsSeq = 0;

  const DEFAULT_AUDIENCE_GROUPS = [
    { code: "maternelle", label: "Maternelle (3–5 ans)", age_min: 3, age_max: 5 },
    { code: "primaire", label: "Primaire (6–10 ans)", age_min: 6, age_max: 10 },
    { code: "college", label: "Collège (11–14 ans)", age_min: 11, age_max: 14 },
    { code: "lycee", label: "Lycée (15–17 ans)", age_min: 15, age_max: 17 },
    { code: "adulte", label: "Adultes (18+)", age_min: 18, age_max: 59 },
    { code: "senior", label: "Seniors (60+)", age_min: 60, age_max: 110 },
  ];

  let familyMembers = [
    { name: "Enfant 1", grade: "CE2", age: "", birth_year: "", category: "" },
    { name: "Enfant 2", grade: "MS", age: "", birth_year: "", category: "" },
  ];

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function getCategoryVisual(cat) {
    if (!cat) return DEFAULT_VISUAL;
    const norm = normalizeText(cat).trim();
    if (CATEGORY_VISUALS[norm]) return CATEGORY_VISUALS[norm];
    const matchKey = Object.keys(CATEGORY_VISUALS).find((k) => norm.includes(k) || k.includes(norm));
    return matchKey ? CATEGORY_VISUALS[matchKey] : DEFAULT_VISUAL;
  }

  function getCategoryIcon(cat) {
    return getCategoryVisual(cat).icon;
  }

  function getCategoryShortLabel(cat) {
    if (!cat) return "Tout";
    const norm = normalizeText(cat).trim();
    if (CATEGORY_VISUALS[norm]) return CATEGORY_VISUALS[norm].shortLabel;
    return String(cat);
  }

  function debounce(fn, delayMs) {
    let timer = null;
    const wrapped = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn(...args);
      }, delayMs);
    };
    wrapped.flush = (...args) => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
        fn(...args);
      }
    };
    wrapped.cancel = () => {
      clearTimeout(timer);
      timer = null;
    };
    return wrapped;
  }

  function getDisciplineVisual(discipline, category, title) {
    const cacheKey = `${discipline || ""}||${category || ""}||${title || ""}`;
    if (disciplineVisualCache.has(cacheKey)) {
      return disciplineVisualCache.get(cacheKey);
    }

    let result = null;
    const discNorm = normalizeText(discipline || "").trim();
    if (discNorm) {
      const rule = DISCIPLINE_VISUAL_RULES.find((r) => r.re.test(discNorm));
      if (rule) {
        result = {
          icon: rule.icon,
          bg: rule.bg,
          fg: rule.fg,
          border: rule.border,
          label: String(discipline).trim(),
        };
      }
    }
    if (!result) {
      const titleNorm = normalizeText(title || "").trim();
      if (titleNorm) {
        const rule = DISCIPLINE_VISUAL_RULES.find((r) => r.re.test(titleNorm));
        if (rule) {
          result = {
            icon: rule.icon,
            bg: rule.bg,
            fg: rule.fg,
            border: rule.border,
            label: String(discipline || category || "Activité").trim(),
          };
        }
      }
    }
    if (!result) {
      const catVis = getCategoryVisual(category);
      result = {
        icon: catVis.icon,
        bg: catVis.bg,
        fg: catVis.fg,
        border: catVis.border,
        label: String(discipline || category || "Activité").trim(),
      };
    }

    if (disciplineVisualCache.size > 4000) {
      disciplineVisualCache.clear();
    }
    disciplineVisualCache.set(cacheKey, result);
    return result;
  }

  function getAvailabilityMeta(avail) {
    const map = {
      open: { code: "open", label: "Places dispo" },
      limited: { code: "limited", label: "Dernières places" },
      full: { code: "full", label: "Complet" },
      unknown: { code: "unknown", label: "À confirmer" },
    };
    return map[avail] || map.unknown;
  }

  function getAudienceGroups() {
    if (meta && Array.isArray(meta.audience_groups) && meta.audience_groups.length) {
      return meta.audience_groups;
    }
    return DEFAULT_AUDIENCE_GROUPS;
  }

  function loadFamilyProfile() {
    try {
      const raw = localStorage.getItem(FAMILY_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed
            .filter((m) => m && m.id && m.name)
            .map((m, idx) => ({
              id: String(m.id),
              name: String(m.name),
              color: String(m.color || PLANNER_COLOR_PALETTE[idx % PLANNER_COLOR_PALETTE.length]),
              grade: String(m.grade || ""),
              age: m.age !== undefined && m.age !== null ? String(m.age) : "",
            }));
        }
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_FAMILY_PROFILE.map((m) => ({ ...m }));
  }

  function isFamilyConfigured() {
    return localStorage.getItem(FAMILY_SETUP_DONE_KEY) === "saved";
  }

  function resolveMemberAge(member) {
    if (!member) return null;
    const rawAge = String(member.age || "").trim();
    if (rawAge) {
      const n = Number(rawAge);
      if (Number.isFinite(n) && n >= 0 && n <= 110) return Math.trunc(n);
    }
    if (member.grade && GRADE_DEFAULT_AGES[member.grade] !== undefined) {
      return GRADE_DEFAULT_AGES[member.grade];
    }
    return null;
  }

  function ageToAudienceGroupCode(age) {
    if (age === null || age === undefined) return null;
    if (age <= 5) return "maternelle";
    if (age <= 10) return "primaire";
    if (age <= 14) return "college";
    if (age <= 17) return "lycee";
    if (age <= 59) return "adulte";
    return "senior";
  }

  function memberMatchesAgeRange(member, ageMin, ageMax) {
    const age = resolveMemberAge(member);
    if (age === null) return false;
    const lo = ageMin !== null && ageMin !== undefined ? Number(ageMin) : 0;
    const hi = ageMax !== null && ageMax !== undefined ? Number(ageMax) : 110;
    return age >= lo && age <= hi;
  }

  function slotTimeToMinutes(hhmm) {
    const parts = String(hhmm || "00:00").split(":");
    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;
    return h * 60 + m;
  }

  function getSlotConflictForMember(memberId, slot) {
    if (!memberId || !slot) return null;
    const sStart = slotTimeToMinutes(slot.start_time);
    const sEnd = slotTimeToMinutes(slot.end_time);
    return (
      favorites.find((f) => {
        if (f.id === slot.id) return false;
        if (f.memberId !== memberId) return false;
        if (f.day_of_week !== slot.day_of_week) return false;
        const fStart = slotTimeToMinutes(f.start_time);
        const fEnd = slotTimeToMinutes(f.end_time);
        return sStart < fEnd && fStart < sEnd;
      }) || null
    );
  }

  function syncFamilyMembersFromProfile() {
    if (!familyProfile.length) return;
    familyMembers = familyProfile.slice(0, 4).map((m) => ({
      name: m.name,
      grade: m.grade || "",
      age: m.age || "",
      birth_year: "",
      category: "",
    }));
  }

  function saveFamilyProfile() {
    localStorage.setItem(FAMILY_PROFILE_KEY, JSON.stringify(familyProfile));
  }

  function getMemberById(memberId) {
    if (!memberId) return null;
    return familyProfile.find((m) => m.id === memberId) || null;
  }

  function getNextMemberColor() {
    const used = new Set(familyProfile.map((m) => m.color.toLowerCase()));
    const unused = PLANNER_COLOR_PALETTE.find((c) => !used.has(c.toLowerCase()));
    return unused || PLANNER_COLOR_PALETTE[familyProfile.length % PLANNER_COLOR_PALETTE.length];
  }

  function ensureFamilyMemberByName(rawName) {
    const cleanName = String(rawName || "").trim() || `Membre ${familyProfile.length + 1}`;
    const norm = normalizeText(cleanName);
    const existing = familyProfile.find((m) => normalizeText(m.name) === norm);
    if (existing) return existing;
    const newMember = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      color: getNextMemberColor(),
    };
    familyProfile.push(newMember);
    saveFamilyProfile();
    return newMember;
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveFavorites() {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
    updateFavCounter();
  }

  function updateFavCounter() {
    const el = document.getElementById("fav-count");
    if (el) el.textContent = String(favorites.length);
    const tabBadge = document.getElementById("planner-tab-count");
    if (tabBadge) {
      tabBadge.textContent = String(favorites.length);
      tabBadge.classList.toggle("hidden", favorites.length === 0);
    }
  }

  /* ---- Favoris / Listes Airbnb (assoplanning_wishlists_v1) ---- */
  function createDefaultWishlists() {
    return {
      lists: [{ id: "default", name: "Mes idées", items: [] }],
      activeListId: "default",
    };
  }

  function loadWishlists() {
    try {
      const raw = localStorage.getItem(WISHLISTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.lists) && parsed.lists.length > 0) {
          const lists = parsed.lists
            .filter((l) => l && l.id && l.name)
            .map((l) => ({
              id: String(l.id),
              name: String(l.name),
              items: Array.isArray(l.items)
                ? l.items.filter((it) => it && (it.kind === "slot" || it.kind === "camp") && it.id !== undefined && it.data)
                : [],
            }));
          if (lists.length > 0) {
            const activeId = lists.some((l) => l.id === parsed.activeListId) ? parsed.activeListId : lists[0].id;
            return { lists, activeListId: activeId };
          }
        }
      }
    } catch {
      // ignore storage errors
    }
    return createDefaultWishlists();
  }

  function saveWishlists() {
    try {
      localStorage.setItem(WISHLISTS_STORAGE_KEY, JSON.stringify(wishlistsData));
    } catch {
      // ignore quota errors
    }
    updateWishlistsCounter();
  }

  function getActiveWishlist() {
    if (!wishlistsData || !Array.isArray(wishlistsData.lists) || !wishlistsData.lists.length) {
      wishlistsData = createDefaultWishlists();
    }
    return wishlistsData.lists.find((l) => l.id === wishlistsData.activeListId) || wishlistsData.lists[0];
  }

  function getTotalWishlistItemsCount() {
    const seen = new Set();
    (wishlistsData.lists || []).forEach((l) => {
      (l.items || []).forEach((it) => seen.add(`${it.kind}:${it.id}`));
    });
    return seen.size;
  }

  function updateWishlistsCounter() {
    const count = getTotalWishlistItemsCount();
    const badge = document.getElementById("wishlists-tab-count");
    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle("hidden", count === 0);
    }
  }

  function isWishlisted(kind, id) {
    const numId = Number(id);
    return (wishlistsData.lists || []).some((l) =>
      (l.items || []).some((it) => it.kind === kind && Number(it.id) === numId)
    );
  }

  function toggleWishlistItem(item, kind) {
    if (!item || item.id === undefined || item.id === null) return;
    const itemKind = kind === "camp" ? "camp" : "slot";
    const numId = Number(item.id);
    const already = isWishlisted(itemKind, numId);

    if (window.AssoNative) {
      window.AssoNative.triggerHaptic("medium");
    }

    if (already) {
      const removedEntries = [];
      wishlistsData.lists.forEach((l) => {
        const listItems = l.items || [];
        listItems.forEach((it, idx) => {
          if (it.kind === itemKind && Number(it.id) === numId) {
            removedEntries.push({ listId: l.id, index: idx, entry: { ...it } });
          }
        });
        l.items = listItems.filter((it) => !(it.kind === itemKind && Number(it.id) === numId));
      });
      showToast("Retiré de vos favoris", "info", {
        actionLabel: "Annuler",
        onAction: () => {
          removedEntries.forEach(({ listId, index, entry }) => {
            const targetList = wishlistsData.lists.find((l) => l.id === listId) || getActiveWishlist();
            if (!targetList.items.some((x) => x.kind === entry.kind && Number(x.id) === Number(entry.id))) {
              const insertIdx = Math.min(index, targetList.items.length);
              targetList.items.splice(insertIdx, 0, entry);
            }
          });
          saveWishlists();
          patchCardStateInPlace(itemKind, numId);
          if (currentMode === "wishlists") renderWishlistsView();
          refreshDetailModalIfOpen();
        },
      });
    } else {
      const activeList = getActiveWishlist();
      activeList.items.unshift({ kind: itemKind, id: numId, data: { ...item } });
      showToast(`Ajouté à « ${activeList.name} » ❤️`, "success");
    }
    saveWishlists();
    patchCardStateInPlace(itemKind, numId);
    if (currentMode === "wishlists") renderWishlistsView();
    refreshDetailModalIfOpen();
  }

  function toggleGroupWishlist(group) {
    if (!group || !Array.isArray(group.slots) || !group.slots.length) return;
    const wishlistedSlots = group.slots.filter((s) => isWishlisted("slot", s.id));
    if (wishlistedSlots.length > 0) {
      if (window.AssoNative) {
        window.AssoNative.triggerHaptic("medium");
      }
      const idSet = new Set(wishlistedSlots.map((s) => Number(s.id)));
      const removedEntries = [];
      wishlistsData.lists.forEach((l) => {
        const listItems = l.items || [];
        listItems.forEach((it, idx) => {
          if (it.kind === "slot" && idSet.has(Number(it.id))) {
            removedEntries.push({ listId: l.id, index: idx, entry: { ...it } });
          }
        });
        l.items = listItems.filter((it) => !(it.kind === "slot" && idSet.has(Number(it.id))));
      });
      saveWishlists();
      wishlistedSlots.forEach((s) => patchCardStateInPlace("slot", s.id));
      if (currentMode === "wishlists") renderWishlistsView();
      refreshDetailModalIfOpen();
      showToast("Retiré de vos favoris", "info", {
        actionLabel: "Annuler",
        onAction: () => {
          removedEntries.forEach(({ listId, index, entry }) => {
            const targetList = wishlistsData.lists.find((l) => l.id === listId) || getActiveWishlist();
            if (!targetList.items.some((x) => x.kind === entry.kind && Number(x.id) === Number(entry.id))) {
              const insertIdx = Math.min(index, targetList.items.length);
              targetList.items.splice(insertIdx, 0, entry);
            }
          });
          saveWishlists();
          wishlistedSlots.forEach((s) => patchCardStateInPlace("slot", s.id));
          if (currentMode === "wishlists") renderWishlistsView();
          refreshDetailModalIfOpen();
        },
      });
      return;
    }
    const rep = pickRepresentativeSlotForGroup(group) || group.slots[0];
    toggleWishlistItem(rep, "slot");
  }

  async function createNewWishlist() {
    const raw = window.AssoDialog
      ? await window.AssoDialog.prompt({
          title: "Nouvelle liste de favoris",
          message: "Ex : Mercredi Léo, Danse, Vacances d'été…",
          placeholder: "Nom de la liste",
          confirmText: "Créer",
        })
      : null;
    if (raw === null) return;
    const name = raw.trim();
    if (!name) {
      showToast("Indiquez un nom pour la liste.", "info");
      return;
    }
    const newList = {
      id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: name.slice(0, 42),
      items: [],
    };
    wishlistsData.lists.push(newList);
    wishlistsData.activeListId = newList.id;
    saveWishlists();
    renderWishlistsView();
    showToast(`Liste « ${newList.name} » créée !`, "success");
  }

  async function deleteWishlist(listId) {
    if (wishlistsData.lists.length <= 1) {
      showToast("Vous devez conserver au moins une liste de favoris.", "info");
      return;
    }
    const target = wishlistsData.lists.find((l) => l.id === listId);
    if (!target) return;
    if (target.items.length > 0 && window.AssoDialog) {
      const ok = await window.AssoDialog.confirm({
        title: "Supprimer cette liste ?",
        message: `Supprimer la liste « ${target.name} » (${target.items.length} élément${target.items.length > 1 ? "s" : ""}) ?`,
        confirmText: "Supprimer",
        danger: true,
      });
      if (!ok) return;
    }
    const affected = (target.items || []).map((it) => ({ kind: it.kind, id: it.id }));
    wishlistsData.lists = wishlistsData.lists.filter((l) => l.id !== listId);
    if (wishlistsData.activeListId === listId) {
      wishlistsData.activeListId = wishlistsData.lists[0].id;
    }
    saveWishlists();
    renderWishlistsView();
    affected.forEach((it) => patchCardStateInPlace(it.kind, it.id));
    showToast(`Liste « ${target.name} » supprimée.`, "info");
  }

  function isFav(slotId) {
    return favorites.some((s) => Number(s.id) === Number(slotId));
  }

  function getDefaultMemberIdForSlot(slot, explicitMemberId) {
    if (explicitMemberId && getMemberById(explicitMemberId)) return explicitMemberId;
    const singleWhoMemberId = selectedWhoMemberIds.size === 1 ? Array.from(selectedWhoMemberIds)[0] : null;
    if (singleWhoMemberId && getMemberById(singleWhoMemberId)) return singleWhoMemberId;
    if (activePlannerMemberId !== "all" && getMemberById(activePlannerMemberId)) return activePlannerMemberId;
    if (slot && isFamilyConfigured() && familyProfile.length) {
      const matching = familyProfile.filter((m) => memberMatchesAgeRange(m, slot.age_min, slot.age_max));
      if (matching.length === 1) return matching[0].id;
      if (matching.length > 0) return matching[0].id;
    }
    return familyProfile[0] ? familyProfile[0].id : "";
  }

  function toggleFav(slot, explicitMemberId) {
    if (isFav(slot.id)) {
      const removedIdx = favorites.findIndex((s) => Number(s.id) === Number(slot.id));
      const removedEntry = removedIdx >= 0 ? { ...favorites[removedIdx] } : null;
      favorites = favorites.filter((s) => Number(s.id) !== Number(slot.id));
      if (window.AssoNative) {
        window.AssoNative.triggerHaptic("light");
      }
      showToast("Retiré de votre planning", "info", {
        actionLabel: "Annuler",
        onAction: () => {
          if (removedEntry && !isFav(removedEntry.id)) {
            const insertIdx = Math.min(Math.max(0, removedIdx), favorites.length);
            favorites.splice(insertIdx, 0, removedEntry);
            saveFavorites();
            patchCardStateInPlace("slot", slot.id);
            if (currentMode === "simple" && currentView !== "list") renderCurrentView();
            renderFavoritesDrawer();
            if (currentMode === "planner") renderPlannerView();
            refreshDetailModalIfOpen();
          }
        },
      });
    } else {
      const targetMemberId = getDefaultMemberIdForSlot(slot, explicitMemberId);
      const conflict = targetMemberId ? getSlotConflictForMember(targetMemberId, slot) : null;
      favorites.push({ ...slot, memberId: targetMemberId });
      const targetMember = getMemberById(targetMemberId);
      if (window.AssoNative) {
        window.AssoNative.triggerHaptic(conflict ? "warning" : "success");
      }
      showToast(
        conflict && targetMember
          ? `Ajouté à ${targetMember.name} ⚠️ (conflit avec ${conflict.title})`
          : targetMember
            ? `Ajouté au planning de ${targetMember.name} 📅`
            : "Ajouté à votre planning 📅",
        conflict ? "warning" : "success"
      );
    }
    saveFavorites();
    patchCardStateInPlace("slot", slot.id);
    if (currentMode === "simple" && currentView !== "list") {
      renderCurrentView();
    }
    renderFavoritesDrawer();
    if (currentMode === "planner") renderPlannerView();
    refreshDetailModalIfOpen();
  }

  function setFavoriteMember(slotId, memberId) {
    const item = favorites.find((s) => Number(s.id) === Number(slotId));
    if (!item) return;
    item.memberId = memberId || "";
    saveFavorites();
    patchCardStateInPlace("slot", slotId);
    if (currentMode === "simple" && currentView !== "list") {
      renderCurrentView();
    }
    renderFavoritesDrawer();
    if (currentMode === "planner") renderPlannerView();
    refreshDetailModalIfOpen();
  }

  function exportIcsForSlots(slotsList) {
    if (!slotsList || !slotsList.length) {
      showToast("Ajoutez d'abord au moins un créneau dans votre planning.", "info");
      return;
    }
    const ids = slotsList.map((f) => f.id).join(",");
    const memberPairs = [];
    slotsList.forEach((f) => {
      const member = getMemberById(f.memberId);
      if (member) {
        const safeName = member.name.replace(/[,:]/g, " ").trim();
        if (safeName) memberPairs.push(`${f.id}:${safeName}`);
      }
    });
    const params = new URLSearchParams();
    params.set("ids", ids);
    if (memberPairs.length) {
      params.set("member_map", memberPairs.join(","));
    }
    if (window.AP && typeof window.AP.downloadIcsFromUrl === "function") { window.AP.downloadIcsFromUrl(`/api/slots/export.ics?${params.toString()}`); } else { window.location.href = `/api/slots/export.ics?${params.toString()}`; }
  }

  async function tryImportSharedLinkOnInit() {
    const hash = window.location.hash || "";
    if (!hash.startsWith("#family=")) return;
    try {
      const b64 = decodeURIComponent(hash.slice("#family=".length));
      const jsonStr = decodeURIComponent(escape(atob(b64)));
      const payload = JSON.parse(jsonStr);
      if (Array.isArray(payload.f) && payload.f.length) {
        familyProfile = payload.f.map((m, idx) => ({
          id: String(m.id || `m${idx + 1}`),
          name: String(m.name || `Membre ${idx + 1}`),
          color: String(m.color || PLANNER_COLOR_PALETTE[idx % PLANNER_COLOR_PALETTE.length]),
          grade: String(m.grade || ""),
          age: m.age ? String(m.age) : "",
        }));
        saveFamilyProfile();
        localStorage.setItem(FAMILY_SETUP_DONE_KEY, "saved");
      }
      if (Array.isArray(payload.s) && payload.s.length) {
        const allData = await apiFetch("/api/slots");
        const slotMap = new Map((allData.slots || []).map((sl) => [sl.id, sl]));
        const imported = [];
        payload.s.forEach(([sid, mid]) => {
          const found = slotMap.get(Number(sid));
          if (found) imported.push({ ...found, memberId: mid || (familyProfile[0] ? familyProfile[0].id : "") });
        });
        if (imported.length) {
          favorites = imported;
          saveFavorites();
        }
      }
      history.replaceState(null, "", window.location.pathname + window.location.search);
      showToast("Profil famille & planning importés depuis le lien partagé !", "success");
    } catch {
      // ignore invalid share hash
    }
  }

  async function shareFamilyLink() {
    try {
      const isCap = Boolean(window.AssoNative && window.AssoNative.isCapacitor);
      if (isCap) {
        const lines = ["📅 Mon Planning AssoPlanning"];
        if (familyProfile.length) {
          const membersStr = familyProfile
            .map((m) => `${m.name}${m.grade ? ` (${m.grade})` : m.age ? ` (${m.age} ans)` : ""}`)
            .join(", ");
          lines.push(`👨‍👩‍👧‍👦 Foyer : ${membersStr}`);
        }
        if (favorites.length) {
          lines.push("");
          const sorted = [...favorites].sort(
            (a, b) =>
              Number(a.day_of_week) - Number(b.day_of_week) ||
              String(a.start_time || "").localeCompare(String(b.start_time || ""))
          );
          sorted.forEach((f) => {
            const member = getMemberById(f.memberId);
            const who = member ? `[${member.name}] ` : "";
            lines.push(
              `• ${f.day_label || DAYS_FR[f.day_of_week] || ""} ${f.start_time}–${f.end_time} : ${who}${f.title} (${f.organization_name}${f.venue_name ? `, ${f.venue_name}` : ""})`
            );
          });
        } else {
          lines.push("Aucun créneau enregistré dans le planning pour le moment.");
        }
        const res = await window.AssoNative.shareContent({
          title: "Mon Planning AssoPlanning",
          text: lines.join("\n"),
        });
        if (res && res.ok && res.method === "clipboard") {
          showToast("Résumé du planning copié !", "success");
        } else if (res && !res.ok && !res.cancelled) {
          showToast("Impossible de partager le planning.", "error");
        }
        return;
      }

      const payload = {
        f: familyProfile.map((m) => ({ id: m.id, name: m.name, color: m.color, grade: m.grade || "", age: m.age || "" })),
        s: favorites.map((f) => [f.id, f.memberId || ""]),
      };
      const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const url = `${window.location.origin}${window.location.pathname}#family=${encodeURIComponent(b64)}`;
      const summaryText = favorites.length
        ? `Voici mon planning AssoPlanning (${favorites.length} créneau${favorites.length > 1 ? "x" : ""}) :`
        : "Voici la configuration de mon foyer AssoPlanning :";

      if (window.AssoNative && typeof window.AssoNative.shareContent === "function") {
        const res = await window.AssoNative.shareContent({
          title: "Mon Planning AssoPlanning",
          text: summaryText,
          url,
        });
        if (res && res.ok && res.method === "clipboard") {
          showToast("Lien de partage copié ! Envoyez-le par SMS/WhatsApp.", "success");
        } else if (res && !res.ok && !res.cancelled) {
          showToast("Partage indisponible dans ce navigateur.", "info");
        }
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Lien de partage copié ! Envoyez-le par SMS/WhatsApp.", "success");
      } else {
        showToast("Partage indisponible dans ce navigateur.", "info");
      }
    } catch {
      showToast("Impossible de générer le partage.", "error");
    }
  }

  function renderFamilyEditorRows(containerId) {
    const rowsWrap = document.getElementById(containerId);
    if (!rowsWrap) return;
    const gradeOpts = (meta && meta.grades ? meta.grades : [])
      .map((g) => `<option value="${escapeHtml(g.code)}">${escapeHtml(g.label)}</option>`)
      .join("");

    rowsWrap.innerHTML = familyProfile
      .map(
        (m, idx) => `
      <div class="family-quickstart-row" data-fq-idx="${idx}">
        <button type="button" class="family-dot fq-color" style="background:${escapeHtml(m.color)}; border:none; padding:0; cursor:pointer;" title="Changer la couleur"></button>
        <input type="text" class="fq-name" value="${escapeHtml(m.name)}" placeholder="Prénom (ex : Léo)" maxlength="32" />
        <select class="fq-grade">
          <option value="">Classe / Public…</option>
          ${gradeOpts}
        </select>
        <input type="number" class="fq-age" min="1" max="99" value="${escapeHtml(m.age || "")}" placeholder="ou Âge" />
        <button type="button" class="btn btn-outline btn-sm fq-remove" title="Retirer" ${familyProfile.length <= 1 ? "disabled" : ""}>✕</button>
      </div>`
      )
      .join("");

    rowsWrap.querySelectorAll(".family-quickstart-row").forEach((row) => {
      const idx = Number(row.dataset.fqIdx);
      const gradeSel = row.querySelector(".fq-grade");
      if (familyProfile[idx] && familyProfile[idx].grade) {
        gradeSel.value = familyProfile[idx].grade;
      }
      const colorBtn = row.querySelector(".fq-color");
      if (colorBtn) {
        colorBtn.addEventListener("click", () => {
          const curIdx = PLANNER_COLOR_PALETTE.findIndex(
            (c) => c.toLowerCase() === String(familyProfile[idx].color || "").toLowerCase()
          );
          const nextColor = PLANNER_COLOR_PALETTE[(curIdx + 1) % PLANNER_COLOR_PALETTE.length];
          familyProfile[idx].color = nextColor;
          colorBtn.style.background = nextColor;
        });
      }
      row.querySelector(".fq-name").addEventListener("input", (e) => {
        familyProfile[idx].name = e.target.value;
      });
      gradeSel.addEventListener("change", (e) => {
        familyProfile[idx].grade = e.target.value;
        if (e.target.value) {
          familyProfile[idx].age = "";
          row.querySelector(".fq-age").value = "";
        }
      });
      row.querySelector(".fq-age").addEventListener("input", (e) => {
        familyProfile[idx].age = e.target.value;
        if (e.target.value.trim()) {
          familyProfile[idx].grade = "";
          gradeSel.value = "";
        }
      });
      const remBtn = row.querySelector(".fq-remove");
      if (remBtn) {
        remBtn.addEventListener("click", () => {
          if (familyProfile.length <= 1) return;
          familyProfile.splice(idx, 1);
          renderFamilyQuickstart();
          renderProfileFamilyRows();
        });
      }
    });
  }

  function renderFamilyQuickstart() {
    renderFamilyEditorRows("family-quickstart-rows");
  }

  function renderProfileFamilyRows() {
    renderFamilyEditorRows("profile-family-rows");
  }

  function persistFamilyProfileChanges(toastMsg) {
    familyProfile = familyProfile.map((m, idx) => ({
      ...m,
      name: String(m.name || "").trim() || `Membre ${idx + 1}`,
    }));
    saveFamilyProfile();
    localStorage.setItem(FAMILY_SETUP_DONE_KEY, "saved");
    closeFamilyQuickstart("saved");
    syncFamilyMembersFromProfile();
    renderFamilyMembers();
    renderFamilyWhoPills();
    renderCampsFamilyPills();
    renderProfileFamilyRows();
    if (currentMode === "planner") renderPlannerView();
    if (currentMode === "wishlists") renderWishlistsView();
    if (currentMode === "camps") renderCampsGrid(currentCamps);
    renderQuickDiscoverBar(lastActiveTagsCount);
    renderCurrentView();
    showToast(toastMsg || "Foyer enregistré ! Vos pilules 1 clic sont prêtes.", "success");
  }

  function renderFamilyPillsInto(secId, wrapId) {
    const sec = document.getElementById(secId);
    const wrap = document.getElementById(wrapId);
    if (!sec || !wrap) return;
    if (!isFamilyConfigured() || !familyProfile.length) {
      sec.classList.add("hidden");
      wrap.innerHTML = "";
      return;
    }
    sec.classList.remove("hidden");
    wrap.innerHTML = "";
    familyProfile.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-chip member-who-chip ${selectedWhoMemberIds.has(m.id) ? "active" : ""}`;
      const sub = m.grade ? m.grade : m.age ? `${m.age} ans` : "";
      btn.innerHTML = `<span class="family-dot" style="background:${escapeHtml(m.color)};"></span>${escapeHtml(m.name)}${sub ? ` <span style="opacity:0.8;">(${escapeHtml(sub)})</span>` : ""}`;
      btn.addEventListener("click", () => {
        const fg = document.getElementById("filter-grade");
        const fa = document.getElementById("filter-age-or-year");
        if (fg) fg.value = "";
        if (fa) fa.value = "";
        syncAccWhoInputsFromMain();
        if (selectedWhoMemberIds.has(m.id)) {
          selectedWhoMemberIds.delete(m.id);
        } else {
          selectedWhoMemberIds.add(m.id);
        }
        syncAudiencePillsUI();
        renderFamilyWhoPills();
        populateCategoryChips();
        loadSlots();
      });
      wrap.appendChild(btn);
    });
  }

  function renderFamilyWhoPills() {
    renderFamilyPillsInto("family-who-section", "family-who-pills");
    renderFamilyPillsInto("acc-family-section", "acc-family-pills");
  }

  function renderCampsFamilyPills() {
    const row = document.getElementById("camps-family-row");
    const wrap = document.getElementById("camps-family-pills");
    if (!row || !wrap) return;
    if (!isFamilyConfigured() || !familyProfile.length) {
      row.classList.add("hidden");
      wrap.innerHTML = "";
      return;
    }
    row.classList.remove("hidden");
    wrap.innerHTML = "";
    familyProfile.forEach((m) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-chip member-who-chip ${selectedCampMemberIds.has(m.id) ? "active" : ""}`;
      btn.innerHTML = `<span class="family-dot" style="background:${escapeHtml(m.color)};"></span>${escapeHtml(m.name)}`;
      btn.addEventListener("click", () => {
        if (selectedCampMemberIds.has(m.id)) {
          selectedCampMemberIds.delete(m.id);
        } else {
          selectedCampMemberIds.add(m.id);
        }
        selectedCampAudiences.clear();
        selectedCampMemberIds.forEach((id) => {
          const member = getMemberById(id);
          const groupCode = ageToAudienceGroupCode(resolveMemberAge(member));
          if (groupCode) selectedCampAudiences.add(groupCode);
        });
        syncCampAudiencePillsUI();
        renderCampsFamilyPills();
        loadCamps();
      });
      wrap.appendChild(btn);
    });
  }

  function openFamilyQuickstart() {
    renderFamilyQuickstart();
    document.getElementById("family-quickstart-banner").classList.remove("hidden");
  }

  function closeFamilyQuickstart(status) {
    document.getElementById("family-quickstart-banner").classList.add("hidden");
    if (status) localStorage.setItem(FAMILY_SETUP_DONE_KEY, status);
  }

  /* ---- Sélecteur multi-territoires / multi-villes ---- */
  function buildTerritoryOptions() {
    const cities = Array.isArray(meta && meta.cities) ? meta.cities : [];
    const options = [];
    const byDept = new Map();

    cities.forEach((c) => {
      const dept = String(c.department || (c.postal_code ? c.postal_code.slice(0, 2) : "") || "Autre").trim();
      if (!byDept.has(dept)) byDept.set(dept, []);
      byDept.get(dept).push(c);
    });

    const computeCenter = (list) => {
      const valid = list.filter((c) => Number.isFinite(Number(c.center_lat)) && Number.isFinite(Number(c.center_lng)));
      if (!valid.length) return { lat: 48.9465, lng: 2.1425, zoom: 13 };
      const lat = valid.reduce((acc, c) => acc + Number(c.center_lat), 0) / valid.length;
      const lng = valid.reduce((acc, c) => acc + Number(c.center_lng), 0) / valid.length;
      const zoom = valid.length === 1 ? 14 : list.length === cities.length && byDept.size > 1 ? 11 : 13;
      return { lat, lng, zoom };
    };

    const allCenter = computeCenter(cities);
    options.push({
      key: "all",
      group: "root",
      label: `Toutes les villes (${cities.length})`,
      shortLabel: cities.length > 1 ? `Toutes les villes (${cities.length})` : cities[0] ? cities[0].name : "Toutes les villes",
      slugs: [],
      center: allCenter,
    });

    Array.from(byDept.keys())
      .sort((a, b) => a.localeCompare(b, "fr"))
      .forEach((dept) => {
        const list = byDept.get(dept);
        const joinedNames = list.map((c) => c.name).join(" & ");
        options.push({
          key: `dept:${dept}`,
          group: "territory",
          label: `${dept} — ${joinedNames}`,
          shortLabel: joinedNames,
          slugs: list.map((c) => c.slug),
          center: computeCenter(list),
        });
      });

    cities.forEach((c) => {
      options.push({
        key: `city:${c.slug}`,
        group: "city",
        label: c.postal_code ? `${c.name} (${c.postal_code})` : c.name,
        shortLabel: c.name,
        slugs: [c.slug],
        center: computeCenter([c]),
      });
    });

    territoryOptions = options;
    territoryMap = new Map(options.map((opt) => [opt.key, opt]));
  }

  function getActiveTerritory() {
    return territoryMap.get(activeTerritoryKey) || territoryMap.get("all") || {
      key: "all",
      label: "Toutes les villes",
      shortLabel: "Toutes les villes",
      slugs: [],
      center: { lat: 48.9465, lng: 2.1425, zoom: 13 },
    };
  }

  function populateTerritorySelect() {
    buildTerritoryOptions();
    const sel = document.getElementById("territory-select");
    if (!sel) return;
    sel.innerHTML = "";

    const rootOpt = territoryMap.get("all");
    if (rootOpt) {
      const opt = document.createElement("option");
      opt.value = rootOpt.key;
      opt.textContent = rootOpt.label;
      sel.appendChild(opt);
    }

    const territoryGroup = territoryOptions.filter((o) => o.group === "territory");
    if (territoryGroup.length) {
      const grp = document.createElement("optgroup");
      grp.label = "Par territoire";
      territoryGroup.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.key;
        opt.textContent = o.label;
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
    }

    const cityGroup = territoryOptions.filter((o) => o.group === "city");
    if (cityGroup.length) {
      const grp = document.createElement("optgroup");
      grp.label = "Par commune";
      cityGroup.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.key;
        opt.textContent = o.label;
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
    }

    let saved = "";
    try {
      saved = localStorage.getItem(TERRITORY_STORAGE_KEY) || "";
    } catch {
      saved = "";
    }
    if (saved && territoryMap.has(saved)) {
      activeTerritoryKey = saved;
    } else if (territoryMap.has("dept:78")) {
      activeTerritoryKey = "dept:78";
    } else {
      activeTerritoryKey = "all";
    }
    sel.value = activeTerritoryKey;
    populateWhereTerritoryPills();
  }

  function populateWhereTerritoryPills() {
    const candidates = territoryOptions.filter((o) => o.group === "root" || o.group === "territory");
    ["where-territory-pills", "acc-territory-pills", "profile-territory-pills"].forEach((wrapId) => {
      const wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.innerHTML = "";
      candidates.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-chip";
        btn.dataset.territoryKey = opt.key;
        btn.textContent = opt.group === "root" ? "Toutes les villes" : opt.label;
        btn.addEventListener("click", () => {
          applyTerritory(opt.key, { persist: true, reload: true });
        });
        wrap.appendChild(btn);
      });
    });
    syncWhereTerritoryPillsUI();
  }

  function isSelectedCitiesEqualToSlugs(slugs) {
    const list = Array.isArray(slugs) ? slugs : [];
    if (selectedCities.size !== list.length) return false;
    return list.every((slug) => selectedCities.has(slug));
  }

  function findMatchingTerritoryOption() {
    if (selectedCities.size === 0) {
      return territoryMap.get("all") || null;
    }
    const territoryMatch = territoryOptions.find(
      (opt) => opt.group === "territory" && isSelectedCitiesEqualToSlugs(opt.slugs)
    );
    if (territoryMatch) return territoryMatch;
    const cityMatch = territoryOptions.find(
      (opt) => opt.group === "city" && isSelectedCitiesEqualToSlugs(opt.slugs)
    );
    return cityMatch || null;
  }

  function getSelectedWhereLabel() {
    if (selectedCities.size === 0) {
      return "Toutes les villes";
    }
    const matched = findMatchingTerritoryOption();
    if (matched && matched.slugs.length > 0) {
      return matched.shortLabel;
    }
    const cityMap = new Map((meta && meta.cities ? meta.cities : []).map((c) => [c.slug, c.name]));
    const names = Array.from(selectedCities).map((slug) => cityMap.get(slug) || slug);
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(" + ");
    return `${names.length} communes`;
  }

  function syncWhereTerritoryPillsUI() {
    document.querySelectorAll(
      "#where-territory-pills .filter-chip, #acc-territory-pills .filter-chip, #profile-territory-pills .filter-chip"
    ).forEach((btn) => {
      const key = btn.dataset.territoryKey || "";
      if (key === "all") {
        btn.classList.toggle("active", selectedCities.size === 0);
      } else {
        const opt = territoryMap.get(key);
        btn.classList.toggle("active", Boolean(opt && opt.slugs.length > 0 && isSelectedCitiesEqualToSlugs(opt.slugs)));
      }
    });
  }

  function syncTerritorySelectFromSelectedCities() {
    const matched = findMatchingTerritoryOption();
    activeTerritoryKey = matched ? matched.key : "all";
    const sel = document.getElementById("territory-select");
    if (sel && territoryMap.has(activeTerritoryKey) && sel.value !== activeTerritoryKey) {
      sel.value = activeTerritoryKey;
    }
  }

  function updateTerritoryLabels() {
    const label = getSelectedWhereLabel();
    const brandLabel = document.getElementById("brand-territory-label");
    if (brandLabel) brandLabel.textContent = label;
    const whereSummary = document.getElementById("capsule-summary-where");
    if (whereSummary) whereSummary.textContent = label;
    const accWhereSummary = document.getElementById("acc-summary-where");
    if (accWhereSummary) accWhereSummary.textContent = label;
    const whereBtn = document.getElementById("capsule-btn-where");
    if (whereBtn) whereBtn.classList.toggle("has-filter", selectedCities.size > 0);
    const heroLabel = document.getElementById("hero-territory-label");
    if (heroLabel) heroLabel.textContent = label;
    const campsCaption = document.getElementById("camps-territory-caption");
    if (campsCaption) campsCaption.textContent = `Stages vacances scolaires — ${label}`;
    document.title = `AssoPlanning — ${label}`;

    const campsCitySel = document.getElementById("camps-city-select");
    if (campsCitySel && campsCitySel.options.length > 0) {
      campsCitySel.options[0].textContent =
        selectedCities.size > 1 ? `Sélection (${label})` : "Toutes communes";
    }
  }

  function onSelectedCitiesChanged({ reload = true } = {}) {
    syncTerritorySelectFromSelectedCities();
    syncCityPillsUI();
    syncWhereTerritoryPillsUI();

    const campsCitySel = document.getElementById("camps-city-select");
    if (campsCitySel) {
      campsCitySel.value = selectedCities.size === 1 ? Array.from(selectedCities)[0] : "";
    }

    updateTerritoryLabels();

    if (reload) {
      loadSlots();
      if (campsLoadedOnce || currentMode === "camps") {
        loadCamps();
      }
      if (currentMode === "family") {
        runFamilyCombos();
      }
    }
  }

  async function updateHeroStatsForTerritory(territory) {
    const statOrgs = document.getElementById("stat-orgs");
    const statSlots = document.getElementById("stat-slots");
    const statVenues = document.getElementById("stat-venues");
    if (!statOrgs || !statSlots || !statVenues || !meta) return;

    if (!territory.slugs.length) {
      statOrgs.textContent = meta.stats.organizations_count;
      statSlots.textContent = meta.stats.slots_count;
      statVenues.textContent = meta.stats.venues_count;
      return;
    }

    if (territoryStatsCache.has(territory.key)) {
      const cached = territoryStatsCache.get(territory.key);
      statOrgs.textContent = cached.orgs;
      statSlots.textContent = cached.slots;
      statVenues.textContent = cached.venues;
      return;
    }

    const reqSeq = ++latestTerritoryStatsSeq;
    try {
      const params = new URLSearchParams();
      params.set("city_slugs", territory.slugs.join(","));
      const data = await apiFetch(`/api/slots?${params.toString()}`);
      if (reqSeq !== latestTerritoryStatsSeq) return;
      const list = data.slots || [];
      const orgIds = new Set(list.map((s) => s.organization_id).filter(Boolean));
      const venueIds = new Set(list.map((s) => s.venue_id).filter(Boolean));
      const computed = { orgs: orgIds.size, slots: list.length, venues: venueIds.size };
      territoryStatsCache.set(territory.key, computed);
      if (activeTerritoryKey === territory.key) {
        statOrgs.textContent = computed.orgs;
        statSlots.textContent = computed.slots;
        statVenues.textContent = computed.venues;
      }
    } catch {
      // Keep previous stats on transient error
    }
  }

  function centerMapOnTerritory() {
    if (!leafletMap) return;
    const territory = getActiveTerritory();
    if (territory && territory.center) {
      leafletMap.setView([territory.center.lat, territory.center.lng], territory.center.zoom);
    }
  }

  function isSelectedCitiesMatchingTerritory() {
    const territory = getActiveTerritory();
    if (selectedCities.size !== territory.slugs.length) return false;
    return territory.slugs.every((slug) => selectedCities.has(slug));
  }

  function applyTerritory(key, { persist = true, reload = true } = {}) {
    activeTerritoryKey = territoryMap.has(key) ? key : "all";
    const territory = getActiveTerritory();

    const sel = document.getElementById("territory-select");
    if (sel && sel.value !== activeTerritoryKey) {
      sel.value = activeTerritoryKey;
    }
    if (persist) {
      try {
        localStorage.setItem(TERRITORY_STORAGE_KEY, activeTerritoryKey);
      } catch {
        // ignore storage errors
      }
    }

    selectedCities = new Set(territory.slugs);
    syncCityPillsUI();
    syncWhereTerritoryPillsUI();

    const campsCitySel = document.getElementById("camps-city-select");
    if (campsCitySel) {
      if (territory.slugs.length === 1) {
        campsCitySel.value = territory.slugs[0];
      } else {
        campsCitySel.value = "";
      }
    }

    updateTerritoryLabels();
    updateHeroStatsForTerritory(territory);
    centerMapOnTerritory();

    if (reload) {
      loadSlots();
      if (campsLoadedOnce || currentMode === "camps") {
        loadCamps();
      }
      if (currentMode === "family") {
        runFamilyCombos();
      }
    }
  }

  function initPwaInstallSupport() {
    if (window.AssoNative && window.AssoNative.isCapacitor) {
      return;
    }
    const installBtn = document.getElementById("pwa-install-btn");
    const installHelp = document.getElementById("pwa-install-help");
    const isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;

    if (isStandalone && installHelp) {
      installHelp.innerHTML = `<div><strong>✅ Application installée :</strong> AssoPlanning s'exécute déjà en mode application sur cet appareil.</div>`;
    }

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (installBtn) {
        installBtn.classList.remove("hidden");
      }
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      if (installBtn) installBtn.classList.add("hidden");
      if (installHelp) {
        installHelp.innerHTML = `<div><strong>✅ Application installée !</strong> Retrouvez AssoPlanning directement sur votre écran d'accueil.</div>`;
      }
      showToast("AssoPlanning installé sur votre appareil !", "success");
    });

    if (installBtn) {
      installBtn.addEventListener("click", async () => {
        if (!deferredInstallPrompt) {
          showToast("Utilisez le menu de votre navigateur (« Sur l'écran d'accueil ») pour installer l'app.", "info");
          return;
        }
        try {
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          if (choice && choice.outcome === "accepted") {
            installBtn.classList.add("hidden");
          }
        } catch {
          // ignore prompt error
        }
        deferredInstallPrompt = null;
      });
    }
  }

  const GITHUB_RELEASES_API = "https://api.github.com/repos/louisianef/asso-planning-releases/releases/latest";
  const GITHUB_LATEST_APK_URL = "https://github.com/louisianef/asso-planning-releases/releases/latest/download/AssoPlanning.apk";

  function parseBuildNumberFromTag(tag) {
    const raw = String(tag || "").trim();
    const match = raw.match(/(\d+)\s*$/);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  async function checkForAppUpdate({ silent = false } = {}) {
    const statusEl = document.getElementById("update-check-status");
    const banner = document.getElementById("app-update-banner");
    const bannerText = document.getElementById("app-update-banner-text");
    const bannerLink = document.getElementById("app-update-banner-link");
    const dlLink = document.getElementById("download-latest-apk-link");

    const localCode = Number(window.__ASSO_APP_VERSION_CODE__ || 0);
    const localVer = window.__ASSO_APP_VERSION__ || "";

    if (!silent && statusEl) {
      statusEl.textContent = "Vérification en cours…";
      statusEl.classList.remove("hidden");
    }

    try {
      const resp = await fetch(GITHUB_RELEASES_API, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!resp.ok) {
        if (!silent && statusEl) {
          statusEl.textContent =
            resp.status === 404
              ? "Aucune release APK publiée pour le moment."
              : "Impossible de vérifier les mises à jour pour le moment.";
          statusEl.classList.remove("hidden");
        }
        return;
      }
      const release = await resp.json();
      const latestTag = String(release.tag_name || "").trim();
      const latestCode = parseBuildNumberFromTag(latestTag);
      const apkAssets = (release.assets || []).filter((a) => String(a.name || "").toLowerCase().endsWith(".apk"));
      const apkAsset =
        apkAssets.find((a) => /-v\d/i.test(String(a.name || ""))) ||
        apkAssets[0] ||
        null;
      const apkUrl = (apkAsset && apkAsset.browser_download_url) || GITHUB_LATEST_APK_URL;
      const apkName = (apkAsset && apkAsset.name) || "";

      if (dlLink) {
        dlLink.href = apkUrl;
        if (apkName) dlLink.textContent = `⬇️ Télécharger ${apkName}`;
      }
      if (bannerLink) bannerLink.href = apkUrl;

      const isApk = Boolean(
        (window.AssoNative && window.AssoNative.isCapacitor) ||
          (window.AP && window.AP.isCapacitor)
      );
      const hasUpdate = localCode > 0 && latestCode > localCode;
      if (hasUpdate && isApk) {
        if (bannerText) {
          bannerText.textContent = `✨ Mise à jour disponible (${latestTag}) — cliquez pour télécharger ${apkName || "la nouvelle version"} sans perdre vos données.`;
        }
        if (banner) banner.classList.remove("hidden");
        if (statusEl) {
          statusEl.textContent = `✨ Nouvelle version ${latestTag} disponible (vous avez v${localVer}).`;
          statusEl.classList.remove("hidden");
        }
      } else if (!silent && statusEl) {
        if (hasUpdate) {
          statusEl.textContent = `✨ Nouvelle version Android ${latestTag} disponible au téléchargement ci-dessous.`;
        } else if (localCode > 0 && isApk) {
          statusEl.textContent = `✅ Votre application est à jour (v${localVer}${latestTag ? ` · dernière release ${latestTag}` : ""}).`;
        } else {
          statusEl.textContent = latestTag
            ? `Dernière version Android publiée : ${latestTag}.`
            : "Dernière version Android disponible au téléchargement ci-dessous.";
        }
        statusEl.classList.remove("hidden");
      }
    } catch {
      if (!silent && statusEl) {
        statusEl.textContent = "Vérification impossible hors ligne (réessayez avec une connexion Internet).";
        statusEl.classList.remove("hidden");
      }
    }
  }

  function initAppUpdateChecker() {
    const versionLabel = document.getElementById("app-version-label");
    const checkBtn = document.getElementById("check-update-btn");
    const banner = document.getElementById("app-update-banner");
    const bannerClose = document.getElementById("app-update-banner-close");

    const localVer = window.__ASSO_APP_VERSION__;

    if (versionLabel) {
      versionLabel.textContent = localVer ? `v${localVer}` : "Web";
    }
    if (bannerClose && banner) {
      bannerClose.addEventListener("click", () => {
        banner.classList.add("hidden");
      });
    }
    if (checkBtn) {
      checkBtn.addEventListener("click", () => {
        checkForAppUpdate({ silent: false });
      });
    }
    // Vérification silencieuse au démarrage (résout aussi l'URL versionnée AssoPlanning-v1.0.N.apk)
    setTimeout(() => {
      checkForAppUpdate({ silent: true });
    }, 2000);
  }

  async function init() {
    if (window.AssoNative) {
      if (typeof window.AssoNative.initStatusBar === "function") window.AssoNative.initStatusBar();
      if (typeof window.AssoNative.initVisualViewportKeyboard === "function") window.AssoNative.initVisualViewportKeyboard();
    }
    meta = await apiFetch("/api/meta");
    const seasonEl = document.getElementById("season-label");
    if (seasonEl) seasonEl.textContent = meta.season;
    const statOrgsEl = document.getElementById("stat-orgs");
    if (statOrgsEl) statOrgsEl.textContent = meta.stats.organizations_count;
    const statSlotsEl = document.getElementById("stat-slots");
    if (statSlotsEl) statSlotsEl.textContent = meta.stats.slots_count;
    const statVenuesEl = document.getElementById("stat-venues");
    if (statVenuesEl) statVenuesEl.textContent = meta.stats.venues_count;

    await tryImportSharedLinkOnInit();
    const urlParams = new URLSearchParams(window.location.search);
    const forceOnboarding = urlParams.get("onboarding") === "1";
    const shouldShowOnboarding =
      forceOnboarding || (!isFamilyConfigured() && !localStorage.getItem(FAMILY_SETUP_DONE_KEY));
    if (isFamilyConfigured()) {
      syncFamilyMembersFromProfile();
    }

    populateTerritorySelect();
    populateFilters();
    applyTerritory(activeTerritoryKey, { persist: false, reload: false });
    renderFamilyWhoPills();
    renderCampsFamilyPills();
    renderProfileFamilyRows();
    renderProfileInterestsGrid();
    bindEvents();
    initPwaInstallSupport();
    initAppUpdateChecker();
    updateFavCounter();
    updateWishlistsCounter();
    updateMobileViewToggle();
    syncGroupingToggleUI();
    renderFamilyMembers();
    syncWhenModeUI();
    await loadSlots();

    if (shouldShowOnboarding) {
      openOnboardingModal(1);
    }
  }

  /* ---- Synchronisation des champs entre Barre Desktop, Mobile & Popover Filtres ---- */
  function syncAccWhoInputsFromMain() {
    const fg = document.getElementById("filter-grade");
    const ag = document.getElementById("acc-grade");
    if (fg && ag && ag.value !== fg.value) ag.value = fg.value;
    const fa = document.getElementById("filter-age-or-year");
    const aa = document.getElementById("acc-age-or-year");
    if (fa && aa && aa.value !== fa.value) aa.value = fa.value;
  }

  function syncAccWhenInputsFromMain() {
    const fq = document.getElementById("filter-q");
    const qVal = fq ? fq.value : "";
    const aq = document.getElementById("acc-q");
    if (aq && aq.value !== qVal) aq.value = qVal;
    const mq = document.getElementById("mobile-filter-q");
    if (mq && mq.value !== qVal) mq.value = qVal;
    const mqClear = document.getElementById("mobile-filter-q-clear");
    if (mqClear) mqClear.classList.toggle("hidden", !qVal);

    const tf = document.getElementById("filter-time-from");
    const atf = document.getElementById("acc-time-from");
    if (tf && atf && atf.value !== tf.value) atf.value = tf.value;
    const tt = document.getElementById("filter-time-to");
    const att = document.getElementById("acc-time-to");
    if (tt && att && att.value !== tt.value) att.value = tt.value;
  }

  function syncBodyModalClass() {
    if (window.AssoOverlay && typeof window.AssoOverlay.hasOpen === "function") {
      document.body.classList.toggle("modal-open", window.AssoOverlay.hasOpen());
      return;
    }
    const detailBackdrop = document.getElementById("detail-modal-backdrop");
    const obBackdrop = document.getElementById("onboarding-modal-backdrop");
    const reportBackdrop = document.getElementById("report-modal-backdrop");
    const anyOpen = Boolean(
      (detailBackdrop && !detailBackdrop.classList.contains("hidden")) ||
      (obBackdrop && !obBackdrop.classList.contains("hidden")) ||
      (reportBackdrop && !reportBackdrop.classList.contains("hidden"))
    );
    document.body.classList.toggle("modal-open", anyOpen);
  }

  function setActiveAccordionCard(name) {
    document.querySelectorAll(".search-acc-card[data-accordion]").forEach((card) => {
      const isTarget = card.dataset.accordion === name;
      card.classList.toggle("open", isTarget);
      const header = card.querySelector("[data-accordion-toggle]");
      if (header) header.setAttribute("aria-expanded", isTarget ? "true" : "false");
    });
  }

  function openSearchModal() {
    const optsPanel = document.getElementById("popover-opts");
    const isAlreadyOpen = window.AssoSheets
      ? window.AssoSheets.isOpen("opts")
      : Boolean(optsPanel && !optsPanel.classList.contains("hidden"));
    if (!isAlreadyOpen) {
      togglePopover("opts");
    }
  }

  function closeSearchModal() {
    if (window.AssoSheets && window.AssoSheets.isOpen("opts")) {
      window.AssoSheets.close("opts");
    } else {
      const optsPanel = document.getElementById("popover-opts");
      if (optsPanel) optsPanel.classList.add("hidden", "sheet-hidden");
    }
  }

  function updateSearchApplyCta(count) {
    const btn = document.getElementById("acc-apply-btn");
    if (!btn) return;
    const n = Number.isFinite(Number(count)) ? Number(count) : 0;
    btn.textContent = `🔍 Rechercher (${n})`;
  }

  function syncGroupingToggleUI() {
    const wrap = document.getElementById("list-grouping-toggle");
    if (!wrap) return;
    const visible = currentMode === "simple" && exploreWhenMode === "yearly" && currentView === "list";
    wrap.classList.toggle("hidden", !visible);
    wrap.querySelectorAll("[data-grouping]").forEach((btn) => {
      const active = btn.dataset.grouping === listGroupingMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function updateMobileViewToggle() {
    const btn = document.getElementById("mobile-view-toggle-btn");
    if (!btn) return;
    const visible = currentMode === "simple" && exploreWhenMode === "yearly";
    btn.classList.toggle("hidden", !visible);
    if (!visible) return;
    if (currentView === "list") {
      btn.textContent = "🗺️ Carte";
      btn.setAttribute("aria-label", "Afficher la carte des lieux");
    } else {
      btn.textContent = "☰ Liste";
      btn.setAttribute("aria-label", "Afficher la liste des activités");
    }
  }

  function setExploreView(viewName) {
    currentView = viewName;
    document.querySelectorAll("#view-switcher button").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === viewName);
    });
    renderCurrentView();
    updateMobileViewToggle();
    syncGroupingToggleUI();
  }

  /* ---- Bloc 1 : 1. Pour qui ? ---- */
  function populateAudiencePills() {
    ["audience-pills", "acc-audience-pills"].forEach((wrapId) => {
      const audWrap = document.getElementById(wrapId);
      if (!audWrap) return;
      audWrap.innerHTML = "";

      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "filter-chip active";
      allBtn.dataset.audience = "";
      allBtn.textContent = "Tout public";
      allBtn.addEventListener("click", () => {
        selectedWhoMemberIds.clear();
        selectedAudiences.clear();
        const fg = document.getElementById("filter-grade");
        const fa = document.getElementById("filter-age-or-year");
        if (fg) fg.value = "";
        if (fa) fa.value = "";
        syncAccWhoInputsFromMain();
        syncAudiencePillsUI();
        renderFamilyWhoPills();
        populateCategoryChips();
        loadSlots();
      });
      audWrap.appendChild(allBtn);

      getAudienceGroups().forEach((group) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-chip";
        btn.dataset.audience = group.code;
        btn.textContent = group.label;
        btn.addEventListener("click", () => {
          const fg = document.getElementById("filter-grade");
          const fa = document.getElementById("filter-age-or-year");
          if (fg) fg.value = "";
          if (fa) fa.value = "";
          syncAccWhoInputsFromMain();
          if (selectedAudiences.has(group.code)) {
            selectedAudiences.delete(group.code);
          } else {
            selectedAudiences.add(group.code);
          }
          syncAudiencePillsUI();
          renderFamilyWhoPills();
          loadSlots();
        });
        audWrap.appendChild(btn);
      });
    });
  }

  function syncAudiencePillsUI() {
    const fg = document.getElementById("filter-grade");
    const fa = document.getElementById("filter-age-or-year");
    const gradeVal = fg ? fg.value : "";
    const ageOrYearVal = fa ? fa.value.trim() : "";
    const hasPrecise = Boolean(gradeVal || ageOrYearVal);
    document.querySelectorAll("#audience-pills .filter-chip, #acc-audience-pills .filter-chip").forEach((btn) => {
      const code = btn.dataset.audience || "";
      if (code === "") {
        btn.classList.toggle("active", selectedAudiences.size === 0 && selectedWhoMemberIds.size === 0 && !hasPrecise);
      } else {
        btn.classList.toggle("active", !hasPrecise && selectedAudiences.has(code));
      }
    });
  }

  /* ---- Bloc 2 : 2. Quand ? (Plages, moments, durée & matrice 7×4) ---- */
  function populateTimeSelects() {
    const options = ['<option value="">—</option>'];
    for (let mins = 7 * 60; mins <= 22 * 60 + 30; mins += 15) {
      const hh = String(Math.floor(mins / 60)).padStart(2, "0");
      const mm = String(mins % 60).padStart(2, "0");
      const val = `${hh}:${mm}`;
      options.push(`<option value="${val}">${val}</option>`);
    }
    const htmlStr = options.join("");
    ["filter-time-from", "filter-time-to", "acc-time-from", "acc-time-to"].forEach((id) => {
      const sel = document.getElementById(id);
      if (!sel || sel.tagName !== "SELECT") return;
      const prev = sel.value;
      sel.innerHTML = htmlStr;
      if (prev) sel.value = prev;
    });
  }

  function parseDurationParams(rangeStr) {
    if (!rangeStr || !rangeStr.includes("-")) return { min: null, max: null };
    const parts = rangeStr.split("-");
    const lo = Number(parts[0]);
    const hi = Number(parts[1]);
    return {
      min: Number.isFinite(lo) && lo >= 0 ? Math.min(720, Math.max(0, Math.trunc(lo))) : null,
      max: Number.isFinite(hi) && hi < 999 ? Math.min(720, Math.max(0, Math.trunc(hi))) : null,
    };
  }

  function renderDaySlotMatrices() {
    const htmlParts = ['<div class="day-slot-matrix-grid">'];
    htmlParts.push('<span class="matrix-corner" aria-hidden="true"></span>');
    for (let d = 0; d < 7; d++) {
      const allDay = MATRIX_MOMENTS.every((m) => selectedDaySlots.has(`${d}:${m.key}`));
      const someDay = !allDay && MATRIX_MOMENTS.some((m) => selectedDaySlots.has(`${d}:${m.key}`));
      const dayShort = (DAYS_FR[d] || "").slice(0, 3);
      htmlParts.push(
        `<button type="button" class="matrix-day-btn ${allDay ? "active" : someDay ? "partial" : ""}" data-matrix-day="${d}" aria-pressed="${allDay ? "true" : "false"}" title="Tout ${escapeHtml(DAYS_FR[d] || "")}">${escapeHtml(dayShort)}</button>`
      );
    }
    MATRIX_MOMENTS.forEach((m) => {
      const allRow = [0, 1, 2, 3, 4, 5, 6].every((d) => selectedDaySlots.has(`${d}:${m.key}`));
      const someRow = !allRow && [0, 1, 2, 3, 4, 5, 6].some((d) => selectedDaySlots.has(`${d}:${m.key}`));
      htmlParts.push(
        `<button type="button" class="matrix-row-btn ${allRow ? "active" : someRow ? "partial" : ""}" data-matrix-bucket="${escapeHtml(m.key)}" aria-pressed="${allRow ? "true" : "false"}" title="Toute la semaine — ${escapeHtml(m.label)}">${escapeHtml(m.label)}</button>`
      );
      for (let d = 0; d < 7; d++) {
        const token = `${d}:${m.key}`;
        const active = selectedDaySlots.has(token);
        htmlParts.push(
          `<button type="button" class="matrix-cell-btn ${active ? "active" : ""}" data-day-slot="${token}" aria-pressed="${active ? "true" : "false"}" aria-label="${escapeHtml(DAYS_FR[d] || "")} ${escapeHtml(m.label)}" title="${escapeHtml(DAYS_FR[d] || "")} · ${escapeHtml(m.label)}">${active ? "✓" : ""}</button>`
        );
      }
    });
    htmlParts.push("</div>");
    const gridHtml = htmlParts.join("");

    ["desktop-day-slot-matrix", "mobile-day-slot-matrix"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = gridHtml;
    });
  }

  function toggleDaySlotCell(token) {
    if (!token) return;
    scheduleFilterMode = "matrix";
    selectedDays.clear();
    selectedTimeBuckets.clear();
    if (selectedDaySlots.has(token)) {
      selectedDaySlots.delete(token);
    } else {
      selectedDaySlots.add(token);
    }
    syncDayPillsUI();
    syncScheduleFilterUI();
    loadSlots();
  }

  function toggleDaySlotColumn(dayIdx) {
    const d = Number(dayIdx);
    if (!Number.isInteger(d) || d < 0 || d > 6) return;
    scheduleFilterMode = "matrix";
    selectedDays.clear();
    selectedTimeBuckets.clear();
    const allSelected = MATRIX_MOMENTS.every((m) => selectedDaySlots.has(`${d}:${m.key}`));
    MATRIX_MOMENTS.forEach((m) => {
      const tok = `${d}:${m.key}`;
      if (allSelected) selectedDaySlots.delete(tok);
      else selectedDaySlots.add(tok);
    });
    syncDayPillsUI();
    syncScheduleFilterUI();
    loadSlots();
  }

  function toggleDaySlotRow(bucketKey) {
    if (!bucketKey) return;
    scheduleFilterMode = "matrix";
    selectedDays.clear();
    selectedTimeBuckets.clear();
    const allSelected = [0, 1, 2, 3, 4, 5, 6].every((d) => selectedDaySlots.has(`${d}:${bucketKey}`));
    for (let d = 0; d < 7; d++) {
      const tok = `${d}:${bucketKey}`;
      if (allSelected) selectedDaySlots.delete(tok);
      else selectedDaySlots.add(tok);
    }
    syncDayPillsUI();
    syncScheduleFilterUI();
    loadSlots();
  }

  function syncScheduleFilterUI() {
    const isMatrix = scheduleFilterMode === "matrix";
    document.querySelectorAll("[data-schedule-mode]").forEach((btn) => {
      const active = btn.dataset.scheduleMode === scheduleFilterMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const toggle = (id, hide) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", hide);
    };
    toggle("when-simple-block", isMatrix);
    toggle("when-matrix-block", !isMatrix);
    toggle("acc-when-simple-block", isMatrix);
    toggle("acc-when-matrix-block", !isMatrix);

    document.querySelectorAll("[data-time-bucket]").forEach((btn) => {
      const b = btn.dataset.timeBucket || "";
      const active = selectedTimeBuckets.has(b);
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    document.querySelectorAll("[data-time-mode]").forEach((btn) => {
      const active = btn.dataset.timeMode === selectedTimeMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    document.querySelectorAll("[data-duration]").forEach((btn) => {
      const active = (btn.dataset.duration || "") === selectedDurationRange;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    renderDaySlotMatrices();
  }

  function populateDayPills() {
    ["day-pills", "acc-day-pills"].forEach((wrapId) => {
      const dayContainer = document.getElementById(wrapId);
      if (!dayContainer) return;
      dayContainer.innerHTML = "";
      DAYS_FR.forEach((label, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "day-pill";
        btn.dataset.day = String(idx);
        btn.textContent = label.slice(0, 3);
        btn.title = label;
        btn.addEventListener("click", () => {
          scheduleFilterMode = "simple";
          selectedDaySlots.clear();
          if (selectedDays.has(idx)) {
            selectedDays.delete(idx);
          } else {
            selectedDays.add(idx);
          }
          syncDayPillsUI();
          syncScheduleFilterUI();
          loadSlots();
        });
        dayContainer.appendChild(btn);
      });
    });
  }

  function syncDayPillsUI() {
    document.querySelectorAll("#day-pills .day-pill, #acc-day-pills .day-pill").forEach((btn) => {
      const d = Number(btn.dataset.day);
      btn.classList.toggle("active", selectedDays.has(d));
    });
  }

  /* ---- Bloc 3 : 3. Quoi & Où ? (Ruban icônes + Envies par profil + Sous-ruban disciplines) ---- */
  function isMyInterestsActive() {
    const ctx = getInterestsContextForExplore();
    if (ctx.categories.size === 0 || selectedCategories.size !== ctx.categories.size) return false;
    for (const c of ctx.categories) {
      if (!selectedCategories.has(c)) return false;
    }
    return true;
  }

  function populateCategoryChips() {
    const wrap = document.getElementById("category-chips");
    if (wrap) {
      wrap.innerHTML = "";

      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "filter-chip category-chip active";
      allBtn.dataset.category = "";
      allBtn.title = "Toutes catégories";
      allBtn.innerHTML = `<span class="cat-icon" aria-hidden="true">${getCategoryIcon("")}</span><span class="cat-label">Tout<span class="cat-count" data-cat-count=""></span></span>`;
      allBtn.addEventListener("click", () => {
        selectedCategories.clear();
        selectedDisciplines.clear();
        syncCategoryChipsUI();
        refreshDisciplineMultiselect();
        renderDisciplineDrilldown();
        loadSlots();
      });
      wrap.appendChild(allBtn);

      const interestCtx = getInterestsContextForExplore();
      if (interestCtx.categories.size > 0) {
        const enviesBtn = document.createElement("button");
        enviesBtn.type = "button";
        enviesBtn.className = "filter-chip category-chip is-interest-btn";
        enviesBtn.dataset.interestShortcut = "true";
        enviesBtn.title = `Filtrer sur : ${Array.from(interestCtx.categories).join(", ")}`;
        enviesBtn.innerHTML = `<span class="cat-icon" aria-hidden="true">💛</span><span class="cat-label">${escapeHtml(interestCtx.label)}</span>`;
        enviesBtn.addEventListener("click", () => {
          const freshCtx = getInterestsContextForExplore();
          if (isMyInterestsActive()) {
            selectedCategories.clear();
          } else {
            selectedCategories = new Set(freshCtx.categories);
          }
          selectedDisciplines.clear();
          syncCategoryChipsUI();
          refreshDisciplineMultiselect();
          renderDisciplineDrilldown();
          loadSlots();
        });
        wrap.appendChild(enviesBtn);
      }

      (meta.categories || []).forEach((cat) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-chip category-chip";
        btn.dataset.category = cat;
        btn.title = cat;
        btn.innerHTML = `<span class="cat-icon" aria-hidden="true">${getCategoryIcon(cat)}</span><span class="cat-label">${escapeHtml(getCategoryShortLabel(cat))}<span class="cat-count" data-cat-count="${escapeHtml(cat)}"></span></span>`;
        btn.addEventListener("click", () => {
          if (selectedCategories.has(cat)) {
            selectedCategories.delete(cat);
          } else {
            selectedCategories.add(cat);
          }
          syncCategoryChipsUI();
          refreshDisciplineMultiselect();
          renderDisciplineDrilldown();
          loadSlots();
        });
        wrap.appendChild(btn);
      });
    }

    // Panneau unifié #popover-opts & rétrocompatibilité #acc-category-pills
    ["opts-category-pills", "acc-category-pills"].forEach((wrapId) => {
      const catWrap = document.getElementById(wrapId);
      if (!catWrap) return;
      catWrap.innerHTML = "";
      if (wrapId === "opts-category-pills") {
        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = "filter-chip";
        allBtn.dataset.category = "";
        allBtn.textContent = "Toutes";
        allBtn.addEventListener("click", () => {
          selectedCategories.clear();
          selectedDisciplines.clear();
          syncCategoryChipsUI();
          refreshDisciplineMultiselect();
          renderDisciplineDrilldown();
          loadSlots();
        });
        catWrap.appendChild(allBtn);
      }
      (meta.categories || []).forEach((cat) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-chip";
        btn.dataset.category = cat;
        btn.innerHTML = `${getCategoryIcon(cat)} ${escapeHtml(getCategoryShortLabel(cat))}`;
        btn.addEventListener("click", () => {
          if (selectedCategories.has(cat)) {
            selectedCategories.delete(cat);
          } else {
            selectedCategories.add(cat);
          }
          syncCategoryChipsUI();
          refreshDisciplineMultiselect();
          renderDisciplineDrilldown();
          loadSlots();
        });
        catWrap.appendChild(btn);
      });
    });

    syncCategoryChipsUI();
    updateCategoryRibbonCounts();
    renderDisciplineDrilldown();
  }

  function syncCategoryChipsUI() {
    const myInterestsOn = isMyInterestsActive();
    document.querySelectorAll("#category-chips .filter-chip").forEach((btn) => {
      if (btn.dataset.interestShortcut === "true") {
        btn.classList.toggle("active", myInterestsOn);
        return;
      }
      const cat = btn.dataset.category || "";
      if (cat === "") {
        btn.classList.toggle("active", selectedCategories.size === 0);
      } else {
        btn.classList.toggle("active", selectedCategories.has(cat));
      }
    });
    document.querySelectorAll("#opts-category-pills .filter-chip, #acc-category-pills .filter-chip").forEach((btn) => {
      const cat = btn.dataset.category || "";
      if (cat === "") {
        btn.classList.toggle("active", selectedCategories.size === 0);
      } else {
        btn.classList.toggle("active", selectedCategories.has(cat));
      }
    });
  }

  function updateCategoryRibbonCounts(itemsForCounts) {
    if (Array.isArray(itemsForCounts)) {
      const nextMap = new Map();
      nextMap.set("", itemsForCounts.length);
      itemsForCounts.forEach((it) => {
        const c = it.category || "";
        if (c) nextMap.set(c, (nextMap.get(c) || 0) + 1);
      });
      categoryCountsMap = nextMap;
    }
    if (!categoryCountsMap.size) return;
    document.querySelectorAll("#category-chips .filter-chip[data-category]").forEach((btn) => {
      const cat = btn.dataset.category || "";
      const cnt = categoryCountsMap.get(cat);
      const countEl = btn.querySelector(".cat-count");
      if (countEl && cnt !== undefined) {
        countEl.textContent = ` (${cnt})`;
      }
      btn.classList.toggle("is-empty", cat !== "" && cnt === 0);
    });
  }

  function renderDisciplineDrilldown() {
    const wrap = document.getElementById("discipline-drilldown");
    if (!wrap) return;

    if (exploreWhenMode === "camp") {
      const periodsFromMeta =
        meta && Array.isArray(meta.holiday_periods) && meta.holiday_periods.length
          ? meta.holiday_periods.filter((p) => p !== "Toutes vacances")
          : DEFAULT_HOLIDAY_PERIODS;
      wrap.classList.remove("hidden");
      wrap.innerHTML = `<span class="discipline-drilldown-label">Vacances :</span>`;

      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = `discipline-subchip ${selectedCampPeriods.size === 0 ? "active" : ""}`;
      allBtn.textContent = "Toutes vacances";
      allBtn.addEventListener("click", () => {
        selectedCampPeriods.clear();
        syncWhenCampPeriodPillsUI();
        renderDisciplineDrilldown();
        loadSlots();
      });
      wrap.appendChild(allBtn);

      periodsFromMeta.forEach((p) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `discipline-subchip ${selectedCampPeriods.has(p) ? "active" : ""}`;
        btn.textContent = p;
        btn.addEventListener("click", () => {
          if (selectedCampPeriods.has(p)) {
            selectedCampPeriods.delete(p);
          } else {
            selectedCampPeriods.add(p);
          }
          syncWhenCampPeriodPillsUI();
          renderDisciplineDrilldown();
          loadSlots();
        });
        wrap.appendChild(btn);
      });
      return;
    }

    if (selectedCategories.size === 0) {
      wrap.classList.add("hidden");
      wrap.innerHTML = "";
      return;
    }
    const available = getAvailableDisciplines();
    if (!available.length) {
      wrap.classList.add("hidden");
      wrap.innerHTML = "";
      return;
    }
    wrap.classList.remove("hidden");
    wrap.innerHTML = `<span class="discipline-drilldown-label">Préciser :</span>`;

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = `discipline-subchip ${selectedDisciplines.size === 0 ? "active" : ""}`;
    allBtn.textContent = "Toutes";
    allBtn.addEventListener("click", () => {
      selectedDisciplines.clear();
      renderDisciplineOptions();
      renderDisciplineDrilldown();
      loadSlots();
    });
    wrap.appendChild(allBtn);

    available.forEach((disc) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `discipline-subchip ${selectedDisciplines.has(disc) ? "active" : ""}`;
      btn.textContent = disc;
      btn.addEventListener("click", () => {
        if (selectedDisciplines.has(disc)) {
          selectedDisciplines.delete(disc);
        } else {
          selectedDisciplines.add(disc);
        }
        renderDisciplineOptions();
        renderDisciplineDrilldown();
        loadSlots();
      });
      wrap.appendChild(btn);
    });
  }

  function populateBudgetPills() {
    const wrap = document.getElementById("budget-pills");
    if (!wrap) return;
    const options = [
      { val: null, label: "Tous budgets" },
      { val: 150, label: "≤ 150 €" },
      { val: 250, label: "≤ 250 €" },
      { val: 400, label: "≤ 400 €" },
    ];
    wrap.innerHTML = "";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-chip ${selectedBudgetMax === opt.val ? "active" : ""}`;
      btn.dataset.budget = opt.val === null ? "" : String(opt.val);
      btn.textContent = opt.label;
      btn.addEventListener("click", () => {
        selectedBudgetMax = opt.val;
        syncBudgetPillsUI();
        loadSlots();
      });
      wrap.appendChild(btn);
    });
  }

  function syncBudgetPillsUI() {
    document.querySelectorAll("#budget-pills .filter-chip").forEach((btn) => {
      const v = btn.dataset.budget === "" ? null : Number(btn.dataset.budget);
      btn.classList.toggle("active", selectedBudgetMax === v);
    });
  }

  function populateWhenCampPeriodPills() {
    const periods = (meta && meta.holiday_periods && meta.holiday_periods.length)
      ? meta.holiday_periods.filter((p) => p !== "Toutes vacances")
      : DEFAULT_HOLIDAY_PERIODS;
    ["when-camp-period-pills", "opts-camp-period-pills", "acc-camp-period-pills"].forEach((wrapId) => {
      const wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.innerHTML = "";

      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "filter-chip active";
      allBtn.dataset.whenPeriod = "";
      allBtn.textContent = "Toutes vacances";
      allBtn.addEventListener("click", () => {
        selectedCampPeriods.clear();
        syncWhenCampPeriodPillsUI();
        loadSlots();
      });
      wrap.appendChild(allBtn);

      periods.forEach((p) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-chip";
        btn.dataset.whenPeriod = p;
        btn.textContent = p;
        btn.addEventListener("click", () => {
          if (selectedCampPeriods.has(p)) {
            selectedCampPeriods.delete(p);
          } else {
            selectedCampPeriods.add(p);
          }
          syncWhenCampPeriodPillsUI();
          loadSlots();
        });
        wrap.appendChild(btn);
      });
    });
    syncWhenCampPeriodPillsUI();
  }

  function syncWhenCampPeriodPillsUI() {
    document.querySelectorAll("#when-camp-period-pills .filter-chip, #opts-camp-period-pills .filter-chip, #acc-camp-period-pills .filter-chip").forEach((btn) => {
      const p = btn.dataset.whenPeriod || "";
      if (p === "") {
        btn.classList.toggle("active", selectedCampPeriods.size === 0);
      } else {
        btn.classList.toggle("active", selectedCampPeriods.has(p));
      }
    });
    if (exploreWhenMode === "camp") {
      renderDisciplineDrilldown();
    }
  }

  function syncWhenModeUI() {
    const isCamp = exploreWhenMode === "camp";
    document.querySelectorAll("[data-when-mode]").forEach((btn) => {
      const active = btn.dataset.whenMode === exploreWhenMode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const toggle = (id, hide) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", hide);
    };
    toggle("when-yearly-block", isCamp);
    toggle("when-camp-block", !isCamp);
    toggle("opts-camp-block", !isCamp);
    toggle("acc-when-yearly-block", isCamp);
    toggle("acc-when-camp-block", !isCamp);

    if (currentMode === "simple") {
      toggle("results-simple", isCamp);
      toggle("results-camps", !isCamp);
      toggle("view-switcher", isCamp);
    }
    renderDisciplineDrilldown();
    updateMobileViewToggle();
    syncGroupingToggleUI();
  }

  function setExploreWhenMode(mode, { reload = true } = {}) {
    const nextMode = mode === "camp" ? "camp" : "yearly";
    if (exploreWhenMode !== nextMode && window.AssoNative) {
      window.AssoNative.triggerHaptic("selection");
    }
    exploreWhenMode = nextMode;
    syncWhenModeUI();
    if (reload) {
      loadSlots();
    }
  }

  /* ---- Parcours de premier accès « Apprenons à nous connaître » (V2 scalable + par profil) ---- */
  function getMemberAvatar(m) {
    const g = String((m && m.grade) || "").toUpperCase();
    if (g === "SENIOR") return "🧓";
    if (g === "ADULTE") return "🧑";
    if (g === "PS" || g === "MS" || g === "GS") return "👶";
    if (g === "CP" || g === "CE1" || g === "CE2" || g === "CM1" || g === "CM2") return "🧒";
    if (g === "6E" || g === "5E" || g === "4E" || g === "3E") return "🎒";
    if (g === "2DE" || g === "1ERE" || g === "TLE" || g === "TERM") return "🎓";
    const age = Number(m && m.age);
    if (Number.isFinite(age) && age > 0) {
      if (age >= 60) return "🧓";
      if (age >= 18) return "🧑";
      if (age <= 5) return "👶";
      if (age <= 10) return "🧒";
      if (age <= 14) return "🎒";
      return "🎓";
    }
    return "🧒";
  }

  function openOnboardingModal(startStep = 1) {
    onboardingStep = startStep;
    activeObInterestProfile = "all";
    const backdrop = document.getElementById("onboarding-modal-backdrop");
    if (!backdrop) return;
    const searchInput = document.getElementById("ob-city-search");
    if (searchInput) searchInput.value = "";
    renderOnboardingTerritoryCards();
    renderOnboardingFamilyCards();
    renderOnboardingInterestsGrid();
    renderOnboardingStep();
    if (window.AssoSheets) {
      window.AssoSheets.open("onboarding");
    } else {
      backdrop.classList.remove("hidden", "sheet-hidden");
      backdrop.classList.add("is-open");
      syncBodyModalClass();
    }
  }

  function closeOnboardingModal(markDone = true) {
    if (markDone && !localStorage.getItem(FAMILY_SETUP_DONE_KEY)) {
      localStorage.setItem(FAMILY_SETUP_DONE_KEY, "dismissed");
    }
    if (window.AssoSheets) {
      if (window.AssoSheets.isOpen("onboarding")) {
        window.AssoSheets.close("onboarding");
      }
    } else {
      const backdrop = document.getElementById("onboarding-modal-backdrop");
      if (backdrop) {
        backdrop.classList.remove("is-open");
        backdrop.classList.add("hidden", "sheet-hidden");
      }
      syncBodyModalClass();
    }
  }

  function renderOnboardingStep() {
    document.querySelectorAll(".onboarding-step[data-ob-step]").forEach((sec) => {
      sec.classList.toggle("hidden", Number(sec.dataset.obStep) !== onboardingStep);
    });
    document.querySelectorAll(".onboarding-dot[data-ob-dot]").forEach((dot) => {
      const n = Number(dot.dataset.obDot);
      dot.classList.toggle("active", n === onboardingStep);
      dot.classList.toggle("done", n < onboardingStep);
      dot.setAttribute("aria-current", n === onboardingStep ? "step" : "false");
    });
    const lbl = document.getElementById("onboarding-step-label");
    if (lbl) lbl.textContent = `Étape ${onboardingStep} / 3`;
    const prevBtn = document.getElementById("onboarding-prev-btn");
    const nextBtn = document.getElementById("onboarding-next-btn");
    const finBtn = document.getElementById("onboarding-finish-btn");
    if (prevBtn) prevBtn.classList.toggle("hidden", onboardingStep <= 1);
    if (nextBtn) nextBtn.classList.toggle("hidden", onboardingStep >= 3);
    if (finBtn) finBtn.classList.toggle("hidden", onboardingStep < 3);
    if (onboardingStep === 2) {
      renderOnboardingFamilyCards();
    } else if (onboardingStep === 3) {
      renderOnboardingInterestsGrid();
    }
    const obBody = document.querySelector("#onboarding-modal-backdrop .onboarding-body");
    if (obBody) obBody.scrollTop = 0;
  }

  function renderOnboardingTerritoryCards() {
    const wrap = document.getElementById("onboarding-territory-cards");
    const selBar = document.getElementById("ob-selected-cities-bar");
    if (!wrap || !meta) return;

    const cities = meta.cities || [];
    const cityMap = new Map(cities.map((c) => [c.slug, c]));

    // Zone des villes actuellement cochées (pilules supprimables)
    if (selBar) {
      selBar.innerHTML = "";
      if (selectedCities.size === 0) {
        selBar.innerHTML = `<span class="muted" style="font-size:0.78rem;">Toutes les villes par défaut — cochez une ou plusieurs villes ci-dessous pour cibler.</span>`;
      } else {
        selectedCities.forEach((slug) => {
          const c = cityMap.get(slug);
          const tag = document.createElement("span");
          tag.className = "active-filter-tag";
          tag.innerHTML = `📍 ${escapeHtml(c ? c.name : slug)} <button type="button" aria-label="Retirer">×</button>`;
          tag.querySelector("button").addEventListener("click", () => {
            selectedCities.delete(slug);
            onSelectedCitiesChanged({ reload: false });
            renderOnboardingTerritoryCards();
          });
          selBar.appendChild(tag);
        });
        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "ob-city-group-toggle";
        clearBtn.textContent = "Tout effacer";
        clearBtn.addEventListener("click", () => {
          selectedCities.clear();
          onSelectedCitiesChanged({ reload: false });
          renderOnboardingTerritoryCards();
        });
        selBar.appendChild(clearBtn);
      }
    }

    // Filtrage instantané par nom, CP ou département (scalable à 100+ villes)
    const qRaw = (document.getElementById("ob-city-search") || {}).value || "";
    const qNorm = normalizeText(qRaw.trim());

    const groupsMap = new Map();
    cities.forEach((c) => {
      const dept = String(c.department || (c.postal_code || "").slice(0, 2) || "Autre");
      const deptLabel = DEPT_LABELS[dept] || `Département ${dept}`;
      if (qNorm) {
        const hay = normalizeText(`${c.name} ${c.postal_code || ""} ${dept} ${deptLabel}`);
        if (!hay.includes(qNorm)) return;
      }
      if (!groupsMap.has(dept)) {
        groupsMap.set(dept, { dept, label: deptLabel, cities: [] });
      }
      groupsMap.get(dept).cities.push(c);
    });

    wrap.innerHTML = "";
    if (groupsMap.size === 0) {
      wrap.innerHTML = `<div class="muted" style="font-size:0.82rem; padding:0.6rem;">Aucune ville trouvée pour « ${escapeHtml(qRaw)} ».</div>`;
      return;
    }

    Array.from(groupsMap.values())
      .sort((a, b) => a.label.localeCompare(b.label, "fr"))
      .forEach((grp) => {
        const allSelected = grp.cities.every((c) => selectedCities.has(c.slug));
        const box = document.createElement("div");
        box.className = "ob-city-group";

        const head = document.createElement("div");
        head.className = "ob-city-group-head";
        head.innerHTML = `<span class="ob-city-group-title">${escapeHtml(grp.label)}</span>`;
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "ob-city-group-toggle";
        toggleBtn.textContent = allSelected ? "Tout décocher" : "Tout sélectionner";
        toggleBtn.addEventListener("click", () => {
          grp.cities.forEach((c) => {
            if (allSelected) selectedCities.delete(c.slug);
            else selectedCities.add(c.slug);
          });
          onSelectedCitiesChanged({ reload: false });
          renderOnboardingTerritoryCards();
        });
        head.appendChild(toggleBtn);
        box.appendChild(head);

        const pillsWrap = document.createElement("div");
        pillsWrap.className = "chip-row";
        grp.cities.forEach((c) => {
          const active = selectedCities.has(c.slug);
          const pill = document.createElement("button");
          pill.type = "button";
          pill.className = `ob-city-pill ${active ? "active" : ""}`;
          pill.innerHTML = `${active ? "✓ " : ""}${escapeHtml(c.name)} <span class="ob-city-cp">${escapeHtml(c.postal_code || "")}</span>`;
          pill.addEventListener("click", () => {
            if (selectedCities.has(c.slug)) selectedCities.delete(c.slug);
            else selectedCities.add(c.slug);
            onSelectedCitiesChanged({ reload: false });
            renderOnboardingTerritoryCards();
          });
          pillsWrap.appendChild(pill);
        });
        box.appendChild(pillsWrap);
        wrap.appendChild(box);
      });
  }

  function renderOnboardingFamilyCards() {
    const wrap = document.getElementById("onboarding-family-rows");
    if (!wrap) return;
    wrap.innerHTML = "";
    const grades = (meta && meta.grades) || [];

    familyProfile.forEach((m, idx) => {
      const card = document.createElement("div");
      card.className = "ob-member-card";
      card.style.borderLeftColor = m.color || PLANNER_COLOR_PALETTE[idx % PLANNER_COLOR_PALETTE.length];

      const gradeOptions = [
        `<option value="">Choisir une classe…</option>`,
        ...grades.map(
          (g) =>
            `<option value="${escapeHtml(g.code)}" ${String(m.grade || "") === String(g.code) ? "selected" : ""}>${escapeHtml(g.label)}</option>`
        ),
      ].join("");

      card.innerHTML = `
        <div class="ob-member-top">
          <span class="ob-member-avatar" aria-hidden="true">${getMemberAvatar(m)}</span>
          <button type="button" class="ob-member-color-btn" style="background:${escapeHtml(m.color)};" title="Changer la couleur"></button>
          <input type="text" class="ob-member-name-input" value="${escapeHtml(m.name)}" placeholder="Prénom (ex : Léo, Maman…)" maxlength="30" />
          ${
            familyProfile.length > 1
              ? `<button type="button" class="ob-member-remove-btn" title="Retirer ce membre">✕ Retirer</button>`
              : ""
          }
        </div>
        <div class="ob-member-fields">
          <div>
            <label>Classe / Profil</label>
            <select class="ob-member-grade">${gradeOptions}</select>
          </div>
          <div>
            <label>Ou âge exact</label>
            <input type="number" class="ob-member-age" min="1" max="99" value="${escapeHtml(m.age || "")}" placeholder="Ex : 8" />
          </div>
        </div>
      `;

      const avatarEl = card.querySelector(".ob-member-avatar");
      card.querySelector(".ob-member-color-btn").addEventListener("click", () => {
        const curIdx = PLANNER_COLOR_PALETTE.indexOf(familyProfile[idx].color);
        const nextColor = PLANNER_COLOR_PALETTE[(curIdx + 1) % PLANNER_COLOR_PALETTE.length];
        familyProfile[idx].color = nextColor;
        renderOnboardingFamilyCards();
      });
      card.querySelector(".ob-member-name-input").addEventListener("input", (e) => {
        familyProfile[idx].name = e.target.value;
      });
      const gradeSel = card.querySelector(".ob-member-grade");
      const ageInp = card.querySelector(".ob-member-age");
      gradeSel.addEventListener("change", (e) => {
        familyProfile[idx].grade = e.target.value;
        if (e.target.value) {
          familyProfile[idx].age = "";
          ageInp.value = "";
        }
        avatarEl.textContent = getMemberAvatar(familyProfile[idx]);
      });
      ageInp.addEventListener("input", (e) => {
        familyProfile[idx].age = e.target.value;
        if (e.target.value.trim()) {
          familyProfile[idx].grade = "";
          gradeSel.value = "";
        }
        avatarEl.textContent = getMemberAvatar(familyProfile[idx]);
      });
      const remBtn = card.querySelector(".ob-member-remove-btn");
      if (remBtn) {
        remBtn.addEventListener("click", () => {
          if (familyProfile.length <= 1) return;
          const removedId = familyProfile[idx].id;
          familyProfile.splice(idx, 1);
          if (activeObInterestProfile === removedId) activeObInterestProfile = "all";
          if (activeProfileInterestProfile === removedId) activeProfileInterestProfile = "all";
          renderOnboardingFamilyCards();
          renderProfileFamilyRows();
        });
      }
      wrap.appendChild(card);
    });
  }

  function renderInterestsUIFor(tabsWrapId, gridWrapId, activeProfileId, setActiveProfileFn, hintElId) {
    const tabsWrap = document.getElementById(tabsWrapId);
    const gridWrap = document.getElementById(gridWrapId);
    if (!gridWrap || !meta) return;

    // S'assurer que le profil actif existe toujours
    const validIds = new Set(["all", ...familyProfile.map((m) => m.id)]);
    if (!validIds.has(activeProfileId)) {
      activeProfileId = "all";
      setActiveProfileFn("all");
    }

    if (tabsWrap) {
      tabsWrap.innerHTML = "";
      const tabs = [
        { id: "all", label: "🏠 Tout le foyer", color: null },
        ...familyProfile.map((m) => ({
          id: m.id,
          label: String(m.name || "").trim() || "Membre",
          color: m.color,
        })),
      ];
      tabs.forEach((t) => {
        const cnt = getProfileInterestsSet(t.id).size;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `ob-profile-tab ${activeProfileId === t.id ? "active" : ""}`;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", activeProfileId === t.id ? "true" : "false");
        btn.innerHTML = `${
          t.color ? `<span class="family-dot" style="background:${escapeHtml(t.color)};"></span>` : ""
        }<span>${escapeHtml(t.label)}</span>${cnt > 0 ? `<span class="ob-profile-tab-count">${cnt}</span>` : ""}`;
        btn.addEventListener("click", () => {
          setActiveProfileFn(t.id);
          renderOnboardingInterestsGrid();
          renderProfileInterestsGrid();
        });
        tabsWrap.appendChild(btn);
      });
    }

    if (hintElId) {
      const hintEl = document.getElementById(hintElId);
      if (hintEl) {
        if (activeProfileId === "all") {
          hintEl.textContent = "Ces envies s'appliquent par défaut au foyer. Cliquez sur un prénom ci-dessus pour personnaliser chacun.";
        } else {
          const m = familyProfile.find((x) => x.id === activeProfileId);
          const mName = (m && m.name) || "ce membre";
          hintEl.textContent = `Envies spécifiques de ${mName} — le bouton « 💛 Envies de ${mName} » s'affichera dès que vous filtrerez pour ${mName}.`;
        }
      }
    }

    const activeSet = getProfileInterestsSet(activeProfileId);
    gridWrap.innerHTML = "";
    (meta.categories || []).forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `onboarding-interest-card ${activeSet.has(cat) ? "active" : ""}`;
      btn.innerHTML = `<span class="onboarding-interest-icon" aria-hidden="true">${getCategoryIcon(cat)}</span><span>${escapeHtml(getCategoryShortLabel(cat))}</span>`;
      btn.addEventListener("click", () => {
        toggleProfileInterest(activeProfileId, cat);
        renderOnboardingInterestsGrid();
        renderProfileInterestsGrid();
        populateCategoryChips();
      });
      gridWrap.appendChild(btn);
    });
  }

  function renderOnboardingInterestsGrid() {
    renderInterestsUIFor(
      "ob-interests-profile-tabs",
      "onboarding-interests-grid",
      activeObInterestProfile,
      (id) => {
        activeObInterestProfile = id;
      },
      "ob-interests-hint"
    );
  }

  function renderProfileInterestsGrid() {
    renderInterestsUIFor(
      "profile-interests-tabs",
      "profile-interests-pills",
      activeProfileInterestProfile,
      (id) => {
        activeProfileInterestProfile = id;
      },
      null
    );
  }

  function finishOnboarding() {
    saveInterestsByProfile();
    persistFamilyProfileChanges("Bienvenue ! Votre foyer et vos envies sont enregistrés.");
    populateCategoryChips();
    closeOnboardingModal(true);
    loadSlots();
  }

  function getAvailableDisciplines() {
    if (!meta) return [];
    if (selectedCategories.size === 0) {
      return [...(meta.disciplines || [])].sort((a, b) => a.localeCompare(b, "fr"));
    }
    const union = new Set();
    const byCat = meta.disciplines_by_category || {};
    selectedCategories.forEach((cat) => {
      (byCat[cat] || []).forEach((d) => union.add(d));
    });
    return Array.from(union).sort((a, b) => a.localeCompare(b, "fr"));
  }

  function refreshDisciplineMultiselect() {
    const available = getAvailableDisciplines();
    const availableSet = new Set(available);
    Array.from(selectedDisciplines).forEach((d) => {
      if (!availableSet.has(d)) selectedDisciplines.delete(d);
    });
    renderDisciplineOptions();
  }

  function renderDisciplineOptions() {
    const optionsWrap = document.getElementById("discipline-options");
    if (!optionsWrap) return;
    const searchInput = document.getElementById("discipline-search");
    const searchVal = normalizeText(searchInput ? searchInput.value.trim() : "");
    const clearBtn = document.getElementById("discipline-clear-btn");
    const available = getAvailableDisciplines();
    const filtered = searchVal
      ? available.filter((d) => normalizeText(d).includes(searchVal))
      : available;

    if (clearBtn) clearBtn.classList.toggle("hidden", selectedDisciplines.size === 0);
    optionsWrap.innerHTML = "";

    if (!filtered.length) {
      optionsWrap.innerHTML = `<div class="multiselect-empty muted">Aucune activité correspondante</div>`;
      return;
    }

    filtered.forEach((disc) => {
      const checked = selectedDisciplines.has(disc);
      const label = document.createElement("label");
      label.className = `multiselect-option ${checked ? "selected" : ""}`;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = disc;
      cb.checked = checked;
      cb.addEventListener("change", () => {
        if (cb.checked) {
          selectedDisciplines.add(disc);
        } else {
          selectedDisciplines.delete(disc);
        }
        label.classList.toggle("selected", cb.checked);
        if (clearBtn) clearBtn.classList.toggle("hidden", selectedDisciplines.size === 0);
        renderDisciplineDrilldown();
        loadSlots();
      });

      const vis = getDisciplineVisual(disc, "");
      const text = document.createElement("span");
      text.textContent = `${vis.icon} ${disc}`;

      label.appendChild(cb);
      label.appendChild(text);
      optionsWrap.appendChild(label);
    });
  }

  function isMobileViewport() {
    return window.innerWidth <= 768;
  }

  function syncOptsTriggersExpanded(expanded) {
    const val = expanded ? "true" : "false";
    const optsTrigger = document.querySelector('[data-popover-btn="opts"]');
    if (optsTrigger) {
      optsTrigger.setAttribute("aria-expanded", val);
      optsTrigger.classList.toggle("open", expanded);
    }
    const mobileFiltersBtn = document.getElementById("mobile-open-filters-btn");
    if (mobileFiltersBtn) {
      mobileFiltersBtn.setAttribute("aria-expanded", val);
      mobileFiltersBtn.classList.toggle("open", expanded);
    }
  }

  function syncMobileSheetBackdrop(isOpen) {
    const backdrop = document.getElementById("mobile-sheet-backdrop");
    const optsEl = document.getElementById("popover-opts");
    if (
      window.AssoSheets &&
      backdrop &&
      (window.AssoSheets.isOpen("opts") ||
        backdrop.classList.contains("is-open") ||
        (optsEl && !optsEl.classList.contains("sheet-hidden") && isMobileViewport()))
    ) {
      return;
    }
    const show = Boolean(isOpen && isMobileViewport());
    if (backdrop) {
      backdrop.classList.toggle("hidden", !show);
      backdrop.classList.toggle("sheet-hidden", !show);
      backdrop.setAttribute("aria-hidden", show ? "false" : "true");
    }
    document.body.classList.toggle("sheet-open", show);
  }

  function updatePopoverResultCtas(count) {
    const n = Number.isFinite(Number(count)) ? Number(count) : 0;
    const label = isMobileViewport()
      ? `Voir ${n} résultat${n > 1 ? "s" : ""}`
      : `OK (${n})`;
    ["popover-who", "popover-when", "popover-where", "popover-opts"].forEach((id) => {
      const panel = document.getElementById(id);
      if (!panel) return;
      panel.querySelectorAll("[data-close-popover]").forEach((btn) => {
        btn.textContent = label;
      });
    });
    updateSearchApplyCta(n);
  }

  function closeAllPopovers() {
    document.querySelectorAll(".capsule-popover").forEach((p) => {
      if (p.id === "popover-opts" && window.AssoSheets) return;
      p.classList.add("hidden");
    });
    if (window.AssoSheets && window.AssoSheets.isOpen("opts")) {
      window.AssoSheets.close("opts");
    }
    document.querySelectorAll("[data-popover-btn]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
      btn.classList.remove("open");
    });
    syncOptsTriggersExpanded(false);
    syncMobileSheetBackdrop(false);
  }

  function togglePopover(name) {
    const panel = document.getElementById(`popover-${name}`);
    const trigger = document.querySelector(`[data-popover-btn="${name}"]`);
    if (!panel) return;
    const wasOpen =
      name === "opts" && window.AssoSheets
        ? window.AssoSheets.isOpen("opts")
        : !panel.classList.contains("hidden");
    closeAllPopovers();
    if (!wasOpen) {
      if (name === "what" || name === "opts") {
        renderDisciplineOptions();
      }
      if (name === "opts" && window.AssoSheets) {
        syncOptsTriggersExpanded(true);
        window.AssoSheets.open("opts");
        return;
      }
      panel.classList.remove("hidden");
      if (trigger) {
        trigger.setAttribute("aria-expanded", "true");
        trigger.classList.add("open");
      }
      if (name === "opts") {
        syncOptsTriggersExpanded(true);
      }
      syncMobileSheetBackdrop(true);
    }
  }

  function populateCityPills() {
    ["city-pills", "acc-city-pills", "profile-city-pills"].forEach((wrapId) => {
      const wrap = document.getElementById(wrapId);
      if (!wrap) return;
      wrap.innerHTML = "";

      const allBtn = document.createElement("button");
      allBtn.type = "button";
      allBtn.className = "filter-chip active";
      allBtn.dataset.city = "";
      allBtn.textContent = "Toutes";
      allBtn.addEventListener("click", () => {
        selectedCities.clear();
        onSelectedCitiesChanged({ reload: true });
      });
      wrap.appendChild(allBtn);

      (meta.cities || []).forEach((c) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "filter-chip";
        btn.dataset.city = c.slug;
        btn.textContent = c.name;
        btn.title = `${c.name} (${c.postal_code})`;
        btn.addEventListener("click", () => {
          if (selectedCities.has(c.slug)) {
            selectedCities.delete(c.slug);
          } else {
            selectedCities.add(c.slug);
          }
          onSelectedCitiesChanged({ reload: true });
        });
        wrap.appendChild(btn);
      });
    });
  }

  function syncCityPillsUI() {
    document.querySelectorAll("#city-pills .filter-chip, #acc-city-pills .filter-chip, #profile-city-pills .filter-chip").forEach((btn) => {
      const slug = btn.dataset.city || "";
      if (slug === "") {
        btn.classList.toggle("active", selectedCities.size === 0);
      } else {
        btn.classList.toggle("active", selectedCities.has(slug));
      }
    });
  }

  function populateStructureTypePills() {
    const wrap = document.getElementById("structure-type-pills");
    wrap.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "filter-chip active";
    allBtn.dataset.structureType = "";
    allBtn.textContent = "Toutes";
    allBtn.addEventListener("click", () => {
      selectedStructureTypes.clear();
      syncStructureTypePillsUI();
      loadSlots();
    });
    wrap.appendChild(allBtn);

    (meta.structure_types || []).forEach((st) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.dataset.structureType = st.code;
      btn.textContent = st.label;
      btn.addEventListener("click", () => {
        if (selectedStructureTypes.has(st.code)) {
          selectedStructureTypes.delete(st.code);
        } else {
          selectedStructureTypes.add(st.code);
        }
        syncStructureTypePillsUI();
        loadSlots();
      });
      wrap.appendChild(btn);
    });
  }

  function syncStructureTypePillsUI() {
    document.querySelectorAll("#structure-type-pills .filter-chip").forEach((btn) => {
      const code = btn.dataset.structureType || "";
      if (code === "") {
        btn.classList.toggle("active", selectedStructureTypes.size === 0);
      } else {
        btn.classList.toggle("active", selectedStructureTypes.has(code));
      }
    });
  }

  function populateFilters() {
    ["filter-grade", "acc-grade"].forEach((selId) => {
      const gradeSel = document.getElementById(selId);
      if (!gradeSel) return;
      gradeSel.innerHTML = `<option value="">Classe précise…</option>`;
      (meta.grades || []).forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.code;
        opt.textContent = g.label;
        gradeSel.appendChild(opt);
      });
    });

    populateAudiencePills();
    populateTimeSelects();
    populateDayPills();
    syncScheduleFilterUI();
    populateWhenCampPeriodPills();
    populateCategoryChips();
    refreshDisciplineMultiselect();
    populateCityPills();
    populateBudgetPills();
    populateStructureTypePills();
    renderPlannerSwatches();
    populateCampsFilters();
  }

  function bindEvents() {
    const debouncedLoadSlots = debounce(() => loadSlots(), 180);
    const debouncedLoadCamps = debounce(() => loadCamps(), 180);
    const debouncedRenderObCities = debounce(() => renderOnboardingTerritoryCards(), 80);

    if (window.AssoSheets && typeof window.AssoSheets.register === "function") {
      window.AssoSheets.register("onboarding", {
        container: "#onboarding-modal-backdrop",
        sheet: ".onboarding-sheet",
        scrim: "[data-sheet-scrim]",
        onAfterClose: () => {
          if (!localStorage.getItem(FAMILY_SETUP_DONE_KEY)) {
            localStorage.setItem(FAMILY_SETUP_DONE_KEY, "dismissed");
          }
        },
        onSwipeLeft: () => {
          if (onboardingStep < 3) {
            onboardingStep += 1;
            renderOnboardingStep();
          }
        },
        onSwipeRight: () => {
          if (onboardingStep > 1) {
            onboardingStep -= 1;
            renderOnboardingStep();
          }
        },
      });
      window.AssoSheets.register("detail", {
        container: "#detail-modal-backdrop",
        sheet: ".detail-modal-sheet",
        scrim: "[data-sheet-scrim]",
        onAfterClose: () => {
          currentDetailContext = null;
        },
      });
      window.AssoSheets.register("opts", {
        container: "#popover-opts",
        sheet: "#popover-opts",
        scrim: "#mobile-sheet-backdrop",
        mobileOnly: true,
        onBeforeOpen: () => {
          syncOptsTriggersExpanded(true);
          syncAccWhoInputsFromMain();
          syncAccWhenInputsFromMain();
          syncCategoryChipsUI();
          syncWhereTerritoryPillsUI();
          syncCityPillsUI();
          syncAudiencePillsUI();
          renderFamilyWhoPills();
          syncDayPillsUI();
          syncScheduleFilterUI();
          syncWhenCampPeriodPillsUI();
          renderDisciplineOptions();
        },
        onAfterClose: () => {
          syncOptsTriggersExpanded(false);
        },
      });
      window.AssoSheets.register("report", {
        container: "#report-modal-backdrop",
        sheet: ".modal",
        scrim: "[data-sheet-scrim]",
      });
    }

    if (window.AssoOverlay && typeof window.AssoOverlay.setBackFallback === "function") {
      window.AssoOverlay.setBackFallback(() => {
        const fBack = document.getElementById("fav-drawer-backdrop");
        if (fBack && fBack.classList.contains("open")) {
          fBack.classList.remove("open");
          return;
        }
        const quickBanner = document.getElementById("family-quickstart-banner");
        if (quickBanner && !quickBanner.classList.contains("hidden")) {
          closeFamilyQuickstart(isFamilyConfigured() ? "saved" : "dismissed");
          return;
        }
        const memberEditor = document.getElementById("planner-member-editor");
        if (memberEditor && !memberEditor.classList.contains("hidden")) {
          closeMemberEditor();
          return;
        }
        if (currentMode === "simple" && currentView !== "list") {
          setExploreView("list");
          return;
        }
        if (currentMode !== "simple") {
          switchMode("simple");
          return;
        }
        const now = Date.now();
        if (now - lastBackExitAt < 2000) {
          window.Capacitor?.Plugins?.App?.exitApp?.();
        } else {
          lastBackExitAt = now;
          showToast("Appuyez à nouveau pour quitter", "info", { duration: 2000 });
        }
      });
    }

    const brandLink = document.querySelector("header.topbar .brand");
    if (brandLink) {
      brandLink.addEventListener("click", (e) => {
        e.preventDefault();
        switchMode("simple");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    const territorySel = document.getElementById("territory-select");
    if (territorySel) {
      territorySel.addEventListener("change", (e) => {
        applyTerritory(e.target.value, { persist: true, reload: true });
      });
    }

    const gradeEl = document.getElementById("filter-grade");
    const ageOrYearEl = document.getElementById("filter-age-or-year");
    const accGradeEl = document.getElementById("acc-grade");
    const accAgeOrYearEl = document.getElementById("acc-age-or-year");

    const onGradeChanged = (val) => {
      gradeEl.value = val;
      if (accGradeEl) accGradeEl.value = val;
      if (val) {
        ageOrYearEl.value = "";
        if (accAgeOrYearEl) accAgeOrYearEl.value = "";
        selectedAudiences.clear();
        selectedWhoMemberIds.clear();
      }
      syncAudiencePillsUI();
      renderFamilyWhoPills();
      loadSlots();
    };

    const onAgeOrYearChanged = (val) => {
      ageOrYearEl.value = val;
      if (accAgeOrYearEl) accAgeOrYearEl.value = val;
      if (val.trim()) {
        gradeEl.value = "";
        if (accGradeEl) accGradeEl.value = "";
        selectedAudiences.clear();
        selectedWhoMemberIds.clear();
      }
      syncAudiencePillsUI();
      renderFamilyWhoPills();
      loadSlots();
    };

    gradeEl.addEventListener("change", () => onGradeChanged(gradeEl.value));
    ageOrYearEl.addEventListener("input", () => onAgeOrYearChanged(ageOrYearEl.value));
    if (accGradeEl) accGradeEl.addEventListener("change", () => onGradeChanged(accGradeEl.value));
    if (accAgeOrYearEl) accAgeOrYearEl.addEventListener("input", () => onAgeOrYearChanged(accAgeOrYearEl.value));

    // Ma Famille en 10 secondes
    const openFamilySetupBtn = document.getElementById("open-family-setup-btn");
    if (openFamilySetupBtn) {
      openFamilySetupBtn.addEventListener("click", () => {
        const banner = document.getElementById("family-quickstart-banner");
        if (!banner) return;
        if (banner.classList.contains("hidden")) openFamilyQuickstart();
        else closeFamilyQuickstart(null);
      });
    }
    document.getElementById("close-family-setup-btn").addEventListener("click", () => {
      closeFamilyQuickstart(isFamilyConfigured() ? "saved" : "dismissed");
    });
    const addFamilyProfileMember = () => {
      if (familyProfile.length >= 6) {
        showToast("Maximum 6 membres dans le foyer.", "info");
        return;
      }
      familyProfile.push({
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name: `Membre ${familyProfile.length + 1}`,
        color: getNextMemberColor(),
        grade: "",
        age: "",
      });
      renderFamilyQuickstart();
      renderProfileFamilyRows();
    };
    document.getElementById("family-quickstart-add-btn").addEventListener("click", addFamilyProfileMember);
    document.getElementById("family-quickstart-save-btn").addEventListener("click", () => {
      persistFamilyProfileChanges("Foyer enregistré ! Vos pilules 1 clic sont prêtes dans « Pour qui ? ».");
    });
    document.getElementById("share-family-btn").addEventListener("click", shareFamilyLink);
    document.getElementById("planner-share-btn").addEventListener("click", shareFamilyLink);

    // Onglet Profil : foyer, territoires & outils
    const profileAddBtn = document.getElementById("profile-family-add-btn");
    if (profileAddBtn) profileAddBtn.addEventListener("click", addFamilyProfileMember);
    const profileSaveBtn = document.getElementById("profile-family-save-btn");
    if (profileSaveBtn) {
      profileSaveBtn.addEventListener("click", () => {
        persistFamilyProfileChanges("Foyer enregistré et synchronisé sur tout AssoPlanning !");
      });
    }
    const profileShareBtn = document.getElementById("profile-family-share-btn");
    if (profileShareBtn) profileShareBtn.addEventListener("click", shareFamilyLink);
    const profileTerrResetBtn = document.getElementById("profile-territory-reset-btn");
    if (profileTerrResetBtn) {
      profileTerrResetBtn.addEventListener("click", () => {
        applyTerritory("all", { persist: true, reload: true });
      });
    }
    const profileOpenCombosBtn = document.getElementById("profile-open-combos-btn");
    if (profileOpenCombosBtn) {
      profileOpenCombosBtn.addEventListener("click", () => switchMode("family"));
    }
    const profileOpenWeekBtn = document.getElementById("profile-open-week-btn");
    if (profileOpenWeekBtn) {
      profileOpenWeekBtn.addEventListener("click", () => {
        currentView = "week";
        document.querySelectorAll("#view-switcher button").forEach((b) => {
          b.classList.toggle("active", b.dataset.view === "week");
        });
        switchMode("simple");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Option A : Recherche directe mobile (#mobile-filter-q <-> #filter-q) & bouton ⚙ Filtres
    const filterQEl = document.getElementById("filter-q");
    const mobileFilterQ = document.getElementById("mobile-filter-q");
    const mobileFilterQClear = document.getElementById("mobile-filter-q-clear");
    if (mobileFilterQ) {
      const syncClearBtn = () => {
        if (mobileFilterQClear) {
          mobileFilterQClear.classList.toggle("hidden", !mobileFilterQ.value);
        }
      };
      mobileFilterQ.addEventListener("input", () => {
        if (filterQEl) filterQEl.value = mobileFilterQ.value;
        syncClearBtn();
        debouncedLoadSlots();
      });
      mobileFilterQ.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (filterQEl) filterQEl.value = mobileFilterQ.value;
          debouncedLoadSlots.flush();
          mobileFilterQ.blur();
        }
      });
      syncClearBtn();
    }
    if (mobileFilterQClear) {
      mobileFilterQClear.addEventListener("click", () => {
        debouncedLoadSlots.cancel();
        if (mobileFilterQ) mobileFilterQ.value = "";
        if (filterQEl) filterQEl.value = "";
        mobileFilterQClear.classList.add("hidden");
        loadSlots();
      });
    }

    const mobileOpenFiltersBtn = document.getElementById("mobile-open-filters-btn");
    if (mobileOpenFiltersBtn) {
      mobileOpenFiltersBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopover("opts");
      });
    }
    const mobileOptsClearBtn = document.getElementById("mobile-opts-clear-btn");
    if (mobileOptsClearBtn) {
      mobileOptsClearBtn.addEventListener("click", () => resetAllFilters());
    }
    const accTimeFrom = document.getElementById("acc-time-from");
    if (accTimeFrom) {
      accTimeFrom.addEventListener("change", () => {
        const tf = document.getElementById("filter-time-from");
        if (tf) tf.value = accTimeFrom.value;
        loadSlots();
      });
    }
    const accTimeTo = document.getElementById("acc-time-to");
    if (accTimeTo) {
      accTimeTo.addEventListener("change", () => {
        const tt = document.getElementById("filter-time-to");
        if (tt) tt.value = accTimeTo.value;
        loadSlots();
      });
    }

    // Contrôles horaires fins synchronisés (#popover-when <-> #popover-opts)
    document.querySelectorAll("[data-schedule-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextMode = btn.dataset.scheduleMode === "matrix" ? "matrix" : "simple";
        if (scheduleFilterMode === nextMode) return;
        scheduleFilterMode = nextMode;
        let changed = false;
        if (nextMode === "simple" && selectedDaySlots.size > 0) {
          selectedDaySlots.clear();
          changed = true;
        } else if (nextMode === "matrix" && (selectedDays.size > 0 || selectedTimeBuckets.size > 0)) {
          selectedDays.clear();
          selectedTimeBuckets.clear();
          syncDayPillsUI();
          changed = true;
        }
        syncScheduleFilterUI();
        if (changed) loadSlots();
      });
    });

    document.querySelectorAll("[data-time-bucket]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const bucket = btn.dataset.timeBucket;
        if (!bucket) return;
        scheduleFilterMode = "simple";
        selectedDaySlots.clear();
        if (selectedTimeBuckets.has(bucket)) {
          selectedTimeBuckets.delete(bucket);
        } else {
          selectedTimeBuckets.add(bucket);
        }
        syncScheduleFilterUI();
        loadSlots();
      });
    });

    document.querySelectorAll("[data-time-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextMode = btn.dataset.timeMode === "starts_between" ? "starts_between" : "contained";
        if (selectedTimeMode === nextMode) return;
        selectedTimeMode = nextMode;
        syncScheduleFilterUI();
        loadSlots();
      });
    });

    document.querySelectorAll("[data-duration]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextDur = btn.dataset.duration || "";
        selectedDurationRange = selectedDurationRange === nextDur && nextDur !== "" ? "" : nextDur;
        syncScheduleFilterUI();
        loadSlots();
      });
    });

    ["desktop-day-slot-matrix", "mobile-day-slot-matrix"].forEach((matrixId) => {
      const matrixEl = document.getElementById(matrixId);
      if (!matrixEl) return;
      matrixEl.addEventListener("click", (e) => {
        const cellBtn = e.target.closest("[data-day-slot]");
        if (cellBtn) {
          e.stopPropagation();
          toggleDaySlotCell(cellBtn.dataset.daySlot);
          return;
        }
        const dayBtn = e.target.closest("[data-matrix-day]");
        if (dayBtn) {
          e.stopPropagation();
          toggleDaySlotColumn(dayBtn.dataset.matrixDay);
          return;
        }
        const rowBtn = e.target.closest("[data-matrix-bucket]");
        if (rowBtn) {
          e.stopPropagation();
          toggleDaySlotRow(rowBtn.dataset.matrixBucket);
        }
      });
    });

    // Bascule Activités (groupé) / Créneaux (à plat)
    const groupingToggle = document.getElementById("list-grouping-toggle");
    if (groupingToggle) {
      groupingToggle.querySelectorAll("[data-grouping]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextMode = btn.dataset.grouping === "flat" ? "flat" : "grouped";
          if (listGroupingMode === nextMode) return;
          listGroupingMode = nextMode;
          syncGroupingToggleUI();
          updateResultsSummary();
          if (currentMode === "simple" && exploreWhenMode === "yearly" && currentView === "list") {
            renderListView();
          }
        });
      });
    }

    // Bouton bascule Carte / Liste dans la barre de résumé mobile
    const mobileViewToggleBtn = document.getElementById("mobile-view-toggle-btn");
    if (mobileViewToggleBtn) {
      mobileViewToggleBtn.addEventListener("click", () => {
        if (currentMode !== "simple") return;
        const nextView = currentView === "list" ? "map" : "list";
        setExploreView(nextView);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Fiche Détail modale
    const detailBackdrop = document.getElementById("detail-modal-backdrop");
    if (detailBackdrop) {
      detailBackdrop.addEventListener("click", (e) => {
        if (!window.AssoSheets && e.target === detailBackdrop) closeDetailModal();
      });
    }
    const detailCloseBtn = document.getElementById("detail-modal-close-btn");
    if (detailCloseBtn) {
      detailCloseBtn.addEventListener("click", closeDetailModal);
    }

    // Favoris / Listes
    const wishlistCreateBtn = document.getElementById("wishlist-create-btn");
    if (wishlistCreateBtn) {
      wishlistCreateBtn.addEventListener("click", createNewWishlist);
    }

    // Capsule Popovers
    document.querySelectorAll("[data-popover-btn]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopover(btn.dataset.popoverBtn);
      });
    });
    document.querySelectorAll(".capsule-popover").forEach((panel) => {
      panel.addEventListener("click", (e) => e.stopPropagation());
    });
    document.querySelectorAll("[data-close-popover]").forEach((btn) => {
      btn.addEventListener("click", () => closeAllPopovers());
    });
    document.querySelectorAll("[data-clear-section]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sec = btn.dataset.clearSection;
        if (sec === "who") {
          selectedWhoMemberIds.clear();
          selectedAudiences.clear();
          if (gradeEl) gradeEl.value = "";
          if (ageOrYearEl) ageOrYearEl.value = "";
          syncAccWhoInputsFromMain();
          syncAudiencePillsUI();
          renderFamilyWhoPills();
        } else if (sec === "when") {
          exploreWhenMode = "yearly";
          selectedCampPeriods.clear();
          selectedDays.clear();
          selectedTimeBuckets.clear();
          selectedDaySlots.clear();
          scheduleFilterMode = "simple";
          selectedTimeMode = "contained";
          selectedDurationRange = "";
          const tf = document.getElementById("filter-time-from");
          const tt = document.getElementById("filter-time-to");
          if (tf) tf.value = "";
          if (tt) tt.value = "";
          syncAccWhenInputsFromMain();
          syncDayPillsUI();
          syncScheduleFilterUI();
          syncWhenCampPeriodPillsUI();
          syncWhenModeUI();
        } else if (sec === "what" || sec === "opts") {
          selectedDisciplines.clear();
          selectedBudgetMax = null;
          const ds = document.getElementById("discipline-search");
          if (ds) ds.value = "";
          selectedStructureTypes.clear();
          const favOnly = document.getElementById("filter-available-only");
          const verOnly = document.getElementById("filter-verified-only");
          if (favOnly) favOnly.checked = false;
          if (verOnly) verOnly.checked = false;
          if (sec === "what") {
            const fq = document.getElementById("filter-q");
            if (fq) fq.value = "";
            syncAccWhenInputsFromMain();
          }
          renderDisciplineOptions();
          renderDisciplineDrilldown();
          syncBudgetPillsUI();
          syncStructureTypePillsUI();
        } else if (sec === "where") {
          applyTerritory("all", { persist: true, reload: true });
          return;
        }
        loadSlots();
      });
    });
    const mobileSheetBackdrop = document.getElementById("mobile-sheet-backdrop");
    if (mobileSheetBackdrop) {
      mobileSheetBackdrop.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!window.AssoSheets || !window.AssoSheets.isOpen("opts")) {
          closeAllPopovers();
        }
      });
    }
    document.addEventListener("click", () => closeAllPopovers());
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (window.AssoOverlay && window.AssoOverlay.closeTop({ fromEscape: true })) {
        return;
      }
      const fBack = document.getElementById("fav-drawer-backdrop");
      if (fBack && fBack.classList.contains("open")) {
        fBack.classList.remove("open");
        return;
      }
      closeAllPopovers();
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const nowMobile = isMobileViewport();
        if (nowMobile) {
          ["where", "who", "when", "what"].forEach((name) => {
            const p = document.getElementById(`popover-${name}`);
            if (p) p.classList.add("hidden");
            const btn = document.querySelector(`[data-popover-btn="${name}"]`);
            if (btn) {
              btn.setAttribute("aria-expanded", "false");
              btn.classList.remove("open");
            }
          });
        }
        if (nowMobile !== lastWasMobile && window.AssoSheets && window.AssoSheets.isOpen("opts")) {
          window.AssoSheets.close("opts", { immediate: true });
        }
        lastWasMobile = nowMobile;

        const anyDesktopPopoverOpen = Boolean(
          document.querySelector(".capsule-popover:not(#popover-opts):not(.hidden)")
        );
        const optsOpen = window.AssoSheets
          ? window.AssoSheets.isOpen("opts")
          : Boolean(document.querySelector("#popover-opts:not(.hidden)"));
        if (!optsOpen) {
          syncMobileSheetBackdrop(anyDesktopPopoverOpen);
        }
        updatePopoverResultCtas(exploreWhenMode === "camp" ? currentCamps.length : currentSlots.length);
        if (currentMode === "planner") {
          renderPlannerView();
        }
        if (currentMode === "simple" && currentView === "map" && leafletMap) {
          leafletMap.invalidateSize();
        }
      }, 150);
    });

    // Multi-select Sports / Activités (dans #popover-opts)
    const discSearch = document.getElementById("discipline-search");
    const discClearBtn = document.getElementById("discipline-clear-btn");
    if (discSearch) {
      discSearch.addEventListener("input", () => renderDisciplineOptions());
    }
    if (discClearBtn) {
      discClearBtn.addEventListener("click", () => {
        selectedDisciplines.clear();
        if (discSearch) discSearch.value = "";
        renderDisciplineOptions();
        renderDisciplineDrilldown();
        loadSlots();
      });
    }

    ["filter-q", "filter-time-from", "filter-time-to", "filter-available-only", "filter-verified-only"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === "filter-q") {
          el.addEventListener("input", () => {
            syncAccWhenInputsFromMain();
            debouncedLoadSlots();
          });
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              debouncedLoadSlots.flush();
            }
          });
        } else {
          el.addEventListener("change", () => {
            syncAccWhenInputsFromMain();
            loadSlots();
          });
        }
      }
    );

    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.addEventListener("click", () => applyPreset(btn.dataset.preset));
    });

    const resetFiltersBtn = document.getElementById("reset-filters-btn");
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener("click", () => resetAllFilters());
    }

    // Switch À l'année / Stages vacances dans Quand ? & Filtres
    document.querySelectorAll("[data-when-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetWhen = btn.dataset.whenMode;
        if (currentMode !== "simple") {
          exploreWhenMode = targetWhen === "camp" ? "camp" : "yearly";
          if (window.AssoNative) {
            window.AssoNative.triggerHaptic("selection");
          }
          switchMode("simple");
          if (exploreWhenMode === "yearly") {
            loadSlots();
          }
          return;
        }
        setExploreWhenMode(targetWhen, { reload: true });
      });
    });

    const optsClearAllBtn = document.getElementById("opts-clear-all-btn");
    if (optsClearAllBtn) {
      optsClearAllBtn.addEventListener("click", () => resetAllFilters());
    }

    // Assistant « Apprenons à nous connaître » & Centres d'intérêt
    const reopenObBtn = document.getElementById("reopen-onboarding-btn");
    if (reopenObBtn) {
      reopenObBtn.addEventListener("click", () => openOnboardingModal(1));
    }
    const clearInterestsBtn = document.getElementById("profile-interests-clear-btn");
    if (clearInterestsBtn) {
      clearInterestsBtn.addEventListener("click", () => {
        interestsByProfile[activeProfileInterestProfile] = [];
        saveInterestsByProfile();
        renderProfileInterestsGrid();
        renderOnboardingInterestsGrid();
        populateCategoryChips();
        showToast("Envies effacées pour ce profil.", "info");
      });
    }
    const obCitySearch = document.getElementById("ob-city-search");
    if (obCitySearch) {
      obCitySearch.addEventListener("input", () => debouncedRenderObCities());
    }
    const obSkipBtn = document.getElementById("onboarding-skip-btn");
    if (obSkipBtn) obSkipBtn.addEventListener("click", () => closeOnboardingModal(true));
    document.querySelectorAll(".onboarding-dot[data-ob-dot]").forEach((dot) => {
      dot.addEventListener("click", () => {
        const target = Number(dot.dataset.obDot);
        if (target >= 1 && target <= 3 && target !== onboardingStep) {
          onboardingStep = target;
          renderOnboardingStep();
        }
      });
    });
    const obPrevBtn = document.getElementById("onboarding-prev-btn");
    if (obPrevBtn) {
      obPrevBtn.addEventListener("click", () => {
        if (onboardingStep > 1) {
          onboardingStep -= 1;
          renderOnboardingStep();
        }
      });
    }
    const obNextBtn = document.getElementById("onboarding-next-btn");
    if (obNextBtn) {
      obNextBtn.addEventListener("click", () => {
        if (onboardingStep < 3) {
          onboardingStep += 1;
          renderOnboardingStep();
        }
      });
    }
    const obFinishBtn = document.getElementById("onboarding-finish-btn");
    if (obFinishBtn) obFinishBtn.addEventListener("click", finishOnboarding);
    const obBackdrop = document.getElementById("onboarding-modal-backdrop");
    if (obBackdrop) {
      obBackdrop.addEventListener("click", (e) => {
        if (!window.AssoSheets && e.target === obBackdrop) closeOnboardingModal(true);
      });
    }
    const obAddChildBtn = document.getElementById("ob-add-child-btn");
    if (obAddChildBtn) {
      obAddChildBtn.addEventListener("click", () => {
        if (familyProfile.length >= 6) return;
        const n = familyProfile.length + 1;
        familyProfile.push({
          id: `m${Date.now()}_${n}`,
          name: `Enfant ${familyProfile.filter((m) => m.grade !== "ADULTE" && m.grade !== "SENIOR").length + 1}`,
          color: PLANNER_COLOR_PALETTE[(n - 1) % PLANNER_COLOR_PALETTE.length],
          grade: "CE2",
          age: "",
        });
        renderOnboardingFamilyCards();
      });
    }
    const obAddAdultBtn = document.getElementById("ob-add-adult-btn");
    if (obAddAdultBtn) {
      obAddAdultBtn.addEventListener("click", () => {
        if (familyProfile.length >= 6) return;
        const n = familyProfile.length + 1;
        familyProfile.push({
          id: `m${Date.now()}_${n}`,
          name: `Adulte ${n}`,
          color: PLANNER_COLOR_PALETTE[(n - 1) % PLANNER_COLOR_PALETTE.length],
          grade: "ADULTE",
          age: "",
        });
        renderOnboardingFamilyCards();
      });
    }
    const obSoloBtn = document.getElementById("ob-solo-btn");
    if (obSoloBtn) {
      obSoloBtn.addEventListener("click", () => {
        familyProfile = [{ id: "m1", name: "Moi", color: "#105c97", grade: "ADULTE", age: "" }];
        activeObInterestProfile = "all";
        renderOnboardingFamilyCards();
      });
    }

    // Navigation 4 onglets + toggle Explorer (À l'année | Stages vacances)
    document.getElementById("mode-simple-btn").addEventListener("click", () => switchMode("simple"));
    const exploreWeeklyBtn = document.getElementById("explore-type-weekly-btn");
    if (exploreWeeklyBtn) {
      exploreWeeklyBtn.addEventListener("click", () => switchMode("simple"));
    }
    const modeWishlistsBtn = document.getElementById("mode-wishlists-btn");
    if (modeWishlistsBtn) {
      modeWishlistsBtn.addEventListener("click", () => switchMode("wishlists"));
    }
    const modeProfileBtn = document.getElementById("mode-profile-btn");
    if (modeProfileBtn) {
      modeProfileBtn.addEventListener("click", () => switchMode("profile"));
    }
    const modeFamilyBtn = document.getElementById("mode-family-btn");
    if (modeFamilyBtn) {
      modeFamilyBtn.addEventListener("click", () => {
        closeAllPopovers();
        switchMode("family");
      });
    }
    const backToSimpleBtn = document.getElementById("back-to-simple-btn");
    if (backToSimpleBtn) {
      backToSimpleBtn.addEventListener("click", () => switchMode("simple"));
    }
    document.getElementById("mode-planner-btn").addEventListener("click", () => switchMode("planner"));
    document.getElementById("mode-camps-btn").addEventListener("click", () => switchMode("camps"));

    // View switcher
    document.querySelectorAll("#view-switcher button").forEach((btn) => {
      btn.addEventListener("click", () => {
        setExploreView(btn.dataset.view);
      });
    });

    // Mode famille
    document.getElementById("add-family-member-btn").addEventListener("click", () => {
      if (familyMembers.length >= 4) {
        showToast("Maximum 4 membres en comparaison simultanée.", "info");
        return;
      }
      familyMembers.push({
        name: `Membre ${familyMembers.length + 1}`,
        grade: "",
        age: "",
        birth_year: "",
        category: "",
      });
      renderFamilyMembers();
    });
    document.getElementById("run-family-btn").addEventListener("click", runFamilyCombos);

    // Mon Planning Famille : éditeur de membres & actions
    document.getElementById("planner-add-member-btn").addEventListener("click", () => openMemberEditor(null));
    document.getElementById("planner-member-save-btn").addEventListener("click", saveMemberFromEditor);
    document.getElementById("planner-member-delete-btn").addEventListener("click", deleteMemberFromEditor);
    document.getElementById("planner-member-cancel-btn").addEventListener("click", closeMemberEditor);
    document.getElementById("planner-member-name").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveMemberFromEditor();
      }
    });
    document.getElementById("planner-member-color").addEventListener("input", (e) => {
      syncSwatchSelection(e.target.value);
    });
    document.getElementById("planner-export-ics-btn").addEventListener("click", () => {
      exportIcsForSlots(getFilteredPlannerSlots());
    });
    document.getElementById("planner-print-btn").addEventListener("click", () => {
      preparePlannerPrintHeader();
      window.print();
    });
    document.getElementById("planner-clear-btn").addEventListener("click", async () => {
      const toClear = getFilteredPlannerSlots();
      if (!toClear.length) {
        showToast("Le planning affiché est déjà vide.", "info");
        return;
      }
      const activeMember = activePlannerMemberId === "all" ? null : getMemberById(activePlannerMemberId);
      if (window.AssoDialog) {
        const ok = await window.AssoDialog.confirm({
          title: activeMember ? `Vider le planning de ${activeMember.name} ?` : "Vider tout le planning ?",
          message: `${toClear.length} créneau${toClear.length > 1 ? "x" : ""} seront retirés du planning.`,
          confirmText: "Vider",
          danger: true,
        });
        if (!ok) return;
      }
      const snapshot = favorites.map((f) => ({ ...f }));
      if (activePlannerMemberId === "all") {
        favorites = [];
      } else {
        favorites = favorites.filter((f) => f.memberId !== activePlannerMemberId);
      }
      saveFavorites();
      renderFavoritesDrawer();
      renderPlannerView();
      if (currentMode === "simple") {
        if (currentView === "list") {
          snapshot.forEach((s) => patchCardStateInPlace("slot", s.id));
        } else {
          renderCurrentView();
        }
      }
      showToast("Sélection vidée.", "info", {
        actionLabel: "Annuler",
        onAction: () => {
          favorites = snapshot;
          saveFavorites();
          renderFavoritesDrawer();
          if (currentMode === "planner") renderPlannerView();
          if (currentMode === "simple") {
            if (currentView === "list") {
              snapshot.forEach((s) => patchCardStateInPlace("slot", s.id));
            } else {
              renderCurrentView();
            }
          }
          if (currentMode === "wishlists") renderWishlistsView();
          refreshDetailModalIfOpen();
          showToast("Planning restauré.", "success");
        },
      });
    });

    // Stages vacances filters
    document.getElementById("camps-category-select").addEventListener("change", () => loadCamps());
    document.getElementById("camps-city-select").addEventListener("change", () => loadCamps());
    document.getElementById("camps-q").addEventListener("input", () => debouncedLoadCamps());
    document.getElementById("camps-reset-btn").addEventListener("click", resetCampsFilters);

    // Favoris drawer (rétrocompatibilité)
    const openFavBtn = document.getElementById("open-fav-btn");
    if (openFavBtn) {
      openFavBtn.addEventListener("click", () => {
        renderFavoritesDrawer();
        document.getElementById("fav-drawer-backdrop").classList.add("open");
      });
    }
    document.getElementById("close-fav-btn").addEventListener("click", () => {
      document.getElementById("fav-drawer-backdrop").classList.remove("open");
    });
    document.getElementById("open-planner-from-drawer-btn").addEventListener("click", () => {
      document.getElementById("fav-drawer-backdrop").classList.remove("open");
      switchMode("planner");
    });
    document.getElementById("fav-drawer-backdrop").addEventListener("click", (e) => {
      if (e.target.id === "fav-drawer-backdrop") {
        e.target.classList.remove("open");
      }
    });
    document.getElementById("export-ics-btn").addEventListener("click", () => {
      exportIcsForSlots(favorites);
    });
    document.getElementById("print-fav-btn").addEventListener("click", () => {
      document.getElementById("fav-drawer-backdrop").classList.remove("open");
      switchMode("planner");
      preparePlannerPrintHeader();
      setTimeout(() => window.print(), 80);
    });
    document.getElementById("clear-fav-btn").addEventListener("click", () => {
      const snapshot = favorites.map((f) => ({ ...f }));
      favorites = [];
      saveFavorites();
      renderFavoritesDrawer();
      if (currentMode === "simple" && currentView === "list") {
        snapshot.forEach((s) => patchCardStateInPlace("slot", s.id));
      } else {
        renderCurrentView();
      }
      if (currentMode === "planner") renderPlannerView();
    });

    // Modal signalement
    document.getElementById("close-report-btn").addEventListener("click", () => {
      if (window.AssoSheets) {
        window.AssoSheets.close("report");
      } else {
        document.getElementById("report-modal-backdrop").classList.remove("open");
      }
    });
    document.getElementById("report-form").addEventListener("submit", submitReport);
  }

  function resetAllFilters({ keepSearchModal = false } = {}) {
    selectedWhoMemberIds.clear();
    selectedAudiences.clear();
    const fg = document.getElementById("filter-grade");
    const fa = document.getElementById("filter-age-or-year");
    if (fg) fg.value = "";
    if (fa) fa.value = "";
    renderFamilyWhoPills();
    selectedDays.clear();
    selectedTimeBuckets.clear();
    selectedDaySlots.clear();
    scheduleFilterMode = "simple";
    selectedTimeMode = "contained";
    selectedDurationRange = "";
    exploreWhenMode = "yearly";
    selectedCampPeriods.clear();
    selectedBudgetMax = null;
    const tf = document.getElementById("filter-time-from");
    const tt = document.getElementById("filter-time-to");
    if (tf) tf.value = "";
    if (tt) tt.value = "";
    selectedCategories.clear();
    selectedDisciplines.clear();
    const ds = document.getElementById("discipline-search");
    if (ds) ds.value = "";
    if (keepSearchModal) {
      selectedCities.clear();
      syncTerritorySelectFromSelectedCities();
      updateTerritoryLabels();
    } else {
      selectedCities = new Set(getActiveTerritory().slugs);
    }
    selectedStructureTypes.clear();
    const fq = document.getElementById("filter-q");
    if (fq) fq.value = "";
    const favOnly = document.getElementById("filter-available-only");
    const verOnly = document.getElementById("filter-verified-only");
    if (favOnly) favOnly.checked = false;
    if (verOnly) verOnly.checked = false;
    syncAccWhoInputsFromMain();
    syncAccWhenInputsFromMain();
    closeAllPopovers();

    syncAudiencePillsUI();
    syncDayPillsUI();
    syncScheduleFilterUI();
    syncWhenCampPeriodPillsUI();
    syncWhenModeUI();
    syncCategoryChipsUI();
    refreshDisciplineMultiselect();
    renderDisciplineDrilldown();
    syncBudgetPillsUI();
    syncCityPillsUI();
    syncWhereTerritoryPillsUI();
    syncStructureTypePillsUI();
    loadSlots();
  }

  function applyPreset(preset) {
    selectedDays.clear();
    selectedTimeBuckets.clear();
    selectedDaySlots.clear();
    scheduleFilterMode = "simple";
    selectedTimeMode = "contained";
    const tf = document.getElementById("filter-time-from");
    const tt = document.getElementById("filter-time-to");
    if (tf) tf.value = "";
    if (tt) tt.value = "";
    if (preset === "wednesday") {
      selectedDays.add(2);
    } else if (preset === "wednesday_pm") {
      selectedDays.add(2);
      if (tf) tf.value = "13:30";
    } else if (preset === "afterschool") {
      [0, 1, 3, 4].forEach((d) => selectedDays.add(d));
      if (tf) tf.value = "17:00";
    } else if (preset === "weekend") {
      selectedDays.add(5);
    } else if (preset === "saturday_am") {
      selectedDays.add(5);
      selectedTimeBuckets.add("morning");
    } else if (preset === "adults") {
      selectedAudiences.clear();
      selectedWhoMemberIds.clear();
      selectedAudiences.add("adulte");
      const fg = document.getElementById("filter-grade");
      const fa = document.getElementById("filter-age-or-year");
      if (fg) fg.value = "";
      if (fa) fa.value = "";
      if (tf) tf.value = "18:30";
    }
    syncAccWhoInputsFromMain();
    syncAccWhenInputsFromMain();
    syncDayPillsUI();
    syncScheduleFilterUI();
    syncAudiencePillsUI();
    renderFamilyWhoPills();
    loadSlots();
  }

  function switchMode(mode) {
    const prevMode = currentMode;
    const prevWhenMode = exploreWhenMode;
    if (mode === "camps") {
      exploreWhenMode = "camp";
      mode = "simple";
    }
    if ((prevMode !== mode || prevWhenMode !== exploreWhenMode) && window.AssoNative) {
      window.AssoNative.triggerHaptic("selection");
    }
    currentMode = mode;
    closeAllPopovers();
    closeSearchModal();

    const isExplore = mode === "simple";
    const setTabActive = (id, active) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    };

    setTabActive("mode-simple-btn", isExplore);
    setTabActive("mode-wishlists-btn", mode === "wishlists");
    setTabActive("mode-planner-btn", mode === "planner");
    setTabActive("mode-profile-btn", mode === "profile");

    const modeFamilyBtn = document.getElementById("mode-family-btn");
    if (modeFamilyBtn) modeFamilyBtn.classList.toggle("active", mode === "family");

    const exploreTypeBar = document.getElementById("explore-type-bar");
    if (exploreTypeBar) exploreTypeBar.classList.add("hidden");
    setTabActive("explore-type-weekly-btn", isExplore && exploreWhenMode === "yearly");
    setTabActive("mode-camps-btn", isExplore && exploreWhenMode === "camp");

    const toggleHidden = (id, hidden) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("hidden", hidden);
    };

    toggleHidden("panel-simple", !isExplore);
    toggleHidden("results-simple", !(isExplore && exploreWhenMode === "yearly"));
    toggleHidden("view-switcher", !(isExplore && exploreWhenMode === "yearly"));

    toggleHidden("panel-family", mode !== "family");
    toggleHidden("results-family", mode !== "family");

    toggleHidden("panel-wishlists", mode !== "wishlists");
    toggleHidden("results-wishlists", mode !== "wishlists");

    toggleHidden("panel-planner", mode !== "planner");
    toggleHidden("results-planner", mode !== "planner");

    toggleHidden("panel-camps", true);
    toggleHidden("results-camps", !(isExplore && exploreWhenMode === "camp"));

    toggleHidden("panel-profile", mode !== "profile");
    toggleHidden("results-profile", mode !== "profile");

    syncWhenModeUI();
    renderQuickDiscoverBar(lastActiveTagsCount);
    updateMobileViewToggle();

    if (mode === "family") {
      runFamilyCombos();
    } else if (mode === "wishlists") {
      renderWishlistsView();
    } else if (mode === "planner") {
      renderPlannerView();
    } else if (mode === "profile") {
      renderProfileView();
    } else if (isExplore) {
      if (exploreWhenMode === "camp") {
        loadSlots();
      } else {
        renderCurrentView();
      }
    }
  }

  function renderProfileView() {
    renderProfileFamilyRows();
    renderProfileInterestsGrid();
    syncWhereTerritoryPillsUI();
    syncCityPillsUI();
  }

  function parseAgeOrYearInput(raw) {
    const trimmed = (raw || "").trim();
    if (!trimmed) return { age: "", birthYear: "" };
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return { age: "", birthYear: "" };
    if (n >= 1920 && n <= 2030) return { age: "", birthYear: String(Math.trunc(n)) };
    if (n >= 0 && n <= 110) return { age: String(Math.trunc(n)), birthYear: "" };
    return { age: "", birthYear: "" };
  }

  function renderQuickDiscoverBar(activeTagsCount) {
    const bar = document.getElementById("quick-discover-bar");
    if (!bar) return;

    const show = currentMode === "simple" && exploreWhenMode === "yearly" && activeTagsCount === 0;
    if (!show) {
      bar.classList.add("hidden");
      bar.innerHTML = "";
      return;
    }

    const suggestions = [];
    if (isFamilyConfigured() && familyProfile.length > 0) {
      suggestions.push({
        label: "👨‍👩‍👧‍👦 Ma famille",
        title: "Filtrer pour tous les membres enregistrés de votre foyer",
        action: () => {
          selectedWhoMemberIds = new Set(familyProfile.map((m) => m.id));
          selectedAudiences.clear();
          const fg = document.getElementById("filter-grade");
          const fa = document.getElementById("filter-age-or-year");
          if (fg) fg.value = "";
          if (fa) fa.value = "";
          syncAccWhoInputsFromMain();
          syncAudiencePillsUI();
          renderFamilyWhoPills();
          populateCategoryChips();
          loadSlots();
        },
      });
    } else {
      suggestions.push({
        label: "👨‍👩‍👧‍👦 Mon foyer",
        title: "Configurer les membres de votre foyer",
        action: () => openOnboardingModal(2),
      });
    }
    suggestions.push(
      {
        label: "Mercredi après-midi",
        action: () => applyPreset("wednesday_pm"),
      },
      {
        label: "Après l'école 17h+",
        action: () => applyPreset("afterschool"),
      },
      {
        label: "Samedi matin",
        action: () => applyPreset("saturday_am"),
      },
      {
        label: "Soirée adultes",
        action: () => applyPreset("adults"),
      }
    );

    bar.classList.remove("hidden");
    bar.innerHTML = `<span class="quick-discover-label">Idées :</span>`;
    suggestions.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-discover-chip";
      if (s.title) btn.title = s.title;
      btn.textContent = s.label;
      btn.addEventListener("click", s.action);
      bar.appendChild(btn);
    });
  }

  function renderActiveFilters(state) {
    const bar = document.getElementById("active-filters-bar");
    const panel = document.getElementById("active-filters-panel");
    const tags = [];

    // 1. Pour qui ?
    selectedWhoMemberIds.forEach((mid) => {
      const m = getMemberById(mid);
      if (m) {
        tags.push({
          label: `Famille : ${m.name}`,
          clear: () => {
            selectedWhoMemberIds.delete(mid);
            syncAudiencePillsUI();
            renderFamilyWhoPills();
          },
        });
      }
    });
    const audienceMap = new Map(getAudienceGroups().map((g) => [g.code, g.label]));
    selectedAudiences.forEach((code) => {
      tags.push({
        label: `Public : ${audienceMap.get(code) || code}`,
        clear: () => {
          selectedAudiences.delete(code);
          syncAudiencePillsUI();
        },
      });
    });
    if (state.grade) {
      const gradeObj = (meta.grades || []).find((g) => g.code === state.grade);
      tags.push({
        label: `Classe : ${gradeObj ? gradeObj.label : state.grade}`,
        clear: () => {
          const fg = document.getElementById("filter-grade");
          if (fg) fg.value = "";
          syncAccWhoInputsFromMain();
          syncAudiencePillsUI();
        },
      });
    }
    if (state.age) {
      tags.push({
        label: `Âge : ${state.age} ans`,
        clear: () => {
          const fa = document.getElementById("filter-age-or-year");
          if (fa) fa.value = "";
          syncAccWhoInputsFromMain();
          syncAudiencePillsUI();
        },
      });
    }
    if (state.by) {
      tags.push({
        label: `Né(e) en : ${state.by}`,
        clear: () => {
          const fa = document.getElementById("filter-age-or-year");
          if (fa) fa.value = "";
          syncAccWhoInputsFromMain();
          syncAudiencePillsUI();
        },
      });
    }

    // 2. Quand ? (À l'année ou Stages vacances)
    if (exploreWhenMode === "camp") {
      tags.push({
        label: "☀️ Stages vacances",
        clear: () => {
          exploreWhenMode = "yearly";
          selectedCampPeriods.clear();
          syncWhenCampPeriodPillsUI();
          syncWhenModeUI();
        },
      });
      selectedCampPeriods.forEach((p) => {
        tags.push({
          label: `Vacances : ${p}`,
          clear: () => {
            selectedCampPeriods.delete(p);
            syncWhenCampPeriodPillsUI();
          },
        });
      });
    } else {
      if (selectedDaySlots.size > 0) {
        const byDay = new Map();
        selectedDaySlots.forEach((tok) => {
          const [dStr, bKey] = String(tok).split(":");
          const d = Number(dStr);
          if (!Number.isInteger(d) || d < 0 || d > 6) return;
          if (!byDay.has(d)) byDay.set(d, []);
          byDay.get(d).push(bKey);
        });
        Array.from(byDay.keys())
          .sort((a, b) => a - b)
          .forEach((d) => {
            const keys = byDay.get(d);
            const dayName = (DAYS_FR[d] || "").slice(0, 3);
            const desc =
              keys.length === MATRIX_MOMENTS.length
                ? "Journée"
                : keys.map((k) => TIME_BUCKET_SHORT[k] || k).join(", ");
            tags.push({
              label: `Dispo ${dayName} : ${desc}`,
              clear: () => {
                keys.forEach((k) => selectedDaySlots.delete(`${d}:${k}`));
                syncScheduleFilterUI();
              },
            });
          });
      } else {
        Array.from(selectedDays)
          .sort((a, b) => a - b)
          .forEach((d) => {
            tags.push({
              label: `Jour : ${DAYS_FR[d]}`,
              clear: () => {
                selectedDays.delete(d);
                syncDayPillsUI();
              },
            });
          });
        selectedTimeBuckets.forEach((b) => {
          tags.push({
            label: `Moment : ${TIME_BUCKET_LABELS[b] || b}`,
            clear: () => {
              selectedTimeBuckets.delete(b);
              syncScheduleFilterUI();
            },
          });
        });
      }
      if (selectedTimeMode === "starts_between") {
        tags.push({
          label: "Horaire : Débute entre",
          clear: () => {
            selectedTimeMode = "contained";
            syncScheduleFilterUI();
          },
        });
      }
      if (state.tFrom) {
        tags.push({
          label: `${selectedTimeMode === "starts_between" ? "Début dès" : "À partir de"} ${state.tFrom}`,
          clear: () => {
            const tf = document.getElementById("filter-time-from");
            if (tf) tf.value = "";
            syncAccWhenInputsFromMain();
          },
        });
      }
      if (state.tTo) {
        tags.push({
          label: `${selectedTimeMode === "starts_between" ? "Début jusqu'à" : "Jusqu'à"} ${state.tTo}`,
          clear: () => {
            const tt = document.getElementById("filter-time-to");
            if (tt) tt.value = "";
            syncAccWhenInputsFromMain();
          },
        });
      }
      if (selectedDurationRange) {
        tags.push({
          label: `Durée : ${DURATION_LABELS[selectedDurationRange] || selectedDurationRange}`,
          clear: () => {
            selectedDurationRange = "";
            syncScheduleFilterUI();
          },
        });
      }
    }

    // 3. Quoi & Où ?
    selectedCategories.forEach((cat) => {
      tags.push({
        label: `Catégorie : ${cat}`,
        clear: () => {
          selectedCategories.delete(cat);
          syncCategoryChipsUI();
          refreshDisciplineMultiselect();
        },
      });
    });
    selectedDisciplines.forEach((disc) => {
      tags.push({
        label: `Sport : ${disc}`,
        clear: () => {
          selectedDisciplines.delete(disc);
          renderDisciplineOptions();
        },
      });
    });

    const cityMap = new Map((meta.cities || []).map((c) => [c.slug, c.name]));
    if (!isSelectedCitiesMatchingTerritory()) {
      selectedCities.forEach((slug) => {
        tags.push({
          label: `Commune : ${cityMap.get(slug) || slug}`,
          clear: () => {
            selectedCities.delete(slug);
            onSelectedCitiesChanged({ reload: false });
          },
        });
      });
    }

    const stMap = new Map((meta.structure_types || []).map((st) => [st.code, st.label]));
    selectedStructureTypes.forEach((code) => {
      tags.push({
        label: `Structure : ${stMap.get(code) || code}`,
        clear: () => {
          selectedStructureTypes.delete(code);
          syncStructureTypePillsUI();
        },
      });
    });

    if (state.q) {
      tags.push({
        label: `Recherche : ${state.q}`,
        clear: () => {
          const fq = document.getElementById("filter-q");
          if (fq) fq.value = "";
          syncAccWhenInputsFromMain();
        },
      });
    }
    if (selectedBudgetMax !== null) {
      tags.push({
        label: `Budget : ≤ ${selectedBudgetMax} €`,
        clear: () => {
          selectedBudgetMax = null;
          syncBudgetPillsUI();
        },
      });
    }
    if (state.availOnly) {
      tags.push({
        label: "Places dispos uniquement",
        clear: () => {
          const el = document.getElementById("filter-available-only");
          if (el) el.checked = false;
        },
      });
    }
    if (state.verOnly) {
      tags.push({
        label: "Vérifiés par l'asso",
        clear: () => {
          const el = document.getElementById("filter-verified-only");
          if (el) el.checked = false;
        },
      });
    }

    lastActiveTagsCount = tags.length;
    renderQuickDiscoverBar(tags.length);

    // Met à jour le badge sur ⚙ Filtres (desktop + mobile) avec le nombre total de filtres actifs
    const optsBtn = document.getElementById("capsule-btn-opts");
    const optsBadge = document.getElementById("capsule-opts-badge");
    const mobileOptsBtn = document.getElementById("mobile-open-filters-btn");
    const mobileOptsBadge = document.getElementById("mobile-opts-badge");
    if (optsBadge) {
      if (tags.length > 0) {
        optsBadge.textContent = String(tags.length);
        optsBadge.classList.remove("hidden");
      } else {
        optsBadge.classList.add("hidden");
      }
    }
    if (mobileOptsBadge) {
      if (tags.length > 0) {
        mobileOptsBadge.textContent = String(tags.length);
        mobileOptsBadge.classList.remove("hidden");
      } else {
        mobileOptsBadge.classList.add("hidden");
      }
    }
    if (optsBtn) optsBtn.classList.toggle("has-filter", tags.length > 0);
    if (mobileOptsBtn) mobileOptsBtn.classList.toggle("has-filter", tags.length > 0);

    const mobileBar = document.getElementById("mobile-active-filters-bar");
    if (mobileBar) {
      if (tags.length === 0) {
        mobileBar.classList.add("hidden");
        mobileBar.innerHTML = "";
      } else {
        mobileBar.classList.remove("hidden");
        mobileBar.innerHTML = "";
        tags.forEach((t) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "active-filter-tag";
          btn.setAttribute("aria-label", `Retirer le filtre ${t.label}`);
          btn.innerHTML = `<span>${escapeHtml(t.label)}</span><span aria-hidden="true">×</span>`;
          btn.addEventListener("click", () => {
            t.clear();
            loadSlots();
          });
          mobileBar.appendChild(btn);
        });
        if (tags.length >= 2) {
          const clearAllBtn = document.createElement("button");
          clearAllBtn.type = "button";
          clearAllBtn.className = "active-filter-tag active-filter-clear-all";
          clearAllBtn.textContent = "Tout effacer";
          clearAllBtn.addEventListener("click", () => resetAllFilters());
          mobileBar.appendChild(clearAllBtn);
        }
      }
    }

    if (panel) {
      panel.classList.toggle("hidden", tags.length === 0);
    }
    if (!bar) return;
    bar.classList.remove("hidden");
    if (tags.length === 0) {
      bar.innerHTML = `<span class="active-filters-empty">Aucun filtre actif pour le moment.</span>`;
      return;
    }

    bar.innerHTML = `<span class="muted" style="font-size:0.78rem; font-weight:700;">Filtres actifs (${tags.length}) :</span>`;
    tags.forEach((t) => {
      const span = document.createElement("span");
      span.className = "active-filter-tag";
      span.innerHTML = `${escapeHtml(t.label)} <button type="button" aria-label="Retirer ce filtre">×</button>`;
      span.querySelector("button").addEventListener("click", () => {
        t.clear();
        loadSlots();
      });
      bar.appendChild(span);
    });
  }

  function updateCapsuleSummaries(state) {
    // 1. Pour qui ?
    const whoBtn = document.getElementById("capsule-btn-who");
    const whoVal = document.getElementById("capsule-summary-who");
    const whoParts = [];
    const whoShortParts = [];
    const selectedMembers = Array.from(selectedWhoMemberIds).map(getMemberById).filter(Boolean);
    if (selectedMembers.length) {
      whoParts.push(
        selectedMembers
          .map((m) => {
            const sub = m.grade ? ` (${m.grade})` : m.age ? ` (${m.age} ans)` : "";
            return `● ${m.name}${selectedMembers.length === 1 ? sub : ""}`;
          })
          .join(", ")
      );
      whoShortParts.push(selectedMembers.map((m) => m.name).join(" + "));
    }
    if (selectedAudiences.size > 0) {
      const groupMap = new Map(getAudienceGroups().map((g) => [g.code, g.label.split(" ")[0]]));
      const audStr = Array.from(selectedAudiences)
        .map((code) => groupMap.get(code) || code)
        .join(", ");
      whoParts.push(audStr);
      whoShortParts.push(audStr);
    }
    if (!whoParts.length) {
      if (state.grade) {
        const gradeObj = (meta.grades || []).find((g) => g.code === state.grade);
        const lbl = gradeObj ? gradeObj.label : state.grade;
        whoParts.push(`Classe : ${lbl}`);
        whoShortParts.push(lbl);
      } else if (state.age) {
        whoParts.push(`${state.age} ans`);
        whoShortParts.push(`${state.age} ans`);
      } else if (state.by) {
        whoParts.push(`Né(e) en ${state.by}`);
        whoShortParts.push(`Né(e) en ${state.by}`);
      }
    }
    const whoActive = whoParts.length > 0;
    const whoSummaryText = whoActive ? whoParts.join(" · ") : "Tout public";
    if (whoVal) whoVal.textContent = whoSummaryText;
    if (whoBtn) whoBtn.classList.toggle("has-filter", whoActive);
    const accWhoSummary = document.getElementById("acc-summary-who");
    if (accWhoSummary) accWhoSummary.textContent = whoActive ? whoShortParts.join(" · ") : "Tout public";

    // 2. Quand ? (À l'année ou Stages vacances)
    const whenBtn = document.getElementById("capsule-btn-when");
    const whenVal = document.getElementById("capsule-summary-when");
    const whenParts = [];
    if (exploreWhenMode === "camp") {
      if (selectedCampPeriods.size > 0) {
        whenParts.push(`☀️ ${Array.from(selectedCampPeriods).join(", ")}`);
      } else {
        whenParts.push("☀️ Stages vacances");
      }
    } else {
      if (selectedDaySlots.size > 0) {
        if (selectedDaySlots.size <= 3) {
          const items = Array.from(selectedDaySlots)
            .sort()
            .map((tok) => {
              const [dStr, bKey] = tok.split(":");
              const dShort = (DAYS_FR[Number(dStr)] || "").slice(0, 3);
              return `${dShort} ${TIME_BUCKET_SHORT[bKey] || bKey}`;
            });
          whenParts.push(items.join(", "));
        } else {
          whenParts.push(`${selectedDaySlots.size} créneaux jour×moment`);
        }
      } else {
        if (selectedDays.size > 0) {
          whenParts.push(
            Array.from(selectedDays)
              .sort((a, b) => a - b)
              .map((d) => (selectedDays.size === 1 ? DAYS_FR[d] : DAYS_FR[d].slice(0, 3)))
              .join(", ")
          );
        }
        if (selectedTimeBuckets.size > 0) {
          const bStr = Array.from(selectedTimeBuckets)
            .map((b) => TIME_BUCKET_SHORT[b] || b)
            .join(", ");
          whenParts.push(bStr);
        }
      }
      const timePrefix = selectedTimeMode === "starts_between" ? "Début " : "";
      if (state.tFrom && state.tTo) {
        whenParts.push(`${timePrefix}${state.tFrom}–${state.tTo}`);
      } else if (state.tFrom) {
        whenParts.push(`${timePrefix || "Dès "}${state.tFrom}`);
      } else if (state.tTo) {
        whenParts.push(`${timePrefix}≤ ${state.tTo}`);
      } else if (selectedTimeMode === "starts_between") {
        whenParts.push("Débute entre");
      }
      if (selectedDurationRange) {
        whenParts.push(DURATION_LABELS[selectedDurationRange] || selectedDurationRange);
      }
    }
    const whenActive = whenParts.length > 0;
    const whenSummaryText = whenActive ? whenParts.join(" · ") : "À l'année · Tous jours";
    if (whenVal) whenVal.textContent = whenSummaryText;
    if (whenBtn) whenBtn.classList.toggle("has-filter", whenActive);
    const accWhenSummary = document.getElementById("acc-summary-when");
    if (accWhenSummary) {
      accWhenSummary.textContent = whenSummaryText;
    }

    // 3. Quoi ?
    const whatBtn = document.getElementById("capsule-btn-what");
    const whatVal = document.getElementById("capsule-summary-what");
    const whatParts = [];
    if (selectedDisciplines.size === 1) {
      whatParts.push(Array.from(selectedDisciplines)[0]);
    } else if (selectedDisciplines.size > 1) {
      whatParts.push(`${selectedDisciplines.size} activités`);
    } else if (selectedCategories.size === 1) {
      whatParts.push(Array.from(selectedCategories)[0]);
    } else if (selectedCategories.size > 1) {
      whatParts.push(`${selectedCategories.size} catégories`);
    }
    if (state.q) {
      whatParts.push(`« ${state.q} »`);
    }
    const whatActive = whatParts.length > 0;
    const whatSummaryText = whatActive ? whatParts.join(" · ") : "Toutes activités";
    if (whatVal) whatVal.textContent = whatSummaryText;
    if (whatBtn) whatBtn.classList.toggle("has-filter", whatActive);
    const accWhatSummary = document.getElementById("acc-summary-what");
    if (accWhatSummary) accWhatSummary.textContent = whatSummaryText;

    // 4. Où ?
    const whereLabel = getSelectedWhereLabel();
    const whereBtn = document.getElementById("capsule-btn-where");
    const whereVal = document.getElementById("capsule-summary-where");
    if (whereBtn && whereVal) {
      whereVal.textContent = whereLabel;
      whereBtn.classList.toggle("has-filter", selectedCities.size > 0);
    }
    const accWhereSummary = document.getElementById("acc-summary-where");
    if (accWhereSummary) accWhereSummary.textContent = whereLabel;
  }

  function updateResultsSummary() {
    const el = document.getElementById("results-summary");
    if (!el) return;
    if (exploreWhenMode === "camp") {
      el.textContent = `${currentCamps.length} stage${currentCamps.length > 1 ? "s" : ""} vacances trouvé${currentCamps.length > 1 ? "s" : ""}`;
      return;
    }
    if (listGroupingMode === "grouped") {
      const actCount = currentActivityGroups.length;
      const slotCount = currentSlots.length;
      el.textContent = isMobileViewport()
        ? `${actCount} activité${actCount > 1 ? "s" : ""} (${slotCount})`
        : `${actCount} activité${actCount > 1 ? "s" : ""} · ${slotCount} créneau${slotCount > 1 ? "x" : ""}`;
      return;
    }
    el.textContent = `${currentSlots.length} créneau${currentSlots.length > 1 ? "x" : ""} trouvé${currentSlots.length > 1 ? "s" : ""}`;
  }

  async function loadSlots() {
    const reqSeq = ++latestLoadSeq;
    const params = new URLSearchParams();
    const fg = document.getElementById("filter-grade");
    const fa = document.getElementById("filter-age-or-year");
    const fq = document.getElementById("filter-q");
    const tf = document.getElementById("filter-time-from");
    const tt = document.getElementById("filter-time-to");
    const favOnlyEl = document.getElementById("filter-available-only");
    const verOnlyEl = document.getElementById("filter-verified-only");

    const grade = fg ? fg.value : "";
    const { age, birthYear: by } = parseAgeOrYearInput(fa ? fa.value : "");
    const q = fq ? fq.value.trim() : "";
    const tFrom = tf ? tf.value : "";
    const tTo = tt ? tt.value : "";
    const availOnly = Boolean(favOnlyEl && favOnlyEl.checked);
    const verOnly = Boolean(verOnlyEl && verOnlyEl.checked);

    const selectedMembers = Array.from(selectedWhoMemberIds).map(getMemberById).filter(Boolean);
    let refineBySelectedMembers = false;
    if (selectedMembers.length === 1 && selectedAudiences.size === 0) {
      const m = selectedMembers[0];
      if (m.grade) params.set("grade", m.grade);
      else if (m.age) params.set("age", m.age);
    } else if (selectedMembers.length > 0 || selectedAudiences.size > 0) {
      const audienceUnion = new Set(selectedAudiences);
      selectedMembers.forEach((m) => {
        const gCode = ageToAudienceGroupCode(resolveMemberAge(m));
        if (gCode) audienceUnion.add(gCode);
      });
      if (audienceUnion.size > 0) {
        params.set("audiences", Array.from(audienceUnion).join(","));
      }
      if (selectedMembers.length > 0) {
        refineBySelectedMembers = true;
      }
    } else {
      if (grade) params.set("grade", grade);
      if (age) params.set("age", age);
      if (by) params.set("birth_year", by);
    }

    if (selectedDaySlots.size > 0) {
      params.set("day_slots", Array.from(selectedDaySlots).sort().join(","));
    } else {
      if (selectedDays.size > 0) {
        params.set("days", Array.from(selectedDays).sort((a, b) => a - b).join(","));
      }
      if (selectedTimeBuckets.size > 0) {
        params.set("time_buckets", Array.from(selectedTimeBuckets).join(","));
      }
    }
    params.set("time_mode", selectedTimeMode || "contained");
    if (tFrom) params.set("time_from", tFrom);
    if (tTo) params.set("time_to", tTo);

    const durBounds = parseDurationParams(selectedDurationRange);
    if (durBounds.min !== null) params.set("duration_min", String(durBounds.min));
    if (durBounds.max !== null) params.set("duration_max", String(durBounds.max));

    selectedCategories.forEach((cat) => params.append("categories", cat));
    selectedDisciplines.forEach((disc) => params.append("disciplines", disc));

    if (selectedCities.size > 0) {
      params.set("city_slugs", Array.from(selectedCities).join(","));
    }
    if (selectedStructureTypes.size > 0) {
      params.set("structure_types", Array.from(selectedStructureTypes).join(","));
    }
    if (q) params.set("q", q);
    if (availOnly) params.set("availability", "available_only");
    if (verOnly) params.set("verified_only", "true");

    updateCapsuleSummaries({ grade, age, by, q, tFrom, tTo, availOnly, verOnly });
    renderActiveFilters({ grade, age, by, q, tFrom, tTo, availOnly, verOnly });

    if (exploreWhenMode === "camp") {
      await loadCampsUnified({ grade, age, by, q, availOnly, selectedMembers });
      return;
    }

    try {
      const data = await apiFetch(`/api/slots?${params.toString()}`);
      if (reqSeq !== latestLoadSeq) return;
      let loadedSlots = data.slots || [];
      if (refineBySelectedMembers) {
        const groupsByCode = new Map(getAudienceGroups().map((g) => [g.code, g]));
        loadedSlots = loadedSlots.filter((s) => {
          const matchesMember = selectedMembers.some((m) => memberMatchesAgeRange(m, s.age_min, s.age_max));
          const matchesAud = Array.from(selectedAudiences).some((code) => {
            const g = groupsByCode.get(code);
            if (!g) return false;
            const lo = s.age_min !== null && s.age_min !== undefined ? Number(s.age_min) : 0;
            const hi = s.age_max !== null && s.age_max !== undefined ? Number(s.age_max) : 110;
            const gMin = g.age_min !== undefined ? g.age_min : g.min;
            const gMax = g.age_max !== undefined ? g.age_max : g.max;
            return lo <= gMax && hi >= gMin;
          });
          return matchesMember || matchesAud;
        });
      }
      if (selectedBudgetMax !== null) {
        loadedSlots = loadedSlots.filter((s) => {
          if (s.annual_fee_min === null || s.annual_fee_min === undefined) return false;
          return Number(s.annual_fee_min) <= selectedBudgetMax;
        });
      }
      currentSlots = loadedSlots;
      slotsById = new Map(currentSlots.map((s) => [Number(s.id), s]));
      currentActivityGroups = buildActivityGroups(currentSlots);
      groupsByKey = new Map(currentActivityGroups.map((g) => [g.key, g]));
      if (selectedCategories.size === 0 && selectedDisciplines.size === 0) {
        updateCategoryRibbonCounts(currentSlots);
      }

      const eqPill = document.getElementById("audience-equiv-pill");
      const eqText = document.getElementById("audience-equiv-text");
      const p = data.person_profile;
      if (eqPill && eqText) {
        if (selectedAudiences.size === 0 && selectedMembers.length <= 1 && p && p.source_mode !== "any") {
          eqText.textContent = `Équivalence saison ${meta.season} : ${p.grade_label || ""} • ~${p.age} ans • né(e) autour de ${p.birth_year}`;
          eqPill.classList.remove("hidden");
        } else {
          eqPill.classList.add("hidden");
        }
      }

      updateResultsSummary();
      updatePopoverResultCtas(currentSlots.length);
      updateSearchApplyCta(currentSlots.length);
      renderDisciplineDrilldown();
      renderCurrentView();
    } catch (err) {
      if (reqSeq !== latestLoadSeq) return;
      showToast(err.message || "Erreur lors du chargement des créneaux", "error");
    }
  }

  async function loadCampsUnified({ grade, age, by, q, availOnly, selectedMembers }) {
    const reqSeq = ++latestCampsLoadSeq;
    campsLoadedOnce = true;

    const params = new URLSearchParams();
    if (selectedCampPeriods.size > 0) {
      params.set("periods", Array.from(selectedCampPeriods).join(","));
    }

    const audienceUnion = new Set(selectedAudiences);
    if (selectedMembers && selectedMembers.length > 0) {
      selectedMembers.forEach((m) => {
        const gCode = ageToAudienceGroupCode(resolveMemberAge(m));
        if (gCode) audienceUnion.add(gCode);
      });
    } else if (grade && GRADE_DEFAULT_AGES[grade]) {
      const gCode = ageToAudienceGroupCode(GRADE_DEFAULT_AGES[grade]);
      if (gCode) audienceUnion.add(gCode);
    } else if (age) {
      const gCode = ageToAudienceGroupCode(Number(age));
      if (gCode) audienceUnion.add(gCode);
    } else if (by) {
      const approxAge = (meta && meta.season_start_year ? meta.season_start_year : 2026) - Number(by);
      const gCode = ageToAudienceGroupCode(approxAge);
      if (gCode) audienceUnion.add(gCode);
    }
    if (audienceUnion.size > 0) {
      params.set("audiences", Array.from(audienceUnion).join(","));
    }

    selectedCategories.forEach((cat) => params.append("categories", cat));

    if (selectedCities.size > 0) {
      params.set("city_slugs", Array.from(selectedCities).join(","));
    } else {
      const territory = getActiveTerritory();
      if (territory.slugs.length > 0) {
        params.set("city_slugs", territory.slugs.join(","));
      }
    }
    if (q) params.set("q", q);

    const grid = document.getElementById("camps-grid");
    try {
      const data = await apiFetch(`/api/camps?${params.toString()}`);
      if (reqSeq !== latestCampsLoadSeq) return;
      let camps = data.camps || [];
      if (selectedStructureTypes.size > 0) {
        camps = camps.filter((c) => selectedStructureTypes.has(c.structure_type || "association"));
      }
      if (availOnly) {
        camps = camps.filter((c) => c.availability !== "full");
      }
      if (selectedBudgetMax !== null) {
        camps = camps.filter((c) => c.price_min !== null && c.price_min !== undefined && Number(c.price_min) <= selectedBudgetMax);
      }
      currentCamps = camps;
      campsById = new Map(currentCamps.map((c) => [Number(c.id), c]));
      if (selectedCategories.size === 0) {
        updateCategoryRibbonCounts(currentCamps);
      }
      updateResultsSummary();
      updatePopoverResultCtas(currentCamps.length);
      updateSearchApplyCta(currentCamps.length);
      renderCampsGrid(currentCamps);
    } catch (err) {
      if (reqSeq !== latestCampsLoadSeq) return;
      if (grid) {
        grid.innerHTML = `<div class="card"><strong>Impossible de charger les stages vacances.</strong><p class="muted">${escapeHtml(err.message)}</p></div>`;
      }
    }
  }

  function renderCurrentView() {
    document.getElementById("view-list").classList.toggle("hidden", currentView !== "list");
    document.getElementById("view-week").classList.toggle("hidden", currentView !== "week");
    document.getElementById("view-map").classList.toggle("hidden", currentView !== "map");

    if (currentView === "list") renderListView();
    else if (currentView === "week") renderWeekView();
    else renderMapView();
    updateMobileViewToggle();
    syncGroupingToggleUI();
  }

  /* =========================================================
   * Cartes calmes & regroupement par activité (anti-surcharge,
   * zéro prix en liste), Fiche Détail & Favoris / Listes
   * ========================================================= */

  function getActiveSingleMemberForSlot(s) {
    if (!s) return null;
    const selectedWhoList = Array.from(selectedWhoMemberIds).map(getMemberById).filter(Boolean);
    const matchingSelected = selectedWhoList.filter((m) => memberMatchesAgeRange(m, s.age_min, s.age_max));
    return selectedWhoList.length === 1
      ? selectedWhoList[0]
      : matchingSelected.length === 1
        ? matchingSelected[0]
        : null;
  }

  function buildAvailAlertHtml(avail) {
    if (avail === "limited") {
      return `<span class="avail-alert-pill limited">Dernières places</span>`;
    }
    if (avail === "full") {
      return `<span class="avail-alert-pill full">Complet</span>`;
    }
    return "";
  }

  function buildSlotCompatAndConflict(s) {
    const favItem = favorites.find((f) => Number(f.id) === Number(s.id)) || null;
    const activeMember = getActiveSingleMemberForSlot(s);
    const matchingMembers =
      isFamilyConfigured() && familyProfile.length
        ? familyProfile.filter((m) => memberMatchesAgeRange(m, s.age_min, s.age_max))
        : [];

    let compatPillsHtml = "";
    let conflictHtml = "";
    if (isFamilyConfigured() && familyProfile.length) {
      compatPillsHtml = matchingMembers
        .map(
          (m) =>
            `<span class="compat-pill"><span class="family-dot" style="background:${escapeHtml(m.color)};"></span>${escapeHtml(m.name)}</span>`
        )
        .join("");
      const checkMemberId = favItem && favItem.memberId
        ? favItem.memberId
        : activeMember
          ? activeMember.id
          : matchingMembers.length === 1
            ? matchingMembers[0].id
            : null;
      const conflict = checkMemberId ? getSlotConflictForMember(checkMemberId, s) : null;
      const conflictMember = checkMemberId ? getMemberById(checkMemberId) : null;
      if (conflict && conflictMember) {
        conflictHtml = `<span class="conflict-pill" title="Chevauche ${escapeHtml(conflict.title)}">⚠️ Conflit (${escapeHtml(conflictMember.name)})</span>`;
      }
    }
    return { favItem, activeMember, matchingMembers, compatPillsHtml, conflictHtml };
  }

  function pickRepresentativeSlotForGroup(group) {
    if (!group || !Array.isArray(group.slots) || !group.slots.length) return null;
    const inPlan = group.slots.find((s) => isFav(s.id));
    if (inPlan) return inPlan;
    if (selectedWhoMemberIds.size > 0) {
      const selectedMembers = Array.from(selectedWhoMemberIds).map(getMemberById).filter(Boolean);
      const matchSel = group.slots.find((s) => selectedMembers.some((m) => memberMatchesAgeRange(m, s.age_min, s.age_max)));
      if (matchSel) return matchSel;
    }
    if (isFamilyConfigured() && familyProfile.length) {
      const matchFam = group.slots.find((s) => familyProfile.some((m) => memberMatchesAgeRange(m, s.age_min, s.age_max)));
      if (matchFam) return matchFam;
    }
    return group.slots[0];
  }

  function summarizeGroupAudience(slots) {
    const labels = [];
    const seen = new Set();
    let minAge = null;
    let maxAge = null;
    slots.forEach((s) => {
      const lbl = String(s.audience_label || "").trim();
      if (lbl && !seen.has(normalizeText(lbl))) {
        seen.add(normalizeText(lbl));
        labels.push(lbl);
      }
      if (s.age_min !== null && s.age_min !== undefined) {
        const n = Number(s.age_min);
        if (Number.isFinite(n)) minAge = minAge === null ? n : Math.min(minAge, n);
      }
      if (s.age_max !== null && s.age_max !== undefined) {
        const n = Number(s.age_max);
        if (Number.isFinite(n)) maxAge = maxAge === null ? n : Math.max(maxAge, n);
      }
    });
    if (labels.length === 0) return "Tout public";
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} · ${labels[1]}`;
    if (minAge !== null && maxAge !== null) {
      if (minAge <= 5 && maxAge >= 60) return "Tout public";
      if (maxAge >= 90) return `Dès ${minAge} ans`;
      return `${minAge}–${maxAge} ans`;
    }
    return "Plusieurs publics";
  }

  function summarizeGroupVenue(slots) {
    const venues = [];
    const venueSeen = new Set();
    const cities = [];
    const citySeen = new Set();
    slots.forEach((s) => {
      const vn = String(s.venue_name || "").trim();
      const cn = String(s.city_name || "").trim();
      if (vn && !venueSeen.has(normalizeText(vn))) {
        venueSeen.add(normalizeText(vn));
        venues.push(vn);
      }
      if (cn && !citySeen.has(normalizeText(cn))) {
        citySeen.add(normalizeText(cn));
        cities.push(cn);
      }
    });
    const cityText = cities.length ? ` (${cities.slice(0, 2).join(", ")}${cities.length > 2 ? "…" : ""})` : "";
    if (!venues.length) return `Lieu à préciser${cityText}`;
    if (venues.length === 1) return `${venues[0]}${cityText}`;
    if (cities.length <= 1) return `${venues[0]} +${venues.length - 1}${cityText}`;
    return `${venues.length} lieux${cityText}`;
  }

  function buildActivityGroups(slots) {
    const map = new Map();
    let idx = 0;
    (slots || []).forEach((s) => {
      const key = `${s.organization_id || 0}::${normalizeText(s.discipline || s.title).trim()}`;
      if (!map.has(key)) {
        map.set(key, { key, slots: [], _idx: idx++ });
      }
      map.get(key).slots.push(s);
    });

    const familyOn = isFamilyConfigured() && familyProfile.length > 0;
    const interestCats = getInterestsContextForExplore().categories;

    const groups = Array.from(map.values()).map((entry) => {
      const sortedSlots = [...entry.slots].sort(
        (a, b) =>
          Number(a.day_of_week) - Number(b.day_of_week) ||
          String(a.start_time || "").localeCompare(String(b.start_time || "")) ||
          Number(a.id) - Number(b.id)
      );
      const first = sortedSlots[0];
      const uniqueTitles = new Set(sortedSlots.map((s) => normalizeText(s.title).trim()).filter(Boolean));
      const cleanTitle =
        sortedSlots.length === 1 || uniqueTitles.size <= 1
          ? first.title || first.discipline || "Activité"
          : first.discipline || first.title || "Activité";

      const daySet = new Set();
      let minStart = "";
      let maxEnd = "";
      sortedSlots.forEach((s) => {
        const d = Number(s.day_of_week);
        if (Number.isInteger(d) && d >= 0 && d <= 6) daySet.add(d);
        if (s.start_time && (!minStart || s.start_time < minStart)) minStart = s.start_time;
        if (s.end_time && (!maxEnd || s.end_time > maxEnd)) maxEnd = s.end_time;
      });
      const days = Array.from(daySet).sort((a, b) => a - b);
      const timeSpanLabel = minStart && maxEnd ? `${minStart}–${maxEnd}` : minStart || "";

      const matchingMembers = familyOn
        ? familyProfile.filter((m) => sortedSlots.some((s) => memberMatchesAgeRange(m, s.age_min, s.age_max)))
        : [];
      const cat = first.category || (Array.isArray(first.categories) && first.categories[0]) || "";
      const interestMatch = Boolean(cat && interestCats.has(cat));

      return {
        key: entry.key,
        _idx: entry._idx,
        slots: sortedSlots,
        first,
        title: cleanTitle,
        discipline: first.discipline || first.title || "",
        category: cat,
        organization_id: first.organization_id,
        organization_name: first.organization_name || "",
        days,
        timeSpanLabel,
        audienceSummary: summarizeGroupAudience(sortedSlots),
        venueSummary: summarizeGroupVenue(sortedSlots),
        matchingMembers,
        familyMatchCount: matchingMembers.length,
        interestMatch,
      };
    });

    const fq = document.getElementById("filter-q");
    const q = fq ? fq.value.trim() : "";
    const shouldDiversify = selectedCategories.size === 0 && selectedDisciplines.size === 0 && !q;
    if (!shouldDiversify) {
      return groups;
    }

    const catBuckets = new Map();
    groups.forEach((g) => {
      const catKey = normalizeText(g.category || "autre") || "autre";
      if (!catBuckets.has(catKey)) catBuckets.set(catKey, []);
      catBuckets.get(catKey).push(g);
    });

    const bucketArrays = Array.from(catBuckets.values()).map((bucket) => {
      if (!familyOn && interestCats.size === 0) return bucket;
      return [...bucket].sort((a, b) => {
        const famA = a.familyMatchCount > 0 ? 0 : 1;
        const famB = b.familyMatchCount > 0 ? 0 : 1;
        if (famA !== famB) return famA - famB;
        const intA = a.interestMatch ? 0 : 1;
        const intB = b.interestMatch ? 0 : 1;
        if (intA !== intB) return intA - intB;
        return a._idx - b._idx;
      });
    });

    const diversified = [];
    let round = 0;
    let added = true;
    while (added) {
      added = false;
      for (let i = 0; i < bucketArrays.length; i++) {
        if (round < bucketArrays[i].length) {
          diversified.push(bucketArrays[i][round]);
          added = true;
        }
      }
      round += 1;
    }
    return diversified;
  }

  function buildSlotCardHtml(s, { isWishlist = false } = {}) {
    const { favItem, activeMember, compatPillsHtml, conflictHtml } = buildSlotCompatAndConflict(s);
    const fav = Boolean(favItem);
    const favMember = favItem && favItem.memberId ? getMemberById(favItem.memberId) : null;
    const favColor = favMember ? favMember.color : "#105c97";
    const favMemberLabel = favMember ? favMember.name : "Moi";
    const liked = isWishlisted("slot", s.id);

    const vis = getDisciplineVisual(s.discipline, s.category, s.title);
    const availAlertHtml = buildAvailAlertHtml(s.availability);

    const levelSuffix =
      s.level && normalizeText(s.level) !== "tous niveaux"
        ? ` · ${escapeHtml(s.level)}`
        : "";

    const venueParts = [s.venue_name || "Lieu à préciser", s.city_name].filter(Boolean);
    const venueLabel = venueParts.join(" · ");

    const inPlannerPillHtml = fav
      ? `<span class="in-planner-pill" style="background:${escapeHtml(favColor)};">📅 ${escapeHtml(favMemberLabel)}</span>`
      : "";

    let ctaClass = fav ? "btn-primary" : "btn-outline";
    let ctaLabel = fav
      ? `✓ ${escapeHtml(favMemberLabel)}`
      : activeMember
        ? `+ ${escapeHtml(activeMember.name)}`
        : "+ Planning";
    if (isWishlist) {
      ctaClass = fav ? "btn-primary" : "btn-accent";
      ctaLabel = fav ? `✓ ${escapeHtml(favMemberLabel)}` : "📅 Passer au planning";
    }

    return `
      <article class="slot-card" tabindex="0" data-card-kind="slot" data-card-id="${s.id}">
        <div class="card-head-row">
          <div class="card-head-left">
            <span class="disc-badge" style="--cat-bg:${vis.bg};--cat-fg:${vis.fg};--cat-border:${vis.border};">
              <span class="disc-icon" aria-hidden="true">${vis.icon}</span>
              <span class="disc-name">${escapeHtml(vis.label)}</span>
            </span>
          </div>
          <div class="card-head-right">
            ${inPlannerPillHtml}
            <button
              type="button"
              class="heart-btn ${liked ? "active is-liked" : ""}"
              data-heart-kind="slot"
              data-heart-id="${s.id}"
              aria-label="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
              aria-pressed="${liked ? "true" : "false"}"
              title="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
            >${liked ? "❤️" : "🤍"}</button>
          </div>
        </div>

        <div class="card-identity">
          <h3 class="slot-title" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</h3>
          <div class="card-org" title="${escapeHtml(s.organization_name)}">${escapeHtml(s.organization_name)}</div>
        </div>

        <div class="card-facts">
          <div class="card-fact card-fact-schedule">
            <span class="card-fact-icon" aria-hidden="true">🗓️</span>
            <span class="card-fact-text"><strong>${escapeHtml(s.day_label)}</strong> ${escapeHtml(s.start_time)}–${escapeHtml(s.end_time)}</span>
          </div>
          <div class="card-calm-meta">
            <span>👤 ${escapeHtml(s.audience_label || "Tout public")}${levelSuffix}</span>
            <span aria-hidden="true">·</span>
            <span title="${escapeHtml(venueLabel)}">📍 ${escapeHtml(venueLabel)}</span>
          </div>
        </div>

        <div class="card-bottom-row">
          <div class="card-status-block">
            ${compatPillsHtml}
            ${conflictHtml}
            ${availAlertHtml}
          </div>
          <div class="card-cta-wrap">
            <button type="button" class="btn btn-xs card-plan-btn ${ctaClass}" data-fav-id="${s.id}">
              ${ctaLabel}
            </button>
          </div>
        </div>
      </article>`;
  }

  function buildGroupSlotRowHtml(s, groupTitle) {
    const { favItem, activeMember, compatPillsHtml, conflictHtml } = buildSlotCompatAndConflict(s);
    const fav = Boolean(favItem);
    const favMember = favItem && favItem.memberId ? getMemberById(favItem.memberId) : null;
    const favMemberLabel = favMember ? favMember.name : "Moi";
    const liked = isWishlisted("slot", s.id);
    const availAlertHtml = buildAvailAlertHtml(s.availability);

    const dayShort = (DAYS_FR[Number(s.day_of_week)] || s.day_label || "").slice(0, 3);
    const titleDiffers = groupTitle && normalizeText(s.title) !== normalizeText(groupTitle);
    const levelSuffix =
      s.level && normalizeText(s.level) !== "tous niveaux"
        ? ` · ${escapeHtml(s.level)}`
        : "";
    const venueParts = [s.venue_name, s.city_name].filter(Boolean);
    const venueText = venueParts.join(" · ");

    const ctaClass = fav ? "btn-primary" : "btn-outline";
    const ctaLabel = fav
      ? `✓ ${escapeHtml(favMemberLabel)}`
      : activeMember
        ? `+ ${escapeHtml(activeMember.name)}`
        : "+ Planning";

    return `
      <div class="group-slot-row" tabindex="0" data-card-kind="slot" data-card-id="${s.id}">
        <div class="group-slot-row-main">
          <div class="group-slot-row-time">
            <span>${escapeHtml(dayShort)} ${escapeHtml(s.start_time)}–${escapeHtml(s.end_time)}</span>
            ${titleDiffers ? `<span style="font-weight:500; color:var(--text-muted);"> · ${escapeHtml(s.title)}</span>` : ""}
            ${availAlertHtml}
          </div>
          <div class="group-slot-row-sub">
            <span>${escapeHtml(s.audience_label || "Tout public")}${levelSuffix}</span>
            ${venueText ? `<span>📍 ${escapeHtml(venueText)}</span>` : ""}
            ${compatPillsHtml}
            ${conflictHtml}
          </div>
        </div>
        <div class="card-cta-wrap">
          <button
            type="button"
            class="heart-btn ${liked ? "active is-liked" : ""}"
            data-heart-kind="slot"
            data-heart-id="${s.id}"
            aria-label="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
            aria-pressed="${liked ? "true" : "false"}"
            title="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
          >${liked ? "❤️" : "🤍"}</button>
          <button type="button" class="btn btn-xs card-plan-btn ${ctaClass}" data-fav-id="${s.id}">
            ${ctaLabel}
          </button>
        </div>
      </div>`;
  }

  function buildGroupDrawerRowsHtml(group) {
    return (group.slots || []).map((s) => buildGroupSlotRowHtml(s, group.title)).join("");
  }

  function buildGroupPlannerPillHtml(group) {
    const plannedSlots = (group.slots || []).filter((s) => isFav(s.id));
    if (!plannedSlots.length) return "";
    if (plannedSlots.length === 1) {
      const favItem = favorites.find((f) => Number(f.id) === Number(plannedSlots[0].id));
      const m = favItem && favItem.memberId ? getMemberById(favItem.memberId) : null;
      const color = m ? m.color : "#105c97";
      const label = m ? m.name : "Moi";
      return `<span class="in-planner-pill" style="background:${escapeHtml(color)};">📅 ${escapeHtml(label)}</span>`;
    }
    return `<span class="in-planner-pill" style="background:#105c97;">📅 ${plannedSlots.length} au planning</span>`;
  }

  function buildActivityGroupCardHtml(group) {
    if (!group || !group.slots || !group.slots.length) return "";
    if (group.slots.length === 1) {
      return buildSlotCardHtml(group.slots[0]);
    }

    const vis = getDisciplineVisual(group.discipline, group.category, group.title);
    const liked = group.slots.some((s) => isWishlisted("slot", s.id));
    const isExpanded = expandedActivityGroups.has(group.key);
    const inPlannerPillHtml = buildGroupPlannerPillHtml(group);

    const dayChipsHtml = group.days
      .map((d) => `<span class="group-day-chip">${escapeHtml((DAYS_FR[d] || "").slice(0, 3))}</span>`)
      .join("");
    const metaLabel = `${group.slots.length} créneaux${group.timeSpanLabel ? ` · ${group.timeSpanLabel}` : ""}`;

    const compatPillsHtml = group.matchingMembers
      .map(
        (m) =>
          `<span class="compat-pill"><span class="family-dot" style="background:${escapeHtml(m.color)};"></span>${escapeHtml(m.name)}</span>`
      )
      .join("");

    const allFull = group.slots.every((s) => s.availability === "full");
    const hasOpenOrUnknown = group.slots.some((s) => s.availability === "open" || !s.availability || s.availability === "unknown");
    const hasLimited = group.slots.some((s) => s.availability === "limited");
    const groupAvailAlertHtml = allFull
      ? `<span class="avail-alert-pill full">Complet</span>`
      : !hasOpenOrUnknown && hasLimited
        ? `<span class="avail-alert-pill limited">Dernières places</span>`
        : "";

    return `
      <article class="slot-card activity-group-card ${isExpanded ? "is-expanded" : ""}" tabindex="0" data-group-key="${escapeHtml(group.key)}">
        <div class="card-head-row">
          <div class="card-head-left">
            <span class="disc-badge" style="--cat-bg:${vis.bg};--cat-fg:${vis.fg};--cat-border:${vis.border};">
              <span class="disc-icon" aria-hidden="true">${vis.icon}</span>
              <span class="disc-name">${escapeHtml(vis.label)}</span>
            </span>
          </div>
          <div class="card-head-right">
            ${inPlannerPillHtml}
            <button
              type="button"
              class="heart-btn ${liked ? "active is-liked" : ""}"
              data-heart-group="${escapeHtml(group.key)}"
              aria-label="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
              aria-pressed="${liked ? "true" : "false"}"
              title="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
            >${liked ? "❤️" : "🤍"}</button>
          </div>
        </div>

        <div class="card-identity">
          <h3 class="slot-title" title="${escapeHtml(group.title)}">${escapeHtml(group.title)}</h3>
          <div class="card-org" title="${escapeHtml(group.organization_name)}">${escapeHtml(group.organization_name)}</div>
        </div>

        <div class="card-facts">
          <div class="group-day-chips">
            ${dayChipsHtml}
            <span class="group-slots-meta">${escapeHtml(metaLabel)}</span>
          </div>
          <div class="card-calm-meta">
            <span>👤 ${escapeHtml(group.audienceSummary)}</span>
            <span aria-hidden="true">·</span>
            <span title="${escapeHtml(group.venueSummary)}">📍 ${escapeHtml(group.venueSummary)}</span>
          </div>
        </div>

        <div class="card-bottom-row">
          <div class="card-status-block">
            ${compatPillsHtml}
            ${groupAvailAlertHtml}
          </div>
          <div class="card-cta-wrap">
            <button
              type="button"
              class="group-expand-btn ${isExpanded ? "expanded" : ""}"
              data-toggle-group="${escapeHtml(group.key)}"
              aria-expanded="${isExpanded ? "true" : "false"}"
            >${isExpanded ? "Masquer ▲" : `Voir les ${group.slots.length} créneaux ▾`}</button>
          </div>
        </div>

        <div class="group-slots-drawer${isExpanded ? "" : " hidden"}"${isExpanded ? ' data-populated="1"' : ""}>
          ${isExpanded ? buildGroupDrawerRowsHtml(group) : ""}
        </div>
      </article>`;
  }

  function buildCampCardHtml(c) {
    const liked = isWishlisted("camp", c.id);
    const vis = getDisciplineVisual(c.discipline, c.category, c.title);
    const availAlertHtml = buildAvailAlertHtml(c.availability);
    const periodCls = c.holiday_period === "Toutes vacances" ? "badge-period-all" : "badge-period";
    const linkUrl = c.source_url || c.registration_url || c.organization_website || "";

    let compatPillsHtml = "";
    if (isFamilyConfigured() && familyProfile.length) {
      const matching = familyProfile.filter((m) => memberMatchesAgeRange(m, c.age_min, c.age_max));
      if (matching.length) {
        compatPillsHtml = matching
          .map(
            (m) =>
              `<span class="compat-pill"><span class="family-dot" style="background:${escapeHtml(m.color)};"></span>${escapeHtml(m.name)}</span>`
          )
          .join("");
      }
    }

    const scheduleParts = [];
    if (c.dates_label) scheduleParts.push(`<strong>${escapeHtml(c.dates_label)}</strong>`);
    else if (c.holiday_period) scheduleParts.push(`<strong>${escapeHtml(c.holiday_period)}</strong>`);
    if (c.format_label) scheduleParts.push(escapeHtml(c.format_label));
    const scheduleHtml = scheduleParts.join(" · ") || "<strong>Vacances scolaires</strong>";

    const venueParts = [c.venue_name || "Lieu à préciser", c.city_name].filter(Boolean);
    const venueLabel = venueParts.join(" · ");

    return `
      <article class="slot-card camp-card" tabindex="0" data-card-kind="camp" data-card-id="${c.id}">
        <div class="card-head-row">
          <div class="card-head-left">
            <span class="disc-badge" style="--cat-bg:${vis.bg};--cat-fg:${vis.fg};--cat-border:${vis.border};">
              <span class="disc-icon" aria-hidden="true">${vis.icon}</span>
              <span class="disc-name">${escapeHtml(vis.label)}</span>
            </span>
            <span class="badge ${periodCls}">☀️ ${escapeHtml(c.holiday_period || "Vacances")}</span>
          </div>
          <div class="card-head-right">
            <button
              type="button"
              class="heart-btn ${liked ? "active is-liked" : ""}"
              data-heart-kind="camp"
              data-heart-id="${c.id}"
              aria-label="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
              aria-pressed="${liked ? "true" : "false"}"
              title="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
            >${liked ? "❤️" : "🤍"}</button>
          </div>
        </div>

        <div class="card-identity">
          <h3 class="slot-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</h3>
          <div class="card-org" title="${escapeHtml(c.organization_name)}">${escapeHtml(c.organization_name)}</div>
        </div>

        <div class="card-facts">
          <div class="card-fact card-fact-schedule">
            <span class="card-fact-icon" aria-hidden="true">🗓️</span>
            <span class="card-fact-text">${scheduleHtml}</span>
          </div>
          <div class="card-calm-meta">
            <span>👤 ${escapeHtml(c.audience_label || "Tout public")}</span>
            <span aria-hidden="true">·</span>
            <span title="${escapeHtml(venueLabel)}">📍 ${escapeHtml(venueLabel)}</span>
          </div>
        </div>

        <div class="card-bottom-row">
          <div class="card-status-block">
            ${compatPillsHtml}
            ${availAlertHtml}
          </div>
          <div class="card-cta-wrap">
            ${
              linkUrl
                ? `<a class="btn btn-primary btn-xs card-plan-btn" href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener">Inscription ↗</a>`
                : `<button type="button" class="btn btn-outline btn-xs card-plan-btn" data-open-detail="1">Détails</button>`
            }
          </div>
        </div>
      </article>`;
  }

  function patchCardStateInPlace(kind, itemId) {
    const itemKind = kind === "camp" ? "camp" : "slot";
    const numId = Number(itemId);
    const cards = document.querySelectorAll(`[data-card-kind="${itemKind}"][data-card-id="${numId}"]`);

    const liked = isWishlisted(itemKind, numId);
    const favItem = itemKind === "slot" ? favorites.find((f) => Number(f.id) === numId) || null : null;
    const fav = Boolean(favItem);
    const favMember = favItem && favItem.memberId ? getMemberById(favItem.memberId) : null;
    const favColor = favMember ? favMember.color : "#105c97";
    const favMemberLabel = favMember ? favMember.name : "Moi";
    const slotData = itemKind === "slot" ? slotsById.get(numId) || favItem : null;
    const activeMember = slotData ? getActiveSingleMemberForSlot(slotData) : null;

    cards.forEach((card) => {
      const heartBtn = card.querySelector(".heart-btn");
      if (heartBtn) {
        heartBtn.classList.toggle("active", liked);
        heartBtn.classList.toggle("is-liked", liked);
        heartBtn.setAttribute("aria-label", liked ? "Retirer des favoris" : "Ajouter aux favoris");
        heartBtn.setAttribute("aria-pressed", liked ? "true" : "false");
        heartBtn.setAttribute("title", liked ? "Retirer des favoris" : "Ajouter aux favoris");
        heartBtn.textContent = liked ? "❤️" : "🤍";
      }

      if (itemKind === "slot") {
        const isGroupRow = card.classList.contains("group-slot-row");
        if (!isGroupRow) {
          const headRight = card.querySelector(".card-head-right");
          if (headRight) {
            let pill = headRight.querySelector(".in-planner-pill");
            if (fav) {
              if (!pill) {
                pill = document.createElement("span");
                pill.className = "in-planner-pill";
                headRight.insertBefore(pill, headRight.firstChild);
              }
              pill.style.background = favColor;
              pill.textContent = `📅 ${favMemberLabel}`;
            } else if (pill) {
              pill.remove();
            }
          }
        }

        const ctaBtn = card.querySelector("[data-fav-id]");
        if (ctaBtn) {
          const isInWishlist = Boolean(card.closest("#wishlists-grid"));
          ctaBtn.classList.remove("btn-primary", "btn-outline", "btn-accent");
          if (isInWishlist) {
            ctaBtn.classList.add(fav ? "btn-primary" : "btn-accent");
            ctaBtn.textContent = fav ? `✓ ${favMemberLabel}` : "📅 Passer au planning";
          } else {
            ctaBtn.classList.add(fav ? "btn-primary" : "btn-outline");
            ctaBtn.textContent = fav
              ? `✓ ${favMemberLabel}`
              : activeMember
                ? `+ ${activeMember.name}`
                : "+ Planning";
          }
        }
      }
    });

    if (itemKind === "slot") {
      document.querySelectorAll(".activity-group-card[data-group-key]").forEach((groupCard) => {
        const gKey = groupCard.dataset.groupKey;
        const group = groupsByKey.get(gKey);
        if (!group || !group.slots.some((s) => Number(s.id) === numId)) return;

        const groupLiked = group.slots.some((s) => isWishlisted("slot", s.id));
        const gHeartBtn = groupCard.querySelector(".card-head-right .heart-btn");
        if (gHeartBtn) {
          gHeartBtn.classList.toggle("active", groupLiked);
          gHeartBtn.classList.toggle("is-liked", groupLiked);
          gHeartBtn.setAttribute("aria-label", groupLiked ? "Retirer des favoris" : "Ajouter aux favoris");
          gHeartBtn.setAttribute("aria-pressed", groupLiked ? "true" : "false");
          gHeartBtn.setAttribute("title", groupLiked ? "Retirer des favoris" : "Ajouter aux favoris");
          gHeartBtn.textContent = groupLiked ? "❤️" : "🤍";
        }

        const gHeadRight = groupCard.querySelector(".card-head-right");
        if (gHeadRight) {
          const existingPill = gHeadRight.querySelector(".in-planner-pill");
          const newPillHtml = buildGroupPlannerPillHtml(group);
          if (existingPill) existingPill.remove();
          if (newPillHtml) {
            gHeadRight.insertAdjacentHTML("afterbegin", newPillHtml);
          }
        }
      });
    }
  }

  function disconnectSlotsObserver() {
    if (slotsObserver) {
      slotsObserver.disconnect();
      slotsObserver = null;
    }
  }

  function appendNextSlotsPage() {
    const container = document.getElementById("view-list");
    if (!container) return;
    const isGrouped = listGroupingMode === "grouped";
    const items = isGrouped ? currentActivityGroups : currentSlots;
    const pageSize = getListPageSize();
    const unitLabel = isGrouped ? "activités" : "créneaux";

    if (renderedSlotsCount >= items.length) {
      disconnectSlotsObserver();
      const bar = document.getElementById("slots-pagination-bar");
      if (bar) bar.remove();
      return;
    }

    const nextSlice = items.slice(renderedSlotsCount, renderedSlotsCount + pageSize);
    const html = nextSlice
      .map((item) => (isGrouped ? buildActivityGroupCardHtml(item) : buildSlotCardHtml(item)))
      .join("");
    renderedSlotsCount += nextSlice.length;

    const bar = document.getElementById("slots-pagination-bar");
    if (bar) {
      bar.insertAdjacentHTML("beforebegin", html);
    } else {
      container.insertAdjacentHTML("beforeend", html);
    }

    const remaining = items.length - renderedSlotsCount;
    if (remaining <= 0) {
      disconnectSlotsObserver();
      if (bar) bar.remove();
    } else if (bar) {
      const btn = document.getElementById("load-more-slots-btn");
      const statusEl = bar.querySelector("[data-pagination-status]");
      if (btn) {
        btn.textContent = `Afficher ${Math.min(pageSize, remaining)} de plus (${remaining} restant${remaining > 1 ? "s" : ""})`;
      }
      if (statusEl) {
        statusEl.textContent = `${renderedSlotsCount} / ${items.length} ${unitLabel} affichés`;
      }
    }
  }

  function toggleActivityGroupDrawer(toggleBtn) {
    const gKey = toggleBtn.dataset.toggleGroup;
    const group = groupsByKey.get(gKey);
    const card = toggleBtn.closest(".activity-group-card");
    const drawer = card ? card.querySelector(".group-slots-drawer") : null;
    if (!group || !card || !drawer) return;

    const wasExpanded = expandedActivityGroups.has(gKey);
    if (wasExpanded) {
      expandedActivityGroups.delete(gKey);
      drawer.classList.add("hidden");
      card.classList.remove("is-expanded");
      toggleBtn.classList.remove("expanded");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.textContent = `Voir les ${group.slots.length} créneaux ▾`;
    } else {
      expandedActivityGroups.add(gKey);
      if (!drawer.dataset.populated) {
        drawer.innerHTML = buildGroupDrawerRowsHtml(group);
        drawer.dataset.populated = "1";
      }
      drawer.classList.remove("hidden");
      card.classList.add("is-expanded");
      toggleBtn.classList.add("expanded");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.textContent = "Masquer ▲";
    }
  }

  function bindDelegatedCardContainer(container, lookupFn) {
    if (!container || delegatedContainers.has(container)) return;
    delegatedContainers.add(container);

    container.addEventListener("click", (e) => {
      const emptyResetBtn = e.target.closest("[data-empty-reset]");
      if (emptyResetBtn) {
        e.stopPropagation();
        const panelCamps = document.getElementById("panel-camps");
        if (container.id === "camps-grid" && panelCamps && !panelCamps.classList.contains("hidden")) {
          resetCampsFilters();
        } else {
          resetAllFilters();
        }
        return;
      }

      const jumpBtn = e.target.closest("[data-jump-mode]");
      if (jumpBtn) {
        e.stopPropagation();
        switchMode(jumpBtn.dataset.jumpMode);
        return;
      }

      const loadMoreBtn = e.target.closest("#load-more-slots-btn");
      if (loadMoreBtn) {
        e.stopPropagation();
        appendNextSlotsPage();
        return;
      }

      const toggleGroupBtn = e.target.closest("[data-toggle-group]");
      if (toggleGroupBtn) {
        e.stopPropagation();
        toggleActivityGroupDrawer(toggleGroupBtn);
        return;
      }

      const heartGroupBtn = e.target.closest("[data-heart-group]");
      if (heartGroupBtn) {
        e.stopPropagation();
        const group = groupsByKey.get(heartGroupBtn.dataset.heartGroup);
        if (group) toggleGroupWishlist(group);
        return;
      }

      const heartBtn = e.target.closest("[data-heart-id]");
      if (heartBtn) {
        e.stopPropagation();
        const kind = heartBtn.dataset.heartKind || "slot";
        const id = Number(heartBtn.dataset.heartId);
        const item = lookupFn(kind, id);
        if (item) toggleWishlistItem(item, kind);
        return;
      }

      const favBtn = e.target.closest("[data-fav-id]");
      if (favBtn) {
        e.stopPropagation();
        const id = Number(favBtn.dataset.favId);
        const slot = lookupFn("slot", id);
        if (slot) toggleFav(slot);
        return;
      }

      const extLink = e.target.closest("a[href]");
      if (extLink) {
        if (
          !e.defaultPrevented &&
          window.AssoNative &&
          window.AssoNative.isCapacitor &&
          !(window.AP && window.AP.isStaticMode)
        ) {
          const href = extLink.getAttribute("href") || "";
          if (/^https?:\/\//i.test(href)) {
            e.preventDefault();
            window.AssoNative.openExternalUrl(href);
          }
        }
        return;
      }

      const slotRow = e.target.closest(".group-slot-row[data-card-id]");
      if (slotRow) {
        e.stopPropagation();
        const id = Number(slotRow.dataset.cardId);
        const item = lookupFn("slot", id);
        if (item) openDetailModal(item, "slot");
        return;
      }

      const groupCard = e.target.closest(".activity-group-card[data-group-key]");
      if (groupCard) {
        if (e.target.closest(".group-slots-drawer")) return;
        const group = groupsByKey.get(groupCard.dataset.groupKey);
        const rep = pickRepresentativeSlotForGroup(group);
        if (rep) openDetailModal(rep, "slot");
        return;
      }

      const card = e.target.closest(".slot-card[data-card-id]");
      if (card) {
        const kind = card.dataset.cardKind || "slot";
        const id = Number(card.dataset.cardId);
        const item = lookupFn(kind, id);
        if (item) openDetailModal(item, kind);
      }
    });

    container.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const target = e.target;
      if (!target || !target.matches) return;
      if (target.matches(".group-slot-row[data-card-id]")) {
        e.preventDefault();
        const id = Number(target.dataset.cardId);
        const item = lookupFn("slot", id);
        if (item) openDetailModal(item, "slot");
        return;
      }
      if (target.matches(".activity-group-card[data-group-key]")) {
        e.preventDefault();
        const group = groupsByKey.get(target.dataset.groupKey);
        const rep = pickRepresentativeSlotForGroup(group);
        if (rep) openDetailModal(rep, "slot");
        return;
      }
      if (target.matches(".slot-card[data-card-id]")) {
        e.preventDefault();
        const kind = target.dataset.cardKind || "slot";
        const id = Number(target.dataset.cardId);
        const item = lookupFn(kind, id);
        if (item) openDetailModal(item, kind);
      }
    });
  }

  function renderListView() {
    const container = document.getElementById("view-list");
    if (!container) return;
    disconnectSlotsObserver();
    renderedSlotsCount = 0;

    bindDelegatedCardContainer(container, (kind, id) => {
      if (kind === "slot") return slotsById.get(id) || null;
      return null;
    });

    if (!currentSlots.length) {
      container.innerHTML = `<div class="card"><strong>Aucun créneau ne correspond à ces critères.</strong><p class="muted">Essayez d'élargir les horaires ou de réinitialiser un filtre.</p><button type="button" class="btn btn-outline btn-sm mt-1" data-empty-reset="1">↺ Réinitialiser les filtres</button></div>`;
      return;
    }

    const isGrouped = listGroupingMode === "grouped";
    const items = isGrouped ? currentActivityGroups : currentSlots;
    const pageSize = getListPageSize();
    const unitLabel = isGrouped ? "activités" : "créneaux";

    const initialSlice = items.slice(0, pageSize);
    renderedSlotsCount = initialSlice.length;
    let html = initialSlice
      .map((item) => (isGrouped ? buildActivityGroupCardHtml(item) : buildSlotCardHtml(item)))
      .join("");

    const remaining = items.length - renderedSlotsCount;
    if (remaining > 0) {
      html += `
        <div id="slots-pagination-bar" class="slots-pagination-bar">
          <div id="slots-load-more-sentinel" aria-hidden="true" style="width:100%; height:1px;"></div>
          <span class="muted" data-pagination-status style="font-size:0.8rem;">${renderedSlotsCount} / ${items.length} ${unitLabel} affichés</span>
          <button type="button" id="load-more-slots-btn" class="btn btn-outline btn-sm">
            Afficher ${Math.min(pageSize, remaining)} de plus (${remaining} restant${remaining > 1 ? "s" : ""})
          </button>
        </div>`;
    }

    container.innerHTML = html;

    if (remaining > 0 && typeof IntersectionObserver === "function") {
      const sentinel = document.getElementById("slots-load-more-sentinel");
      if (sentinel) {
        slotsObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              appendNextSlotsPage();
            }
          },
          { rootMargin: "400px 0px" }
        );
        slotsObserver.observe(sentinel);
      }
    }
  }

  /* ---- Fiche Détail Modale ---- */
  async function focusVenueOnMap(item) {
    closeDetailModal();
    if (exploreWhenMode === "camp") {
      setExploreWhenMode("yearly", { reload: false });
    }
    currentView = "map";
    document.querySelectorAll("#view-switcher button").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === "map");
    });
    if (currentMode !== "simple") {
      switchMode("simple");
    } else {
      document.getElementById("view-list").classList.add("hidden");
      document.getElementById("view-week").classList.add("hidden");
      document.getElementById("view-map").classList.remove("hidden");
      updateMobileViewToggle();
    }
    await renderMapView();
    if (!leafletMap) return;
    leafletMap.invalidateSize();
    const key = item.venue_id || `unknown-${item.venue_name}`;
    const existingMarker = venueMarkersByKey.get(key);
    if (existingMarker) {
      const ll = existingMarker.getLatLng();
      leafletMap.setView(ll, 16);
      existingMarker.openPopup();
      return;
    }
    if (item.venue_lat && item.venue_lng && typeof window.L !== "undefined") {
      const lat = Number(item.venue_lat);
      const lng = Number(item.venue_lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        leafletMap.setView([lat, lng], 16);
        const popupHtml = `<strong>${escapeHtml(item.venue_name || item.title)}</strong><br/><small>${escapeHtml(item.venue_address || item.city_name || "")}</small>`;
        window.L.popup({ maxWidth: Math.min(280, Math.max(200, window.innerWidth - 64)) })
          .setLatLng([lat, lng])
          .setContent(popupHtml)
          .openOn(leafletMap);
      }
    }
  }

  function renderDetailModalBody() {
    if (!currentDetailContext) return;
    const { item, kind } = currentDetailContext;
    const isCamp = kind === "camp";
    const vis = getDisciplineVisual(item.discipline, item.category, item.title);
    const availMeta = getAvailabilityMeta(item.availability);
    const linkUrl = item.registration_url || item.source_url || item.organization_website || "";

    const topBadgeEl = document.getElementById("detail-modal-top-badge");
    const contentEl = document.getElementById("detail-modal-content");
    const footerEl = document.getElementById("detail-modal-footer");
    if (!topBadgeEl || !contentEl || !footerEl) return;

    const periodBadgeHtml = isCamp
      ? `<span class="badge ${item.holiday_period === "Toutes vacances" ? "badge-period-all" : "badge-period"}">☀️ ${escapeHtml(item.holiday_period || "Vacances")}</span>`
      : "";
    topBadgeEl.innerHTML = `
      <span class="disc-badge" style="--cat-bg:${vis.bg};--cat-fg:${vis.fg};--cat-border:${vis.border};">
        <span class="disc-icon" aria-hidden="true">${vis.icon}</span>
        <span class="disc-name">${escapeHtml(vis.label)}</span>
      </span>
      ${periodBadgeHtml}`;

    const itemCategories =
      Array.isArray(item.categories) && item.categories.length
        ? item.categories
        : item.category
          ? [item.category]
          : [];
    const catBadgesHtml = itemCategories
      .map((cat) => `<span class="badge badge-category">${escapeHtml(cat)}</span>`)
      .join("");

    // Infos clés
    let scheduleLabel = "🗓️ Horaire";
    let scheduleValue = "";
    let scheduleSub = "";
    if (isCamp) {
      scheduleLabel = "🗓️ Période & dates";
      scheduleValue = [item.holiday_period, item.dates_label].filter(Boolean).join(" · ") || "Vacances scolaires";
      scheduleSub = item.format_label || "";
    } else {
      scheduleValue = `${item.day_label || ""} · ${item.start_time || ""}–${item.end_time || ""}`;
      const durMin = slotDurationMinutes(item);
      scheduleSub = durMin ? `${formatHoursPerWeek(durMin)} / semaine` : "";
    }

    const priceValue = isCamp
      ? formatCampPrice(item.price_min, item.price_max)
      : formatFee(item.annual_fee_min, item.annual_fee_max);

    const venueFull = [item.venue_name || "Lieu à préciser", item.city_name].filter(Boolean).join(" · ");
    const canShowMap = Boolean(item.venue_lat && item.venue_lng) || !isCamp;
    const mapsQuery = item.venue_address
      ? [item.venue_name, item.venue_address, item.city_name].filter(Boolean).join(", ")
      : item.venue_lat && item.venue_lng
        ? `${item.venue_lat},${item.venue_lng}`
        : [item.venue_name, item.city_name].filter(Boolean).join(", ");
    const directionsUrl = mapsQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
      : "";

    // Autres créneaux du même club / discipline (navigation directe dans la fiche)
    let otherSlotsHtml = "";
    if (!isCamp && Array.isArray(currentSlots) && currentSlots.length > 0) {
      const targetOrg = String(item.organization_id || "");
      const targetDisc = normalizeText(item.discipline || item.title);
      let siblings = currentSlots.filter(
        (s) =>
          String(s.organization_id || "") === targetOrg &&
          normalizeText(s.discipline || s.title) === targetDisc
      );
      if (siblings.length > 0 && !siblings.some((s) => Number(s.id) === Number(item.id))) {
        siblings = [...siblings, item];
      }
      if (siblings.length > 1) {
        siblings = siblings.slice().sort(
          (a, b) =>
            Number(a.day_of_week) - Number(b.day_of_week) ||
            String(a.start_time || "").localeCompare(String(b.start_time || "")) ||
            Number(a.id) - Number(b.id)
        );
        const MAX_SIBLING_CHIPS = 12;
        const curIdx = siblings.findIndex((s) => Number(s.id) === Number(item.id));
        let visibleSiblings = siblings.slice(0, MAX_SIBLING_CHIPS);
        if (curIdx >= MAX_SIBLING_CHIPS) {
          const start = Math.min(Math.max(0, curIdx - 5), siblings.length - MAX_SIBLING_CHIPS);
          visibleSiblings = siblings.slice(start, start + MAX_SIBLING_CHIPS);
        }
        const countsByTime = new Map();
        visibleSiblings.forEach((sib) => {
          const tk = `${sib.day_of_week}::${sib.start_time || ""}`;
          countsByTime.set(tk, (countsByTime.get(tk) || 0) + 1);
        });
        const chipsHtml = visibleSiblings
          .map((sib) => {
            const isCurrent = Number(sib.id) === Number(item.id);
            const dayShort = (DAYS_FR[Number(sib.day_of_week)] || sib.day_label || "").slice(0, 3);
            const startShort = String(sib.start_time || "").slice(0, 5);
            const endShort = String(sib.end_time || "").slice(0, 5);
            const timePart = startShort && endShort ? `${startShort}–${endShort}` : startShort;
            const tk = `${sib.day_of_week}::${sib.start_time || ""}`;
            const disambig =
              (countsByTime.get(tk) || 0) > 1 ? sib.audience_label || sib.level || "" : "";
            const labelText = [dayShort, timePart, disambig].filter(Boolean).join(" · ");
            const tip = `${sib.day_label || dayShort} ${timePart}${sib.audience_label ? ` · ${sib.audience_label}` : ""}${sib.level && normalizeText(sib.level) !== "tous niveaux" ? ` · ${sib.level}` : ""}`;
            return `<button type="button" class="detail-other-slot-chip ${isCurrent ? "active" : ""}" data-detail-slot-id="${sib.id}" aria-current="${isCurrent ? "true" : "false"}" title="${escapeHtml(tip)}">${escapeHtml(labelText)}</button>`;
          })
          .join("");
        const moreNote =
          siblings.length > MAX_SIBLING_CHIPS
            ? `<span class="muted" style="font-size:0.74rem;">+${siblings.length - MAX_SIBLING_CHIPS} autres</span>`
            : "";
        otherSlotsHtml = `
          <div class="detail-other-slots">
            <span class="detail-info-label">Autres créneaux de cette activité (${siblings.length})</span>
            <div class="detail-other-slots-list">${chipsHtml}${moreNote}</div>
          </div>`;
      }
    }

    // Compatibilité foyer & conflits
    let compatBoxHtml = "";
    if (familyProfile.length) {
      const matchingMembers = isFamilyConfigured()
        ? familyProfile.filter((m) => memberMatchesAgeRange(m, item.age_min, item.age_max))
        : [];
      const pillsHtml = matchingMembers
        .map(
          (m) =>
            `<span class="compat-pill"><span class="family-dot" style="background:${escapeHtml(m.color)};"></span>${escapeHtml(m.name)}</span>`
        )
        .join("");

      const conflictLines = [];
      if (!isCamp) {
        const selectedMid = currentDetailContext.selectedMemberId;
        const memberToCheck = selectedMid ? getMemberById(selectedMid) : null;
        if (memberToCheck) {
          const conf = getSlotConflictForMember(memberToCheck.id, item);
          if (conf) {
            conflictLines.push(
              `<span class="conflict-pill">⚠️ Conflit pour ${escapeHtml(memberToCheck.name)} avec « ${escapeHtml(conf.title)} » (${escapeHtml(conf.start_time)}–${escapeHtml(conf.end_time)})</span>`
            );
          }
        }
      }

      if (pillsHtml || conflictLines.length) {
        compatBoxHtml = `
          <div class="detail-compat-box">
            ${
              pillsHtml
                ? `<div style="display:flex; align-items:center; flex-wrap:wrap; gap:0.35rem;"><span class="detail-info-label" style="margin-right:0.2rem;">Compatible foyer :</span>${pillsHtml}</div>`
                : ""
            }
            ${conflictLines.length ? `<div style="display:flex; flex-wrap:wrap; gap:0.35rem;">${conflictLines.join("")}</div>` : ""}
          </div>`;
      }
    }

    // Descriptions
    const actDesc = String(item.activity_description || "").trim();
    const orgDesc = String(item.organization_description || "").trim();
    const notes = String(item.notes || "").trim();
    const descParts = [];
    if (notes) {
      descParts.push(`<p><strong>Précision :</strong> ${escapeHtml(notes)}</p>`);
    }
    if (actDesc) {
      descParts.push(`<p>${escapeHtml(actDesc)}</p>`);
    }
    if (
      orgDesc &&
      normalizeText(orgDesc) !== normalizeText(actDesc) &&
      !normalizeText(actDesc).includes(normalizeText(orgDesc))
    ) {
      descParts.push(`<p class="slot-more-org"><strong>La structure :</strong> ${escapeHtml(orgDesc)}</p>`);
    }

    const descriptionSectionHtml = descParts.length
      ? `
        <div class="detail-section">
          <h3 class="detail-section-title">ℹ️ Présentation &amp; infos pratiques</h3>
          <div class="detail-description">${descParts.join("")}</div>
        </div>`
      : "";

    const emailLinkHtml = item.public_email
      ? `<a class="btn btn-outline btn-sm" href="mailto:${escapeHtml(item.public_email)}">✉️ Contacter</a>`
      : "";

    contentEl.innerHTML = `
      <div>
        <h2 class="detail-title">${escapeHtml(item.title)}</h2>
        <div class="detail-org">${escapeHtml(item.organization_name || "")}</div>
        <div class="detail-badges-row">
          ${availabilityBadge(item.availability)}
          ${structureTypeBadge(item.structure_type)}
          ${!isCamp ? verifiedBadge(item.is_verified_by_org) : ""}
          ${catBadgesHtml}
        </div>
      </div>

      <div class="detail-info-grid">
        <div class="detail-info-card">
          <span class="detail-info-label">${scheduleLabel}</span>
          <span class="detail-info-value">${escapeHtml(scheduleValue)}</span>
          ${scheduleSub ? `<span class="detail-info-sub">${escapeHtml(scheduleSub)}</span>` : ""}
        </div>
        <div class="detail-info-card">
          <span class="detail-info-label">💶 Tarif</span>
          <span class="detail-info-value">${escapeHtml(priceValue)}</span>
          <span class="detail-info-sub">
            <span class="avail-indicator"><span class="avail-dot ${availMeta.code}"></span>${escapeHtml(availMeta.label)}</span>
          </span>
        </div>
        <div class="detail-info-card detail-info-card-full">
          <span class="detail-info-label">👤 Public &amp; niveau</span>
          <span class="detail-info-value">${escapeHtml(item.audience_label || "Tout public")}${item.level ? ` · ${escapeHtml(item.level)}` : ""}</span>
        </div>
        <div class="detail-info-card detail-info-card-full">
          <span class="detail-info-label">📍 Lieu &amp; adresse</span>
          <span class="detail-info-value">${escapeHtml(venueFull)}</span>
          ${item.venue_address ? `<span class="detail-info-sub">${escapeHtml(item.venue_address)}</span>` : ""}
          ${
            canShowMap || directionsUrl
              ? `<div style="display:flex; gap:0.45rem; flex-wrap:wrap; margin-top:0.35rem;">
                  ${canShowMap ? `<button type="button" class="btn btn-outline btn-sm detail-map-btn" data-detail-map="1">🗺️ Voir sur la carte</button>` : ""}
                  ${directionsUrl ? `<a class="btn btn-outline btn-sm detail-map-btn" href="${escapeHtml(directionsUrl)}" target="_blank" rel="noopener" data-external-link="1">🧭 Itinéraire</a>` : ""}
                </div>`
              : ""
          }
        </div>
      </div>

      ${otherSlotsHtml}
      ${compatBoxHtml}
      ${descriptionSectionHtml}

      <div class="detail-secondary-actions">
        <div style="display:flex; gap:0.45rem; flex-wrap:wrap; align-items:center;">
          ${
            linkUrl
              ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener" data-external-link="1">Site / Inscription ↗</a>`
              : ""
          }
          ${emailLinkHtml}
          <button type="button" class="btn btn-outline btn-sm" data-detail-share="1">📤 Partager</button>
        </div>
        ${
          !isCamp
            ? `<button type="button" class="slot-more-report-btn server-only" data-detail-report="1">🚩 Signaler une erreur</button>`
            : ""
        }
      </div>`;

    // Barre basse fixe (Favori + Sélecteur membre + Ajouter/Retirer du planning)
    const liked = isWishlisted(kind, item.id);
    if (!isCamp) {
      const favItem = favorites.find((f) => Number(f.id) === Number(item.id)) || null;
      const inPlan = Boolean(favItem);
      const selectedMid = inPlan
        ? favItem.memberId || ""
        : currentDetailContext.selectedMemberId !== undefined
          ? currentDetailContext.selectedMemberId
          : getDefaultMemberIdForSlot(item);
      currentDetailContext.selectedMemberId = selectedMid;

      footerEl.innerHTML = `
        <button
          type="button"
          class="heart-btn ${liked ? "active is-liked" : ""}"
          data-detail-heart="1"
          aria-label="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
          aria-pressed="${liked ? "true" : "false"}"
          title="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
        >${liked ? "❤️" : "🤍"}</button>
        <select class="detail-member-select" data-detail-member-select="1" aria-label="Membre du foyer">
          ${buildMemberOptionsHtml(selectedMid)}
        </select>
        <button
          type="button"
          class="btn detail-plan-cta ${inPlan ? "btn-outline" : "btn-primary"}"
          data-detail-plan-toggle="1"
        >
          ${inPlan ? "✓ Retirer" : "+ Planning"}
        </button>`;
    } else {
      footerEl.innerHTML = `
        <button
          type="button"
          class="heart-btn ${liked ? "active is-liked" : ""}"
          data-detail-heart="1"
          aria-label="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
          aria-pressed="${liked ? "true" : "false"}"
          title="${liked ? "Retirer des favoris" : "Ajouter aux favoris"}"
        >${liked ? "❤️" : "🤍"}</button>
        ${
          linkUrl
            ? `<a class="btn btn-primary detail-plan-cta" href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener" data-external-link="1">Site / Inscription ↗</a>`
            : `<button type="button" class="btn btn-outline detail-plan-cta" data-detail-close="1">Fermer</button>`
        }`;
    }

    // Bindings internes à la Fiche Détail
    contentEl.querySelectorAll("[data-detail-slot-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextId = Number(btn.getAttribute("data-detail-slot-id"));
        const nextSlot = slotsById.get(nextId) || currentSlots.find((s) => Number(s.id) === nextId);
        if (!nextSlot || Number(nextSlot.id) === Number(item.id)) return;
        const favNext = favorites.find((f) => Number(f.id) === Number(nextSlot.id)) || null;
        currentDetailContext = {
          item: nextSlot,
          kind: "slot",
          selectedMemberId: favNext ? favNext.memberId || "" : getDefaultMemberIdForSlot(nextSlot),
        };
        renderDetailModalBody();
        contentEl.scrollTop = 0;
      });
    });
    const mapBtn = contentEl.querySelector("[data-detail-map]");
    if (mapBtn) {
      mapBtn.addEventListener("click", () => focusVenueOnMap(item));
    }
    const shareBtn = contentEl.querySelector("[data-detail-share]");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        const summaryLines = [
          `${item.title}${item.organization_name ? ` — ${item.organization_name}` : ""}`,
          `🗓️ ${scheduleValue}`,
          venueFull ? `📍 ${venueFull}${item.venue_address ? ` (${item.venue_address})` : ""}` : "",
          priceValue ? `💶 ${priceValue}` : "",
        ].filter(Boolean);
        const sharePayload = {
          title: item.title || "Activité AssoPlanning",
          text: summaryLines.join("\n"),
        };
        if (linkUrl) {
          sharePayload.url = linkUrl;
        } else if (!(window.AssoNative && window.AssoNative.isCapacitor)) {
          sharePayload.url = window.location.href;
        }
        const res = window.AssoNative
          ? await window.AssoNative.shareContent(sharePayload)
          : { ok: false };
        if (res && res.ok && res.method === "clipboard") {
          showToast("Infos de l'activité copiées !", "success");
        } else if (res && !res.ok && !res.cancelled) {
          showToast("Partage indisponible sur cet appareil.", "info");
        }
      });
    }
    const reportBtn = contentEl.querySelector("[data-detail-report]");
    if (reportBtn) {
      reportBtn.addEventListener("click", () => {
        if (window.AssoSheets) {
          openReportModal(item, { replaceOverlay: true });
        } else {
          closeDetailModal();
          openReportModal(item);
        }
      });
    }
    contentEl.querySelectorAll("[data-external-link]").forEach((lnk) => {
      lnk.addEventListener("click", (e) => {
        if (
          !e.defaultPrevented &&
          window.AssoNative &&
          window.AssoNative.isCapacitor &&
          !(window.AP && window.AP.isStaticMode)
        ) {
          e.preventDefault();
          window.AssoNative.openExternalUrl(lnk.href);
        }
      });
    });
    footerEl.querySelectorAll("[data-external-link]").forEach((lnk) => {
      lnk.addEventListener("click", (e) => {
        if (
          !e.defaultPrevented &&
          window.AssoNative &&
          window.AssoNative.isCapacitor &&
          !(window.AP && window.AP.isStaticMode)
        ) {
          e.preventDefault();
          window.AssoNative.openExternalUrl(lnk.href);
        }
      });
    });
    const heartBtn = footerEl.querySelector("[data-detail-heart]");
    if (heartBtn) {
      heartBtn.addEventListener("click", () => toggleWishlistItem(item, kind));
    }
    const memberSel = footerEl.querySelector("[data-detail-member-select]");
    if (memberSel) {
      memberSel.addEventListener("change", () => {
        currentDetailContext.selectedMemberId = memberSel.value;
        if (isFav(item.id)) {
          setFavoriteMember(item.id, memberSel.value);
          const m = getMemberById(memberSel.value);
          showToast(m ? `Attribué à ${m.name}` : "Membre mis à jour", "success");
        } else {
          renderDetailModalBody();
        }
      });
    }
    const planBtn = footerEl.querySelector("[data-detail-plan-toggle]");
    if (planBtn) {
      planBtn.addEventListener("click", () => {
        toggleFav(item, currentDetailContext.selectedMemberId);
      });
    }
    const closeInlineBtn = footerEl.querySelector("[data-detail-close]");
    if (closeInlineBtn) {
      closeInlineBtn.addEventListener("click", closeDetailModal);
    }
  }

  function openDetailModal(item, kind = "slot") {
    if (!item) return;
    closeAllPopovers();
    const favItem = kind === "slot" ? favorites.find((f) => Number(f.id) === Number(item.id)) : null;
    currentDetailContext = {
      item,
      kind,
      selectedMemberId: favItem ? favItem.memberId || "" : getDefaultMemberIdForSlot(item),
    };
    renderDetailModalBody();
    if (window.AssoSheets) {
      window.AssoSheets.open("detail");
    } else {
      const backdrop = document.getElementById("detail-modal-backdrop");
      if (backdrop) {
        backdrop.classList.remove("hidden", "sheet-hidden");
        backdrop.classList.add("is-open");
        syncBodyModalClass();
      }
    }
  }

  function closeDetailModal() {
    currentDetailContext = null;
    if (window.AssoSheets) {
      if (window.AssoSheets.isOpen("detail")) {
        window.AssoSheets.close("detail");
      }
    } else {
      const backdrop = document.getElementById("detail-modal-backdrop");
      if (backdrop) {
        backdrop.classList.remove("is-open");
        backdrop.classList.add("hidden", "sheet-hidden");
        syncBodyModalClass();
      }
    }
  }

  function refreshDetailModalIfOpen() {
    const backdrop = document.getElementById("detail-modal-backdrop");
    const isOpen = window.AssoSheets
      ? window.AssoSheets.isOpen("detail")
      : Boolean(backdrop && !backdrop.classList.contains("hidden"));
    if (currentDetailContext && isOpen) {
      renderDetailModalBody();
    }
  }

  /* ---- Vue Onglet ❤️ Favoris / Listes ---- */
  function renderWishlistsView() {
    const tabsWrap = document.getElementById("wishlists-tabs");
    const grid = document.getElementById("wishlists-grid");
    if (!tabsWrap || !grid) return;

    const activeList = getActiveWishlist();
    tabsWrap.innerHTML = "";

    wishlistsData.lists.forEach((list) => {
      const isActive = list.id === activeList.id;
      const tab = document.createElement("div");
      tab.className = `wishlist-tab ${isActive ? "active" : ""}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = 0;

      const delHtml =
        wishlistsData.lists.length > 1
          ? `<button type="button" class="wishlist-tab-del" data-del-list="${escapeHtml(list.id)}" title="Supprimer cette liste" aria-label="Supprimer la liste ${escapeHtml(list.name)}">×</button>`
          : "";

      tab.innerHTML = `
        <span>❤️ ${escapeHtml(list.name)}</span>
        <span class="wishlist-tab-count">${(list.items || []).length}</span>
        ${delHtml}`;

      tab.addEventListener("click", (e) => {
        if (e.target.closest("[data-del-list]")) return;
        wishlistsData.activeListId = list.id;
        saveWishlists();
        renderWishlistsView();
      });
      tab.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          wishlistsData.activeListId = list.id;
          saveWishlists();
          renderWishlistsView();
        }
      });

      const delBtn = tab.querySelector("[data-del-list]");
      if (delBtn) {
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteWishlist(list.id);
        });
      }

      tabsWrap.appendChild(tab);
    });

    bindDelegatedCardContainer(grid, (kind, id) => {
      const itemsList = (getActiveWishlist() && getActiveWishlist().items) || [];
      const found = itemsList.find((entry) => entry.kind === kind && Number(entry.id) === id);
      return found ? found.data : null;
    });

    const items = activeList.items || [];
    if (!items.length) {
      grid.innerHTML = `
        <div class="card wishlist-empty-state">
          <h3 style="margin-top:0;">Votre liste « ${escapeHtml(activeList.name)} » est vide</h3>
          <p class="muted" style="max-width:500px; margin:0.4rem auto 1rem;">
            Appuyez sur le cœur <strong>🤍</strong> sur n'importe quelle activité ou stage pour sauvegarder vos idées, puis passez-les en 1 clic dans votre planning.
          </p>
          <div style="display:flex; gap:0.55rem; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" data-jump-mode="simple">🔍 Explorer les activités</button>
            <button type="button" class="btn btn-outline" data-jump-mode="camps">☀️ Voir les stages</button>
          </div>
        </div>`;
      return;
    }

    grid.innerHTML = items
      .map((entry) =>
        entry.kind === "camp"
          ? buildCampCardHtml(entry.data)
          : buildSlotCardHtml(entry.data, { isWishlist: true })
      )
      .join("");
  }

  function renderWeekView() {
    const container = document.getElementById("view-week");
    if (!delegatedContainers.has(container)) {
      delegatedContainers.add(container);
      container.addEventListener("click", (e) => {
        const el = e.target.closest("[data-week-slot-id]");
        if (!el) return;
        const slot = slotsById.get(Number(el.dataset.weekSlotId));
        if (slot) openDetailModal(slot, "slot");
      });
    }
    const hasSunday = currentSlots.some((s) => s.day_of_week === 6);
    container.classList.toggle("has-sunday", hasSunday);
    const dayCount = hasSunday ? 7 : 6;
    const cols = [];
    for (let d = 0; d < dayCount; d++) {
      const daySlots = currentSlots.filter((s) => s.day_of_week === d);
      const itemsHtml = daySlots.length
        ? daySlots
            .map((s) => {
              const vis = getDisciplineVisual(s.discipline, s.category, s.title);
              return `
          <div class="week-item ${s.availability === "full" ? "full" : ""}" data-week-slot-id="${s.id}" style="cursor:pointer;">
            <div style="font-weight:700;">${vis.icon} ${escapeHtml(s.start_time)}–${escapeHtml(s.end_time)}</div>
            <div style="font-weight:600;">${escapeHtml(s.title)}</div>
            <div class="muted">${escapeHtml(s.organization_name)}</div>
            <div>${escapeHtml(s.audience_label)}</div>
            <div class="muted">📍 ${escapeHtml(s.venue_name)}</div>
            <div class="mt-1">${availabilityBadge(s.availability)}</div>
          </div>`;
            })
            .join("")
        : `<p class="muted" style="font-size:0.8rem;">Aucun créneau</p>`;
      cols.push(`
        <div class="week-col">
          <h3><span>${escapeHtml(DAYS_FR[d])}</span><span class="badge badge-source">${daySlots.length}</span></h3>
          ${itemsHtml}
        </div>`);
    }
    container.innerHTML = cols.join("");
  }

  function ensureLeafletLoaded() {
    if (typeof window.L !== "undefined") {
      return Promise.resolve(window.L);
    }
    if (leafletLoadPromise) {
      return leafletLoadPromise;
    }
    leafletLoadPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet-css="1"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        link.dataset.leafletCss = "1";
        document.head.appendChild(link);
      }
      const existingScript = document.querySelector('script[data-leaflet-js="1"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (typeof window.L !== "undefined") resolve(window.L);
          else {
            leafletLoadPromise = null;
            reject(new Error("Leaflet indisponible"));
          }
        });
        existingScript.addEventListener("error", () => {
          leafletLoadPromise = null;
          reject(new Error("Impossible de charger Leaflet"));
        });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.crossOrigin = "";
      script.dataset.leafletJs = "1";
      script.onload = () => {
        if (typeof window.L !== "undefined") {
          resolve(window.L);
        } else {
          leafletLoadPromise = null;
          reject(new Error("Leaflet indisponible"));
        }
      };
      script.onerror = () => {
        script.remove();
        leafletLoadPromise = null;
        reject(new Error("Impossible de charger Leaflet"));
      };
      document.head.appendChild(script);
    });
    return leafletLoadPromise;
  }

  async function renderMapView() {
    const byVenue = new Map();
    currentSlots.forEach((s) => {
      const key = s.venue_id || `unknown-${s.venue_name}`;
      if (!byVenue.has(key)) {
        byVenue.set(key, {
          key,
          name: s.venue_name,
          address: s.venue_address,
          city: s.city_name,
          lat: s.venue_lat,
          lng: s.venue_lng,
          slots: [],
        });
      }
      byVenue.get(key).slots.push(s);
    });

    const fallbackEl = document.getElementById("map-fallback-list");
    if (!delegatedContainers.has(fallbackEl)) {
      delegatedContainers.add(fallbackEl);
      fallbackEl.addEventListener("click", (e) => {
        const row = e.target.closest("[data-map-slot-id]");
        if (!row) return;
        const slot = slotsById.get(Number(row.dataset.mapSlotId));
        if (slot) openDetailModal(slot, "slot");
      });
    }
    fallbackEl.innerHTML = Array.from(byVenue.values())
      .map(
        (v) => `
      <div class="card">
        <div class="flex-between">
          <strong>📍 ${escapeHtml(v.name)}</strong>
          <span class="badge badge-verified">${v.slots.length} créneau${v.slots.length > 1 ? "x" : ""}</span>
        </div>
        <div class="muted" style="font-size:0.84rem; margin:0.25rem 0 0.6rem;">${escapeHtml(v.address || v.city)}</div>
        ${v.slots
          .slice(0, 6)
          .map(
            (s) =>
              `<div style="font-size:0.82rem; padding:0.2rem 0; border-top:1px solid var(--surface-alt); cursor:pointer;" data-map-slot-id="${s.id}">
                <strong>${escapeHtml(s.day_label)} ${escapeHtml(s.start_time)}</strong> — ${escapeHtml(s.title)} (${escapeHtml(s.audience_label)})
              </div>`
          )
          .join("")}
      </div>`
      )
      .join("");

    const mapEl = document.getElementById("map-container");
    if (typeof window.L === "undefined") {
      if (!leafletMap && mapEl) {
        mapEl.innerHTML = `<div style="padding:2rem; text-align:center;" class="muted">Chargement de la carte interactive…</div>`;
      }
      await ensureLeafletLoaded().catch(() => null);
    }

    if (currentView !== "map" || currentMode !== "simple") return;

    if (typeof window.L === "undefined") {
      if (mapEl) {
        mapEl.innerHTML = `<div style="padding:2rem; text-align:center;" class="muted">Carte interactive OpenStreetMap indisponible hors-ligne. Consultez la répartition par équipement ci-dessous.</div>`;
      }
      return;
    }

    if (!leafletMap) {
      if (mapEl) mapEl.innerHTML = "";
      const territory = getActiveTerritory();
      const center = territory && territory.center ? [territory.center.lat, territory.center.lng] : [48.9465, 2.1425];
      const zoom = territory && territory.center ? territory.center.zoom : 14;
      leafletMap = window.L.map("map-container").setView(center, zoom);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(leafletMap);
      markersLayer = window.L.layerGroup().addTo(leafletMap);
    }
    setTimeout(() => leafletMap && leafletMap.invalidateSize(), 80);
    markersLayer.clearLayers();
    venueMarkersByKey = new Map();

    const popupMaxWidth = Math.min(280, Math.max(200, window.innerWidth - 64));
    const bounds = [];
    byVenue.forEach((v) => {
      if (v.lat && v.lng) {
        const popupHtml = `<strong>${escapeHtml(v.name)}</strong><br/><small>${escapeHtml(v.address || v.city)}</small><br/><strong>${v.slots.length} créneau(x)</strong>`;
        const marker = window.L.marker([v.lat, v.lng]).bindPopup(popupHtml, { maxWidth: popupMaxWidth }).addTo(markersLayer);
        venueMarkersByKey.set(v.key, marker);
        bounds.push([v.lat, v.lng]);
      }
    });
    if (bounds.length > 0) {
      leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    } else {
      centerMapOnTerritory();
    }
  }

  function renderFamilyMembers() {
    const container = document.getElementById("family-members-list");
    container.innerHTML = familyMembers
      .map((m, idx) => {
        const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
        const gradeOptions = (meta.grades || [])
          .map(
            (g) =>
              `<option value="${escapeHtml(g.code)}" ${m.grade === g.code ? "selected" : ""}>${escapeHtml(g.label)}</option>`
          )
          .join("");
        const catOptions = (meta.categories || [])
          .map(
            (c) => `<option value="${escapeHtml(c)}" ${m.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`
          )
          .join("");

        return `
        <div class="family-member-row" style="border-left: 4px solid ${color};" data-member-idx="${idx}">
          <div>
            <label>Prénom / profil</label>
            <input type="text" data-field="name" value="${escapeHtml(m.name)}" />
          </div>
          <div>
            <label>Âge</label>
            <input type="number" min="2" max="99" data-field="age" value="${escapeHtml(m.age)}" placeholder="8" />
          </div>
          <div>
            <label>Classe</label>
            <select data-field="grade">
              <option value="">(ou choisir classe)</option>
              ${gradeOptions}
            </select>
          </div>
          <div>
            <label>Année naiss.</label>
            <input type="number" min="1930" max="2025" data-field="birth_year" value="${escapeHtml(m.birth_year)}" placeholder="2018" />
          </div>
          <div>
            <label>Catégorie (optionnel)</label>
            <select data-field="category">
              <option value="">Toutes</option>
              ${catOptions}
            </select>
          </div>
          <div>
            ${
              familyMembers.length > 2
                ? `<button type="button" class="btn btn-outline btn-sm" data-remove-member="${idx}">Retirer</button>`
                : ""
            }
          </div>
        </div>`;
      })
      .join("");

    container.querySelectorAll(".family-member-row").forEach((row) => {
      const idx = Number(row.dataset.memberIdx);
      row.querySelectorAll("[data-field]").forEach((input) => {
        input.addEventListener("change", () => {
          const field = input.dataset.field;
          familyMembers[idx][field] = input.value;
          if (field === "age" && input.value) {
            familyMembers[idx].grade = "";
            familyMembers[idx].birth_year = "";
            renderFamilyMembers();
          } else if (field === "grade" && input.value) {
            familyMembers[idx].age = "";
            familyMembers[idx].birth_year = "";
            renderFamilyMembers();
          } else if (field === "birth_year" && input.value) {
            familyMembers[idx].age = "";
            familyMembers[idx].grade = "";
            renderFamilyMembers();
          }
        });
      });
    });

    container.querySelectorAll("[data-remove-member]").forEach((btn) => {
      btn.addEventListener("click", () => {
        familyMembers.splice(Number(btn.dataset.removeMember), 1);
        renderFamilyMembers();
      });
    });
  }

  async function runFamilyCombos() {
    const out = document.getElementById("family-combos-output");
    out.innerHTML = `<div class="card">Recherche des meilleures combinaisons familiales...</div>`;

    const activeSlugs = selectedCities.size > 0 ? Array.from(selectedCities) : getActiveTerritory().slugs;
    const payload = {
      members: familyMembers.map((m) => ({
        name: m.name || "Membre",
        age: m.age ? Number(m.age) : null,
        grade: m.grade || null,
        birth_year: m.birth_year ? Number(m.birth_year) : null,
        category: m.category || null,
      })),
      day_of_week: document.getElementById("family-day").value !== "" ? Number(document.getElementById("family-day").value) : null,
      time_from: document.getElementById("family-time-from").value || null,
      time_to: document.getElementById("family-time-to").value || null,
      max_walk_minutes: Number(document.getElementById("family-walk").value || 15),
      city_slug: activeSlugs.length === 1 ? activeSlugs[0] : null,
    };

    const data = await apiFetch("/api/family-combos", { method: "POST", body: payload });
    if (activeSlugs.length > 1 && Array.isArray(data.combos)) {
      const allowedSet = new Set(activeSlugs);
      data.combos = data.combos.filter(
        (c) => Array.isArray(c.items) && c.items.every((item) => !item.slot || !item.slot.city_slug || allowedSet.has(item.slot.city_slug))
      );
      data.combos_count = data.combos.length;
    }

    const summaryHtml = `
      <div class="grid-${Math.min(4, data.members.length)} mb-2">
        ${data.members
          .map(
            (m, i) => `
          <div class="card" style="border-top: 4px solid ${MEMBER_COLORS[i % MEMBER_COLORS.length]};">
            <strong>${escapeHtml(m.name)}</strong>
            <div class="muted" style="font-size:0.82rem;">${escapeHtml(m.profile.grade_label || "Tous âges")}</div>
            <div class="mt-1"><span class="badge badge-verified">${m.matching_count} créneau(x) possible(s)</span></div>
          </div>`
          )
          .join("")}
      </div>`;

    if (!data.combos.length) {
      out.innerHTML =
        summaryHtml +
        `<div class="card"><strong>Aucune combinaison trouvée dans ce créneau horaire / rayon à pied.</strong><p class="muted">Essayez d'augmenter la plage horaire ou le temps de marche maximum.</p></div>`;
      return;
    }

    const combosHtml = data.combos
      .map(
        (c, idx) => `
      <div class="combo-card">
        <div class="flex-between mb-1">
          <div>
            <span class="badge ${c.same_venue ? "badge-open" : "badge-verified"}">
              ${c.same_venue ? "★ Même lieu !" : c.walk_minutes !== null ? `🚶 ${c.walk_minutes} min à pied max` : "Lieu à vérifier"}
            </span>
            <strong style="margin-left:0.4rem;">${escapeHtml(c.summary)}</strong>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-add-combo="${idx}">★ Ajouter ce combo au Planning Famille</button>
        </div>
        <div class="grid-${Math.min(4, c.items.length)}">
          ${c.items
            .map(
              (item, mIdx) => `
            <div style="background:var(--surface-alt); border-radius:8px; padding:0.65rem; border-left:3px solid ${MEMBER_COLORS[mIdx % MEMBER_COLORS.length]};">
              <div style="font-size:0.78rem; font-weight:700; color:${MEMBER_COLORS[mIdx % MEMBER_COLORS.length]};">${escapeHtml(item.member_name)}</div>
              <div style="font-weight:700; font-size:0.92rem;">${escapeHtml(item.slot.title)}</div>
              <div style="font-size:0.82rem;">${escapeHtml(item.slot.start_time)}–${escapeHtml(item.slot.end_time)} • ${escapeHtml(item.slot.organization_name)}</div>
              <div class="muted" style="font-size:0.8rem;">📍 ${escapeHtml(item.slot.venue_name)}</div>
            </div>`
            )
            .join("")}
        </div>
      </div>`
      )
      .join("");

    out.innerHTML = summaryHtml + `<h3 class="mb-1">${data.combos_count} meilleures combinaisons</h3>` + combosHtml;

    out.querySelectorAll("[data-add-combo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const combo = data.combos[Number(btn.dataset.addCombo)];
        combo.items.forEach((item) => {
          const member = ensureFamilyMemberByName(item.member_name);
          const existing = favorites.find((f) => f.id === item.slot.id);
          if (existing) {
            existing.memberId = member.id;
          } else {
            favorites.push({ ...item.slot, memberId: member.id });
          }
        });
        saveFavorites();
        renderFavoritesDrawer();
        if (currentMode === "planner") renderPlannerView();
        showToast("Combo ajouté au Planning Famille !", "success");
      });
    });
  }

  /* =========================================================
   * Mon Planning Famille — Logique, Conflits, Stats & Grille
   * ========================================================= */

  function parseTimeMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return null;
    const parts = timeStr.split(":");
    if (parts.length < 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }

  function slotDurationMinutes(slot) {
    const start = parseTimeMinutes(slot.start_time);
    const end = parseTimeMinutes(slot.end_time);
    if (start === null || end === null || end <= start) return 0;
    return end - start;
  }

  function formatHoursPerWeek(totalMinutes) {
    if (!totalMinutes) return "0h";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2, "0")}`;
  }

  function computeSlotsStats(slotsList) {
    let totalMinutes = 0;
    let feeMin = 0;
    let feeMax = 0;
    let knownFeeCount = 0;
    let unknownFeeCount = 0;

    slotsList.forEach((s) => {
      totalMinutes += slotDurationMinutes(s);
      if (s.annual_fee_min !== null && s.annual_fee_min !== undefined) {
        knownFeeCount += 1;
        const mn = Number(s.annual_fee_min) || 0;
        const mx = s.annual_fee_max !== null && s.annual_fee_max !== undefined ? Number(s.annual_fee_max) || mn : mn;
        feeMin += mn;
        feeMax += Math.max(mn, mx);
      } else {
        unknownFeeCount += 1;
      }
    });

    let budgetLabel = "—";
    if (knownFeeCount > 0) {
      budgetLabel = feeMax !== feeMin ? `${feeMin}–${feeMax} € / an` : `${feeMin} € / an`;
      if (unknownFeeCount > 0) {
        budgetLabel += ` (+${unknownFeeCount} sur dem.)`;
      }
    } else if (unknownFeeCount > 0) {
      budgetLabel = "Tarif sur demande";
    }

    return {
      count: slotsList.length,
      totalMinutes,
      hoursLabel: `${formatHoursPerWeek(totalMinutes)} / sem.`,
      budgetLabel,
    };
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
    const nLat1 = Number(lat1);
    const nLng1 = Number(lng1);
    const nLat2 = Number(lat2);
    const nLng2 = Number(lng2);
    if (![nLat1, nLng1, nLat2, nLng2].every(Number.isFinite)) return null;
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(nLat2 - nLat1);
    const dLng = toRad(nLng2 - nLng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function formatWalkDistance(meters) {
    if (meters === null || !Number.isFinite(meters)) return "distance non géocodée";
    const walkMin = Math.max(1, Math.round(meters / 75)); // ~4.5 km/h
    const distText = meters >= 1000 ? `${(meters / 1000).toFixed(1).replace(".", ",")} km` : `${meters} m`;
    return `${distText} · ~${walkMin} min à pied`;
  }

  function areDifferentVenues(a, b) {
    if (a.venue_id && b.venue_id) return a.venue_id !== b.venue_id;
    return normalizeText(a.venue_name) !== normalizeText(b.venue_name);
  }

  function analyzePlannerConflicts(slotsList) {
    const sameMemberConflicts = [];
    const logisticsWarnings = [];
    const conflictSlotIds = new Set();
    const logisticsSlotIds = new Set();

    for (let i = 0; i < slotsList.length; i++) {
      for (let j = i + 1; j < slotsList.length; j++) {
        const a = slotsList[i];
        const b = slotsList[j];
        if (a.day_of_week !== b.day_of_week) continue;
        if (!(a.start_time < b.end_time && b.start_time < a.end_time)) continue;

        const mA = getMemberById(a.memberId);
        const mB = getMemberById(b.memberId);
        const sameMember =
          (mA && mB && mA.id === mB.id) || (!mA && !mB);

        if (sameMember) {
          conflictSlotIds.add(a.id);
          conflictSlotIds.add(b.id);
          const who = mA ? mA.name : "Non attribué";
          sameMemberConflicts.push({
            who,
            day: a.day_label || DAYS_FR[a.day_of_week] || "",
            text: `${who} a 2 créneaux qui se chevauchent le ${a.day_label || DAYS_FR[a.day_of_week]} : « ${a.title} » (${a.start_time}–${a.end_time}) et « ${b.title} » (${b.start_time}–${b.end_time}).`,
          });
        } else if (areDifferentVenues(a, b)) {
          logisticsSlotIds.add(a.id);
          logisticsSlotIds.add(b.id);
          const meters = haversineMeters(a.venue_lat, a.venue_lng, b.venue_lat, b.venue_lng);
          const distInfo = formatWalkDistance(meters);
          const whoA = mA ? mA.name : "Non attribué";
          const whoB = mB ? mB.name : "Non attribué";
          logisticsWarnings.push({
            text: `Logistique ${a.day_label || DAYS_FR[a.day_of_week]} : ${whoA} (« ${a.title} » à ${a.venue_name}, ${a.start_time}–${a.end_time}) et ${whoB} (« ${b.title} » à ${b.venue_name}, ${b.start_time}–${b.end_time}) se chevauchent dans 2 lieux différents (${distInfo}).`,
          });
        }
      }
    }

    return { sameMemberConflicts, logisticsWarnings, conflictSlotIds, logisticsSlotIds };
  }

  function getFilteredPlannerSlots() {
    if (activePlannerMemberId === "all") return favorites;
    return favorites.filter((s) => s.memberId === activePlannerMemberId);
  }

  function renderPlannerSwatches() {
    const wrap = document.getElementById("planner-member-swatches");
    if (!wrap) return;
    wrap.innerHTML = "";
    PLANNER_COLOR_PALETTE.forEach((hex) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch";
      btn.style.background = hex;
      btn.dataset.color = hex;
      btn.title = hex;
      btn.addEventListener("click", () => {
        document.getElementById("planner-member-color").value = hex;
        syncSwatchSelection(hex);
      });
      wrap.appendChild(btn);
    });
  }

  function syncSwatchSelection(hex) {
    const target = String(hex || "").toLowerCase();
    document.querySelectorAll("#planner-member-swatches .color-swatch").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.color.toLowerCase() === target);
    });
  }

  function openMemberEditor(memberId) {
    const editor = document.getElementById("planner-member-editor");
    const idInput = document.getElementById("planner-member-id");
    const nameInput = document.getElementById("planner-member-name");
    const colorInput = document.getElementById("planner-member-color");
    const delBtn = document.getElementById("planner-member-delete-btn");

    const member = memberId ? getMemberById(memberId) : null;
    if (member) {
      idInput.value = member.id;
      nameInput.value = member.name;
      colorInput.value = member.color;
      syncSwatchSelection(member.color);
      delBtn.classList.remove("hidden");
    } else {
      const nextColor = getNextMemberColor();
      idInput.value = "";
      nameInput.value = "";
      colorInput.value = nextColor;
      syncSwatchSelection(nextColor);
      delBtn.classList.add("hidden");
    }
    editor.classList.remove("hidden");
    nameInput.focus();
  }

  function closeMemberEditor() {
    document.getElementById("planner-member-editor").classList.add("hidden");
  }

  function saveMemberFromEditor() {
    const id = document.getElementById("planner-member-id").value.trim();
    const name = document.getElementById("planner-member-name").value.trim();
    const color = document.getElementById("planner-member-color").value || "#105c97";

    if (!name) {
      showToast("Indiquez un nom pour ce membre.", "error");
      return;
    }

    if (id) {
      const existing = getMemberById(id);
      if (existing) {
        existing.name = name;
        existing.color = color;
      }
      showToast(`Membre « ${name} » mis à jour.`, "success");
    } else {
      const newMember = {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        color,
        grade: "",
        age: "",
      };
      familyProfile.push(newMember);
      showToast(`Membre « ${name} » ajouté !`, "success");
    }
    saveFamilyProfile();
    closeMemberEditor();
    renderProfileFamilyRows();
    renderFamilyWhoPills();
    renderCampsFamilyPills();
    renderPlannerView();
    renderFavoritesDrawer();
  }

  function deleteMemberFromEditor() {
    const id = document.getElementById("planner-member-id").value.trim();
    if (!id) return;
    const member = getMemberById(id);
    familyProfile = familyProfile.filter((m) => m.id !== id);
    favorites.forEach((f) => {
      if (f.memberId === id) f.memberId = "";
    });
    if (activePlannerMemberId === id) {
      activePlannerMemberId = "all";
    }
    saveFamilyProfile();
    saveFavorites();
    closeMemberEditor();
    renderProfileFamilyRows();
    renderFamilyWhoPills();
    renderCampsFamilyPills();
    renderPlannerView();
    renderFavoritesDrawer();
    showToast(`Membre « ${member ? member.name : ""} » supprimé.`, "info");
  }

  function preparePlannerPrintHeader() {
    const sub = document.getElementById("planner-print-subtitle");
    if (!sub) return;
    const season = (meta && meta.season) || "2026-2027";
    const activeMember = activePlannerMemberId === "all" ? null : getMemberById(activePlannerMemberId);
    const scope = activeMember ? `Membre : ${activeMember.name}` : "Tout le foyer";
    const today = new Date().toLocaleDateString("fr-FR");
    sub.textContent = `Saison ${season} • ${scope} • Imprimé le ${today}`;
  }

  function renderPlannerMembersBar() {
    const bar = document.getElementById("planner-members-bar");
    bar.innerHTML = "";

    const allPill = document.createElement("button");
    allPill.type = "button";
    allPill.className = `member-pill ${activePlannerMemberId === "all" ? "active" : ""}`;
    allPill.innerHTML = `<span>Tout le foyer</span><span class="member-pill-count">${favorites.length}</span>`;
    allPill.addEventListener("click", () => {
      activePlannerMemberId = "all";
      renderPlannerView();
    });
    bar.appendChild(allPill);

    familyProfile.forEach((m) => {
      const count = favorites.filter((f) => f.memberId === m.id).length;
      const isActive = activePlannerMemberId === m.id;
      const pill = document.createElement("div");
      pill.className = `member-pill ${isActive ? "active" : ""}`;
      pill.setAttribute("role", "button");
      pill.tabIndex = 0;
      if (isActive) {
        pill.style.background = m.color;
        pill.style.borderColor = m.color;
      }
      pill.innerHTML = `
        <span class="member-dot" style="background:${escapeHtml(m.color)};"></span>
        <span>${escapeHtml(m.name)}</span>
        <span class="member-pill-count">${count}</span>
        <button type="button" class="member-pill-edit" data-edit-member="${escapeHtml(m.id)}" title="Modifier ou supprimer">✎</button>
      `;
      pill.addEventListener("click", (e) => {
        if (e.target.closest("[data-edit-member]")) return;
        activePlannerMemberId = m.id;
        renderPlannerView();
      });
      pill.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activePlannerMemberId = m.id;
          renderPlannerView();
        }
      });
      pill.querySelector("[data-edit-member]").addEventListener("click", (e) => {
        e.stopPropagation();
        openMemberEditor(m.id);
      });
      bar.appendChild(pill);
    });
  }

  function renderPlannerSummary(filteredSlots) {
    const wrap = document.getElementById("planner-summary");
    if (!favorites.length) {
      wrap.innerHTML = "";
      return;
    }

    const cards = [];
    const totalStats = computeSlotsStats(favorites);
    cards.push(`
      <div class="planner-stat-card total-card">
        <div class="planner-stat-title">
          <span>👨‍👩‍👧‍👦 Total Foyer</span>
          <span class="badge badge-verified">${totalStats.count} créneau${totalStats.count > 1 ? "x" : ""}</span>
        </div>
        <div class="planner-stat-metrics">
          <span>⏱ <strong>${escapeHtml(totalStats.hoursLabel)}</strong></span>
          <span>💶 <strong>${escapeHtml(totalStats.budgetLabel)}</strong></span>
        </div>
      </div>
    `);

    const membersToDisplay =
      activePlannerMemberId === "all"
        ? familyProfile
        : familyProfile.filter((m) => m.id === activePlannerMemberId);

    membersToDisplay.forEach((m) => {
      const mSlots = favorites.filter((f) => f.memberId === m.id);
      if (activePlannerMemberId === "all" && mSlots.length === 0) return;
      const st = computeSlotsStats(mSlots);
      cards.push(`
        <div class="planner-stat-card" style="border-top-color:${escapeHtml(m.color)};">
          <div class="planner-stat-title">
            <span style="display:inline-flex; align-items:center; gap:0.4rem;">
              <span class="member-dot" style="background:${escapeHtml(m.color)};"></span>
              ${escapeHtml(m.name)}
            </span>
            <span class="badge badge-source">${st.count}</span>
          </div>
          <div class="planner-stat-metrics">
            <span>⏱ <strong>${escapeHtml(st.hoursLabel)}</strong></span>
            <span>💶 <strong>${escapeHtml(st.budgetLabel)}</strong></span>
          </div>
        </div>
      `);
    });

    const unassigned = favorites.filter((f) => !getMemberById(f.memberId));
    if (activePlannerMemberId === "all" && unassigned.length > 0) {
      const st = computeSlotsStats(unassigned);
      cards.push(`
        <div class="planner-stat-card" style="border-top-color:#64748b;">
          <div class="planner-stat-title">
            <span>Non attribué</span>
            <span class="badge badge-source">${st.count}</span>
          </div>
          <div class="planner-stat-metrics">
            <span>⏱ <strong>${escapeHtml(st.hoursLabel)}</strong></span>
            <span>💶 <strong>${escapeHtml(st.budgetLabel)}</strong></span>
          </div>
        </div>
      `);
    }

    wrap.innerHTML = `<div class="planner-summary-grid">${cards.join("")}</div>`;
  }

  function renderPlannerAlerts(analysis) {
    const wrap = document.getElementById("planner-alerts");
    const items = [];
    analysis.sameMemberConflicts.forEach((c) => {
      items.push(`<div class="planner-alert planner-alert-danger"><span>⛔</span><div><strong>Conflit horaire :</strong> ${escapeHtml(c.text)}</div></div>`);
    });
    analysis.logisticsWarnings.forEach((w) => {
      items.push(`<div class="planner-alert planner-alert-warning"><span>⚠️</span><div><strong>Alerte logistique :</strong> ${escapeHtml(w.text)}</div></div>`);
    });

    if (!items.length) {
      wrap.classList.add("hidden");
      wrap.innerHTML = "";
      return;
    }
    wrap.classList.remove("hidden");
    wrap.innerHTML = items.join("");
  }

  function buildMemberOptionsHtml(selectedMemberId) {
    return (
      `<option value="">Non attribué</option>` +
      familyProfile
        .map(
          (m) =>
            `<option value="${escapeHtml(m.id)}" ${m.id === selectedMemberId ? "selected" : ""}>${escapeHtml(m.name)}</option>`
        )
        .join("")
    );
  }

  function renderPlannerMobileDays(filteredSlots) {
    const bar = document.getElementById("planner-mobile-days");
    if (!bar) return;
    if (!favorites.length) {
      bar.innerHTML = "";
      bar.classList.add("hidden");
      return;
    }
    bar.classList.remove("hidden");
    bar.innerHTML = "";

    const counts = [0, 0, 0, 0, 0, 0, 0];
    filteredSlots.forEach((s) => {
      const d = Number(s.day_of_week);
      if (d >= 0 && d < 7) counts[d] += 1;
    });

    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = `filter-chip planner-day-pill ${activePlannerMobileDay === "all" ? "active" : ""}`;
    allBtn.innerHTML = filteredSlots.length > 0
      ? `Tous <span class="member-pill-count planner-day-pill-count">${filteredSlots.length}</span>`
      : "Tous";
    allBtn.addEventListener("click", () => {
      activePlannerMobileDay = "all";
      renderPlannerView();
    });
    bar.appendChild(allBtn);

    DAYS_FR.forEach((label, d) => {
      const count = counts[d];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `filter-chip planner-day-pill ${activePlannerMobileDay === d ? "active" : ""}${count > 0 ? " has-slots" : ""}`;
      btn.title = label;
      btn.innerHTML = count > 0
        ? `${escapeHtml(label.slice(0, 3))} <span class="member-pill-count planner-day-pill-count">${count}</span>`
        : escapeHtml(label.slice(0, 3));
      btn.addEventListener("click", () => {
        activePlannerMobileDay = d;
        renderPlannerView();
      });
      bar.appendChild(btn);
    });
  }

  function renderPlannerView() {
    if (activePlannerMemberId !== "all" && !getMemberById(activePlannerMemberId)) {
      activePlannerMemberId = "all";
    }
    renderPlannerMembersBar();

    const filteredSlots = getFilteredPlannerSlots();
    const activeMember = activePlannerMemberId === "all" ? null : getMemberById(activePlannerMemberId);
    const labelEl = document.getElementById("planner-filter-label");
    labelEl.textContent = activeMember
      ? `Affichage : ${activeMember.name} (${filteredSlots.length} créneau${filteredSlots.length > 1 ? "x" : ""})`
      : `Affichage : Tout le foyer (${filteredSlots.length} créneau${filteredSlots.length > 1 ? "x" : ""})`;

    preparePlannerPrintHeader();
    renderPlannerSummary(filteredSlots);

    const analysis = analyzePlannerConflicts(filteredSlots);
    renderPlannerAlerts(analysis);
    renderPlannerMobileDays(filteredSlots);

    const grid = document.getElementById("planner-week-grid");
    if (!favorites.length) {
      grid.innerHTML = `
        <div class="card planner-empty-state">
          <h3 style="margin-top:0;">Votre planning familial est encore vide</h3>
          <p class="muted" style="max-width:520px; margin:0.4rem auto 1rem;">
            Cliquez sur <strong>« + Planning »</strong> depuis Explorer, sur <strong>« 📅 Passer au planning »</strong> depuis vos Favoris ❤️, ou ajoutez un combo fratrie.
          </p>
          <div style="display:flex; gap:0.55rem; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary" data-jump-mode="simple">🔍 Explorer les activités</button>
            <button type="button" class="btn btn-outline" data-jump-mode="wishlists">❤️ Voir mes favoris</button>
            <button type="button" class="btn btn-accent" data-jump-mode="family">🤝 Combos fratrie</button>
          </div>
        </div>`;
      grid.querySelectorAll("[data-jump-mode]").forEach((btn) => {
        btn.addEventListener("click", () => switchMode(btn.dataset.jumpMode));
      });
      return;
    }

    const isMobile = isMobileViewport();
    const daysToRender = [];
    if (isMobile) {
      if (activePlannerMobileDay !== "all") {
        daysToRender.push(Number(activePlannerMobileDay));
      } else {
        for (let d = 0; d < 7; d++) {
          if (filteredSlots.some((s) => Number(s.day_of_week) === d)) {
            daysToRender.push(d);
          }
        }
      }
    } else {
      for (let d = 0; d < 7; d++) {
        daysToRender.push(d);
      }
    }

    if (isMobile && daysToRender.length === 0) {
      grid.innerHTML = `
        <div class="card planner-empty-state">
          <strong>Aucun créneau pour ${escapeHtml(activeMember ? activeMember.name : "cette sélection")}.</strong>
          <p class="muted" style="margin:0.35rem 0 0;">Sélectionnez un autre membre ou ajoutez des activités depuis l'onglet Explorer.</p>
        </div>`;
      return;
    }

    const cols = [];
    daysToRender.forEach((d) => {
      const daySlots = filteredSlots
        .filter((s) => Number(s.day_of_week) === d)
        .sort((a, b) => String(a.start_time || "").localeCompare(String(b.start_time || "")));

      const emptyMsg = isMobile
        ? `<div class="muted" style="font-size:0.84rem; padding:0.45rem 0;">Aucun créneau prévu le ${escapeHtml(DAYS_FR[d])}.</div>`
        : `<div class="muted" style="font-size:0.78rem; padding:0.25rem 0;">Libre</div>`;

      const itemsHtml = daySlots.length
        ? daySlots
            .map((s) => {
              const member = getMemberById(s.memberId);
              const color = member ? member.color : "#64748b";
              const memberName = member ? member.name : "Non attribué";
              const hasConflict = analysis.conflictSlotIds.has(s.id);
              const hasLogistics = !hasConflict && analysis.logisticsSlotIds.has(s.id);
              const cardClasses = [
                "planner-slot-card",
                hasConflict ? "has-conflict" : "",
                hasLogistics ? "has-logistics-warn" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const vis = getDisciplineVisual(s.discipline, s.category, s.title);
              return `
                <div class="${cardClasses}" data-planner-card-id="${s.id}" style="border-left-color:${escapeHtml(color)}; cursor:pointer;">
                  <div class="planner-slot-top">
                    <span class="planner-slot-time">${vis.icon} ${escapeHtml(s.start_time)}–${escapeHtml(s.end_time)}</span>
                    <button type="button" class="planner-slot-remove" data-planner-rm="${s.id}" title="Retirer du planning">×</button>
                  </div>
                  <span class="planner-slot-member-badge" style="background:${escapeHtml(color)};">
                    ${escapeHtml(memberName)}${hasConflict ? " ⛔" : hasLogistics ? " ⚠️" : ""}
                  </span>
                  <div class="planner-slot-title">${escapeHtml(s.title)}</div>
                  <div class="planner-slot-org">${escapeHtml(s.organization_name)}</div>
                  <div class="planner-slot-venue">📍 ${escapeHtml(s.venue_name)}</div>
                  <select class="planner-slot-reassign" data-planner-reassign="${s.id}" aria-label="Changer le membre">
                    ${buildMemberOptionsHtml(s.memberId || "")}
                  </select>
                </div>`;
            })
            .join("")
        : emptyMsg;

      cols.push(`
        <div class="planner-day-col">
          <h3>
            <span>${escapeHtml(DAYS_FR[d])}</span>
            <span class="badge badge-source">${daySlots.length}</span>
          </h3>
          ${itemsHtml}
        </div>`);
    });

    grid.innerHTML = cols.join("");

    grid.querySelectorAll("[data-planner-card-id]").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button, select, option")) return;
        const id = Number(card.dataset.plannerCardId);
        const slot = favorites.find((f) => Number(f.id) === id);
        if (slot) openDetailModal(slot, "slot");
      });
    });

    grid.querySelectorAll("[data-planner-rm]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.plannerRm);
        const removedIdx = favorites.findIndex((f) => Number(f.id) === id);
        const removedEntry = removedIdx >= 0 ? { ...favorites[removedIdx] } : null;
        favorites = favorites.filter((f) => Number(f.id) !== id);
        if (window.AssoNative) {
          window.AssoNative.triggerHaptic("light");
        }
        saveFavorites();
        renderPlannerView();
        renderFavoritesDrawer();
        patchCardStateInPlace("slot", id);
        if (currentMode === "simple" && currentView !== "list") {
          renderCurrentView();
        }
        if (removedEntry) {
          showToast("Retiré du planning", "info", {
            actionLabel: "Annuler",
            onAction: () => {
              if (!isFav(removedEntry.id)) {
                const insertIdx = Math.min(Math.max(0, removedIdx), favorites.length);
                favorites.splice(insertIdx, 0, removedEntry);
                saveFavorites();
                renderPlannerView();
                renderFavoritesDrawer();
                patchCardStateInPlace("slot", id);
                if (currentMode === "simple" && currentView !== "list") {
                  renderCurrentView();
                }
                refreshDetailModalIfOpen();
              }
            },
          });
        }
      });
    });

    grid.querySelectorAll("[data-planner-reassign]").forEach((sel) => {
      sel.addEventListener("click", (e) => e.stopPropagation());
      sel.addEventListener("change", () => {
        const id = Number(sel.dataset.plannerReassign);
        setFavoriteMember(id, sel.value);
      });
    });
  }

  /* =========================================================
   * Vue dédiée « ☀️ Stages vacances »
   * ========================================================= */

  function populateCampsFilters() {
    const periodWrap = document.getElementById("camps-period-pills");
    periodWrap.innerHTML = "";

    const allPeriodsBtn = document.createElement("button");
    allPeriodsBtn.type = "button";
    allPeriodsBtn.className = "filter-chip active";
    allPeriodsBtn.dataset.campPeriod = "";
    allPeriodsBtn.textContent = "Toutes vacances";
    allPeriodsBtn.addEventListener("click", () => {
      selectedCampPeriods.clear();
      syncCampPeriodPillsUI();
      loadCamps();
    });
    periodWrap.appendChild(allPeriodsBtn);

    const periodsFromMeta =
      meta && Array.isArray(meta.holiday_periods) && meta.holiday_periods.length
        ? meta.holiday_periods.filter((p) => p !== "Toutes vacances")
        : DEFAULT_HOLIDAY_PERIODS;

    periodsFromMeta.forEach((period) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.dataset.campPeriod = period;
      btn.textContent = period;
      btn.addEventListener("click", () => {
        if (selectedCampPeriods.has(period)) {
          selectedCampPeriods.delete(period);
        } else {
          selectedCampPeriods.add(period);
        }
        syncCampPeriodPillsUI();
        loadCamps();
      });
      periodWrap.appendChild(btn);
    });

    const audWrap = document.getElementById("camps-audience-pills");
    audWrap.innerHTML = "";

    const allAudBtn = document.createElement("button");
    allAudBtn.type = "button";
    allAudBtn.className = "filter-chip active";
    allAudBtn.dataset.campAudience = "";
    allAudBtn.textContent = "Tout public";
    allAudBtn.addEventListener("click", () => {
      selectedCampAudiences.clear();
      syncCampAudiencePillsUI();
      loadCamps();
    });
    audWrap.appendChild(allAudBtn);

    CAMP_AUDIENCE_QUICK.forEach((aud) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-chip";
      btn.dataset.campAudience = aud.code;
      btn.textContent = aud.label;
      btn.addEventListener("click", () => {
        if (selectedCampAudiences.has(aud.code)) {
          selectedCampAudiences.delete(aud.code);
        } else {
          selectedCampAudiences.add(aud.code);
        }
        syncCampAudiencePillsUI();
        loadCamps();
      });
      audWrap.appendChild(btn);
    });

    const catSel = document.getElementById("camps-category-select");
    catSel.innerHTML = `<option value="">Toutes catégories</option>`;
    (meta.categories || []).forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      catSel.appendChild(opt);
    });

    const citySel = document.getElementById("camps-city-select");
    citySel.innerHTML = `<option value="">Toutes communes</option>`;
    (meta.cities || []).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = c.name;
      citySel.appendChild(opt);
    });
  }

  function syncCampPeriodPillsUI() {
    document.querySelectorAll("#camps-period-pills .filter-chip").forEach((btn) => {
      const p = btn.dataset.campPeriod || "";
      if (p === "") {
        btn.classList.toggle("active", selectedCampPeriods.size === 0);
      } else {
        btn.classList.toggle("active", selectedCampPeriods.has(p));
      }
    });
  }

  function syncCampAudiencePillsUI() {
    document.querySelectorAll("#camps-audience-pills .filter-chip").forEach((btn) => {
      const code = btn.dataset.campAudience || "";
      if (code === "") {
        btn.classList.toggle("active", selectedCampAudiences.size === 0);
      } else {
        btn.classList.toggle("active", selectedCampAudiences.has(code));
      }
    });
  }

  function resetCampsFilters() {
    selectedCampPeriods.clear();
    selectedCampAudiences.clear();
    selectedCampMemberIds.clear();
    document.getElementById("camps-category-select").value = "";
    document.getElementById("camps-city-select").value =
      selectedCities.size === 1 ? Array.from(selectedCities)[0] : "";
    document.getElementById("camps-q").value = "";
    syncCampPeriodPillsUI();
    syncCampAudiencePillsUI();
    renderCampsFamilyPills();
    loadCamps();
  }

  function formatCampPrice(minPrice, maxPrice) {
    if (minPrice === null || minPrice === undefined) return "Tarif sur demande";
    if (maxPrice && maxPrice !== minPrice) return `${minPrice}–${maxPrice} € / sem.`;
    return `${minPrice} € / sem.`;
  }

  async function loadCamps() {
    const reqSeq = ++latestCampsLoadSeq;
    campsLoadedOnce = true;

    const params = new URLSearchParams();
    const cat = document.getElementById("camps-category-select").value;
    const citySlug = document.getElementById("camps-city-select").value;
    const q = document.getElementById("camps-q").value.trim();

    if (selectedCampPeriods.size > 0) {
      params.set("periods", Array.from(selectedCampPeriods).join(","));
    }
    if (selectedCampAudiences.size > 0) {
      params.set("audiences", Array.from(selectedCampAudiences).join(","));
    }
    if (cat) params.append("categories", cat);
    if (citySlug) {
      params.set("city_slugs", citySlug);
    } else if (selectedCities.size > 0) {
      params.set("city_slugs", Array.from(selectedCities).join(","));
    } else {
      const territory = getActiveTerritory();
      if (territory.slugs.length > 0) {
        params.set("city_slugs", territory.slugs.join(","));
      }
    }
    if (q) params.set("q", q);

    const grid = document.getElementById("camps-grid");
    const summaryEl = document.getElementById("camps-results-summary");

    try {
      const data = await apiFetch(`/api/camps?${params.toString()}`);
      if (reqSeq !== latestCampsLoadSeq) return;
      const camps = data.camps || [];
      currentCamps = camps;
      campsById = new Map(currentCamps.map((c) => [Number(c.id), c]));
      summaryEl.textContent = `${data.count} stage${data.count > 1 ? "s" : ""} trouvé${data.count > 1 ? "s" : ""}`;
      renderCampsGrid(camps);
    } catch (err) {
      if (reqSeq !== latestCampsLoadSeq) return;
      summaryEl.textContent = "";
      grid.innerHTML = `<div class="card"><strong>Impossible de charger les stages vacances.</strong><p class="muted">${escapeHtml(err.message)}</p></div>`;
    }
  }

  function renderCampsGrid(camps) {
    const grid = document.getElementById("camps-grid");
    if (!grid) return;
    const list = Array.isArray(camps) ? camps : [];
    bindDelegatedCardContainer(grid, (kind, id) => {
      if (kind === "camp") return campsById.get(id) || null;
      return null;
    });
    if (!list.length) {
      grid.innerHTML = `<div class="card"><strong>Aucun stage ne correspond à ces critères.</strong><p class="muted">Essayez une autre période de vacances ou réinitialisez les filtres.</p><button type="button" class="btn btn-outline btn-sm mt-1" data-empty-reset="1">↺ Réinitialiser les filtres</button></div>`;
      return;
    }

    grid.innerHTML = list.map((c) => buildCampCardHtml(c)).join("");
  }

  /* =========================================================
   * Tiroir « Mon Parcours Forum »
   * ========================================================= */

  function renderFavoritesDrawer() {
    const list = document.getElementById("fav-items-list");
    const alertEl = document.getElementById("fav-overlap-alert");

    const analysis = analyzePlannerConflicts(favorites);
    if (analysis.sameMemberConflicts.length) {
      alertEl.textContent = "⛔ Conflit horaire : " + analysis.sameMemberConflicts[0].text;
      alertEl.className = "badge badge-full";
      alertEl.style.whiteSpace = "normal";
      alertEl.classList.remove("hidden");
    } else if (analysis.logisticsWarnings.length) {
      alertEl.textContent = "⚠️ " + analysis.logisticsWarnings[0].text;
      alertEl.className = "badge badge-limited";
      alertEl.style.whiteSpace = "normal";
      alertEl.classList.remove("hidden");
    } else {
      alertEl.classList.add("hidden");
    }

    if (!favorites.length) {
      list.innerHTML = `<p class="muted">Aucun créneau enregistré pour le moment. Cliquez sur « ☆ Favori » sur les activités qui vous intéressent.</p>`;
      return;
    }

    list.innerHTML = favorites
      .map((s) => {
        const member = getMemberById(s.memberId);
        const color = member ? member.color : "#94a3b8";
        return `
        <div class="card fav-card" style="border-left-color:${escapeHtml(color)};">
          <div class="flex-between">
            <strong style="font-size:0.9rem;">${escapeHtml(s.title)}</strong>
            <button type="button" class="btn btn-outline btn-sm" data-rm-fav="${s.id}">✕</button>
          </div>
          <div class="muted" style="font-size:0.8rem;">${escapeHtml(s.day_label)} ${escapeHtml(s.start_time)}–${escapeHtml(s.end_time)} • ${escapeHtml(s.organization_name)}</div>
          <div class="muted" style="font-size:0.78rem;">📍 ${escapeHtml(s.venue_name)}</div>
          <div class="fav-member-row">
            <span class="fav-member-dot" style="background:${escapeHtml(color)};"></span>
            <select class="fav-member-select" data-fav-member-slot="${s.id}" aria-label="Attribuer à un membre">
              ${buildMemberOptionsHtml(s.memberId || "")}
            </select>
          </div>
        </div>`;
      })
      .join("");

    list.querySelectorAll("[data-rm-fav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.rmFav);
        favorites = favorites.filter((f) => Number(f.id) !== id);
        saveFavorites();
        renderFavoritesDrawer();
        patchCardStateInPlace("slot", id);
        if (currentMode === "simple" && currentView !== "list") {
          renderCurrentView();
        }
        if (currentMode === "planner") renderPlannerView();
      });
    });

    list.querySelectorAll("[data-fav-member-slot]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const id = Number(sel.dataset.favMemberSlot);
        setFavoriteMember(id, sel.value);
      });
    });
  }

  function openReportModal(slot, opts = {}) {
    document.getElementById("report-slot-id").value = String(slot.id);
    document.getElementById("report-slot-label").textContent = `${slot.title} — ${slot.organization_name} (${slot.day_label} ${slot.start_time})`;
    document.getElementById("report-comment").value = "";
    if (window.AssoSheets) {
      window.AssoSheets.open("report", opts);
    } else {
      const backdrop = document.getElementById("report-modal-backdrop");
      if (backdrop) {
        backdrop.classList.remove("hidden", "sheet-hidden");
        backdrop.classList.add("open", "is-open");
      }
      syncBodyModalClass();
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    try {
      const payload = {
        slot_id: Number(document.getElementById("report-slot-id").value),
        report_type: document.getElementById("report-type").value,
        comment: document.getElementById("report-comment").value,
        reporter_email: document.getElementById("report-email").value,
      };
      const res = await apiFetch("/api/reports", { method: "POST", body: payload });
      if (window.AssoSheets) {
        window.AssoSheets.close("report");
      } else {
        document.getElementById("report-modal-backdrop").classList.remove("open");
      }
      showToast(res.message || "Signalement envoyé !", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  init().catch((err) => showToast(err.message, "error"));
})();
