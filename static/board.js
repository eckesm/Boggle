class BoggleGame {
	constructor(timer) {
		this.timer = timer;
		this.words = [];
		this.totalScore = 0;
		this.get_from_localStorage = this.get_from_localStorage.bind(this);
		this.update_localStorage = this.update_localStorage.bind(this);
		this.timer_finished = this.timer_finished.bind(this);

		this.clear_localStorage_check();
		this.start_timer(this.timer);
		this.words = this.retrieve_saved_words();
		this.populate_results_list_with_saved_words();
		this.submit_guess_button_click();
	}

	/****************************************************************
	-------------- Check localStorage for Active Game ---------------
	****************************************************************/

	retrieve_saved_words() {
		const retrievedWords = [];
		const savedWords = this.get_from_localStorage('words');
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

	/****************************************************************
	----------------- Processing New Guesses & UI -------------------
	****************************************************************/

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
		this.totalScore += score;
		this.add_score_to_total(this.totalScore);
		this.update_score_in_localStorage(this.totalScore);
	}

	calculate_word_score(word) {
		return word.length;
	}

	add_score_to_total(totalScore) {
		const $score = $('#score');
		$score.text(totalScore + ' points');
	}

	update_score_in_localStorage(score) {
		this.update_localStorage('score', score);
	}

	add_to_words_list(word) {
		const wordInCaps = word.toUpperCase();
		this.words.push(wordInCaps);
	}

	/****************************************************************
	------------------------ Timer Functions ------------------------
	****************************************************************/

	check_if_time_up() {
		const savedTime = this.get_from_localStorage('timer');
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

		let savedTime = this.get_from_localStorage('timer');
		if (savedTime === 'done') {
			$timer.text(form_timer_text(0));
			this.timer = 'done';
			return;
		}

		savedTime = Number(savedTime);
		if (savedTime !== 0) {
			remainingTime = savedTime;
		}

		this.update_localStorage('timer', remainingTime);
		$timer.text(form_timer_text(remainingTime));

		let timerInterval = setInterval(() => {
			let remainingTime = Number(this.get_from_localStorage('timer'));
			// console.log(remainingTime);

			remainingTime -= 1000;

			$timer.text(form_timer_text(remainingTime));

			if (remainingTime === 0) {
				this.update_localStorage('timer', 'done');
				clearInterval(timerInterval);
				this.timer_finished();
			}
			else {
				this.update_localStorage('timer', remainingTime);
			}
		}, 1000);
	}

	/****************************************************************
	------------------------ Server Requests ------------------------
	****************************************************************/

	async check_guess(guess) {
		const $guessOutcomeWord = $('#guess_outcome_word');
		$guessOutcomeWord.text(guess.toUpperCase() + ':');
		const $guessOutcome = $('#guess_outcome');

		if (this.check_for_duplicate(guess)) {
			$guessOutcome.text('duplicate! not added.');
			return;
		}

		let result = await this.check_guess_with_server(guess);

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

	// --> Timer finished

	async timer_finished() {
		console.log(`score: ${currentGame.totalScore}`);
		let response = await this.update_server(this.totalScore);
		// console.log(response);
		const sessionTotalScore = response.total_score;
		const sessionPlayCount = response.play_count;

		let message = `${this.totalScore} points this game. \nCorrect words found: ${this.words} \n${sessionTotalScore} points scored in all ${sessionPlayCount} games played.`;
		
		$('#total_score').text(`${sessionTotalScore} total points`);
		$('#total_plays').text(`${sessionPlayCount} games`);
		$('#guess_outcome_div').remove();
		alert(message);
		// localStorage.clear()
	}

	async update_server(score) {
		const response = await axios({
			url    : '/finished-game',
			method : 'POST',
			data   : { score }
		});
		return response.data;

		// const response = await axios({
		// 	url    : '/finished-game',
		// 	method : 'POST',
		// 	data   : { score }
		// });
		// const json_data=await response.json()
		// return json_data.data;
	}

	/****************************************************************
	--------------------- localStorage Functions --------------------
	****************************************************************/

	add_word_to_localStorage(word) {
		let savedWords = this.get_from_localStorage('words');
		if (savedWords === null) {
			savedWords = '';
		}
		savedWords += `${word};`;
		// console.log(savedWords);
		localStorage.setItem('words', savedWords);
	}

	get_from_localStorage(key) {
		if (localStorage.getItem(key) === null) {
			return null;
		}
		else {
			return localStorage.getItem(key);
		}
	}

	update_localStorage(key, string) {
		localStorage.setItem(key, string);
	}

	/****************************************************************
	------------------------ Event Listeners ------------------------
	****************************************************************/

	clear_localStorage_check() {
		if ($('#clear_localStorage').val() === 'True') {
			localStorage.clear();
		}
	}

	submit_guess_button_click() {
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

/********************************************************************
------------------------ When DOM Loads -----------------------------
********************************************************************/
const currentGame = new BoggleGame(60000);
