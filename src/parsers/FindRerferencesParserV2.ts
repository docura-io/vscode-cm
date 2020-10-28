'use strict';

import { refProvider } from '../cmGlobals';
import { SrcRefParser } from "./SrcRefParsers";


export class FindReferencesParserV2 extends SrcRefParser {
    exclusive = true;

    private foundStart = false;

    private readonly startR = /\(cm-push-def\s"[^"]*"\s\d+\)/g;
    private readonly endR = /'cm-next-error\)/g;

    activate() {
        this.isActive = true;
    }

    reset() {
        this.foundStart = false;
    }

    parse(line: string): string {
        if ( this.isActive ) {
            if ( !this.foundStart ) {
                let match = this.startR.exec( line );
                if ( match ) {
                    this.foundStart = true;
                    return "Found References:";
                }
            } else {
                let match = this.endR.exec(line);
                if ( match ) {
                    this.isActive = false;
                    this.complete()
                    return null;
                }
                return super.parse(line);
            }
        }
        return line;
    }

    complete() {
        //TODO: Handle Stupid case find def responds as a Find All...
        // let first = refProvider.first();
        refProvider.complete();
        this.reset();
    }

    public didMatch( file: string, line: number, column: number, rest: string ) {
        // eventually add to somethign like find all ref cache
        refProvider.addReference( file, line, column );
    }
}