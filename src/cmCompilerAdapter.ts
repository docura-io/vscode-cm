'use strict';

import { cmConfig } from './cmConfig'
import { cmOutputHandlerBase } from './cmOutputHandler'
import { DiagnosticCollection, Location, window, workspace } from 'vscode'
import { stat } from 'fs';

let compilerContainer = require("node-cm/index.js");

export interface ICMCompilerAdapter {
    readonly isStarted: boolean;

    start() : Thenable<boolean>;
    stop() : void;
    reset() : Thenable<boolean>;
    clean() : void;
    compileFile( file : string );

    show() : void;

    compileWorkspace() : void;
    compileVSWorkspace() : void;

    run( cmCode: string ) : void;
    runCurrentFile( file: string ) : void;
    runIfStarted( cmCode: string ) : void;
    runStatement( statement: CodeStatement ): Thenable<boolean>;

    quitDebug() : void;
    loadAllKnown( file: string ) : void;

    goto( file: string, offset: number ) : Thenable<Location>;
    findAll( file: string, offset: number );

}

export interface CodeStatement {
    // should start compiler if not started
    start: boolean; 
    // code to execute
    code: string;
    // regex to match for "success"
    successEx: RegExp;
    // regex to match for "failure"
    failureEx: RegExp;
    // should clear output
    doNotClear: boolean;
}

export class cmCompilerAdapter implements ICMCompilerAdapter {
    public outputHandler : cmOutputHandlerBase;
    private compiler;
    public isStarted : boolean = false;

    constructor( diagnostics: DiagnosticCollection ) {
        this.outputHandler= new cmOutputHandlerBase( diagnostics );
        this.setupCompiler();
    }

    private setupCompiler() {
        this.compiler = new compilerContainer( {
            cmRoot: cmConfig.cmRoot(),
            gitMode: true,
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
                this.outputHandler.show();
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

    
    show() : void {
        this.outputHandler.show();
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
        // const parser = this.outputHandler.activeParser( CodeStatementParser );
        // if ( parser ) {
        //     this.compiler.write( statement.code );
        //     return parser.setup( statement.successEx, statement.failureEx );
        // }

        this.compiler.write( statement.code );
        return new Promise<boolean>( ( res, rej ) => {
            this.outputHandler.pushExtras( 
                {
                    "successEx": statement.successEx,
                    "failureEx": statement.failureEx,
                    "acResolver": res, 
                    "acRejector": rej 
                } );
        }).finally( () => {
            // clean up
            this.outputHandler.pushExtras( 
                {
                    "successEx": null,
                    "failureEx": null,
                    "acResolver": null, 
                    "acRejector": null 
                } );
        });

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
        file = file.replace( /\\/g, '/' ); // make sure we have the right slashses        
        var extras: any = {};
        this.compiler.write( `cm.runtime.refers("${file}", ${offset});` );
        return new Promise<Location>( ( res, rej ) => {
            this.outputHandler.pushExtras( { "goToResolver": res, "goToRejector": rej } );
        }).finally( () => {
            // clean up
            this.outputHandler.pushExtras( { "goToResolver": null, "goToRejector": null  } );
        });
        
    }

    public findAll( file: string, offset: number ) : Thenable<Location[]> {
        file = file.replace( /\\/g, '/' ); // make sure we have the right slashses        
        this.compiler.write( `cm.runtime.refers("${file}", ${offset});` );
        return new Promise<Location[]>( (res,rej) => {
            this.outputHandler.pushExtras( { "findRefResolver": res, "findRefRejector": rej } );
        }).finally( () => {
            this.outputHandler.pushExtras( { "findRefResolver": null, "findRefRejector": null } );
        })
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