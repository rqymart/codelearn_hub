document.addEventListener('DOMContentLoaded', () => {
    const bookmarksList = document.getElementById('bookmarks-list');
    const noBookmarksMessage = document.getElementById('no-bookmarks-message');
    const BOOKMARKS_KEY = 'codelearn_bookmarks';
  
    // Load bookmarks from localStorage
    function loadBookmarks() {
      return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    }
  
    // Save bookmarks to localStorage
    function saveBookmarks(bookmarks) {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    }
  
    // Remove a bookmark with animation
    function removeBookmark(videoId) {
      const bookmarkElement = document.querySelector(`[data-id="${videoId}"]`).closest('.bookmark-item');
      
      // Add fade-out animation
      bookmarkElement.style.opacity = '0';
      bookmarkElement.style.transform = 'translateX(100px)';
      
      setTimeout(() => {
        let bookmarks = loadBookmarks();
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== videoId);
        saveBookmarks(bookmarks);
        renderBookmarks(); // Re-render the list
      }, 300);
    }
  
    // Render bookmarks with animations
    function renderBookmarks() {
      const bookmarks = loadBookmarks();
  
      // Show/hide the no bookmarks message with animation
      if (bookmarks.length === 0) {
        noBookmarksMessage.style.display = 'block';
        noBookmarksMessage.style.opacity = '0';
        setTimeout(() => {
          noBookmarksMessage.style.opacity = '1';
        }, 50);
        bookmarksList.innerHTML = '';
        return;
      } else {
        noBookmarksMessage.style.display = 'none';
      }
  
      bookmarksList.innerHTML = '';
  
      bookmarks.forEach((bookmark, index) => {
        const li = document.createElement('li');
        li.classList.add('bookmark-item');
        li.style.opacity = '0';
        li.style.transform = 'translateY(20px)';
        
        const date = new Date(bookmark.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
  
        li.innerHTML = `
          <div class="bookmark-info">
            <h3 class="bookmark-title">${bookmark.title}</h3>
            <p class="bookmark-description">${bookmark.description}</p>
            <div class="bookmark-meta">
              <span class="bookmark-date">
                <i class="far fa-calendar"></i>
                Bookmarked on ${formattedDate}
              </span>
              <span class="bookmark-playlist">
                <i class="fas fa-list"></i>
                From: ${bookmark.playlistId}
              </span>
            </div>
          </div>
          <div class="bookmark-actions">
            <a href="tutorial-view.html?playlist=${bookmark.playlistId}#${bookmark.id}" 
               class="btn-watch" aria-label="Watch video">
              <i class="fas fa-play"></i> Watch
            </a>
            <button class="btn-remove" aria-label="Remove bookmark" data-id="${bookmark.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
  
        // Add click event to the remove button
        li.querySelector('.btn-remove').addEventListener('click', () => {
          removeBookmark(bookmark.id);
        });
  
        bookmarksList.appendChild(li);
  
        // Animate in with staggered delay
        setTimeout(() => {
          li.style.opacity = '1';
          li.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }
  
    // Initialize the page
    renderBookmarks();
  });