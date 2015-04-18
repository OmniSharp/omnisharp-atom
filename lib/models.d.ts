declare module OmniSharp {
    interface AspNet5Project {
        path?: string;
        name?: string;
        commands?: { [ key: string ]: string };
        configurations?: string[];
        projectSearchPaths?: string[];
        frameworks?: string[];
        globalJsonPath?: string;
        sourceFiles?: string[];
    }

    interface AspNet5WorkspaceInformation {
        projects?: AspNet5Project[];
        runtimePath?: string;
        designTimeHostPort?: number;
    }

    interface AutoCompleteRequest {
        wantDocumentationForEveryCompletionResult?: boolean;
        wantImportableTypes?: boolean;
        wantMethodHeader?: boolean;
        wantSnippet?: boolean;
        wantReturnType?: boolean;
        wantKind?: boolean;
    }

    interface AutoCompleteResponse {
        completionText?: string;
        description?: string;
        displayText?: string;
        requiredNamespaceImport?: string;
        methodHeader?: string;
        returnType?: string;
        snippet?: string;
        kind?: string;
    }

    interface ChangeBufferRequest {
        fileName?: string;
        startLine?: number;
        startColumn?: number;
        endLine?: number;
        endColumn?: number;
        newText?: string;
    }

    interface CodeActionRequest {
        codeAction?: number;
        wantsTextChanges?: boolean;
        selectionStartColumn?: number;
        selectionStartLine?: number;
        selectionEndColumn?: number;
        selectionEndLine?: number;
    }

    interface CodeFormatResponse {
        buffer?: string;
    }

    interface DiagnosticLocation {
        logLevel?: string;
    }

    interface FileMemberElement {
        childNodes?: FileMemberElement[];
        location?: QuickFix;
        kind?: string;
        projects?: string[];
    }

    interface FindSymbolsRequest {
        filter?: string;
    }

    interface FindUsagesRequest {
        onlyThisFile?: boolean;
        excludeDefinition?: boolean;
    }

    interface FormatAfterKeystrokeRequest {
        character?: string;
    }

    interface FormatRangeRequest {
        endLine?: number;
        endColumn?: number;
    }

    interface FormatRangeResponse {
        changes?: LinePositionSpanTextChange[];
    }

    interface GetCodeActionsResponse {
        codeActions?: string[];
    }

    interface GetTestCommandResponse {
        directory?: string;
        testCommand?: string;
    }

    interface GotoDefinitionResponse {
        fileName?: string;
        line?: number;
        column?: number;
    }

    interface LinePositionSpanTextChange {
        newText?: string;
        startLine?: number;
        startColumn?: number;
        endLine?: number;
        endColumn?: number;
    }

    interface ModifiedFileResponse {
        fileName?: string;
        buffer?: string;
        changes?: LinePositionSpanTextChange[];
    }

    interface MSBuildProject {
        projectGuid?: string;
        path?: string;
        assemblyName?: string;
        targetPath?: string;
        targetFramework?: string;
        sourceFiles?: string[];
    }

    interface MsBuildWorkspaceInformation {
        solutionPath?: string;
        projects?: MSBuildProject[];
    }

    interface NavigateResponse {
        line?: number;
        column?: number;
    }

    interface ProjectInformationResponse {
        msBuildProject?: MSBuildProject;
        aspNet5Project?: AspNet5Project;
    }

    interface QuickFix {
        fileName?: string;
        line?: number;
        column?: number;
        endLine?: number;
        endColumn?: number;
        text?: string;
        projects?: string[];
    }

    interface QuickFixResponse {
        quickFixes?: QuickFix[];
    }

    interface RenameRequest {
        wantsTextChanges?: boolean;
        renameTo?: string;
    }

    interface RenameResponse {
        changes?: ModifiedFileResponse[];
        errorMessage?: string;
    }

    interface Request {
        line?: number;
        column?: number;
        buffer?: string;
    }

    interface RunCodeActionResponse {
        text?: string;
        changes?: LinePositionSpanTextChange[];
    }

    interface SymbolLocation {
        kind?: string;
    }

    interface TestCommandRequest {
        type?: any;
    }

    interface TestCommandResponse {
        testCommand?: string;
    }

    interface TypeLookupRequest {
        includeDocumentation?: boolean;
    }

    interface TypeLookupResponse {
        type?: string;
        documentation?: string;
    }

    interface WorkspaceInformationResponse {
        aspNet5?: AspNet5WorkspaceInformation;
        msBuild?: MsBuildWorkspaceInformation;
    }


}
