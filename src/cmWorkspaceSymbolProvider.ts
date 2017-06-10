'use strict';

import * as vscode from 'vscode';

const path = require("path");

import {TextDocument, CancellationToken, ProviderResult} from 'vscode';

export class CMWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
    public provideWorkspaceSymbols(query: string, token: CancellationToken): Thenable<vscode.SymbolInformation[]> {
        let symbols: vscode.SymbolInformation[] = [];

        symbols.push( new vscode.SymbolInformation( 
            "Symbol 1", 
            vscode.SymbolKind.Method, 
            "test2.txt", 
            new vscode.Location( 
                vscode.Uri.file( path.join( vscode.workspace.rootPath, "test.txt" ) ), 
                new vscode.Position( 4, 0 ) 
            ) 
        ) );

        symbols.push( new vscode.SymbolInformation( 
            "Symbol 2", 
            vscode.SymbolKind.Method, 
            "", 
            new vscode.Location( 
                vscode.Uri.file( path.join( vscode.workspace.rootPath, "test.txt" ) ), 
                new vscode.Position( 9, 0 ) 
            ) 
        ) );

        return Promise.resolve(symbols);
    }
/*
    public resolveWorkspaceSymbol(symbol: SymbolInformation, token: CancellationToken): ProviderResult {

    }
    */
}