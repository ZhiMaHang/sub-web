import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let clientTypes
let subscription
let urlParser
let subconverter

before(async () => {
  server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true }
  })

  const modules = await Promise.all([
    server.ssrLoadModule('/src/config/client-types.js'),
    server.ssrLoadModule('/src/composables/useSubscription.js'),
    server.ssrLoadModule('/src/composables/useUrlParser.js'),
    server.ssrLoadModule('/src/views/Subconverter.vue')
  ])
  clientTypes = modules[0]
  subscription = modules[1]
  urlParser = modules[2]
  subconverter = modules[3]
})

after(async () => {
  await server?.close()
})

const makeForm = clientType => ({
  sourceSubUrl: 'vless://example-node',
  clientType,
  insert: false,
  remoteConfig: '',
  excludeRemarks: '',
  includeRemarks: '',
  filename: '',
  auth: '',
  appendType: false,
  emoji: true,
  nodeList: false,
  tfo: false,
  scv: true,
  fdn: false,
  expand: true,
  sort: false,
  udp: false,
  new_name: true,
  tpl: {
    surge: { doh: false },
    clash: { doh: true }
  }
})

test('Stash is available as a dedicated client target', () => {
  assert.equal(clientTypes.CLIENT_TYPES.Stash, 'stash')
})

test('Stash URLs retain shared Clash YAML options without Clash-only DoH', () => {
  const { makeUrl } = subscription.useSubscription()
  const generated = makeUrl(
    makeForm('stash'),
    '2',
    'vless://example-node',
    'https://converter.example/sub?',
    [],
    false
  )
  const params = new URL(generated).searchParams

  assert.equal(params.get('target'), 'stash')
  assert.equal(params.get('new_name'), 'true')
  assert.equal(params.get('clash.doh'), null)
})

test('URL parsing restores the Stash target and Clash YAML options', async () => {
  const { parseUrl } = urlParser.useUrlParser()
  const form = makeForm('')
  const customParams = []
  let succeeded = false
  let parseError = ''

  const parsed = await parseUrl(
    'https://converter.example/sub?target=stash&url=vless%3A%2F%2Fexample-node&insert=false&new_name=true&clash.doh=true',
    form,
    customParams,
    () => { succeeded = true },
    error => { parseError = error }
  )

  assert.equal(parsed, true, parseError)
  assert.equal(succeeded, true)
  assert.equal(form.clientType, 'stash')
  assert.equal(form.new_name, true)
  assert.equal(form.tpl.clash.doh, true)
  assert.deepEqual(customParams, [])
})

test('Stash output is not offered to the Clash one-click installer', () => {
  const canImportClash = subconverter.default.computed.canImportClash

  assert.equal(canImportClash.call({
    customSubUrl: 'https://converter.example/sub?target=stash',
    form: { clientType: 'stash' }
  }), false)
  assert.equal(canImportClash.call({
    customSubUrl: 'https://converter.example/sub?target=clash',
    form: { clientType: 'clash' }
  }), true)
})
