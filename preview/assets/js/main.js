document.addEventListener("DOMContentLoaded", function() {
  // 2. Modal Handlers (Download Modal & Live Lesson Modal)
  const modal = document.getElementById("downloadModal");
  const openModalBtns = document.querySelectorAll(".open-download-modal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const liveCloseBtn = document.getElementById("live-close");
  let lastFocusedElement = null;

  function openModal(e) {
    if (e) e.preventDefault();
    if (modal && modal.classList.contains("active")) return;

    lastFocusedElement = document.activeElement;

    // If live demo was open, close it without an extra history step
    const wasLiveOpen = liveModal && liveModal.classList.contains("open");
    if (wasLiveOpen) {
      liveModal.classList.remove("open");
    }

    if (modal) modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Synchronize history so Android hardware back gesture closes modal
    if (wasLiveOpen) {
      history.replaceState({ modal: "download" }, "", "");
    } else {
      history.pushState({ modal: "download" }, "", "");
    }

    if (closeModalBtn) closeModalBtn.focus();

    document.dispatchEvent(new CustomEvent("site:lead", {
      detail: {
        action: "try_free_unit_click",
        offer: "الوحدة الأولى مجانًا",
        source: "landing_page_cta"
      }
    }));
  }

  function closeModal(opts) {
    if (!modal || !modal.classList.contains("active")) return;
    modal.classList.remove("active");
    if (!liveModal || !liveModal.classList.contains("open")) {
      document.body.style.overflow = "";
    }
    if (!(opts && opts.fromPopState)) {
      history.back();
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  openModalBtns.forEach(btn => btn.addEventListener("click", openModal));
  if (closeModalBtn) closeModalBtn.addEventListener("click", function() { closeModal(); });

  if (modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === modal) closeModal();
    });
  }

  // Store Links click event dispatch
  const storeLinks = document.querySelectorAll(".store-link");
  storeLinks.forEach(link => {
    link.addEventListener("click", function() {
      const store = this.getAttribute("data-store") || "store_click";
      document.dispatchEvent(new CustomEvent("site:lead", {
        detail: {
          action: "store_download_click",
          store: store
        }
      }));
    });
  });

  // 2a. Three-voices entrance. Plays when the block is actually looked at,
  // for the same reason OnboardingEntrance takes `play`: a stagger that
  // runs off-screen is a stagger nobody sees.
  var voiceKey = document.getElementById("voice-key");
  if (voiceKey) {
    if (typeof IntersectionObserver === "function") {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          obs.unobserve(e.target);
        });
      }, { threshold: 0.35 }).observe(voiceKey);
    } else {
      voiceKey.classList.add("is-in");
    }
  }

  // 2b. Live lesson modal — mounts the real note_viewer engine from /demo/
  var liveModal = document.getElementById("live-modal");
  var liveLoader = document.getElementById("live-loader");
  var liveHost = document.getElementById("demo-host");
  var liveTimer = document.getElementById("live-timer");
  var engineStarted = false;
  var engineReady = false;
  var liveStart = null;
  var liveTick = null;
  var failSafeTimer = null;

  function handleEngineError() {
    clearInterval(liveTick);
    if (failSafeTimer) clearTimeout(failSafeTimer);
    engineStarted = false;
    if (liveModal && liveModal.classList.contains("open")) {
      closeLive();
      openModal();
      alert("تعذر تجهيز الدرس التفاعلي في المتصفح. يمكنك تجربة الوحدة الأولى كاملة مجانًا عبر تحميل التطبيق.");
    }
  }

  function startLiveEngine(isBackground) {
    if (engineStarted) return;
    engineStarted = true;

    if (!isBackground) {
      liveLoader.style.display = "flex";
      liveStart = performance.now();
      liveTick = setInterval(function () {
        if (liveTimer && liveStart) {
          liveTimer.innerText = "الوقت المنقضي: " +
            ((performance.now() - liveStart) / 1000).toFixed(1) + " ثانية";
        }
      }, 100);
    }

    window._flutter = window._flutter || {};
    var s = document.createElement("script");
    s.src = "demo/flutter_bootstrap.js";
    s.async = true;
    s.onerror = handleEngineError;
    document.body.appendChild(s);

    var poll = setInterval(function () {
      if (liveHost.querySelector("flt-glass-pane") || liveHost.querySelector("canvas")) {
        clearInterval(poll);
        clearInterval(liveTick);
        if (failSafeTimer) clearTimeout(failSafeTimer);
        engineReady = true;
        liveLoader.style.display = "none";
        liveHost.style.visibility = "visible";
        var activeDemo = (liveHost && liveHost.getAttribute("data-demo")) || "m0_0021";
        window.dispatchEvent(new CustomEvent("site:switch_demo", { detail: activeDemo }));
        document.dispatchEvent(new CustomEvent("site:lead", { detail: { action: "demo_ready", demo: activeDemo } }));
      }
    }, 80);

    // Failsafe safety net: maximum 30 seconds wait before graceful fallback
    failSafeTimer = setTimeout(function () {
      if (!engineReady) {
        clearInterval(poll);
        handleEngineError();
      }
    }, 30000);
  }

  const demoTitles = {
    "m0_0021": "درس تفاعلي: نسبية الحركة والسكون (علوم فيزيائية)",
    "m0_0011": "درس تفاعلي: القيمة المطلقة والمسافة (رياضيات)",
    "m0_0012": "درس تفاعلي: القيمة المطلقة والمسافة (رياضيات)"
  };

  function openLive(demoId, customTitle) {
    demoId = demoId || "m0_0021";
    var title = customTitle || demoTitles[demoId] || "درس تفاعلي حقيقي";

    var titleEl = document.getElementById("live-lesson-title") || document.querySelector("#live-modal .live-bar span");
    if (titleEl) titleEl.innerText = title;

    if (liveHost) {
      liveHost.setAttribute("data-demo", demoId);
    }

    // Always notify Flutter of the requested demo
    window.dispatchEvent(new CustomEvent("site:switch_demo", { detail: demoId }));

    if (liveModal && liveModal.classList.contains("open")) return;

    lastFocusedElement = document.activeElement;

    // If download modal was open, close it without an extra history step
    const wasDownloadOpen = modal && modal.classList.contains("active");
    if (wasDownloadOpen) {
      modal.classList.remove("active");
    }

    liveModal.classList.add("open");
    document.body.style.overflow = "hidden";

    // Synchronize history so Android hardware back gesture closes lesson
    if (wasDownloadOpen) {
      history.replaceState({ modal: "live", demo: demoId }, "", "");
    } else {
      history.pushState({ modal: "live", demo: demoId }, "", "");
    }

    if (liveCloseBtn) liveCloseBtn.focus();

    document.dispatchEvent(new CustomEvent("site:lead", {
      detail: { action: "demo_load_clicked", demo: demoId }
    }));

    if (engineReady) {
      // Instant opening: Flutter engine has already warmed and rendered its first frame!
      liveLoader.style.display = "none";
      liveHost.style.visibility = "visible";
      window.dispatchEvent(new CustomEvent("site:switch_demo", { detail: demoId }));
    } else {
      liveLoader.style.display = "flex";
      if (!engineStarted) {
        startLiveEngine(false);
      } else {
        // Already warming in background, show elapsed wait time
        liveStart = performance.now();
        liveTick = setInterval(function () {
          if (liveTimer && liveStart) {
            liveTimer.innerText = "الوقت المنقضي: " +
              ((performance.now() - liveStart) / 1000).toFixed(1) + " ثانية";
          }
        }, 100);
      }
    }
  }

  // fromPopState: the back gesture already popped our entry, so don't pop again.
  function closeLive(opts) {
    if (!liveModal || !liveModal.classList.contains("open")) return;
    liveModal.classList.remove("open");
    if (!modal || !modal.classList.contains("active")) {
      document.body.style.overflow = "";
    }
    if (!(opts && opts.fromPopState)) {
      history.back();
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  window.addEventListener("popstate", function () {
    if (liveModal && liveModal.classList.contains("open")) closeLive({ fromPopState: true });
    if (modal && modal.classList.contains("active")) closeModal({ fromPopState: true });
  });

  document.querySelectorAll(".open-live-demo").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (e) e.preventDefault();
      var demoId = this.getAttribute("data-demo") || "m0_0021";
      var title = this.getAttribute("data-title") || "";
      openLive(demoId, title);
    });
  });
  if (liveCloseBtn) liveCloseBtn.addEventListener("click", function () { closeLive(); });

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (liveModal && liveModal.classList.contains("open")) {
        closeLive();
      } else if (modal && modal.classList.contains("active")) {
        closeModal();
      }
    }
  });

      // Background Idle Engine Warming:
      // Once page assets load, silently boot Flutter in background when user scrolls towards the demo or during idle time
      window.addEventListener("load", function () {
        var trigger = document.getElementById("demo") || document.getElementById("how");
        var hasTriggered = false;
        function triggerWarm() {
          if (hasTriggered) return;
          hasTriggered = true;
          startLiveEngine(true);
        }

        if (trigger && typeof IntersectionObserver === "function") {
          var obs = new IntersectionObserver(function (entries) {
            if (entries[0].isIntersecting) {
              triggerWarm();
              obs.disconnect();
            }
          }, { rootMargin: "400px" });
          obs.observe(trigger);
        }

        // Also warm after 1.8s idle if user stays on hero fold
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(function () {
            setTimeout(triggerWarm, 1500);
          }, { timeout: 3000 });
        } else {
          setTimeout(triggerWarm, 1800);
        }
      });

      // 3. GSAP Entrance Animations
      try {
        if (window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

          // Hero entrance
          gsap.fromTo(".hero-masthead", 
            { y: 24, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
          );
          gsap.fromTo(".hero-lede", 
            { y: 20, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.8, delay: 0.15, ease: "power3.out" }
          );
          gsap.fromTo(".cta-cluster", 
            { y: 16, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.7, delay: 0.25, ease: "power3.out" }
          );
          gsap.fromTo(".hero-zellij-showcase", 
            { scale: 0.96, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
          );

          if (window.ScrollTrigger) {
            gsap.fromTo(".how-tile-card", 
              { y: 30, opacity: 0 }, 
              { 
                y: 0, 
                opacity: 1, 
                stagger: 0.1, 
                duration: 0.7, 
                ease: "power2.out",
                scrollTrigger: { trigger: "#how", start: "top 85%" } 
              }
            );

            gsap.fromTo(".dual-card", 
              { y: 30, opacity: 0 }, 
              { 
                y: 0, 
                opacity: 1, 
                stagger: 0.15, 
                duration: 0.8, 
                ease: "power2.out",
                scrollTrigger: { trigger: "#tracking", start: "top 85%" } 
              }
            );
          }
        }
      } catch (err) {
        console.warn("GSAP animation skipped:", err);
      }
    });
