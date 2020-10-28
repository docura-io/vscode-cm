'use strict';

import { Location, Position, Range, Uri, workspace } from 'vscode'
import { refProvider } from '../cmGlobals';
import { LineParser } from './LineParser';

export class GoToParser extends LineParser {
    isActive = false;
    exclusive = true;

    private readonly gotoRegex = /\(cm-goto-def "(.[^"]+)"\s(\d+)/;
    private goToPromise: Thenable<Location>;
    public goToResolver: (value?: {} | Location | PromiseLike<{}>) => void;
    private goToRejector: (value?: {} | PromiseLike<{}>) => void;
    private loc : Location;
    
    public setup() : Thenable<Location> {
        return this.goToPromise = new Promise( (res, rej ) => {
            this.goToResolver = res;
            this.goToRejector = rej;
        } );
    }

    private reset() {
        this.goToPromise = null;
        this.goToResolver = null;
        this.goToRejector = null;
    }

    public parse( line: string ): string {
        if ( this.isActive ) {
            let match = this.gotoRegex.exec(line);
            if ( match ) {
                this.isActive = false;
                var file = match[1];
                var offset = parseInt( match[2] );

                workspace.openTextDocument( file )
                .then( (doc) => {
                    var position = doc.positionAt( offset );
                    position = doc.positionAt( offset + position.line );

                    if ( this.goToPromise && this.goToResolver ) {
                        this.goToResolver( new Location( Uri.file( file ), position ) );
                    } else {
                        this.goToRejector( 'no promise for go to def' );
                    }
                    this.complete();
                });

                return null;
            }
        }
        return line;
    }

    public complete() {
        this.reset();
    }
}