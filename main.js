import App from './App'
import {enforceWechatBinding} from './services/wechat-binding'
import {displayDateTime,displayPaymentMethod} from './utils/display.mjs'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
Vue.mixin({onShow(){enforceWechatBinding()},methods:{displayDateTime,displayPaymentMethod}})
App.mpType = 'app'
const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
export function createApp() {
	const app = createSSRApp(App)
	app.mixin({onShow(){enforceWechatBinding()},methods:{displayDateTime,displayPaymentMethod}})
	return {
		app
	}
}
// #endif
