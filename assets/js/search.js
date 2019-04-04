FilterTypes = {
	video: {
		all: `EgIQAQ%3D%3D`,
		last_hour: `EgQIARAB`,
		today: `EgQIAhAB`,
		this_week: `EgQIAxAB`,
		this_month: `EgQIBBAB`,
		this_year: `EgQIBRAB`
	},
	channel: `EgIQAg%3D%3D`
};

function main(){
	var FilterParams = {
		v: 'video',
		vid: 'video',
		vids: 'video',
		video: 'video',
		videos: 'video',
		c: 'channel',
		channel: 'channel',
		channels: 'channel',
		u: 'channel',
		user: 'channel',
		users: 'channel',
	};
	params = getAllUrlParams();
	if (typeof params.q==='string' && params.q.length!==0){
		$('#search').val(decodeURIComponent(params.q));
		$('#search-parent input[name="poster"]').val('/search?q='+params.q);
		var obj={
			q: decodeURIComponent(params.q),
			page: (typeof params.page==='string' && params.page.length!==0 && !(isNaN(params.page))) ? params.page:'1',
			//filter: (typeof params.type==='string' && params.type.length!==0 && params.type in FilterParams) ? FilterTypes[FilterParams[params.type]]:FilterTypes.video,
		};
		return SearchResults(obj);
	} else {
		return HandleError({
			code: 'S0',
			message: 'No Search Query provided!'
		});
	}
}
Results = {};
main();

function SearchResults(obj){
	window.obj = obj;
	CORS(`https://www.youtube.com/results?search_query=${encodeURIComponent(obj.q)}&page=${obj.page}&sp=EgIQAQ%3D%3D&app=desktop`).then(LoadData);
}

GenerateResult = {
	video: (p,i)=>`<a href="/watch?v=${Results[p][i].ID}"><div id="res-p${p}-r${i}" class="card horizontal"><div class="card-image"><div class="bg"></div><span class="badge new"></span></div><div class="card-stacked"><div class="card-content"><span class="title"></span><p class="result-meta"><span class="user"></span><span class="views"></span><span class="ul"></span></p><p class="desc"></p></div></div></div></a>`
};

function LoadData(data){
	ytIDR = /<script[ ]{1,}>[ \r\n]{1,}window\["ytInitialData"\][ ]{1,}=[ ]{1,}(\{.+\});[ \r\n]{1,}window\["ytInitialPlayerResponse"\]/gi;
	reg = ytIDR.exec(data.body);
	Info = {alt:false};
	if (reg==null) return LoadDataAlt(data);
	if (reg.length===0) return LoadDataAlt(data);
	Info.ytInitialData = JSON.parse(reg[1]);
	//console.log(Info.ytInitialData);
	var temp;
	let i = Info.ytInitialData;
	
	// here we go
	temp = i.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
	
	var p = obj.page;
	Results[p] = [];
	for (var V = 0; V < temp.length; V++){
		var r = temp[V],
			r2 = {};
		if ('channelRenderer' in r) {
			r = r.channelRenderer;
			r2.type = 'channel';
			r2.Title = r.title.simpleText;
			if ('videoCountText' in r) r2.Uploads = parseInt(r.videoCountText.simpleText.replace(/\D/g,''));
			if ('subscriberCountText' in r) r2.Subs = parseInt(r.subscriberCountText.simpleText.replace(/\D/g,''));
			if ('subscriberCountText' in r) r2.Subs_Approx = r.subscribeButton.buttonRenderer.text.runs[1].text;
			r2.Link = '/channel?id='+r.channelId;
			if ('descriptionSnippet' in r && 'simpleText' in r.descriptionSnippet) {
				r2.Description = r.descriptionSnippet.simpleText;
			} else if ('descriptionSnippet' in r && 'simpleText' in r.descriptionSnippet){
				r2.Description = RunsToString(r.descriptionSnippet.runs);
			}
		} else if ('videoRenderer' in r) {
			r = r.videoRenderer;
			//console.log(r);
			if ('badges' in r && JSON.stringify(r.badges).indexOf('LIVE NOW')!==-1) continue;
			r2.type = 'video';
			r2.Title = r.title.simpleText;
			r2.By = r.shortBylineText.runs[0].text;
			r2.ID = r.videoId;
			r2.Link = '/watch?v='+r.videoId;
			r2.Duration = r.lengthText.simpleText;
			if ('publishedTimeText' in r )r2.Uploaded = r.publishedTimeText.simpleText;
			r2.Views = r.viewCountText.simpleText;
			r2.Views = parseInt(r2.Views.replace(/\D/g,''));
			r2.Views_Approx = r.shortViewCountText.simpleText;
			if ('descriptionSnippet' in r && 'simpleText' in r.descriptionSnippet) {
				r2.Description = r.descriptionSnippet.simpleText;
			} else if ('descriptionSnippet' in r && 'runs' in r.descriptionSnippet){
				r2.Description = RunsToString(r.descriptionSnippet.runs);
			}
			try {r2.RichThumb = r.richThumbnail.movingThumbnailRenderer.movingThumbnailDetails.thumbnails[r.richThumbnail.movingThumbnailRenderer.movingThumbnailDetails.thumbnails.length-1].url;}catch(e){}
		} else {
			console.log(r);
		}
		//console.log(r2);
		Results[p].push(r2);
	}
	return AddToPage();
}

