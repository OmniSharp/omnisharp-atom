class ErrorHandler {
    public activate() {
        atom.emitter.on("omnisharp-atom:error", (err) => console.error(err));
    }
}
export =  ErrorHandler
