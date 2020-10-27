'use strict';

import * as vscode from 'vscode';

const path = require("path");
const fs = require("fs");
const lineReader = require("line-reader");

import {TextDocument, CancellationToken, ProviderResult} from 'vscode';

export class CMWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
    public provideWorkspaceSymbols(query: string, token: CancellationToken): Thenable<vscode.SymbolInformation[]> {
        let symbols: vscode.SymbolInformation[] = [];

        // symbols.push( new vscode.SymbolInformation( 
        //     "Symbol 1", 
        //     vscode.SymbolKind.Method, 
        //     "test2.txt", 
        //     new vscode.Location( 
        //         vscode.Uri.file( path.join( vscode.workspace.rootPath, "test.txt" ) ), 
        //         new vscode.Position( 4, 0 ) 
        //     ) 
        // ) );

        // symbols.push( new vscode.SymbolInformation( 
        //     "Symbol 2", 
        //     vscode.SymbolKind.Method, 
        //     "", 
        //     new vscode.Location( 
        //         vscode.Uri.file( path.join( vscode.workspace.rootPath, "test.txt" ) ), 
        //         new vscode.Position( 9, 0 ) 
        //     ) 
        // ) );
        return this.readLocalTAGS(symbols);
    }
/*
    public resolveWorkspaceSymbol(symbol: SymbolInformation, token: CancellationToken): ProviderResult {

    }
    */

    private readLocalTAGS(symbols: vscode.SymbolInformation[]) : Thenable<vscode.SymbolInformation[]> {
        const dir = path.parse( vscode.window.activeTextEditor.document.uri.fsPath ).dir;
        let tagFile = path.join( dir, 'TAGS' );

        // console.log(tagFile);

        return new Promise( (res,rej) => {
            var currentFile = "";

            lineReader.eachLine( tagFile, ( line: string, last: boolean ) => {
                if ( last ) {
                    res(symbols);
                }

                if ( line.trim() == "" ) {
                    currentFile = "";
                    return;
                }
    
                if ( currentFile == "" ) {
                    currentFile = path.join( dir, line.substring( 0, line.indexOf(",") ) );
                } else {
                    if ( line.indexOf("package ") == 0 || line.indexOf("use ") == 0 ) {
                        return;
                    }
                    // var match = /(public|private|package)\sclass\s([^\s]+)[^\d]+(\d+),(\d+)/.exec(line);
                    var match = /(private|public|package)\s+(const)?\s?(\w+)\s+(\w+\(?)[^\d]+(\d+),(\d+)/.exec(line);
                    if ( match ) {
                        let kind = vscode.SymbolKind.Variable;
                        let name = match[4];
                        const isMethod = match[4].indexOf("(") > -1;
                        
                        if ( match[3] == "class" ) kind = vscode.SymbolKind.Class;
                        else if( isMethod ) {
                            kind = vscode.SymbolKind.Method;
                            name = name.substring(0, match[4].indexOf("(") );
                        }

                        let index = line.indexOf(match[4]);
                        symbols.push( new vscode.SymbolInformation(
                            name,
                            kind,
                            "Container",
                            new vscode.Location( vscode.Uri.file( currentFile ), new vscode.Position( +match[5]-1, index ) )
                        ) );
                    }
                }
    
                // console.log(line);
            } );
        });
    }
}