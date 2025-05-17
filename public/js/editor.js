class CodeEditor {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      language: options.language || 'javascript',
      theme: options.theme || 'monokai',
      readOnly: false,
      ...options
    };
    
    this.init();
  }

  init() {
    this.createEditor();
    this.setupEventListeners();
  }

  createEditor() {
    // Create editor container
    this.editorElement = document.createElement('div');
    this.editorElement.className = 'code-editor';
    this.editorElement.innerHTML = `
      <div class="editor-toolbar">
        <select class="language-select">
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
        <button class="run-btn">Run Code</button>
      </div>
      <div class="editor-content">
        <textarea class="code-input" spellcheck="false"></textarea>
        <div class="line-numbers"></div>
      </div>
      <div class="output-container">
        <div class="output-header">Output</div>
        <div class="output-content"></div>
      </div>
    `;
    
    this.container.appendChild(this.editorElement);
    
    // Initialize elements
    this.textarea = this.editorElement.querySelector('.code-input');
    this.lineNumbers = this.editorElement.querySelector('.line-numbers');
    this.output = this.editorElement.querySelector('.output-content');
    this.languageSelect = this.editorElement.querySelector('.language-select');
    this.runButton = this.editorElement.querySelector('.run-btn');
    
    // Set initial language
    this.languageSelect.value = this.options.language;
  }

  setupEventListeners() {
    // Line numbers
    this.textarea.addEventListener('input', () => this.updateLineNumbers());
    this.textarea.addEventListener('scroll', () => this.syncScroll());
    
    // Language change
    this.languageSelect.addEventListener('change', (e) => {
      this.options.language = e.target.value;
      this.highlightSyntax();
    });
    
    // Run code
    this.runButton.addEventListener('click', () => this.runCode());
  }

  updateLineNumbers() {
    const lines = this.textarea.value.split('\n');
    this.lineNumbers.innerHTML = lines
      .map((_, i) => `<div class="line-number">${i + 1}</div>`)
      .join('');
  }

  syncScroll() {
    this.lineNumbers.scrollTop = this.textarea.scrollTop;
  }

  highlightSyntax() {
    // In a real implementation, this would use a syntax highlighting library
    // like Prism.js or highlight.js
    const code = this.textarea.value;
    // Basic syntax highlighting for demonstration
    const highlighted = code
      .replace(/(function|return|const|let|var)\b/g, '<span class="keyword">$1</span>')
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
      .replace(/(".*?"|'.*?')/g, '<span class="string">$1</span>');
    
    this.textarea.innerHTML = highlighted;
  }

  async runCode() {
    const code = this.textarea.value;
    this.output.innerHTML = 'Running...';
    
    try {
      let result;
      switch (this.options.language) {
        case 'javascript':
          result = await this.runJavaScript(code);
          break;
        case 'python':
          result = await this.runPython(code);
          break;
        default:
          result = 'Language not supported';
      }
      
      this.output.innerHTML = `<pre>${result}</pre>`;
    } catch (error) {
      this.output.innerHTML = `<pre class="error">${error.message}</pre>`;
    }
  }

  async runJavaScript(code) {
    // In a real implementation, this would use a sandboxed environment
    try {
      const result = eval(code);
      return result;
    } catch (error) {
      throw new Error(`JavaScript Error: ${error.message}`);
    }
  }

  async runPython(code) {
    // In a real implementation, this would call a Python backend
    return 'Python execution not implemented in this demo';
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(code) {
    this.textarea.value = code;
    this.updateLineNumbers();
    this.highlightSyntax();
  }
}

export default CodeEditor; 