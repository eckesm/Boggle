from unittest import TestCase
from app import app,existing_or_new_board,new_game,print_to_flask
from flask import session
from boggle import Boggle


class FlaskTests(TestCase):
    # TODO -- write tests for every view function / feature!

    def test_show_root(self):
        with app.test_client() as client:
            res = client.get('/')
            html = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertIn('<h1>Boggle</h1>', html)

    def test_show_game_board(self):
        with app.test_client() as client:
            res = client.get('/board')
            html = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertIn('<h3>Correct Guesses</h3>', html)

    def test_start_a_new_board(self):
        with app.test_client() as client:
            res = client.get('/new-board', follow_redirects=True)
            html = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertIn('<h3>Correct Guesses</h3>', html)
            self.assertIn(
                '<p class="info">You have started a new game!</p>', html)
            


    def test_check_guess(self):
        with app.test_client() as client:
            with client.session_transaction() as change_session:
                change_session['boggle_board'] = [['Q', 'D', 'C', 'B', 'C'], ['T', 'G', 'A', 'K', 'J'], ['H', 'D', 'T', 'K', 'N'], ['R', 'T', 'J', 'K', 'A'], ['Y', 'S', 'D', 'G', 'D']]

            # Test word on board
            res = client.get('/check-guess?guess=cat')
            json_data = res.get_json()

            self.assertEqual(res.status_code, 200)
            self.assertEqual({'guess_result': 'ok'}, json_data)

            # Test word on not on board
            res = client.get('/check-guess?guess=yacht')
            json_data = res.get_json()

            self.assertEqual(res.status_code, 200)
            self.assertEqual({'guess_result': 'not-on-board'}, json_data)

            # Test not word
            res = client.get('/check-guess?guess=tjk')
            json_data = res.get_json()

            self.assertEqual(res.status_code, 200)
            self.assertEqual({'guess_result': 'not-word'}, json_data)



    def test_record_finished_game(self):
        with app.test_client() as client:
            with client.session_transaction() as change_session:
                change_session['total_score'] = 25
                change_session['play_count'] = 3

            res = client.post('/finished-game', json={'score': 10})
            json_data = res.get_json()

            self.assertEqual(res.status_code, 200)
            self.assertEqual({'play_count': 4, 'total_score': 35}, json_data)
