const fs = require('fs');
const path = require('path');
const hljs = require('highlight.js');
const tm = require('markdown-it-texmath');
const md = require('markdown-it')({
  // disable replacement of leading spaces
  preserveWhiteSpace: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  },
}).use(tm, { engine: require('katex'),
    delimiters: 'dollars',
    katexOptions: { macros: {"\\RR": "\\mathbb{R}"} 
    },
    throwOnError: true,
    errorColor: '#cc0000'
});

const fileInput = document.getElementById('fileInput');
const editor = document.getElementById('editor');
const outputField = document.getElementById('outputField');
let filePath = null;
let fileWatcher = null;

let timeoutId = null;
// Function to render the Markdown content
const renderMarkdown = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    const markdownText = editor.value;
    const renderedHTML = md.render(markdownText);
    outputField.innerHTML = renderedHTML;
  }, 300); // 300 ms delay to optimize rendering performance
};

// Function to handle file changes
const handleFileChange = (eventType, filename) => {
  if (filename === path.basename(filePath)) {
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      editor.value = data;
      renderMarkdown();
    });
  }
};

// Function to start file watching
const startFileWatching = () => {
  fileWatcher = fs.watch(path.dirname(filePath), handleFileChange);
};

// Function to stop file watching
const stopFileWatching = () => {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
};

// Function to handle file selection
const handleFileSelection = (event) => {
  const file = event.target.files[0];
  if (file) {
    filePath = file.path;
    stopFileWatching();
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      editor.value = data;
      renderMarkdown();
      startFileWatching();
    });
  }
};

// Function to save the Markdown content to the file
const saveMarkdownToFile = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    if (filePath) {
      const markdownText = editor.value;
      fs.writeFile(filePath, markdownText, 'utf-8', (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log('File saved successfully!');
      });
    }
  },300);
};

// Add event listener to the file input for file selection
fileInput.addEventListener('change', handleFileSelection);

// Add event listener to the editor for input changes
editor.addEventListener('input', () => {
  renderMarkdown();
  saveMarkdownToFile();
});

// Add event listener for tab key press
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();               // Prevent tabbing out of the editor upon pressing tab

    const { selectionStart, selectionEnd } = editor;

    // Insert a tab character at the current cursor position
    const tabCharacter = '    ';
    const newText = editor.value.substring(0, selectionStart) + tabCharacter + editor.value.substring(selectionEnd);

    // Update the textarea value with the new text and adjust the cursor position
    editor.value = newText;
    editor.selectionStart = editor.selectionEnd = selectionStart + tabCharacter.length;
    renderMarkdown();
    saveMarkdownToFile();
  }
});