import time
import copy

class SudokuSolver:
    def __init__(self, grid, use_mrv=False):
        self.grid = [row[:] for row in grid]
        self.use_mrv = use_mrv
        self.steps = []
        self.recursive_calls = 0
        self.pruned = 0
        self.max_depth = 0
        self.current_depth = 0

    def is_valid(self, grid, row, col, num):
        # Row check
        if num in grid[row]:
            return False
        # Column check
        if num in [grid[r][col] for r in range(9)]:
            return False
        # 3x3 box check
        br, bc = 3 * (row // 3), 3 * (col // 3)
        for r in range(br, br + 3):
            for c in range(bc, bc + 3):
                if grid[r][c] == num:
                    return False
        return True

    def get_empty(self, grid):
        if self.use_mrv:
            return self.mrv(grid)
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0:
                    return (r, c)
        return None

    def mrv(self, grid):
        """Minimum Remaining Values heuristic"""
        min_options = 10
        best = None
        for r in range(9):
            for c in range(9):
                if grid[r][c] == 0:
                    options = sum(1 for n in range(1, 10) if self.is_valid(grid, r, c, n))
                    if options < min_options:
                        min_options = options
                        best = (r, c)
        return best

    def solve(self, grid=None, depth=0):
        if grid is None:
            grid = self.grid

        self.recursive_calls += 1
        self.current_depth = depth
        if depth > self.max_depth:
            self.max_depth = depth

        empty = self.get_empty(grid)
        if not empty:
            return True

        row, col = empty
        for num in range(1, 10):
            if self.is_valid(grid, row, col, num):
                grid[row][col] = num
                self.steps.append({
                    "type": "place",
                    "row": row,
                    "col": col,
                    "num": num,
                    "depth": depth,
                    "board": copy.deepcopy(grid)
                })
                if self.solve(grid, depth + 1):
                    return True
                # Backtrack
                grid[row][col] = 0
                self.pruned += 1
                self.steps.append({
                    "type": "backtrack",
                    "row": row,
                    "col": col,
                    "num": num,
                    "depth": depth,
                    "board": copy.deepcopy(grid)
                })
            else:
                self.pruned += 1

        return False

    def run(self):
        start = time.time()
        result = self.solve(self.grid)
        elapsed = round((time.time() - start) * 1000, 2)
        return {
            "solved": result,
            "board": self.grid,
            "steps": self.steps,
            "stats": {
                "recursive_calls": self.recursive_calls,
                "pruned_branches": self.pruned,
                "max_depth": self.max_depth,
                "time_ms": elapsed,
                "total_steps": len(self.steps)
            }
        }
