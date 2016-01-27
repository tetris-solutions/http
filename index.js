var assign = require('object-assign')
var tokens = {}
var isBrowser = typeof window !== 'undefined'
var localStorageKeyName = 'authTokens'

if (isBrowser) {
  try {
    assign(tokens, JSON.parse(window.localStorage.getItem(localStorageKeyName)))
  } catch (e) {
    // ~ no localStorage
  }
}
function persist () {
  try {
    window.localStorage.setItem(localStorageKeyName, JSON.stringify(tokens))
  } catch (e) {
    // ~ dont bother
  }
}

function saveToken (origin, token) {
  tokens[origin] = token
  persist()
}

function getOrigin (url) {
  return url.match(/^\/\//) || url.match(/:\/\//)
    ? url.split('/').slice(0, 3).join('/')
    : null
}

function toJSON (response) {
  if (response.status === 204 || typeof response.json !== 'function') return response

  return response.json()
    .then(function (data) {
      response.data = data
      return response
    })
}

function checkStatus (response) {
  return response.ok ? response : Promise.reject(response)
}

var acceptJson = {
  Accept: 'application/json'
}

var sendsJson = {
  'Content-Type': 'application/json'
}

function extractToken (str) {
  return typeof str === 'string' ? str.replace(/^Bearer\s/, '') : null
}

function apiFetch (endpoint, config) {
  var reqConfig = assign({}, config)

  reqConfig.headers = assign(reqConfig.headers || {}, acceptJson)

  if (reqConfig.body) {
    reqConfig.body = JSON.stringify(reqConfig.body)
    assign(reqConfig.headers, sendsJson)
  }

  if (isBrowser) {
    var origin = getOrigin(endpoint) || window.location.origin
    var requestToken = extractToken(reqConfig.headers['Authorization'])

    if (requestToken) {
      saveToken(origin, requestToken)
    } else if (tokens[origin]) {
      reqConfig.headers['Authorization'] = 'Bearer ' + tokens[origin]
    }
  }

  reqConfig.headers['Access-Control-Expose-Headers'] = 'Authorization'

  return fetch(endpoint, reqConfig)
    .then(function (response) {
      const responseToken = extractToken(response.headers.get('Authorization'))
      if (responseToken) {
        response.token = responseToken
        if (isBrowser) saveToken(origin, responseToken)
      }
      return response
    })
    .then(toJSON)
    .then(checkStatus)
}

function useMethod (method) {
  return function (endpoint, config) {
    return apiFetch(endpoint, assign({method: method}, config))
  }
}

exports.saveToken = saveToken
exports.GET = apiFetch
exports.POST = useMethod('POST')
exports.PUT = useMethod('PUT')
exports.DELETE = useMethod('DELETE')
