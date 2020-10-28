'use strict';

export class LineParser {
    isActive: boolean;
    exclusive: boolean;

    activate()  {
        this.isActive = true;
    }

    parse(line: string): string {
        return line;
    }
    
    complete() { }
} 