'use strict';

import { DiagnosticCollection } from 'vscode';

import { cmConfig } from './cmConfig';
import { cmTerminal } from './cmTerminal';
import { AltClickParser } from './parsers/AltClickParser';
import { CodeStatementParser } from './parsers/CodeStatementParser';
import { DiagnosticsParser } from './parsers/DiagnosticsParser';
import { FindReferencesParserV2 } from './parsers/FindRerferencesParserV2';
import { GoToParser } from './parsers/GoToParser';
import { LineParser } from './parsers/LineParser';
import { NoiseRemoverParser } from './parsers/NoiseRemoverParser';

let colors : FontFaceInfo[];

export interface ICMOutputer {
    diagnostics: DiagnosticCollection;

    parsers : LineParser[];
    activeParsers : LineParser[];

    clear() : void;
    write( data: string ) : void;
    setupParsers() : void;

    show() : void;
}

export interface IColorData {
    name: string
    bold: boolean
    italic: boolean
    underline: boolean,
    background: boolean,
    r: number
    g: number
    b: number
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
    abstract show() : void;

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

    protected partial: string;

    constructor( diags: DiagnosticCollection ) {
        super(diags);
        updateColors( cmConfig.terminalColors() );
        this.terminal = new cmTerminal();
        this.terminal.start();
    }

    public setupParsers() : void {
        super.setupParsers();
        this.parsers.push( new GoToParser() );
        this.parsers.push( new CodeStatementParser() );
        this.parsers.push( new FindReferencesParserV2() );
        this.parsers.push( new AltClickParser() );

        this.parsers.push( new DiagnosticsParser( this.diagnostics ) );
        // should be last
        this.parsers.push( new NoiseRemoverParser() );
    }

    public activeParser<T extends LineParser>( TCtor: new (...args: any[]) => T ) : T {
        for ( const parser of this.parsers ) {
            if ( parser instanceof TCtor ) {
                parser.activate();
                return parser as T;
            }
        }
        return null;
    }

    public clear() {
        // vscode.commands.executeCommand( '' )
        this.terminal.clear();
    }

    public show() : void {
        this.terminal.focus(true);
    }

    public write( data: string ) {
        // Do Font Faces before dealing with partials...?
        data = this.handleFontFaces( data );

        //TODO: Do I need the partial line parser stuff...?

        if ( false ) {
            // we can't parse incomplete data/commands.
            if ( this.partial && this.partial.length > 0 ) {
                data = this.partial + data;
                this.partial = null;
            }

            if ( data && data.length > 0 && !data.endsWith( '\r\n') && !data.endsWith("" ) ) {
                const newLineIndex = data.lastIndexOf( '\r\n' );
                if ( newLineIndex > -1 ) {
                    const lastIndex =  newLineIndex+ 2;
                    const newData = data.substring( 0, lastIndex );
                    const remaining = data.substr( lastIndex );

                    data = newData;
                    this.partial = remaining;
                } else {
                    this.partial = data;
                    data = null;
                }
                // console.log(`Got Partial: ${this.partial}`);
            }
        }

        if ( data ) {
            data = this.parse( data );
            this.terminal.write( data );
        }
    }

    public parse( data: string ) : string {

        let lines = data.split('\r\n');
        let rtnData = '';
        const last = lines.length - 1;
        let count = 0;

        for( let line of lines ) {
            if ( line && line.length == 0 ) {
                rtnData += line;
                continue
            };
            for( let p of this.parsers ) {
                if ( p.isActive ) {
                    try {
                        line = p.parse( line );
                        if ( line == null ) {
                            break;
                        } 
                    } catch (error) {
                        console.error( `Parser ${typeof p} failed. ${error}` );
                    }
                }
            }
            // parsers can set the line to null to exclude it from output
            if ( line != null ) {
                rtnData += line;
            }
            if ( count != last ) {
                rtnData += "\r\n";
            }
            count++;
        }
        return rtnData;
    }
}

export function updateColors( colorData: IColorData[] ) {
    colors = [];

    let names: string[] = [];

    for( let element of colorData ) {
        const name = element.name;
        const color = `${element.r};${element.g};${element.b}`;
        let type = "38";
        if ( element.background ) {
            type = "48";
        }
        let prefix = "";
        if ( element.bold ) {
            prefix = "1;";
        }
        if ( element.italic ) {
            prefix += "3;"
        }
        // not working for some reason
        if ( element.underline ) {
            prefix += "4;"
        }
        // default it
        if ( prefix == "" ) prefix = "0;"
        names.push(name);
        colors.push( { name: name, asciiColor: `\x1b[${prefix}${type};2;${color}m` } );
    }

    for( let element of defaultColors ) {
        if ( names.indexOf(element.name) == -1 ) {
            colors.push(element);
        }
    }
}

const defaultColors : FontFaceInfo[] = [

    // "rose" red highlight is hard to read RGB(255,215,215)
    // dark blue hard to read? RGB(0,0,135)

    // 24-bit color : \x1b[38;2;196;30;59m    E.G. : rgb(196, 30, 59)

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

    //TODO: new guys
    // type
]

class FontFaceInfo {
    public name: string;
    public asciiColor: string;
}