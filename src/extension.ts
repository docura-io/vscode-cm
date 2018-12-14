// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { DiagnosticCollection, Disposable, ExtensionContext, FileSystemWatcher, languages, window, workspace, RelativePattern, WorkspaceFolder, TextDocument, Uri } from 'vscode';

import { CMDefinitionProvider } from './cmDeclaration';
import { CM80CompletionItemProvider } from './cmSuggest80';
import SignatureHelpProvider from './cmSignatureHelper'
import { ClangDocumentFormattingEditProvider } from './cmFormat';
import { CMHoverProvider } from './cmHover';
import { CmTreeDataProvider } from './cmExplorer';
// import { CMWorkspaceSymbolProvider } from './cmWorkspaceSymbolProvider';
import { CmCodeActionProvider } from './cmCodeActions';
import { CMFileSymbolProvider } from './cmFileSymbolProvider';
import { CM_MODE } from './cmMode';

import { cmCompilerAdapter } from './cmCompilerAdapter';
import { cmConfig } from './cmConfig';
import { cmUtils } from './cmUtils';

import { registerCommands, foldCopyright } from './commands';
import { watch } from 'fs';

import { setup as gSetup, refProvider } from './cmGlobals';

let diagnosticCollection: DiagnosticCollection;
let compilerAdapter: cmCompilerAdapter;

export function getCompiler(): cmCompilerAdapter {
    return compilerAdapter;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    const disposables: Disposable[] = [];
    
    console.log("--STARTING CM EXTENSION--");

    // console.log(cmConfig.currentWorkspace());

    
    diagnosticCollection = languages.createDiagnosticCollection( "cm" );
    // setup compiler Adapter
    compilerAdapter = new cmCompilerAdapter( diagnosticCollection, cmConfig.cmOutputFilePath() );
    gSetup();
    
    // setup watcher
    var cmWatcher = createCmWatcher();
    var rsWatcher = createRsWatcher();

    window.onDidChangeActiveTextEditor( (editor) => {        
        foldCopyright( editor );
    } );

    // createFileOpenWatcher();
    createRsSaveWatcher();
    
    // subscriptions
    disposables.push(languages.registerDefinitionProvider(CM_MODE, new CMDefinitionProvider()));
    if ( cmConfig.cmAutoComplete80Enabled() ) {
        disposables.push(languages.registerCompletionItemProvider(CM_MODE, new CM80CompletionItemProvider(), '.' ) );
    }

    disposables.push( languages.registerDocumentSymbolProvider(CM_MODE, new CMFileSymbolProvider() ));
    // disposables.push ( languages.registerWorkspaceSymbolProvider( new CMWorkspaceSymbolProvider() ));
    
    // disposables.push( languages.registerCodeActionsProvider( CM_MODE, new CmCodeActionProvider() ));
    disposables.push(languages.registerDocumentFormattingEditProvider(CM_MODE, new ClangDocumentFormattingEditProvider() ));
    disposables.push(languages.registerHoverProvider( CM_MODE, new CMHoverProvider() ) );
    disposables.push( window.registerTreeDataProvider( 'cmExplorer', new CmTreeDataProvider() ) );
    disposables.push( languages.registerReferenceProvider( CM_MODE, refProvider ) );

    if ( cmConfig.isDebug() ) {
        // put experimental features here
        // disposables.push( languages.registerSignatureHelpProvider( CM_MODE, new SignatureHelpProvider(), '(', ',' ) );
    }
    
    disposables.push(diagnosticCollection);
    disposables.push( registerCommands( compilerAdapter ) );
    
    context.subscriptions.push(...disposables);
}

function createWatcher( func: (e: Uri)=>void, extension: string ): void {
    var dict: any[] = [];
    
        function addWatcher(wf: WorkspaceFolder) {
            var watcher = workspace.createFileSystemWatcher( new RelativePattern(wf, `**/*.${extension}` ) );  
            dict.push({key: wf.uri.fsPath, value: watcher});
            watcher.onDidCreate( (e) => {
                func( e );
                // cmUtils.addCopyright( e );
            } );
        }
    
        workspace.workspaceFolders.forEach( wf => {
           addWatcher( wf );
        });
    
        workspace.onDidChangeWorkspaceFolders( e => {
            e.added.forEach( a => {
                addWatcher(a);
            });
            e.removed.forEach( a => {
                let watcher: FileSystemWatcher = dict.find( o => o.key == a.uri.fsPath );
                watcher = null;
            })
        } );
}

function createCmWatcher(): void {
    createWatcher( cmUtils.addCopyright, "cm" );
}

function createRsWatcher(): void {
    createWatcher( cmUtils.createResourceTemplate, "rs" );
}

function createRsSaveWatcher() {
    if ( cmConfig.rsWatcherEnabled() ) {
        workspace.onDidSaveTextDocument( (e) => {
            if ( e.fileName.endsWith(".rs") ) {
                compilerAdapter.runIfStarted( `{ cm.rs.loadRs( cm.io.Url("${e.fileName.replace( /\\/g, "/" )}"), force=true ); }` );
            }
        });
    }
}