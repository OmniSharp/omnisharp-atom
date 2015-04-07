
/// <reference path="../typings/emissary/emissary.d.ts" />
/// <reference path="../typings/atom/atom.d.ts" />

declare module AtomCore {
    // TODO: Submit to definitely typed
    interface ICommandRegistry {
        add(target:string, commandName:string, callback: (event: Event) => void);
        add(target:string, commands: { [command: string]: (event: Event) => void });
        findCommands({target: Node}): Array<{ name: string, displayName:string }>;
        dispatch(target: Node, commandName: string, detail?: any): void;
    }

    // Currently atom.d.ts does not declare it is an emitter.
    // It currently is but Emissary might be going away.
    //    see: https://github.com/atom/emissary
    interface IAtom extends Emissary.IEmitter {
        commands: ICommandRegistry;
    }

    interface IWorkspace {
        observeTextEditors(callback: (editor:AtomCore.IEditor) => { dipose: Function; });
    }

    interface IGrammar {
        name: string;
    }

    interface IEditor {
        onDidDestroy(callback: () => void);
    }
}

declare module Emissary {
    interface IEmitter {
        dispose() :void;
    }
}

declare module OmniSharp {
    interface IFeature {
        name:string;
        path:string;
        invoke(method:string, ...args: any[]);
    }

    interface vm {
        isNotLoading: boolean;
        isLoading: boolean;
        isOff: boolean;
        isNotOff: boolean;
        isOn: boolean;
        isNotReady: boolean;
        isReady: boolean;
        isNotError: boolean;
        isOffOrError: boolean;
        isOffAndNotError: boolean;
        isError: boolean;
        isLoadingOrReady: boolean;
        isLoadingOrReadyOrError: boolean;
        state: string;
        previousState: string;
        iconText: string;
    }

    interface ICompletionResult {
        word: string;
        prefix: string;
        renderLabelAsHtml: boolean;
        label: string;
    }
}
