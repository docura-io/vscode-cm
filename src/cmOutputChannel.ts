'use strict';

import { LiveAutoCompleteIndexer } from './cmLiveIndexer';

import vscode = require('vscode');
import fs = require('fs');

export class cmOutputChannel {
    
    private output: vscode.OutputChannel;
    private goToPromise: Thenable<vscode.Location>;
    private goToResolver: (value?: {} | PromiseLike<{}>) => void;
    private goToRejector: (value?: {} | PromiseLike<{}>) => void;
    
    private diagnostics: vscode.DiagnosticCollection;
    
    private msgPerSec = 0;
    private msgCounterId = 0;
    private treshholdBroken = false;
    public writeOutputToFile: boolean;
    private filePath: string;
    
    constructor( diags: vscode.DiagnosticCollection, filePath: string ) { 
        this.filePath = filePath;
        this.output = vscode.window.createOutputChannel( 'CM' );
        this.diagnostics = diags;
        this.msgCounterId = setInterval( () => {
            if ( this.msgPerSec > 0 ) {
                console.log("Messages Per Second: " + this.msgPerSec);
                this.msgPerSec = 0;
            }
        }, 1000 );
    }
    
    public clear() {
        // this.output.clear();
        this.msgPerSec = 0;
    }
    
    public write( data: string ) {
        //This doesn't wait for the callback response because we really don't need to wait for it
        //Its just used when CM is crashing really hard and you need to see the output in a file because VS Code crashed
        //This will write the output into a file so you can review it
        if(this.writeOutputToFile) {
            fs.appendFile(this.filePath, data, null);
        }
        
        this.msgPerSec++;
        if ( this.msgPerSec > 400 ) {
            // only show the error once per threshhold break
            if ( !this.treshholdBroken ) vscode.window.showWarningMessage( "Too many output messages have been queued, VSCode will stop processing output, until it returns to normal levels");
            this.treshholdBroken = true;
            // vscode.window.showWarningMessage( "Too many output messages have been queued, force cleaning CM");
            // vscode.commands.executeCommand( 'cm.cleancm' );
            this.output.append(data);
        } else {
            this.treshholdBroken = false;
            this.output.append( this.lineParser( data ) );
        }
        
    }
    
    public goToDefinitionPromise() {
        if ( !this.goToPromise ) {
            this.goToPromise = new Promise( (resolve, reject) => {
                this.goToResolver = resolve;
                this.goToRejector = reject;
            });
        }
        
        return this.goToPromise
        .then( (loc) => {
            this.goToPromise = null;
            return loc;
        } ); 
    }
    
    public lineParser( data ) {
        var lines = data.split(/\r\n/g);
        var newLines = [];
        var errorRegex = /([cC]:.*\.cm)\((\d+)\,\s{1}(\d+)\):(.*)/gm; 
        var gotoRegex = /\(cm-goto-def "(.[^"]+)"\s(\d+)/;
        var debugRegex = /^cm\sD>\s*?$/;
        var autoCompleteRegex = /^\[VSCODE\]\[AutoComplete\]:(.+)$/;
        var noise = /(.*)#custom\.qaTools(.*)/;
        var cetAltClickRegex = /'\(cm-show-file-at-pos-selected-window\s"(.*)"\s(\d+)\)\)/;

        lines.forEach(element => {
            var errorMatch = errorRegex.exec(element);
            var autoCompleteMatch = autoCompleteRegex.exec( element );
            var cetAltClickMatch = cetAltClickRegex.exec( element );
            
            if ( noise.test(element ) || element.indexOf('#custom.qaTools') > -1 ) {
                // get rid of this crap from output
                return;
            } else if ( cetAltClickMatch ) {
                this.goToFileLocation( cetAltClickMatch[1], parseInt(cetAltClickMatch[2]) );
            } else if ( gotoRegex.test( element ) ) {
                var match = gotoRegex.exec( element );
                var file = match[1];
                var offset = parseInt( match[2] );
                
                vscode.workspace.openTextDocument( file )
                .then( (doc) => {
                    var position = doc.positionAt( offset );
                    position = doc.positionAt( offset + position.line );
                    
                    if ( this.goToPromise && this.goToResolver ) {
                        this.goToResolver( new vscode.Location( vscode.Uri.file( file ), position ) );
                    } else {
                        console.log( 'no promise for go to def' );
                    }
                });
                return;
            } else if ( errorMatch ) {
                if(errorMatch) {
                    // this.setDiagnostics( errorMatch[1], parseInt( errorMatch[2] ), parseInt( errorMatch[3] ), errorMatch[4] );
                    this.setDiagnostics( errorMatch[1], +errorMatch[2], +errorMatch[3], errorMatch[4] );
                    element = '[ERROR ' + errorMatch[1] + ':' + errorMatch[2] + ':' + errorMatch[3] + ' - ' + errorMatch[4] + ']';
                } else {
                    element = '[ERROR ' + element + ']';                    
                }                                
            } else if ( debugRegex.test( element) ) {
                element = '[DEBUG ' + element + ']';
            } else if ( autoCompleteMatch ) {
                var indexer = LiveAutoCompleteIndexer.getInstance();
                //indexer.receivedItem( JSON.parse( autoCompleteMatch[1] ) );
                indexer.readACFile( autoCompleteMatch[1] );
                return;
            }
            
            newLines.push( element );
        });
        
        return newLines.join('\r\n');
    }
    
    private goToFileLocation( file:string, offset: number ) {
        vscode.workspace.openTextDocument( file )
            .then( (doc) => {
                var position = doc.positionAt( offset );
                position = doc.positionAt( offset + position.line );
                
                vscode.window.showTextDocument( doc )
                    .then( editor => {
                        editor.revealRange( new vscode.Range( position, position ), vscode.TextEditorRevealType.InCenter ); 
                    });
            } );
    }
    
    private setDiagnostics( file: string, line: number, column: number, desc: string ) {
        vscode.workspace.openTextDocument( file )
            .then( (doc) => {
                var textLine: vscode.TextLine = doc.lineAt( line - 1 );
                var diag = new vscode.Diagnostic( textLine.range, desc, vscode.DiagnosticSeverity.Error );
                this.diagnostics.set( vscode.Uri.file( file ), [diag] )        
            });
    }
}