'use strict';

import * as vscode from 'vscode';
import cp = require('child_process');
import path = require('path');

export class ClangDocumentFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
	private formatCommand = 'clang-format';

	public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
		return document.save().then(() => {
			return this.doFormatDocument(document, options, token);
		});
	}

	private doFormatDocument(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
		return new Promise((resolve, reject) => {
			var filename = document.fileName;

			// cp.execFile(formatCommandBinPath, [filename, "-style='{ColumnLimit: 0, IndentWidth: 4,UseTab: Never}'"], {}, (err, stdout, stderr) => {
            cp.exec(`${this.formatCommand} ${filename} -style="{AccessModifierOffset: 0, ColumnLimit: 0, IndentWidth: 4, ReflowComments: true, TabWidth: 4}"`, (err, stdout, stderr) => {
				try {
					if (err && (<any>err).code == "ENOENT") {
						vscode.window.showInformationMessage("The '" + this.formatCommand + "' command is not available.  Please run \"npm install -g clang-format\".");
						return resolve(null);
					}
					if (err) return reject("Cannot format due to syntax errors.");
					var text = stdout.toString();
                    // fix public being pushed to the line before the signature
                    text = text.replace( /(?:public|private)\r\n\s*/g, "public " );
                    // fix "group += ? ptr" -- should not put a space between the = and ?
                    text = text.replace( /=\s+\?/g, "=?" );
                    // fix dictionary casting "str->str test = null.:str->str;" (there shouldn't be a space after the :)
                    text = text.replace( /.\s:\s(\w+->\w+)/g, '.:$1' );
                    
                    text = text.replace( /(\w+)\s{}\s+(\w+)/g, '$1{} $2')
                    
                    // trying to fix method signatures with default args
                    const reg = /(?:extend)?\s(?:public|private)\s\w+\s\w+\((.*)\)/g;
                    
                    let methodSigs = [];
                                           
                    var result;
                    while((result = reg.exec(text)) !== null) {
                        var line = result[1];
                        methodSigs.push( { old: line, new: line.replace( /\s=\s/g, "=" ) } );
                    }
                    
                    methodSigs.forEach( (item) => {
                        text = text.replace( item.old, item.new );
                    } );
                    
					// TODO: Should use `-d` option to get a diff and then compute the
					// specific edits instead of replace whole buffer
					var lastLine = document.lineCount;
					var lastLineLastCol = document.lineAt(lastLine - 1).range.end.character;
					var range = new vscode.Range(0, 0, lastLine - 1, lastLineLastCol);
					return resolve([new vscode.TextEdit(range, text)]);
				} catch (e) {
					reject(e);
				}
			});
		});
	}

}