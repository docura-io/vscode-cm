'use strict'

import { commands, Location, Position, window, workspace } from "vscode";
import { cmConfig } from "../cmConfig";
import { CommandBase, ICommandData } from "./ICommand";

const regex = /\(cm-cmd-q\s'\(cm-goto-def\s"([^"]+)"\s(\d+)\)\)/;

export class GoToCommand extends CommandBase {

    execute(cmd: ICommandData): boolean {
        let match = regex.exec( cmd.command );

        if ( match ) {
            // calculate location
            var file = match[1];
            var offset = parseInt( match[2] );
            
            workspace.openTextDocument( file )
            .then( (doc) => {
                var position = doc.positionAt( offset );
                position = new Position( position.line + 1, position.character );
                let loc = new Location( doc.uri, position )
                if ( cmd.extras && cmd.extras.hasOwnProperty('goToResolver') && cmd.extras.goToResolver ) {
                    cmd.extras.goToResolver( loc );
                } else {
                    // there was no promise, so just do what it asked
                    commands.executeCommand( 
                        "editor.action.goToLocations", 
                        window.activeTextEditor.document.uri,
                        window.activeTextEditor.selection.start,
                        [ loc ], // results (vscode.Location[])
                        'goto' // peek / gotoAndPeek / goto
                    );
                }
            }, (err) => {
                if ( cmd.extras.goToRejector ) {
                    cmd.extras.goToRejector(err);
                }
            });

            return true;
        } else {
            return false;
        }
    }

}