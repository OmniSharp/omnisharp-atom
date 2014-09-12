rd /s /q node_modules
call npm install
git submodule update --init --recursive
cd server
msbuild /p:Platform="Any CPU"
cd ..
