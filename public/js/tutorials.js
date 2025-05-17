// Tutorial data
let tutorials = [];

// DOM Elements
const tutorialsGrid = document.querySelector('.tutorials-grid');
const searchInput = document.getElementById('searchInput');
const languageFilter = document.getElementById('languageFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const loadingSpinner = document.querySelector('.loading-spinner');
const BOOKMARKS_KEY = 'codelearn_bookmarks';

// Load tutorial data from JSON files
async function loadTutorialData() {
    loadingSpinner.style.display = 'block';
    
    try {
        // List of available tutorials
        const tutorialFiles = ['python', 'javascript', 'php', 'java', 'webdev'];
        
        // Load each tutorial file
        const tutorialPromises = tutorialFiles.map(async (file) => {
            try {
                const response = await fetch(`assets/api/${file}.json`);
                if (!response.ok) throw new Error(`Failed to load ${file}.json`);
                const data = await response.json();
                
                return {
                    id: file,
                    title: data.title,
                    description: data.description || `Learn ${file.charAt(0).toUpperCase() + file.slice(1)} programming`,
                    language: file,
                    difficulty: 'beginner',
                    image: `assets/img/${file === 'python' ? 'Python.jpg' : 
                           file === 'javascript' ? 'javascript.png' :
                           file === 'java' ? 'java.png' :
                           file === 'webdev' ? 'webdev.jpg' :
                           file === 'php' ? 'php.jpg' : 'program.webp'}`,
                    playlist: file
                };
            } catch (error) {
                console.error(`Error loading ${file}.json:`, error);
                return null;
            }
        });
        
        // Wait for all tutorials to load
        const loadedTutorials = await Promise.all(tutorialPromises);
        tutorials = loadedTutorials.filter(tutorial => tutorial !== null);
        
        // Update language filter options
        updateLanguageFilter();
        
        // Update the grid
        updateTutorialGrid();
    } catch (error) {
        console.error('Error loading tutorials:', error);
        showNotification('Failed to load tutorials. Please try again later.', 'error');
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Update language filter options based on available tutorials
function updateLanguageFilter() {
    const languages = [...new Set(tutorials.map(t => t.language))];
    languageFilter.innerHTML = '<option value="">All Languages</option>';
    
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
        languageFilter.appendChild(option);
    });
}

// Create tutorial card
const createTutorialCard = (tutorial) => {
    const card = document.createElement('div');
    card.className = `tutorial-card ${tutorial.language} ${tutorial.difficulty}`;
    card.dataset.id = tutorial.id;

    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    const isBookmarked = bookmarks.some(bookmark => bookmark.id === tutorial.id);
    const bookmarkBtnClass = `bookmark-btn ${isBookmarked ? 'active' : ''}`;

    card.innerHTML = `
        <div class="card-image">
            <img src="${tutorial.image}" alt="${tutorial.title}" />
        </div>
        <div class="card-body">
            <h3>${tutorial.title}</h3>
            <p>${tutorial.description}</p>
            <div class="card-footer">
                <button class="${bookmarkBtnClass}" onclick="toggleBookmark('${tutorial.id}')" aria-label="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                    ${isBookmarked ? '<i class="fas fa-bookmark"></i>' : '<i class="far fa-bookmark"></i>'}
                </button>
                <a href="tutorial-view.html?playlist=${tutorial.playlist}" class="btn-start">Start Learning</a>
            </div>
        </div>
    `;

    return card;
};

// Filter tutorials
const filterTutorials = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedLanguage = languageFilter.value;
    const selectedDifficulty = difficultyFilter.value;

    return tutorials.filter(tutorial => {
        const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm) ||
                            tutorial.description.toLowerCase().includes(searchTerm);
        const matchesLanguage = !selectedLanguage || tutorial.language === selectedLanguage;
        const matchesDifficulty = !selectedDifficulty || tutorial.difficulty === selectedDifficulty;

        return matchesSearch && matchesLanguage && matchesDifficulty;
    });
};

// Update tutorial grid
const updateTutorialGrid = () => {
    const filteredTutorials = filterTutorials();
    tutorialsGrid.innerHTML = '';
    
    if (filteredTutorials.length === 0) {
        tutorialsGrid.innerHTML = '<div class="no-results">No tutorials found matching your criteria.</div>';
        return;
    }
    
    filteredTutorials.forEach(tutorial => {
        tutorialsGrid.appendChild(createTutorialCard(tutorial));
    });
};

// Bookmark functionality
const isBookmarked = (tutorialId) => {
    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    return bookmarks.some(bookmark => bookmark.id === tutorialId);
};

const toggleBookmark = (tutorialId) => {
    const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    const tutorial = tutorials.find(t => t.id === tutorialId);
    
    if (!tutorial) return;

    const existingBookmarkIndex = bookmarks.findIndex(b => b.id === tutorialId);
    
    if (existingBookmarkIndex === -1) {
        // Add new bookmark
        const newBookmark = {
            id: tutorial.id,
            title: tutorial.title,
            description: tutorial.description,
            playlistId: tutorial.playlist,
            timestamp: new Date().toISOString()
        };
        bookmarks.push(newBookmark);
        
        // Show success message
        showNotification('Tutorial bookmarked successfully!', 'success');
    } else {
        // Remove bookmark
        bookmarks.splice(existingBookmarkIndex, 1);
        
        // Show success message
        showNotification('Bookmark removed successfully!', 'success');
    }
    
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    updateTutorialGrid();
};

// Notification system
const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Event listeners
searchInput.addEventListener('input', updateTutorialGrid);
languageFilter.addEventListener('change', updateTutorialGrid);
difficultyFilter.addEventListener('change', updateTutorialGrid);

// Initial load
loadTutorialData();