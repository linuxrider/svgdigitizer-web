<script setup>
import { onMounted, ref } from 'vue'
import { usePublishStore } from '@/stores/publish'
import { load as yamlLoad, dump as yamlDump } from 'js-yaml'

const publishStore = usePublishStore()
const commitMessage = ref('')
const identifier = ref(publishStore.identifier)
const yamlFileContent = ref(publishStore.yamlContent)
const bibtexFileContent = ref(publishStore.bibContent)
const svgFileContent = ref(publishStore.svgContent)
const responseMessage = ref('')
const loading = ref(false)

const closeOverlay = () => {
  publishStore.toggleOverlay(false)
}

const submitPullRequest = async () => {
  loading.value = true
  responseMessage.value = ''

  const apiUrl = 'https://electrochemistry-data.linuxrider.workers.dev/'

  const payload = {
    commitMessage: commitMessage.value,
    files: [
      { filename: identifier.value + '.yaml', content: yamlFileContent.value },
      { filename: identifier.value + '.bib', content: bibtexFileContent.value },
      { filename: identifier.value + '.svg', content: svgFileContent.value },
    ],
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()
    if (response.ok) {
      responseMessage.value = `✅ Success: PR #${result.githubResponse.number} created!`
    } else {
      responseMessage.value = `❌ Error: ${result.error}`
    }
  } catch (error) {
    responseMessage.value = `❌ Network error: ${error.message}`
  }

  loading.value = false
}
onMounted(() => {
  const curator = yamlLoad(yamlFileContent.value, 'utf-8').curation.process[0]
  console.log(curator)
  localStorage.setItem('curator', JSON.stringify({ name: curator.name, orcid: curator.orcid }))
})
</script>

<template>
  <div class="container">
    <div class="form">
      <h2>Submit to electrochemistry-data repository</h2>
      <div><label>Commit message</label><input v-model="commitMessage" /></div>
      <div><label>Identifier</label> <input v-model="identifier" /></div>
      <button @click="submitPullRequest" :disabled="loading">
        {{ loading ? 'Sending...' : 'Pull request created' }}
      </button>

      <p v-if="responseMessage">{{ responseMessage }}</p>
    </div>
    <button class="close-btn" @click="closeOverlay">X</button>
  </div>
</template>

<style scoped>
.container {
  margin: auto;
  display: flex;
  justify-content: center;
  padding: 20px;
  border: 1px solid #ddd;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 50%;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: black;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

button {
  background: #28a745;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

label {
  color: #000000;
}

.close-btn {
  background: darkred;
}
</style>
