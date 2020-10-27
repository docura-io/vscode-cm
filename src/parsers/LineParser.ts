'use strict';

export interface LineParser {
    isActive: boolean;
    exclusive: boolean;
    started: number;
    parse(line: string): string; // if active, parse it
    complete();
}