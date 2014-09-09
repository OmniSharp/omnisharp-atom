#!/bin/bash

git submodule update --init --recursive
cd server
<<<<<<< HEAD
git pull origin master
=======
>>>>>>> origin/master
xbuild /p:Platform="Any CPU"
