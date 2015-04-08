class ErrorHandler {
    public activate() {
        atom.on("omnisharp-atom:error", (err) => console.error(err));
    }
}
export =  ErrorHandler
