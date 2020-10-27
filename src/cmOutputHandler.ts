'use strict';

import { DiagnosticCollection, Location, SnippetString } from 'vscode';

import { cmTerminal } from './cmTerminal';
import { LineParser } from './parsers/LineParser';
import { FindReferencesParser } from './parsers/SrcRefParsers';

export interface ICMOutputer {
    diagnostics: DiagnosticCollection;

    parsers : LineParser[];
    activeParsers : LineParser[];

    clear() : void;
    write( data: string ) : void;
    setupParsers() : void;
}

export abstract class cmOutputHandlerBase implements ICMOutputer {
    public diagnostics: DiagnosticCollection;

    public parsers: LineParser[];
    public activeParsers: LineParser[];

    constructor( diags: DiagnosticCollection ) {
        this.diagnostics = diags;
        this.setupParsers();
    }

    public setupParsers(): void {
        this.parsers = [];
        this.activeParsers = [];
    }

    public clear() : void {
        console.log("Implement in child class!");
    }

    abstract write( data: string ) : void;

    protected handleFontFaces(data: string) : string {
        data = data.replace( /\((?:cm-pop-face|cm-|cm-reset-compilation-faces)\)/g, "\u001b[0m" );
        colors.forEach(map => {
            var replace = "\\((?:cm-push-face|cm\\+)\\s'" + map.name + "\\)";
            var re = new RegExp( replace,"g");
            data = data.replace(re, map.asciiColor);
        });

        // give our Boolean friends some love
        data = data.replace( "true\r\n", "\x1b[38;2;86;156;214mtrue\r\n");
        data = data.replace( "false\r\n", "\x1b[38;2;86;156;214mfalse\r\n");

        return data;
    }
}

export class cmMainOutputHanlder extends cmOutputHandlerBase {

    protected terminal: cmTerminal;

    constructor( diags: DiagnosticCollection ) {
        super(diags);
        this.terminal = new cmTerminal();
        this.terminal.start();
    }

    public clear() {
        // vscode.commands.executeCommand( '' )
    }

    public write( data: string ) {
        //TODO: Do I need the partial line parser stuff...?

        data = this.handleFontFaces( data );
        data = this.parse( data );

        this.terminal.write( data );
    }

    public parse( data: string ) : string {
        return data;
    }
}

const colors : FontFaceInfo[] = [
    // other stuff
    { "name" : "macro-key", "asciiColor" : "\u001b[38;5;13m" },
    { "name" : "keyword-bold", "asciiColor" :"\u001b[1m\u001b[38;5;27m" },
    { "name" : "bold", "asciiColor" :"\u001b[1m" },
    { "name" : "function-name", "asciiColor" :"\u001b[38;5;18m" },
    { "name" : "pkg", "asciiColor" :"\u001b[38;5;88m" }, // 88
    { "name" : "comment", "asciiColor" :"\u001b[38;5;22m" },
    { "name" : "stack-frame", "asciiColor" :"\u001b[38;5;22m" },

    // foreground colors
    { "name" : "grey", "asciiColor" : "\u001b[38;5;240m" },
    { "name" : "gray", "asciiColor" : "\u001b[38;5;240m" },
    { "name" : "red", "asciiColor" :"\u001b[38;5;224m" },
    { "name" : "lred", "asciiColor" :"\u001b[38;5;196m" },
    { "name" : "green", "asciiColor" :"\u001b[38;5;22m" },
    { "name" : "blue", "asciiColor" :"\u001b[38;5;18m" }, // 18
    { "name" : "dblue", "asciiColor" :"\u001b[38;5;18m" },
    { "name" : "purple", "asciiColor" :"\u001b[38;5;13m" },

    // background colors
    { "name" : "angry", "asciiColor" :"\u001b[48;5;196m" }, 
    { "name" : "hred", "asciiColor" :"\u001b[48;5;224m" },
    { "name" : "hgreen", "asciiColor" :"\u001b[48;5;194m" },
    { "name" : "hblue", "asciiColor" :"\u001b[48;5;189m" }, // 189

    // (cm-reset-compilation-faces)
    // { "name" : "green", "asciiColor" :"" },
    // { "name" : "green", "asciiColor" :"" },
]

class FontFaceInfo {
    public name: string;
    public asciiColor: string;
}