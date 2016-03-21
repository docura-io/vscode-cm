'use strict';

import { HoverProvider, Hover, TextDocument, Position, CancellationToken } from 'vscode';
import { VariableFinder, VariableFindResult } from 'cm-modules/findDefinition/variableFinder';


export class CMHoverProvider implements HoverProvider {
    public provideHover( document: TextDocument, position: Position, token: CancellationToken): Thenable<Hover> {
        return new Promise( (resolve, reject) => {
            
            let wordRange = document.getWordRangeAtPosition( position );
            let word = document.getText( wordRange )
            
            var finder = new VariableFinder();
            var results = finder.findDefinitionInText( document.getText(), word );
            
            if( results.length > 0 ) {
                let hover = new Hover( {language: 'cm', value: `${results[0].type} ${word}` } );
                resolve( hover ); 
            } else {
                resolve();
            }
        });
    }
}