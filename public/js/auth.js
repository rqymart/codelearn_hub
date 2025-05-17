class Auth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check for existing session
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUser = JSON.parse(user);
      this.isAuthenticated = true;
    }
  }

  async register(email, password, username) {
    try {
      // In a real app, this would be an API call
      const user = {
        id: Date.now(),
        email,
        username,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser = user;
      this.isAuthenticated = true;
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      // In a real app, this would be an API call
      const user = {
        id: Date.now(),
        email,
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      this.currentUser = user;
      this.isAuthenticated = true;
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

const auth = new Auth();
export default auth; 