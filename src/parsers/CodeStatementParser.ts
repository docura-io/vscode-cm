'use strict';

import { fail } from "assert";
import { LineParser } from "./LineParser";

export class CodeStatementParser extends LineParser {
    isActive = false;
    exclusive = true;

    private successEx: RegExp;
    private failureEx: RegExp;

    private resolve: (value?: {} | PromiseLike<{}>) => void;
    private reject: (value?: {} | PromiseLike<{}>) => void;

    setup( success: RegExp, failure: RegExp ) : Thenable<boolean> {
        this.successEx = success;
        this.failureEx = failure;

        return new Promise( (res,rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }

    reset() {
        this.successEx = null;
        this.failureEx = null;
        this.resolve = null;
        this.reject = null;
    }

    parse(line: string): string {
        if ( this.isActive ) {
            if ( this.successEx.test( line ) ) {
                this.resolve();
                this.complete();
            } else if ( this.failureEx.test( line ) ) {
                this.reject();
                this.complete();
            }
        }
        return line;
    }
    
    complete() {
        this.isActive = false;
        this.reset();
    }

}