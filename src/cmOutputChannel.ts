'use strict';

import vscode = require('vscode');
import { cmOutputHandlerBase } from './cmOutputHandler';
import { FindReferencesParser } from './parsers/SrcRefParsers';

export class cmOutputChannel extends cmOutputHandlerBase {
    
    private output: vscode.OutputChannel;

    private isResolving = false;
    private goToPromise: Thenable<vscode.Location>;
    public goToResolver: (value?: {} | vscode.Location | PromiseLike<{}>) => void;
    private goToRejector: (value?: {} | PromiseLike<{}>) => void;
    
    public writeOutputToFile: boolean;

    private watchResolve: (value?: {} | PromiseLike<{}>) => void;
    private watchReject: (value?: {} | PromiseLike<{}>) => void;
    private watchSuccess: RegExp;
    private watchFail: RegExp;

    private partial = '';
    
    constructor( diags: vscode.DiagnosticCollection ) { 
        super(diags);
        this.output = vscode.window.createOutputChannel( 'CM' );
    }
    
    public setupParsers() : void {
        super.setupParsers();
        this.parsers.push( new FindReferencesParser(this) );
    }

    public clear() {
        this.output.clear();
    }
    
    public write( data: string, force: boolean=false ) {
        //This doesn't wait for the callback response because we really don't need to wait for it
        //Its just used when CM is crashing really hard and you need to see the output in a file because VS Code crashed
        //This will write the output into a file so you can review it
        // if(this.writeOutputToFile) {
        //     fs.appendFile(this.filePath, data, null);
        // }

        // console.time( 'cmOutputChannel-write' );

        if ( force ) {
            if ( this.partial.length > 0 ) this.output.appendLine( this.partial );
            this.output.append(data);
            return;
        }

        if ( this.partial.length > 0 ) {
            // console.log('appending partial');
            data = this.partial + data;
            this.partial = '';
        }

        var lineResults = this.lineParser( data );

        if ( lineResults.newLines.length > 0 ) {
            
            this.output.append( lineResults.newLines );
            // this.terminal.write( lineResults.newLines );

            // console.log(lineResults.newLines);
            // lineResults.newLines.forEach(l => {
            //     this.output.append( l );
            // }
        }
        // this.output.append( data );
        // this.output.append(data.replace(/[\x01\x02]/g, "\r\n"));
        // if ( lineResults.hashLines.length > 0 ) {
        //     this.hashOutput.append( lineResults.hashLines );
        // }
        // console.timeEnd( 'cmOutputChannel-write' );
        // console.log("done");
    }

    public goToDefinitionPromise() {
        if ( !this.goToPromise ) {
            this.goToPromise = new Promise( (resolve, reject) => {
                this.isResolving = false;
                this.goToResolver = resolve;
                this.goToRejector = reject;
            });
        }
        
        return this.goToPromise
        .then( (loc) => {
            this.goToPromise = null;
            this.goToResolver = null;
            this.goToRejector = null;
            return loc;
        }, (error) => {
            this.goToPromise = null;
            this.goToResolver = null;
            this.goToRejector = null;
            throw error;
        } ); 
    }

    public lineParser( data ) {
        let rawData =  data; // data.replace(/[\x01\x02]/g, "\r\n");
        let hasNewLine = data.indexOf('\r\n') > -1;
        let hasStx = data.indexOf( "" ) > -1;
        if ( !hasNewLine && !hasStx && rawData.indexOf( "cm>" ) == -1 ) { //STX is useful for us to parse the lines
            console.log("partial found");
            this.partial = rawData;
            return { newLines: '' }
        }
        var lines = rawData.split(/\r\n/g);
        var newLines = [];
        var hashLines = [];
        const errorRegex = /([cC]:.*\.cm)\((\d+)\,\s{1}(\d+)\):(.*)/gm; 
        const gotoRegex = /\(cm-goto-def "(.[^"]+)"\s(\d+)/;
        const debugRegex = /^cm\sD>\s*?$/;
        // var noise = /(.*)#custom\.qaTools(.*)/;
        const nextErrorRegex = /\(next-error\).cm>\s*/;
        const cetAltClickRegex = /'\(cm-show-file-at-pos-selected-window\s"(.*)"\s(\d+)\)\)/;
        // let plnHashRegex = /^[A-Za-z0-9]*=.*$/;
        const cmACRegex = /^tt$|\(load\s".*"\s.*\)|\(cm-ac-result-none\)/;
        const cmPrompt = /cm>/;

        var invokeDate = Date.now();

