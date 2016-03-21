'use strict';

import { CancellationToken, ParameterInformation, Position, SignatureInformation, SignatureHelp, SignatureHelpProvider, TextDocument } from 'vscode';

export default class CMSignatureHelpProvider implements SignatureHelpProvider {
    public provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken): Promise<SignatureHelp> {

        return new Promise((resolve, reject) => {

            let ret = new SignatureHelp();
			ret.activeSignature = 0;
			ret.activeParameter = 0;

            let sigInfo = new SignatureInformation( "Sig Label", "IM DOCUMENTATION" );
            ret.signatures.push( sigInfo );
            
            for (var index = 0; index < 1; index++) {
                let paramInfo = new ParameterInformation(
                    `Param ${index}`,
                    `Param ${index} Docs`
                );
                sigInfo.parameters.push(paramInfo);
            }
            
            sigInfo = new SignatureInformation( "Sig Label 2", "IM DOCUMENTATION 2" );
            ret.signatures.push( sigInfo );
            
            for (var index = 0; index < 2; index++) {
                let paramInfo = new ParameterInformation(
                    `Param ${index}`,
                    `Param ${index} Docs`
                );
                sigInfo.parameters.push(paramInfo);
            }

            resolve(ret);
        });


    }
}