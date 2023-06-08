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
        // Add the programming language as a flair before the highlighted code
        const codeFlair = `<div class="code-flair">${lang}</div>`;
        const highlightedCode = hljs.highlight(str, { language: lang }).value;
        return `${codeFlair}${highlightedCode}`;
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

let timeoutId = null;
// Function to render the Markdown content
const renderMarkdown = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    const markdownText = editor.value;
    const renderedHTML = md.render(markdownText);
    outputField.innerHTML = renderedHTML;
  }, 300); // 300 ms delay to optimize rendering performance
  console.log(`Rendered Markdown from editor to outputField`);
};

/**
 * =======================================
 *             FILE WATCHING
 * =======================================
 */

// Function to load file upon file selection
const loadFileOnSelection = (eventType, filename) => {
  editor.disabled = false;
  console.log(`Loaded Markdown content from ${selectedFilePath}`);
  if (filename === path.basename(selectedFilePath)) {
    fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
      if (err) {
        editor.disabled = true;
        console.error(err);
        return;
      }
      // Load Markdown content from file into editor on initial load
      editor.value = data;   
      renderMarkdown(); 
    });
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
        renderMarkdown(); // Render Markdown after saving the file
        console.log(`Saved Markdown content to ${selectedFilePath}`);
      });
    }
  }, 300);
};

// Add event listener to the editor for input changes
editor.addEventListener('input', () => {
  saveMarkdownToFile();
});

/**
 * =============================================================================
 *           EVENT LISTENERS FOR MARKDOWN RENDERING AND FILE WATCHING
 * =============================================================================
 */

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

