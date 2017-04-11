'use strict';

import vscode = require('vscode');
import { cmConfig } from './cmConfig';

var fs = require('fs');

export class IndexContainer {
    
    private static _instance:IndexContainer = new IndexContainer();
    private index:any = {};
    private changed:boolean = false;
    
    private intervalHandle: NodeJS.Timer;
    
    /**
     * Creates or gets the current singleton
     */
    constructor() {
        if ( IndexContainer._instance ) {
            throw new Error( 'Cannot initialize "IndexContainer" use getInstance() instead');
        }
        IndexContainer._instance = this;
        
        if ( cmConfig.isDebug() ) {
            this.intervalHandle = setInterval( () => { this.writeOutIndex(); }, 5000 );
        }
    }
    
    /**
     * Gets the current instance of the IndexContainer
     */
    public static getInstance():IndexContainer
    {
        return IndexContainer._instance;
    }
    
    /**
     * Purges the index contents
     */
    public purge() {
        this.changed = true;
        this.index = {};
    }
    
    /**
     * Adds a key to the current index
     */
    public add( key: string, data: any ) {
        this.changed = true;
        if ( this.index[key] == null ) {
            this.index[key] = [];
        }
        
        this.index[key].push( data );
    }
    
    /**
     * Gets a key from the current index
     */
    public get( type: string, term: string ): any[] {
        var items = [];
        let index = this.index;
        
        //console.log( "Type: ", type, " - Term: ", term );
        
        if ( !term || term == "" || term == "." ) {
            term = '\.';
        }
        
        if ( !type.endsWith( '.' ) && !term.startsWith( '.' ) ) {
            // if the namespaces don't end with a . and the term doens't start with a ., we need one
            term = '.' + term;
        }
        
        const regexStr = "^" + type.replace(/\./g, "\\.") + term + "[^\\.]*?$";
        var regex = new RegExp( regexStr, "i");
        
        Object.keys( this.index ).forEach( (k) => {
            if ( k.indexOf( type ) > -1 ) {
                index[k].forEach( (i) => {
                    var match = i.id.match( regex );
                    if ( match && match.length > 0 ) {
                        items.push(i);
                    }
                } );
            }
        });
        
        return items;
    }
    
    public remove( type: string ) {
        this.changed = true;
        this.index[type] = []; // clear it
    }
    
    public writeOutIndex() {
        if ( !this.changed ) return;
        this.changed = false;
        console.log("AutoComplete Index updated, writing to file");
        fs.writeFile( vscode.workspace.rootPath + '/autocomplete2.json', JSON.stringify( this.index, null, 4 ), (err) => {
            if ( err ) console.log('error writing autocomplete file');
        } );
    }
}