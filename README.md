[![Build Status](https://travis-ci.org/docura-io/vscode-cm.svg?branch=master)](https://travis-ci.org/docura-io/vscode-cm)
# VSCode CM Extension

## Overview
This is a VSCode extension to add CM ([Configura](http://configura.com), CET Designer/Developer) language
support.

## Installation
Visual Studio Code (VSCode) is required to use this extension, yuou can get
a free copy from https://code.visualstudio.com/Download.

To Install download the latest from Downloads page, and then open the `VSIX` 
file from VSCode `File -> Open`. (Do not double click the VSIX file to install)

## Working Folder
This extension is built to have your specific extension folder open. E.G. if 
your extension is under `/custom/mycompany` you should open this folder in 
VSCode. Opening the entire CM_ROOT will probably cause your computer to explode
in a blaze of awful glory :fire:

## Running
The extension will automatically start when a `.CM` file is opened.

To start the CM Compiler press `F1` and select the "CM: Start CM" or "CM: Start 
CET Designer"

`Ctrl + Shift + U` will show the output window. There is a channel called "CM" 
that shows the output from the CM Compiler.

## Configuration
You'll need to set your workspace path (You can also set your `User Settings`
 instead to have it persist to all
), `File -> Preferences -> Workspace Settings`. 
Set the following:

```JSON
{
    "cm.root": "C:\\CetDev\\version6.5-_build-train"
}
```

## Recommended Settings

```JSON
"cm.autoComplete80Enabled": true,
"cm.root": "auto",
"[cm]": {
    "editor.suggestOnTriggerCharacters": false,
    "editor.quickSuggestions": {
        "other": false,
        "comments": false,
        "strings": false
    }
}
```

## Commands
The following commands are available:

- CM: Start CM - `N/A`
- CM: Stop CM - `N/A`
- CM: Clean CM - `Shift + F5`
- CM: Run Current File - `CTRL + ALT + P`
- CM: Run Current Line - `CTRL + ALT + Space`
- CM: Compile Current - `CTRL + ALT + U`
- CM: Quit Debug - `CTRL + ALT + Q`
- CM: Start CET Designer - `N/A`
- CM: Profile Boot - `N/A`
- CM: Load All Known - `CTRL + ALT + Y`
- CM: Start writing output to file - `N/A`
- CM: Stops writing output contents to file - `N/A`

## Building
After cloning the repository, from command prompt run:
```shell
npm install
```

Currently, you'll need to copy `node_modules\cm-modules\findDefinition\out\variableFinder.js` to `out\node_modules\cm-modules\findDefinition`. At some point I'll figure out a way to make this better, but for now this works.

If you don't have node installed, you'll need to install it from https://nodejs.org/en/download/.  You can then open the folder in vscode by just typing `code .` You should be able to build and run the project by just hitting `F5` within VSCode.  It will launch a new "Extension Development" instance of VSCode, which will automatically run the compiled version of the extension over the one you have installed.  See https://code.visualstudio.com/Docs/extensions/overview for more information and API documentation.

## Contributing
Contribution can be done on many levels to this project, from submitting issues to helping add features and fixing issues. Feel free to submit issues for bugs and ideas you have for the extension. If you'd like to contribute code, feel free to fork the repository and submit pull requests for your changes.
