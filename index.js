var assign = require('object-assign')

function toJSON (response) {
  if (response.status === 204) return response

  function invalidResponse () {
    response.data = {
      message: 'Oopss... The API returned an invalid response'
    }
    return Promise.reject(response)
  }

  if (typeof response.json !== 'function') {
    return invalidResponse()
  }

  return response.json()
    .then(function (data) {
      response.data = data
      return response
    })
    .catch(invalidResponse)
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

  reqConfig.headers['Access-Control-Expose-Headers'] = 'Authorization'

  return fetch(endpoint, reqConfig)
    .then(function (response) {
      const responseToken = extractToken(response.headers.get('Authorization'))
      if (responseToken) {
        response.token = responseToken
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

exports.GET = apiFetch
exports.POST = useMethod('POST')
exports.PUT = useMethod('PUT')
exports.DELETE = useMethod('DELETE')
