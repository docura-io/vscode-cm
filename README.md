# VSCode CM Extension

##Installation

To Install download the latest from Downloads page, and then open the `VSIX` 
file from VSCode `File -> Open`.

##Running
The extension will automatically start when a `.CM` file is opened.

`Ctrl + Shift + U` will show the output window. There is a channel called "CM" 
that shows the output from the CM Compiler.

###Warnings
Make sure the compiler is ready for your commands, don't run multiple 
commands back to back, make sure the output window shows that CM is 
awaiting input ala `CM>` prompt. 

##Configuration
You'll need to set your workspace path (You can also set your `User Settings`
 instead to have it persist to all
), `File -> Preferences -> Workspace Settings`. 
Set the following:

```JSON
{
    "cm.root": "C:\\CetDev\\version6.5-_build-train"
}
```

##Commands
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

##Contibuting
Coming soon...
