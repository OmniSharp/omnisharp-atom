declare module OmniSharp {
    interface AspNet5Project {
        Path?: string;
        Name?: string;
        Commands?: { [ key: string ]: string };
        Configurations?: string[];
        ProjectSearchPaths?: string[];
        Frameworks?: string[];
        GlobalJsonPath?: string;
        SourceFiles?: string[];
    }

    interface AspNet5WorkspaceInformation {
        Projects?: AspNet5Project[];
        RuntimePath?: string;
        DesignTimeHostPort?: number;
    }

    interface AutoCompleteRequest extends Request {
        WantDocumentationForEveryCompletionResult?: boolean;
        WantImportableTypes?: boolean;
        WantMethodHeader?: boolean;
        WantSnippet?: boolean;
        WantReturnType?: boolean;
        WantKind?: boolean;
    }

    interface AutoCompleteResponse {
        CompletionText?: string;
        Description?: string;
        DisplayText?: string;
        RequiredNamespaceImport?: string;
        MethodHeader?: string;
        ReturnType?: string;
        Snippet?: string;
        Kind?: string;
    }

    interface ChangeBufferRequest {
        FileName?: string;
        StartLine?: number;
        StartColumn?: number;
        EndLine?: number;
        EndColumn?: number;
        NewText?: string;
    }

    interface CodeActionRequest extends Request {
        CodeAction?: number;
        WantsTextChanges?: boolean;
        SelectionStartColumn?: number;
        SelectionStartLine?: number;
        SelectionEndColumn?: number;
        SelectionEndLine?: number;
    }

    interface CodeFormatResponse {
        Buffer?: string;
    }

    interface DiagnosticLocation extends QuickFix {
        LogLevel?: string;
    }

    interface FileMemberElement {
        ChildNodes?: FileMemberElement[];
        Location?: QuickFix;
        Kind?: string;
        Projects?: string[];
    }

    interface FindSymbolsRequest {
        Filter?: string;
    }

    interface FindUsagesRequest extends Request {
        OnlyThisFile?: boolean;
        ExcludeDefinition?: boolean;
    }

    interface FormatAfterKeystrokeRequest extends Request {
        Character?: string;
    }

    interface FormatRangeRequest extends Request {
        EndLine?: number;
        EndColumn?: number;
    }

    interface FormatRangeResponse {
        Changes?: LinePositionSpanTextChange[];
    }

    interface GetCodeActionsResponse {
        CodeActions?: string[];
    }

    interface GetTestCommandResponse {
        Directory?: string;
        TestCommand?: string;
    }

    interface GotoDefinitionResponse {
        FileName?: string;
        Line?: number;
        Column?: number;
    }

    interface LinePositionSpanTextChange {
        NewText?: string;
        StartLine?: number;
        StartColumn?: number;
        EndLine?: number;
        EndColumn?: number;
    }

    interface ModifiedFileResponse {
        FileName?: string;
        Buffer?: string;
        Changes?: LinePositionSpanTextChange[];
    }

    interface MSBuildProject {
        ProjectGuid?: string;
        Path?: string;
        AssemblyName?: string;
        TargetPath?: string;
        TargetFramework?: string;
        SourceFiles?: string[];
    }

    interface MsBuildWorkspaceInformation {
        SolutionPath?: string;
        Projects?: MSBuildProject[];
    }

    interface NavigateResponse {
        Line?: number;
        Column?: number;
    }

    interface ProjectInformationResponse {
        MsBuildProject?: MSBuildProject;
        AspNet5Project?: AspNet5Project;
    }

    interface QuickFix {
        FileName?: string;
        Line?: number;
        Column?: number;
        EndLine?: number;
        EndColumn?: number;
        Text?: string;
        Projects?: string[];
    }

    interface QuickFixResponse {
        QuickFixes?: QuickFix[];
    }

    interface RenameRequest extends Request {
        WantsTextChanges?: boolean;
        RenameTo?: string;
    }

    interface RenameResponse {
        Changes?: ModifiedFileResponse[];
        ErrorMessage?: string;
    }

    interface Request {
        Line?: number;
        Column?: number;
        Buffer?: string;
    }

    interface RunCodeActionResponse {
        Text?: string;
        Changes?: LinePositionSpanTextChange[];
    }

    interface SymbolLocation extends QuickFix {
        Kind?: string;
    }

    interface TestCommandRequest extends Request {
        Type?: any;
    }

    interface TestCommandResponse {
        TestCommand?: string;
    }

    interface TypeLookupRequest extends Request {
        IncludeDocumentation?: boolean;
    }

    interface TypeLookupResponse {
        Type?: string;
        Documentation?: string;
    }

    interface WorkspaceInformationResponse {
        AspNet5?: AspNet5WorkspaceInformation;
        MSBuild?: MsBuildWorkspaceInformation;
    }


}
