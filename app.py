from flask import Flask, render_template, request, jsonify
from solvers.sudoku import SudokuSolver
from solvers.nqueens import NQueensSolver

app = Flask(__name__)

# Preset Sudoku puzzles
SUDOKU_PRESETS = {
    "easy": [
        [5,3,0,0,7,0,0,0,0],
        [6,0,0,1,9,5,0,0,0],
        [0,9,8,0,0,0,0,6,0],
        [8,0,0,0,6,0,0,0,3],
        [4,0,0,8,0,3,0,0,1],
        [7,0,0,0,2,0,0,0,6],
        [0,6,0,0,0,0,2,8,0],
        [0,0,0,4,1,9,0,0,5],
        [0,0,0,0,8,0,0,7,9]
    ],
    "medium": [
        [0,0,0,2,6,0,7,0,1],
        [6,8,0,0,7,0,0,9,0],
        [1,9,0,0,0,4,5,0,0],
        [8,2,0,1,0,0,0,4,0],
        [0,0,4,6,0,2,9,0,0],
        [0,5,0,0,0,3,0,2,8],
        [0,0,9,3,0,0,0,7,4],
        [0,4,0,0,5,0,0,3,6],
        [7,0,3,0,1,8,0,0,0]
    ],
    "hard": [
        [0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,3,0,8,5],
        [0,0,1,0,2,0,0,0,0],
        [0,0,0,5,0,7,0,0,0],
        [0,0,4,0,0,0,1,0,0],
        [0,9,0,0,0,0,0,0,0],
        [5,0,0,0,0,0,0,7,3],
        [0,0,2,0,1,0,0,0,0],
        [0,0,0,0,4,0,0,0,9]
    ]
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/sudoku/preset/<difficulty>")
def sudoku_preset(difficulty):
    grid = SUDOKU_PRESETS.get(difficulty, SUDOKU_PRESETS["easy"])
    return jsonify({"grid": grid})

@app.route("/api/sudoku/solve", methods=["POST"])
def solve_sudoku():
    data = request.json
    grid = data.get("grid")
    use_mrv = data.get("use_mrv", False)

    if not grid or len(grid) != 9:
        return jsonify({"error": "Invalid grid"}), 400

    solver = SudokuSolver(grid, use_mrv=use_mrv)
    result = solver.run()

    # Limit steps to 300 for performance
    result["steps"] = result["steps"][:300]
    return jsonify(result)

@app.route("/api/nqueens/solve", methods=["POST"])
def solve_nqueens():
    data = request.json
    n = data.get("n", 8)

    if n < 1 or n > 12:
        return jsonify({"error": "N must be between 1 and 12"}), 400

    solver = NQueensSolver(n)
    result = solver.run()

    # Limit steps for UI performance
    result["steps"] = result["steps"][:500]
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