// Add event listener for tab, auto-close, auto-indent, remove auto-indent
editor.addEventListener('keydown', (event) => {
  const { key } = event;
  const { selectionStart, selectionEnd, value } = editor;

  if (event.key === 'Tab') {
    event.preventDefault();
    const start = selectionStart;
    const end = selectionEnd;
    const tabCharacter = '    ';
    editor.value = value.substring(0, start) + tabCharacter + value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 4;
    saveMarkdownToFile();
  } else if (key in closingCharactersMap) {
      event.preventDefault();
      const closingCharacter = closingCharactersMap[key];
      const newText = value.substring(0, selectionStart) + key + closingCharacter + value.substring(selectionEnd);
      editor.value = newText;
      editor.selectionStart = editor.selectionEnd = selectionStart + 1;
      saveMarkdownToFile();
  } else if (event.key === 'Enter') {
      event.preventDefault();
      const currentLine = value.substr(0, selectionStart).split('\n').pop();
      const indentation = /^\s*/.exec(currentLine)[0];
      const newText = `\n${indentation}`;
      editor.setRangeText(newText, selectionStart, selectionStart, 'end');
      saveMarkdownToFile();
  } else if (event.key === 'Backspace') {
      const lastNewlineIndex = value.lastIndexOf('\n', selectionStart - 1);
      const currentLine = lastNewlineIndex === -1 ? value.substring(0, selectionStart) : value.substring(lastNewlineIndex + 1, selectionStart);
      const indentationMatch = /^ +/.exec(currentLine);
      const indentation = indentationMatch ? indentationMatch[0] : '';
      const tabSize = 4;
    if (indentation.length % tabSize === 0 && indentation.length > 0 && /^ +$/.test(currentLine.substring(0, selectionStart))) {
      event.preventDefault();
      const prevIndentation = indentation.slice(0, -tabSize);
      const newText = prevIndentation + currentLine.slice(indentation.length);
      const newSelectionStart = selectionStart - tabSize;
      editor.setRangeText(newText, selectionStart - currentLine.length, selectionStart, 'end');
      editor.selectionStart = editor.selectionEnd = newSelectionStart;
    }
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
      // read the file contents and update the editor and start watching the selected file
      fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        editor.value = data;
        renderMarkdown();     // render Markdown content initially upon loading the file
        loadFileOnSelection();
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
// Handle the case when user clicks certain options in the context menu
let targetFilePath;
let targetSpan;
noteList.addEventListener('contextmenu', (event) => {
  const { target } = event;
  if (target.tagName === 'SPAN') {
    event.preventDefault();

    // Store the mouse position
    const { clientX: mouseX, clientY: mouseY } = event;
    contextMenuNoteList.style.top = `${mouseY}px`;
    contextMenuNoteList.style.left = `${mouseX}px`;

    // Show the context menu at the mouse position
    contextMenuNoteList.classList.add('visible');

    // Store the file path of selected file
    targetFilePath = target.dataset.filePath;
    targetSpan = target;
  }
});

// Listen for the certain option that the user clicks in the context menu
contextMenuNoteList.addEventListener('click', (event) => {
  const { target } = event;
  const previousName = targetSpan.textContent;

  if (target.id === 'deleteOption') {
    event.preventDefault();
    contextMenuNoteList.classList.remove('visible');

    deleteFile(targetFilePath);
  } else if (target.id === 'renameOption') {
    event.preventDefault();
    contextMenuNoteList.classList.remove('visible');

    targetSpan.contentEditable = true;
    targetSpan.focus();

    targetSpan.onkeydown = (event) => {
      // Enter to confirm rename
      if (event.key === 'Enter') {
        event.preventDefault();
        targetSpan.contentEditable = false;
        targetSpan.onkeydown = null;
        targetSpan.blur();
        renameFile(targetSpan.textContent, targetFilePath);
        editor.focus();
        // Escape to cancel rename
      } else if (event.key === 'Escape') {
        event.preventDefault();
        targetSpan.textContent = previousName;
        targetSpan.contentEditable = false;
        targetSpan.onkeydown = null;
        targetSpan.blur();
        console.log(`Cancelled renaming of ${targetFilePath} successfully`);
        editor.focus();
      }    
    }
  }
});

// If context menu is visible and user clicks outside of it, hide it
document.addEventListener('click', (event) => {
  if (event.target.offsetParent != contextMenuNoteList && contextMenuNoteList.classList.contains('visible')) {
    contextMenuNoteList.classList.remove('visible');
  }
});

// When user opens context menu for a file, delete file when they click "Delete" 
// If the file to delete is selectedFilePath, reset to default app state
const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Deleted ${filePath} successfully`);
  });
  if (filePath === selectedFilePath) {
    selectedFilePath = '';
    editor.value = '';
    editor.disabled = true;
    renderMarkdown();
  }
};

// When user opens context menu for a file, rename file when they click "Rename"
// If the file to rename is selectedFilePath, restart file watching for smart updates
// Allow user to rename file by changing the name in the noteList
const renameFile = (newName, filePath) => {
  const newFilePath = path.join('./src', `${newName}.md`);
  fs.rename(filePath, newFilePath, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
  if (filePath === selectedFilePath) {
    selectedFilePath = newFilePath;
    loadFileOnSelection();
  }
  console.log(`Renamed ${filePath} to ${newName}.md successfully`);
};

// Add a new file, automatically calling it "Untitled-0.md"
// If "Untitled-0.md" already exists, make "Untitled-1.md" and so on
// Add a delay between each file creation to ensure bug-free
const addFile = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    const newFileName = 'Untitled-';
    let newFilePath = '';
    let numUntitledFiles = 0;

    // Find all files starting with "Untitled-" and find the largest number
    fs.readdir('./src', (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      
      files.forEach((file) => {
        if (file.startsWith(newFileName)) {
          const fileNumber = parseInt(file.slice(newFileName.length)) || 0;
          numUntitledFiles = Math.max(numUntitledFiles, fileNumber + 1);
        }
      });

      newFilePath = path.join('./src', `${newFileName}${numUntitledFiles}.md`);

      fs.writeFile(newFilePath, '', (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`Created ${newFilePath} successfully`);
      });

    });
  }, 100);
};

// Upon clicking the newNote div, add a new note and automatically select it and let user rename it
const newNote = document.getElementById('newNote');
newNote.addEventListener('click', () => {
  addFile();
});

// Upon clicking the newFolder div, add a new folder and automatically select it and let user rename it
const newFolder = document.getElementById('newFolder');
newFolder.addEventListener('click', () => {
  addFolder();        // not functional yet
});

// List MD files upon page load
listMDFiles();