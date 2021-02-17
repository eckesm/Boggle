// 'use strict';

class BoggleGame {
	constructor(timer) {
		this.timer = timer;
		this.words = [];

		this.start_timer(this.timer);
		this.words = this.retrieve_saved_words();
		this.populate_results_list_with_saved_words();
		this.submit_guess_button_click()
	}

	// --------------------------------------------------------------
	// Retrieve and process data from localStorage

	retrieve_saved_words() {
		const retrievedWords = [];
		const savedWords = get_from_localStorage('words');
		if (savedWords !== null) {
			const savedWordsArray = savedWords.split(';');
			for (let word of savedWordsArray) {
				if (word.length > 0) {
					retrievedWords.push(word.toUpperCase());
				}
			}
		}
		return retrievedWords;
	}

	populate_results_list_with_saved_words() {
		for (let word of this.words) {
			this.add_to_results_list_and_score(word.toUpperCase());
		}
	}

	// --------------------------------------------------------------
	// Proccess new guesses
	
	check_for_duplicate(checkWord) {
		for (let word of this.words) {
			if (word.toUpperCase() === checkWord.toUpperCase()) {
				return true;
			}
		}
		return false;
	}

	add_to_results_list_and_score(word) {
		const score = this.calculate_word_score(word);
		const wordInCaps = word.toUpperCase();
		const $newLi = $(`<li>${wordInCaps} - ${score}</li>`);
		$newLi.appendTo('#results_list');
		this.add_score_to_total(score);
	}

	calculate_word_score(word) {
		return word.length;
	}

	add_score_to_total(score) {
		const $score = $('#score');
		let totalScore = Number($score.attr('data-score'));
		totalScore += score;
		$score.attr('data-score', totalScore);
		$score.text(totalScore + ' points');
	}

	add_to_words_list(word) {
		const wordInCaps = word.toUpperCase();
		this.words.push(wordInCaps);
	}

	// --------------------------------------------------------------
	// Timer functions

	check_if_time_up() {
		const savedTime = get_from_localStorage('timer');
		if (savedTime === 'done') {
			return true;
		}
		return false;
	}

	start_timer(timerMilliseconds) {
		function form_timer_text(milliseconds) {
			if (milliseconds === 1000) {
				return '1 second';
			}
			else if (milliseconds === 0) {
				return "TIME'S UP!";
			}
			else {
				return milliseconds / 1000 + ' seconds';
			}
		}

		const $timer = $('#timer');
		let remainingTime = timerMilliseconds;

		let savedTime = get_from_localStorage('timer');
		if (savedTime === 'done') {
			$timer.text(form_timer_text(0));
			this.timer = 'done';
			return;
		}

		savedTime = Number(savedTime);
		if (savedTime !== 0) {
			remainingTime = savedTime;
		}

		update_localStorage('timer', remainingTime);
		$timer.text(form_timer_text(remainingTime));

		let timerInterval = setInterval(function() {
			let remainingTime = Number(get_from_localStorage('timer'));
			console.log(remainingTime);

			remainingTime -= 1000;

			$timer.text(form_timer_text(remainingTime));

			if (remainingTime === 0) {
				update_localStorage('timer', 'done');
				clearInterval(timerInterval);
			}
			else {
				update_localStorage('timer', remainingTime);
			}
		}, 1000);
	}

	// --------------------------------------------------------------
	// Check guess with server

	async check_guess(guess) {
		const $guessOutcomeWord = $('#guess_outcome_word');
		$guessOutcomeWord.text(guess.toUpperCase() + ':');
		const $guessOutcome = $('#guess_outcome');

		if (this.check_for_duplicate(guess)) {
			$guessOutcome.text('duplicate! not added.');
			return;
		}

		let result = await this.check_guess_with_server(guess);
		console.log(result);

		if (result === 'ok') {
			$guessOutcome.text('correct!');
			this.add_to_results_list_and_score(guess);
			this.add_to_words_list(guess);
			this.add_word_to_localStorage(guess);
		}
		if (result === 'not-on-board') {
			$guessOutcome.text('Not on board');
		}
		if (result === 'not-word') {
			$guessOutcome.text('Not a recognized word');
		}
	}

	async check_guess_with_server(guess) {
		const response = await axios.get('/check-guess', { params: { guess } });
		return response.data.guess_result;
	}

	// --------------------------------------------------------------
	// localStorgage helper functions

	add_word_to_localStorage(word) {
		let savedWords = get_from_localStorage('words');
		if (savedWords === null) {
			savedWords = '';
		}
		savedWords += `${word};`;
		console.log(savedWords);
		localStorage.setItem('words', savedWords);
	}

	// --------------------------------------------------------------
	// event listeners

	submit_guess_button_click(){
		const $guessButton = $('#guess_button');
		$guessButton.click(function(e) {
			e.preventDefault();

			if (currentGame.check_if_time_up()) {
				alert('Time is up!  No more guesses.');
				return;
			}

			const $guessInput = $('#guess_input');
			let guess = $guessInput.val().toLowerCase();
			$guessInput.val('');
			currentGame.check_guess(guess);
		});
	}

}

function get_from_localStorage(key) {
	if (localStorage.getItem(key) === null) {
		return null;
	}
	else {
		return localStorage.getItem(key);
	}
}

function update_localStorage(key, string) {
	localStorage.setItem(key, string);
}

/********************************************************************
------------------------ When DOM Loads -----------------------------
********************************************************************/
const currentGame = new BoggleGame(10000);

