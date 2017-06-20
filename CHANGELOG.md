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
