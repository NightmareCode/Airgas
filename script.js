// Vanilla JavaScript for basic interactions if needed.

document.addEventListener('DOMContentLoaded', () => {
    // We can add any required interactivity here. 
    // Example: A fade-in observer for scroll animations
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        // card.style.opacity = 0;
        // observer.observe(card);
    });

    console.log("Airgas Landing Page Local Initialization Complete.");
});
