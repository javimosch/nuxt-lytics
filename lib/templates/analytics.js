import Vue from 'vue';
import _ from 'lodash';
/* MOVE TO MODULE */
import facebook from './analytics.fb'
import google from './analytics.ga'



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
	} else {
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
			callMixinMethod(scope,options.mixins,'trackEvent',[id]);
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
			callMixinMethod(scope,options.mixins,'setUserId',[id]);
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
			callMixinMethod(scope,options.mixins,'setUserProps',[props]);
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

Vue.use(AnalyticsPlugin, {
	debug: process.env.NODE_ENV !== 'production'
})

export default ({
	app,
	route
}, inject) => {
	app.router.afterEach((to, from) => {
		if (state.options.ga !== false && window.ga) {
			ga('set', 'page', to.fullPath)
			ga('send', 'pageview')
		}
		if (state.fb !== false && window.FB) {
			FB.AppEvents.setUserID(state.userId);
			FB.AppEvents.logPageView();
		}
		callMixinMethod(state.scope,state.options.mixins,'trackEvent',[to.fullPath,to,true]);
	});
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