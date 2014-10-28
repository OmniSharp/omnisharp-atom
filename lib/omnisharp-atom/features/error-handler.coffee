module.exports =
  class ErrorHandler

    activate: =>
      atom.on "omnisharp-atom:error", (err) -> console.error err
