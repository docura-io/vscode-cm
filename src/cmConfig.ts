'use strict';

import vscode = require('vscode');
import { getCompiler } from './extension';
import fs = require('fs');
import path = require('path');

export class cmConfig {
    
    static LangName = "cm";
    static root: string = null;
    
    static isDebug(): boolean {
        return this.getConfig()["debugMode"];
    }

    static currentWorkspace(): Thenable<string> {
        if ( vscode.workspace.workspaceFolders ) {
            if ( vscode.workspace.workspaceFolders.length == 1 ) {
                let path = vscode.workspace.workspaceFolders[0].uri.fsPath;
                return Promise.resolve(path);
            } else {
                return vscode.window.showWorkspaceFolderPick()
                .then( choice => {
                    return choice.uri.fsPath;
                } );
                
                // return vscode.workspace.workspaceFolders[0].uri.path;
            }
        } else {
            return Promise.resolve(vscode.workspace.rootPath);
        }
    }

    static cmAutoComplete80Enabled(): boolean {
        let isEnabled = this.getConfig()["autoComplete80Enabled"]; 
        if ( typeof isEnabled !== "boolean" ) {
            isEnabled = false;
        }
        return isEnabled;
    }

    static clearOutputOnBuild(): boolean {
        let isEnabled = this.getConfig()["clearOutputBuild"]; 
        if ( typeof isEnabled !== "boolean" ) {
            isEnabled = false;
        }
        return isEnabled;
    }
    
    static cmOutputFilePath(): string {
        return this.getConfig()["outputFilePath"];
    }
    
    static cmRoot(): string {
        if ( !this.root ) {
            // this needs to be a bit smarter, but for now we use the first folder
            const match = vscode.workspace.workspaceFolders[0].uri.fsPath.match( /.*(?=\\home\\|\\base\\|\\extensions\\|\\personal\\)/ );
            this.root = this.getConfig()["root"];
            if ( this.root == "auto" && match && match.length > 0 ) {
                console.log("CM Root Auto Mode - Using Path '" + match.toString() + "'");
                this.root = match.toString();
            }
        }
        return this.root;
    }
    
    static cmGitMode(): boolean {
        let force = this.getConfig()["gitMode"];
        if ( typeof force !== 'undefined' ) return force;
        // attempt to autodetect
        let root = this.cmRoot();
        return fs.existsSync( path.join(root, 'base' ) );
    }

    static cmPath(): string {
        return this.cmRoot() + (this.cmGitMode() ? "\\base" : "\\home");
    }
    
    static apiUrl(): string { 
        return this.getConfig()["apiUrl"];
    }

    static arch(): string {
        const arch = this.getConfig()["arch"];
        return arch == null || arch == "" ? "win64" : arch;
    }

    static setArch( val: string ): Thenable<void> {
        // if ( val == "win64" ) {

        // } else {
            var con = vscode.workspace.getConfiguration(this.LangName);
            return con.update( "arch", val, false ).then( () => { }, 
            (err) => { console.log(err); } );
        // }
    }
    
    static definitionUrl( usings: string, statement: string ): string {
        var url = `${this.apiUrl()}definition?usings=${usings}&statement=${statement}`;
        return url;
    }

    static rsWatcherEnabled(): Boolean {
        return this.getConfig()["rsSaveWatch"];
    }
    
    static emacsClientExe() {
        return this.getConfig()["emacsclientexe"];
    }
    
    static emacsServerFile() {
        return this.getConfig()["emacsserverfile"];
    }
    
    private static getConfig() {
        return vscode.workspace.getConfiguration(this.LangName)
    }
    
}