// Main application logic
console.log('Main application loaded');

// Initialize theme and auth
document.addEventListener('DOMContentLoaded', () => {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.classList.add(savedTheme);
  }

  // Wait for auth to be initialized
  const checkAuth = setInterval(() => {
    if (window.auth) {
      clearInterval(checkAuth);
      setupAuth();
    }
  }, 100);
});

function setupAuth() {
  const logoutButton = document.getElementById('logout-button');
  const joinButton = document.querySelector('.join-now .btn-primary');
  
  // Update UI based on auth state
  window.auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      if (logoutButton) logoutButton.style.display = 'block';
      if (joinButton) {
        joinButton.textContent = 'Go to Tutorials';
        joinButton.href = 'tutorials.html';
      }
    } else {
      // User is signed out
      if (logoutButton) logoutButton.style.display = 'none';
      if (joinButton) {
        joinButton.textContent = 'Join Now';
        joinButton.href = 'signup.html';
      }
    }
  });

  // Setup logout handler
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      try {
        console.log('Logging out...');
        await window.auth.signOut();
        console.log('Logged out successfully');
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Error logging out:', error);
      }
    });
  }
} 