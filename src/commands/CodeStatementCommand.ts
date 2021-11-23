'use strict';

import { CommandBase, ICommandData } from "./ICommand";

export class CodeStatementCommand extends CommandBase {

    execute(cmd: ICommandData): boolean {
        if ( cmd.extras.successEx && cmd.extras.failureEx ) {
            let match = cmd.extras.successEx.exec( cmd.command );
            if ( match && cmd.extras.hasOwnProperty('acResolver') && cmd.extras.acResolver ) {
                cmd.extras.acResolver();
                return true;
            }

            match = cmd.extras.failureEx.exec( cmd.command );
            if ( match && cmd.extras.hasOwnProperty('acRejector') && cmd.extras.acRejector ) {
                cmd.extras.acRejector();
                return true;
            }
        }
        return false;
    }

}