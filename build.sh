#!/bin/bash

git submodule update --init --recursive
cd server
git pull origin master
xbuild /p:Platform="Any CPU"
