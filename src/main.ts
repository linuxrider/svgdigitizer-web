import './assets/main.css'
import '@fortawesome/fontawesome-free/css/all.css'
// import '@jsonforms/vue-vanilla/vanilla.css';
import 'vuetify/styles'
import { fa, aliases as faAliases } from 'vuetify/iconsets/fa'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { faIconAliases } from '@jsonforms/vue-vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'fa',
    sets: {
      fa,
    },
    aliases: { ...faAliases, ...faIconAliases },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
