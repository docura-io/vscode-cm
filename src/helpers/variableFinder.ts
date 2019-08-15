'use strict';

import fs = require('fs');

export class VariableFindResult {
    line: number;
    type: string;
}

export class VariableFinder {
    
     findDefinitionInFile( file: string, variable: string ): PromiseLike<VariableFindResult[]> {
         return new Promise( (resolve, reject) => {
             fs.readFile( file, "utf-8", (err,data) => {
                var matches = this.findDefinitionInText( data, variable );
                return resolve( matches );
            } );
         } );
    }
    
    findDefinitionInText( content: string, variable: string ): VariableFindResult[] {
        var pattern = `([\\w+->]+)\\s+(\\w+\\s*,\\s*)?${variable}\\s*(,|;|=|\\(\\))`;
                
        // var pattern = `^\\s*?(\\w+)\\s+${variable}\\s*?(;|=|\\(\\))`;
        //var pattern = `^\\s*?(\\w+)\\s+(\\w+\\s*,\\s*)?${variable}\\s*(,|;|=|\\(\\))`;
        try {
            var regex = new RegExp( pattern, "gmi" );     
            var match, matches: VariableFindResult[] = [];
            
            while ((match = regex.exec(content)) != null) {
                matches.push( { line: match.index, type: match[1] } );
            }
            
            matches.forEach( (item) => {
                var split = content.substr( 0, item.line ).split(/\r\n|\r|\n/, -1);
                item.line = split.length;
            } );
            
            return matches;
        } 
        catch (e) 
        {
            return [];
        }
    }
}