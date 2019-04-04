window.onerror = HandleError;
//window.addEventListener('error',HandleError);
window.addEventListener('unhandledrejection',HandleError);
jQuery.readyException = HandleError;
err = {};

function HandleError(err) {
	if (err.preventDefault) err.preventDefault();
	var code,msg,trace, d = new Date();
	if (err['error']) err = err.error;
	window.err = err;
	
    //console.error(`Error Object:`,err);
	code = (err.code) ? err.code:'JS0';
	if ($('#error-modal .error-code-box').length!==0) $('#error-modal .error-code-box').html(`<span class="red-text">Error Code:</span> <b class="red-text text-accent-4">${code}</b><br>`);
	err.clip = '```\nLeahTube v'+version+' Error!\nOccurred at '+d.toLocaleString('en-GB',{month: 'short',year: 'numeric',day: '2-digit',hour: '2-digit',minute: '2-digit',second: '2-digit',hourCycle:'h24',timeZoneName:'short'})+'\n\nURL: '+window.location.href+'\n\nError Code: '+code+'\n';
	if (err.message||err.reason) {
		msg = (err.message||err.reason.message);
		if (err.reason && err.reason.stack) err.stack = err.reason.stack;
		$('#error-modal .error-code-box').append(`<span class="orange-text">Message:</span> <b class="orange-text orange-accent-4">${msg}</b><br>`);
		err.clip +=`Error Message: ${msg}\n\n`;
	}
	if (err.stack) {
		console.log(err.stack);
		$('#error-modal .error-trace').html(err.stack.replace(new RegExp(': '+msg+'\n','gmi'),'').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\r?\n/g,'<br>'))
		err.clip +=`Stack Trace is Below:\n${trace.replace(/</g,'&lt;').replace(/>/g,'&gt;')}`;
	}
	err.clip += '\n\n\n```';
	EB.open();
};

function clipboard(){
	$('#error-modal').append(`<textarea>${err.clip}</textarea>`);
	var copyText = $('#error-modal textarea')[0];
	copyText.select();
	document.execCommand("copy");
	str = 'Error has been copied';
	if (M) {M.toast({html: str})} else {alert(str);}
	$('#error-modal textarea').remove();
}