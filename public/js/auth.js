class Auth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    // Wait for Firebase to be initialized
    if (window.auth) {
      this.init();
    } else {
      console.log('Waiting for Firebase to initialize...');
      const checkAuth = setInterval(() => {
        if (window.auth) {
          clearInterval(checkAuth);
    this.init();
        }
      }, 100);
    }
    console.log('Auth initialized'); // Debug log
  }

  init() {
    console.log('Initializing auth state listener'); // Debug log
    window.auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user'); // Debug log
    if (user) {
        this.currentUser = user;
      this.isAuthenticated = true;
        // Redirect to home if on auth pages
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
          window.location.href = 'index.html';
        }
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
      }
    });
  }

  async register(email, password, username) {
    console.log('Attempting to register user:', { email, username }); // Debug log
    try {
      // Create user with email and password
      const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('User created successfully:', user.uid); // Debug log

      // Update profile with username
      await user.updateProfile({
        displayName: username
      });
      console.log('Profile updated with username'); // Debug log

      // Save user data to Firestore
      const userData = {
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        role: 'user',
        bookmarks: [],
        progress: {
          completedTutorials: [],
          currentTutorial: null
        }
      };
      console.log('Saving user data to Firestore:', userData); // Debug log
      
      // Make sure we're using window.db
      if (!window.db) {
        console.error('Firestore database not initialized');
        throw new Error('Database not initialized');
      }

      // Create the user document in Firestore
      await window.db.collection('users').doc(user.uid).set(userData);
      console.log('User data saved to Firestore successfully'); // Debug log

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      let errorMessage = 'An error occurred during registration.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async login(email, password) {
    console.log('Attempting to login user:', email); // Debug log
    try {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('User logged in successfully:', user.uid); // Debug log

      // Update last login time in Firestore
      await window.db.collection('users').doc(user.uid).update({
        lastLogin: new Date().toISOString()
      });
      console.log('Last login time updated'); // Debug log

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error); // Debug log
      let errorMessage = 'An error occurred during login.';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async logout() {
    try {
      await window.auth.signOut();
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Get user data from Firestore
  async getUserData(userId) {
    try {
      const userDoc = await window.db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Password reset functionality
  async resetPassword(email) {
    try {
      await window.auth.sendPasswordResetEmail(email);
      return { success: true, message: 'Password reset email sent.' };
    } catch (error) {
      console.error('Password reset error:', error); // Debug log
      let errorMessage = 'An error occurred while sending reset email.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }
}

const authInstance = new Auth();
window.authInstance = authInstance;

// Form handling
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, setting up form handlers'); // Debug log
  const signupForm = document.getElementById('signup-form');
  const loginForm = document.getElementById('login-form');
  const forgotPasswordLink = document.getElementById('forgot-password');

  if (signupForm) {
    console.log('Setting up signup form handler'); // Debug log
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Signup form submitted'); // Debug log
      
      // Get form elements
      const usernameInput = document.getElementById('username');
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const confirmPasswordInput = document.getElementById('confirm-password');
      const signupButton = document.getElementById('signup-button');
      const spinner = document.getElementById('signup-spinner');
      
      // Reset error messages
      document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
      document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
      
      // Validate form
      let isValid = true;
      
      if (!usernameInput || !usernameInput.value || usernameInput.value.length < 3) {
        showError(usernameInput, 'Username must be at least 3 characters long');
        isValid = false;
      }
      
      if (!isValidEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
        isValid = false;
      }
      
      if (passwordInput.value.length < 6) {
        showError(passwordInput, 'Password must be at least 6 characters long');
        isValid = false;
      }
      
      if (passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordInput, 'Passwords do not match');
        isValid = false;
      }
      
      if (!isValid) return;
      
      // Show loading state
      signupButton.disabled = true;
      spinner.style.display = 'block';
      
      try {
        console.log('Attempting to register user with username:', usernameInput.value); // Debug log
        const result = await authInstance.register(emailInput.value, passwordInput.value, usernameInput.value);
        console.log('Registration result:', result); // Debug log
        
        if (result.success) {
          showSuccess('Account created successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
        } else {
          showError(emailInput, result.error);
        }
      } catch (error) {
        console.error('Signup error:', error); // Debug log
        showError(emailInput, 'An error occurred during registration');
      } finally {
        signupButton.disabled = false;
        spinner.style.display = 'none';
      }
    });
  }

  if (loginForm) {
    console.log('Setting up login form handler'); // Debug log
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Login form submitted'); // Debug log
      
      // Get form elements
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const loginButton = document.getElementById('login-button');
      const spinner = document.getElementById('login-spinner');
      
      // Reset error messages
      document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
      document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
      
      // Validate form
      if (!isValidEmail(email.value)) {
        showError(email, 'Please enter a valid email address');
        return;
      }
      
      // Show loading state
      loginButton.disabled = true;
      spinner.style.display = 'block';
      
      try {
        console.log('Attempting to login user...'); // Debug log
        const result = await authInstance.login(email.value, password.value);
        console.log('Login result:', result); // Debug log
        
        if (result.success) {
          showSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
        } else {
          showError(email, result.error);
        }
      } catch (error) {
        console.error('Login error:', error); // Debug log
        showError(email, 'An error occurred during login');
      } finally {
        loginButton.disabled = false;
        spinner.style.display = 'none';
      }
    });
  }

  if (forgotPasswordLink) {
    console.log('Setting up forgot password handler'); // Debug log
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('Forgot password clicked'); // Debug log
      
      const email = document.getElementById('email').value;
      
      if (!isValidEmail(email)) {
        showError(document.getElementById('email'), 'Please enter a valid email address');
        return;
      }
      
      try {
        const result = await authInstance.resetPassword(email);
        
        if (result.success) {
          showSuccess(result.message);
        } else {
          showError(document.getElementById('email'), result.error);
        }
      } catch (error) {
        console.error('Password reset error:', error); // Debug log
        showError(document.getElementById('email'), 'An error occurred while sending reset email');
      }
    });
  }
});

// Helper functions
function showError(input, message) {
  console.log('Showing error:', message); // Debug log
  const errorElement = document.getElementById(`${input.id}-error`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    input.classList.add('error');
  }
}

function showSuccess(message) {
  console.log('Showing success:', message); // Debug log
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message show';
  successMessage.textContent = message;
  
  const form = document.querySelector('.auth-form');
  form.insertBefore(successMessage, form.firstChild);
  
  setTimeout(() => {
    successMessage.remove();
  }, 5000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
} 