DefaultPrefs = {
	DarkTheme: false,
	RelatedVideos: true,
	DebugBox: false,
	PrefQuality: '720',
	server: 'corsanywhere',
	AutoPlay: false,
	PreferAVC: false,
	AudioToggle: false,
	DownloadDialog: false,
	BarComplete: true,
	GridLayout: false,
	AutoNext: false,
	TroubleshootVars: false
};

var Config, version = '3.1.0';
if (typeof localStorage.LeahTube==='undefined') {
	Config = JSON.parse(JSON.stringify(DefaultPrefs));
} else {
	Config = {...JSON.parse(JSON.stringify(DefaultPrefs)), ...JSON.parse(localStorage.LeahTube)};
}

Save = () => localStorage.LeahTube = JSON.stringify(Config);
if (Config.DarkTheme && Config.DarkTheme===true) {$('html').addClass('dark');}
if (Config.AudioToggle && Config.AudioToggle===true) {$('.audio-btn').fadeIn();};
//if (Config.DownloadDialog && Config.DownloadDialog===true) {$('.audio-btn').fadeIn();};

function CORS(url){
	var serv, body_key, res, res2, json=false, spit = {}, opt = {headers: new Headers({'Origin':'null'})};
	switch(Config.server){
		case 'allorigins':
		serv = 'https://api.allorigins.win/get?url='+encodeURIComponent(url),
		json = true,
		body_key = 'contents';
		break;
		
		/*case 'archive':
		let d = new Date(),
			st = d.getFullYear()+('0'+(d.getMonth()+ 1)).slice(-2)+('0'+d.getDate()).slice(-2)+('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2)+('0'+d.getSeconds()).slice(-2)
		serv = 'http://web.archive.org/web/'+st+'/'+url;
		break;*/
		
		case 'corsio':
		serv = 'https://cors.io/?'+url;
		break;		
		
		case 'corsanywhere':
		serv = 'https://cors-anywhere.herokuapp.com/'+url;
		break;
		
		case 'crossorigin':
		serv = 'https://crossorigin.me/'+url;
		break;
		
		case 'scrappy':
		serv = 'https://scrappy-php.herokuapp.com/?type=plain&ua='+encodeURIComponent(navigator.userAgent)+'&url='+encodeURIComponent(url);
		break;		
	}
	if (typeof serv==='undefined') throw {code: 'JS1', message: 'Scrape Server not defined! Please change in settings.'}
	console.log(serv);
	return new Promise(function(resolve, reject){
		return fetch(serv,opt).then(function(res){
			spit = {...res};
			if (json===true) return res.json();
			return res.text();
		}).then(function(res2){
			if (json===true) {
				spit.body = res2[body_key];
			} else {
				spit.body = res2;
			}
			resolve(spit);
		}).catch(function(res){
			reject(res);
		});
	});
	
}