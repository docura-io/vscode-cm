'use strict';

import { prependListener } from 'process';
import { DiagnosticCollection, Location, Position, workspace } from 'vscode';
import { cmConfig } from './cmConfig';

import { cmTerminal } from './cmTerminal';
import { CodeStatementCommand } from './commands/CodeStatementCommand';
import { FindReferencesCommand } from './commands/FindReferencesCommand';
import { GoToCommand } from './commands/GoToCommand';
import { CommandBase } from './commands/ICommand';

let colors : FontFaceInfo[];

const cBegin = "";
const cEnd = ""

export interface ICMOutputer {
    diagnostics: DiagnosticCollection;

    clear() : void;
    write( data: string ) : void;

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

export class cmOutputHandlerBase implements ICMOutputer {
    public diagnostics: DiagnosticCollection;
    protected terminal: cmTerminal;
    // notes:
    // perhaps "cm-next-error" denotes the end of the data for the command?
    private currentHeader = "";
    private currentText = "";
    private extras : any;

    private inSOH = false;

    private isFullyStarted = false;

    private commands : CommandBase[] = [];

    constructor( diags: DiagnosticCollection ) {
        this.diagnostics = diags;
        updateColors( cmConfig.terminalColors() );
        this.setupCommands();
        this.terminal = new cmTerminal();
        this.terminal.start();
    }

    public setupCommands() : void {
        this.commands.push( new GoToCommand() );
        this.commands.push( new FindReferencesCommand() );
        this.commands.push( new CodeStatementCommand() );
    }

    public clear() : void {
        this.terminal.clear();
    }

    public pushExtras( x: any ) : void {
        this.extras = { ...this.extras, ...x };
    }

    public write( data: string ) : void {
        data = this.handleFontFaces( data );

        if ( data ) {
            // data = this.parse( data );
            data = this.parse2( data );
            // data = data.replace("", "[SOH]").replace("","[STX]");
            this.terminal.write( data );
        }
    }

    public show() : void {
        this.terminal.focus(true);
    }

    private parse2( data: string ) : string {

        const chars = [...data];

        let result = "";

        chars.forEach( (c,i) => {

            if ( this.inSOH ) {
                if ( c == cEnd ) {
                    this.inSOH = false;
                } else {
                    this.currentHeader += c;
                }
            } else if ( c == cBegin ) {
                this.doCommand();
                // console.log("Would doCommand...");
                this.inSOH = true;
            } else {
                this.currentText += c;
                result += c;

                if ( !this.isFullyStarted && this.currentText.indexOf("cm>") > -1 ) {
                    this.isFullyStarted = true;
                    this.currentHeader = "";
                    this.currentText = "";
                    console.log("CM Compiler Ready!");
                }
            }
        });

        return result.length > 0 ? result : null;
    }

    private parse( data: string ) : string {

        // x01 == SOH
        // x02 == STX
        const partialRegex = /^[^\x01]+/; 
        const regex = /\x01([^\x02]*)\x02?([^\x01]*)/g; 
        const colorRegEx = /[\u001b|\x1b][^m]+m/g;

        let rtn = "";
        
        let partialMatch = partialRegex.exec( data );
        if ( partialMatch ) {
            this.currentText += partialMatch[0];
            // make sure we display it!
            // rtn += this.currentHeader;
            rtn += partialMatch[0];
        }
        
        if ( data.indexOf( "\x01" ) > -1 ) {
            // there is a SOH character, so we should be good to process the current command...
            this.doCommand();
        }

        let result;
        while(result = regex.exec(data)) {
            if ( /\(.*\)/.test(result[1]) ) {
                this.currentHeader = result[1];
            }

            if ( true ) {
                let colors;
                while( colors = colorRegEx.exec(result[1]) ) {
                    rtn += colors[0];
                }
            } else {
                rtn += result[1];
            }
            
            let text = ( result.length > 1 ) ? result[2] : "";

            rtn += text;
            this.currentText = text;
            
            if ( data.indexOf( "\x01", result.index + 1 ) > -1 ) {
                // there is more stuff, so we should be good to run this beast
                this.doCommand();
            }

            if ( !this.isFullyStarted && text.indexOf("cm>") > -1 ) {
                this.isFullyStarted = true;
                this.currentHeader = "";
                this.currentText = "";
                console.log("CM Compiler Ready!");
            }
        }
        if ( this.currentHeader.length > 0 || this.currentText.length > 0 ) {
            // console.log("Current Cmd: " + this.currentHeader);
            // console.log("Current Text: " + this.currentText);
        }

        if ( rtn.length > 0 ) {
            return rtn;
        }


        return null;
    }

    private doCommand() {
        if ( !this.isFullyStarted ) return;
        // should it do anything???
        if ( this.currentHeader.indexOf( "(cm-") > -1 ) {
            var data = {
                command: this.currentHeader,
                data: this.currentText,
                extras: this.extras
            };

            if ( data.command.indexOf( 'cm-next-error' ) > -1 ) {
                // clean up
                // this.extras?.goToRejector();
                // this.extras?.findRefRejector();

                this.extras = {};
            } else {
                for( let cmd of this.commands ) {
                    if ( cmd.execute( data ) ) {
                        break;
                    }
                }
            }
        }

        this.currentHeader = "";
        this.currentText = "";
    }

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