'use strict';

import vscode = require('vscode');

export class cmConfig {
    
    static LangName = "cm";
    
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
    
    static cmRoot(): string {
        return this.getConfig()["root"];
    }
    
    static cmPath(): string {
        return this.cmRoot() + "\\home";
    }
    
    static apiUrl(): string { 
        return this.getConfig()["apiUrl"];
    }
    
    static definitionUrl( usings: string, statement: string ): string {
        var url = `${this.apiUrl()}/definition?usings=${usings}&statement=${statement}`;
        return url;
    }
    
    static completionUrl( usings: string, statement: string ): string {
        var url = `${this.apiUrl()}/autocomplete?usings=${usings}&statement=${statement}`;
        return url;
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