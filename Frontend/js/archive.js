(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var storage = window.SentimentLensStorage;

  document.addEventListener("DOMContentLoaded", function () {
    if (!storage) return;

    var archiveContent = document.getElementById("archiveContent");
    var archiveEmpty = document.getElementById("archiveEmpty");
    var archiveList = document.getElementById("archiveList");
    var archiveCount = document.getElementById("archiveCount");
    var noResultsState = document.getElementById("noResultsState");

    var searchInput = document.getElementById("archiveSearch");
    var filterChips = document.querySelectorAll(".filter-chip");
    var clearSearchBtn = document.getElementById("clearSearchBtn");

    var clearArchiveBtn = document.getElementById("clearArchiveBtn");
    var clearConfirm = document.getElementById("clearConfirm");
    var clearCancelBtn = document.getElementById("clearCancelBtn");
    var clearConfirmBtn = document.getElementById("clearConfirmBtn");

    var currentFilter = "all";
    var currentSearch = "";
    var expandedIds = {};
    var PREVIEW_LIMIT = 160;

    /* Reuse existing demo data only if nothing has ever been seeded/saved. */
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

    function capitalize(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function setText(el, value) {
      el.textContent = value;
      return el;
    }

    function matchesSearch(record, query) {
      if (!query) return true;
      var q = query.toLowerCase();
      return (
        record.text.toLowerCase().indexOf(q) !== -1 ||
        record.sentiment.toLowerCase().indexOf(q) !== -1 ||
        record.emotion.toLowerCase().indexOf(q) !== -1
      );
    }

    function getFilteredRecords() {
      var records = storage.getInsights(); // already newest-first from storage layer
      return records.filter(function (r) {
        var sentimentOk = currentFilter === "all" || r.sentiment === currentFilter;
        return sentimentOk && matchesSearch(r, currentSearch);
      });
    }

    /* ---- record card builder (DOM-based, no innerHTML for user text) ---- */
    function buildRecordCard(record, index, total) {
      var card = document.createElement("article");
      card.className = "archive-record";
      card.setAttribute("data-id", record.id);

      var isLong = record.text.length > PREVIEW_LIMIT;
      var isExpanded = !!expandedIds[record.id];

      // Text
      var textEl = document.createElement("p");
      textEl.className = "archive-record__text" + (isLong && !isExpanded ? " archive-record__text--preview" : "");
      textEl.textContent = record.text; // textContent — safe for user-generated content
      card.appendChild(textEl);

      // Read more / less toggle
      if (isLong) {
        var toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "archive-record__read-more";
        toggleBtn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        toggleBtn.textContent = isExpanded ? "Read less" : "Read more";
        toggleBtn.addEventListener("click", function () {
          if (expandedIds[record.id]) {
            delete expandedIds[record.id];
          } else {
            expandedIds[record.id] = true;
          }
          renderList();
        });
        card.appendChild(toggleBtn);
      }

      // Meta row: sentiment tag, emotion, certainty
      var meta = document.createElement("div");
      meta.className = "archive-record__meta";

      var tag = document.createElement("span");
      tag.className = "sentiment-tag sentiment-tag--" + record.sentiment;
      tag.textContent = capitalize(record.sentiment);
      meta.appendChild(tag);

      var emotionEl = document.createElement("span");
      emotionEl.className = "archive-record__emotion";
      emotionEl.textContent = record.emotion;
      meta.appendChild(emotionEl);

      var certaintyEl = document.createElement("span");
      certaintyEl.className = "archive-record__certainty";
      certaintyEl.textContent = record.confidence + "% certainty";
      meta.appendChild(certaintyEl);

      card.appendChild(meta);

      // Expanded detail block — "revisiting an old analysis"
      if (isExpanded) {
        var detail = document.createElement("div");
        detail.className = "archive-record__expanded";

        var signalLabel = setText(document.createElement("p"), "The Signal");
        signalLabel.className = "archive-record__expanded-label";
        detail.appendChild(signalLabel);

        var signalText = document.createElement("p");
        signalText.className = "archive-record__text";
        signalText.style.marginBottom = "0";
        signalText.textContent = record.text;
        detail.appendChild(signalText);

        var readoutLabel = setText(document.createElement("p"), "The Readout");
        readoutLabel.className = "archive-record__expanded-label";
        detail.appendChild(readoutLabel);

        var readoutRow = document.createElement("div");
        readoutRow.className = "archive-record__readout-row";

        var readoutTag = document.createElement("span");
        readoutTag.className = "sentiment-tag sentiment-tag--" + record.sentiment;
        readoutTag.textContent = capitalize(record.sentiment);
        readoutRow.appendChild(readoutTag);

        var readoutEmotion = document.createElement("span");
        readoutEmotion.className = "archive-record__emotion";
        readoutEmotion.textContent = record.emotion;
        readoutRow.appendChild(readoutEmotion);

        var readoutCertainty = document.createElement("span");
        readoutCertainty.className = "archive-record__certainty";
        readoutCertainty.textContent = record.confidence + "% Model Certainty";
        readoutRow.appendChild(readoutCertainty);

        detail.appendChild(readoutRow);
        card.appendChild(detail);
      }

      // Footer: timestamp + remove
      var footer = document.createElement("div");
      footer.className = "archive-record__footer";

      var timeEl = document.createElement("span");
      timeEl.className = "archive-record__time";
      timeEl.textContent = timeAgo(record.timestamp);
      footer.appendChild(timeEl);

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "archive-record__remove";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", function () {
        handleRemove(record.id, card);
      });
      footer.appendChild(removeBtn);

      card.appendChild(footer);

      if (prefersReducedMotion) {
        card.classList.add("is-visible");
      } else {
        setTimeout(function () { card.classList.add("is-visible"); }, Math.min(index, 10) * 35);
      }

      return card;
    }

    function handleRemove(id, card) {
      function finish() {
        storage.deleteInsight(id);
        delete expandedIds[id];
        renderAll();
      }
      if (prefersReducedMotion) {
        finish();
        return;
      }
      card.classList.add("is-removing");
      setTimeout(finish, 240);
    }

    /* ---- rendering ---- */
    function renderAll() {
      var all = storage.getInsights();

      if (all.length === 0) {
        archiveContent.hidden = true;
        archiveEmpty.hidden = false;
        return;
      }
      archiveContent.hidden = false;
      archiveEmpty.hidden = true;
      renderList();
    }

    function renderList() {
      var filtered = getFilteredRecords();

      archiveCount.textContent = filtered.length + (filtered.length === 1 ? " signal found" : " signals found");

      archiveList.innerHTML = "";

      if (filtered.length === 0) {
        noResultsState.hidden = false;
        return;
      }
      noResultsState.hidden = true;

      filtered.forEach(function (record, index) {
        archiveList.appendChild(buildRecordCard(record, index, filtered.length));
      });
    }

    /* ---- search ---- */
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        currentSearch = searchInput.value.trim();
        renderList();
      });
    }

    /* ---- filters ---- */
    filterChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        filterChips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        currentFilter = chip.getAttribute("data-filter");
        renderList();
      });
    });

    /* ---- clear search (from no-results state) ---- */
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", function () {
        currentSearch = "";
        currentFilter = "all";
        if (searchInput) searchInput.value = "";
        filterChips.forEach(function (c) { c.classList.remove("is-active"); });
        var allChip = document.querySelector('.filter-chip[data-filter="all"]');
        if (allChip) allChip.classList.add("is-active");
        renderList();
      });
    }

    /* ---- clear archive ---- */
    if (clearArchiveBtn) {
      clearArchiveBtn.addEventListener("click", function () {
        clearConfirm.hidden = false;
        clearArchiveBtn.hidden = true;
      });
    }
    if (clearCancelBtn) {
      clearCancelBtn.addEventListener("click", function () {
        clearConfirm.hidden = true;
        clearArchiveBtn.hidden = false;
      });
    }
    if (clearConfirmBtn) {
      clearConfirmBtn.addEventListener("click", function () {
        storage.clearInsights();
        expandedIds = {};
        clearConfirm.hidden = true;
        clearArchiveBtn.hidden = false;
        renderAll();
      });
    }

    renderAll();
  });
})();
