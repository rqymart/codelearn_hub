# CodeLearn Hub - Interactive Programming Tutorial Platform

CodeLearn Hub is an interactive platform for learning programming through hands-on tutorials and coding exercises. The platform offers a variety of programming courses with interactive exercises and real-time feedback.

## Features

- **Multiple Programming Languages**: Learn Python, JavaScript, PHP, Java, and Web Development
- **Interactive Coding Exercises**: Practice with hands-on exercises for each tutorial
- **Progress Tracking**: Save your progress and continue where you left off
- **Bookmark System**: Save your favorite tutorials for quick access
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Code Playground**: Test your code directly in the browser
- **Multi-language Support**: Exercises available in Python, JavaScript, Java, and PHP

## Available Courses

1. **Python Tutorials** (Dave Gray)
   - Python basics
   - Variables and data types
   - Control flow
   - Functions and modules

2. **JavaScript Essentials** (freeCodeCamp)
   - JavaScript fundamentals
   - DOM manipulation
   - Event handling
   - Modern ES6+ features

3. **PHP Course** (Dani Krossing)
   - PHP basics
   - Variables and data types
   - Control structures
   - Functions and arrays

4. **Java Programming** (Telusko)
   - Java fundamentals
   - Object-oriented programming
   - Data structures
   - Exception handling

5. **Web Design 101** (Flux Academy)
   - HTML5 basics
   - CSS3 styling
   - Responsive design
   - Modern web development practices

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (Flexbox, Grid, Variables)
  - JavaScript (ES6+)
  - LocalStorage API for data persistence

## Project Structure

```
codelearn-hub/
├── public/
│   ├── css/
│   │   ├── style.css
│   │   ├── tutorials.css
│   │   └── code-playground.css
│   ├── js/
│   │   ├── main.js
│   │   ├── tutorials.js
│   │   └── code-playground.js
│   ├── tutorials/
│   │   ├── python.json
│   │   ├── javascript.json
│   │   ├── php.json
│   │   ├── java.json
│   │   └── webdev.json
│   └── index.html
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Basic understanding of web development (for contributing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/codelearn-hub.git
   ```

2. Navigate to the project directory:
   ```bash
   cd codelearn-hub
   ```

3. Open `public/index.html` in your web browser or use a local server:
   ```bash
   # Using Python's built-in server
   python -m http.server 8000
   
   # Using Node.js's http-server
   npx http-server public
   ```

4. Access the application at `http://localhost:8000`

## Usage

1. Browse available tutorials from the homepage
2. Select a course to start learning
3. Watch video tutorials and complete interactive exercises
4. Track your progress and bookmark favorite tutorials
5. Use the code playground to practice coding

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Course creators: Dave Gray, freeCodeCamp, Dani Krossing, Telusko, and Flux Academy
- Contributors and maintainers
- Open source community

## Contact

For questions or suggestions, please open an issue in the GitHub repository.
