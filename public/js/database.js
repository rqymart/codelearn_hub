class Database {
  constructor() {
    this.dbName = 'CodeLearnHub';
    this.version = 1;
    this.db = null;
    this.init();
  }

  async init() {
    try {
      this.db = await this.openDatabase();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('tutorials')) {
          const tutorialsStore = db.createObjectStore('tutorials', { keyPath: 'id' });
          tutorialsStore.createIndex('language', 'language', { unique: false });
          tutorialsStore.createIndex('difficulty', 'difficulty', { unique: false });
        }

        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('tutorialId', 'tutorialId', { unique: false });
          progressStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarksStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarksStore.createIndex('tutorialId', 'tutorialId', { unique: false });
          bookmarksStore.createIndex('userId', 'userId', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineActions')) {
          const offlineStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Tutorials
  async saveTutorial(tutorial) {
    return this.addItem('tutorials', tutorial);
  }

  async getTutorial(id) {
    return this.getItem('tutorials', id);
  }

  async getAllTutorials() {
    return this.getAllItems('tutorials');
  }

  async getTutorialsByLanguage(language) {
    return this.getItemsByIndex('tutorials', 'language', language);
  }

  async getTutorialsByDifficulty(difficulty) {
    return this.getItemsByIndex('tutorials', 'difficulty', difficulty);
  }

  // Progress
  async saveProgress(progress) {
    return this.addItem('progress', progress);
  }

  async getProgress(id) {
    return this.getItem('progress', id);
  }

  async getProgressByTutorial(tutorialId) {
    return this.getItemsByIndex('progress', 'tutorialId', tutorialId);
  }

  async getProgressByUser(userId) {
    return this.getItemsByIndex('progress', 'userId', userId);
  }

  // Bookmarks
  async saveBookmark(bookmark) {
    return this.addItem('bookmarks', bookmark);
  }

  async removeBookmark(id) {
    return this.deleteItem('bookmarks', id);
  }

  async getBookmarksByUser(userId) {
    return this.getItemsByIndex('bookmarks', 'userId', userId);
  }

  // Offline Actions
  async saveOfflineAction(action) {
    return this.addItem('offlineActions', {
      ...action,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
  }

  async getPendingOfflineActions() {
    return this.getItemsByIndex('offlineActions', 'status', 'pending');
  }

  async updateOfflineActionStatus(id, status) {
    const action = await this.getItem('offlineActions', id);
    if (action) {
      action.status = status;
      return this.updateItem('offlineActions', action);
    }
  }

  // Generic Database Operations
  async addItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getItemsByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

const db = new Database();
export default db; 