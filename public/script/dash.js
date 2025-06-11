window.addEventListener('DOMContentLoaded', () => {
  fetch('/api/profile')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load profile data');
      return res.json();
    })
    .then(profile => {
      document.getElementById('username').textContent = profile.username || '-';
      document.getElementById('age').textContent = profile.age || '-';
      document.getElementById('phone').textContent = profile.phoneNo || '-';
      document.getElementById('honors').textContent = profile.honors || '-';
      document.getElementById('exitDate').textContent = profile.exitDate || '-';
      document.getElementById('town').textContent = profile.town || '-';
      document.getElementById('state').textContent = profile.state || '-';
      document.getElementById('ward').textContent = profile.ward || '-';
      document.getElementById('quarters').textContent = profile.quarters || '-';

      const qualList = document.getElementById('qualifications-list');
      qualList.innerHTML = '';

      if (Array.isArray(profile.qualifications)) {
        profile.qualifications.forEach(qual => {
          const li = document.createElement('li');
          li.textContent = qual.trim();
          qualList.appendChild(li);
        });
      } else {
        qualList.innerHTML = '<li>No qualifications listed</li>';
      }
    })
    .catch(error => {
      console.error('Profile fetch error:', error);
      alert('Failed to load profile data. Please try again.');
    });
});
