#!/bin/bash

git submodule update --init --recursive
cd server
xbuild /p:Platform="Any CPU"
