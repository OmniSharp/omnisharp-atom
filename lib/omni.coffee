OmniSharpServer = require './omni-sharp-wrapper'
rp = require "request-promise"
Url = require "url"

module.exports =
  class Omni

    @_uri: (path, query) =>
      port = OmniSharpServer.get().getPortNumber()
      Url.format
        hostname: "localhost"
        protocol: "http"
        port: port
        pathname: path
        query: query

    @syntaxErrors: (data) =>
      rp
        uri: @_uri "syntaxErrors"
        method: "POST"
        form: data
