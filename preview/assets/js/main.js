document.addEventListener("DOMContentLoaded", function() {
      // 2. Download Modal Handlers
      const modal = document.getElementById("downloadModal");
      const openModalBtns = document.querySelectorAll(".open-download-modal");
      const closeModalBtn = document.getElementById("closeModalBtn");

      function openModal(e) {
        if (e) e.preventDefault();
        if (modal) modal.classList.add("active");
        document.dispatchEvent(new CustomEvent("site:lead", {
          detail: {
            action: "try_free_unit_click",
            offer: "الوحدة الأولى مجانًا",
            source: "landing_page_cta"
          }
        }));
      }

      function closeModal() {
        if (modal) modal.classList.remove("active");
      }

      openModalBtns.forEach(btn => btn.addEventListener("click", openModal));
      if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

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
        s.onerror = function () {
          clearInterval(liveTick);
          engineStarted = false;
          if (liveModal && liveModal.classList.contains("open")) {
            closeLive();
            alert("تعذر تحميل الدرس التفاعلي. يمكنك تحميل التطبيق وتجربة الوحدة الأولى مجانًا.");
          }
        };
        document.body.appendChild(s);

        var poll = setInterval(function () {
          if (liveHost.querySelector("flt-glass-pane") || liveHost.querySelector("canvas")) {
            clearInterval(poll);
            clearInterval(liveTick);
            engineReady = true;
            liveLoader.style.display = "none";
            liveHost.style.visibility = "visible";
            document.dispatchEvent(new CustomEvent("site:lead", { detail: { action: "demo_ready" } }));
          }
        }, 80);
      }

      function openLive() {
        closeModal();
        liveModal.classList.add("open");
        document.body.style.overflow = "hidden";
        // A history entry so the phone's own back gesture closes the lesson
        // instead of leaving the site — that is what visitors reach for.
        history.pushState({ liveModal: true }, "", "");
        document.dispatchEvent(new CustomEvent("site:lead", {
          detail: { action: "demo_load_clicked" }
        }));

        if (engineReady) {
          // Instant opening: Flutter engine has already warmed and rendered its first frame!
          liveLoader.style.display = "none";
          liveHost.style.visibility = "visible";
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
        liveModal.classList.remove("open");
        document.body.style.overflow = "";
        if (!(opts && opts.fromPopState)) history.back();
      }

      window.addEventListener("popstate", function () {
        if (liveModal.classList.contains("open")) closeLive({ fromPopState: true });
      });

      document.querySelectorAll(".open-live-demo").forEach(function (b) {
        b.addEventListener("click", openLive);
      });
      document.getElementById("live-close").addEventListener("click", function () { closeLive(); });
      window.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && liveModal.classList.contains("open")) closeLive();
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
