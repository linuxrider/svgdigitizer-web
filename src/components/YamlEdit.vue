<template>
  <div class="container">
    <div ref="editorContainer" class="editor"></div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

import { basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { EditorView, gutter, keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'

import { lintGutter } from '@codemirror/lint'
import { yaml } from '@codemirror/lang-yaml'
import { yamlSchema } from 'codemirror-json-schema/yaml'
import { load as yamlLoad, dump as yamlDump } from 'js-yaml'
import { usePublishStore } from '@/stores/publish'

import $RefParser from '@apidevtools/json-schema-ref-parser'
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

export default {
  name: 'YamlEditor',
  setup() {
    const publishStore = usePublishStore()
    const editorContainer = ref(null)
    const errors = ref([])
    let editorView = null

    const initializeEditor = (schema) => {
      const state = EditorState.create({
        doc: '',
        extensions: [
          EditorView.lineWrapping,
          EditorView.updateListener.of((v) => {
            if (v.docChanged) {
              publishStore.setYamlContent(v.state.doc.toString())
            }
          }),
          gutter({ class: 'CodeMirror-lint-markers' }),
          lintGutter(),
          basicSetup,
          yaml(),
          yamlSchema(schema),
          keymap.of([indentWithTab]),
        ],
      })

      editorView = new EditorView({
        state,
        parent: editorContainer.value,
      })
      console.log(editorContainer.value.offsetWidth)
      // editorView.setSize(editorContainer.value.offsetWidth + 'px', 'auto')
      populateTemplate()
    }

    const populateTemplate = async () => {
      const response = await await fetch('/template.yaml')
      const yaml = await response.text()

      const curator = JSON.parse(localStorage.getItem('curator'))

      try {
        const doc = yamlLoad(yaml, 'utf8')

        for (const key in curator) {
          doc.curation.process[0][key] = curator[key]
        }
        doc.curation.process[0]['date'] = new Date().toISOString().substring(0, 10)

        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: yamlDump(doc, 'utf8') },
        })
      } catch (e) {
        console.log(e)
      }
    }

    onMounted(async () => {
      const schema = await $RefParser.dereference(
        'https://raw.githubusercontent.com/echemdb/metadata-schema/main/schemas/svgdigitizer.json',
        {
          dereference: { circular: false },
          // basepath: '/schemas',
        },
      )
      initializeEditor(schema)
    })

    return {
      editorContainer,
      errors,
    }
  },
}
</script>

<style scoped>
.container {
  display: flex;
}
.editor {
  border: 1px solid #ccc;
  height: 65vh;
  /* max-width: 98%; */
  width: 98%;
  margin-bottom: 20px;
  overflow-y: scroll;
}
/* .CodeMirror {
  width: 100% !important;
  max-width: 600px;
  white-space: pre;
} */
.error-list {
  margin-top: 10px;
  color: red;
  font-family: Arial, sans-serif;
}

.error-item {
  font-size: 14px;
  margin-bottom: 5px;
}

.cm-lint-gutter {
  background-color: rgba(255, 0, 0, 0.2);
  width: 20px;
}

.cm-lint-error {
  background-color: red;
  height: 4px;
  width: 100%;
  margin: 2px;
}
.cm-editor {
  max-height: 10px;
}
</style>
