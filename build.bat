git submodule update --init --recursive
cd server
msbuild /p:Platform="Any CPU"
