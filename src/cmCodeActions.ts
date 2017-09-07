'use strict';

import vscode = require('vscode');

export class CmCodeActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(
        document: vscode.TextDocument, 
        range: vscode.Range, 
        context: vscode.CodeActionContext, 
        token: vscode.CancellationToken ): vscode.ProviderResult<vscode.Command[]> {
        
        const cmds = context.diagnostics.map( diag => {
            // when a package name is wrong, offer to fix it
            if ( diag.message.indexOf( "package '" ) > 0 && diag.message.indexOf( "' does not correspond to path '" ) > 0 ) {
                let [_,badPkg,newPkg] = /package\s'([^']*)'\sdoes\snot\scorrespond\sto\spath\s'([^']*)'/.exec( diag.message );

                return {
                    title: 'Fix package name',
                    command: 'cm.Test',
                    arguments: null
                };
            }
        } );
        
        return cmds;
    }
}