const $newGameButton = $('#new_game_button');
$newGameButton.click(function() {
	clear_localStorage();
});

function clear_localStorage() {
	localStorage.clear();
}
