import Vue from 'vue';
import _ from 'lodash';

export default async function({
	app,
	route
}, inject) {


	const config = <%= serialize(options) %>
	Vue.use(AnalyticsPlugin, Object.assign(config, {
		debug: config.debug || process.env.NODE_ENV !== 'production'
	}))


	app.router.afterEach((to, from) => {
		if (state.options.ga !== false && window.ga) {
			ga('set', 'page', to.fullPath)
			ga('send', 'pageview')
		}
		if (state.fb !== false && window.FB) {
			FB.AppEvents.setUserID(state.userId);
			FB.AppEvents.logPageView();
		}
		callMixinMethod(state.scope, state.options.mixins, 'trackEvent', [to.fullPath, to, true]);
	});

}



var state = {
	userId: '',
	options: {}
}

function log() {
	if (!state.options.debug) return;
	var args = Array.prototype.slice.call(arguments);
	args.unshift('Analytics:');
	console.log.apply(this, args);
}

var AnalyticsPlugin = {}
AnalyticsPlugin.install = function(Vue, options = {
	debug: process.env.NODE_ENV !== 'production'
}) {
	state.options = options;
	if (options.fb !== false) {
		log('initializing fb')
		facebook(state.options.debug)
		if (process.env.ANALYTICS_APP_VERSION) {
			FB.AppEvents.setAppVersion(process.env.ANALYTICS_APP_VERSION);
		}
	} 
	log('ga options', !!options.ga && options.ga.debug === true);
	if (options.ga !== false) {
		google(!!options.ga && options.ga.debug === true)
	} else {
		if (options.ga && options.ga.disableLocalhost && location.hostname == 'localhost') {
			log('ga disable sendHit')
			ga('set', 'sendHitTask', null);
		}
	}

	var scope = state.scope = Vue.prototype.$analytics = {
		trackEvent: (params, a, l, v) => {
			if (!params) {
				throw new Error('trackEvent: string of object required')
			}
			if (typeof params === 'string') {
				let action = typeof a == 'string' ? a : params;
				let label = typeof l == 'string' ? l : '';
				let value = typeof v == 'number' ? v : 0;
				let category = (action && label) ? params : 'default'
				params = {
					category: category,
					action: action,
					label: label,
					value: value
				};
			}

			log('trackEvent', params)

			if (options.ga !== false) {
				let payload = {
					hitType: 'event',
					eventCategory: params.category,
					eventAction: params.action || '',
					eventLabel: params.label || '',
					eventValue: params.value || 0,
					fieldsObject: params.fieldsObject || {}
				};
				log('trackEvent goggle ', payload);
				ga('send', payload);
			}
			if (options.fa !== false) {
				var fbParams = {};
				let paramsAsString = params.category + (params.action ? '_' + params.action : '') + (params.label ? '_' + params.label : '');
				fbParams[FB.AppEvents.ParameterNames.LEVEL] = paramsAsString;
				if (params.description) {
					fbParams[FB.AppEvents.ParameterNames.DESCRIPTION] = params.description;
				}
				log('trackEvent facebook ACHIEVED_LEVEL LEVEL', paramsAsString);
				FB.AppEvents.logEvent(
					FB.AppEvents.EventNames.ACHIEVED_LEVEL,
					null, // numeric value for this event - in this case, none
					fbParams
				);
			}
			callMixinMethod(scope, options.mixins, 'trackEvent', [params, a, l, v]);
		},
		setUserId: (id) => {
			log('setUserId', id)
			if (id) {
				state.userId = id;
				if (options.ga !== false) {
					ga('set', 'userId', id);
					log('setUserID:ga', id)
				}
				if (options.fb !== false) {

					FB.AppEvents.setUserID(state.userId);
					log('setUserID:fb', id)
				}

			} else {
				if (options.fb !== false) {
					FB.AppEvents.clearUserID()
					log('setUserId:fb:clear (id was null/undefined/empty)')
				}
			}
			callMixinMethod(scope, options.mixins, 'setUserId', [id]);
		},
		setUserProps: (props, pick) => {
			log('setUserProps', props)
			if (props._id) {
				scope.setUserId(props._id)
				delete props._id;
			}
			if (pick) {
				props = _.pick(props, pick);
			}
			if (options.fb !== false) {
				FB.AppEvents.updateUserProperties(normalizeFacebookUserProperties(props), (res) => {
					console.log('Analytics: Facebook set user props ', res);
				});
			}
			callMixinMethod(scope, options.mixins, 'setUserProps', [props]);
		}
	};
}

function callMixinMethod(scope, mixins, method, params) {
	if (!mixins) return;
	if (mixins) {
		for (var x in mixins) {
			if (mixins[x][method]) {
				log(method + ':' + x, props);
				[x][method].apply(scope, params);
			}
		}
	}
}



function normalizeFacebookUserProperties(props) {
	let res = Object.assign({}, props);
	for (var key in res) {
		if (['city', 'country', 'zipCode', 'user_type'].includes(key)) {
			delete res[key];
			res['$' + key] = props[key];
		}
	}
	if (props.role) {
		props.$user_type = props.role;
		delete props.role;
	}
	return res;
}


function facebook(debug) {
	function log() {
		if (!debug) return;
		var args = Array.prototype.slice.call(arguments);
		args.unshift('Analytics:fb:');
		console.log.apply(this, args);
	}

	const pageId = process.env.ANALYTICS_FB_PAGE_ID;
	const appId = process.env.ANALYTICS_FB_APP_ID;
	if (!pageId || !appId) {
		throw new Error('ANALYTICS_FB_PAGE_ID and ANALYTICS_FB_APP_ID required');
	}

	log('Using pageId', pageId, 'appId', appId)
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


function google(debug) {
	if (!process.env.ANALYTICS_GA_UA_ID) {
		throw new Error('ANALYTICS_GA_UA_ID required');
	}
	if (debug) {
		console.log('Analytics:', 'DEBUG MODE')
			(function(i, s, o, g, r, a, m) {
				i['GoogleAnalyticsObject'] = r;
				i[r] = i[r] || function() {
					(i[r].q = i[r].q || []).push(arguments)
				}, i[r].l = 1 * new Date();
				a = s.createElement(o),
					m = s.getElementsByTagName(o)[0];
				a.async = 1;
				a.src = g;
				m.parentNode.insertBefore(a, m)
			})(window, document, 'script', 'https://www.google-analytics.com/analytics_debug.js', 'ga');
		window.ga_debug = {
			trace: true
		};
	} else {

		(function(i, s, o, g, r, a, m) {
			i['GoogleAnalyticsObject'] = r;
			i[r] = i[r] || function() {
				(i[r].q = i[r].q || []).push(arguments)
			}, i[r].l = 1 * new Date();
			a = s.createElement(o),
				m = s.getElementsByTagName(o)[0];
			a.async = 1;
			a.src = g;
			m.parentNode.insertBefore(a, m)
		})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
	}
	ga('create', process.env.ANALYTICS_GA_UA_ID, 'auto');



}