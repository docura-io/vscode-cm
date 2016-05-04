'use strict';

import vscode = require('vscode');

var fs = require('fs');

import { IndexContainer } from './cmIndex';
import { cmConfig } from './cmConfig';
import { cmUtils } from './cmUtils';

let indexCode = `
package {CurPackage};

{
    use cm.runtime;
    use cm.io;
    use cm.format.json;
    
    str[] items = {Packages};
    
    symbol{} symbols();
    
    for( s in items ) {
        symbols << s.symbol;
    }
    
    JsonArray array();
    
    for( c in classes( symbols, {symbol:}, includeAllParents=true) ) {
        if ( c.name != "Object" and  !c.name.contains("{}") ) {
            
            JsonObject obj();
            
            obj.put( "parent", c.pkg().toS # "." # c.name );
            
            if ( true ) {
                JsonArray children();

                for( f in c.methods(true) ) {
                    str returnId = f.returnType().pkg().toS.substringAfter( "#", false ) # "." # f.returnType();
                
                    JsonObject item();
                    item.put("type", "method");
                    item.put("detail", f.signatureToS);
                    item.put("returns", returnId );
                    item.put("label", f.name);

                    children << item;
                }
                
                for (f in c.fields(true)) {
                    str returnId = f.type().pkg().toS.substringAfter( "#", false ) # "." # f.type();
                    
                    JsonObject item();
                    item.put("type", "property");
                    item.put("detail", f.type() # " " # f.name );
                    item.put("returns", returnId );
                    item.put("label", f.name);
                    
                    children << item;    
                }
                
                obj.put( "items", children );
            }
            
            array << obj;
        }
    }
    
    File f = cmWritable("test.json").openForWrite();
    array.output( new Utf8StreamOutput(f));
    f.close();
    
    pln("[VSCODE][AutoComplete]:"#f.path);
}
`;

const indexCodeUsings = [
    "cm.runtime",
    "cm.io",
    "cm.format.json"
];

export class LiveAutoCompleteIndexer {
    
    private static _instance:LiveAutoCompleteIndexer;
    
    private index: IndexContainer;
    
    constructor() {
        this.index = IndexContainer.getInstance();
        LiveAutoCompleteIndexer._instance = this;
    }
    
    private autoCompleteCMFile(): string {
        return vscode.workspace.rootPath + '\\acloader.cm';
    }
    
    public static getInstance(): LiveAutoCompleteIndexer
    {
        return LiveAutoCompleteIndexer._instance;
    }
    
    public start( run: (file: string) => void ) {
        var contents = indexCode;
        contents = contents.replace( '{Packages}', JSON.stringify( cmUtils.getPackagesInCurrentPackage() ) );
        contents = contents.replace( '{CurPackage}', cmUtils.getCurrentPackage() );
        
        // get usings
        // let injectUsings = indexCodeUsings;
        // let declaredUsings = cmUtils.packageFileUsings();
        
        // injectUsings = injectUsings.filter( (i) => {
        //    return declaredUsings.indexOf( i ) < 0; 
        // });
        
        // injectUsings.forEach( (i, ind) => {
        //     injectUsings[ind] = "use " + i + ";";
        // } );
        
        // contents = contents.replace( "{usings}", injectUsings.join( "\r\n" ) );
        // contents = contents.replace( "{usings}", injectUsings.join( "\r\n" ) );
        
        fs.writeFile( this.autoCompleteCMFile(), contents, (err) => {
            run( this.autoCompleteCMFile() );
        } );
    }
    
    public clearIndex() {
        this.index.purge();
    }
    
    public readACFile( fUrl ) {
        if ( !cmConfig.isDebug() ) { // debug to leave the file
            fs.unlink( this.autoCompleteCMFile(), (err) => {
                if ( err ) console.log(err);
            } );
        }
        fs.readFile( fUrl, (err, data) => {
            var obj = JSON.parse( data );
            
            obj.forEach( (i) => {
                this.receivedItem( i );
            })
        });
    }
    
    public receivedItem( item ) {
        
        var parsedId = item.parent.substring(1);
        
        this.index.remove( parsedId ); // clear the current item
        
        let className = parsedId.substring( parsedId.lastIndexOf( '.' ) + 1 );
        
        this.index.add( parsedId, {
            id: parsedId,
            type: 'class',
            label: className,
            return: parsedId,
            detail: `public class ${className} { ... }`
        } );
        
        item.items.forEach( (entry) => {
            entry.detail = entry.detail.replace( /Object this,?\s?/, '' );
            var detailParsed = entry.detail.substring( entry.detail.indexOf( ' ' ) + 1 );
            this.index.add( parsedId, {
                id: parsedId + "." + detailParsed,
                type: entry.type,
                label: entry.label,
                return: entry.returns,
                detail: entry.detail
            } );
        } );
    }
}