        lines.forEach(element => {
            // check new line parsers
            let blocked = false;

            for (let aParse of this.parsers) {
                element = aParse.parse( element );
                if ( aParse.isActive && aParse.exclusive ) {
                    // let diff =  invokeDate - aParse.started;
                    // if ( diff < 10000 ) {
                        blocked = true;
                    //     break;
                    // } else {
                        // its been more then 10 seconds...your time is done
                        // aParse.isActive = false;
                        
                        // temp fix
                        // if ( this.goToRejector ) this.goToRejector();

                        // aParse.complete();
                    // }
                }
            }

            if( !blocked ) {
                var errorMatch = errorRegex.exec(element);
                var cetAltClickMatch = cetAltClickRegex.exec( element );
                var nextErrorMatch = nextErrorRegex.exec( element );
                
                // if ( plnHashRegex.test(element) ) {
                //     hashLines.push( element );
                // } 

                // if ( noise.test(element ) || element.indexOf('#custom.qaTools') > -1 ) {
                    // get rid of this crap from output
                    // return;
                // } else 
                // don't reject if its in process of doing it
                if ( cmPrompt.test(element ) && this.goToPromise && !this.isResolving ) {
                    this.goToRejector();
                    this.goToPromise = null;
                    // return;
                } else if ( cetAltClickMatch ) {    
                    this.goToFileLocation( cetAltClickMatch[1], parseInt(cetAltClickMatch[2]) );
                } else if ( gotoRegex.test( element ) ) {
                    var match = gotoRegex.exec( element );
                    var file = match[1];
                    var offset = parseInt( match[2] );
                    this.isResolving = true;

                    vscode.workspace.openTextDocument( file )
                    .then( (doc) => {
                        var position = doc.positionAt( offset );
                        position = doc.positionAt( offset + position.line );

                        if ( this.goToPromise && this.goToResolver ) {
                            this.goToResolver( new vscode.Location( vscode.Uri.file( file ), position ) );
                            this.goToResolver = null;
                            this.goToRejector = null;
                        } else {
                            console.log( 'no promise for go to def' );
                            // vscode.window.showTextDocument( doc ).then( (res) => {
                            //     res.selection = new vscode.Selection( position, position );
                            //     res.revealRange( new vscode.Range( position, position ), vscode.TextEditorRevealType.InCenter );
                            // });
                        }
                    });
                    return;
                } else if ( errorMatch && this.goToPromise == null) {
                    if ( !errorMatch[4].match( /\simplements\s\w*$/ )) { // for some reason the implements call outputs this like an error
                        // this.setDiagnostics( errorMatch[1], parseInt( errorMatch[2] ), parseInt( errorMatch[3] ), errorMatch[4] );
                        var severity = vscode.DiagnosticSeverity.Error;
                        if ( /found\sno\suses\sof/.test(element) ) {
                            severity = vscode.DiagnosticSeverity.Warning;
                        }
                        this.setDiagnostics( errorMatch[1], +errorMatch[2], +errorMatch[3], errorMatch[4], severity );
                        element = `${severity == vscode.DiagnosticSeverity.Warning ? "WARNING" : "ERROR"} ` + errorMatch[1] + ':' + errorMatch[2] + ':' + errorMatch[3] + ' - ' + errorMatch[4];
                    }                             
                // } else if ( debugRegex.test( element) ) {
                    // element = '[DEBUG ' + element + ']';
                } else if ( nextErrorMatch && !this.isResolving ) {
                    // setTimeout( () => {
                        if ( this.goToPromise && this.goToRejector ) {
                            this.goToRejector();
                        }
                    // }, 500 );
                } else if ( this.watchSuccess != null ) {
                    if ( this.watchSuccess.test( element ) ) {
                        this.watchResolve();
                        this.clearOutputWatch();
                    } else if ( this.watchFail.test ( element ) )  {
                        this.watchReject();
                        this.clearOutputWatch();
                    }
                }

                if ( cmACRegex.test( element ) ) {
                    // return;
                }
            }
            
            if ( element != null ) {
                newLines.push( element.replace( /\x01/g, "" ).replace( /\x02/g, "" ) );
            }
        });
        
        // if ( hashLines.length == 1 ) {
        //     hashLines[0] += '\r\n';
        // }

        if ( newLines.length == 1 ) {
            // newLines[0] += '\r\n';
        }

        return {
            newLines: newLines.join('\r\n').replace('\r\n\r\n', '\r\n'),
            hashLines: hashLines.join('\r\n')
        };
    }
    
    public addOutputWatch( res: (value?: {} | PromiseLike<{}>) => void, rej: (value?: {} | PromiseLike<{}>) => void, success: RegExp, fail: RegExp ) {
        this.watchResolve = res;
        this.watchReject = rej;
        this.watchSuccess = success;
        this.watchFail = fail;
    }

    public clearOutputWatch() {
        this.watchResolve = null;
        this.watchReject = null;
        this.watchSuccess = null;
        this.watchFail = null;
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
    
    private setDiagnostics( file: string, line: number, column: number, desc: string, level: vscode.DiagnosticSeverity ) {
        vscode.workspace.openTextDocument( file )
            .then( (doc) => {
                var textLine: vscode.TextLine = doc.lineAt( line - 1 );
                var diag = new vscode.Diagnostic( textLine.range, desc, level );
                this.diagnostics.set( vscode.Uri.file( file ), [diag] )        
            });
    }
}