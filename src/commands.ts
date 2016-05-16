'use strict';

import { cmCompilerAdapter } from './cmCompilerAdapter';
import { CMCompletionItemProvider } from './cmSuggest';
import { cmConfig } from './cmConfig';

import { commands, Disposable, Position, Range, Selection, TextDocument, TextEditor, Uri, window, workspace } from 'vscode';

export function registerCommands( compiler: cmCompilerAdapter, completeProvider: CMCompletionItemProvider ) {
    let d1 = commands.registerCommand( "cm.start", () => compiler.start() );
    let d2 = commands.registerCommand( "cm.stopcm", () => compiler.stop() );
    let d3 = commands.registerCommand( "cm.cleancm", () => compiler.clean() );
    let d4 = commands.registerCommand( "cm.startcet", () => compiler.run( `run("cet.runtime","designer.cm");`) );
    let d5 = commands.registerCommand( "cm.quitdebug", () => compiler.quitDebug() );
    
    let d6 = commands.registerCommand( "cm.runline", () => {
        validateCMFileAndRun( true, (editor) => {
            var text = editor.document.lineAt( editor.selection.active.line ).text.trim();
            compiler.run( text );
        } );
    } );
    
    let d7 = commands.registerCommand( "cm.runcurrentfile", (args) => {
        validateCMFileAndRun( true, (editor) => {
            compiler.runCurrentFile( editor.document.fileName );
        } );
    } );
    
    let d8 = commands.registerCommand( "cm.compilefile", (args) => {
        validateCMFileAndRun( true, (editor) => {
            compiler.compileFile( editor.document.fileName );
        });
    } );
    
    let d9 = commands.registerCommand( "cm.compilepackage", () => {
        validateCMFileAndRun( true, (editor) => {
            compiler.compileFile( editor.document.fileName );
        });
    } );
    
    let d10 = commands.registerCommand( "cm.loadall", () => {
        validateCMFileAndRun( true, (editor) => {
            editor.document.save();
            compiler.loadAllKnown( editor.document.fileName );
        } );
    } );
    
    let d11 = commands.registerCommand( "cm.profileboot", () => {
        validateCMFileAndRun( false, (editor) => {
            const userName = process.env["USER"] || process.env["USERNAME"];
            if ( !userName ) {
                window.showErrorMessage( "Unable to retrieve username");
                return;
            }
            workspace.openTextDocument( Uri.file( `${cmConfig.cmRoot()}\\home\\profile\\${userName}\\boot.cm` ) )
            .then( (doc) => {
                window.showTextDocument( doc );
            });
        } );
    } );
    
    let d12 = commands.registerCommand( "cm.compileallbelow", () => {
        compiler.compileWorkspace();
    } );
    
    let d13 = commands.registerCommand( "cm.runautocomplete", () => {
        compiler.runAutoComplete(true);
    } );
   
    let d14 = commands.registerCommand( "cm.runexternal", (args) => {
        // this is a hook for anything to run CM Commands via "commands.executeCommand(...)"
        if ( typeof args == "string" ) {
            compiler.run( args );
        }
    } )
    
    let d15 = commands.registerCommand( "cm.startwriteoutputfile", () => {
        compiler.startWritingOutputFile();
    });
    
    let d16 = commands.registerCommand( "cm.stopwriteoutputfile", () => {
        compiler.stopWritingOutputFile();
    });
   
    let d17 =  commands.registerCommand( "cm.purgeRemoteCache", () => {
        completeProvider.purgeCache(); 
    } );
   
    return Disposable.from( d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16 );
}

export function foldCopyright( editor: TextEditor ) {
    if ( editor.document.uri.fsPath.endsWith( ".cm" ) ) {
        let currentSelection = editor.selection;
        let p0 = new Position( 0, 0 );
        editor.selection = new Selection( p0, p0 );
        commands.executeCommand( "editor.fold" )
            .then( (res) => {
                editor.selection = currentSelection;
            } );
    }
}

function validateCMFileAndRun( requireCMFile: boolean, func: ( editor: TextEditor ) => void ): void {
    const editor = window.activeTextEditor;
    if ( requireCMFile ) {
        if ( !editor ) return;
        editor.document.save();
        if ( editor.document.languageId != "cm" ) return;
    }
    func( editor );
}