 # VSCode Extension Features<!-- omit in toc --> 

This page will go into detail about all the goodies / functionality we have built into the VSCode extension.

# Feature List<!-- omit in toc --> 

- [RS Load](#rs-load)
- [User Scripts](#user-scripts)
- [Sub Classes](#sub-classes)
- [Overrides](#overrides)
- [Go To Definition](#go-to-definition)
- [Intellisense](#intellisense)
- [Document Symbols](#document-symbols)
- [CM Explorer](#cm-explorer)
- [T CM](#t-cm)

... More to be added


## RS Load

*`cm.rsSaveWatch: true` in your VSCode settings to enable this feature.*

When editing your `*.rs` files, each time you save the file, VSCode will run `{ cm.rs.loadRs( cm.io.Url("file/name/here.rs"), force=true ); }` to tell the compiler to reload your RS file. So all you need to do to see this change reflected inside CET is to do `Shift+F5`.

*We tried invoked the `Shift+F5` programmatically, but it wasn't working. If you know how to make this work programmatically let us know so we can make this more automated!*

## User Scripts

This feature lets you create functions of tasks you commonly perform and make them easy to execute at any time. To start you need to create a file in the root folder you have open called `vscode.scripts.cm`. Inside this file you can definte a bunch of public functions to do each task/script you'd like you use. One thing of note is any references you need you'll want to put the `use xx.xx` inside your function:

```csharp
public void flushCm3D() {
    use custom.myExt;

    cm3DCache.flushCache();
    // other lines of code you'd want to run
}
```

Once you have your functions setup in this file to run them is just a matter of invoking `F1` -> `CM: User Scripts` and then VSCode will give you a list of the functions you have defined in this file to run. Select the one you want and it will send this call to the compiler to run!

## Sub Classes

This feature works similar to the EMACS operation. Simply drop you cursor on a class name, and then run `F1` -> `CM: Sub Classes` and then watch the output window. After a few seconds you should get a list of all the sub classes of the class you ran this command on.

## Overrides

This feature works just like the sub classes feature, except you run it on a method. So if you have inside a class:

```csharp
public Primitive3D get3D() {
    // Code 
}
```

You can put your cursor on the `get3D` and then do `F1` -> `Overrides` and it will take you to the method this is currently overriding. (Note you can also do this if you have a `super()` call in your method by invoking `go to definition` on the `super()` call.)

## Go To Definition

TBD

## Intellisense

TBD

## Document Symbols

TBD

## CM Explorer

TBD

## T CM

TBD