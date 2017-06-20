import { ExtensionContext, TreeDataProvider, EventEmitter, TreeItem, Event, window, TreeItemCollapsibleState, Uri, commands, workspace, TextDocumentContentProvider, CancellationToken, ProviderResult } from 'vscode';
import { cmConfig } from './cmConfig';
import * as path from 'path';
import * as fs from 'fs';

interface IEntry {
    name: string;
    type: string;
}

export class CmNode {
    private _resource: string;

    constructor( private entry: IEntry, private rootPath: string, private _parent: string ) {
        this._resource = path.join( this.rootPath, this._parent );
    }

    public get resource(): string {
        return this._resource;
    }

    public get path(): string {
        return path.join( this._parent, this.name );
    }

    public get name(): string {
        return this.entry.name;
    }

    public get isFolder(): boolean {
        return this.entry.type === 'd' || this.entry.type === 'l';
    }
}

export class CmModel {

    constructor( private rootPath: string ) {

    }

    public get roots(): Thenable<CmNode[]> {
        return this.parseDirectory( path.join( this.rootPath, "cm" ) );
    }

    public getChildren( node: CmNode ): Thenable<CmNode[]> {
        return this.parseDirectory( node.resource );
    }

    private parseDirectory( fullPath: string ): Thenable<CmNode[]> {
        return new Promise( (res, rej) => {
            fs.readdir( fullPath, (err, files) => {
                if ( err ) {
                    return rej(err);
                }

                let filtered = files.filter( f => fs.statSync( path.join( fullPath, f ) ).isDirectory() || f.endsWith( ".cm" ) );
                
                return res( this.sort( filtered.map( 
                    entry => new CmNode( { name: entry, type: fs.statSync( path.join( fullPath, entry ) ).isDirectory() ? 'd' : 'cm' }, fullPath, entry ) 
                ) ) );
            } )
        } );
    }

    private sort( nodes: CmNode[] ): CmNode[] {
        return nodes.sort( (n1, n2) => {
            if ( n1.isFolder && !n2.isFolder ) {
                return -1;
            }

            if ( !n1.isFolder && n2.isFolder ) {
                return 1;
            }

            return n1.name.localeCompare( n2.name );
        })
    }
}

export class CmTreeDataProvider implements TreeDataProvider<CmNode> {

    private _onDidChangeTreeData: EventEmitter<any> = new EventEmitter<any>();
    readonly onDidChangeTreeData: Event<any> = this._onDidChangeTreeData.event;

    private model: CmModel;

    public getTreeItem( element: CmNode ): TreeItem {
        return {
            label: element.name,
            collapsibleState: element.isFolder ? TreeItemCollapsibleState.Collapsed : void 0,
            command: element.isFolder ? void 0 : {
                command: 'extension.openFile',
                arguments: [element.resource],
                title: 'Open CM Resource'
            },
            iconPath: {
                light: element.isFolder ? path.join( __filename, '..', '..', '..', 'resources', 'light', 'dependency.svg' ) : path.join(__filename, '..', '..', '..', 'resources', 'cmIcon.png'),
                dark: element.isFolder ? path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg') : path.join(__filename, '..', '..', '..', 'resources', 'cmIcon.png')
            }
        };
    }

    public getChildren( element?: CmNode ): CmNode[] | Thenable<CmNode[]> {
        if ( !element ) {
            if ( !this.model ) {
                this.model = new CmModel( cmConfig.cmPath() );
            }
            return this.model.roots;
        }

        return this.model.getChildren( element );
    }
}