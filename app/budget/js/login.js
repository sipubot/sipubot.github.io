var SipuMain = (function(SipuMain, $, undefined) {
	function sha() {
		document.getElementById("password").value = CryptoJS.SHA3(document
				.getElementById("password-temp").value, {
			outputLength : 256
		});
		document.getElementById("password-temp").value = "";
		ajax();
	}

	function ajax() {
		$.ajax({
			url : "Login",
			type : "POST",
			dataType : "xml",
			dataType : "xml",
			contentType : 'text/plain',
			mimeType : 'text/plain',
			data : {
				ID : document.getElementById("id").value,
				PA : document.getElementById("password").value
			},
			scriptCharset : "utf-8"
		});

	}
	SipuMain.run = function() {
		$(".submit").click(function() {
			sha();
		});
	};
	return SipuMain;
})(window.SipuMain || {}, jQuery);
SipuMain.run();
