'use strict';

import { Diagnostic, DiagnosticCollection, DiagnosticSeverity, TextLine, Uri, workspace } from "vscode";
import { LineParser } from "./LineParser";

const errorRegex = /([cC]:[^]*\.cm)\((\d+)\,\s{1}(\d+)\):(.*)/gm; 

export class DiagnosticsParser extends LineParser {

    exclusive = false;

    diags: DiagnosticCollection;

    constructor( diags: DiagnosticCollection ) {
        super();
        this.diags = diags;
        this.activate(); // is always active
    }

    parse(line: string): string {
        const match = errorRegex.exec( line );
        if ( match ) {
            if ( !match[4].match( /\simplements\s\w*$/ )) { // for some reason the implements call outputs this like an error
                // this.setDiagnostics( errorMatch[1], parseInt( errorMatch[2] ), parseInt( errorMatch[3] ), errorMatch[4] );
                var severity = DiagnosticSeverity.Error;
                if ( /found\sno\suses\sof/.test(line) ) {
                    severity = DiagnosticSeverity.Warning;
                }
                this.addDiagnostic( match[1], +match[2], +match[3], match[4].replace(/[\x00-\x1F\x7F-\x9F]/g, ""), severity );

                let color = severity == DiagnosticSeverity.Warning ? "\x1b[38;2;255;245;105m" : "\x1b[38;2;196;30;59m";

                // line = `${severity == DiagnosticSeverity.Warning ? "WARNING" : "ERROR"} ` + match[1] + ':' + match[2] + ':' + match[3] + "\u001b[0m" + ' - ' + match[4];
                line = `${color}${match[1]}:${match[2]}:${match[3]}\u001b[0m - ${match[4]}`;
            }
        }
        return line;
    }
    
    complete() {
        // does nothing it's work is never done
    }

    private addDiagnostic( file: string, line: number, column: number, desc: string, level: DiagnosticSeverity ) {
        workspace.openTextDocument( file )
            .then( (doc) => {
                var textLine: TextLine = doc.lineAt( line - 1 );
                var diag = new Diagnostic( textLine.range, desc, level );
                this.diags.set( Uri.file( file ), [diag] )
            });
    }
}