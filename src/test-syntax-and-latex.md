# LaTeX Test
---
$$\sum_{k = 1}^n \frac{1}{k(k + 1)} = \frac{n}{n + 1}$$

# Syntax Highlighting Test
---
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