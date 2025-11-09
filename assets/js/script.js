// Force page to start at top - optimized
(function () {
  const f = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  f();
  "scrollRestoration" in history && (history.scrollRestoration = "manual");
  window.addEventListener("beforeunload", f);
  window.addEventListener("load", f);
  window.addEventListener("pageshow", (e) => {
    e.persisted && f();
  });
  document.addEventListener("DOMContentLoaded", () => {
    f();
    hidePageLoader();
    setTimeout(() => {
      document.body.classList.add("loaded");
      document.documentElement.style.scrollBehavior = "smooth";
    }, 200);
  });
  let c = 0;
  const i = setInterval(() => {
    window.scrollY > 0
      ? (f(), c++, c > 10 && clearInterval(i))
      : clearInterval(i);
  }, 50);
})();

// Page Loader Functionality
function hidePageLoader() {
  const p = document.getElementById("page-loader");
  p &&
    setTimeout(() => {
      p.classList.add("hidden");
      setTimeout(() => {
        p.parentNode && p.remove();
      }, 500);
    }, 1500);
}

// Mobile Navigation Toggle
const h = document.querySelector(".hamburger"),
  n = document.querySelector(".nav-menu");
h &&
  h.addEventListener("click", () => {
    h.classList.toggle("active");
    n.classList.toggle("active");
  });
document.querySelectorAll(".nav-link").forEach((l) =>
  l.addEventListener("click", () => {
    h.classList.remove("active");
    n.classList.remove("active");
  })
);

// Navbar background change on scroll
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 100) {
    navbar.style.background = "rgba(255, 255, 255, 0.98)";
    navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
  } else {
    navbar.style.background = "rgba(255, 255, 255, 0.95)";
    navbar.style.boxShadow = "none";
  }
});

// Navigation links - smooth scrolling removed
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const offsetTop = target.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: "auto",
      });
    }
  });
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("loaded");
    }
  });
}, observerOptions);

// Observe elements for animation
document.addEventListener("DOMContentLoaded", () => {
  const animateElements = document.querySelectorAll(
    ".room-card, .amenity-card, .gallery-item, .contact-item"
  );
  animateElements.forEach((el) => {
    el.classList.add("loading");
    observer.observe(el);
  });
});

// Form handling
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
  bookingForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);

    // Basic validation
    if (
      !data.name ||
      !data.email ||
      !data.phone ||
      !data.roomType ||
      !data.checkIn ||
      !data.checkOut
    ) {
      showBookingErrorPopup("Please fill in all required fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      showBookingErrorPopup("Please enter a valid email address.");
      return;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
      showBookingErrorPopup("Please enter a valid phone number.");
      return;
    }

    // Date validation
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      showBookingErrorPopup("Check-in date cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn) {
      showBookingErrorPopup("Check-out date must be after check-in date.");
      return;
    }

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = "Sending...";
    submitButton.disabled = true;

    // Send booking data to Google Sheets
    sendBookingToGoogleSheets(data, this, submitButton, originalButtonText);
  });
}

// Notification system
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${
          type === "success"
            ? "#4CAF50"
            : type === "error"
            ? "#f44336"
            : "#2196F3"
        };
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Close button functionality
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
}

