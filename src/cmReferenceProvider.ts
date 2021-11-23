'use strict';

import {
    CancellationToken,
    Location,
    Position,
    ProviderResult,
    ReferenceContext,
    ReferenceProvider,
    TextDocument,
    Uri,
    Range
} from 'vscode';


import { cmConfig } from './cmConfig'
import { getCompiler } from './extension';

export class CMReferenceProvider implements ReferenceProvider {
    private compiler = getCompiler();

    provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): ProviderResult<Location[]> {
        return this.findReferences(document, position);
    }

    private findReferences( document: TextDocument, position: Position ) {
        var file = document.fileName;
        var offset = document.offsetAt( position );
        offset += 1 - position.line; // emacs is 1 based, and it treats line end as 1 character not 2
        file = file.replace( /\\/g, '/' );
        // this.compiler.channel.write( "[Find All Invoked]\n");
        
        return this.compiler.findAll( file, offset );
        // return this.compiler.run( `cm.runtime.refers("${file}", ${offset});` );
        // return this.compiler.goto( file, offset );
    }
}