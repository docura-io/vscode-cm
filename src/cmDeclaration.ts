'use strict';

import vscode = require('vscode');
import { getCompiler } from './extension';

export class CMDefinitionProvider implements vscode.DefinitionProvider {
    
    /**
     * 1. Split line on dots (.)
     * 2. If count == 1, check for local variable with that name, DONE
     * 3. Get type of first part
     * - FUTURE 4. foreach item after first, find type
     * 4. Call Web Service with 1st part and 2nd part
     */
    
    private compiler = getCompiler();
    
    public provideDefinition( document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken ): Thenable<vscode.Location> { 
        
        // return new Promise( (resolve, reject) => {
        //     var loc = new vscode.Location(
        //         vscode.Uri.file( "c:\\CetDev\\version6.5-_build-train\\home\\cm\\core\\snapper.cm" ),
        //         // document.uri,
        //         new vscode.Range( 
        //             new vscode.Position( 1, 0 ),
        //             new vscode.Position( 1, 5 ) )
        //     );
        //     resolve( loc );
        // });

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