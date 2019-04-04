Regexes = {
	watch: /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gi,
	channel: /^((?:https?:)?\/\/)?((?:www|m)\.)?youtube\.com\/((?:c\/|channel\/|user\/)?)([a-zA-Z0-9\-]{1,})/gi
};

$('#search').on('input',function(e){
	var s = $('#search').val(),
	icon_el = '#search-parent label i';
	var url, icon;
	//console.log(s);
	$(icon_el).removeClass('fa-search fa-play fa-user');
	var WatchTest = Regexes.watch.exec(s),
		ChannTest = Regexes.channel.exec(s),
		icon = 'fa-search';
	if (ChannTest!==null && ChannTest.length!==0 && ChannTest[3].length!==0) {
		icon = 'fa-user';
		if (3 in ChannTest && ChannTest[3].startsWith('channel')){
			url = '/channel?id='+ChannTest[4];
		} else {
			url = '/channel?user='+ChannTest[4];
		}
	} else if (WatchTest!==null && WatchTest.length!==0) {
		url = '/watch?v='+WatchTest[5],
		icon = 'fa-play';
	} else if (s.length===0) {
		// do nothing
	} else {
		url = '/search?q='+s;
	}
	$(`#search-parent input[name='poster']`).val(url);
	$(icon_el).addClass(icon);
});

$('#search-parent').on('submit',function(e){
	e.preventDefault();
	var url = $(`#search-parent input[name='poster']`).val();
	if (url.length===0) return;
	if (window.location.pathname.toLowerCase()==='/search' && url.startsWith('/search')) return SearchInline();
	window.location = url;
});

function SearchInline(){
	var n = $('#search').val().toLowerCase();
	if (n===decodeURIComponent(params.q).toLowerCase()) return console.log('same shit');
	Results = {};
	$('.search-results').empty();
	window.history.pushState('page2', 'Title', $(`#search-parent input[name='poster']`).val());
	return main();
}