// Booking success popup
function showBookingSuccessPopup() {
  // Remove existing popups and notifications
  const existingPopups = document.querySelectorAll(
    ".booking-success-popup, .booking-error-popup"
  );
  existingPopups.forEach((popup) => popup.remove());
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create popup overlay
  const overlay = document.createElement("div");
  overlay.className = "booking-success-popup";
  overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Booking Request Submitted!</h3>
                <button class="popup-close">&times;</button>
            </div>
            <div class="popup-body">
                <div class="success-icon">✓</div>
                <p class="main-message">Our team will contact you within 4 hours.</p>
                <p class="contact-info">
                    For urgent queries, please contact us directly:<br>
                    <strong>WhatsApp:</strong> <a href="https://wa.me/917598068281" target="_blank">+91 7598068281</a><br>
                    <strong>Call:</strong> <a href="tel:+917598068281">+91 7598068281</a>
                </p>
            </div>
            <div class="popup-footer">
                <button class="btn btn-primary popup-ok">OK</button>
            </div>
        </div>
    `;

  // Add styles
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

  // Add popup content styles
  const style = document.createElement("style");
  style.textContent = `
        .booking-success-popup .popup-content {
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: scale(0.8);
            transition: transform 0.3s ease;
        }
        
        .booking-success-popup .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .booking-success-popup .popup-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.4em;
            font-weight: 600;
        }
        
        .booking-success-popup .popup-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .booking-success-popup .popup-close:hover {
            background: #f5f5f5;
            color: #666;
        }
        
        .booking-success-popup .popup-body {
            padding: 25px;
            text-align: center;
        }
        
        .booking-success-popup .success-icon {
            width: 60px;
            height: 60px;
            background: #4CAF50;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            font-weight: bold;
            margin: 0 auto 20px;
        }
        
        .booking-success-popup .main-message {
            font-size: 1.2em;
            color: #2c3e50;
            margin: 0 0 20px;
            font-weight: 500;
        }
        
        .booking-success-popup .contact-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 0;
            color: #555;
            line-height: 1.6;
        }
        
        .booking-success-popup .contact-info a {
            color: #007bff;
            text-decoration: none;
            font-weight: 500;
        }
        
        .booking-success-popup .contact-info a:hover {
            text-decoration: underline;
        }
        
        .booking-success-popup .popup-footer {
            padding: 15px 25px 25px;
            text-align: center;
        }
        
        .booking-success-popup .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .booking-success-popup .btn:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        @media (max-width: 600px) {
            .booking-success-popup .popup-content {
                width: 95%;
                margin: 20px;
            }
            
            .booking-success-popup .popup-header,
            .booking-success-popup .popup-body,
            .booking-success-popup .popup-footer {
                padding: 15px 20px;
            }
        }
    `;

  // Add styles to head
  document.head.appendChild(style);

  // Add to page
  document.body.appendChild(overlay);

  // Animate in
  setTimeout(() => {
    overlay.style.opacity = "1";
    const popupContent = overlay.querySelector(".popup-content");
    popupContent.style.transform = "scale(1)";
  }, 100);

  // Close functionality
  const closePopup = () => {
    overlay.style.opacity = "0";
    const popupContent = overlay.querySelector(".popup-content");
    popupContent.style.transform = "scale(0.8)";
    setTimeout(() => {
      overlay.remove();
      style.remove();
    }, 300);
  };

  // Close button events
  const closeBtn = overlay.querySelector(".popup-close");
  const okBtn = overlay.querySelector(".popup-ok");
  const closeButtons = [closeBtn, okBtn];

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closePopup);
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closePopup();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

// Booking error popup
function showBookingErrorPopup(message) {
  // Remove existing popups and notifications
  const existingPopups = document.querySelectorAll(
    ".booking-success-popup, .booking-error-popup"
  );
  existingPopups.forEach((popup) => popup.remove());
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create popup overlay
  const overlay = document.createElement("div");
  overlay.className = "booking-error-popup";
  overlay.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Booking Request Failed</h3>
                <button class="popup-close">&times;</button>
            </div>
            <div class="popup-body">
                <div class="error-icon">✕</div>
                <p class="main-message">${message}</p>
                <p class="contact-info">
                    If the problem persists, please contact us directly:<br>
                    <strong>WhatsApp:</strong> <a href="https://wa.me/917598068281" target="_blank">+91 7598068281</a><br>
                    <strong>Call:</strong> <a href="tel:+917598068281">+91 7598068281</a>
                </p>
            </div>
            <div class="popup-footer">
                <button class="btn btn-primary popup-ok">OK</button>
            </div>
        </div>
    `;

  // Add styles
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

  // Add popup content styles
  const style = document.createElement("style");
  style.textContent = `
        .booking-error-popup .popup-content {
            background: white;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            transform: scale(0.8);
            transition: transform 0.3s ease;
        }
        
        .booking-error-popup .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 25px 15px;
            border-bottom: 1px solid #eee;
        }
        
        .booking-error-popup .popup-header h3 {
            margin: 0;
            color: #e74c3c;
            font-size: 1.4em;
            font-weight: 600;
        }
        
        .booking-error-popup .popup-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #999;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .booking-error-popup .popup-close:hover {
            background: #f5f5f5;
            color: #666;
        }
        
        .booking-error-popup .popup-body {
            padding: 25px;
            text-align: center;
        }
        
        .booking-error-popup .error-icon {
            width: 60px;
            height: 60px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            font-weight: bold;
            margin: 0 auto 20px;
        }
        
        .booking-error-popup .main-message {
            font-size: 1.1em;
            color: #2c3e50;
            margin: 0 0 20px;
            font-weight: 500;
        }
        
        .booking-error-popup .contact-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 0;
            color: #555;
            line-height: 1.6;
        }
        
        .booking-error-popup .contact-info a {
            color: #007bff;
            text-decoration: none;
            font-weight: 500;
        }
        
        .booking-error-popup .contact-info a:hover {
            text-decoration: underline;
        }
        
        .booking-error-popup .popup-footer {
            padding: 15px 25px 25px;
            text-align: center;
        }
        
        .booking-error-popup .btn {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .booking-error-popup .btn:hover {
            background: #c0392b;
            transform: translateY(-2px);
        }
        
        @media (max-width: 600px) {
            .booking-error-popup .popup-content {
                width: 95%;
                margin: 20px;
            }
            
            .booking-error-popup .popup-header,
            .booking-error-popup .popup-body,
            .booking-error-popup .popup-footer {
                padding: 15px 20px;
            }
        }
    `;

  // Add styles to head
  document.head.appendChild(style);

  // Add to page
  document.body.appendChild(overlay);

  // Animate in
  setTimeout(() => {
    overlay.style.opacity = "1";
    const popupContent = overlay.querySelector(".popup-content");
    popupContent.style.transform = "scale(1)";
  }, 100);

  // Close functionality
  const closePopup = () => {
    overlay.style.opacity = "0";
    const popupContent = overlay.querySelector(".popup-content");
    popupContent.style.transform = "scale(0.8)";
    setTimeout(() => {
      overlay.remove();
      style.remove();
    }, 300);
  };

  // Close button events
  const closeBtn = overlay.querySelector(".popup-close");
  const okBtn = overlay.querySelector(".popup-ok");
  const closeButtons = [closeBtn, okBtn];

  closeButtons.forEach((btn) => {
    btn.addEventListener("click", closePopup);
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closePopup();
    }
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closePopup();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

// Set minimum dates for check-in and check-out
document.addEventListener("DOMContentLoaded", () => {
  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");

  if (checkInInput && checkOutInput) {
    // Set minimum date to today
    const today = new Date().toISOString().split("T")[0];
    checkInInput.min = today;

    // Update check-out minimum when check-in changes
    checkInInput.addEventListener("change", () => {
      const checkInDate = new Date(checkInInput.value);
      const nextDay = new Date(checkInDate);
      nextDay.setDate(nextDay.getDate() + 1);
      checkOutInput.min = nextDay.toISOString().split("T")[0];

      // If check-out is before new minimum, clear it
      if (checkOutInput.value && new Date(checkOutInput.value) <= checkInDate) {
        checkOutInput.value = "";
      }
    });
  }
});

// Gallery lightbox functionality
document.addEventListener("DOMContentLoaded", () => {
  const galleryItems = document.querySelectorAll(".gallery-item img");

  galleryItems.forEach((img) => {
    img.addEventListener("click", () => {
      openLightbox(img.src, img.alt);
    });
  });
});

function openLightbox(src, alt) {
  // Create lightbox overlay
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `
        <div class="lightbox-content">
            <img src="${src}" alt="${alt}">
            <button class="lightbox-close">&times;</button>
        </div>
    `;

  // Add styles
  lightbox.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

  const content = lightbox.querySelector(".lightbox-content");
  content.style.cssText = `
        position: relative;
        max-width: 90%;
        max-height: 90%;
    `;

  const img = lightbox.querySelector("img");
  img.style.cssText = `
        width: 100%;
        height: auto;
        border-radius: 10px;
    `;

  const closeBtn = lightbox.querySelector(".lightbox-close");
  closeBtn.style.cssText = `
        position: absolute;
        top: -40px;
        right: 0;
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
        padding: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

  // Add to page
  document.body.appendChild(lightbox);

  // Animate in
  setTimeout(() => {
    lightbox.style.opacity = "1";
  }, 10);

  // Close functionality
  const closeLightbox = () => {
    lightbox.style.opacity = "0";
    setTimeout(() => lightbox.remove(), 300);
  };

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
    }
  });
}

// Parallax effect for hero section - removed

// Room price calculator (optional enhancement)
function calculatePrice(roomType, nights) {
  const prices = {
    "standard-room": 1200,
    "deluxe-room": 1500,
    family: 2000,
  };

  const basePrice = prices[roomType] || 1200;
  const total = basePrice * nights;

  // Apply discount for longer stays
  let discount = 0;
  if (nights >= 7) discount = 0.15;
  else if (nights >= 3) discount = 0.1;

  return Math.round(total * (1 - discount));
}

// Add price calculation to room cards
document.addEventListener("DOMContentLoaded", () => {
  const roomCards = document.querySelectorAll(".room-card");

  roomCards.forEach((card) => {
    const priceElement = card.querySelector(".price");
    const originalPrice = parseInt(
      priceElement.textContent.replace("₹", "").replace(",", "")
    );

    // Add a small tooltip showing weekly/monthly rates
    const tooltip = document.createElement("div");
    tooltip.className = "price-tooltip";
    tooltip.innerHTML = `
            <div>Weekly: ₹${Math.round(
              originalPrice * 7 * 0.85
            ).toLocaleString()}</div>
            <div>Monthly: ₹${Math.round(
              originalPrice * 30 * 0.75
            ).toLocaleString()}</div>
        `;
    tooltip.style.cssText = `
            position: absolute;
            background: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 0.8rem;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 100;
        `;

    const priceContainer = card.querySelector(".room-price");
    priceContainer.style.position = "relative";
    priceContainer.appendChild(tooltip);

    priceContainer.addEventListener("mouseenter", () => {
      tooltip.style.opacity = "1";
    });

    priceContainer.addEventListener("mouseleave", () => {
      tooltip.style.opacity = "0";
    });
  });
});

// Lazy loading for images (performance optimization)
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(
    'img[src^="https://images.unsplash.com"]'
  );

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.remove("lazy");
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => {
    img.classList.add("lazy");
    imageObserver.observe(img);
  });
});

// Images will display normally without opacity animation

// Smooth reveal animation for sections - removed

// FAQ Accordion functionality
document.addEventListener("DOMContentLoaded", () => {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other FAQ items
      faqItems.forEach((otherItem) => {
        otherItem.classList.remove("active");
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
});

// Gallery Filter functionality
document.addEventListener("DOMContentLoaded", () => {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");

      // Update active button
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Filter gallery items
      galleryItems.forEach((item) => {
        const category = item.getAttribute("data-category");

        if (filter === "all" || category === filter) {
          item.classList.remove("hidden");
          item.style.animation = "fadeIn 0.5s ease";
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });
});

// Add CSS for reveal animation
const style = document.createElement("style");
style.textContent = `
    .reveal-section {
        opacity: 0;
        transform: translateY(50px);
        transition: all 0.8s ease;
    }
    
    .reveal-section.revealed {
        opacity: 1;
        transform: translateY(0);
    }
    
    .lazy {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(style);

// Send booking data to Google Sheets
function sendBookingToGoogleSheets(
  bookingData,
  form = null,
  submitButton = null,
  originalButtonText = null
) {
  // Use the Google Apps Script Web App URL from config
  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzysc7pc5uPkN440d4KDBCQx8Mq4V9tK_OsyjQCuGUGHexvVqKQwriRcVZBRJb_Q9Nv/exec";

  // Create form data to avoid CORS issues
  const formData = new FormData();
  formData.append("name", bookingData.name);
  formData.append("email", bookingData.email);
  formData.append("phone", bookingData.phone);
  formData.append("roomType", getRoomTypeDisplayName(bookingData.roomType));
  formData.append("checkIn", bookingData.checkIn);
  formData.append("checkOut", bookingData.checkOut);
  formData.append("message", bookingData.message || "");
  formData.append(
    "price",
    calculateBookingPrice(
      bookingData.roomType,
      bookingData.checkIn,
      bookingData.checkOut
    )
  );

  // Use XMLHttpRequest instead of fetch to avoid CORS issues
  const xhr = new XMLHttpRequest();
  xhr.open("POST", GOOGLE_SCRIPT_URL, true);

  // Log the request details
  console.log("Sending booking data:", bookingData);
  console.log("FormData entries:");
  for (let [key, value] of formData.entries()) {
    console.log(key + ":", value);
  }

  xhr.onload = function () {
    // Reset button state
    if (submitButton && originalButtonText) {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }

    console.log("XHR Status:", xhr.status);
    console.log("XHR Response Text:", xhr.responseText);
    console.log("XHR Response Type:", xhr.responseType);
    console.log("XHR Response Headers:", xhr.getAllResponseHeaders());

    if (xhr.status === 200) {
      try {
        const result = JSON.parse(xhr.responseText);
        console.log("Parsed result:", result);

        if (result.success) {
          console.log("Success! Showing success popup");
          // Reset form on success
          if (form) {
            form.reset();
          }
          showBookingSuccessPopup();
        } else {
          console.log("Backend returned success: false, error:", result.error);
          showBookingErrorPopup(
            "Error submitting booking: " + (result.error || "Unknown error")
          );
        }
      } catch (error) {
        console.log("JSON parse error:", error);
        console.log("Response text that failed to parse:", xhr.responseText);
        showBookingErrorPopup("Error submitting booking. Please try again.");
      }
    } else {
      console.log("HTTP status not 200:", xhr.status);
      showBookingErrorPopup("Error submitting booking. Please try again.");
    }
  };

  xhr.onerror = function () {
    // Reset button state
    if (submitButton && originalButtonText) {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }

    showBookingErrorPopup(
      "Network error. Please check your connection and try again."
    );
  };

  xhr.send(formData);
}

// Get display name for room type
function getRoomTypeDisplayName(roomType) {
  const roomTypes = {
    "standard-room": "Standard Room",
    "deluxe-room": "Deluxe Room",
    family: "Family Room",
  };
  return roomTypes[roomType] || roomType;
}

// Calculate booking price
function calculateBookingPrice(roomType, checkIn, checkOut) {
  const prices = {
    "standard-room": 1200,
    "deluxe-room": 1500,
    family: 2000,
  };

  const basePrice = prices[roomType] || 1200;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  return basePrice * nights;
}
