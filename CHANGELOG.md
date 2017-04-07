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