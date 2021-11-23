'use strict';

import { cmConfig } from './cmConfig';
import { EventEmitter, Pseudoterminal, Terminal, TerminalDimensions, window, workspace, commands } from 'vscode';

export class cmTerminal {

    private terminal: Terminal
    private pTerminal: Pseudoterminal
    private writeEmitter = new EventEmitter<string>();
    private closeEmitter = new EventEmitter<number>();

    constructor() {

    }

    public start() : boolean {
        // if ( this.isStarted ) return;
        
        // this.terminal = window.createTerminal( { name: "CM", shellPath: "C:\\Windows\\system32\\cmd.exe" } );
        // this.terminal = window.createTerminal( { name: "CM" );
        // this.terminal.sendText( "C:\\CetDev\\versiongit\\setenv.cmd" );
        // this.terminal.sendText( "C:\\CetDev\\versiongit\\base\\bin\\cmstartdev.cmd" );
        // this.terminal.show();

        // return new Promise((resolve, reject) => {
        //     this.compiler.start()
        //     .then( (success) => {
        //         this.isStarted = success;
        //         resolve(success);  
        //     }, reject);
        // });

        // Pseudo Terminal stuff
        this.pTerminal = {
            onDidWrite: this.writeEmitter.event,
            onDidClose: this.closeEmitter.event,
            open: () => this.writeEmitter.fire('*** CM TERMINAL ***\r\n'),
            close: () => {},
            handleInput: data => {
                // this.writeEmitter.fire( data === '\r' ? '\r\n' : data);
                // if ( data === '\r' ) {
                    // window.showInformationMessage( "***Closing CM...");
                    // this.closeEmitter.fire(1);
                //     writeEmitter.fire(`\r\necho: "${line}"\r\n\n`);
                // } else {
                    // console.log(data);
                    this.writeEmitter.fire( data.replace(/\r/g, "\r\n") );
                // }
            }
        }

        this.terminal = window.createTerminal( {name: "CM", pty: this.pTerminal} );
        this.focus(true);

        return true;
    }

    public focus( preserveFocus: boolean ) {
        if ( this.terminal ) {
            this.terminal.show( preserveFocus );
        }
    }

    public run() {
        if ( this.terminal ) {
            this.terminal.sendText( "pln(\u001b[31m\"Hello CM!\"\u001b[0m);" );
        }
    }

    public clear() {
        if ( this.terminal) {
            this.terminal.show(true);
            commands.executeCommand( "workbench.action.terminal.clear" );
        }
    }

    public write(data: string) {
        if ( this.terminal ) {
            console.log
            this.terminal.sendText( data, false );
        }
    }
}