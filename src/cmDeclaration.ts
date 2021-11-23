'use strict';

import vscode = require('vscode');
import { getCompiler } from './extension';

export class CMDefinitionProvider implements vscode.DefinitionProvider {
    private compiler = getCompiler();

    public provideDefinition( document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken ): Thenable<vscode.Location> { 
        if ( document.isDirty ) {
            var file = document.fileName;

            var promise = new Promise<vscode.Location>( (rsv, rj) => {
                document.save()
                .then( res => {
                    if (res) {
                        this.compiler.compileFile( file );
                        setTimeout( () => {
                            rsv( this.runDef( document, position ) );
                        }, 250 );
                    } else {
                        rj("save failed");
                    }
                }); 
            });

            return promise;
        } else {
            return this.runDef( document, position );
        }
    }

    private runDef( document: vscode.TextDocument, position: vscode.Position ): Thenable<vscode.Location> {
        var file = document.fileName;
        var offset = document.offsetAt( position );
        offset += 1 - position.line; // emacs is 1 based, and it treats line end as 1 character not 2
        return this.compiler.goto( file, offset );

    }
}