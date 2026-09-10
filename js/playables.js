/**
 * Thin wrapper around the YouTube Playables SDK.
 * Locally (no ytgame) it falls back to localStorage and no-ops the rest.
 */
(function (global) {
  const SAVE_KEY = "sudoku-playable-save";

  function inPlayables() {
    return typeof global.ytgame !== "undefined" && global.ytgame.IN_PLAYABLES_ENV;
  }

  const Playables = {
    inPlayables,

    firstFrameReady() {
      try {
        global.ytgame?.game?.firstFrameReady();
      } catch (_) {
        /* local preview */
      }
    },

    gameReady() {
      try {
        global.ytgame?.game?.gameReady();
      } catch (_) {
        /* local preview */
      }
    },

    async loadData() {
      if (inPlayables()) {
        try {
          const raw = await global.ytgame.game.loadData();
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (_) {
          return null;
        }
      }
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    },

    async saveData(state) {
      const raw = JSON.stringify(state);
      if (inPlayables()) {
        try {
          await global.ytgame.game.saveData(raw);
        } catch (_) {
          /* ignore transient SDK errors */
        }
        return;
      }
      try {
        localStorage.setItem(SAVE_KEY, raw);
      } catch (_) {
        /* private mode / quota */
      }
    },

    async sendScore(value) {
      if (!inPlayables()) return;
      try {
        await global.ytgame.engagement.sendScore({ value: Math.max(0, Math.floor(value)) });
      } catch (_) {
        /* ignore */
      }
    },

    onPause(fn) {
      if (inPlayables()) {
        global.ytgame.system.onPause(fn);
      }
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) fn();
      });
    },

    onResume(fn) {
      if (inPlayables()) {
        global.ytgame.system.onResume(fn);
      }
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) fn();
      });
    },
  };

  global.Playables = Playables;
  Playables.firstFrameReady();
})(window);
