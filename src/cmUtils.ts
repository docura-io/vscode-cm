'use strict';

import vscode = require('vscode');
import { Uri } from 'vscode';
var fs = require('fs'),
    path = require('path');

export class cmUtils {

    static packageFileUsings(): string[] {
        let folder = vscode.window.activeTextEditor.document.uri.fsPath;
        folder = folder.substring( 0, folder.lastIndexOf('\\') );
        let fullPath = path.join(folder, "package.cm");

        if ( fs.existsSync( fullPath ) ) {
            var contents = fs.readFileSync(fullPath, 'utf8');
            var lines = contents.split('\r\n');
            var usings: string[] = [];

            lines.forEach((l) => {
                if (l == "") return;
                let match = /^\s*?use\s+(.*);$/.exec(l);

                if (match) {
                    usings.push(match[1]);
                }
            });

            return usings;
        } else {
            return [];
        }
    }
    
    /**
     * Gets the current CM Package based on the open folder
     */
    static getCurrentPackage( uri: Uri ): string {
        var root = vscode.workspace.getWorkspaceFolder(uri).uri.fsPath;
        var toMatch = ["\\home\\","\\base\\","\\extensions\\","\\personal\\"];
        var matchIndex = -1; 
        for (const match of toMatch) {
            matchIndex = root.indexOf(match);
            if ( matchIndex > -1 ) return root.substring(matchIndex + match.length).replace('\\', '.');;
        }

        // this shouldn't happen
        return root;
    }
    
    static getDirsUnder( symPath: string, parent: string ): string[] {
        let dirs = fs.readdirSync(symPath)
            .filter((file) => {
                return file != ".vscode" && file != ".git" && fs.statSync(path.join( symPath, file)).isDirectory();
            })
            .map( (file) => {
                return {
                    name: file, 
                    path: parent ? parent + "." + file : file
                }
            });
        
        let subDirs = [];
        
        dirs.forEach(dir => {
            subDirs = subDirs.concat( this.getDirsUnder( path.join( symPath, dir.name ), dir.path ) );
        });
        
        return dirs.map( (d) => { return d.path } ).concat(subDirs);
    }

    static addCopyright( uri: vscode.Uri ) {
        var copy = 
`/** Configura CET Source Copyright Notice (CETSC)

   This file contains Configura CM source code and is part of the
   Configura CET Development Platform (CETDEV). Configura CM
   is a programming language created by Configura Sverige AB.
   Configura, Configura CET and Configura CM are trademarks of
   Configura Sverige AB. Configura Sverige AB owns Configura CET,
   Configura CM, and CETDEV.

   Copyright (C) 2004 Configura Sverige AB, All rights reserved.

   You can modify this source file under the terms of the Configura CET
   Source Licence Agreement (CETSL) as published by Configura Sverige AB.

   Configura Sverige AB has exclusive rights to all changes, modifications,
   and corrections of this source file. Configura Sverige AB has exclusive
   rights to any new source file containing material from this source file.
   A new source file based on this source file or containing material from
   this source file has to include this Configura CET Source Copyright Notice
   in its full content. All changes, modifications, and corrections mentioned
   above shall be reported to Configura Sverige AB within One Month from
   the date that the modification occurred.

   Configura CM is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
   See the CETSL for more details.

   You should have received a copy of the CETSL along with the CETDEV.
   If not, write to Configura Sverige AB, Box 306, SE-581 02 Linköping, Sweden.
   Tel +46 13377800, Fax +46 13377855,
   Email: info@configura.com, www.configura.com

   END OF CETSC
*/

package {Package};

public class {Class} {
    public constructor() {
    }   
}`;
        var pkg = vscode.workspace.asRelativePath( uri, false ).replace(/\\/g, '/');
        
        pkg = pkg.substring( 0, pkg.lastIndexOf( '/' ) ).replace( /\//g, '.' );
        pkg = pkg == "" ? "" : '.' + pkg;

        let nameSpace = cmUtils.getCurrentPackage(uri) + pkg;
        
        // add comment to top of file
        vscode.workspace.openTextDocument( uri )
        .then( (doc) => {
            if ( doc.lineCount > 1 ) {
                 // update the package
                 let match = /^package\s[^;]*/m.exec( doc.getText() );
                 let start = match.index;
                 let length = match[0].length;
 
                 let range = new vscode.Range( doc.positionAt( start ), doc.positionAt( start + length ) );
 
                 let wEdit = new vscode.WorkspaceEdit();
                 wEdit.replace( doc.uri, range, "package " + nameSpace );
                 vscode.workspace.applyEdit( wEdit )
                 .then( res => {
                     doc.save();  
                 });
                 
                 return;
            };
            if ( doc.lineAt( 0 ).text.match( /Configura CET Source Copyright Notice/ ) ) { // it's already got the copyright, so don't add it again
               return;
            }
            vscode.window.showTextDocument( doc )
                .then( (editor) => {
                    editor.edit( (edit) => {
                        edit.insert( new vscode.Position( 0, 0 ), copy.replace( "{Package}", nameSpace ).replace( "{Class}", uri.path.substring( uri.path.lastIndexOf( '/' ) + 1, uri.path.lastIndexOf( '.' ) ) ) );
                    } )
                    .then( (res) => {
                        const fileStart = new vscode.Position( 0, 0 );
                        editor.selection = new vscode.Selection(fileStart, fileStart);
                    })
                        // return vscode.commands.executeCommand( "editor.fold" )
                    .then( (res) => {
                        const newPosition = new vscode.Position( 39, 4 );
                        const newSelection = new vscode.Selection(newPosition, newPosition);
                        editor.selection = newSelection;
                        
                        editor.revealRange( editor.selection, vscode.TextEditorRevealType.InCenter );
                        
                        doc.save();  
                                
                            // });
                    })                    
                } )
        });
    }

    static createResourceTemplate(uri: vscode.Uri) {
        var template =
`package {Package};

$ {
    english "";
}`;

        var pkg = vscode.workspace.asRelativePath( uri, false ).replace(/\\/g, '/');

        pkg = pkg.substring( 0, pkg.lastIndexOf( '/' ) ).replace( /\//g, '.' );
        pkg = pkg == "" ? "" : '.' + pkg;

        let nameSpace = cmUtils.getCurrentPackage(uri) + pkg;

        // var pkg = vscode.workspace.asRelativePath( uri );
        
        // pkg = pkg.substring( 0, pkg.lastIndexOf( '/' ) ).replace( /\//g, '.' );
        // pkg = cmUtils.getCurrentPackage(uri) + '.' + pkg;
        
        // add comment to top of file
        vscode.workspace.openTextDocument( uri )
        .then( (doc) => {
            if ( doc.lineCount > 1 ) return;
            if ( doc.lineAt( 0 ).text.match( /package / ) ) return;

            vscode.window.showTextDocument( doc )
                .then( (editor) => {
                    editor.edit( (edit) => {
                        edit.insert( new vscode.Position( 0, 0 ), template.replace( "{Package}", nameSpace ));
                    } )
                    .then( (res) => {
                        const fileStart = new vscode.Position( 0, 0 );
                        editor.selection = new vscode.Selection(fileStart, fileStart);
                    })
                    .then( (res) => {
                        const newPosition = new vscode.Position( 2, 1 );
                        const newSelection = new vscode.Selection(newPosition, newPosition);
                        editor.selection = newSelection;
                        
                        editor.revealRange( editor.selection, vscode.TextEditorRevealType.InCenter );
                        
                        doc.save();
                    })                    
                } )
        });
    }
}