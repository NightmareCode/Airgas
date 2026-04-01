document.addEventListener('DOMContentLoaded', () => {
    // Elegant reveal animation on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Staggered delay for child elements based on their DOM position
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 50); // 50ms stagger
                
                // Once revealed, stop observing
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all categories and products
    const animatedElements = document.querySelectorAll('.category-card, .product-card');
    animatedElements.forEach(el => observer.observe(el));

    console.log("Modern Airgas initialization complete.");
});
