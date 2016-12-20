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