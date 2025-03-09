/* globals seConfirm */
/**
 * @file ext-svgdigitizer.js
 * adapted from ext-opensave.js (@copyright 2020 OptimistikSAS) extension
 *
 *
 */

/**
 * @type {module:svgcanvas.EventHandler}
 * @param {external:Window} wind
 * @param {module:svgcanvas.SvgCanvas#event:saved} svg The SVG source
 * @listens module:svgcanvas.SvgCanvas#event:saved
 * @returns {void}
 */
import { fileOpen, fileSave } from 'browser-fs-access'
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.27.3/full/pyodide.mjs'
import { usePdfStore } from '@/stores/pdf'
import { usePublishStore } from '@/stores/publish'

const name = 'svgdigitizer'
let handle = null

const loadExtensionTranslation = async function (svgEditor) {
  let translationModule
  const lang = svgEditor.configObj.pref('lang')
  try {
    translationModule = await import(`./locale/${lang}.js`)
  } catch (_error) {
    console.warn(`Missing translation (${lang}) for ${name} - using 'en'`)
    translationModule = await import('./locale/en.js')
  }
  svgEditor.i18next.addResourceBundle(lang, 'translation', translationModule.default, true, true)
}

export default {
  name,
  async init(_S) {
    const publishStore = usePublishStore()
    const pdfStore = usePdfStore()
    let pyodide = await loadPyodide()
    await pyodide.loadPackage('micropip')
    await pyodide.loadPackage('click')
    await pyodide.loadPackage('pillow')
    await pyodide.loadPackage('svgwrite')
    await pyodide.loadPackage('/svgdigitizer-0.12.5-py3-none-any.whl')
    await pyodide.loadPackage('/pymupdf-1.25.3-cp312-abi3-pyodide_2024_0_wasm32.whl')

    await pyodide.runPython(`
      from importlib import resources
      import pymupdf
      from svgdigitizer.entrypoint import _create_svg
      pdf = ""
      svg = ""
    `)

    const svgEditor = this
    const { svgCanvas } = svgEditor
    const { $id, $click } = svgCanvas
    await loadExtensionTranslation(svgEditor)
    /**
     * @param {Event} e
     * @returns {void}
     */

    /**
     *
     *
     *
     * @returns {void}
     */
    const clickSvgdigitizerOpen = async function () {
      const pdfStore = usePdfStore()
      // ask user before clearing an unsaved SVG
      const response = await svgEditor.openPrep()
      if (response === 'Cancel') {
        return
      }
      svgCanvas.clear()
      try {
        const pdfBlob = await fileOpen({
          mimeTypes: ['application/pdf'],
        })
        // copy pdf to pyodide
        const pdfContent = new Uint8Array(await pdfBlob.arrayBuffer())
        pdfStore.toggleOverlay(true)
        pdfStore.setPdfContent(pdfContent)
        pyodide.globals.set('pdf', pdfBlob.name)
        await pyodide.FS.writeFile(pdfBlob.name, pdfContent)
      } catch (err) {
        if (err.name !== 'AbortError') {
          return console.error(err)
        }
      }
    }

    /**
     *  Second stage of loading a pdf. Loads a generated svg with embedded png of pdf page.
     *
     *
     * @returns {void}
     */
    const loadPage = async function () {
      pyodide.globals.set('page_num', pdfStore.pageNum)

      // generate png + svg files
      await pyodide.runPython(`
              doc = pymupdf.open(pdf)
              base = ".".join(pdf.split(".")[:-1])
              page = doc.load_page(page_num)
              pix = page.get_pixmap(dpi=600)
              png = f"{base}_p{page_num}.png"
              pix.save(png)
              svg = f"{base}_p{page_num}.svg"
              _create_svg(svg, png, False, False)
          `)
      // get back file from pyodide
      const svg = pyodide.globals.get('svg')
      const svgBlob = await new Blob([pyodide.FS.readFile(svg, { encoding: 'utf8' })], {
        type: 'image/svg',
      })
      const identifier = svg.replace('.svg', '')

      publishStore.setIdentifier(identifier)

      const svgContent = await svgBlob.text()
      await svgEditor.loadSvgString(svgContent)
      svgEditor.updateCanvas()

      svgEditor.bottomPanel.changeZoom('content')
      // file system handle? necessary?
      handle = svgBlob.handle
      svgEditor.topPanel.updateTitle(svg)
      svgEditor.svgCanvas.runExtensions('onOpenedDocument', {
        name: svg,
        lastModified: svgBlob.lastModified,
        size: svgBlob.size,
        type: svgBlob.type,
      })
      svgEditor.layersPanel.populateLayers()
    }

    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
      const byteCharacters = atob(b64Data)
      const byteArrays = []
      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }
      const blob = new Blob(byteArrays, { type: contentType })
      return blob
    }

    /**
     *
     * @returns {void}
     */
    const clickSvgdigitizerSave = async function (type) {
      const $editorDialog = $id('se-svg-editor-dialog')
      const editingsource = $editorDialog.getAttribute('dialog') === 'open'

      if (editingsource) {
        svgEditor.saveSourceEditor()
      } else {
        // In the future, more options can be provided here
        const saveOpts = {
          images: svgEditor.configObj.pref('img_save'),
          round_digits: 2,
        }
        // remove the selected outline before serializing
        svgCanvas.clearSelection()
        // Update save options if provided
        if (saveOpts) {
          const saveOptions = svgCanvas.mergeDeep(svgCanvas.getSvgOption(), saveOpts)
          for (const [key, value] of Object.entries(saveOptions)) {
            svgCanvas.setSvgOption(key, value)
          }
        }
        svgCanvas.setSvgOption('apply', true)
        // dirty hack to remove embedded pdf page image for publishing
        const svgString = svgCanvas
          .svgCanvasToString()
          .replace(/xlink:href="\S+"/, 'xlink:href="' + svgEditor.title.replace('svg', 'png') + '"')
        // no need for doctype, see https://jwatt.org/svg/authoring/#doctype-declaration
        const svg = '<?xml version="1.0"?>\n' + svgString
        const b64Data = svgCanvas.encode64(svg)
        const blob = b64toBlob(b64Data, 'image/svg+xml')
        publishStore.setSvgContent(svg)
        try {
          if (type === 'save' && handle !== null) {
            const throwIfExistingHandleNotGood = false
            handle = await fileSave(
              blob,
              {
                fileName: 'untitled.svg',
                extensions: ['.svg'],
              },
              handle,
              throwIfExistingHandleNotGood,
            )
          } else {
            handle = await fileSave(blob, {
              fileName: svgEditor.title,
              extensions: ['.svg'],
            })
          }
          svgEditor.topPanel.updateTitle(handle.name)
          // svgCanvas.runExtensions('onSavedDocument', {
          //   name: handle.name,
          //   kind: handle.kind
          // })
        } catch (err) {
          if (err.name !== 'AbortError') {
            return console.error(err)
          }
        }
      }
    }
    /**
     * Publishes the
     *
     *
     * @returns {void}
     */
    const clickSvgdigitizerPublish = async function () {
      const $editorDialog = $id('se-svg-editor-dialog')
      const editingsource = $editorDialog.getAttribute('dialog') === 'open'

      if (editingsource) {
        svgEditor.saveSourceEditor()
      } else {
        // In the future, more options can be provided here
        const saveOpts = {
          images: svgEditor.configObj.pref('img_save'),
          round_digits: 2,
        }
        // remove the selected outline before serializing
        svgCanvas.clearSelection()
        // Update save options if provided
        if (saveOpts) {
          const saveOptions = svgCanvas.mergeDeep(svgCanvas.getSvgOption(), saveOpts)
          for (const [key, value] of Object.entries(saveOptions)) {
            svgCanvas.setSvgOption(key, value)
          }
        }
        svgCanvas.setSvgOption('apply', true)
        // dirty hack to remove embedded pdf page image for publishing
        const svgString = svgCanvas
          .svgCanvasToString()
          .replace(/xlink:href="\S+"/, 'xlink:href="' + svgEditor.title.replace('svg', 'png') + '"')
        // no need for doctype, see https://jwatt.org/svg/authoring/#doctype-declaration
        const svg = '<?xml version="1.0"?>\n' + svgString

        publishStore.setSvgContent(svg)
        publishStore.toggleOverlay(true)
      }
    }

    return {
      name: svgEditor.i18next.t(`${name}:name`),
      // The callback should be used to load the DOM with the appropriate UI items
      callback() {
        const svgdigitizerOpenButtonTemplate =
          '<se-menu-item id="tool_svgdigitizer_open_pdf" label="svgdigitizer.import_pdf" src="open.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), svgdigitizerOpenButtonTemplate, 0)
        const svgdigitizerSaveButtonTemplate =
          '<se-menu-item id="tool_svgdigitizer_save_digitization" label="svgdigitizer.save_digitization" shortcut="S" src="saveImg.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), svgdigitizerSaveButtonTemplate, 1)
        const svgdigitizerPublishButtonTemplate =
          '<se-menu-item id="tool_svgdigitizer_publish" label="svgdigitizer.publish" shortcut="S" src="export.svg"></se-menu-item>'
        svgCanvas.insertChildAtIndex($id('main_button'), svgdigitizerPublishButtonTemplate, 2)
        // handler
        $click($id('tool_svgdigitizer_open_pdf'), clickSvgdigitizerOpen.bind(this))
        $click($id('tool_svgdigitizer_save_digitization'), clickSvgdigitizerSave.bind(this))
        $click($id('tool_svgdigitizer_publish'), clickSvgdigitizerPublish.bind(this))
      },
      loadPage,
    }
  },
}
