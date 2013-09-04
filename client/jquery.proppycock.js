$(document).ready(function() {
	// Handle hover.. wouldn't work in meteor events? 
	$('#proppycock textarea').hover(function() {
		$('#proppycock').addClass('hover');
	}, function () {
		$('#proppycock').removeClass('hover');
	});

	$(window).resize(function () {
		centerContent();
	});

	function centerContent() {
		var pageHeight = $(window).height() - ($('header').height() + $('footer').height());
		var contentHeight = $('#questions').height() + $('#proppycock').outerHeight(true);

		$('#bodyholder').css('top', (pageHeight - contentHeight) / 2);
	}
});