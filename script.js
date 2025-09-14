// script.js

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// New Carousel functionality (simplified)
document.addEventListener('DOMContentLoaded', () => {
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    const slides = Array.from(carouselWrapper.children);
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');
    const dotsContainer = document.querySelector('.carousel-dots');
    const carouselContainer = document.querySelector('.carousel-container'); // Get the main container

    if (!carouselWrapper || slides.length === 0) return;

    let currentSlideIndex = 0;
    let autoPlayInterval;

    // Create navigation dots
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('carousel-dot');
        if (index === 0) dot.classList.add('active-dot');
        dot.addEventListener('click', () => {
            clearInterval(autoPlayInterval);
            showSlide(index);
            startAutoPlay();
        });
        dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.children);

    // Function to show a specific slide
    const showSlide = (index) => {
        slides.forEach((slide, i) => {
            slide.classList.remove('active-slide');
            slide.style.opacity = '0'; // Hide all slides
        });

        dots.forEach((dot, i) => {
            dot.classList.remove('active-dot');
        });

        slides[index].classList.add('active-slide');
        slides[index].style.opacity = '1'; // Show the active slide

        dots[index].classList.add('active-dot');
        currentSlideIndex = index;
    };

    // Auto-play functionality
    const startAutoPlay = () => {
        autoPlayInterval = setInterval(() => {
            currentSlideIndex = (currentSlideIndex + 1) % slides.length;
            showSlide(currentSlideIndex);
        }, 5000); // Change slide every 5 seconds
    };

    // Event listeners for buttons
    nextButton.addEventListener('click', () => {
        clearInterval(autoPlayInterval);
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        showSlide(currentSlideIndex);
        startAutoPlay();
    });

    prevButton.addEventListener('click', () => {
        clearInterval(autoPlayInterval);
        currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        showSlide(currentSlideIndex);
        startAutoPlay();
    });

    // Initialize carousel on load
    showSlide(0);
    startAutoPlay();

    // No need for height adjustments on resize anymore as container has min-height
});