// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, DiagnosticCollection, Disposable, extensions, Extension, ExtensionContext, FileSystemWatcher, languages, window, workspace, RelativePattern, WorkspaceFolder, TextDocument, Uri, comments, CommentMode } from 'vscode';

import { CMDefinitionProvider } from './cmDeclaration';
import { CM80CompletionItemProvider } from './cmSuggest80';
import { ClangDocumentFormattingEditProvider } from './cmFormat';
import { CMHoverProvider } from './cmHover';
import { CmTreeDataProvider } from './cmExplorer';
import { CMFileSymbolProvider } from './cmFileSymbolProvider';
import { CM_MODE } from './cmMode';
import { showReloadConfirm } from './helpers/reload';

import { cmCompilerAdapter } from './cmCompilerAdapter';
import { cmConfig } from './cmConfig';
import { cmUtils } from './cmUtils';

import { registerCommands, foldCopyright } from './commands';
import fs = require('fs');

import { setup as gSetup, refProvider } from './cmGlobals';
import { config } from 'process';

let diagnosticCollection: DiagnosticCollection;
let compilerAdapter: cmCompilerAdapter;
var parser_1 = require("./cmTextParser");
var configuration_1 = require("./cmConfig");
var configuration = new configuration_1.cmConfig();


var configuration = new configuration_1.cmConfig();
var parser = new parser_1.CmTextParser(configuration);

export function getCompiler(): cmCompilerAdapter {
    return compilerAdapter;
}

function setupConfigListener( ctx: ExtensionContext ) {
    workspace.onDidChangeConfiguration( (e) => {
        if ( e.affectsConfiguration( "cm.newSyntax" ) ) {
            updatePackageConfig( ctx.asAbsolutePath("package.json") );
        }
    } );
}

function updatePackageConfig( filePath: string  ) {
    fs.readFile( filePath, {encoding: "utf8"}, (err,data) => {
        if ( err ) {
            console.log("Couldn't find config");
            return;
        }
        let config = JSON.parse(data);
        // console.log(config.contributes.grammars[0].path);
        let requestedSyntax = "./syntaxes/" + ( cmConfig.useNewSyntax() ? "cm.tmLanguage.json" : "CM.plist");
        console.log("REQUESTED CM SYNTAX " + requestedSyntax );
        if ( config.contributes.grammars[0].path != requestedSyntax ) {
            console.log("Changing CM Syntax Config");
            config.contributes.grammars[0].path = "./syntaxes/" + ( cmConfig.useNewSyntax() ? "cm.tmLanguage.json" : "CM.plist");
            fs.writeFileSync( filePath, JSON.stringify(config, null, 2) );
            
            showReloadConfirm( "You CM Language syntax setting was changed you must reload VSCode for the change to take effect" )
            .then( (v) => {
                if ( v ) commands.executeCommand( "workbench.action.reloadWindow" );
            });
            
        }
    } );
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    setupConfigListener( context );
    const disposables: Disposable[] = [];
    
    console.log("--STARTING CM EXTENSION--");

    // console.log(cmConfig.currentWorkspace());

    
    diagnosticCollection = languages.createDiagnosticCollection( "cm" );
    // setup compiler Adapter
    compilerAdapter = new cmCompilerAdapter( diagnosticCollection, cmConfig.cmOutputFilePath() );
    gSetup();

    window.onDidChangeActiveTextEditor( (editor) => {    
        var activeEditor = window.activeTextEditor;    
        foldCopyright( editor );
        configuration.setParser(parser);
        parser.SetRegex(activeEditor.document.languageId);
        configuration.setSingleLineComments();
        parser.ApplyDecorations(activeEditor);
    } );

    // when the location of the cursor changes, update the configuration (specifically auto adding asterisks in block comments)
    window.onDidChangeTextEditorSelection(function (event) {
        configuration.setParser(parser);
        configuration.configureCommentBlocks(event);
        var activeEditor = window.activeTextEditor;
        parser.SetRegex(activeEditor.document.languageId);        
        configuration.setSingleLineComments();     
        parser.ApplyDecorations(activeEditor);   
    });

    // createFileOpenWatcher();
    createRsSaveWatcher();
    
    // subscriptions
    disposables.push(languages.registerDefinitionProvider(CM_MODE, new CMDefinitionProvider()));
    if ( cmConfig.cmAutoComplete80Enabled() ) {
        disposables.push(languages.registerCompletionItemProvider(CM_MODE, new CM80CompletionItemProvider(), '.' ) );
    }

    disposables.push( languages.registerDocumentSymbolProvider(CM_MODE, new CMFileSymbolProvider() ));
    
    disposables.push(languages.registerDocumentFormattingEditProvider(CM_MODE, new ClangDocumentFormattingEditProvider() ));
    disposables.push(languages.registerHoverProvider( CM_MODE, new CMHoverProvider() ) );
    disposables.push( window.registerTreeDataProvider( 'cmExplorer', new CmTreeDataProvider() ) );
    disposables.push( languages.registerReferenceProvider( CM_MODE, refProvider ) );
    
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