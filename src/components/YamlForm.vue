<script setup lang="ts">
import { ref, provide, markRaw, onMounted } from 'vue'

import { defaultStyles, extendedVuetifyRenderers } from '@jsonforms/vue-vuetify'

import { JsonForms } from '@jsonforms/vue'
import type { JsonFormsChangeEvent } from '@jsonforms/vue'

import $RefParser from '@apidevtools/json-schema-ref-parser'

const renderers = Object.freeze(
  markRaw([
    ...extendedVuetifyRenderers,
    // here you can add custom renderers
  ]),
)

const schema = ref<null | Object>(null)

// needs to run early to avoid errors with ajv
const GetSchema = async () => {
  // does not work yet, needs Svgdigitizer defininition toplevel
  // schema.value = await $RefParser.bundle(
  //   'https://raw.githubusercontent.com/linuxrider/metadata-schema/draft-test/schemas/svgdigitizer.json',
  //   {
  //     dereference: { circular: false },
  //     // basepath: '/schemas',
  //   },
  // )
  // console.log(JSON.stringify(schema.value))
  await fetch('dereferenced-schema.json').then((response) => {
    response.json().then((json) => {
      // modify schema
      // add current date as default for curation
      json.properties.curation.properties.process.items.properties.date.default = new Date()
        .toISOString()
        .split('T')[0]
      json.properties.curation.properties.process.items.properties.role.default = 'curator'
      schema.value = json
      console.log(json)
      // console.log(JSON.stringify(schema.value))
    })
  })
}

GetSchema()

const uischema = {
  type: 'Categorization',
  elements: [
    {
      label: 'Curation',
      type: 'Category',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Controls',
              scope: '#/properties/curation/properties/process',
            },
          ],
        },
      ],
    },
    {
      label: 'Experimental',
      type: 'Category',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Controls',
              scope: '#/properties/experimental/properties/instrumentation',
            },
          ],
        },
      ],
    },
    {
      label: 'System',
      type: 'Category',
      elements: [
        {
          type: 'Categorization',
          elements: [
            {
              type: 'Category',
              label: 'Electrodes',
              elements: [
                {
                  type: 'Controls',
                  scope: '#/properties/system/properties/electrodes',
                },
              ],
            },
            {
              type: 'Category',
              label: 'Electrolyte',
              elements: [
                {
                  type: 'Controls',
                  scope: '#/properties/system/properties/electrolyte/properties/type',
                },
                {
                  type: 'Controls',
                  scope: '#/properties/system/properties/electrolyte/properties/components',
                },
              ],
            },
            {
              type: 'Category',
              label: 'Electrochemical Cell',
              elements: [
                {
                  type: 'Controls',
                  scope: '#/properties/system/properties/electrochemicalCell',
                },
              ],
            },
            {
              type: 'Category',
              label: 'Atmosphere',
              elements: [
                {
                  type: 'Controls',
                  scope: '#/properties/system/properties/atmosphere/properties/components',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const data = ref({})

onMounted(async () => {
  data.value = {}
})

const onChange = (event: JsonFormsChangeEvent) => {
  data.value = event.data
}

// mergeStyles combines all classes from both styles definitions into one
// const myStyles = mergeStyles(defaultStyles, { control: { label: 'mylabel' } })

// Provide styles to child components
provide('styles', defaultStyles)
</script>

<template>
  <div v-if="schema">
    <div class="myform">
      <json-forms
        :data="data"
        :renderers="renderers"
        :schema="schema"
        :uischema="uischema"
        @change="onChange"
      />
    </div>
    <pre>{{ data }}</pre>
  </div>
</template>

<style>
@import '@jsonforms/vue-vuetify/lib/jsonforms-vue-vuetify.css';
pre {
  background: lightcyan;
  padding: 10px;
  text-align: left;
  width: 100%;
}
</style>
