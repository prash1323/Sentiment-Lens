/* ==========================================================================
   SentimentLens — Insight storage layer
   Isolated localStorage access so the eventual backend API can replace
   this module without touching any UI code. Every function here returns
   plain data shaped like the future API response:
     { id, text, sentiment, emotion, confidence, polarity, timestamp }
   ========================================================================== */
(function (global) {
  "use strict";

  var STORAGE_KEY = "sentimentLensInsights";
  var DEMO_SEEDED_KEY = "sentimentLensInsightsSeeded";

  var DEMO_RECORDS = [
    {
      text: "The customer support was incredibly helpful.",
      sentiment: "positive",
      emotion: "Gratitude",
      confidence: 94,
      polarity: 12,
      minutesAgo: 12,
      demo: true
    },
    {
      text: "The product looks good, but the battery is disappointing.",
      sentiment: "negative",
      emotion: "Disappointment",
      confidence: 78,
      polarity: 78,
      minutesAgo: 55,
      demo: true
    },
    {
      text: "The package arrived on time.",
      sentiment: "neutral",
      emotion: "Indifference",
      confidence: 61,
      polarity: 50,
      minutesAgo: 130,
      demo: true
    },
    {
      text: "Support answered in minutes and actually solved my issue.",
      sentiment: "positive",
      emotion: "Relief",
      confidence: 91,
      polarity: 18,
      minutesAgo: 260,
      demo: true
    },
    {
      text: "I expected more for the price, honestly a bit let down.",
      sentiment: "negative",
      emotion: "Frustration",
      confidence: 83,
      polarity: 71,
      minutesAgo: 480,
      demo: true
    }
  ];

  function generateId() {
    return "sig_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function readRaw() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function writeRaw(records) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (err) {
      return false;
    }
  }

  /** Seeds a small set of believable demo records on first run only. */
  function seedDemoDataIfNeeded() {
    try {
      var alreadySeeded = global.localStorage.getItem(DEMO_SEEDED_KEY);
      var existing = readRaw();
      if (alreadySeeded || existing.length > 0) return;

      var now = Date.now();
      var seeded = DEMO_RECORDS.map(function (r) {
        return {
          id: generateId(),
          text: r.text,
          sentiment: r.sentiment,
          emotion: r.emotion,
          confidence: r.confidence,
          polarity: r.polarity,
          timestamp: new Date(now - r.minutesAgo * 60000).toISOString(),
          demo: true
        };
      });

      writeRaw(seeded);
      global.localStorage.setItem(DEMO_SEEDED_KEY, "true");
    } catch (err) {
      /* localStorage unavailable — board simply starts empty */
    }
  }

  /** Persists a new analysis result. Returns the saved record (with id/timestamp). */
  function saveInsight(record) {
    var records = readRaw();
    var saved = {
      id: generateId(),
      text: record.text,
      sentiment: record.sentiment,
      emotion: record.emotion,
      confidence: record.confidence,
      polarity: record.polarity,
      timestamp: new Date().toISOString()
    };
    records.unshift(saved);
    writeRaw(records);
    return saved;
  }

  /** Returns all stored records, sorted newest first by timestamp. */
  function getInsights() {
    return readRaw().sort(function (a, b) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /** Removes a single record by id. */
  function deleteInsight(id) {
    var records = readRaw().filter(function (r) { return r.id !== id; });
    writeRaw(records);
    return records;
  }

  /** Removes every stored record. */
  function clearInsights() {
    writeRaw([]);
    return [];
  }

  global.SentimentLensStorage = {
    seedDemoDataIfNeeded: seedDemoDataIfNeeded,
    saveInsight: saveInsight,
    getInsights: getInsights,
    deleteInsight: deleteInsight,
    clearInsights: clearInsights
  };
})(window);
