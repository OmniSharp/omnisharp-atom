module.exports =
  class ErrorHandler

    activate: =>
      atom.on "atom-sharper:error", (err) -> console.error err
