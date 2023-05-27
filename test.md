# current functionality
---
- Markdown parsing
- LaTeX parsing
    $$\sum_{k = 1}^n \frac{1}{k(k + 1)} = \frac{n}{n + 1}$$
- Syntax highlighting
    ```python
    def add(x, y):
        return x+y
    ```
- Read from `.md` file and render live preview
    - Renders edits to `.md` file live via **autosaving**, whether edit was done in-app or to the `.md` file itself

# issues with current functionality 
---
- Text field does not parse if a `.md` file is not selected
    - **POSSIBLE FIX:** Since we must open a `.md`. file for text field to parse, simply make it so that you cannot type unless you create a new note or open an existing note
- Not able to scroll in the text field
- Selected area sometimes automatically goes to last character of the `.md` file
- Saves WAY too often
    - **POSSIBLE FIX:** Instead of saving every 300ms, save after a certain number of characters is typed
- Undo/redo is sometimes finnicky
- Opening images makes the app crash
    - **POSSIBLE FIX:** Only allow opening `.md` files

# to-be-implemented
---
Implementation in order of precedence

1. Handle image pasting
2. Live preview (parse markdown as you type, instead of having an output field)
3. Create note outline by displaying headers in order
4. Improve styling of:
    - Code blocks
    - Blockquotes
    - Raw markdown field
5. Change rendering system to dynamic rendering, i.e. only re-rendering changed data
    - Current rendering system re-renders entire document upon every input, which can be a performance issue with large files
6. User interface for creating/editing/deleting `.md` files, and creating/editing/deleting folders
    - Ability to open multiple notes at once
    - Ability  to export notes to `.pdf`
7. Ability to search for notes, and search within notes
8. Daily notes