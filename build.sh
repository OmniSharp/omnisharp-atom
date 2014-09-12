#!/bin/bash
rm -rf node_modules
npm install
git submodule update --init --recursive
cd server
xbuild /p:Platform="Any CPU"
cd ..
