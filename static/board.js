'use strict';

const $guessButton = $('#guess_button');
$guessButton.click(function(e) {
	e.preventDefault();
	const $guessInput = $('#guess_input');
	let guess = $guessInput.val().toLowerCase();
	$guessInput.val('');
	check_guess(guess);
});

async function check_guess(guess) {
	let result = await check_guess_with_server(guess);
	console.log(result);

	const $guessOutcomeWord = $('#guess_outcome_word');
	$guessOutcomeWord.text(guess + ':');

	const $guessOutcome = $('#guess_outcome');
	if (result === 'ok') {
		$guessOutcome.text('correct!');
		add_to_results_list(guess);
		add_word_to_localStorage(guess);
	}
	if (result === 'not-on-board') {
		$guessOutcome.text('Not on board');
	}
	if (result === 'not-word') {
		$guessOutcome.text('Not a recognized word');
	}
}

function add_word_to_localStorage(word) {
	let savedWords = localStorage.getItem('words');
	if (savedWords === null) {
		savedWords = '';
	}
	savedWords += `${word};`;
	console.log(savedWords);
	localStorage.setItem('words', savedWords);
}

function add_to_results_list(word) {
	let wordInCaps = word.toUpperCase();
	const $newLi = $(`<li>${wordInCaps}</li>`);
	$newLi.appendTo('#results_list');
}

async function check_guess_with_server(guess) {
	const response = await axios.get('/check-guess', { params: { guess } });

	let result = response.data.guess_result;
	return result;
}
