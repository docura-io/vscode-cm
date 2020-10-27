'use strict';

import { refProvider } from '../cmGlobals';
import { cmOutputChannel } from '../cmOutputChannel';
import { ICMOutputer } from '../cmOutputHandler';
import { LineParser } from './LineParser';

const srcMatch = /([cC]:.*\.cm)\((\d+),\s(\d+)\)(.*)/g;

export class SrcRefParser implements LineParser {
    isActive = false;    
    exclusive = false;
    started = null;

    public parse( line: string ): string {
        let lineM = srcMatch.exec( line );
        if ( lineM ) {
            // probably add to the find all referenc cache
            this.didMatch( lineM[1], +lineM[2], +lineM[3], lineM[4] );
            return lineM[1]+"("+lineM[2]+","+lineM[3]+"): "+lineM[4];
        }
        return line;
    }

    public complete() {}

    public didMatch( file: string, line: number, column: number, rest: string ) {}
}

export class FindReferencesParser extends SrcRefParser {
    exclusive = true;
    private channel: cmOutputChannel;

    private readonly startR = /\(cm-push-def\s"[^"]*"\s\d+\)/g;
    // private readonly startR = /\[Find\sAll\sInvoked\]/g;
    private readonly endR = /'cm-next-error\)/g;

    constructor( c: cmOutputChannel ) {
        super();
        this.channel = c;
    }
    
    public parse( line: string ): string {
        if ( !this.isActive ) {
            // see if it should activate
            let match = this.startR.exec(line);
            if ( match ) {
                this.isActive = true;
                this.started = Date.now();
                return "Found References:";
            }
            return line;
        } else {
            let end = this.endR.exec(line);
            if ( end ) {
                this.isActive = false;
                this.complete();
                return null;
            }
            // parse the line
            return super.parse(line);
        }
    }

    public complete() {
        let gotoRes = this.channel.goToResolver;
        let first = refProvider.first();
        if ( gotoRes != null && first != null ) {
            // we need to clear the cache so if we get the Find All Ref's result again for
            // a go to def, we don't want to keep sending the same result
            refProvider.clearCache();
            gotoRes( first );
        } else {
            refProvider.complete();
        }
    }

    public didMatch( file: string, line: number, column: number, rest: string ) {
        // eventually add to somethign like find all ref cache
        refProvider.addReference( file, line, column );
    }
}