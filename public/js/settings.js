// Theme buttons
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const theme = button.getAttribute('data-theme');
    setTheme(theme);
    
    // Update active state
    themeButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
  });
});

// Initialize active state based on current theme
document.addEventListener('DOMContentLoaded', () => {
  const currentTheme = localStorage.getItem('theme') || 'dark-mode';
  const activeButton = document.querySelector(`.theme-btn[data-theme="${currentTheme}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }

  // Check if user is logged in and load user data
  window.auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    try {
      console.log('Fetching user data for:', user.uid);
      // Get user data from Firestore
      const userDoc = await window.db.collection('users').doc(user.uid).get();
      console.log('User document exists:', userDoc.exists);
      
      // If user document doesn't exist, create it
      if (!userDoc.exists) {
        console.log('Creating new user document');
        const userData = {
          username: user.displayName || user.email.split('@')[0], // Use displayName if available, otherwise email prefix
          email: user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: 'user',
          bookmarks: [],
          progress: {
            completedTutorials: [],
            currentTutorial: null
          }
        };
        await window.db.collection('users').doc(user.uid).set(userData);
        console.log('User document created with data:', userData);
      }
      
      // Get the latest user data
      const updatedUserDoc = await window.db.collection('users').doc(user.uid).get();
      const userData = updatedUserDoc.data();
      console.log('User data from Firestore:', userData);
      
      // Populate email
      const emailInput = document.getElementById('email');
      if (emailInput) {
        emailInput.value = user.email;
        console.log('Email populated:', user.email);
      }

      // Populate username
      const usernameInput = document.getElementById('username');
      if (usernameInput && updatedUserDoc.exists) {
        const username = userData.username || user.displayName || user.email.split('@')[0];
        console.log('Setting username to:', username);
        usernameInput.value = username;
      } else {
        console.log('Username input not found or user document does not exist');
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      alert("Error loading user data. Please refresh the page.");
    }
  });
});

// Logout functionality
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    try {
      await window.auth.signOut();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  });
}

// Delete account functionality
const deleteAccountButton = document.getElementById('delete-account');
if (deleteAccountButton) {
  deleteAccountButton.addEventListener('click', async () => {
    const user = window.auth.currentUser;
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    // Confirm deletion
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    try {
      // Delete user data from Firestore
      await window.db.collection('users').doc(user.uid).delete();
      
      // Delete user authentication
      await user.delete();
      
      // Redirect to login page
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  });
}

// Profile update functionality
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = window.auth.currentUser;
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const username = document.getElementById('username').value;
    
    try {
      await window.db.collection('users').doc(user.uid).update({
        username: username
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  });
}

// Password change functionality
const passwordForm = document.getElementById('password-form');
if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = window.auth.currentUser;
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validate password requirements
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      alert('New password must be different from current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    try {
      // Show loading state
      const submitButton = passwordForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Changing Password...';

      // Reauthenticate user before changing password
      const credential = window.auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await user.reauthenticateWithCredential(credential);
      
      // Change password
      await user.updatePassword(newPassword);
      
      // Clear form
      passwordForm.reset();
      
      // Show success message
      alert('Password changed successfully!');
      
      // Update button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;

      // Optional: Sign out user after password change for security
      const shouldSignOut = confirm('For security reasons, you will be signed out. Would you like to continue?');
      if (shouldSignOut) {
        await window.auth.signOut();
        window.location.href = 'login.html';
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Handle specific error cases
      let errorMessage = 'Error changing password. ';
      if (error.code === 'auth/wrong-password') {
        errorMessage += 'Current password is incorrect.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage += 'Please log out and log in again before changing your password.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage += 'Password is too weak. Please use a stronger password.';
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
      
      // Reset button state
      const submitButton = passwordForm.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = 'Change Password';
    }
  });
} 