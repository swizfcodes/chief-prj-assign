    const hamburger = document.getElementById('hamburger');
    const navbar = document.getElementById('navbar');

    hamburger.addEventListener('click', () => {
      navbar.classList.toggle('active');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Remove class when out of view to retrigger
        } else {
          entry.target.classList.remove('visible');
          }
      });
    }, {
      threshold: 0.1
    });

  document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el)); 

