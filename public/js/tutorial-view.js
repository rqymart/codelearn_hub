document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const playlistList = document.querySelector('.playlist-list');
    const videoPlayer = document.getElementById('youtube-player');
    const videoTitleElement = document.getElementById('video-title');
    const videoDescriptionElement = document.getElementById('video-description');
    const progressBarInner = document.getElementById('progress-bar-inner');
    const progressLabel = document.getElementById('progress-label');
    const bookmarkButton = document.getElementById('bookmark-button');
    const codeBlockElement = document.getElementById('code-block');
    const courseTitleElement = document.querySelector('.playlist-course-title');
    const notesTextarea = document.getElementById('notes');
    const saveNotesButton = document.getElementById('save-notes');
    const exerciseDescription = document.getElementById('exercise-description');
    const editorContainer = document.getElementById('editor-container');
    const runButton = document.getElementById('run-code');
    const resetButton = document.getElementById('reset-code');
    const outputElement = document.getElementById('output');
    const languageSelector = document.getElementById('language-selector');
    const videoLoading = document.getElementById('video-loading');
    const playlistSearch = document.getElementById('playlist-search');
    const toggleCodeButton = document.getElementById('toggle-code');
    const copyCodeButton = document.getElementById('copy-code');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const closeShortcutsButton = document.querySelector('.btn-close');

    // --- State Variables ---
    let currentPlaylistId = 'javascript';
    let videos = [];
    let filteredVideos = [];
    let totalVideos = 0;
    let courseTitle = 'Loading...';
    let watchedVideos = new Set();
    let bookmarkedVideoId = null;
    let currentVideoId = null;
    let WATCHED_VIDEOS_KEY = '';
    let BOOKMARKED_VIDEO_KEY = '';
    let NOTES_KEY = '';
    let exercises = {};
    let starterCode = '';
    let editor;
    let isCodeVisible = true;
    let pyodide = null;
    let isPyodideLoading = false;
    let player = null;
    let videoProgress = new Map(); // Track video progress
    const BOOKMARKS_KEY = 'codelearn_bookmarks';

    // --- Language Mapping ---
    const languageMap = {
        python: { judge0: 71, monaco: 'python' },
        javascript: { judge0: 63, monaco: 'javascript' },
        java: { judge0: 62, monaco: 'java' },
        php: { judge0: 68, monaco: 'php' },
        html: { judge0: 80, monaco: 'html' }
      };

    // --- Monaco Editor Initialization ---
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(editorContainer, {
        value: '// Start coding here...',
            language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            contextmenu: true,
            formatOnPaste: true,
            formatOnType: true
    });
    console.log("Monaco Editor initialized successfully.");
    });

    // --- Error Handling ---
    function showError(message, element) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        element.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // --- Loading States ---
    function showLoading() {
        videoLoading.style.display = 'flex';
    }

    function hideLoading() {
        videoLoading.style.display = 'none';
    }

    // --- Video Search ---
    function filterVideos(query) {
        query = query.toLowerCase().trim();
        filteredVideos = videos.filter(video => 
            video.title.toLowerCase().includes(query) ||
            (video.desc && video.desc.toLowerCase().includes(query))
        );
        
        renderPlaylist();
        
        // Show feedback if no results
        const existingFeedback = document.querySelector('.search-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        if (filteredVideos.length === 0 && query) {
            const feedback = document.createElement('div');
            feedback.className = 'search-feedback';
            feedback.textContent = 'No videos found matching your search';
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        }
    }

    // --- Code Visibility Toggle ---
    function toggleCodeVisibility() {
        isCodeVisible = !isCodeVisible;
        codeBlockElement.style.display = isCodeVisible ? 'block' : 'none';
        toggleCodeButton.innerHTML = isCodeVisible ? 
            '<i class="fas fa-code"></i> Hide Code' : 
            '<i class="fas fa-code"></i> Show Code';
    }

    // --- Copy Code ---
    function copyCodeToClipboard() {
        const code = editor.getValue();
        navigator.clipboard.writeText(code).then(() => {
            const originalText = copyCodeButton.innerHTML;
            copyCodeButton.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyCodeButton.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            showError('Failed to copy code', editorContainer);
        });
    }

    // --- Keyboard Shortcuts ---
    function handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.key) {
            case ' ':
                if (videoPlayer) {
                    e.preventDefault();
                    const iframe = videoPlayer.contentWindow;
                    iframe.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                playNextVideo();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                playPreviousVideo();
                break;
        }

        // Ctrl/Cmd + key combinations
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    saveNotes();
                    break;
                case 'Enter':
                    e.preventDefault();
                    runCode();
                    break;
                case '/':
                    e.preventDefault();
                    toggleCodeVisibility();
                    break;
                case '?':
                    e.preventDefault();
                    toggleShortcutsModal();
                    break;
            }
        }
    }

    function toggleShortcutsModal() {
        if (shortcutsModal.hidden) {
            shortcutsModal.hidden = false;
            shortcutsModal.style.display = 'flex';
        } else {
            shortcutsModal.hidden = true;
            shortcutsModal.style.display = 'none';
        }
    }

    // --- Core Functions ---
    async function fetchPlaylistData(playlistId) {
        const filePath = `assets/api/${playlistId}.json`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Validate the data structure
            if (!data || !data.videos || !Array.isArray(data.videos)) {
                throw new Error('Invalid playlist data structure');
            }
            
            // Ensure each video has required fields
            data.videos = data.videos.map(video => ({
                id: video.id || '',
                title: video.title || 'Untitled Video',
                desc: video.desc || 'No description available',
                duration: video.duration || 'Unknown',
                difficulty: video.difficulty || 'Beginner',
                code: video.code || '',
                ...video
            }));
            
            console.log(`Successfully loaded playlist: ${playlistId}`);
            return data;
        } catch (error) {
            console.error(`Failed to fetch playlist data from ${filePath}:`, error);
            
            // Try to load a default playlist if the requested one fails
            if (playlistId !== 'javascript') {
                console.log('Attempting to load default playlist (javascript)');
                return fetchPlaylistData('javascript');
            }
            
            showError('Failed to load playlist data. Please try again later.', document.body);
            return null;
        }
    }

    function loadFromLocalStorage() {
        if (!WATCHED_VIDEOS_KEY) return;
        
        const watchedData = localStorage.getItem(WATCHED_VIDEOS_KEY);
        console.log('Loading watched videos from storage:', watchedData);
        
        if (watchedData) {
            try {
                watchedVideos = new Set(JSON.parse(watchedData));
                updateProgressBar(); // Update progress bar after loading data
            } catch (error) {
                console.error('Error parsing watched videos data:', error);
                watchedVideos = new Set();
            }
        } else {
            watchedVideos = new Set();
        }
        
        bookmarkedVideoId = localStorage.getItem(BOOKMARKED_VIDEO_KEY);
        const savedNotes = localStorage.getItem(NOTES_KEY);
        if (savedNotes) {
            notesTextarea.value = savedNotes;
        }
    }

    function saveWatchedVideos() {
        if (!WATCHED_VIDEOS_KEY) return;
        console.log('Saving watched videos:', Array.from(watchedVideos));
        localStorage.setItem(WATCHED_VIDEOS_KEY, JSON.stringify(Array.from(watchedVideos)));
    }

    function saveBookmark() {
        if (bookmarkedVideoId) {
            localStorage.setItem(BOOKMARKED_VIDEO_KEY, bookmarkedVideoId);
        } else {
            localStorage.removeItem(BOOKMARKED_VIDEO_KEY);
        }
    }

    function saveNotes() {
        if (!currentVideoId) return;
        
        const notes = notesTextarea.value;
        localStorage.setItem(`${NOTES_KEY}_${currentVideoId}`, notes);
        
        const saveButton = document.getElementById('save-notes');
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveButton.classList.add('saved');
        
        setTimeout(() => {
            saveButton.innerHTML = originalText;
            saveButton.classList.remove('saved');
        }, 2000);
    }

    function renderPlaylist() {
        if (!playlistList) {
            console.error('Playlist list element not found');
            return;
        }

        playlistList.innerHTML = '';
        const videosToRender = filteredVideos.length > 0 ? filteredVideos : videos;
        
        if (!videosToRender || videosToRender.length === 0) {
            playlistList.innerHTML = '<li class="playlist-item">No videos found.</li>';
            return;
        }

        videosToRender.forEach((video, index) => {
            const li = document.createElement('li');
            li.classList.add('playlist-item');
            
            // Add appropriate classes
            if (watchedVideos.has(video.id)) li.classList.add('watched');
            if (video.id === currentVideoId) li.classList.add('active');
            
            li.dataset.videoId = video.id;
            
            // Add checkmark for watched videos
            const checkmark = watchedVideos.has(video.id) ? 
                '<i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>' : '';
            
            li.innerHTML = `
                <a href="#" class="playlist-item-link">
                    <div class="playlist-item-header">
                        <span class="playlist-item-number">${index + 1}.</span>
                        <span class="playlist-item-title">${checkmark}${video.title}</span>
                    </div>
                    <div class="playlist-item-footer">
                        <span class="duration">${video.duration || ''}</span>
                        <span class="difficulty-badge badge-${video.difficulty?.toLowerCase() || 'beginner'}">${video.difficulty || 'Beginner'}</span>
                    </div>
                </a>`;
            
            li.addEventListener('click', (e) => {
                e.preventDefault();
                loadVideo(video.id);
            });
            
            playlistList.appendChild(li);
        });
    }

    function findVideoById(id) {
        return videos.find(video => video.id === id);
      }

    function markVideoWatched(videoId) {
        if (!videoId || watchedVideos.has(videoId)) return;
        
        console.log('Marking video as watched:', videoId);
        watchedVideos.add(videoId);
        saveWatchedVideos();
        
        // Update the playlist item UI
        const playlistItem = document.querySelector(`.playlist-item[data-video-id="${videoId}"]`);
        if (playlistItem) {
            playlistItem.classList.add('watched');
            const titleElement = playlistItem.querySelector('.playlist-item-title');
            if (titleElement) {
                const titleText = titleElement.textContent.replace(/^\s*✓\s*/, ''); // Remove existing checkmark if any
                titleElement.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 8px;"></i>${titleText}`;
            }
        }
        
        // Update progress bar
        updateProgressBar();
    }

    function updateProgressBar() {
        if (!progressBarInner || !progressLabel) return;
        
        const watchedCount = watchedVideos.size;
        const percentage = Math.round((watchedCount / totalVideos) * 100);
        
        console.log('Updating progress bar:', { watchedCount, totalVideos, percentage });
        
        // Update progress bar
        progressBarInner.style.width = `${percentage}%`;
        progressLabel.textContent = `${percentage}% Watched`;
        progressBarInner.setAttribute('aria-valuenow', percentage);
        
        // Update progress bar color based on percentage
        if (percentage >= 75) {
            progressBarInner.style.background = 'var(--success-color)';
        } else if (percentage >= 50) {
            progressBarInner.style.background = 'var(--warning-color)';
        } else {
            progressBarInner.style.background = 'var(--primary-color)';
        }
    }

    function formatBookmarkTitle(playlistId, videoTitle) {
        return `${playlistId.charAt(0).toUpperCase() + playlistId.slice(1)}: ${videoTitle}`;
    }

    function toggleBookmark() {
        if (!currentVideoId) return;
        
        const videoData = findVideoById(currentVideoId);
        if (!videoData) return;
        
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        const existingIndex = bookmarks.findIndex(b => b.id === currentVideoId);
        
        if (existingIndex === -1) {
            // Add bookmark with language prefix
            bookmarks.push({
                id: currentVideoId,
                title: formatBookmarkTitle(currentPlaylistId, videoData.title),
                description: videoData.desc || 'No description available',
                playlistId: currentPlaylistId,
                timestamp: new Date().toISOString()
            });
        } else {
            // Remove bookmark
            bookmarks.splice(existingIndex, 1);
        }
        
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        updateBookmarkButton();
        
        // Show feedback
        const feedback = document.createElement('div');
        feedback.className = 'bookmark-feedback';
        feedback.textContent = existingIndex === -1 ? 'Video bookmarked!' : 'Bookmark removed';
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    function updateBookmarkButton() {
        if (!bookmarkButton || !currentVideoId) return;
        
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        const isBookmarked = bookmarks.some(b => b.id === currentVideoId);
        
        if (isBookmarked) {
            bookmarkButton.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
            bookmarkButton.classList.add('active');
        } else {
            bookmarkButton.innerHTML = '<i class="far fa-bookmark"></i> Bookmark this video';
            bookmarkButton.classList.remove('active');
        }
    }

    function playNextVideo() {
        const currentIndex = videos.findIndex(v => v.id === currentVideoId);
        if (currentIndex < videos.length - 1) {
            // Mark current video as watched before moving to next
            if (currentVideoId && !watchedVideos.has(currentVideoId)) {
                markVideoWatched(currentVideoId);
            }
            
            const nextVideo = videos[currentIndex + 1];
            loadVideo(nextVideo.id);
            
            // Show feedback
            const feedback = document.createElement('div');
            feedback.className = 'navigation-feedback';
            feedback.textContent = `Playing next: ${nextVideo.title}`;
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        }
    }

    function playPreviousVideo() {
        const currentIndex = videos.findIndex(v => v.id === currentVideoId);
        if (currentIndex > 0) {
            // Mark current video as watched before moving to previous
            if (currentVideoId && !watchedVideos.has(currentVideoId)) {
                markVideoWatched(currentVideoId);
            }
            
            const prevVideo = videos[currentIndex - 1];
            loadVideo(prevVideo.id);
            
            // Show feedback
            const feedback = document.createElement('div');
            feedback.className = 'navigation-feedback';
            feedback.textContent = `Playing previous: ${prevVideo.title}`;
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                feedback.remove();
            }, 2000);
        }
    }

    // Initialize Pyodide
    async function initPyodide() {
        if (pyodide) {
            return pyodide;
        }

        if (isPyodideLoading) {
            // Wait for the current loading attempt to complete
            while (isPyodideLoading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return pyodide;
        }

        isPyodideLoading = true;
        try {
            // Load Pyodide
            pyodide = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
            });

            // Set up Python environment
            await pyodide.runPythonAsync(`
                import sys
                from io import StringIO
                sys.stdout = StringIO()
                sys.stderr = StringIO()
            `);

            console.log("Pyodide initialized successfully");
            isPyodideLoading = false;
            return pyodide;
        } catch (error) {
            console.error("Failed to initialize Pyodide:", error);
            isPyodideLoading = false;
            throw new Error("Failed to initialize Python environment. Please refresh the page and try again.");
        }
    }

    // Initialize Python environment when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        initPyodide().catch(error => {
            console.error("Initial Python environment setup failed:", error);
        });
    });

    async function runCode() {
        const userCode = editor.getValue();
        const selectedLanguage = languageSelector.value;
      
        if (!languageMap[selectedLanguage]) {
            showError('Unsupported language selected', outputElement);
          return;
        }
      
        if (!userCode.trim()) {
            showError('Please write some code before running', outputElement);
          return;
        }
      
        try {
            // Show loading state
            outputElement.innerHTML = '<div class="loading-spinner"></div> Running code...';
            runButton.disabled = true;
            
            if (selectedLanguage === 'javascript') {
                try {
                    // Create a safe execution environment with proper console capture
                    const output = [];
                    const safeConsole = {
                        log: (...args) => output.push(args.join(' ')),
                        error: (...args) => output.push('Error: ' + args.join(' ')),
                        warn: (...args) => output.push('Warning: ' + args.join(' '))
                    };

                    const safeEval = new Function('console', `
                        try {
                            ${userCode}
                        } catch (error) {
                            console.error(error.message);
                        }
                    `);
                    
                    safeEval(safeConsole);
                    outputElement.textContent = output.join('\n') || 'No output';
                } catch (error) {
                    outputElement.textContent = `Error: ${error.message}`;
                }
            } else if (selectedLanguage === 'python') {
                try {
                    const pyodideInstance = await initPyodide();
                    if (!pyodideInstance) {
                        throw new Error("Python environment not initialized. Please refresh the page and try again.");
                    }

                    // Clear previous output
                    await pyodideInstance.runPythonAsync(`
                        sys.stdout.getvalue()
                        sys.stdout = StringIO()
                        sys.stderr = StringIO()
                    `);

                    // Run the Python code
                    await pyodideInstance.runPythonAsync(userCode);

                    // Get the output
                    const stdout = pyodideInstance.runPython("sys.stdout.getvalue()");
                    const stderr = pyodideInstance.runPython("sys.stderr.getvalue()");

                    if (stderr) {
                        outputElement.textContent = `Error: ${stderr}`;
                    } else {
                        outputElement.textContent = stdout || 'No output';
                    }
                } catch (error) {
                    outputElement.textContent = `Error: ${error.message}`;
                }
            } else if (selectedLanguage === 'html') {
                // Create a preview of the HTML code
                const previewWindow = window.open('', '_blank');
                if (previewWindow) {
                    previewWindow.document.write(userCode);
                    previewWindow.document.close();
                    outputElement.textContent = 'HTML preview opened in new window';
                } else {
                    outputElement.textContent = 'Please allow popups to preview HTML';
                }
            } else if (selectedLanguage === 'java' || selectedLanguage === 'php') {
                outputElement.innerHTML = `<div class="error-message">
                    ${selectedLanguage === 'java' ? 'Java' : 'PHP'} execution is not available in the web version. 
                    Please use JavaScript or Python instead.
                </div>`;
            }
        } catch (error) {
            console.error('Code execution error:', error);
            outputElement.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
        } finally {
            // Reset loading state
            runButton.disabled = false;
        }
      }

    function resetCode() {
        if (editor) {
            editor.setValue(starterCode);
        }
    }

    function resetWatchedVideos() {
        if (!WATCHED_VIDEOS_KEY) return;
        
        // Clear watched videos from localStorage
        localStorage.removeItem(WATCHED_VIDEOS_KEY);
        
        // Reset the watched videos set
        watchedVideos = new Set();
        
        // Update UI
        updateProgressBar();
        renderPlaylist();
        
        console.log('Watched videos have been reset');
    }

    // Update existing bookmarks when loading the page
    function updateExistingBookmarks() {
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        let updated = false;
        
        bookmarks.forEach(bookmark => {
            const videoData = findVideoById(bookmark.id);
            if (videoData && !bookmark.title.includes(':')) {
                bookmark.title = formatBookmarkTitle(bookmark.playlistId, videoData.title);
                updated = true;
            }
        });
        
        if (updated) {
            localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        }
    }

    // --- Initialize Playlist ---
    async function initializePlaylist() {
        // Detect playlist ID from URL or default
        const searchParams = new URLSearchParams(window.location.search);
        const detectedPlaylistId = searchParams.get('playlist') || 'javascript';
        
        // Validate playlist ID
        const validPlaylistIds = ['python', 'javascript', 'php', 'java', 'webdev'];
        const playlistId = validPlaylistIds.includes(detectedPlaylistId) ? detectedPlaylistId : 'javascript';
        currentPlaylistId = playlistId;

        // Set dynamic localStorage keys
        WATCHED_VIDEOS_KEY = `codelearn_watched_videos_${currentPlaylistId}`;
        BOOKMARKED_VIDEO_KEY = `codelearn_bookmarked_video_${currentPlaylistId}`;
        NOTES_KEY = `notes_${currentPlaylistId}`;

        // Fetch playlist data
        const playlistData = await fetchPlaylistData(currentPlaylistId);
        if (!playlistData || !playlistData.videos) {
            showError('Failed to load playlist data', document.body);
            return;
        }

        videos = playlistData.videos;
        filteredVideos = [...videos];
        exercises = playlistData.exercises || {};
        totalVideos = videos.length;
        courseTitle = playlistData.title || "Untitled Course";

        // Update UI
        courseTitleElement.textContent = courseTitle;
        
        // Load watched videos and update progress
        const watchedData = localStorage.getItem(WATCHED_VIDEOS_KEY);
        if (watchedData) {
            try {
                watchedVideos = new Set(JSON.parse(watchedData));
                console.log('Loaded watched videos:', Array.from(watchedVideos));
            } catch (error) {
                console.error('Error parsing watched videos:', error);
                watchedVideos = new Set();
            }
        }
        
        // Update existing bookmarks to include language prefix
        updateExistingBookmarks();
        
        // Update progress bar with initial state
        updateProgressBar();
        
        // Render playlist with watched status
        renderPlaylist();

        // Determine initial video
        let initialVideoId = null;
        const hash = window.location.hash.substring(1);
        if (hash && findVideoById(hash)) {
            initialVideoId = hash;
        } else if (bookmarkedVideoId && findVideoById(bookmarkedVideoId)) {
            initialVideoId = bookmarkedVideoId;
        } else {
            const firstUnwatched = videos.find(video => !watchedVideos.has(video.id));
            initialVideoId = firstUnwatched ? firstUnwatched.id : videos[0].id;
        }

        if (initialVideoId) {
            loadVideo(initialVideoId);
        }
    }

    // --- Enhanced Video Loading ---
    async function loadVideo(videoId) {
        const videoData = findVideoById(videoId);
        if (!videoData) {
            showError('Video not found', document.body);
            return;
        }

        // Mark the current video as watched if we're navigating to a different video
        if (currentVideoId && currentVideoId !== videoId && !watchedVideos.has(currentVideoId)) {
            markVideoWatched(currentVideoId);
        }

        showLoading();
        currentVideoId = videoId;
        
        try {
            // Update video player
            if (player && player.loadVideoById) {
                player.loadVideoById(videoId);
            } else {
                // Fallback if player not initialized
                videoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`;
            }
            
            // Update video info
            videoTitleElement.textContent = videoData.title;
            videoDescriptionElement.textContent = videoData.desc || 'No description available.';
            codeBlockElement.textContent = videoData.code || `// Video: ${videoData.title}\n// ID: ${videoId}`;
            
            // Update bookmark
            updateBookmarkButton();
            
            // Update URL without reloading
            const newUrl = `${window.location.pathname}?playlist=${currentPlaylistId}#${videoId}`;
            window.history.pushState({ videoId }, '', newUrl);
            
            // Update playlist active state
            const playlistItems = document.querySelectorAll('.playlist-item');
            playlistItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.videoId === videoId) {
                    item.classList.add('active');
                    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });

            // Load notes for this video
            const videoNotes = localStorage.getItem(`${NOTES_KEY}_${videoId}`);
            if (videoNotes) {
                notesTextarea.value = videoNotes;
            } else {
                notesTextarea.value = '';
            }

            // Update progress bar
            updateProgressBar();

        } catch (error) {
            showError('Failed to load video', document.body);
            console.error('Error loading video:', error);
        } finally {
            hideLoading();
        }
    }

    // Initialize YouTube Player
    function onYouTubeIframeAPIReady() {
        player = new YT.Player('youtube-player', {
            height: '450',
            width: '800',
            videoId: currentVideoId,
            playerVars: {
                'autoplay': 0,
                'rel': 0,
                'modestbranding': 1,
                'enablejsapi': 1
            },
            events: {
                'onStateChange': onPlayerStateChange,
                'onReady': onPlayerReady,
                'onError': onPlayerError
            }
        });
    }

    function onPlayerReady(event) {
        console.log('YouTube player is ready');
        hideLoading();
    }

    function onPlayerError(event) {
        console.error('YouTube player error:', event.data);
        showError('Failed to load video. Please try again.', document.body);
        hideLoading();
    }

    function onPlayerStateChange(event) {
        // Track video progress
        if (event.data === YT.PlayerState.PLAYING) {
            startTrackingProgress();
        } else if (event.data === YT.PlayerState.PAUSED) {
            stopTrackingProgress();
        } else if (event.data === YT.PlayerState.ENDED) {
            stopTrackingProgress();
            if (videoProgress.get(currentVideoId) >= 0.9) { // 90% watched threshold
                markVideoWatched(currentVideoId);
            }
            // Auto-play next video if available
            const currentIndex = videos.findIndex(v => v.id === currentVideoId);
            if (currentIndex < videos.length - 1) {
                setTimeout(() => playNextVideo(), 2000);
            }
        }
    }

    let progressInterval;
    function startTrackingProgress() {
        if (progressInterval) clearInterval(progressInterval);
        
        progressInterval = setInterval(() => {
            if (player && player.getCurrentTime && player.getDuration) {
                try {
                    const currentTime = player.getCurrentTime();
                    const duration = player.getDuration();
                    const progress = currentTime / duration;
                    
                    // Store progress for this video
                    videoProgress.set(currentVideoId, progress);
                    
                    // If video is watched more than 90%, mark as watched
                    if (progress >= 0.9 && !watchedVideos.has(currentVideoId)) {
                        markVideoWatched(currentVideoId);
                    }
                } catch (error) {
                    console.error('Error tracking progress:', error);
                    stopTrackingProgress();
                }
            }
        }, 1000); // Check every second
    }

    function stopTrackingProgress() {
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }
    }

    // --- Enhanced Exercise Loading ---
    function loadExercise(videoId) {
        const exercise = exercises[videoId];
        if (exercise) {
            const selectedLanguage = languageSelector.value;
            if (!languageMap[selectedLanguage]) {
                showError('Unsupported language selected', exerciseDescription);
                return;
            }

            exerciseDescription.textContent = exercise.description || 'Solve this challenge!';
            starterCode = exercise.starterCode[selectedLanguage] || '';

            if (editor) {
                editor.setValue(starterCode);
                const monacoLanguage = languageMap[selectedLanguage].monaco;
                if (monacoLanguage) {
                    monaco.editor.setModelLanguage(editor.getModel(), monacoLanguage);
                }
            }
        }
    }

    // --- Event Listeners ---
    function attachEventListeners() {
        // Existing event listeners
        bookmarkButton.addEventListener('click', toggleBookmark);
        saveNotesButton.addEventListener('click', saveNotes);
        runButton.addEventListener('click', runCode);
        resetButton.addEventListener('click', resetCode);
        languageSelector.addEventListener('change', () => loadExercise(currentVideoId));

        // Real-time search
        playlistSearch.addEventListener('input', (e) => {
            filterVideos(e.target.value);
        });

        // Clear search when clicking the clear button (if it exists)
        const clearSearchButton = document.querySelector('.clear-search');
        if (clearSearchButton) {
            clearSearchButton.addEventListener('click', () => {
                playlistSearch.value = '';
                filterVideos('');
            });
        }

        // New event listeners
        toggleCodeButton.addEventListener('click', toggleCodeVisibility);
        copyCodeButton.addEventListener('click', copyCodeToClipboard);
        closeShortcutsButton.addEventListener('click', toggleShortcutsModal);
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Video player event listeners
        videoPlayer.addEventListener('load', hideLoading);
        videoPlayer.addEventListener('error', () => {
            showError('Failed to load video', videoContainer);
            hideLoading();
        });
    }

    // --- Initialize ---
    async function initialize() {
        try {
            await initializePlaylist();
            attachEventListeners();
        } catch (error) {
            console.error('Initialization failed:', error);
            showError('Failed to initialize the tutorial view', document.body);
        }
    }

    // Start the application
    initialize();

    // Add event listener for close button
    closeShortcutsButton.addEventListener('click', () => {
        shortcutsModal.hidden = true;
    });

    // Close modal when clicking outside
    shortcutsModal.addEventListener('click', (e) => {
        if (e.target === shortcutsModal) {
            toggleShortcutsModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !shortcutsModal.hidden) {
            toggleShortcutsModal();
        }
    });

    // Initialize progress bar on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Set initial progress bar state
        if (progressBarInner && progressLabel) {
            progressBarInner.style.width = '0%';
            progressLabel.textContent = '0% Watched';
            progressBarInner.setAttribute('aria-valuenow', 0);
        }
        
        // Initialize the rest of the application
        initialize();
    });
});