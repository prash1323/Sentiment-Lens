(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var storage = window.SentimentLensStorage;

  document.addEventListener("DOMContentLoaded", function () {
    if (!storage) return;

    var boardContent = document.getElementById("boardContent");
    var boardEmpty = document.getElementById("boardEmpty");

    var statTotal = document.getElementById("statTotal");
    var statPositive = document.getElementById("statPositive");
    var statNeutral = document.getElementById("statNeutral");
    var statNegative = document.getElementById("statNegative");

    var distPositiveFill = document.getElementById("distPositiveFill");
    var distNeutralFill = document.getElementById("distNeutralFill");
    var distNegativeFill = document.getElementById("distNegativeFill");
    var distPositivePct = document.getElementById("distPositivePct");
    var distNeutralPct = document.getElementById("distNeutralPct");
    var distNegativePct = document.getElementById("distNegativePct");

    var signalList = document.getElementById("signalList");
    var filterEmpty = document.getElementById("filterEmpty");
    var filterChips = document.querySelectorAll(".filter-chip");

    var clearBoardBtn = document.getElementById("clearBoardBtn");
    var clearConfirm = document.getElementById("clearConfirm");
    var clearCancelBtn = document.getElementById("clearCancelBtn");
    var clearConfirmBtn = document.getElementById("clearConfirmBtn");

    var currentFilter = "all";

    /* ---- first-run demo data ---- */
    storage.seedDemoDataIfNeeded();

    /* ---- helpers ---- */
    function timeAgo(isoString) {
      var diffMs = Date.now() - new Date(isoString).getTime();
      var minutes = Math.round(diffMs / 60000);
      if (minutes < 1) return "Analyzed just now";
      if (minutes < 60) return "Analyzed " + minutes + (minutes === 1 ? " minute ago" : " minutes ago");
      var hours = Math.round(minutes / 60);
      if (hours < 24) return "Analyzed " + hours + (hours === 1 ? " hour ago" : " hours ago");
      var days = Math.round(hours / 24);
      return "Analyzed " + days + (days === 1 ? " day ago" : " days ago");
    }

    function truncate(text, maxLen) {
      if (text.length <= maxLen) return text;
      return text.slice(0, maxLen).trim() + "…";
    }

    function capitalize(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    /* ---- rendering ---- */
    function render() {
      var records = storage.getInsights();

      if (records.length === 0) {
        boardContent.hidden = true;
        boardEmpty.hidden = false;
        return;
      }
      boardContent.hidden = false;
      boardEmpty.hidden = true;

      renderSummary(records);
      renderDistribution(records);
      renderList(records);
    }

    function renderSummary(records) {
      var positive = records.filter(function (r) { return r.sentiment === "positive"; }).length;
      var neutral = records.filter(function (r) { return r.sentiment === "neutral"; }).length;
      var negative = records.filter(function (r) { return r.sentiment === "negative"; }).length;

      statTotal.textContent = records.length;
      statPositive.textContent = positive;
      statNeutral.textContent = neutral;
      statNegative.textContent = negative;
    }

    function renderDistribution(records) {
      var total = records.length || 1;
      var positive = records.filter(function (r) { return r.sentiment === "positive"; }).length;
      var neutral = records.filter(function (r) { return r.sentiment === "neutral"; }).length;
      var negative = records.filter(function (r) { return r.sentiment === "negative"; }).length;

      var positivePct = Math.round((positive / total) * 100);
      var neutralPct = Math.round((neutral / total) * 100);
      var negativePct = Math.round((negative / total) * 100);

      distPositivePct.textContent = positivePct + "%";
      distNeutralPct.textContent = neutralPct + "%";
      distNegativePct.textContent = negativePct + "%";

      // Set widths on next frame so CSS transition animates from 0.
      requestAnimationFrame(function () {
        distPositiveFill.style.setProperty("--fill", positivePct + "%");
        distNeutralFill.style.setProperty("--fill", neutralPct + "%");
        distNegativeFill.style.setProperty("--fill", negativePct + "%");
      });
    }

    function renderList(records) {
      var filtered = currentFilter === "all"
        ? records
        : records.filter(function (r) { return r.sentiment === currentFilter; });

      signalList.innerHTML = "";

      if (filtered.length === 0) {
        filterEmpty.hidden = false;
        return;
      }
      filterEmpty.hidden = true;

      filtered.forEach(function (record, index) {
        var card = document.createElement("article");
        card.className = "signal-record";
        card.setAttribute("data-id", record.id);

        card.innerHTML =
          '<blockquote class="signal-record__quote-wrap" style="margin:0;">' +
            '<p class="signal-record__quote">&ldquo;' + escapeHtml(truncate(record.text, 110)) + '&rdquo;</p>' +
          '</blockquote>' +
          '<div class="signal-record__meta">' +
            '<span class="sentiment-tag sentiment-tag--' + record.sentiment + '">' + capitalize(record.sentiment) + '</span>' +
            '<span class="signal-record__certainty">' + record.confidence + '% certainty</span>' +
          '</div>' +
          '<span class="signal-record__emotion">' + escapeHtml(record.emotion) + '</span>' +
          '<div class="signal-record__footer">' +
            '<span class="signal-record__time">' + timeAgo(record.timestamp) + '</span>' +
            '<button type="button" class="signal-record__remove" data-remove-id="' + record.id + '">Remove</button>' +
          '</div>';

        signalList.appendChild(card);

        if (prefersReducedMotion) {
          card.classList.add("is-visible");
        } else {
          setTimeout(function () {
            card.classList.add("is-visible");
          }, index * 40);
        }
      });
    }

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    /* ---- filters ---- */
    filterChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        filterChips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        currentFilter = chip.getAttribute("data-filter");
        renderList(storage.getInsights());
      });
    });

    /* ---- remove single record ---- */
    signalList.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-remove-id]");
      if (!btn) return;
      var id = btn.getAttribute("data-remove-id");
      var card = btn.closest(".signal-record");

      function finish() {
        storage.deleteInsight(id);
        render();
      }

      if (prefersReducedMotion || !card) {
        finish();
        return;
      }
      card.classList.add("is-removing");
      setTimeout(finish, 260);
    });

    /* ---- clear board ---- */
    clearBoardBtn.addEventListener("click", function () {
      clearConfirm.hidden = false;
      clearBoardBtn.hidden = true;
    });

    clearCancelBtn.addEventListener("click", function () {
      clearConfirm.hidden = true;
      clearBoardBtn.hidden = false;
    });

    clearConfirmBtn.addEventListener("click", function () {
      storage.clearInsights();
      clearConfirm.hidden = true;
      clearBoardBtn.hidden = false;
      render();
    });

    render();
  });
})();
