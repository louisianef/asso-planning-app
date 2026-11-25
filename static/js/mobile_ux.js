(function (global) {
  "use strict";

  const SWIPE_DEAD_ZONE_PX = 8;
  const EDGE_EXCLUSION_PX = 32;

  function isMobileViewport() {
    return global.innerWidth <= 768;
  }

  function getCapacitorPlugins() {
    return (global.Capacitor && global.Capacitor.Plugins) || {};
  }

  function detectCapacitor() {
    const protocol = (global.location && global.location.protocol) || "";
    const hasNativeFn =
      global.Capacitor && typeof global.Capacitor.isNativePlatform === "function";
    return Boolean(
      (global.AP && global.AP.isCapacitor) ||
        (hasNativeFn && global.Capacitor.isNativePlatform()) ||
        (global.Capacitor && !hasNativeFn) ||
        protocol === "capacitor:" ||
        protocol === "ionic:"
    );
  }

  /* =========================================================================
   * 1. Pont natif Capacitor 6 + fallbacks Web/PWA gracieux
   * ========================================================================= */
  const AssoNative = {
    get isCapacitor() {
      return detectCapacitor();
    },

    triggerHaptic(kind = "light") {
      const plugins = getCapacitorPlugins();
      if (plugins.Haptics) {
        try {
          if (kind === "selection" && typeof plugins.Haptics.selectionChanged === "function") {
            plugins.Haptics.selectionChanged().catch(() => {});
            return;
          }
          if (
            (kind === "success" || kind === "warning" || kind === "error") &&
            typeof plugins.Haptics.notification === "function"
          ) {
            plugins.Haptics.notification({ type: kind.toUpperCase() }).catch(() => {});
            return;
          }
          if (typeof plugins.Haptics.impact === "function") {
            const style = kind === "medium" ? "MEDIUM" : kind === "heavy" ? "HEAVY" : "LIGHT";
            plugins.Haptics.impact({ style }).catch(() => {});
            return;
          }
        } catch {
          // ignore native haptic error
        }
      }
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate(kind === "warning" ? [14, 28, 14] : kind === "medium" ? 14 : 9);
        } catch {
          // ignore web vibrate error
        }
      }
    },

    initStatusBar() {
      if (!detectCapacitor()) return;
      const plugins = getCapacitorPlugins();
      if (!plugins.StatusBar) return;
      try {
        Promise.resolve()
          .then(() => plugins.StatusBar.setOverlaysWebView({ overlay: false }))
          .then(() => plugins.StatusBar.setBackgroundColor({ color: "#ffffff" }))
          .then(() => plugins.StatusBar.setStyle({ style: "LIGHT" }))
          .catch(() => {});
      } catch {
        // ignore status bar error
      }
    },

    openExternalUrl(url) {
      if (!url) return;
      const cleanUrl = String(url).trim();
      const plugins = getCapacitorPlugins();
      if (detectCapacitor() && plugins.Browser && typeof plugins.Browser.open === "function") {
        try {
          plugins.Browser.open({ url: cleanUrl, toolbarColor: "#105c97" }).catch(() => {
            global.open(cleanUrl, "_blank", "noopener,noreferrer");
          });
          return;
        } catch {
          // fallback below
        }
      }
      global.open(cleanUrl, "_blank", "noopener,noreferrer");
    },

    async shareContent({ title = "AssoPlanning", text = "", url = "" } = {}) {
      const cleanTitle = String(title || "AssoPlanning");
      const cleanText = String(text || "");
      const cleanUrl = String(url || "");
      const plugins = getCapacitorPlugins();

      if (plugins.Share && typeof plugins.Share.share === "function") {
        try {
          await plugins.Share.share({
            title: cleanTitle,
            text: cleanText || undefined,
            url: cleanUrl || undefined,
            dialogTitle: cleanTitle,
          });
          return { ok: true, method: "capacitor" };
        } catch (err) {
          if (err && /cancel/i.test(String(err.message || err))) {
            return { ok: false, cancelled: true };
          }
        }
      }

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          const payload = cleanUrl
            ? { title: cleanTitle, text: cleanText, url: cleanUrl }
            : { title: cleanTitle, text: cleanText };
          await navigator.share(payload);
          return { ok: true, method: "webshare" };
        } catch (err) {
          if (err && err.name === "AbortError") {
            return { ok: false, cancelled: true };
          }
        }
      }

      const clipText = [cleanText, cleanUrl].filter(Boolean).join("\n");
      if (clipText && typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(clipText);
          return { ok: true, method: "clipboard" };
        } catch {
          // continue
        }
      }
      return { ok: false, method: "none" };
    },

    initVisualViewportKeyboard() {
      if (this._kbInit) return;
      this._kbInit = true;
      if (global.visualViewport) {
        const syncKeyboardState = () => {
          const kbHeight = global.innerHeight - global.visualViewport.height;
          document.body.classList.toggle("keyboard-open", kbHeight > 120);
        };
        global.visualViewport.addEventListener("resize", syncKeyboardState, { passive: true });
      }
      document.addEventListener("focusin", (e) => {
        if (!isMobileViewport()) return;
        const target = e.target;
        if (
          target &&
          typeof target.matches === "function" &&
          target.matches("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), select, textarea")
        ) {
          setTimeout(() => {
            if (document.activeElement === target && typeof target.scrollIntoView === "function") {
              try {
                target.scrollIntoView({ block: "center", behavior: "smooth" });
              } catch {
                // ignore scrollIntoView errors
              }
            }
          }, 260);
        }
      });
    },
  };

  /* =========================================================================
   * 2. Pile LIFO centralisée + Bouton Retour Android (2 couches)
   * ========================================================================= */
  const overlayStack = [];
  let ignoreNextPopstate = false;
  let ignoreResetTimer = null;
  let backFallbackHandler = null;
  let nativeBackBound = false;
  let webHistoryBound = false;

  function hasNativeBackPlugin() {
    const plugins = getCapacitorPlugins();
    return Boolean(detectCapacitor() && plugins.App && typeof plugins.App.addListener === "function");
  }

  function syncBodyModalClass() {
    document.body.classList.toggle("modal-open", overlayStack.length > 0);
  }

  function bindBackListeners() {
    if (hasNativeBackPlugin()) {
      if (nativeBackBound) return;
      nativeBackBound = true;
      try {
        getCapacitorPlugins().App.addListener("backButton", () => {
          if (overlayStack.length > 0) {
            AssoOverlay.closeTop({ fromBack: true });
          } else if (typeof backFallbackHandler === "function") {
            backFallbackHandler();
          }
        });
      } catch {
        // fallback to web history if listener fails
      }
      return;
    }

    if (webHistoryBound) return;
    webHistoryBound = true;
    global.addEventListener("popstate", () => {
      if (ignoreNextPopstate) {
        ignoreNextPopstate = false;
        clearTimeout(ignoreResetTimer);
        return;
      }
      if (overlayStack.length > 0) {
        AssoOverlay.closeTop({ fromHistory: true });
      }
    });
  }

  const AssoOverlay = {
    push(id, closeFn) {
      bindBackListeners();
      const idx = overlayStack.findIndex((item) => item.id === id);
      if (idx !== -1) {
        overlayStack.splice(idx, 1);
      }
      let pushedHistory = false;
      if (!hasNativeBackPlugin() && idx === -1 && global.history && typeof global.history.pushState === "function") {
        try {
          global.history.pushState({ assoOverlay: id }, "");
          pushedHistory = true;
        } catch {
          pushedHistory = false;
        }
      }
      overlayStack.push({ id, closeFn, pushedHistory });
      syncBodyModalClass();
    },

    remove(id, opts = {}) {
      const idx = overlayStack.findIndex((item) => item.id === id);
      if (idx === -1) return;
      const isTop = idx === overlayStack.length - 1;
      const [removed] = overlayStack.splice(idx, 1);
      syncBodyModalClass();
      if (
        isTop &&
        removed.pushedHistory &&
        !opts.fromHistory &&
        !opts.skipHistoryBack &&
        !hasNativeBackPlugin() &&
        global.history &&
        typeof global.history.back === "function"
      ) {
        ignoreNextPopstate = true;
        clearTimeout(ignoreResetTimer);
        ignoreResetTimer = setTimeout(() => {
          ignoreNextPopstate = false;
        }, 180);
        try {
          global.history.back();
        } catch {
          ignoreNextPopstate = false;
        }
      }
    },

    replaceTop(id, closeFn) {
      if (overlayStack.length === 0) {
        this.push(id, closeFn);
        return;
      }
      const prev = overlayStack[overlayStack.length - 1];
      overlayStack.pop();
      if (typeof prev.closeFn === "function") {
        prev.closeFn({ skipHistoryBack: true, replaced: true });
      }
      const pushedHistory = Boolean(prev.pushedHistory);
      overlayStack.push({ id, closeFn, pushedHistory });
      syncBodyModalClass();
    },

    closeTop(opts = {}) {
      if (overlayStack.length === 0) return false;
      const top = overlayStack[overlayStack.length - 1];
      if (typeof top.closeFn === "function") {
        top.closeFn(opts);
      } else {
        overlayStack.pop();
        syncBodyModalClass();
      }
      return true;
    },

    hasOpen() {
      return overlayStack.length > 0;
    },

    topId() {
      return overlayStack.length ? overlayStack[overlayStack.length - 1].id : null;
    },

    setBackFallback(fn) {
      bindBackListeners();
      backFallbackHandler = fn;
    },
  };

  /* =========================================================================
   * 3. Moteur Gestuel Tactile Unifié (Bottom Sheets 60 fps + Swipe-to-Dismiss)
   * ========================================================================= */
  const registeredSheets = new Map();
  let suppressClickUntil = 0;
  let ghostClickGuardBound = false;

  function ensureGhostClickGuard() {
    if (ghostClickGuardBound) return;
    ghostClickGuardBound = true;
    document.addEventListener(
      "click",
      (e) => {
        if (performance.now() < suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
  }

  function resolveEl(ref, root = document) {
    if (!ref) return null;
    if (typeof ref === "string") {
      if (root && root !== document) {
        if (typeof root.matches === "function" && root.matches(ref)) {
          return root;
        }
        const inside = typeof root.querySelector === "function" ? root.querySelector(ref) : null;
        if (inside) return inside;
      }
      return document.querySelector(ref);
    }
    if (typeof ref === "function") return ref(root);
    return ref;
  }

  function cleanupCloseTransition(entry) {
    if (!entry) return;
    clearTimeout(entry.closeTimer);
    entry.closeTimer = null;
    if (typeof entry.cleanupTransition === "function") {
      entry.cleanupTransition();
      entry.cleanupTransition = null;
    }
  }

  function bindSheetPhysics(entry) {
    const { id, config } = entry;
    const container = resolveEl(config.container);
    const sheet = resolveEl(config.sheet, container || document);
    const scrim = resolveEl(config.scrim, container || document);
    if (!container || !sheet) return;

    if (scrim) {
      scrim.addEventListener("click", (e) => {
        if (!AssoSheets.isOpen(id)) return;
        if (e.target !== scrim && config.scrim !== config.container) return;
        if (config.scrim === config.container && e.target !== container) return;
        e.stopPropagation();
        AssoSheets.close(id, { reason: "backdrop" });
      });
    }

    const handleBtn = sheet.querySelector("[data-sheet-handle]");
    if (handleBtn) {
      handleBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          AssoSheets.close(id, { reason: "handle" });
        }
      });
    }

    let state = "IDLE";
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let dragOriginY = 0;
    let ty = 0;
    let maxMoved = 0;
    let onHandle = false;
    let onHorizontalZone = false;
    let scrollEl = null;
    let samples = [];
    let rafId = null;
    let sheetHeight = 400;

    function resetSwipeState() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      state = "IDLE";
      sheet.classList.remove("is-dragging");
    }

    function scheduleRender() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        sheet.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
        if (scrim) {
          const progress = Math.max(0, Math.min(1, ty / Math.max(160, sheetHeight)));
          scrim.style.opacity = String(Math.max(0.12, 1 - progress * 0.85));
        }
      });
    }

    sheet.addEventListener(
      "touchstart",
      (e) => {
        if (!isMobileViewport() || e.touches.length > 1) return;
        if (container.classList.contains("sheet-hidden") || container.classList.contains("hidden")) return;
        const target = e.target;
        if (target && target.closest(".leaflet-container, input[type='range']")) return;
        if (target && target.tagName === "TEXTAREA" && target.scrollHeight > target.clientHeight + 2) return;

        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startTime = performance.now();
        maxMoved = 0;
        ty = 0;
        samples = [];
        scrollEl = sheet.querySelector(config.scrollSelector || "[data-sheet-scroll]");
        onHandle =
          Boolean(target && target.closest("[data-sheet-handle], [data-sheet-drag-zone]")) &&
          !(target && target.closest("input, select, textarea"));
        onHorizontalZone = !(
          target &&
          target.closest(
            ".onboarding-steps-indicator, .chip-row, .wishlists-tabs, .ob-profile-tabs, input, select, textarea"
          )
        );
        sheetHeight = sheet.offsetHeight || global.innerHeight;
        state = "PENDING";
      },
      { passive: true }
    );

    sheet.addEventListener(
      "touchmove",
      (e) => {
        if (state === "IDLE" || state === "SCROLL" || !e.touches.length) return;
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const dist = Math.hypot(dx, dy);
        maxMoved = Math.max(maxMoved, dist);

        if (state === "PENDING") {
          if (dist < SWIPE_DEAD_ZONE_PX) return;
          if (Math.abs(dx) > Math.abs(dy) * 1.35) {
            if (
              (config.onSwipeLeft || config.onSwipeRight) &&
              onHorizontalZone &&
              startX >= EDGE_EXCLUSION_PX &&
              startX <= global.innerWidth - EDGE_EXCLUSION_PX
            ) {
              state = "HORIZONTAL";
            } else {
              state = "SCROLL";
            }
            return;
          }
          if (onHandle || (dy > 0 && (!scrollEl || scrollEl.scrollTop <= 1))) {
            state = "DRAG";
            dragOriginY = touch.clientY;
            sheet.classList.add("is-dragging");
            sheet.style.transition = "none";
            if (scrim) scrim.style.transition = "none";
            if (
              document.activeElement &&
              typeof document.activeElement.blur === "function" &&
              document.activeElement.matches("input, select, textarea")
            ) {
              document.activeElement.blur();
            }
          } else {
            state = "SCROLL";
            return;
          }
        }

        if (state === "DRAG") {
          if (e.cancelable) e.preventDefault();
          const rawY = touch.clientY - dragOriginY;
          ty = rawY < 0 ? -Math.min(18, Math.pow(Math.abs(rawY), 0.65) * 1.3) : rawY;
          const now = performance.now();
          samples.push({ y: touch.clientY, t: now });
          while (samples.length > 2 && now - samples[0].t > 120) {
            samples.shift();
          }
          scheduleRender();
        }
      },
      { passive: false }
    );

    function finishTouch(e) {
      if (state === "IDLE") return;
      const activeState = state;
      resetSwipeState();

      if (activeState === "HORIZONTAL") {
        const ch = (e.changedTouches && e.changedTouches[0]) || null;
        if (!ch) return;
        const dx = ch.clientX - startX;
        const elapsed = performance.now() - startTime;
        if (dx < -56 || (dx < -28 && elapsed < 260)) {
          suppressClickUntil = performance.now() + 90;
          if (typeof config.onSwipeLeft === "function") config.onSwipeLeft();
        } else if (dx > 56 || (dx > 28 && elapsed < 260)) {
          suppressClickUntil = performance.now() + 90;
          if (typeof config.onSwipeRight === "function") config.onSwipeRight();
        }
        return;
      }

      if (activeState !== "DRAG") return;
      if (maxMoved > 10) {
        suppressClickUntil = performance.now() + 90;
      }

      let velocityY = 0;
      if (samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        velocityY = (last.y - first.y) / Math.max(16, last.t - first.t);
      }

      const dismissThreshold = Math.min(130, sheetHeight * 0.28);
      if (ty > dismissThreshold || (velocityY > 0.55 && ty > 36)) {
        const dur = Math.max(130, Math.min(240, Math.round((sheetHeight - ty) / Math.max(velocityY, 0.9))));
        AssoNative.triggerHaptic("light");
        AssoSheets.close(id, { reason: "swipe", durationMs: dur });
      } else {
        sheet.style.transition = "transform 340ms cubic-bezier(0.22, 1.12, 0.36, 1)";
        sheet.style.transform = "translate3d(0, 0, 0)";
        if (scrim) {
          scrim.style.transition = "opacity 240ms ease";
          scrim.style.opacity = "1";
        }
        setTimeout(() => {
          sheet.style.transition = "";
          sheet.style.transform = "";
          if (scrim) {
            scrim.style.transition = "";
            scrim.style.opacity = "";
          }
        }, 350);
      }
    }

    sheet.addEventListener("touchend", finishTouch, { passive: true });
    sheet.addEventListener("touchcancel", finishTouch, { passive: true });
  }

  const AssoSheets = {
    register(id, config) {
      ensureGhostClickGuard();
      const entry = {
        id,
        config,
        isClosing: false,
        closeTimer: null,
        cleanupTransition: null,
        raf1: null,
        raf2: null,
      };
      registeredSheets.set(id, entry);
      bindSheetPhysics(entry);
    },

    isOpen(id) {
      const entry = registeredSheets.get(id);
      if (!entry || entry.isClosing) return false;
      const container = resolveEl(entry.config.container);
      return Boolean(
        container &&
          !container.classList.contains("sheet-hidden") &&
          !container.classList.contains("hidden")
      );
    },

    open(id, opts = {}) {
      const entry = registeredSheets.get(id);
      if (!entry) return;
      const { config } = entry;
      const container = resolveEl(config.container);
      const sheet = resolveEl(config.sheet, container || document);
      const scrim = resolveEl(config.scrim, container || document);
      if (!container || !sheet) return;

      entry.isClosing = false;
      cleanupCloseTransition(entry);
      cancelAnimationFrame(entry.raf1);
      cancelAnimationFrame(entry.raf2);

      if (typeof config.onBeforeOpen === "function") {
        config.onBeforeOpen(opts);
      }

      sheet.classList.remove("is-dragging");
      sheet.style.transition = "";
      sheet.style.transform = "";
      if (scrim) {
        scrim.style.transition = "";
        scrim.style.opacity = "";
      }

      const scrollEl = sheet.querySelector(config.scrollSelector || "[data-sheet-scroll]");

      if (config.mobileOnly && !isMobileViewport()) {
        AssoOverlay.remove(id, { skipHistoryBack: true });
        container.classList.remove("hidden", "sheet-hidden");
        container.classList.add("is-open");
        if (scrollEl) scrollEl.scrollTop = 0;
        if (scrim && scrim !== container) {
          scrim.classList.remove("is-open");
          scrim.classList.add("hidden", "sheet-hidden");
          scrim.setAttribute("aria-hidden", "true");
        }
        return;
      }

      container.classList.remove("hidden", "sheet-hidden", "is-open");
      if (scrollEl) {
        scrollEl.scrollTop = 0;
      }
      if (scrim && scrim !== container) {
        scrim.classList.remove("hidden", "sheet-hidden", "is-open");
        scrim.setAttribute("aria-hidden", "false");
      }

      if (opts.replaceOverlay) {
        AssoOverlay.replaceTop(id, (closeOpts) => this.close(id, closeOpts));
      } else {
        AssoOverlay.push(id, (closeOpts) => this.close(id, closeOpts));
      }

      entry.raf1 = requestAnimationFrame(() => {
        entry.raf2 = requestAnimationFrame(() => {
          if (entry.isClosing) return;
          container.classList.add("is-open");
          if (scrim && scrim !== container) scrim.classList.add("is-open");
        });
      });

      if (!opts.silentHaptic) {
        AssoNative.triggerHaptic("light");
      }
    },

    close(id, opts = {}) {
      const entry = registeredSheets.get(id);
      if (!entry) return;
      const { config } = entry;
      const container = resolveEl(config.container);
      const sheet = resolveEl(config.sheet, container || document);
      const scrim = resolveEl(config.scrim, container || document);
      if (!container || !sheet) return;

      cancelAnimationFrame(entry.raf1);
      cancelAnimationFrame(entry.raf2);

      if (entry.isClosing && !opts.immediate) {
        return;
      }

      cleanupCloseTransition(entry);
      AssoOverlay.remove(id, opts);

      const finishHide = () => {
        entry.isClosing = false;
        cleanupCloseTransition(entry);
        container.classList.remove("is-open");
        container.classList.add("sheet-hidden", "hidden");
        sheet.classList.remove("is-dragging");
        sheet.style.transition = "";
        sheet.style.transform = "";
        if (scrim && scrim !== container) {
          scrim.classList.remove("is-open");
          scrim.classList.add("hidden", "sheet-hidden");
          scrim.setAttribute("aria-hidden", "true");
        }
        if (scrim) {
          scrim.style.transition = "";
          scrim.style.opacity = "";
        }
        if (typeof config.onAfterClose === "function") {
          config.onAfterClose(opts);
        }
      };

      if (
        (config.mobileOnly && !isMobileViewport()) ||
        opts.immediate ||
        container.classList.contains("sheet-hidden") ||
        container.classList.contains("hidden")
      ) {
        finishHide();
        return;
      }

      entry.isClosing = true;
      sheet.classList.remove("is-dragging");
      if (opts.durationMs) {
        sheet.style.transition = `transform ${opts.durationMs}ms cubic-bezier(0.4, 0, 1, 1)`;
        sheet.style.transform = "translate3d(0, 100%, 0)";
        if (scrim) {
          scrim.style.transition = `opacity ${opts.durationMs}ms ease`;
          scrim.style.opacity = "0";
        }
      } else {
        sheet.style.transition = "";
        sheet.style.transform = "";
        if (scrim) {
          scrim.style.transition = "";
          scrim.style.opacity = "";
        }
      }

      container.classList.remove("is-open");
      if (scrim && scrim !== container) {
        scrim.classList.remove("is-open");
      }

      const waitMs = opts.durationMs ? opts.durationMs + 40 : 260;
      const onEnd = (ev) => {
        if (ev.target !== sheet) return;
        finishHide();
      };
      entry.cleanupTransition = () => {
        sheet.removeEventListener("transitionend", onEnd);
      };
      sheet.addEventListener("transitionend", onEnd);
      entry.closeTimer = setTimeout(() => {
        finishHide();
      }, waitMs);
    },
  };

  /* =========================================================================
   * 4. Mini-volet tactile AssoDialog (remplace window.prompt / window.confirm)
   * ========================================================================= */
  let dialogResolve = null;
  let dialogMode = "confirm";
  let dialogBound = false;

  function ensureDialogSetup() {
    if (dialogBound) return;
    const backdrop = document.getElementById("app-dialog-backdrop");
    if (!backdrop) return;
    dialogBound = true;

    AssoSheets.register("dialog", {
      container: "#app-dialog-backdrop",
      sheet: ".app-dialog-sheet",
      scrim: "[data-sheet-scrim]",
      onAfterClose: () => {
        if (dialogResolve) {
          const resolve = dialogResolve;
          dialogResolve = null;
          resolve(dialogMode === "prompt" ? null : false);
        }
      },
    });

    const cancelBtn = document.getElementById("app-dialog-cancel-btn");
    const confirmBtn = document.getElementById("app-dialog-confirm-btn");
    const form = document.getElementById("app-dialog-form");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        if (dialogResolve) {
          const resolve = dialogResolve;
          dialogResolve = null;
          resolve(dialogMode === "prompt" ? null : false);
        }
        AssoSheets.close("dialog");
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (dialogResolve) {
          const resolve = dialogResolve;
          dialogResolve = null;
          if (dialogMode === "prompt") {
            const inp = document.getElementById("app-dialog-input");
            resolve(inp ? inp.value : "");
          } else {
            resolve(true);
          }
        }
        AssoSheets.close("dialog");
      });
    } else if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (dialogResolve) {
          const resolve = dialogResolve;
          dialogResolve = null;
          resolve(dialogMode === "prompt" ? (document.getElementById("app-dialog-input")?.value ?? "") : true);
        }
        AssoSheets.close("dialog");
      });
    }
  }

  const AssoDialog = {
    prompt({
      title = "Saisir une valeur",
      message = "",
      placeholder = "",
      defaultValue = "",
      confirmText = "Valider",
      cancelText = "Annuler",
    } = {}) {
      ensureDialogSetup();
      const backdrop = document.getElementById("app-dialog-backdrop");
      if (!backdrop) {
        return Promise.resolve(global.prompt ? global.prompt(title, defaultValue) : null);
      }
      if (dialogResolve) {
        const prev = dialogResolve;
        dialogResolve = null;
        prev(dialogMode === "prompt" ? null : false);
      }
      dialogMode = "prompt";
      const titleEl = document.getElementById("app-dialog-title");
      const msgEl = document.getElementById("app-dialog-message");
      const inputEl = document.getElementById("app-dialog-input");
      const cancelBtn = document.getElementById("app-dialog-cancel-btn");
      const confirmBtn = document.getElementById("app-dialog-confirm-btn");

      if (titleEl) titleEl.textContent = title;
      if (msgEl) {
        msgEl.textContent = message;
        msgEl.classList.toggle("hidden", !message);
      }
      if (inputEl) {
        inputEl.classList.remove("hidden");
        inputEl.placeholder = placeholder;
        inputEl.value = defaultValue;
      }
      if (cancelBtn) cancelBtn.textContent = cancelText;
      if (confirmBtn) {
        confirmBtn.textContent = confirmText;
        confirmBtn.className = "btn btn-primary";
      }

      AssoSheets.open("dialog");
      setTimeout(() => {
        if (inputEl) {
          inputEl.focus();
          if (defaultValue) inputEl.select();
        }
      }, 240);

      return new Promise((resolve) => {
        dialogResolve = resolve;
      });
    },

    confirm({
      title = "Confirmation",
      message = "",
      confirmText = "Confirmer",
      cancelText = "Annuler",
      danger = false,
    } = {}) {
      ensureDialogSetup();
      const backdrop = document.getElementById("app-dialog-backdrop");
      if (!backdrop) {
        return Promise.resolve(global.confirm ? global.confirm(message || title) : true);
      }
      if (dialogResolve) {
        const prev = dialogResolve;
        dialogResolve = null;
        prev(dialogMode === "prompt" ? null : false);
      }
      dialogMode = "confirm";
      const titleEl = document.getElementById("app-dialog-title");
      const msgEl = document.getElementById("app-dialog-message");
      const inputEl = document.getElementById("app-dialog-input");
      const cancelBtn = document.getElementById("app-dialog-cancel-btn");
      const confirmBtn = document.getElementById("app-dialog-confirm-btn");

      if (titleEl) titleEl.textContent = title;
      if (msgEl) {
        msgEl.textContent = message;
        msgEl.classList.toggle("hidden", !message);
      }
      if (inputEl) {
        inputEl.classList.add("hidden");
        inputEl.value = "";
      }
      if (cancelBtn) cancelBtn.textContent = cancelText;
      if (confirmBtn) {
        confirmBtn.textContent = confirmText;
        confirmBtn.className = danger ? "btn btn-danger" : "btn btn-primary";
      }

      AssoSheets.open("dialog");
      return new Promise((resolve) => {
        dialogResolve = resolve;
      });
    },
  };

  global.AssoNative = AssoNative;
  global.AssoOverlay = AssoOverlay;
  global.AssoSheets = AssoSheets;
  global.AssoDialog = AssoDialog;
})(window);
