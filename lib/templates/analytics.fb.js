export default function start(debug) {
	function log(){
	if(!debug)return;
	var args = Array.prototype.slice.call(arguments);
	args.unshift('Analytics:fb:');
	console.log.apply(this,args);
}

	const pageId = process.env.ANALYTICS_FB_PAGE_ID;
	const appId = process.env.ANALYTICS_FB_APP_ID;
	if (!pageId || !appId) {
		throw new Error('ANALYTICS_FB_PAGE_ID and ANALYTICS_FB_APP_ID required');
	}

	log('Using pageId',pageId,'appId',appId)
	var div;
	if (!document.querySelector('.fb-customerchat')) {
		div = document.createElement('div');
		div.setAttribute('attribution', 'setup_tool');
		div.setAttribute('page_id', 172735413543583);
		div.setAttribute('theme_color', '#fa3c4c');
		let div = document.createElement('div');
	}
	if (!document.querySelector('#fb-root')) {
		div = document.createElement('div');
		div.id = 'fb-root';
		document.body.appendChild(div);
	}


	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		js = d.createElement(s);
		js.id = id;
		js.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.12&autoLogAppEvents=1';
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));

	window.fbAsyncInit = function() {
		FB.init({
			appId: appId,
			autoLogAppEvents: true,
			xfbml: true,
			version: 'v2.12'
		});
	};

	div = document.createElement('img');
	div.height = '1';
	div.width = '1';
	div.style.display = "none"
	div.src = "https://www.facebook.com/tr?id=1958620154410063&ev=PageView&noscript=1"
	document.body.appendChild(div);

	! function(f, b, e, v, n, t, s) {
		if (f.fbq) return;
		n = f.fbq = function() {
			n.callMethod ?
				n.callMethod.apply(n, arguments) : n.queue.push(arguments)
		};
		if (!f._fbq) f._fbq = n;
		n.push = n;
		n.loaded = !0;
		n.version = '2.0';
		n.queue = [];
		t = b.createElement(e);
		t.async = !0;
		t.src = v;
		s = b.getElementsByTagName(e)[0];
		s.parentNode.insertBefore(t, s)
	}(window, document, 'script',
		'https://connect.facebook.net/en_US/fbevents.js');
	fbq('init', appId);



}