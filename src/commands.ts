'use strict';

import { cmCompilerAdapter } from './cmCompilerAdapter';
import { CMCompletionItemProvider } from './cmSuggest';
import { cmConfig } from './cmConfig';

const fs = require('fs');
var didLoadScripts = false;
var scriptPackage = "";
var scriptFuncs = [];

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
        if ( args && args.file ) {
            compiler.compileFile( args.file );
        } else {
            validateCMFileAndRun( true, (editor) => {
                compiler.compileFile( editor.document.fileName );
            });
        }
        
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

    let d18 = commands.registerCommand( "cm.testAC", () => {
        compiler.run( "cvm_ac(\"c:/CetDev/version8.0/home/profile/test/test.cm\", 1892);" );
    });
   
    let scripts = commands.registerCommand( "cm.userScript", () => {
        window.showQuickPick( getUserScripts() )
        .then( (picked) => {
            if ( picked ) {
                compiler.run( `{ use ${scriptPackage}; ${picked}();}` );
            }
        } );
    });

    let d19 = commands.registerCommand('extension.openFile', file => {
        workspace.openTextDocument( file ).then( doc => { window.showTextDocument( doc, { preserveFocus: true, preview: true } ); } );
    });

    let d20 = commands.registerCommand( "cm.implements", () => {
        validateCMFileAndRun( true, (editor) => {
            const offset = getPosition(editor);
            compiler.run( `cm.runtime.implementsMethod("${editor.document.fileName.replace( /\\/g, '/' )}", ${offset});` );
        } );
    } );

    let d21 = commands.registerCommand( "cm.subclasses", () => {
        validateCMFileAndRun( true, (editor) => {
            const offset = getPosition(editor);
            compiler.run( `cm.runtime.subClasses("${editor.document.fileName.replace( /\\/g, '/' )}", [${offset},${offset}], 4);` );
        })
    });

    let d22 = commands.registerCommand( "cm.overrides", () => {
        validateCMFileAndRun( true, (editor) => {
            const offset = getPosition(editor);
            compiler.run( `cm.runtime.overridesMethod("${editor.document.fileName.replace( /\\/g, '/' )}", ${offset});` );
        })
    });

    return Disposable.from( d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16, scripts, d20, d21 );
}
    
    let d99 = commands.registerCommand( "cm.Test", () => {
        console.log("I DID IT");
    } );

function getPosition( editor: TextEditor ): Number {
    const position = editor.selection.start;
    let offset = editor.document.offsetAt( position ) + ( 1 - position.line ); // emacs is 1 based, and it treats line end as 1 character not 2;
    return offset;
}

function getUserScripts(): Thenable<string[]> {
    if ( scriptFuncs.length > 0 ) {
        return Promise.resolve(scriptFuncs);
    }
    return new Promise((resolve, reject) => {
        fs.readFile( workspace.rootPath + "/vscode.scripts.cm", "utf8" , (err, data) => {
            let myReg = /public\s+void\s+(.[^\(\)]*)\s*\(\)/g;
            let packageReg = /package\s(.[^;]*);/;
            scriptPackage = packageReg.exec( data )[1];
            var myArr;
            var myFuncs = [];
            while ( ( myArr = myReg.exec(data) ) !== null ) {
                myFuncs.push(myArr[1]);
            }

            if ( myFuncs.length == 0 ) {
                reject("No User Scripts Found");
            } else {
                didLoadScripts = true;
                scriptFuncs = myFuncs;
                resolve(scriptFuncs);
            }

            
        });
    });
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