let PrefModal = `
<div id="leah-prefs" class="modal modal-fixed-footer">
	<a class="modal-close btn-flat" style="position:absolute;top:0;right:0;z-index:100;"><i class="fas fa-times"></i></a>
	<div class="modal-content row">
		<div class="col s12">
			<h4 class="center-align">Options</h4>
			<div class="divider"></div>
		</div>
		<div class="col s12 spacer"><h5>Display</h5></div>
		<!-- Dark Theme -->
		<div class="col s8">Enable Dark Theme</div>
		<div class="col s4"><div class="switch right"><label><input id="DarkTheme" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Related Videos -->
		<div class="col s8">Show Related Videos</div>
		<div class="col s4"><div class="switch right"><label><input id="RelatedVideos" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div> 
		
		
		<div class="col s12 spacer"><h5>Search</h5></div>
		<!-- AutoComplete -->
		<div class="col s8">Autocomplete</div>
		<div class="col s4"><div class="switch right"><label><input id="BarComplete" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Videos in Grid -->
		<div class="col s8">Show Results in a grid</div>
		<div class="col s4"><div class="switch right"><label><input id="GridLayout" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Auto Load Next Page -->
		<div class="col s8">Auto-load next page when scrolling</div>
		<div class="col s4"><div class="switch right"><label><input id="AutoNext" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		
		<div class="col s12 spacer"><h5>Playback</h5></div>
		<!-- Select Resolution -->
		<div style="min-height: 36px;line-height: 36px;" class="col s8">Default Video Quality</div>
		<div style="min-height: 36px;line-height: 36px;" class="col s4"><a id="PrefQualityBtn" class="vibrant dropdown-trigger btn right" href="#" data-target="PrefQuality">Highest</a></div>
		<ul id="PrefQuality" class="dropdown-content">
			<li><a qual="high" href="#!">Highest</a></li>
			<li><a qual="2160" href="#!">4K</a></li>
			<li><a qual="1440" href="#!">2K</a></li>
			<li><a qual="1080" href="#!">1080p</a></li>
			<li><a qual="720" href="#!">720p</a></li>
			<li><a qual="480" href="#!">480p</a></li>
			<li><a qual="360" href="#!">360p</a></li>
			<li><a qual="240" href="#!">240p</a></li>
			<li><a qual="144" href="#!">144p</a></li>
		</ul>
		<div class="col s12 spacer"></div>
		<!-- Video Autoplay -->
		<div class="col s8">Autoplay Video</div>
		<div class="col s4"><div class="switch right"><label><input id="AutoPlay" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Keyboard Controls -->
		<div class="col s8">Use Keyboard Controls</div>
		<div class="col s4"><div class="switch right"><label><input id="KeyboardControls" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Prefer AVC -->
		<div class="col s8">Prefer AVC Codec</div>
		<div class="col s4"><div class="switch right"><label><input id="PreferAVC" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Show Audio Changer 
		<div class="col s8">Show Audio Switch</div>
		<div class="col s4"><div class="switch right"><label><input id="AudioToggle" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div> -->
		
		<div class="col s12 spacer"><h5>Advanced</h5></div>
		<!-- Debug -->
		<div class="col s8">Show Debug Box</div>
		<div class="col s4"><div class="switch right"><label><input id="DebugBox" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		<!-- Remove Global Objects -->
		<div class="col s8">Keep temp Variables</div>
		<div class="col s4"><div class="switch right"><label><input id="TroubleshootVars" type="checkbox"><span class="lever"></span></label></div></div>
		<div class="col s12 spacer"></div>
		
		
		
	</div>
	<span style="position:absolute;bottom:1rem;left:25%;right:25%;z-index:100;text-align:center;">LeahTube v${version}</span>
</div>
`;
$('html').append(PrefModal);
PrefModal = M.Modal.init($('#leah-prefs')[0]);
let ErrModal = `
	<!-- Error Dialog -->
	<div class="modal modal-fixed-footer" id="error-modal">
		<div style="position:absolute;bottom:0;width:100%;z-index:100;">
		<a onclick="clipboard();" class="waves-effect waves-light btn"><i class="green circle fas fa-clipboard left"></i>Copy to Clipboard</a>
		<a target="_blank" class="waves-effect waves-light btn"><i class="green circle fas fa-camera left"></i>Screenshot</a>
		<p>You may close this dialog, but the page may not finish loading. Try to refresh.</p></div>
		<div class="modal-content">
			<a class="modal-close btn-flat" style="position:absolute;top:0;right:0;z-index:100;"><i class="fas fa-times"></i></a>
			<h1>:-(</h1>
			<h3>something happened,</h3>
			<h5>here are some details you can send out if needed:</h5>
			<div class="error-code-box"></div>
			<div class="error-trace"></div>
		</div>
	</div>
`;
$('html').append(ErrModal);
EB = M.Modal.init($('#error-modal')[0],{opacity:0.88,dismissible:false});

