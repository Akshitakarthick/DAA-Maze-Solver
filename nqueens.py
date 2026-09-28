import time
import copy

class NQueensSolver:
    def __init__(self, n):
        self.n = n
        self.board = [[0] * n for _ in range(n)]
        self.solutions = []
        self.steps = []
        self.recursive_calls = 0
        self.pruned = 0
        self.max_depth = 0

    def is_safe(self, board, row, col):
        # Check column above
        for r in range(row):
            if board[r][col] == 1:
                return False
        # Check upper-left diagonal
        r, c = row - 1, col - 1
        while r >= 0 and c >= 0:
            if board[r][c] == 1:
                return False
            r -= 1
            c -= 1
        # Check upper-right diagonal
        r, c = row - 1, col + 1
        while r >= 0 and c < self.n:
            if board[r][c] == 1:
                return False
            r -= 1
            c += 1
        return True

    def solve(self, board, row=0):
        self.recursive_calls += 1
        if row > self.max_depth:
            self.max_depth = row

        if row == self.n:
            self.solutions.append(copy.deepcopy(board))
            self.steps.append({
                "type": "solution",
                "board": copy.deepcopy(board),
                "depth": row,
                "solution_num": len(self.solutions)
            })
            return

        for col in range(self.n):
            if self.is_safe(board, row, col):
                board[row][col] = 1
                self.steps.append({
                    "type": "place",
                    "row": row,
                    "col": col,
                    "depth": row,
                    "board": copy.deepcopy(board)
                })
                self.solve(board, row + 1)
                board[row][col] = 0
                self.pruned += 1
                self.steps.append({
                    "type": "backtrack",
                    "row": row,
                    "col": col,
                    "depth": row,
                    "board": copy.deepcopy(board)
                })
            else:
                self.pruned += 1

    def run(self):
        start = time.time()
        self.solve(self.board)
        elapsed = round((time.time() - start) * 1000, 2)
        return {
            "solved": len(self.solutions) > 0,
            "solutions": self.solutions,
            "solution_count": len(self.solutions),
            "steps": self.steps,
            "stats": {
                "recursive_calls": self.recursive_calls,
                "pruned_branches": self.pruned,
                "max_depth": self.max_depth,
                "time_ms": elapsed,
                "total_steps": len(self.steps),
                "solutions_found": len(self.solutions)
            }
        }
