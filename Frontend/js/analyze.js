(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Demo analysis engine
     ------------------------------------------------------------------
     This isolates the "analysis" step so it can later be swapped for a
     real API call without touching the rendering logic below.
     The eventual backend response is expected to resemble:
       { sentiment: "negative", confidence: 0.87, emotion: "disappointment" }
     ------------------------------------------------------------------ */
  var DEMO_RESULTS = {
    positive: { sentiment: "positive", confidence: 94, emotion: "Gratitude", polarity: 12 },
    negative: { sentiment: "negative", confidence: 87, emotion: "Disappointment", polarity: 78 },
    neutral: { sentiment: "neutral", confidence: 61, emotion: "Indifference", polarity: 50 }
  };

  var POSITIVE_HINTS = ["great", "love", "helpful", "amazing", "good", "thank", "excellent", "happy", "wonderful", "fantastic", "on time"];
  var NEGATIVE_HINTS = ["bad", "awful", "disappoint", "terrible", "hate", "worst", "broken", "poor", "slow", "annoying", "battery"];

  /**
   * Temporary demo implementation.
   * Later this function will be replaced by an API request and will
   * return a Promise resolving to the same shape.
   */
  function analyzeSignal(text) {
    var lower = text.toLowerCase();
    var score = 0;
    POSITIVE_HINTS.forEach(function (word) { if (lower.indexOf(word) !== -1) score += 1; });
    NEGATIVE_HINTS.forEach(function (word) { if (lower.indexOf(word) !== -1) score -= 1; });

    var key = "neutral";
    if (score > 0) key = "positive";
    else if (score < 0) key = "negative";

    // Return a shallow copy so callers never mutate the shared demo data.
    var base = DEMO_RESULTS[key];
    return {
      sentiment: base.sentiment,
      confidence: base.confidence,
      emotion: base.emotion,
      polarity: base.polarity
    };
  }

  /* ------------------------------------------------------------------
     DOM wiring
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("signalForm");
    var textarea = document.getElementById("signalInput");
    var charCount = document.getElementById("charCount");
    var clearBtn = document.getElementById("clearBtn");
    var analyzeBtn = document.getElementById("analyzeBtn");
    var inputError = document.getElementById("inputError");

    var emptyState = document.getElementById("emptyState");
    var loadingState = document.getElementById("loadingState");
    var resultState = document.getElementById("resultState");
    var workspaceDetail = document.getElementById("workspaceDetail");

    var resultSentiment = document.getElementById("resultSentiment");
    var resultCertainty = document.getElementById("resultCertainty");
    var resultEmotion = document.getElementById("resultEmotion");
    var resultPolarityHandle = document.getElementById("resultPolarityHandle");

    var originalSignalText = document.getElementById("originalSignalText");
    var breakdownSentiment = document.getElementById("breakdownSentiment");
    var breakdownEmotion = document.getElementById("breakdownEmotion");
    var breakdownCertaintyNote = document.getElementById("breakdownCertaintyNote");
    var breakdownCertaintyValue = document.getElementById("breakdownCertaintyValue");
    var breakdownCertaintyFill = document.getElementById("breakdownCertaintyFill");
    var saveInsightBtn = document.getElementById("saveInsightBtn");

    if (!form || !textarea) return;

    var currentCertainty = 0;
    var latestResult = null;
    var latestSaved = false;

    /* ---- character count + button state ---- */
    function updateMeta() {
      var len = textarea.value.length;
      charCount.textContent = len + (len === 1 ? " character" : " characters");
      var hasText = textarea.value.trim().length > 0;
      analyzeBtn.disabled = !hasText;
      if (hasText && !inputError.hidden) hideError();
    }

    function showError() {
      inputError.hidden = false;
    }
    function hideError() {
      inputError.hidden = true;
    }

    textarea.addEventListener("input", updateMeta);

    /* ---- example signals ---- */
    document.querySelectorAll(".example-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        textarea.value = chip.getAttribute("data-example") || "";
        updateMeta();
        textarea.focus();
      });
    });

    /* ---- clear ---- */
    clearBtn.addEventListener("click", function () {
      textarea.value = "";
      updateMeta();
      hideError();
      resetResults();
      textarea.focus();
    });

    function resetResults() {
      resultState.hidden = true;
      resultState.classList.remove("is-visible");
      loadingState.hidden = true;
      workspaceDetail.hidden = true;
      workspaceDetail.classList.remove("is-visible");
      emptyState.hidden = false;
      latestResult = null;
      resetSaveButton();
    }

    function resetSaveButton() {
      latestSaved = false;
      if (!saveInsightBtn) return;
      saveInsightBtn.classList.remove("is-saved");
      saveInsightBtn.textContent = "Save to Insight Board";
      saveInsightBtn.disabled = false;
    }

    /* ---- animated number helper ---- */
    function animateValue(el, from, to, duration, suffix) {
      if (prefersReducedMotion) {
        el.textContent = to + (suffix || "");
        return;
      }
      var startTime = null;
      function step(timestamp) {
        if (startTime === null) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(from + (to - from) * eased);
        el.textContent = current + (suffix || "");
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    /* ---- render a result into the readout + breakdown ---- */
    function renderResult(result, sourceText) {
      var sentimentLabel = result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1);

      resultSentiment.className = "sentiment-tag sentiment-tag--lg sentiment-tag--" + result.sentiment;
      resultSentiment.textContent = sentimentLabel;

      animateValue(resultCertainty, currentCertainty, result.confidence, 700, "%");
      resultEmotion.textContent = result.emotion;
      resultPolarityHandle.style.setProperty("--pos", result.polarity + "%");

      var borderColor =
        result.sentiment === "positive" ? "var(--color-positive)" :
        result.sentiment === "negative" ? "var(--color-negative)" :
        "var(--color-neutral)";
      resultPolarityHandle.style.borderColor = borderColor;

      currentCertainty = result.confidence;

      // Original signal + breakdown
      originalSignalText.textContent = sourceText;
      breakdownSentiment.textContent = sentimentLabel;
      breakdownCertaintyNote.textContent = result.confidence + "% certainty";
      breakdownEmotion.textContent = result.emotion;
      breakdownCertaintyValue.textContent = result.confidence + "%";
      breakdownCertaintyFill.style.setProperty("--fill", result.confidence + "%");
      var breakdownBar = document.getElementById("breakdownCertaintyBar");
      if (breakdownBar) breakdownBar.setAttribute("aria-label", result.confidence + " percent certainty");

      latestResult = {
        text: sourceText,
        sentiment: result.sentiment,
        emotion: result.emotion,
        confidence: result.confidence,
        polarity: result.polarity
      };
      resetSaveButton();
    }

    /* ---- submit handler ---- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var text = textarea.value.trim();
      if (!text) {
        showError();
        emptyState.hidden = true;
        loadingState.hidden = true;
        resultState.hidden = true;
        textarea.focus();
        return;
      }
      hideError();

      // Show loading state
      emptyState.hidden = true;
      resultState.hidden = true;
      resultState.classList.remove("is-visible");
      workspaceDetail.hidden = true;
      workspaceDetail.classList.remove("is-visible");
      loadingState.hidden = false;

      var loadingDelay = prefersReducedMotion ? 150 : 700;

      window.setTimeout(function () {
        var result = analyzeSignal(text);

        loadingState.hidden = true;
        resultState.hidden = false;
        workspaceDetail.hidden = false;

        renderResult(result, text);

        // Trigger reveal transitions
        window.requestAnimationFrame(function () {
          resultState.classList.add("is-visible");
          workspaceDetail.classList.add("is-visible");
        });

        // Move focus/scroll toward the result for a clear next step
        var readoutPanel = document.querySelector(".readout-panel");
        if (readoutPanel) {
          readoutPanel.setAttribute("tabindex", "-1");
          readoutPanel.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
          readoutPanel.focus({ preventScroll: true });
        }
      }, loadingDelay);
    });

    /* ---- save to Insight Board ---- */
    if (saveInsightBtn) {
      saveInsightBtn.addEventListener("click", function () {
        if (latestSaved || !latestResult || !window.SentimentLensStorage) return;

        window.SentimentLensStorage.saveInsight(latestResult);
        latestSaved = true;

        saveInsightBtn.classList.add("is-saved");
        saveInsightBtn.textContent = "Saved to Insight Board ✓";
        saveInsightBtn.disabled = true;
      });
    }

    updateMeta();
  });
})();
