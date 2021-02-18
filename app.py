#####################################################################
# ------------------------- Imports & Settings -------------------- #
#####################################################################

from flask import Flask, request, render_template, redirect, flash, session, jsonify
from flask_debugtoolbar import DebugToolbarExtension
import sys
from boggle import Boggle

app = Flask(__name__)
app.config['SECRET_KEY'] = '0123456789'
app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False
debug = DebugToolbarExtension(app)

boggle_game = Boggle()

#####################################################################
# ------------------------- Helper Functions ---------------------- #
#####################################################################


def existing_or_new_board():
    """
    Checks to see if there is already a game in the session.  Returns active game or None.
    """
    boggle_board = session.get('boggle_board', None)
    return boggle_board


def new_game():
    """Loads a new board and saves to session."""
    boggle_board = boggle_game.make_board()
    session['boggle_board'] = boggle_board
    session['game_over'] = True


def print_to_flask(thing_to_print):
    """Prints content to the flask server."""
    print("*********************", file=sys.stderr)
    print(thing_to_print, file=sys.stderr)
    print("*********************", file=sys.stderr)

#####################################################################
# --------------------------- View Functions ---------------------- #
#####################################################################


@app.route('/')
def show_root():
    """Shows the home page."""
    return render_template('index.html')


@app.route('/board')
def show_game_board():
    """
    Shows the game board.  If there is no active game board, will start a new game.
    """
    boggle_board = existing_or_new_board()
    if boggle_board == None:
        new_game()
        flash('There was no active game; this is a new game.', "info")

    if session.get('game_over', False) == True:
        session['game_over'] = False
        return render_template('board.html', clear_localStorage=True)
    else:
        return render_template('board.html', clear_localStorage=False)


@app.route('/new-board')
def start_a_new_board():
    """Creates a new board, saves it to the session, and displays in on the Game Board page."""
    new_game()
    flash('You have started a new game!', "info")
    return redirect('/board')


@app.route('/check-guess', methods=['GET'])
def check_guess():
    """Receives API and returns if word is in board, not a word, or a word but not on the board."""
    guess = request.args.get('guess', None)
    result = boggle_game.check_valid_word(session['boggle_board'], guess)
    print_to_flask(f'{guess}: {result}')
    return jsonify({"guess_result": result})


@app.route('/finished-game', methods=['POST'])
def record_finished_game():
    """
    When client finishes a game, updates the server to increase number of games played and total score across all games played in session.
    """

    session['game_over'] = True

    total_score = int(session.get('total_score', 0))
    score = int(request.json.get('score', 0))
    total_score += score
    session['total_score'] = total_score

    play_count = int(session.get('play_count', 0))
    play_count += 1
    session['play_count'] = play_count

    return jsonify({'total_score': total_score, 'play_count': play_count})
