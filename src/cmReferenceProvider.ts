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


import { getCompiler } from './extension';

export class CMReferenceProvider implements ReferenceProvider {

    private cache: Location[];
    private pRes;
    private pRej;

    private compiler = getCompiler();

    provideReferences(document: TextDocument, position: Position, context: ReferenceContext, token: CancellationToken): ProviderResult<Location[]> {
        this.abort();
        return new Promise( (res, rej ) => {
            this.pRes = res;
            this.pRej = rej;

            // actually invoke thie thing
            return this.findReferences(document, position);
        });
    }

    complete() {
        this.pRes( this.cache );
        this.pRes = null;
        this.pRej = null;
    }

    abort() {
        if ( this.pRej ) this.pRej();
        this.clearCache();
        this.pRes = null;
        this.pRej = null;
    }

    addReference( file: string, line: number, column: number ) {
        let uri = Uri.file(file);
        let startPos = new Position( line-1, 0 );
        let endPos = new Position( line-1, column );
        this.cache.push( new Location( uri, new Range(startPos, endPos ) ) );
    }

    clearCache() {
        this.cache = [];
    }

    private findReferences( document: TextDocument, position: Position ) {
        var file = document.fileName;
        var offset = document.offsetAt( position );
        offset += 1 - position.line; // emacs is 1 based, and it treats line end as 1 character not 2
        file = file.replace( /\\/g, '/' );
        return this.compiler.run( `cm.runtime.refers("${file}", ${offset});` );
        // return this.compiler.goto( file, offset );
    }
}