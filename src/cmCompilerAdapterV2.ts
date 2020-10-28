'use strict';

import { cmConfig } from './cmConfig'
import { ICMOutputer, cmMainOutputHanlder } from './cmOutputHandler'
import { DiagnosticCollection, Location, window, workspace } from 'vscode'
import { CodeStatement, ICMCompilerAdapter } from './cmCompilerAdapter';
import { GoToParser } from './parsers/GoToParser';
import { CodeStatementParser } from './parsers/CodeStatementParser';
import { FindReferencesParserV2 } from './parsers/FindRerferencesParserV2';

let compilerContainer = require("node-cm/index.js")

export class cmCompilerAdapterV2 implements ICMCompilerAdapter {
    public outputHandler : cmMainOutputHanlder;
    private compiler;
    public isStarted : boolean = false;

    constructor( diagnostics: DiagnosticCollection ) {
        this.outputHandler= new cmMainOutputHanlder( diagnostics );

        this.setupCompiler();
    }

    private setupCompiler() {
        this.compiler = new compilerContainer( {
            cmRoot: cmConfig.cmRoot(),
            gitMode: cmConfig.cmGitMode(),
            onRead: (data) => {
                this.outputHandler.write( data );
            },
            onError: (data) => {
                window.showInformationMessage( "Error from CM Process" );
                this.outputHandler.write( `[INFO: CM_Process_Error -> ${data}]` );
            },
            //debug: true,
            "cmArch": cmConfig.arch()
        });
    }

    public start() : Thenable<boolean> {
        if ( this.isStarted ) return;

        return new Promise( (resolve,reject) => {
            this.compiler.start()
            .then( (succuess) => {
                this.isStarted = true;
                resolve(succuess);
            }, reject );
        });
    }

    public stop() {
        this.clearOutputIfNeeded();
        this.outputHandler.write( "\r\n[INFO CM Killed]\r\n" );
        this.compiler.kill();
        this.isStarted = false;
    }

    public reset() : Thenable<boolean> {
        this.compiler.kill();

        this.setupCompiler();

        this.clearOutputIfNeeded();
        this.isStarted = false;
        return this.start();
    }

    public clean() {
        this.outputHandler.clear();
        this.outputHandler.write( "Starting Clean...\r\n" );
        var results = this.compiler.clean();
        this.outputHandler.write( "[INFO make clean-cm:]\r\n" );
        this.outputHandler.write( "---------------------\r\n" );
        this.outputHandler.write( results );
        this.outputHandler.write( "---------------------\r\n" );
        this.outputHandler.write( "[INFO CM Clean]\r\n" );
        this.isStarted = false;
    }

    public compileFile( file : string ) {
        this.clearOutputIfNeeded();
        this.outputHandler.diagnostics.clear();
        this.startIfNotStarted().then((success) => {
            this.compiler.compileFile( file );
        });
    }

    public compileWorkspace() {
        this.startIfNotStarted().then( (succuess) => {
            cmConfig.currentWorkspace()
            .then( path => {
                path = this.convertVSCodePathToCM(path);
                this.run( `{ use cm.runtime.util; compileAllBelow(CompileAllEnv("${path}")); }` );
            })
            // const path = cmConfig.currentWorkspace()
            
        } );
    }

    public compileVSWorkspace() {
        this.startIfNotStarted().then( (succuess) => {
            var command = "";
            workspace.workspaceFolders.forEach( wf => {
                let path = this.convertVSCodePathToCM( wf.uri.fsPath );
                command += `compileAllBelow(CompileAllEnv("${path}"));`;
            });
            this.run( `{ use cm.runtime.util; ${command} }` );
        } );
    }

    public run( cmCode: string ) {
        this.clearOutputIfNeeded();
        this.outputHandler.diagnostics.clear();
        this.startIfNotStarted().then((success) => {
            this.compiler.write( cmCode );
        });
    }

    public runCurrentFile( file: string ) {
        this.clearOutputIfNeeded();
        this.outputHandler.diagnostics.clear();
        this.startIfNotStarted().then((success) => {
            this.compiler.runFile( file );
        });
    }

    public runIfStarted( cmCode: string ) {
        if ( this.isStarted ) {
            this.run( cmCode );
        }
    }

    public runStatement( statement: CodeStatement ): Thenable<boolean> {
        const parser = this.outputHandler.activeParser( CodeStatementParser );
        if ( parser ) {
            this.compiler.write( statement.code );
            return parser.setup( statement.successEx, statement.failureEx );
        }
    }

    public quitDebug() {
        this.compiler.quitDebug();
    }

    public loadAllKnown( file: string ) {
        this.outputHandler.diagnostics.clear();
        this.startIfNotStarted().then( (succuess) => {
            console.log(file);
            this.compiler.write(`loadAll("${file.replace(/\\/g, "/")}");`);
        });
    }



    public goto( file: string, offset: number ): Thenable<Location> {
        const parser = this.outputHandler.activeParser( GoToParser );
        if ( parser ) {
            file = file.replace( /\\/g, '/' ); // make sure we have the right slashses        
            this.compiler.write( `cm.runtime.refers("${file}", ${offset});` );
            return parser.setup();
        }

        return null;
    }

    public findAll( file: string, offset: number ) {
        const parser = this.outputHandler.activeParser( FindReferencesParserV2 );
        if ( parser ) {
            file = file.replace( /\\/g, '/' ); // make sure we have the right slashses        
            this.compiler.write( `cm.runtime.refers("${file}", ${offset});` );
        }
    }








    // PRIVATE METHODS

    private convertVSCodePathToCM( path : string ) {
        return path.replace( /\\/g, "/" ) + "/";
    }

    private clearOutputIfNeeded( skip = false ) {
        if ( skip ) return;
        if ( cmConfig.clearOutputOnBuild() ) {
            this.outputHandler.clear();
        }
    }

    private startIfNotStarted() : Thenable<boolean> {
        if( this.isStarted ) {
            return new Promise((resolve, reject) => { resolve(true); });
        }
        
        return this.start();
    }
}