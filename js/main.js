document.addEventListener("DOMContentLoaded", function () {
    // Back to Top Button Logic
    var backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top";
    backToTopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
    backToTopBtn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(backToTopBtn);

    function updateBackToTop() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollTop > 150) {
            backToTopBtn.classList.add("visible");
        } else {
            backToTopBtn.classList.remove("visible");
        }
    }

    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop(); // Initial check

    backToTopBtn.addEventListener("click", function() {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Mobile Menu Toggle (BossRequest Logic)
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileBtn && navLinks) {
        const icon = mobileBtn.querySelector('i');
        
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-xmark');
            }
        });

        // Close menu when link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                if (icon) {
                    icon.classList.add('fa-bars');
                    icon.classList.remove('fa-xmark');
                }
            });
        });
    }

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            if (navbar) {
                navbar.style.background = 'rgba(10, 14, 23, 0.95)';
                navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            }
        } else {
            if (navbar) {
                navbar.style.background = 'rgba(10, 14, 23, 0.8)';
                navbar.style.boxShadow = 'none';
            }
        }
    });

    // Animation on Scroll
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => scrollObserver.observe(el));

    // Contact Form Logic (Original)
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

            fetch(endpoint, {
                method: "POST",
                mode: "no-cors",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload)
            }).then(function () {
                statusEl.textContent = "Message sent successfully!";
                statusEl.style.color = "var(--accent)";
                contactForm.reset();
            }).catch(function (err) {
                statusEl.textContent = "Error sending message. Please try again.";
                statusEl.style.color = "var(--danger)";
            }).finally(function () {
                if (submitBtn) submitBtn.disabled = false;
            });
        });
    }
});
