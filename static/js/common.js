(function (global) {
  "use strict";

  const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(message, type = "info", options = {}) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    const hasAction = options && options.actionLabel && typeof options.onAction === "function";
    const duration =
      options && Number.isFinite(Number(options.duration))
        ? Number(options.duration)
        : hasAction
          ? 4800
          : 3600;

    if (hasAction) {
      const msgSpan = document.createElement("span");
      msgSpan.className = "toast-msg";
      msgSpan.textContent = message;
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "toast-action-btn";
      actionBtn.textContent = options.actionLabel;
      el.appendChild(msgSpan);
      el.appendChild(actionBtn);
      const timer = setTimeout(() => {
        el.remove();
      }, duration);
      actionBtn.addEventListener("click", () => {
        clearTimeout(timer);
        el.remove();
        options.onAction();
      });
    } else {
      el.textContent = message;
      setTimeout(() => {
        el.remove();
      }, duration);
    }
    container.appendChild(el);
  }

  async function apiFetch(url, options = {}) {
    const opts = {
      credentials: "same-origin",
      ...options,
    };
    const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
    if (!isFormData && opts.body && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
      opts.headers = {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      };
    }
    const resp = await fetch(url, opts);
    const contentType = resp.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await resp.json() : await resp.text();
    if (!resp.ok) {
      const msg = (data && data.detail) || `Erreur HTTP ${resp.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function availabilityBadge(avail) {
    const map = {
      open: { cls: "badge-open", label: "Places dispo" },
      limited: { cls: "badge-limited", label: "Dernières places" },
      full: { cls: "badge-full", label: "Complet" },
      unknown: { cls: "badge-unknown", label: "À confirmer" },
    };
    const info = map[avail] || map.unknown;
    return `<span class="badge ${info.cls}">${escapeHtml(info.label)}</span>`;
  }

  function verifiedBadge(isVerified) {
    if (isVerified) {
      return `<span class="badge badge-verified" title="Planning confirmé par l'association">✓ Vérifié asso</span>`;
    }
    return `<span class="badge badge-source" title="Extrait d'une source publique">Source publique</span>`;
  }

  function structureTypeBadge(type) {
    const map = {
      municipal: { cls: "badge-municipal", label: "🏛️ Municipal" },
      prive: { cls: "badge-prive", label: "🎓 École / Privé" },
      association: { cls: "badge-asso", label: "🤝 Association" },
    };
    const info = map[type] || map.association;
    return `<span class="badge ${info.cls}">${escapeHtml(info.label)}</span>`;
  }

  function formatFee(minFee, maxFee) {
    if (minFee === null || minFee === undefined) return "Tarif sur demande";
    if (maxFee && maxFee !== minFee) return `${minFee}–${maxFee} € / an`;
    return `${minFee} € / an`;
  }

  global.AP = {
    DAYS_FR,
    escapeHtml,
    showToast,
    apiFetch,
    availabilityBadge,
    verifiedBadge,
    structureTypeBadge,
    formatFee,
  };
})(window);
