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

/**
 * =======================================
 *           MARKDOWN RENDERING
 * =======================================
 */

const editor = document.getElementById('editor');
const outputField = document.getElementById('outputField');
let selectedFilePath = null;      // store the currently selected Markdown file path
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

/**
 * =======================================
 *             FILE WATCHING
 * =======================================
 */

// Function to handle file changes
const handleFileChange = (eventType, filename) => {
  if (filename === path.basename(selectedFilePath)) {
    fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
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
  fileWatcher = fs.watch(path.dirname(selectedFilePath), handleFileChange);
};

// Function to stop file watching
const stopFileWatching = () => {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
};

// Function to save the Markdown content to the file
const saveMarkdownToFile = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    if (selectedFilePath) {
      const markdownText = editor.value;
      fs.writeFile(selectedFilePath, markdownText, 'utf-8', (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log('File saved successfully!');
      });
    }
  },300);
};

/**
 * =============================================================================
 *           EVENT LISTENERS FOR MARKDOWN RENDERING AND FILE WATCHING
 * =============================================================================
 */

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

// Map of closing characters
const closingCharactersMap = {
  '(': ')',
  '{': '}',
  '[': ']',
  '`': '`',
  '$': '$',
  '*': '*',
  '_': '_',
};

// Add event listener for auto-closing characters defined in closingCharactersMap
editor.addEventListener('keydown', (event) => {
  const { key } = event;
  const closingBracket = closingCharactersMap[key];
  
  if (closingBracket) {
    event.preventDefault();
    const { selectionStart, selectionEnd } = editor;

    // Insert the closing bracket at the current cursor position
    const newText = editor.value.substring(0, selectionStart) + key + closingBracket + editor.value.substring(selectionEnd);

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
    renderMarkdown();
    saveMarkdownToFile();
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
    renderMarkdown();
    saveMarkdownToFile();
  }
});

// by default, editor is disabled until a user selects a file
editor.disabled = true;

/**
 * =======================================
 *             FILE EXPLORER
 * =======================================
 */
const fileList = document.getElementById('fileList');
// list all MD files and update in real time when files are added or removed or renamed
const listMDFiles = () => {
  const directoryName = './src'
  fs.readdir(directoryName, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }
    fileList.innerHTML = '';
    files.forEach((file) => {
      if (file.endsWith('.md')) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = file;
        span.dataset.filePath = path.join(directoryName, file);
        if (selectedFilePath === span.dataset.filePath) {       // if selectedFilePath is equal to the current file path, add the selected class
          span.classList.add('selected');
        }
        li.appendChild(span);
        fileList.appendChild(li);
      }
    });
  });
};

// Add an event listener to the list of MD files to handle file selection
// and add the selected class to the selected file and remove it from the previously selected file
fileList.addEventListener('click', (event) => {
  const { target } = event;
  if (target.tagName === 'SPAN') {
    const { filePath } = target.dataset;
    // if filePath exists, set selectedFilePath to filePath and stop watching the previously selected file
    if (filePath) {
      selectedFilePath = filePath;
      stopFileWatching();
      // read the file contents and update the editor and start watching the selected file
      fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        editor.value = data;
        renderMarkdown();
        startFileWatching();
        editor.disabled = false;
      });
      // remove the selected class from the previously selected file and add the selected class to the newly selected file
      const selectedFile = document.querySelector('.selected');
      if (selectedFile) {
        selectedFile.classList.remove('selected');
      }
      target.classList.add('selected');
    }
  }
});

// Update the list of MD files if any updates occur
fs.watch('./src', (eventType, filename) => {
  if (filename.endsWith('.md')) {
    listMDFiles();
  }
});

/**
 * ===========================================================
 *              EVENT LISTENERS FOR FILE EXPLORER
 * ===========================================================
 */

// hold a reference to contextMenuNoteList and ensure that the scope is noteList
const contextMenuNoteList = document.getElementById('contextMenuNoteList');
const noteList = document.getElementById('noteList');

// Upon right click on a file in the list, show the context menu at the mouse position
noteList.addEventListener('contextmenu', (event) => {
  const { target } = event;
  if (target.tagName === 'SPAN') {
    event.preventDefault();

    const { clientX: mouseX, clientY: mouseY } = event;
    contextMenuNoteList.style.top = `${mouseY}px`;
    contextMenuNoteList.style.left = `${mouseX}px`;

    contextMenuNoteList.classList.add('visible');
  }
});

// If the user clicks outside the context menu, hide it
document.addEventListener('click', (event) => {
  if (event.target.offsetParent != contextMenuNoteList) {
    contextMenuNoteList.classList.remove('visible');
  }
});

// List MD files upon page load
listMDFiles();
