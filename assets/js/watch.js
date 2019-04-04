Video = {};
DOMLoaded = false,
MetaLoaded = false,
IsPlaying = false,
TabHidden = (document.hidden);

window.addEventListener('webkitvisibilitychange',function(){
	if (document.hidden===false && Audio && Audio[0] && Audio[0].paused===false){
		VideoJS.currentTime(Audio[0].currentTime);
		doPause(true);
	}
});

main();
$(document).ready(function(){
	//Materialize Init
	DOMLoaded = true;
	if (MetaLoaded===true){
		return startGettingFormats();
		
	}
});

function AddDebugLine(text){
	if ($('.current-line').length) $('.current-line').append('...<b class="green-text">Done!</b>').removeClass('current-line');
	$('.progress-debug').prepend(`<h5 class="current-line">${text}</h5>`);
}

function main(){
	if (Config.DebugBox && Config.DebugBox===true) {$('.progress-debug').show();};
	params = getAllUrlParams();
	if (typeof params.v==='string' && params.v.length!==0){
		AddDebugLine('Getting YouTube Metadata');
		CORS(`https://www.youtube.com/watch?v=${params.v}&app=desktop`).then(LoadData);
	} else {
		return;
		return HandleError({
			code: 'C0',
			message: 'There is no Valid Youtube URL!'
		});
	}
}

function LoadData(data){
	AddDebugLine('Compiling and adding to page');
	ytIDR = /<script[ ]{1,}>[ \r\n]{1,}window\["ytInitialData"\][ ]{1,}=[ ]{1,}(\{.+\});[ \r\n]{1,}window\["ytInitialPlayerResponse"\]/gi;
	reg = ytIDR.exec(data.body);
	Video = {Meta:{},Author:{},Formats:{Audio:{}},Saveable:{}},
	Info = {alt:false};
	if (reg==null) return LoadDataAlt(data);
	if (reg.length===0) return LoadDataAlt(data);
	Info.ytInitialData = JSON.parse(reg[1]);
	let i = Info.ytInitialData;
	// Here we go
	if ('ticketShelfRenderer' in i.contents.twoColumnWatchNextResults.results.results.contents[0]) delete i.contents.twoColumnWatchNextResults.results.results.contents.splice(0,1);
	var temp = i.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer;
	Video.Meta.Title = temp.title.simpleText;
	Video.Meta.Views = temp.viewCount.videoViewCountRenderer.viewCount.simpleText;
	Video.Meta.Views = parseInt(Video.Meta.Views.replace(/\D/g,''));
	// ratings
	var temp = temp.sentimentBar.sentimentBarRenderer.tooltip.split(' / ');
	Video.Meta.Ratings = {};
	Video.Meta.Ratings.Likes = temp[0].replace(/\D/g,'');
	Video.Meta.Ratings.Dislikes = temp[1].replace(/\D/g,'');
	
	var temp = i.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.owner.videoOwnerRenderer;
	Video.Author.Name = temp.title.runs[0].text;
	Video.Author.ID = temp.navigationEndpoint.browseEndpoint.browseId;
	Video.Author.Icon = temp.thumbnail.thumbnails[temp.thumbnail.thumbnails.length-1].url;
	Video.Author.Verified = ('badges' in temp) ? true:false;
	Video.Author.Subs = temp.subscriberCountText.simpleText;
	Video.Author.Subs = parseInt(Video.Author.Subs.replace(/\D/g,''));
	
	var temp = i.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer;
	Video.Author.Subs_Approx = temp.subscribeButton.buttonRenderer.text.runs[1].text;
	
	//back to meta for final boss
	Video.Meta.Uploaded = new Date(temp.dateText.simpleText.replace(/Published on /gi,''));
	Video.Meta.Description = '';
	if ('simpleText' in temp.description) {
		Video.Meta.Description = temp.description.simpleText;
	} else {
		Video.Meta.Description = RunsToString(temp.description.runs);
	}
	Video.ID = Info.ytInitialData.currentVideoEndpoint.watchEndpoint.videoId;
	
	reg = /ytplayer\.config[ ]{1,}=[ ]{1,}(\{.+\});ytplayer\.load/gi.exec(data.body);
	if (reg!==null) {
		Info.PlayerConfig = JSON.parse(reg[1]);
	}
	
	return AddToPage();
}

