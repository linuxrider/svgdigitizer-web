<script setup lang="ts">
import { ref } from 'vue'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'

import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

import SvgEditor from './components/SvgEditor.vue'
import PdfViewer from './components/PdfViewer.vue'
import YamlEditor from './components/YamlEdit.vue'
import YamlForm from './components/YamlForm.vue'
import BibEditor from './components/BibEdit.vue'
import PublishPr from './components/PublishPr.vue'

import { usePdfStore } from '@/stores/pdf'
import { usePublishStore } from '@/stores/publish'

import { useSessionStore } from '@/stores/session'
const pdfStore = usePdfStore()
const publishStore = usePublishStore()
const sessionStore = useSessionStore()

sessionStore.loadSessions()
</script>

<template>
  <Splitter style="height: 100%" class="mb-8">
    <SplitterPanel class="flex items-center justify-center">
      <Tabs value="0" orientation="horizontal">
        <TabList>
          <Tab value="0">SVG</Tab>
          <Tab value="1">PDF</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <SvgEditor />
          </TabPanel>
          <TabPanel value="1">
            <p class="m-0">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Consectetur, adipisci velit, sed quia non numquam eius
              modi.
            </p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SplitterPanel>
    <SplitterPanel style="height: 100%" class="flex items-center justify-center">
      <Tabs value="1" orientation="horizontal">
        <TabList>
          <Tab value="0">Editor</Tab>
          <Tab value="1">Form</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <Splitter style="height: 100%" layout="vertical">
              <SplitterPanel class="flex items-center justify-center" :size="80">
                <YamlEditor />
              </SplitterPanel>
              <SplitterPanel class="flex items-center justify-center" :size="20">
                <BibEditor />
              </SplitterPanel>
            </Splitter>
          </TabPanel>
          <TabPanel value="1"> <YamlForm /></TabPanel>
        </TabPanels>
      </Tabs>
    </SplitterPanel>
  </Splitter>
  <div v-if="pdfStore.overlayActive" class="overlay-custom">
    <PdfViewer />
  </div>
  <div v-if="publishStore.overlayActive" class="overlay-custom">
    <PublishPr />
  </div>
</template>

<style scoped>
/* .overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgb(255, 255, 255);
  z-index: 1000;
} */
/* .overlay-custom {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.931);
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  z-index: 10;
} */
/* header {
  line-height: 1.5;
  max-height: 100vh;
} */

/* .logo {
  display: block;
  margin: 0 auto 2rem;
} */

/* nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
} */

/* nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
} */
</style>
