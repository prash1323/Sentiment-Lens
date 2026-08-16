(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      menu.setAttribute("data-open", "false");
    }

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      menu.setAttribute("data-open", "true");
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      isOpen ? closeMenu() : openMenu();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ------------------------------------------------------------------
     Smooth scroll for in-page anchors (with sticky-bar offset)
     ------------------------------------------------------------------ */
  function initSmoothScroll() {
    var lensbar = document.getElementById("lensbar");
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var offset = (lensbar ? lensbar.offsetHeight : 0) + 12;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      });
    });
  }

  /* ------------------------------------------------------------------
     Scroll-triggered reveal animations
     ------------------------------------------------------------------ */
  function initScrollReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            setTimeout(function () {
              entry.target.classList.add("is-visible");
            }, i * 60);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------
     Interactive analysis preview (demo data only — no backend/API)
     ------------------------------------------------------------------ */
  var SAMPLE_SIGNALS = [
    {
      text: "The product looks beautiful, but the battery is awful.",
      sentiment: "negative",
      confidence: 0.78,
      emotion: "Disappointment",
      polarity: 78 // 0 = fully positive, 100 = fully negative
    },
    {
      text: "Support answered in minutes and actually solved my issue.",
      sentiment: "positive",
      confidence: 0.94,
      emotion: "Gratitude",
      polarity: 12
    },
    {
      text: "Shipping was on time. Packaging was standard.",
      sentiment: "neutral",
      confidence: 0.61,
      emotion: "Indifference",
      polarity: 50
    },
    {
      text: "I expected more for the price, honestly a bit let down.",
      sentiment: "negative",
      confidence: 0.83,
      emotion: "Frustration",
      polarity: 71
    }
  ];

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

  function initAnalysisPreview() {
    var card = document.getElementById("analysisPreview");
    if (!card) return;

    var signalText = document.getElementById("signalText");
    var sentimentTag = document.getElementById("sentimentTag");
    var certaintyValue = document.getElementById("certaintyValue");
    var emotionValue = document.getElementById("emotionValue");
    var polarityHandle = document.getElementById("polarityHandle");
    var cycleBtn = document.getElementById("cycleBtn");

    var currentIndex = 0;
    var currentConfidence = Math.round(SAMPLE_SIGNALS[0].confidence * 100);

    function applySample(sample, animate) {
      signalText.textContent = sample.text;

      sentimentTag.className = "sentiment-tag sentiment-tag--" + sample.sentiment;
      sentimentTag.textContent = sample.sentiment.charAt(0).toUpperCase() + sample.sentiment.slice(1);

      emotionValue.textContent = sample.emotion;

      var targetConfidence = Math.round(sample.confidence * 100);
      if (animate) {
        animateValue(certaintyValue, currentConfidence, targetConfidence, 650, "%");
      } else {
        certaintyValue.textContent = targetConfidence + "%";
      }
      currentConfidence = targetConfidence;

      polarityHandle.style.setProperty("--pos", sample.polarity + "%");
      var borderColor =
        sample.sentiment === "positive"
          ? "var(--color-positive)"
          : sample.sentiment === "negative"
          ? "var(--color-negative)"
          : "var(--color-neutral)";
      polarityHandle.style.borderColor = borderColor;
    }

    // Initial state already matches SAMPLE_SIGNALS[0] in markup; just wire polarity var.
    polarityHandle.style.setProperty("--pos", SAMPLE_SIGNALS[0].polarity + "%");

    if (cycleBtn) {
      cycleBtn.addEventListener("click", function () {
        currentIndex = (currentIndex + 1) % SAMPLE_SIGNALS.length;
        applySample(SAMPLE_SIGNALS[currentIndex], true);
      });
    }
  }

  /* ------------------------------------------------------------------
     Lensbar shadow-on-scroll (subtle depth cue)
     ------------------------------------------------------------------ */
  function initLensbarState() {
    var lensbar = document.getElementById("lensbar");
    if (!lensbar) return;
    function update() {
      if (window.scrollY > 8) {
        lensbar.style.boxShadow = "0 1px 0 rgba(27,28,32,0.03), 0 8px 20px -16px rgba(27,28,32,0.25)";
      } else {
        lensbar.style.boxShadow = "none";
      }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ------------------------------------------------------------------
     Init
     ------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initSmoothScroll();
    initScrollReveal();
    initAnalysisPreview();
    initLensbarState();
  });
})();
