class ProgressTracker {
  constructor() {
    this.progress = {};
    this.init();
  }

  init() {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
      this.progress = JSON.parse(savedProgress);
    }
  }

  updateProgress(tutorialId, status) {
    if (!this.progress[tutorialId]) {
      this.progress[tutorialId] = {
        started: false,
        completed: false,
        lastAccessed: null,
        exercises: {}
      };
    }

    this.progress[tutorialId] = {
      ...this.progress[tutorialId],
      ...status,
      lastAccessed: new Date().toISOString()
    };

    this.saveProgress();
  }

  updateExerciseProgress(tutorialId, exerciseId, status) {
    if (!this.progress[tutorialId]) {
      this.progress[tutorialId] = {
        started: true,
        completed: false,
        lastAccessed: new Date().toISOString(),
        exercises: {}
      };
    }

    this.progress[tutorialId].exercises[exerciseId] = {
      ...this.progress[tutorialId].exercises[exerciseId],
      ...status,
      lastAttempted: new Date().toISOString()
    };

    this.saveProgress();
  }

  getProgress(tutorialId) {
    return this.progress[tutorialId] || null;
  }

  getAllProgress() {
    return this.progress;
  }

  getCompletionRate() {
    const tutorials = Object.keys(this.progress);
    if (tutorials.length === 0) return 0;

    const completed = tutorials.filter(tutorialId => 
      this.progress[tutorialId].completed
    ).length;

    return (completed / tutorials.length) * 100;
  }

  saveProgress() {
    localStorage.setItem('learningProgress', JSON.stringify(this.progress));
  }
}

const progressTracker = new ProgressTracker();
export default progressTracker; 