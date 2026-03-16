document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var list = document.querySelector(".nav-list");
  if (toggle && list) {
    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      list.classList.remove("is-open");
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
      list.classList.toggle("is-open");
    });

    list.addEventListener("click", function (e) {
      var target = e.target;
      if (target && target.tagName === "A") closeMenu();
    });

    document.addEventListener("click", function (e) {
      if (!list.classList.contains("is-open")) return;
      var nav = toggle.closest(".nav");
      if (nav && nav.contains(e.target)) return;
      closeMenu();
    });
  }

  var trainingLinks = document.querySelectorAll('a[href*="training.html"]');
  for (var t = 0; t < trainingLinks.length; t++) {
    var a = trainingLinks[t];
    var li = a.closest ? a.closest("li") : null;
    if (li && li.parentNode) {
      li.parentNode.removeChild(li);
      continue;
    }
    if (a && a.parentNode) a.parentNode.removeChild(a);
  }

  var contactForm = document.querySelector("form.contact-form-styled");
  if (contactForm) {
    var endpointMeta = document.querySelector('meta[name="contact-endpoint"]');
    var endpoint = endpointMeta ? String(endpointMeta.getAttribute("content") || "").trim() : "";
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    var statusEl = document.createElement("div");
    statusEl.className = "form-status";
    if (submitBtn && submitBtn.parentNode) submitBtn.parentNode.insertBefore(statusEl, submitBtn.nextSibling);

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!endpoint || endpoint.indexOf("REPLACE_WITH_YOUR_WEB_APP_URL") !== -1) {
        statusEl.textContent = "Form is not configured. Please contact support.";
        return;
      }

      var nameEl = contactForm.querySelector('input[name="name"]');
      var emailEl = contactForm.querySelector('input[name="email"]');
      var messageEl = contactForm.querySelector('textarea[name="message"]');

      var payload = {
        name: nameEl ? nameEl.value : "",
        email: emailEl ? emailEl.value : "",
        message: messageEl ? messageEl.value : "",
        pageUrl: window.location.href
      };

      if (submitBtn) submitBtn.disabled = true;
      statusEl.textContent = "Sending...";

      // Use no-cors mode for Google Apps Script to avoid CORS errors
      // Note: In no-cors mode, we can't read the response status/body,
      // so we assume success if no network error occurs.
      fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function () {
          statusEl.textContent = "Message sent successfully!";
          statusEl.style.color = "green"; // Optional: make it green to indicate success
          contactForm.reset();
        })
        .catch(function (err) {
          console.error(err);
          statusEl.textContent = "Failed to send. Please try again.";
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  // Back to Top Button Logic
  var backToTopBtn = document.createElement("button");
  backToTopBtn.className = "back-to-top";
  backToTopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
  backToTopBtn.setAttribute("aria-label", "Back to top");
  document.body.appendChild(backToTopBtn);

  window.addEventListener("scroll", function() {
    if (window.scrollY > 150) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  var quoteWrap = document.querySelector(".hero-quotes");
  if (quoteWrap) {
    var heroForQuotes = document.querySelector(".hero");
    if (heroForQuotes) {
      var heroQuotesObserver = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e.intersectionRatio < 0.5) quoteWrap.classList.add("is-faded");
          else quoteWrap.classList.remove("is-faded");
        }
      }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      heroQuotesObserver.observe(heroForQuotes);
    }

    var allCards = quoteWrap.querySelectorAll(".quote-card");
    var cards = Array.prototype.slice.call(allCards, 0, 4);
    for (var ci = 4; ci < allCards.length; ci++) {
      allCards[ci].style.display = "none";
    }
    var quotes = [
      { text: "Safety is the first gas we deliver.", meta: "SCBA • EEBD • Fit tests" },
      { text: "Purity that powers performance.", meta: "Oxygen • Nitrogen • Argon • Specialty gases" },
      { text: "CO₂ refilling for food & beverage and industrial use.", meta: "CO₂ • Refill • Exchange" },
      { text: "Industrial gas refilling when uptime matters.", meta: "O₂ • N₂ • Ar • Fast turnaround" },
      { text: "Cylinder testing and certification you can trust.", meta: "Hydrostatic test • Compliance" },
      { text: "Keep cylinders safe, legal, and ready for use.", meta: "Inspection • Testing • Records" },
      { text: "Gas detector calibration for accurate readings.", meta: "Calibration • Bump test • Support" },
      { text: "SCBA inspection and servicing for readiness.", meta: "SCBA • Inspection • Maintenance" },
      { text: "Respiratory PPE that fits the job and standard.", meta: "PPE • Masks • Cartridges" },
      { text: "Supply contracts and delivery support for sites.", meta: "Delivery • Rentals • One‑stop supply" },
      { text: "Certified testing support for safer workplaces.", meta: "AS11 Cylinder • AS22 Mask Fit Test" },
      { text: "Reliable supply from stock to site.", meta: "Competitive pricing • Rentals • Support" },
      { text: "Measured purity, measurable impact.", meta: "Specialty gases • Blends" },
      { text: "Fit to protect, tested to perform.", meta: "Mask fit • Breathing apparatus" },
      { text: "Safety equipment that keeps teams compliant.", meta: "PPE • Detection • Support" },
      { text: "From refill to compliance — keep operations moving.", meta: "Refill • Testing • Calibration" }
    ];
    function pick(n) {
      var idx = [];
      var available = quotes.map(function(_, i){ return i; });
      for (var k = 0; k < n && available.length; k++) {
        var r = Math.floor(Math.random() * available.length);
        idx.push(available[r]);
        available.splice(r, 1);
      }
      return idx;
    }
    function getExclusions(cardWidthPct, cardHeightPct) {
      var hero = document.querySelector(".hero");
      if (!hero) return [];
      var heroRect = hero.getBoundingClientRect();

      function toPctRect(r) {
        return {
          left: ((r.left - heroRect.left) / heroRect.width) * 100,
          top: ((r.top - heroRect.top) / heroRect.height) * 100,
          width: (r.width / heroRect.width) * 100,
          height: (r.height / heroRect.height) * 100
        };
      }

      var content = hero.querySelector(".hero-content");
      var actions = hero.querySelector(".hero-actions");
      var ex = [];
      var buffer = 5; // 5% buffer around static elements

      // Add hero content and actions as exclusion zones with padding for quote cards
      if (content) {
        var c = toPctRect(content.getBoundingClientRect());
        ex.push({
          left: c.left - cardWidthPct - buffer,
          top: c.top - cardHeightPct - buffer,
          width: c.width + 2 * cardWidthPct + 2 * buffer,
          height: c.height + 2 * cardHeightPct + 2 * buffer
        });
      }
      if (actions) {
        var a = toPctRect(actions.getBoundingClientRect());
        ex.push({
          left: a.left - cardWidthPct - buffer,
          top: a.top - cardHeightPct - buffer,
          width: a.width + 2 * cardWidthPct + 2 * buffer,
          height: a.height + 2 * cardHeightPct + 2 * buffer
        });
      }

      // Add boundaries of the hero as exclusion zones
      ex.push({ left: -cardWidthPct, top: -cardHeightPct, width: cardWidthPct, height: 100 + 2 * cardHeightPct }); // Left boundary
      ex.push({ left: 100, top: -cardHeightPct, width: cardWidthPct, height: 100 + 2 * cardHeightPct }); // Right boundary
      ex.push({ left: -cardWidthPct, top: -cardHeightPct, width: 100 + 2 * cardWidthPct, height: cardHeightPct }); // Top boundary
      ex.push({ left: -cardWidthPct, top: 100, width: 100 + 2 * cardWidthPct, height: cardHeightPct }); // Bottom boundary

      return ex;
    }

    function repositionAndContent(card) {
      // 1. Pick Quote (avoiding currently displayed ones)
      var usedTexts = [];
      for (var i = 0; i < cards.length; i++) {
        if (cards[i] !== card) {
          var csUsed = window.getComputedStyle(cards[i]);
          if (csUsed.display === "none" || csUsed.opacity === "0") continue;
          var p = cards[i].querySelector("p");
          if (p) usedTexts.push(p.textContent);
        }
      }
      var availableQuotes = quotes.filter(function(q) { return usedTexts.indexOf(q.text) === -1; });
      if (availableQuotes.length === 0) availableQuotes = quotes; 
      
      var qIdx = Math.floor(Math.random() * availableQuotes.length);
      var q = availableQuotes[qIdx];
      
      var p = card.querySelector("p");
      var m = card.querySelector(".quote-meta");
      if (p) p.textContent = q.text;
      if (m) m.textContent = q.meta;

      // 2. Find Safe Position (Strict Collision Detection)
      var hero = document.querySelector(".hero");
      var content = hero.querySelector(".hero-content");
      if (!hero || !content) return;

      var heroRect = hero.getBoundingClientRect();
      var contentRect = content.getBoundingClientRect();
      
      var margin = 20;

      var prevDisplay = card.style.display;
      var prevVisibility = card.style.visibility;
      var prevLeft = card.style.left;
      var prevTop = card.style.top;
      card.style.display = "block";
      card.style.visibility = "hidden";
      card.style.left = "0px";
      card.style.top = "0px";
      var measured = card.getBoundingClientRect();
      var cardW = Math.ceil(measured.width) || 280;
      var cardH = Math.ceil(measured.height) || 120;
      card.style.display = prevDisplay;
      card.style.visibility = prevVisibility;
      card.style.left = prevLeft;
      card.style.top = prevTop;

      // Define exclusion zone (Center Box + Padding)
      var exclusion = {
          left: contentRect.left - heroRect.left - margin,
          top: contentRect.top - heroRect.top - margin,
          right: contentRect.right - heroRect.left + margin,
          bottom: contentRect.bottom - heroRect.top + margin
      };

      // Get positions of other active cards to avoid overlap
      var otherCards = [];
      for (var i = 0; i < cards.length; i++) {
          if (cards[i] !== card) {
              var csOther = window.getComputedStyle(cards[i]);
              if (csOther.display === "none" || csOther.opacity === "0") continue;
              var r = cards[i].getBoundingClientRect();
              otherCards.push({
                  left: (r.left - heroRect.left) - margin,
                  top: (r.top - heroRect.top) - margin,
                  right: (r.right - heroRect.left) + margin,
                  bottom: (r.bottom - heroRect.top) + margin
              });
          }
      }

      var bestX = -1, bestY = -1;
      var found = false;
      var maxTries = 300;

      var safeTop = margin;
      var header = document.querySelector(".site-header");
      if (header) {
        var headerRect = header.getBoundingClientRect();
        safeTop = Math.max(safeTop, headerRect.bottom - heroRect.top + margin);
      }

      var maxLeft = heroRect.width - cardW - margin;
      var maxTop = heroRect.height - cardH - margin;
      if (maxLeft > margin && maxTop > safeTop) {

        for (var t = 0; t < maxTries; t++) {
          var x = margin + Math.random() * (maxLeft - margin);
          var y = safeTop + Math.random() * (maxTop - safeTop);

          var candidate = {
            left: x,
            top: y,
            right: x + cardW,
            bottom: y + cardH
          };

          if (!(candidate.right < exclusion.left || candidate.left > exclusion.right || 
                candidate.bottom < exclusion.top || candidate.top > exclusion.bottom)) {
            continue;
          }

          var collisionCard = false;
          for (var k = 0; k < otherCards.length; k++) {
            var o = otherCards[k];
            if (!(candidate.right < o.left || candidate.left > o.right || 
                  candidate.bottom < o.top || candidate.top > o.bottom)) {
              collisionCard = true;
              break;
            }
          }
          if (collisionCard) continue;

          found = true;
          bestX = x;
          bestY = y;
          break;
        }
      }

      if (found) {
          // Convert back to percentages for responsiveness
          var leftPct = (bestX / heroRect.width) * 100;
          var topPct = (bestY / heroRect.height) * 100;
          card.style.left = leftPct + "%";
          card.style.top = topPct + "%";
          card.style.display = "block";
      } else {
          // Fallback: place in visible corners depending on index
          var idx = Array.prototype.indexOf.call(cards, card) % 4;
          var fallback = [
            {x: margin, y: safeTop},
            {x: heroRect.width - cardW - margin, y: safeTop},
            {x: margin, y: heroRect.height - cardH - margin},
            {x: heroRect.width - cardW - margin, y: heroRect.height - cardH - margin}
          ][idx];
          var leftPctFallback = (fallback.x / heroRect.width) * 100;
          var topPctFallback = (fallback.y / heroRect.height) * 100;
          card.style.left = leftPctFallback + "%";
          card.style.top = topPctFallback + "%";
          card.style.display = "block";
      }
    }

    function startCardLoop(card, initialDelay) {
      setTimeout(function() {
          // Cycle Start
          repositionAndContent(card);
          
          requestAnimationFrame(function(){
              card.classList.remove("switch"); // Fade in
              
              setTimeout(function(){
                  card.classList.add("switch"); // Fade out
                  
                  setTimeout(function(){
                      startCardLoop(card, 0); // Loop
                  }, 1000); // 1s buffer for fade out transition
                  
              }, 5000); // 5s display time
          });
      }, initialDelay);
    }

    function prepareHidden() {
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.add("switch");
      }
    }

    prepareHidden();
    
    // Only start quote animation on desktop
    if (window.innerWidth > 768) {
      // Start independent loops with stagger
      for (var i = 0; i < cards.length; i++) {
        startCardLoop(cards[i], i * 1500);
      }
    } else {
      // On mobile, ensure cards are visible and have content
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove("switch");
        // Optional: Set specific static quotes if desired, or keep HTML defaults
      }
    }
    
    window.addEventListener("resize", function(){ 
      // Reload if crossing breakpoint? For now, simple check on load is sufficient.
    });
  }
  var selectors = [
    ".hero-inner",
    ".hero-quotes",
    ".quote-card",
    ".intro-copy > *",
    ".intro-img",
    ".page-hero .container",
    ".content .narrow > *",
    ".grid.two > *",
    ".about-media",
    ".features .card",
    ".cards-4 .card",
    ".cards-3 .card",
    ".cards-2 .card",
    ".stat",
    ".timeline-item",
    ".contact-form",
    ".contact-details",
    ".map-card",
    ".stat-value[data-count]"
  ];
  var targets = [];
  for (var i = 0; i < selectors.length; i++) {
    var found = document.querySelectorAll(selectors[i]);
    for (var j = 0; j < found.length; j++) {
      found[j].classList.add("reveal");
      found[j].style.transitionDelay = (j * 0.07) + "s";
      targets.push(found[j]);
    }
  }
  function countUp(el) {
    var t = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(t)) return;
    if (el.getAttribute("data-counted") === "true") return;
    el.setAttribute("data-counted", "true");
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      el.textContent = Math.floor(p * t).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = t.toLocaleString();
    }
    el.textContent = "0";
    requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    for (var k = 0; k < entries.length; k++) {
      var e = entries[k];
      if (e.isIntersecting) {
        e.target.classList.add("reveal-visible");
        if (e.target.matches(".stat-value[data-count]")) {
          countUp(e.target);
        }
      } else {
        if (e.target.classList.contains("reveal-visible")) {
          e.target.classList.remove("reveal-visible");
        }
      }
    }
  }, { threshold: 0.1 });
  for (var m = 0; m < targets.length; m++) {
    io.observe(targets[m]);
  }

  // Hero Background Animation
  var heroSection = document.querySelector(".hero");
  if (heroSection) {
    var totalFrames = 240;
    var animFolder = "assets/HomepageAnimation/";
    var animImages = [];
    var animFrame = 1;
    var animDirection = 1; // 1: forward, -1: backward
    var fpsInterval = 50; // 20fps
    var lastTime = 0;

    // Preload images
    for (var i = 1; i <= totalFrames; i++) {
      var img = new Image();
      var num = i.toString().padStart(3, '0');
      img.src = animFolder + "ezgif-frame-" + num + ".png";
      animImages.push(img);
    }

    // Animation Loop
    function animate(currentTime) {
      requestAnimationFrame(animate);

      if (!lastTime) lastTime = currentTime;
      var elapsed = currentTime - lastTime;

      if (elapsed > fpsInterval) {
        lastTime = currentTime - (elapsed % fpsInterval);

        var idx = animFrame - 1;
        if (animImages[idx] && animImages[idx].complete) {
          // Use CSS variable to update background
          heroSection.style.setProperty('--hero-bg', 'url("' + animImages[idx].src + '")');
        }

        animFrame += animDirection;

        // Ping-pong logic
        if (animFrame >= totalFrames) {
          animFrame = totalFrames;
          animDirection = -1;
        } else if (animFrame <= 1) {
          animFrame = 1;
          animDirection = 1;
        }
      }
    }
    
    requestAnimationFrame(animate);
  }

  // Smooth scroll for sidebar filters
  var filterLinks = document.querySelectorAll('.filter-list a[href^="#"]');
  if (filterLinks.length > 0) {
    filterLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var targetId = this.getAttribute('href').substring(1);
        var targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          // Add offset for sticky header
          var headerOffset = 100; // Adjusted for header + spacing
          var elementPosition = targetSection.getBoundingClientRect().top;
          var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });

          // Update active state
          filterLinks.forEach(function(l) { l.classList.remove('active'); });
          this.classList.add('active');
        }
      });
    });
  }

  // Lightbox Logic for Regulators and Valves
  // Only activate if we find .product-item images on the page
  if (document.querySelector('.product-item')) {
      document.addEventListener('click', function(e) {
          if (e.target.matches('.product-item img')) {
              e.preventDefault();
              var src = e.target.src;
              
              // Create overlay if it doesn't exist
              var overlay = document.querySelector('.lightbox-overlay');
              if (!overlay) {
                  overlay = document.createElement('div');
                  overlay.className = 'lightbox-overlay';
                  overlay.innerHTML = '<button class="lightbox-close">&times;</button><div class="lightbox-content"><img class="lightbox-image" src=""></div>';
                  document.body.appendChild(overlay);
                  
                  // Close events
                  overlay.addEventListener('click', function(ev) {
                      if (ev.target === overlay || ev.target.matches('.lightbox-close')) {
                          overlay.classList.remove('active');
                          document.body.style.overflow = '';
                      }
                  });
              }
              
              var img = overlay.querySelector('.lightbox-image');
              img.src = src;
              
              // Small timeout to allow transition
              requestAnimationFrame(function() {
                  overlay.classList.add('active');
                  document.body.style.overflow = 'hidden';
              });
          }
      });
  }
});

