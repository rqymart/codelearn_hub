// Theme management
const THEME_KEY = 'theme';
const DARK_THEME = 'dark-mode';
const LIGHT_THEME = 'light-mode';

// Function to set theme
function setTheme(theme) {
    // Remove both theme classes
    document.body.classList.remove(DARK_THEME, LIGHT_THEME);
    
    // Add the appropriate theme class
    if (theme === LIGHT_THEME) {
        document.body.classList.add(LIGHT_THEME);
    } else {
        document.body.classList.add(DARK_THEME);
    }
    
    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
    
    // Update theme toggle button icon
    const themeToggle = document.querySelector('.dark-mode-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = theme === DARK_THEME ? '🌙' : '☀️';
    }
}

// Function to toggle theme
function toggleTheme() {
    const currentTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(newTheme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
    setTheme(savedTheme);
    
    // Add theme toggle button to header if it doesn't exist
    const header = document.querySelector('.header');
    const existingToggle = document.querySelector('.dark-mode-toggle');
    
    if (header && !existingToggle) {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'dark-mode-toggle';
        themeToggle.setAttribute('aria-label', 'Toggle dark/light mode');
        themeToggle.innerHTML = savedTheme === DARK_THEME ? '🌙' : '☀️';
        themeToggle.addEventListener('click', toggleTheme);
        header.appendChild(themeToggle);
    }
}); 