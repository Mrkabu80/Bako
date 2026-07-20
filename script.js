// Show lower section when clicking down arrow
document.addEventListener('DOMContentLoaded', function() {
    const downArrow = document.getElementById('down-arrow');
    const moreContent = document.getElementById('more-content');
    
    if (downArrow && moreContent) {
        downArrow.addEventListener('click', function() {
            moreContent.classList.add('visible');
            moreContent.scrollIntoView({ behavior: 'smooth' });
        });
    }
});

// Automatic animation for image appearance
window.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('.images img');
    
    images.forEach((img, index) => {
        img.style.opacity = 0;
        setTimeout(() => {
            img.style.transition = 'opacity 1s';
            img.style.opacity = 1;
        }, 400 + index * 300);
    });
});

// Remove visible class from lower section initially
document.addEventListener('DOMContentLoaded', function() {
    const moreContent = document.getElementById('more-content');
    if (moreContent) {
        moreContent.classList.remove('visible');
    }
});

// Image slider functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.slider-btn.prev');
const nextBtn = document.querySelector('.slider-btn.next');

function showSlide(index) {
    if (!slides.length || !dots.length) return;
    
    try {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
            if (dots[i]) {
                dots[i].classList.toggle('active', i === index);
            }
        });
        currentSlide = index;
    } catch (error) {
        console.error('Error showing slide:', error);
    }
}

// Initialize slider if elements exist
document.addEventListener('DOMContentLoaded', function() {
    if (slides.length && dots.length) {
        showSlide(0);
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                showSlide((currentSlide - 1 + slides.length) % slides.length);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                showSlide((currentSlide + 1) % slides.length);
            });
        }
        
        dots.forEach((dot, index) => {
            if (dot) {
                dot.addEventListener('click', () => showSlide(index));
            }
        });
    }
});
