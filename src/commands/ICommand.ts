'use strict'

export class ICommandData {
    command: string;
    data: string;
    extras: any;
}

export abstract class CommandBase {
    /*
        Returns true if it was handled
    */
    abstract execute( cmd: ICommandData ) : boolean;
}