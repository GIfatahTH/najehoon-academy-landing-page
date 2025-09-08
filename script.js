// script.js

// Smooth scrolling for anchor links (optional, CSS scroll-behavior: smooth is often enough)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Carousel functionality
document.addEventListener('DOMContentLoaded', () => {
    const carouselTrack = document.querySelector('.carousel-track');
    const slides = Array.from(carouselTrack.children);
    const nextButton = document.querySelector('.carousel-button.next');
    const prevButton = document.querySelector('.carousel-button.prev');

    let slideWidth = slides[0].getBoundingClientRect().width;
    let currentSlideIndex = 0;

    // Set up slide positions
    const setSlidePosition = (slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    };
    slides.forEach(setSlidePosition);

    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');
    };

    // When I click next, move slides to the left
    nextButton.addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        moveToSlide(carouselTrack, slides[currentSlideIndex === 0 ? slides.length - 1 : currentSlideIndex - 1], slides[currentSlideIndex]);
    });

    // When I click prev, move slides to the right
    prevButton.addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
        moveToSlide(carouselTrack, slides[currentSlideIndex === slides.length - 1 ? 0 : currentSlideIndex + 1], slides[currentSlideIndex]);
    });

    // Optional: Auto-play carousel
    setInterval(() => {
        nextButton.click();
    }, 5000); // Change slide every 5 seconds

    // Update slideWidth on resize
    window.addEventListener('resize', () => {
        slideWidth = slides[0].getBoundingClientRect().width;
        slides.forEach(setSlidePosition);
        carouselTrack.style.transform = 'translateX(-' + slides[currentSlideIndex].style.left + ')';
    });
});