function LoadDataAlt(data){
	Info.alt = true;
	html = data.body;
	//$('body').text(html); //debug only
	YT = new DOMParser().parseFromString(html, 'text/html');
	$$ = (s) => jQuery(s, YT);
	if (typeof $$('.yt-user-info a').attr('href')==='undefined') return HandleError({ code: 'C2', message: $$('#unavailable-message').text()});
	Video = {
		Meta: {
			Title: $$('meta[name="title"]').attr('content'),
			Uploaded: new Date($$('meta[itemprop="datePublished"]').attr('content')),
			Description: $$('#watch-description-text').html(),
			Views: parseInt($$('meta[itemprop="interactionCount"]').attr('content')),
			Ratings: {
				Likes: parseInt($$($$('.like-button-renderer button.like-button-renderer-like-button span.yt-uix-button-content')[0]).text().replace(/,/g, '')),
				Dislikes: parseInt($$($$('.like-button-renderer-dislike-button .yt-uix-button-content')[0]).text().replace(/,/g, '')),
			}
		},
		Author: {
			Name: $$('.yt-user-info a').text(),
			ID: $$('.yt-user-info a').attr('href').replace(/^\/(channel|user)\//gi,''),
			Icon: $$('.yt-thumb-square img').attr('data-thumb').replace(/=s\d{2}-/,'=s288-'),
			Verified: (($$('.yt-user-info .yt-channel-title-icon-verified').length>0)) ? true : false,
			Subs_Approx: $$('.yt-subscription-button-subscriber-count-branded-horizontal').attr('title')
		},
		ID: GetID()
	};
	Video.Meta.Ratings.Total = (Video.Meta.Ratings.Likes+Video.Meta.Ratings.Dislikes);
	try {
		Info.PlayerConfig = JSON.parse($$("script:contains('ytplayer.config')").text().replace(/^.+ytplayer\.config = /gi,'').replace(/;ytplayer\.load = .+$/gi,''));
		Info.PlayerConfig.player_response = JSON.parse(Info.PlayerConfig.player_response);
	}catch(err){console.log(err);};
	
	if (typeof Video.title==='undefined' && typeof Video.description==='undefined' && typeof Video.views==='undefined' && typeof Video.ID==='undefined' && Video.Author.Name.length===0) return HandleError({ code: 'C1', message: 'Invalid Youtube URL!'});
	return AddToPage();
}
function AddToPage(){
	
	// Apply Meta to Page
	$('.meta-head h5').html(Video.Meta.Title); // Title
	document.title=`${Video.Meta.Title} - LeahTube`;
	$('.meta-head h6 span').html(Video.Meta.Views.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')); // Views
	$('.meta-author-name').append(Video.Author.Name); // Channel Name
	$('.meta-author-link').attr('href',`/channel?id=${Video.Author.ID}`); // Channel Link
	$('.meta-author-icon').attr('src',Video.Author.Icon); // Channel Icon
	$('.meta-author-icon').attr('data-position','top').attr('data-tooltip', `~${Video.Author.Subs_Approx} SUBS`); // Channel Subs
	if (Video.Author.Verified && Video.Author.Verified===true) {$('.meta-author-name').append('<i style="padding-left: 5px;" class="fas fa-check-circle vibrant-text"></i>');}
	$('.meta-author-date').append(new Date(Video.Meta.Uploaded).toLocaleDateString('en-GB',{day: '2-digit', month: 'short', year: 'numeric' }));
	$('.meta-description .text').append(Video.Meta.Description);
	$('.meta-description .text a').each(CleanLinks);
	
	var LikesPercentage = ((Video.Meta.Ratings.Likes / Video.Meta.Ratings.Total) * 100),
	DislikesPercentage = ((Video.Meta.Ratings.Dislikes / Video.Meta.Ratings.Total) * 100);
	$('#like-block').css('width',LikesPercentage+'%').attr('data-tooltip',`${Video.Meta.Ratings.Likes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} likes`);
	$('#dislike-block').css('width',DislikesPercentage+'%').attr('data-tooltip',`${Video.Meta.Ratings.Dislikes.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} dislikes`);
	
	MetaLoaded = true;
	if (DOMLoaded===true){
		return startGettingFormats();
	}
}

function CleanLinks(index,el){
	let link = $(el).attr('href');
	if (link.startsWith('/redirect')){
		let link2 = new URLSearchParams(link.replace(/^\//,'')),
		    link3 = link2.get('q');
		$(el).attr('href',link3).attr('target','_blank');
	} else if (link.startsWith('/results')){
		let link2 = new URLSearchParams(link.replace(/^\/results/,'')),
		    link3 = link2.get('search_query');
		$(el).attr('href',`/search?q=${encodeURIComponent(link3)}`);
	} else if ((/(youtu\.be|youtube.com)/gi.test(link))===true){
		VideoLink = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i.exec(link); //thanks https://stackoverflow.com/a/6904504
		if (VideoLink!==null && 1 in VideoLink){
			if (1 in link2) $(el).attr('href',`/watch?v=${VideoLink[1]}`);
		} else if ((/\/channel\//gi.test(link))===true){
			let link2 = link.split('/channel/');
			if (1 in link2) $(el).attr('href',`/channel?id=${link2[1]}`);
		} else if ((/\/user\//gi.test(link))===true){
			let link2 = link.split('/user/');
			if (1 in link2) $(el).attr('href',`/channel?user=${link2[1]}`);
		}
	}
	
}

function startGettingFormats(){
	// Now the Formats
	AddDebugLine('Grabbing Video/Audio Formats');
	
	url = new URL(`https://www.youtube.com/get_video_info?video_id=${Video.ID}`);

	url.searchParams.append('eurl', `https://youtube.googleapis.com/v/${Video.ID}`);
	url.searchParams.append('ps','default');
	url.searchParams.append('gl','US');
	url.searchParams.append('hl',('en'));
	if (Info.PlayerConfig && Info.PlayerConfig.sts) url.searchParams.append('sts',Info.PlayerConfig.sts);
	
	return CORS(url).then(getTokens);
}

function getTokens(data){
	JSKEY = '',
	Info.VideoInfo = querystring.decode(data.body);
	try {
		JSON.parse(Info.VideoInfo.player_response)
	} catch(e){}
	if (Info.VideoInfo.status === 'fail') {
		if (typeof config!=='undefined' && Info.VideoInfo.errorcode === '150' && config.args) {
			info = config.args;
			Info.VideoInfo.no_embed_allowed = true;
		} else {
			return HandleError({
				code: 'Y'+Info.VideoInfo.errorcode,
				message: Info.VideoInfo.reason
			});
		}
	}
	AddDebugLine('Cleaning Formats');
	Info.VideoInfo.formats = parseFormats(Info.VideoInfo);
	
	html5playerfile = 'https://youtube.com'+Info.PlayerConfig.assets.js;
	rs = /(?:html5)?player[-_]([a-zA-Z0-9\-_]+)(?:\.js|\/)/.exec(html5playerfile);
	if (rs!==null){
		JSKEY = rs[1];
	}
	// return decodeTokens(t);
	AddDebugLine('Retrieving tokens');
	return CORS(html5playerfile).then(decodeSignatures);
}

function decodeTokens(t){
	//console.log(t);
	Info.VideoInfo.formats.forEach((format) => {
		const sig = t && format.s ? decipher(t, format.s) : null;
		setDownloadURL(format, sig);
	});
	return HandleVideoInfo();
}

function HandleVideoInfo() {
	AddDebugLine('Assigning Formats');
	
	//console.log(Info.VideoInfo.formats);
	for (i = 0; i < Info.VideoInfo.formats.length; i++) {
		f = Info.VideoInfo.formats[i];
		details = /^((video|audio)\/(\w+)); codecs="(.+)\"$/g.exec(f.type);
		mime = details[1],
		format = details[2],
		ftype = details[3],
		codecs = details[4].split(', ');
		
		if (ftype==='3gpp') continue; //3gpp doesnt work in-browser, skip
		
		Format = {
			url: f.url,
			id: f.itag,
			mime: mime
		};
		if ('fps' in f) Format.fps = f.fps;
		
		qual = (f.quality_label||'unknown');
		if (f.quality==='hd720') qual = '720p';
		if (f.quality==='medium') qual = '360p';
		Format.res = qual;
		
		if (typeof Video.Formats[qual]==='undefined') Video.Formats[qual] = {};
		
		if (codecs[0].startsWith('avc')) codecs[0]='avc';
		if (codecs[0].startsWith('vp8')) codecs[0]='vp8';
		if (codecs[0].startsWith('mp4a')) codecs[0]='mp4a';
		mc = codecs[0];
		
		if (format==='video'){
			
			Format.audio = true;
			if (codecs.length===2){
				//video contains both video and audio
				Format.audio = false;
				qual = qual+'_full';
				if (typeof Video.Formats[qual]==='undefined') Video.Formats[qual] = {};
				Format.res = Format.res+' (Full)';
			} else {
				
			}
			Video.Formats[qual][mc] = Format;
			
		} else {
			BitClean = FileSizeClean(f.bitrate, 0)[0];
			Format.res = codecs[0]+' ('+BitClean+')';

			Video.Formats.Audio[Format.id] = Format;
		}
		//console.log(format, qual, codecs, ftype);
	}
	delete Video.Formats.unknown;
	
	// Init Quality Selector
	quals = [];
	
	
	ResArray = ['2160p60', '2160p', '1440p60', '1440p', '1080p60', '1080p', '720p60', '720p', '480p', '360p', '240p', '180p', '144p'];
	
	for (i = 0; i < ResArray.length; i++) {
		r = ResArray[i],
		label = `${r}`;
		if (!Video.Formats[r]) continue;
		
		prefer = ['vp9', 'vp8', 'avc'];		
		if (Config.PreferAVC&&Config.PreferAVC===true) prefer = ['avc', 'vp9', 'vp8'];
		if (Object.entries(Video.Formats[r]).length === 0 && Video.Formats[r].constructor === Object) {
			//if (r+'_full' in Video.Formats){
			//	label = r.replace('p','F'),
			//	r = r+'_full';
			//} else {
				continue;
			//}
		}
		v = (Video.Formats[r][prefer[0]]||Video.Formats[r][prefer[1]]||Video.Formats[r][prefer[2]]);
		quals.push({label: label, src: v.url, type: v.mime, res: parseInt(r.replace(/p6?0?$/g,''))});
	}
	
	AudArray = Object.keys(Video.Formats.Audio);
	//for (i = 0; i < AudArray.length; i++){
		//r = AudArray[i];
		//console.log(r, Video.Formats.Audio[r]);
		//$('#quality-audio').append(`<li><a onclick="SetAudioRes('${r}')">${Video.Formats.Audio[r].res}</a></li>`);
	//}
	
	$('.current-line').append('...<b class="green-text">Done!</b>').removeClass('current-line');
	$('.progress-debug').prepend(`<h5>Schooch a mooch!</h5>`);
	
	return LoadVideo(quals);
}

function LoadVideo(quals){
	AudioURL = PickBestAudio(Video.Formats.Audio);
	
	
	Audio = $('#audio');
	Audio.attr('src', AudioURL.url);
	var VideoJSPlugins = {
		videoJsResolutionSwitcher: {
			default: Config.PrefQuality,
			dynamicLabel: false
		}
	};
	
	VideoJS = videojs('video', {
		controls: true,
		preload: 'auto',
		poster: `https://img.youtube.com/vi/${Video.ID}/maxresdefault.jpg`,
		height: '100%',
		width: '100%',
		aspectRatio: '16:9',
		plugins: VideoJSPlugins
	});
	//VideoJS.on('error', HandleError);
	VideoJS.one('play', function(){Audio[0].play();Audio[0].currentTime=VideoJS.currentTime();IsPlaying=true;PageTitle(true);});
	VideoJS.one('ended', function(){Audio[0].pause();Audio[0].currentTime=0;IsPlaying=false;PageTitle(false);});
	VideoJS.on('click', function(){
		doPause(!(VideoJS.paused()));
	});
	VideoJS.on('seeking', function(){Audio[0].currentTime=VideoJS.currentTime();}); 
	VideoJS.on('volumechange', function(){Audio[0].volume = VideoJS.volume()});
	$('.vjs-mute-control').on('click', function(){Audio[0].muted = VideoJS.muted();}); //mute button
	
	VideoJS.updateSrc(quals);
	$('.progress-debug').slideUp();
	$('#video').slideDown({
		complete: function(){
			$('#video_html5_api').fadeIn();
			if (Config.AutoPlay && Config.AutoPlay===true) VideoJS.play();
		}
	});
	
	if (Config.RelatedVideos&&Config.RelatedVideos===true) document.body.onkeydown = KeyBoardShortcuts;
	if (Config.RelatedVideos&&Config.RelatedVideos===true) relatedVideos();
	if (Config.TroubleshootVars&&Config.TroubleshootVars===false) CleanUp();
	return;
}

function CleanUp(){
	delete main;delete LoadData;delete CleanLinks;delete startGettingFormats;delete getTokens;delete decodeTokens;delete HandleVideoInfo;delete LoadVideo;delete PageTitle;delete parseFormats;delete GetID;delete decodeSignatures;delete decipher;delete DOMLoaded;delete MetaLoaded;delete IsPlaying;delete params;delete html;delete YT;delete $$;delete c;delete i;delete Info;delete VideoLink;delete url;delete JSKEY;delete html5playerfile;delete rs;delete body;delete f;delete details;delete mime;delete format;delete ftype;delete codecs;delete Format;delete mc;delete BitClean;delete ResArray;delete r;delete label;delete prefer;delete v;delete AudArray;delete AudioURL;delete RelatedVideos;delete related;delete AddRelatedVideo;
}

function KeyBoardShortcuts(e){
	//e.preventDefault();
    if (e.keyCode==75||e.keyCode==32) {e.preventDefault();return doPause();} // K or Space pause
    if (e.keyCode==70) return $('.vjs-fullscreen-control').click(); //f Fullscreen
    if (e.keyCode==77) {VideoJS.muted(!(VideoJS.muted())); Audio[0].muted=(!(Audio[0].muted))} //m Mute Toggle
	// Seek
    if (e.keyCode==36) return VideoJS.currentTime(0); // Home, start of video
    if (e.keyCode==35) return VideoJS.currentTime(VideoJS.duration()); // End, End of video
    if (e.keyCode==37) return Seek(-5); // Left Arrow 5 Second Back
    if (e.keyCode==39) return Seek(5); // Right Arrow 5 Second Ahead
	if (e.keyCode==74) return Seek(-10); // Left Arrow 10 Second Back
    if (e.keyCode==76) return Seek(10); // Right Arrow 10 Second Ahead
	if (/[\d]{1}/.test(e.key)===true) return NumOfVid(e.key);
	
}

function Seek(num){
	if (typeof num==='undefined') return;
	return VideoJS.currentTime( (VideoJS.currentTime()+num) );
}

function Vol(num){
	if (typeof num==='undefined') return;
	VideoJS.volume((VideoJS.volume() + num));
}



function NumOfVid(num){
	if (typeof num==='undefined') return;
	return VideoJS.currentTime(((num*10)*VideoJS.duration()) / 100 );
}

function doPause(action){
	var action=action;
	if (typeof action==='undefined') var action=VideoJS.paused();
	if (action===false){
		// pause the video
		VideoJS.pause();
		Audio[0].pause();
		IsPlaying=false;
		PageTitle(false);
	} else if (action===true){
		//play the video
		VideoJS.pause();
		Audio[0].pause();
		Audio[0].currentTime=VideoJS.currentTime();
		VideoJS.play();
		Audio[0].play();
		IsPlaying=true;
		PageTitle(true);
	}
	return;
}

function PageTitle(playing){
	switch(playing){
		case true:
		document.title=`▶ ${Video.Meta.Title} - LeahTube`;
		break;
		
		case false:
		document.title=`${Video.Meta.Title} - LeahTube`;
		break;
	}
}

AddRelatedVideo=(n)=>`<div class=rel-item id=rel-${n}><a><img><div class=rel-meta><h6 class=rel-name></h6><p><span class=rel-channel></span> <span class=rel-views></span></a></div>`;

function relatedVideos(){
	if (Info.alt===true) return relatedVideosAlt();
	
	var temp = Info.ytInitialData.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
	for (var N = 0; N < temp.length; N++) {
		let n = Object.keys(temp[N])[0];
		var m, title,src,channel,views,link;
		if (n==='compactAutoplayRenderer'){
			temp[N][n] = temp[N][n].contents[0].compactVideoRenderer,
			n==='compactVideoRenderer';
		} 
		if (n==='compactVideoRenderer'){
			m = temp[N][n];
			title = m.title.simpleText,
			src = m.thumbnail.thumbnails[m.thumbnail.thumbnails.length-1].url,
			channel = m.longBylineText.runs[0].text,
			views = m.viewCountText.simpleText,
			link = '/watch?v='+m.videoId;
		} else {
			continue;
		}
		//console.log(title,src,channel,views,link);
		$('#related-videos').append(AddRelatedVideo(N));
		let div = '#rel-'+N;
		$(`${div} a`).attr('href',link);
		$(`${div} img`).attr('src',src);
		$(`${div} a`).attr('title',title);
		$(`${div} .rel-name`).text(title);
		$(`${div} .rel-channel`).text(channel);
		$(`${div} .rel-views`).text(views);
	}
}
function relatedVideosAlt(){
	return;
	related = $$('#watch-related li.video-list-item');
	related.each(function(index,el){
		let vid = $(el),
		title = vid.find('.content-wrapper a span.title').text()
		if (title==="")return;
		$('#related-videos').append(AddRelatedVideo(index));
		let div = '#rel-'+index;
		$(`${div} a`).attr('href',vid.find('.content-wrapper a').attr('href'));
		$(`${div} a`).attr('title',vid.find('.content-wrapper a span.title').text());
		$(`${div} img`).attr('src',vid.find('.thumb-wrapper img').attr('data-thumb'));
		$(`${div} .rel-name`).text(vid.find('.content-wrapper a span.title').text());
		$(`${div} .rel-channel`).text(vid.find('.content-wrapper a span.attribution span').text());
		$(`${div} .rel-views`).text(vid.find('.content-wrapper a span.view-count').text());
	});
}

function parseFormats(info) {
	let formats = [];
	if (Info.VideoInfo.url_encoded_fmt_stream_map) {
		formats = formats.concat(Info.VideoInfo.url_encoded_fmt_stream_map.split(','));
	}
	if (Info.VideoInfo.adaptive_fmts) {
		formats = formats.concat(Info.VideoInfo.adaptive_fmts.split(','));
	}
	formats = formats.map((format) => querystring.decode(format));
	delete Info.VideoInfo.url_encoded_fmt_stream_map;
	delete Info.VideoInfo.adaptive_fmts;
	return formats;
};

function GetID(){
	c = $$('#page').attr('class').split(/\s+/);
	for (i = 0; i < c.length; i++) {
		if (c[i].startsWith('video-')){
			return c[i].split('video-')[1];
		}
	}
}

//partially from https://stackoverflow.com/a/18650828
function FileSizeClean(num, decimals) {
	if (typeof num==='string') num = parseInt(num);
	if(num == 0) return [0, 'B'];
	var k = 1024,
	dm = decimals || 2,
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(num) / Math.log(k));
	return [parseFloat((num / Math.pow(k, i)).toFixed(0)),sizes[i]];
}

function PickBestAudio(o){
	return (o['251']||o['171']||o['140']||o['250']||o['249']||o['139']);
}

function decodeSignatures(data){
	body = data.body;
	var jsVS = '[a-zA-Z_\\$][a-zA-Z_0-9]*',
	jsSQS = `'[^'\\\\]*(:?\\\\[\\s\\S][^'\\\\]*)*'`,
	jsDQS = `"[^"\\\\]*(:?\\\\[\\s\\S][^"\\\\]*)*"`,
	jsQS = `(?:${jsSQS}|${jsDQS})`,
	jsKS = `(?:${jsVS}|${jsQS})`,
	jsPS = `(?:\\.${jsVS}|\\[${jsQS}\\])`,
	jsES = `(?:''|"")`,
	jsRS = ':function\\(a\\)\\{' +
	'(?:return )?a\\.reverse\\(\\)' +
	'\\}',
	ss = ':function\\(a,b\\)\\{' +
	'return a\\.slice\\(b\\)' +
	'\\}',
	sps = ':function\\(a,b\\)\\{' +
	'a\\.splice\\(0,b\\)' +
	'\\}',
	sws = ':function\\(a,b\\)\\{' +
	'var c=a\\[0\\];a\\[0\\]=a\\[b(?:%a\\.length)?\\];a\\[b(?:%a\\.length)?\\]=c(?:;return a)?' +
	'\\}';
	var aOR = new RegExp(
	`var (${jsVS})=\\{((?:(?:` +
		jsKS + jsRS + '|' +
		jsKS + ss   + '|' +
		jsKS + sps  + '|' +
		jsKS + sws +
	'),?\\r?\\n?)+)\\};'
	),
	aFR = new RegExp(`function(?: ${jsVS})?\\(a\\)\\{` +
		`a=a\\.split\\(${jsES}\\);\\s*` +
		`((?:(?:a=)?${jsVS}` +
		jsPS +
		'\\(a,\\d+\\);)+)' +
		`return a\\.join\\(${jsES}\\)` +
	'\\}'
	),
	rR = new RegExp(`(?:^|,)(${jsKS})${jsRS}`, 'm'),
	slR   = new RegExp(`(?:^|,)(${jsKS})${ss}`, 'm'),
	spR  = new RegExp(`(?:^|,)(${jsKS})${sps}`, 'm'),
	swR    = new RegExp(`(?:^|,)(${jsKS})${sws}`, 'm');
	
	var obj_r = aOR.exec(body),
	fR = aFR.exec(body);
	if (!obj_r || !fR) { return null; }
	
	var obj      = obj_r[1].replace(/\$/g, '\\$'),
		objBody  = obj_r[2].replace(/\$/g, '\\$'),
		funcBody = fR[1].replace(/\$/g, '\\$');
	
	var res = rR.exec(objBody);
	var rK = res && res[1]
		.replace(/\$/g, '\\$')
		.replace(/\$|^'|^"|'$|"$/g, ''),
	res = slR.exec(objBody);
	var sK = res && res[1]
		.replace(/\$/g, '\\$')
		.replace(/\$|^'|^"|'$|"$/g, ''),
	res = spR.exec(objBody);
	var spK = res && res[1]
		.replace(/\$/g, '\\$')
		.replace(/\$|^'|^"|'$|"$/g, ''),
	res = swR.exec(objBody);
	var swK = res && res[1]
		.replace(/\$/g, '\\$')
		.replace(/\$|^'|^"|'$|"$/g, '');
	
	var keys = `(${[rK, sK, spK, swK].join('|')})`,
		myreg = '(?:a=)?' + obj +
		`(?:\\.${keys}|\\['${keys}'\\]|\\["${keys}"\\])` +
		'\\(a,(\\d+)\\)',
		tR = new RegExp(myreg, 'g');
	var t = [];
	while ((res = tR.exec(funcBody)) !== null) {
		let key = res[1] || res[2] || res[3];
		switch (key) {
		case swK:
			t.push('w' + res[4]);
			break;
		case rK:
			t.push('r');
			break;
		case sK:
			t.push('s' + res[4]);
			break;
		case spK:
			t.push('p' + res[4]);
			break;
		}
	}
	return decodeTokens(t);
}

function setDownloadURL(format, sig, debug) {
	let decodedUrl;
	if (format.url) {
		decodedUrl = format.url;
	} else {
		if (debug) {
			console.warn('Download url not found for itag ' + format.itag);
		}
		return;
	}
	try {
		decodedUrl = decodeURIComponent(decodedUrl);
	} catch (err) {
		if (debug) {
			console.warn('Could not decode url: ' + err.message);
		}
		return;
	}
	if (decodedUrl.search(/\&ratebypass\=\w+/gi)!==-1){
		decodedUrl = decodedUrl.replace(/\&ratebypass\=\w+/gi, '&ratebypass=yes');
	} else {
		decodedUrl += '&ratebypass=yes';
	}
	if (sig) decodedUrl+= `&signature=${encodeURIComponent(sig)}`;
	
	format.url = decodedUrl;
};

function decipher (t, sig){
	sig = sig.split('');
	for (let i = 0, len = t.length; i < len; i++) {
		let token = t[i], pos;
		switch (token[0]) {
			case 'r':
			sig = sig.reverse();
			break;
			case 'w':
			pos = ~~token.slice(1);
			sig = swapHeadAndPosition(sig, pos);
			break;
			case 's':
			pos = ~~token.slice(1);
			sig = sig.slice(pos);
			break;
			case 'p':
			pos = ~~token.slice(1);
			sig.splice(0, pos);
			break;
		}
	}
	return sig.join('');
};
const swapHeadAndPosition = (arr, position) => {
  const first = arr[0];
  arr[0] = arr[position % arr.length];
  arr[position] = first;
  return arr;
};