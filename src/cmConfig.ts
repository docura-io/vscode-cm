'use strict';

import vscode = require('vscode');

export class cmConfig {
    
    static LangName = "cm";
    static root: string = null;
    
    static isDebug(): boolean {
        return this.getConfig()["debugMode"];
    }
    
    static cmAutoCompleteEnabled(): boolean {
        let isEnabled = this.getConfig()["enableIntellisense"]; 
        if ( typeof isEnabled !== "boolean" ) {
            isEnabled = true;
        }
        return isEnabled;
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
            const match = vscode.workspace.rootPath.match( /.*(?=\\home\\)/ );
            this.root = this.getConfig()["root"];
            if ( this.root == "auto" && match.length > 0 ) {
                console.log("CM Root Auto Mode - Using Path '" + match.toString() + "'");
                this.root = match.toString();
            }
        }
        return this.root;
    }
    
    static cmPath(): string {
        return this.cmRoot() + "\\home";
    }
    
    static apiUrl(): string { 
        return this.getConfig()["apiUrl"];
    }
    
    static definitionUrl( usings: string, statement: string ): string {
        var url = `${this.apiUrl()}definition?usings=${usings}&statement=${statement}`;
        return url;
    }
    
    static completionUrl( usings: string, statement: string ): string {
        var url = `${this.apiUrl()}autocomplete?usings=${usings}&statement=${statement}`;
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