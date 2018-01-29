'use strict';

import { window } from 'vscode';

export const showReloadConfirm = (): Promise<boolean> => {
    return new Promise( (res, rej) => {
        window.showInformationMessage( "CM: You must reload the window for the architecture change to take effect", "Reload" )
        .then( value => {
            if ( value == "Reload" ) {
                res(true);
            } else {
                res(false);
            }
        });
    });
}