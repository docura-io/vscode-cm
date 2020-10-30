'use strict';

import { LineParser } from "./LineParser";

const noise = [
    /\(cm-defer\s'cm-next-error\)/,
    "", // STX
    "", // SOH
]

export class NoiseRemoverParser extends LineParser {
    exclusive = false;
    isActive = false;
    
    constructor() {
        super();
        this.activate(); // is always active
    }

    parse( line: string ) {
        for (const n of noise) {
            line = line.replace( n, '' );
        }

        if ( line && line == '' ) {
            return null;
        }
        return line;
    }
}