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
        editor.disabled = true;
        console.error(err);
        return;
      }
      editor.value = data;
      renderMarkdown();
      editor.disabled = false;
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
// Disable text field until a file is selected
// Ensure that only .md files can be selected
const handleFileSelection = (event) => {
  const file = event.target.files[0];
  if (file) {
    if (!file.name.endsWith('md')) {
      alert('Please select a Markdown (.md) file!');
      return;
    }
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
      editor.disabled = false;
    });
  } else {
    editor.disabled = true;
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

// Add event listener for bracket key press to autoclose brackets
editor.addEventListener('keydown', (event) => {
  if (event.key === '(') {
    event.preventDefault();
    const { selectionStart, selectionEnd } = editor;
    // Insert the closing bracket at current cursor position
    const closingBracket = ')';
    const newText = editor.value.substring(0, selectionStart) + event.key + closingBracket + editor.value.substring(selectionEnd);

    // Update the textarea value with the new text and adjust the cursor position
    editor.value = newText;
    editor.selectionStart = editor.selectionEnd = selectionStart + closingBracket.length;;
    renderMarkdown();
    saveMarkdownToFile();
  } else if (event.key === '{') {
    event.preventDefault();
    const { selectionStart, selectionEnd } = editor;
    // Insert the closing bracket at current cursor position
    const closingBracket = '}';
    const newText = editor.value.substring(0, selectionStart) + event.key + closingBracket + editor.value.substring(selectionEnd);

    // Update the textarea value with the new text and adjust the cursor position
    editor.value = newText;
    editor.selectionStart = editor.selectionEnd = selectionStart + closingBracket.length;;
    renderMarkdown();
    saveMarkdownToFile();
  } else if (event.key === '[') {
    event.preventDefault();
    const { selectionStart, selectionEnd } = editor;
    // Insert the closing bracket at current cursor position
    const closingBracket = ']';
    const newText = editor.value.substring(0, selectionStart) + event.key + closingBracket + editor.value.substring(selectionEnd);

    // Update the textarea value with the new text and adjust the cursor position
    editor.value = newText;
    editor.selectionStart = editor.selectionEnd = selectionStart + closingBracket.length;
    renderMarkdown();
    saveMarkdownToFile();
  }
});

// Add event listener for enter key press to maintain indentation
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const { value, selectionStart } = editor;
    const currentLine = value.substr(0, selectionStart).split('\n').pop();
    const indentation = /^\s*/.exec(currentLine)[0];
    const newText = `\n${indentation}`;
    editor.setRangeText(newText, selectionStart, selectionStart, 'end');
  }
});

// Add event listener for backspace key press to remove indentation
editor.addEventListener('keydown', (event) => {
  if (event.key === 'Backspace') {
    const { value, selectionStart } = editor;
    const currentLine = value.substr(0, selectionStart).split('\n').pop();
    const indentation = currentLine === '' ? '' : /^ +/.exec(currentLine)[0];
    const tabSize = 4; // tab size is 4 spaces
    // if indentation is a multiple of tab size, and everything preceding the cursor is a space, remove indentation
    if (indentation.length % tabSize === 0 && indentation.length > 0 && /^ +$/.test(currentLine.substring(0, selectionStart))) {
      event.preventDefault();
      const prevIndentation = indentation.slice(0, -tabSize);
      const newText = prevIndentation + currentLine.slice(indentation.length);
      const newSelectionStart = selectionStart - tabSize;
      editor.setRangeText(newText, selectionStart - currentLine.length, selectionStart, 'end');
      editor.selectionStart = editor.selectionEnd = newSelectionStart;
    }
  }
});

// by default, editor is disabled until a user selects a file
editor.disabled = true;