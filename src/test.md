# current functionality
---
- Markdown parsing
- LaTeX parsing
    $$\sum_{k = 1}^n \frac{1}{k(k + 1)} = \frac{n}{n + 1}$$
- Syntax highlighting
```py
class Solution:
    def minSubArrayLen(self, target: int, nums: List[int]) -> int:
  
                
        # initialize min length (must use infinity for first min calculation)
        min_length = float('inf')

        # initialize front and tail pointers
        front_pointer = 0
        tail_pointer = 0

        # initialize currentSum
        current_sum = 0

        # while front is in range, find current sum and increase window size (increment front)
        while front_pointer < len(nums):

            current_sum = current_sum + nums[front_pointer]
            front_pointer = front_pointer + 1

            # if current sum >= target, then decrease window size (increment tail) until current sum < target
            while tail_pointer < front_pointer and current_sum >= target:
                current_sum = current_sum - nums[tail_pointer]
                min_length = min(min_length, front_pointer - tail_pointer)
                tail_pointer = tail_pointer + 1

        # if min length is still infinity, that means we didn't find any subarray whose sum >= target. so, return 0
        if min_length == float('inf'):
            return 0
        else:
            return min_length
```
- Read from `.md` file and render live preview
    - Renders edits to `.md` file live via **autosaving**, whether edit was done in-app or to the `.md` file itself

# issues with current functionality 
---
- Selected area sometimes automatically goes to last character of the `.md` file
    - **DIFFICULT TO REPLICATE:** I can't figure out what causes this :c
- Saves WAY too often
    - **POSSIBLE FIX:** Instead of saving every 300ms, save after a certain number of characters is typed
- Undo/redo is sometimes finnicky
    - **DIFFICULT TO REPLICATE:** I can't figure out what causes this :c
- **NEW ISSUE:** KaTeX styling and highlight.js styling does not work locally (requires loading stylesheets hosted on a server)
    - **POSSIBLE FIX:** Download the style sheets locally

# log 5/28/2023
---
- Changed `h6` color from `#bd93f4` to `#9bbcfb` 
- Got rid of `code.css` (was unfunctional and useless) and added background to codeblocks by adding `background` property to `pre` class. Indents the code as well by using `padding` property and wraps code if necessary by using `white-space` property to `pre code` class
- Added auto-bracket closing feature
- Added auto-indentation (and removing auto-indentation)
- Fixed text field not parsing if a `.md` file is not selected by disabling text field until a file is selected
- Fixed not being able to scroll in text editor by using `overflow-y: scroll` property 
    - Created a custom scrollbar and got rid of border around editor
- Implemented feature to ensure that only `.md` files can be selected by modifying `handleFileSelection()`
- Fixed Python comments rendering as `h1` instead of as a comment (somehow, adding a background color to codeblocks fixed this issue)

# to-be-implemented
---
Implementation in order of precedence

1. Handle image pasting
2. Live preview (parse markdown as you type, instead of having an output field)
3. Create note outline by displaying headers in order
4. Change rendering system to dynamic rendering, i.e. only re-rendering changed data
    - Current rendering system re-renders entire document upon every input, which can be a performance issue with large files
5. User interface for creating/editing/deleting `.md` files, and creating/editing/deleting folders
    - Ability to open multiple notes at once
    - Ability  to export notes to `.pdf`
6. Ability to search for notes, and search within notes

![karthik](./zoomconference.png)