'use strict';

var request = require('request');

import vscode = require('vscode');
import { VariableFinder, VariableFindResult } from 'cm-modules/findDefinition/variableFinder';
import { cmUtils, CurrentSymbol } from './cmUtils';
import { cmConfig } from './cmConfig';
import { IndexContainer } from './cmIndex';

function vscodeKindFromCmCodeClass(kind: string): vscode.CompletionItemKind {
    switch (kind) {
        case "package":
            return vscode.CompletionItemKind.Module;
        case "func":
        case "method":
            return vscode.CompletionItemKind.Function;
        case "class":
            return vscode.CompletionItemKind.Class;
        case "constructor":
            return vscode.CompletionItemKind.Constructor;
        case "property":
            // return vscode.CompletionItemKind.Property;
            return vscode.CompletionItemKind.Field;
        default:
            return vscode.CompletionItemKind.Method;
    }
    return vscode.CompletionItemKind.Property;
}

export class CMCompletionItemProvider implements vscode.CompletionItemProvider {

    private index: IndexContainer;
    private remoteCache: { [key: string]: any[]; } = {};

    constructor() {
        this.index = IndexContainer.getInstance();
    }
    
    public purgeCache(): void {
        this.remoteCache = {};
    }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {

        return new Promise((resolve, reject) => {

            var dottedString = cmUtils.getDottedCallsForLine(document, position);

            if (dottedString == null || typeof dottedString === 'undefined') return resolve([]);

            var splitDotted = dottedString.split('.');

            if (splitDotted.length == 1) {
                // Intellisense invoked with either "(...)" or "SomePartial(...)"
            } else {
                // Intellisense invoked with either "SomePartialThing.(...)" or "SomePartialThing.Mem(...)"
                var finder = new VariableFinder();
                var results = finder.findDefinitionInText(document.getText(), splitDotted[0]);

                if (results.length == 0) {
                    if (cmConfig.isDebug()) vscode.window.showWarningMessage(`Unable to determine type of "${splitDotted[0]}" to load completion suggestions`);
                    return resolve([]);
                }

                var first = results[0];
                splitDotted[0] = first.type; // replace the variable name with the type
                console.log(splitDotted[0]);
            }

            var usings = cmUtils.getUsingStatements(document);

            // go get the completions

            let completions: { [c: string]: vscode.CompletionItem[] } = Object.create(null);
            // var items: vscode.CompletionItem[] = [];
            // var autoCompleteText = splitDotted.filter(Boolean).join('.');
            var autoCompleteText = splitDotted.join('.');

            var remoteP = this.getRemoteCompletions(usings, autoCompleteText)
                .then((res) => {
                    res.forEach((i) => {
                        i.label = i.label.substr(i.label.lastIndexOf('.') + 1);
                        let array = completions[i.label];
                        if (!array) {
                            completions[i.label] = [i];
                        } else {
                            array.push(i);
                        }
                    });
                });

            var localP = this.getLocalCompletions(usings, autoCompleteText)
                .then((res) => {
                    res.forEach((i) => {
                        let array = completions[i.label];
                        if (!array) {
                            completions[i.label] = [i];
                        } else {
                            array.push(i);
                        }
                    });
                });

            Promise.all([remoteP, localP])
            // Promise.all( [localP] )
                .then(() => {
                    var items: vscode.CompletionItem[] = [];

                    for (let key in completions) {
                        let suggestion = completions[key][0],
                            overloadCount = completions[key].length - 1;

                        if (overloadCount === 0) {
                            // remove non overloaded items
                            delete completions[key];
                        } else {
                            // indicate that there is more
                            suggestion.detail = `${suggestion.detail} (+ ${overloadCount} overload(s))`;
                        }
                        items.push(suggestion);
                    }

                    resolve(items);
                }, (e) => {
                    console.log('all error');
                    reject();
                });
        });
    }

    private getRemoteCompletions(namespaces: string[], memberName: string): Thenable<vscode.CompletionItem[]> {
        return new Promise((resolve, reject) => {
            var ids = namespaces.filter((u) => {
                return u.startsWith("cm.");
            }).join(",");

            const url = cmConfig.completionUrl( ids, memberName );

            console.log( `Remote URL: ${url}`);
            
            if ( this.remoteCache[url] ) {
                resolve( this.remoteCache[url] );
            }

            request.get(url, (error, res, body) => {
                if (error) {
                    resolve([]);
                }

                if (res.statusCode == 200) {
                    var parsed = JSON.parse(body);

                    var items = [];

                    try {
                        parsed.forEach((i) => {
                            var item = new vscode.CompletionItem(i.name || "constructor");
                            item.kind = vscodeKindFromCmCodeClass(i.type);
                            item.detail = i.header;
                            item.documentation = i.comment;
                            items.push(item);
                        });
                    } catch (e) { }

                    this.remoteCache[url] = items;
                    resolve(items);
                } else if (res.statusCode == 404) {
                    resolve([]);
                } else {
                    resolve([]);
                }

            });
        });
    }

    private getLocalCompletions(usings: string[], word: string): Thenable<vscode.CompletionItem[]> {
        return new Promise((resolve, reject) => {

            var localUsings = usings.filter((u) => {
                return !u.startsWith("cm.");
            });

            var items = [];

            localUsings.forEach((u) => {
                // split on the Dots
                var parts = word.split('.');

                let use = u;
                // if its more then "Something.Else", we need to parse it down to be like that
                while (parts.length > 2) {
                    var first = parts[0];
                    var second = parts[1];

                    var indexItem = this.index.get(use, first + "." + second);

                    if (indexItem.length > 0) {
                        parts.shift();
                        var type: string = indexItem[0].return;
                        var lastDotIndex = type.lastIndexOf('.');
                        u = type.substring(0, lastDotIndex);
                        parts[0] = type.substring(lastDotIndex + 1);
                    } else {
                        break;
                    }
                }

                var trimmedWord = parts.join('.');
                var dotIndex = trimmedWord.indexOf('.');
                if (dotIndex > -1) {
                    use += "." + trimmedWord.substr(0, dotIndex);
                    trimmedWord = trimmedWord.substr(dotIndex);
                }

                var indexItem = this.index.get(use, trimmedWord);

                indexItem.forEach((i) => {
                    var cItem = new vscode.CompletionItem(i.label);
                    cItem.kind = vscodeKindFromCmCodeClass(i.type);
                    cItem.detail = i.detail;
                    cItem.documentation = i.documentation;

                    items.push(cItem);
                });
            });

            return resolve(items);
        });
    }
}