ResDropDown = M.Dropdown.init($('#PrefQualityBtn')[0], {closeOnClick: true, hover: true});
$('.tooltipped').tooltip();



// Dark Theme
$('#DarkTheme').on('change',function(){
	switch (this.checked){
		case true:
		Config.DarkTheme = true;
		$('html').addClass('dark');
		Save();
		break;
		case false:
		Config.DarkTheme = false;
		$('html').removeClass('dark');
		Save();
		break;
	}
});

// Enable Debug
$('#DebugBox').on('change',function(){
	Config.DebugBox = this.checked;
	Save();
});

// Enable Autoplay
$('#AutoPlay').on('change',function(){
	Config.AutoPlay = this.checked;
	Save();
});

// Switch to AVC Codec over VP9
$('#PreferAVC').on('change',function(){
	Config.PreferAVC = this.checked;
	Save();
});

// Show Related Videos
$('#RelatedVideos').on('change',function(){
	Config.RelatedVideos = this.checked;
	Save();
	if (Config.RelatedVideos===true) relatedVideos();
});

// Resolution Picker.
$('#PrefQuality li a').click(function(d){
	$('#PrefQualityBtn').text($(this).text());
	Config.PrefQuality = $(this).attr('qual');
	Save();
	ResDropDown.close();
});





// Main
let CheckBoxList = ['RelatedVideos', 'AutoPlay', 'PreferAVC', 'DarkTheme', 'DebugBox', 'AudioToggle'];
for (var B = 0; B < CheckBoxList.length; B++) { 
	let b = CheckBoxList[B];
	if (b in Config && Config[b]===true) {$('#'+b)[0].checked=true;}
}
$('#PrefQualityBtn').text($(`#PrefQuality li a[qual=${Config.PrefQuality}]`).text());

function RunsToString(Runs){
	var out = '';
	for (var m = 0; m < Runs.length; m++) {
		let str = Runs[m];
		if ('navigationEndpoint' in str){
			let ne = str.navigationEndpoint,
				ln = str.text;
			var lh, la = '';
			if ('watchEndpoint' in ne){
				lh = '/watch?v='+ne.watchEndpoint.videoId;
			} else if ('searchEndpoint' in ne) {
				lh = '/search?q='+ne.searchEndpoint.query;
			} else if ('urlEndpoint' in ne) {
				let link2 = new URLSearchParams(ne.urlEndpoint.url.replace(/^\//,'')),
				link3 = link2.get('q');
				lh = (link3===null) ? ne.urlEndpoint.url:link3,
				la = ' target="_blank"';
			} else {
				console.log(ne);
			}
			out += `<a href="${lh}"${la}>${ln}</a>`;
		} else if ('simpleText' in str) {
			out += str.simpleText;
		} else {
			if ('bold' in str) {
				str.text = '<b>'+str.text+'</b>';
			}
			out += str.text.replace(/\n/g,'<br>');
		}
	}
	return out;
}