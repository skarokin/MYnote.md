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
        // add the programming language as a flair after the highlighted code
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
const CodeMirrorEditor = CodeMirror(editor, {
  mode: 'markdown',
  theme: 'my-theme',
  autoCloseBrackets: true,
  lineWrapping: true,
  viewportMargin: Infinity,
  indentUnit: 4, // Set the desired number of spaces for indentation
  indentWithTabs: false, // Use soft tabs for indentation
  extraKeys: {
    // Use spaces for indentation instead of .cm-tab
    Tab: function(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection("add"); // Indent selected lines
      } else {
        cm.replaceSelection(cm.getOption("indentWithTabs") ? "\t" :
          Array(cm.getOption("indentUnit") + 1).join(" "), "end"); // Insert soft tabs
      }
    }
  },
});

const outputField = document.getElementById('outputField');
let selectedFilePath = null;      // store the currently selected Markdown file path

let timeoutId = null;
// Function to render the Markdown content
const renderMarkdown = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    const markdownText = CodeMirrorEditor.getValue();
    const renderedHTML = md.render(markdownText);
    outputField.innerHTML = renderedHTML;
  }, 300); // 300 ms delay to optimize rendering performance
  console.log(`Rendered Markdown from CodeMirrorEditor to outputField`);
};

/**
 * =======================================
 *             FILE WATCHING
 * =======================================
 */

// Function to load file upon file selection
const loadFileOnSelection = (eventType, filename) => {
  CodeMirrorEditor.setOption('readOnly', false);
  console.log(`Loaded Markdown content from ${selectedFilePath}`);
  if (filename === path.basename(selectedFilePath)) {
    fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
      if (err) {
        CodeMirrorEditor.setOption('readOnly', true);
        console.error(err);
        return;
      }
      // Load Markdown content from file into CodeMirrorEditor on initial load
      CodeMirrorEditor.setValue(data);   
      CodeMirrorEditor.clearHistory();      // Clear undo history upon file load
      renderMarkdown(); 
    });
  }
};

// Function to save the Markdown content to the file
const saveMarkdownToFile = () => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    if (selectedFilePath) {
      const markdownText = CodeMirrorEditor.getValue();
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

// Add event listener to the CodeMirrorEditor for input changes
CodeMirrorEditor.on('change', () => {
  saveMarkdownToFile();
});

/**
 * =============================================================================
 *           EVENT LISTENERS FOR MARKDOWN RENDERING AND FILE WATCHING
 * =============================================================================
 */

// by default, CodeMirrorEditor is disabled until a user selects a file
CodeMirrorEditor.setOption('readOnly', true);

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
      // read the file contents and update the CodeMirrorEditor and start watching the selected file
      fs.readFile(selectedFilePath, 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        CodeMirrorEditor.setValue(data);
        CodeMirrorEditor.clearHistory();      // Clear undo history upon new file selection   
        renderMarkdown();     // render Markdown content initially upon loading the file
        loadFileOnSelection();
        CodeMirrorEditor.setOption('readOnly', false);
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
        CodeMirrorEditor.focus();
        // Escape to cancel rename
      } else if (event.key === 'Escape') {
        event.preventDefault();
        targetSpan.textContent = previousName;
        targetSpan.contentEditable = false;
        targetSpan.onkeydown = null;
        targetSpan.blur();
        console.log(`Cancelled renaming of ${targetFilePath} successfully`);
        CodeMirrorEditor.focus();
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
    CodeMirrorEditor.setValue('');
    CodeMirrorEditor.clearHistory();          // Clear undo history upon deleting file
    CodeMirrorEditor.setOption('readOnly', true);
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

const addFolder = () => {
  
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

/**
 * ====================================================================
 *              SOURCE MODE + READING MODE CONTROLS
 * ====================================================================
 */
let codeMirrorScrollPosition;
let codeMirrorCursorPosition;
let outputFieldScrollPosition;
let outputFieldCursorPosition;

// By default, app is in Source mode
let isSourceMode = true;

// Toggle between Source mode and Reading mode
// Save and restore scroll position when going from Source <-> Reading
// Save cursor position when going from Source -> Reading, and restore when going from Reading -> Source

const toggleMode = () => {
  // If in source mode, switch to Reading
  if (isSourceMode) {
    CodeMirrorEditor.setOption('readOnly', true);
    editor.classList.add('hidden');
    outputField.classList.remove('hidden');
  // If in reading mode, switch to Source and focus on CodeMirrorEditor
  } else {
    CodeMirrorEditor.setOption('readOnly', false);
    editor.classList.remove('hidden');
    outputField.classList.add('hidden');
    CodeMirrorEditor.focus();
  }

  // Switch modes 
  isSourceMode = !isSourceMode;
};

// Toggle between Source mode and Reading mode upon "Ctrl + E" or "Cmd + E"
document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
    event.preventDefault(); 
    toggleMode();
  }
});