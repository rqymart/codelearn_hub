class API {
  constructor() {
    this.baseUrl = 'https://api.codelearnhub.com/v1';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  setAuthToken(token) {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Tutorials
  async getTutorials(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tutorials?${queryString}`);
  }

  async getTutorialById(id) {
    return this.request(`/tutorials/${id}`);
  }

  // Exercises
  async getExercises(tutorialId) {
    return this.request(`/tutorials/${tutorialId}/exercises`);
  }

  async submitExercise(tutorialId, exerciseId, solution) {
    return this.request(`/tutorials/${tutorialId}/exercises/${exerciseId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ solution })
    });
  }

  // User Progress
  async getProgress() {
    return this.request('/progress');
  }

  async updateProgress(tutorialId, data) {
    return this.request(`/progress/${tutorialId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Bookmarks
  async getBookmarks() {
    return this.request('/bookmarks');
  }

  async addBookmark(tutorialId) {
    return this.request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ tutorialId })
    });
  }

  async removeBookmark(tutorialId) {
    return this.request(`/bookmarks/${tutorialId}`, {
      method: 'DELETE'
    });
  }

  // User Profile
  async updateProfile(data) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async getProfile() {
    return this.request('/profile');
  }

  // Code Execution
  async executeCode(language, code) {
    return this.request('/execute', {
      method: 'POST',
      body: JSON.stringify({ language, code })
    });
  }
}

const api = new API();
export default api; 