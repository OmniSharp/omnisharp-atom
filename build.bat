git submodule update --init --recursive
cd server
git pull origin master
msbuild /p:Platform="Any CPU"
