'use strict';

import { Range, TextEditorRevealType, window, workspace } from "vscode";
import { LineParser } from "./LineParser";

const cetAltClickRegex = /'\(cm-show-file-at-pos-selected-window\s"(.*)"\s(\d+)\)\)/;

export class AltClickParser extends LineParser {
    exclusive = false;
    isActive = false;
    
    constructor() {
        super();
        this.activate(); // is always active
    }

    parse( line: string ): string {
        let match = cetAltClickRegex.exec( line );
        if ( match ) {
            this.goToFileLocation( match[1], parseInt(match[2]) );
        }
        return line;
    }

    private goToFileLocation( file:string, offset: number ) {
        workspace.openTextDocument( file )
            .then( (doc) => {
                var position = doc.positionAt( offset );
                position = doc.positionAt( offset + position.line );
                
                window.showTextDocument( doc )
                    .then( editor => {
                        editor.revealRange( new Range( position, position ), TextEditorRevealType.InCenter ); 
                    });
            } );
    }
}