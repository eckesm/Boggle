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
    return render_template('home.html')


@app.route('/board')
def show_game_board():
    """
    Shows the game board.  If there is no active game board, will start a new game.
    """
    boggle_board = existing_or_new_board()
    if boggle_board == None:
        new_game()
        flash('There was no active game; this is a new game.', "info")
    return render_template('board.html')


@app.route('/new-board')
def start_a_new_board():
    """Creates a new board, saves it to the session, and displays in on the Game Board page."""
    new_game()
    flash('You have started a new game!', "info")
    return redirect('/board')


@app.route('/check-guess', methods=['GET'])
def check_guess():
    guess = request.args.get('guess', None)
    print_to_flask(guess)
    # print_to_flask(session['boggle_board'])
    result = boggle_game.check_valid_word(session['boggle_board'], guess)
    print_to_flask(result)
    return jsonify({"guess_result": result})
