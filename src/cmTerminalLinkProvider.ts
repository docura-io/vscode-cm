'use strict';

import { CancellationToken, ProviderResult, Range, TerminalLink, TerminalLinkContext, TerminalLinkProvider, TextDocumentShowOptions, window, workspace } from 'vscode';

const fileOnly = /c:\/CetDev\/.*\.cm/;
const fileWithLocation = /(c:\\CetDev\\.*\.cm)(?::|\()(\d+)(?::|,\s*)(\d+)/;


export class cmTerminalLinkProvider implements TerminalLinkProvider {

    provideTerminalLinks(context: TerminalLinkContext, token: CancellationToken): ProviderResult<TerminalLink[] | any[]> {
        // const startIndex = (context.line as string).indexOf('\\CetDev\\');
        let startIndex = context.line.indexOf('c:/CetDev/');
        if ( startIndex > -1 ) {
            let match = fileOnly.exec( context.line );
            return [
                {
                    startIndex,
                    length: match[0].length,
                    tooltip: 'Open file in editor',
                    filePath: match[0]
                }
            ];
        }
        
        startIndex = context.line.indexOf( 'c:\\CetDev\\' );
        if ( startIndex > -1 ) {
            let match = fileWithLocation.exec( context.line );
            if ( match ) {
                return [
                    {
                        startIndex,
                        length: match[0].length,
                        tooltip: 'Open file in editor',
                        filePath: match[1],
                        line: +match[2],
                        offset: +match[3]
                    }
                ];
            }
        }

        return [];
    }

    handleTerminalLink(link: TerminalLink | any): ProviderResult<void> {
        // vscode.window.showInformationMessage(`Link activated (data = ${link.data})`);
        // console.log(`Link activated (data = ${link.data})`);
        if ( link.filePath ) {
            link.filePath = link.filePath.replaceAll( "/", "\\" );
            // console.log(`Link is ${link.filePath}`);

            try {
                let opts:TextDocumentShowOptions = {};
                if ( link.line && link.offset ) {
                    opts.selection = new Range( link.line-1, link.offset-1, link.line-1, link.offset );
                }
                workspace.openTextDocument( link.filePath ).then( doc => {
                    window.showTextDocument( doc, opts );
                });
            } catch {
                window.showErrorMessage( `Unable to locate the file '${link.filePath}'`);
            }
            
        }
    }

}