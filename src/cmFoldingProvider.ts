'use strict';

import { CancellationToken, FoldingContext, FoldingRange, FoldingRangeKind, FoldingRangeProvider, Position, ProviderResult, TextDocument } from 'vscode';

export class CMFoldingProvider implements FoldingRangeProvider {

    provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): ProviderResult<FoldingRange[]> {

        // const regex = /(?=\{((?:[^{}]++|\{(?1)\})++)\})/g;

        
        let folds : FoldingRange[] = [
            new FoldingRange( 0, 34, FoldingRangeKind.Imports )
        ];
        
        // console.log( "here I am");

        // let text = document.getText();
        // var result : RegExpExecArray;

        // while( ( result = regex.exec(text) ) !== null ) {
        //     let index = result.index;
        //     let endIndex = index + result[0].length;

        //     let start = document.positionAt( index );
        //     let end = document.positionAt( endIndex );

        //     folds.push( new FoldingRange( start.line, end.line ) );
        // }

        return folds;
    }
}