# Version 1.4.1 - Git Going to webpack syntax

There a few items new and updated in this release:

## Git CM Workspace support

Starting in version `1.4.0` you can now work in GIT Workspaces as well as Perforce workspaces for CET development. VSCode should automatically detect the correct mode your workspace is in, but if it doesn't, you can set "cm.gitMode" in your VSCode settings (You'll have to go into the JSON of your settings to set this) and set it to `true` or `false` depending if your using a GIT workspace or not.

## Go To Definition Improvements

Often times the CM compiler when you invoke Go to Definition (`F12`) it would respond as-if you did Find All References. With this release when this happens, it will treat the first item in the return from the compiler as the item to jump to. No more having to CTRL+Click the items in the output window!

## New Colorizer Option

I've been slowly working on a brand new colorizer (grammer) file for CM. (Built using tmLanguage). If you want to try it out you can enable the "New Syntax" setting under your settings in VSCode. After checking or unchecking this value, it'll ask you to restart VSCode for it to take effect. This new language has been based on a C# language definition and I've had a lot more luck customizing it verse the original one that has been used previously (which was based on a Java). Try it out and hopefully you like it!

## Housekeeping

The VSCode extension is now being bundled with webpack, so this should give a little performance boost for the extension.

# Version 1.3.4 - Intellisense Tweaks
Adding more information to the intellisense tooltips. Some things like when invoking for overriding a method, it was not giving much useful information. It now also correctly tab formats when inserting the snippet for method overriding. Finally if the overriding method needs a return value, instead of just putting `super(..)` in the method body, it will put `return super(..)`.

# Version 1.3.3 - Fix File Watcher
A fix for VSCode 1.20.0, the file watch should work again to pre-populate files.

# Version 1.3.2 - Changing Architecture
Another minor version that just adds commands to change your Architecture from 64-bit to 32-bit and back. Note after changing it your current VS Code window will need to reload for the change to take effect.

# Version 1.3.1 - Auto Folding
This is a minor release that will now auto-matically fold the copyright at the top of the CM files.

# Verion 1.3.0 - Multi-Root Workspaces
This release has added support for the multi-root workspaces introduced into VSCode. One **BIG** note this has *NOTHING* to do with CM Workspaces. You should only open folders from the same CM Workspace.

What this allows you to do is open multiple folders (again within the same CM Workspace) that are not directly related. Say you have `Ext1` and `Ext2`. You can could first open `C:\CetDev\version8.0\home\custom\ext1` and then do `File > Add folder to workspace` and pick `C:\CetDev\version8.0\home\custom\ext2` and now both extensions are open in the same vscode instance. This allows you to do things like find files across many extensions, or if you have one extension that depends on another, you can work on them both at the same time. No more having one VSCode instance kill your running compiler in another instance.

With this change a few commands have been tweaked or added to help work with multiple workspaces:

- `Compile VSCode Workspace`: This will compile each workspace open in VSCode in the order they show in the Explorer. (So if you have Ext2 and then Ext1 is the order of the folders in the explorer, it will compile Ext2 and then Ext1). *Note* this is the existing command, so if you had a keybind for `Compile Entire Workspace` before, this is the command it will run.
- `Compile Specific Workspace`: This will prompt you which of the open workspaces to compile. So if you have Ext1 and Ext2 open, and run this, it will give a popup listing Ext1 and Ext2 and you can pick which to compile.

User scripts should find each user script in each folder and show the folder name with the function to run those.

If you find any issues when switching to multi-workspace, let us know by logging issues in Github.

# Version 1.2.1 - Override, Implements and SubClasses
3 new commands have been added:
- `CC: Implemenets` - Place your cursor on a method, and see what all classes implement this method
- `CM: Overrides`- Place your curser on a method, and this will take you to the parent class that's method is being override
- `CM: Subclasses` - Place your cursor on a class name and it will show (for now) child classes up to 4 levels down (in a future update this will be user selectable)

