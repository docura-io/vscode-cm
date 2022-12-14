'use strict';

import vscode = require('vscode');
import { getCompiler } from './extension';
import fs = require('fs');
import path = require('path');
import { CmTextParser } from './cmTextParser';
import { json } from 'stream/consumers';
var cmEnterRules = require("./cmEnterRules");
import json5 from "json5/dist/index.mjs";

export class cmConfig {

    private parser: CmTextParser;
    private commentConfig = new Map();
    private languageConfigFiles = new Map();
    
    static LangName = "cm";
    static root: string = null;

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

    static cmPath(): string {
        return this.cmRoot() + "\\base";
    }

    static arch(): string {
        return "win64";
    }

    static rsWatcherEnabled(): Boolean {
        return this.getConfig()["rsSaveWatch"];
    }

    static useNewSyntax(): Boolean {
        let useNewSyntax = this.getConfig()["newSyntax"]; 
        if ( typeof useNewSyntax !== "boolean" ) {
            useNewSyntax = false;
        }
        return useNewSyntax;
    }
    
    static emacsClientExe() {
        return this.getConfig()["emacsclientexe"];
    }
    
    static emacsServerFile() {
        return this.getConfig()["emacsserverfile"];
    }
    
    private static getConfig() {
        return vscode.workspace.getConfiguration(this.LangName);
    }

    
    /**
     * Set Parser
     * 
     * set the text parser that is used for multi line comments. 
     */
    public setParser(newParser:CmTextParser) {
        this.parser = newParser;
    }


    /**
     * Configure Comment Blocks.
     * 
     * This is used to push on enter rules for comment blocks.
     */
    public configureCommentBlocks(context) {
        
        var disposable = this.setLanguageConfiguration(true, context);
        
        if (context?.subscriptions) {
            context.subscriptions.push(disposable);
        }
    }

    public GetCommentConfiguration(languageCode) {
        // * check if the language config has already been loaded
        if (this.commentConfig.has(languageCode)) {
            
            return this.commentConfig.get(languageCode);
        }
        // * if no config exists for this language, back out and leave the language unsupported
        if (!this.languageConfigFiles.has(languageCode)) {            
            return undefined;
        }
        try {
            // Get the filepath from the map
            var filePath = this.languageConfigFiles.get(languageCode);
            
            var content = fs.readFileSync(filePath, 'utf8');
            
            // use json5, because the config can contains comments
            var config = json5.parse(content);
            this.commentConfig.set(languageCode, config.comments);
            return config.comments;
        }
        catch (error) {
            this.commentConfig.set(languageCode, undefined);
            return undefined;
        }
    };


    /* 
     * Check if the cursor location is located within a block comment. 
     */
    public isWithinMultiLineComment (event) {    
            
        if (event) {            
            if (event.selections) {                                
                if(this.parser.checkIfInComment(vscode.window.activeTextEditor, event.selections[0].active)) {                    
                    return true;
                }
            }
        }
        return false;
    };


    /**
     * Set Single Line Comments.
     * 
     * Uses the text parser class to find and update the visuals for single line comments. 
     */
    public setSingleLineComments() {
        this.parser.FindSingleLineComments(vscode.window.activeTextEditor);        
    }


    /**
     * Set Language Configuration.
     * 
     * This function returns the language configuration with the on enter rules that should
     * be applied for it.
     */
    public setLanguageConfiguration (multiLine, event) {
        this.updateLanguagesDefinitions();
        var langConfig = {
            onEnterRules: []
        };
        if (multiLine) {            
            if (this.isWithinMultiLineComment(event)) {                
                langConfig.onEnterRules = langConfig.onEnterRules.concat(cmEnterRules.Rules.multilineEnterRules);
            }
        }

        langConfig.onEnterRules = langConfig.onEnterRules.concat(cmEnterRules.Rules.endCommentEnterRules);
        return vscode.languages.setLanguageConfiguration("cm", langConfig);
    }


    public updateLanguagesDefinitions () {
        this.commentConfig.clear();
        for (var _i = 0, _a = vscode.extensions.all; _i < _a.length; _i++) {
            var extension = _a[_i];
            var packageJSON = extension.packageJSON;
            if (packageJSON.contributes && packageJSON.contributes.languages) {
                for (var _b = 0, _c = packageJSON.contributes.languages; _b < _c.length; _b++) {
                    var language = _c[_b];
                    if (language.configuration) {
                        
                        var configPath = path.join(extension.extensionPath, language.configuration);
                        
                        this.languageConfigFiles.set(language.id, configPath);
                    }
                }
            }
        }
    }
}