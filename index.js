var assign = require('object-assign')
var isNode = typeof window === 'undefined'

require('whatwg-fetch')

function toJSON(response) {
  var data = response

  if (response.status !== 204 && typeof response.json === 'function') {
    try {
      data = response.json()
    } catch (e) {
      data = response
    }
  }

  return data
}

function checkStatus(response) {
  return response.ok ? response : Promise.reject(response)
}

var acceptJson = {
  Accept: 'application/json; charset=UTF-8'
}

var sendsJson = {
  'Content-Type': 'application/json; charset=UTF-8'
}

function apiFetch(endpoint, config) {
  var reqConfig = assign({}, config)

  reqConfig.headers = assign(reqConfig.headers || {}, acceptJson)

  if (reqConfig.body) {
    reqConfig.body = JSON.stringify(reqConfig.body)
    assign(reqConfig.headers, sendsJson)
  }

  return fetch(endpoint, reqConfig)
    .then(checkStatus)
    .then(toJSON)

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
