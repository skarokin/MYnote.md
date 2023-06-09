# MYnote.md

MYnote.md is a minimalist Markdown note taking app made in Electron.js for writing elegant notes with LaTeX and syntax highlighting support

The name and theme is inspired by K-pop group aespa, and their mini-album "MY WORLD"

### Features
- Source mode + Reading mode (Toggle with `Ctrl/Cmd + E`) to combine WYSIWYM and WYSIWYG 
- Syntax highlighting
- LaTeX support 
- Dracula-inspired color theme
- Store notes locally as .md files and organize them in folders
- Scroll position is saved when toggling between Source mode and Reading mode
- Customizable styling via modifying the included CSS file `index.css`
- Responsive document outline
- Easily export notes as .pdf files
- Quickly search for notes, or quickly search for keywords within notes

### Dependencies
MYnote.md relies on the following as dependencies:
- **markdown-it:** A fast and easy to use Markdown parser for JavaScript. More information about markdown-it [here](https://github.com/markdown-it/markdown-it).
    - **markdown-it-texmath:** Add TeX math equations to your Markdown documents rendered by markdown-it parser. More information about markdown-it-texmath [here](https://github.com/goessner/markdown-it-texmath)
- **KaTeX:** A fast, easy-to-use JavaScript library for TeX math rendering on the web. More inforamtion about KaTeX [here](https://katex.org/)
- **highlight.js:** Syntax highlighting for the Web. More information about highlight.js [here](https://highlightjs.org/)
- **CodeMirror:** A code editor component for the web. More information about CodeMirror [here](https://codemirror.net/)
