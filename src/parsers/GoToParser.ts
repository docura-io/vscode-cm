'use strict';

import { Location, Position, Range, Uri, workspace } from 'vscode'
import { LineParser } from './LineParser';

export class GoToParser extends LineParser {
    isActive = false;
    exclusive = true;

    private readonly gotoRegex = /\(cm-goto-def "(.[^"]+)"\s(\d+)/;
    private readonly pushDefRegex = /(?<!")([cC]:.*\.cm)\((\d+),\s(\d+)\)(.*)/;
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

                    this.finish( new Location( Uri.file( file ), position )  );
                });

                return null;
            }
            match = this.pushDefRegex.exec(line);
            // CM responded with the "findAll" response to the GoTo request.
            if ( match ) {
                const file = match[1];
                const line = +match[2];
                const col = +match[3];

                let uri = Uri.file(file);
                let startPos = new Position( line-1, 0 );
                let endPos = new Position( line-1, col );

                this.finish( new Location( Uri.file( file ), new Range( startPos, endPos ) ) );

                return null;
            }
        }
        return line;
    }

    finish( loc: Location ) {
        if ( this.goToPromise && this.goToResolver ) {
            this.goToResolver( loc );
        } else {
            this.goToRejector( 'no promise for go to def' );
        }
        this.complete();
    }

    public complete() {
        this.reset();
    }
}