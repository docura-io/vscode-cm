'use strict';

import { window } from 'vscode';

export const showReloadConfirm = (msg): Promise<boolean> => {
    return new Promise( (res, rej) => {
        window.showInformationMessage( msg, "Reload" )
        .then( value => {
            if ( value == "Reload" ) {
                res(true);
            } else {
                res(false);
            }
        });
    });
}