function LoadDataAlt(data){
	console.log('oof');
}

function AddToPage(){
	if ($('#results-p'+obj.page).length===0) $('.search-results').append('<div id="results-p'+obj.page+'"></div>');
	var e = '#results-p'+obj.page;
	for (var R = 0; R < Results[obj.page].length; R++){
		var item = Results[obj.page][R];
		if (!(item.type in GenerateResult)) continue;
		$(e).append(GenerateResult[item.type](obj.page,R));
		var e2 = `#res-p${obj.page}-r${R}`;
		$(`${e2} .title`).text(item.Title);
		$(`${e2} .user`).text(item.By);
		$(`${e2} .views`).text(item.Views_Approx);
		$(`${e2} .ul`).text(item.Uploaded);
		$(`${e2} .desc`).html(item.Description);
		$(`${e2} .badge`).text(item.Duration);
		$(`${e2} .bg`).css('background-image',`url(https://img.youtube.com/vi/${item.ID}/hqdefault.jpg)`);
		
	}
	//$(e).append(AddRelatedVideo(N));
}



/* 
var body = await data.json(),
		body = body.contents;
		YT = new DOMParser().parseFromString(body, 'text/html'),
		$$ = (s) => jQuery(s, YT);
		$$('#results li ol[id*="item-section-"] li > div.yt-lockup-video').each(function(){
			var el = $$(this);
			if (el.find('.yt-badge-live').length!==0) return;
			var Result = {
				Meta: {
					Title: el.find('h3.yt-lockup-title span:first').text(),
					Uploaded_Ago: el.find('ul.yt-lockup-meta-info li:nth-child(1)').text(),
					Views: parseInt(el.find('ul.yt-lockup-meta-info li:nth-child(2)').text().replace(/ views/i,'').replace(/,/g, '')),
					Description: el.find('.yt-lockup-description').text(),
					Duration: el.find('.yt-thumb .video-time').text()
				},
				Author: {
					Name: el.find('div.yt-lockup-byline a').text(),
					ID: (el.find('div.yt-lockup-byline a').attr('href').includes('/channel/')===true) ? el.find('div.yt-lockup-byline a').attr('href').split('/channel/')[1]:null,
					Username: (el.find('div.yt-lockup-byline a').attr('href').includes('/user/')===true) ? el.find('div.yt-lockup-byline a').attr('href').split('/user/')[1]:null,
					Verified: (el.find('div.yt-lockup-byline span[title="Verified"]').length!==0) ? true:false
				},
				ID: /v=(.+)&?/.exec(el.find('h3.yt-lockup-title a').attr('href'))[1]
			};
			//console.log(el.find('h3.yt-lockup-title a').attr('href'));
			console.log(Result);
		});
*/