# Version 1.2.0 - Document Symbols
Document Symbol search is now available (`CTRL+SHIFT+O` is the default keybind). This uses a simple regex search on the current file to find all the classes, methods and members in the current file. Also restoring the the CM Explorer, for some reason the `when` clause isn't working for CM language, so I've just turned it on full time. Also changing the default CM version to be 8.0 (a little late but better late then never)

Adding a new option to `cm.root` configuration, if you just set this to the values `auto` like:

```
{
  "cm.root": "auto"
}
```

It will just assume everything before `\home\` in your current workspace is the CMRoot. So if your workspace is `C:\CetDev\workspace57\home\custom\myExtension` it will set the CMRoot to `C:\CetDev\workspace57`. Best way to use this would be set a user setting in VSCode to have the value be auto. Then if in a specific workspace you want to override it you can. For now this will be an optional choice, but should save you when migrating between CM versions, or if you just happen to forget to set the `cm.root` value.

# Version 1.1.6 - Grammar Updates
Fixing some grammar parsing issues.

# Version 1.1.4 - Merge Fix
Failed to merge 1.1.3 with master, so a few things were left behind.

# Version 1.1.3 - tt Returns
Fixed the suggestion output scrubber to only match lines that are only `tt` and not just any line that includes tt.

Trying out the TreeView API, added a new pane under the explorer that lets you browse `home/cm` folder right from VSCode, expand the `CM Explorer` to check it out

# Version 1.1.1 - Bug Fix 
Fixed the `cm.compilefile` when an argument is passsed to it.

# Version 1.1.0 - User Scripts
- Made it so "found no uses of" errors now log as warnings instead
- First iteration of the user defined scripts. Create a file called `vscode.scripts.cm` in your workspace root, and reload VSCode. Now you can run the command `F1 -> CM: User Scripts` and it will preset a list of the functions defined in the `vscode.scripts.cm` file.
  - The script functions must not take any parameters
  - Note this file must have functions in this format (it uses a simple regex to find the function names):
    ```java
    public void functionName() { 
      // ...
    }
    ```
- Removed some control characters from output
- Made it so `cm.compilefile` can take in a parameter so it can be called via `vscode.commands.executeCommand( "cm.compilefile", { file: url } )`

# Version 1.0.4 - CM 8.0 Auto Complete
This version includes beginning support for the CM8.0 autocomplete. To use this auto complete you must set the following in your visual studio code config:

```json
{
    "cm.enableIntellisense": false,
    "cm.autoComplete80Enabled": true
}
```

The intellisense for now defaults to the legacy implementation, so you need to disable that and enable the new one. Note this new implementation will only work in an 8.0+ workspace. 

# Version 1.0.3 - ALL THE INSTANCES
- Added `multiple_instances` flag so you can now run multiple VSCode's with CM running.

# Version 1.0.2 - Now With More RS!
- New RS file save watcher. Tells CM to reparse RS files when they are saved. This makes it so you can just save an RS file and then `F5` or `CTRL+F5` in CET after saving RS file and see the changes
  - This can be disabled by setting the `cm.rsSaveWatch` config value to `false`
- VSCode extension now launches when folder is opened if there is a `package.cm` file in the root directory. No more having to open a *.cm file before you start the CM compiler
- Test Code for CM 8.0 Autocomplete

# Version 1.0.0
- Added new configuration `cm.clearOutputBuild`. This will clear the output channel each time you run any compile/run commands. Defaults to false
- Removed some garbage on the output channel that Go To Def was leaving

# Version 0.2.12
Fixing an issue with `Go To Definition` that was causing it to sometimes not do anything

# Version 0.2.11
- Go To Definition will compile the file if its dirty
- Added new `CM > #` output channel, it only shows output from `pln(#var)` commands
- Fixed package name on files created on root of workspace

# Version 0.2.10

- Adding a right click context option to the editor to compile the current file.
