// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, DiagnosticCollection, Disposable, ExtensionContext, FileSystemWatcher, languages, window, workspace } from 'vscode';

import { CMDefinitionProvider } from './cmDeclaration';
import { CMCompletionItemProvider } from './cmSuggest';
import SignatureHelpProvider from './cmSignatureHelper'
import { ClangDocumentFormattingEditProvider } from './cmFormat';
import { CMHoverProvider } from './cmHover';
import { CM_MODE } from './cmMode';

import { cmCompilerAdapter } from './cmCompilerAdapter';
import { cmConfig } from './cmConfig';
import { cmUtils } from './cmUtils';

import { registerCommands, foldCopyright } from './commands';

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
    
    diagnosticCollection = languages.createDiagnosticCollection( "cm" );
    // setup compiler Adapter
    compilerAdapter = new cmCompilerAdapter( diagnosticCollection, cmConfig.cmOutputFilePath() );
    
    // setup watcher
    var cmWatcher = createCmWatcher();
    var rsWatcher = createRsWatcher();
    // createFileOpenWatcher();
    createRsSaveWatcher();
    
    var completionProvider = new CMCompletionItemProvider();
    
    // subscriptions
    disposables.push(languages.registerDefinitionProvider(CM_MODE, new CMDefinitionProvider()));
    disposables.push(languages.registerCompletionItemProvider(CM_MODE, completionProvider, '.' ) );
    disposables.push(languages.registerDocumentFormattingEditProvider(CM_MODE, new ClangDocumentFormattingEditProvider() ));
    disposables.push(languages.registerHoverProvider( CM_MODE, new CMHoverProvider() ) );
    
    if ( cmConfig.isDebug() ) {
        // put experimental features here
        // disposables.push( languages.registerSignatureHelpProvider( CM_MODE, new SignatureHelpProvider(), '(', ',' ) );
    }
    
    
    disposables.push(diagnosticCollection);
    
    // commands
    // cm commands
    // setupCMCommands( context, compilerAdapter );
    disposables.push( registerCommands( compilerAdapter, completionProvider ) );
    
    setupLangConfig();
    
    context.subscriptions.push(...disposables);
}

function setupLangConfig() {
    languages.setLanguageConfiguration(CM_MODE.language, {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],

        __electricCharacterSupport: {
            brackets: [
                { tokenType: 'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
                { tokenType: 'delimiter.square.ts', open: '[', close: ']', isElectric: true },
                { tokenType: 'delimiter.paren.ts', open: '(', close: ')', isElectric: true }
            ]
        },

        __characterPairSupport: {
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '`', close: '`', notIn: ['string'] },
                { open: '"', close: '"', notIn: ['string'] },
                { open: '\'', close: '\'', notIn: ['string', 'comment'] }
            ]
        }
    });
}

function createFileOpenWatcher() {
    // workspace.onDidOpenTextDocument( (doc) => {
    //     console.log('opened');
    // });
    
    // window.onDidChangeActiveTextEditor( (editor) => {
        
    //     // console.log('trying to fold');
        
    //     foldCopyright( editor );
    // } );
}

function createCmWatcher(): FileSystemWatcher {
    var watcher = workspace.createFileSystemWatcher( `${workspace.rootPath}/**/*.cm` );
    
    function runAutoComplete( adapter: cmCompilerAdapter, file: string ) {
        if ( /acloader/.test( file ) ) return;
        cmUtils.debounce( () => { console.log('Calling AC...'); adapter.runAutoComplete(); }, 500, false );   
    }

    workspace.onDidOpenTextDocument( (doc) => {
        commands.executeCommand('vscode.foldAtLine', 1);
    });
    
    watcher.onDidChange( (e) => {
        runAutoComplete( compilerAdapter, e.toString() );
    } );
    
    watcher.onDidCreate( (e) => {
        // don't add the copyright header to the acloader.cm file
        if ( !/acloader/.test( e.toString() ) ) {
            cmUtils.addCopyright( e );
            runAutoComplete( compilerAdapter, e.toString() );
        }
    } );
    
    watcher.onDidDelete( (e) => {
        runAutoComplete( compilerAdapter, e.toString() );
    });
    
    return watcher;
}

function createRsWatcher(): FileSystemWatcher {
    var watcher = workspace.createFileSystemWatcher( `${workspace.rootPath}/**/*.rs` );
    
    watcher.onDidCreate((e) => {
        cmUtils.createResourceTemplate(e);
    });
    
    return watcher;
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