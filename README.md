# omnisharp-atom package [![build status](https://travis-ci.org/OmniSharp/omnisharp-atom.svg)](https://travis-ci.org/OmniSharp/omnisharp-atom/)  [![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/OmniSharp/omnisharp-atom?branch=master&svg=true)](https://ci.appveyor.com/project/nosami/omnisharp-atom)

###(The hackable IDE)

![omnisharp-atom](https://cloud.githubusercontent.com/assets/667194/7758038/8ad7bdfa-fffe-11e4-98be-74e0c660aabd.gif)

## Runtime prerequisites

Please ensure you've got [Mono](http://www.mono-project.com/) 4.0.1 or later installed if you're on OS X/Linux. Or .NET 4.5.1 on Windows.

If you want to work on a DNX application then you will also need to have dnvm installed. Please refer to the instructions detailed in the [aspnet/home](https://github.com/aspnet/home/#minimum-requirements) repository. 
## Installation
From the packages settings inside Atom:

* install omnisharp-atom

From the command-line:

```
apm install omnisharp-atom
```

## To use

- Open a c# file

- or open a scriptcs file

When the flame icon in the bottom left corner turns green, the server has started!

# Features

- `F12` or `cmd-d` Go to definition - can also ctrl-click or cmd-click
  `shift-alt-t` or `ctrl-,` Find type
- `ctrl-F12` Go to implementation
- `shift-F12` Find usages
- `F8, shift-F8` Go to next/previous usage
- `ctrl-k, ctrl-d` Format document
- `ctrl-k ctrl-c` Comment selection
- `f2` Rename
- `ctrl-alt-down` Navigate downwards through methods
- `ctrl-alt-up` Navigate upwards through methods
- Completions appear as you type. To select an item, press Return or the TAB key.
- Type lookup on mouse over or from cursor (`f1`).
- Editor adornments (squigglies) appear for errors and code hints as you type.
- Automatic Package restore for DNX applications when you save `project.json` files
- Enjoy!

## Test Runner

- ctrl-r ctrl-a Run all tests
- ctrl-r ctrl-f Run all fixture tests
- ctrl-r ctrl-t Run single test
- ctrl-r ctrl-l Run last test

# Wiki

https://github.com/OmniSharp/omnisharp-atom/wiki
