'use strict'

import { commands, Location, Position, Uri, window } from "vscode";
import { CommandBase, ICommandData } from "./ICommand";

const regex = /\(cm-cmd-q\s'\(cm-push-def\s"([^"]+)"\s(\d+)\)\)/;
const refRegex = /([c|C]:\\[^\(]+)\((\d+),\s*(\d+)\):\s*(.*)/;

export class FindReferencesCommand extends CommandBase {
    
    execute(cmd: ICommandData): boolean {

        let match = regex.exec( cmd.command );
        if ( match ) {

            let locations : Location[] = [];
            // read the data
            let lines = cmd.data.split('\r\n');

            for( let l of lines ) {
                let refMatch = refRegex.exec( l );
                if ( refMatch ) {
                    const uri = Uri.file( refMatch[1] );
                    const line = +refMatch[2];
                    const col = +refMatch[3];
                    const desc = refMatch[4];
                    locations.push( new Location( uri, new Position( line-1, col ) ) );
                }
            }

            if ( locations.length == 0 ) {
                return false;
            }

            if ( cmd.extras.findRefResolver ) {
                cmd.extras.findRefResolver( locations );
            } else {
                commands.executeCommand( 
                    "editor.action.goToLocations", 
                    window.activeTextEditor.document.uri,
                    window.activeTextEditor.selection.start,
                    locations, // results (vscode.Location[])
                    'peek', // peek / gotoAndPeek / goto,
                    'Sorry, I got nadda'
                );
            }

            return true;
        } else {
            return false;
        }
    }

}