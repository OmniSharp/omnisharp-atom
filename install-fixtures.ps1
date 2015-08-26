if (Test-Path spec\fixtures\thirdparty\) {
    Remove-Item -Force -Recurse spec\fixtures\thirdparty\
}

Invoke-WebRequest 'https://github.com/willl/DualSolutions/archive/37052446b7a7179dfee1557d4c39db5e682f91ed.zip' -OutFile 'dualsolutions.zip'
7z x dualsolutions.zip -ospec\fixtures\thirdparty\
remove-item dualsolutions.zip

Invoke-WebRequest 'https://github.com/stormtek/unity-rts-demo/archive/590d533bbc3e16f26b025478af07320d30e59278.zip' -OutFile 'unity-rts-demo.zip'
7z x unity-rts-demo.zip -ospec\fixtures\thirdparty\
remove-item unity-rts-demo.zip

pushd spec\fixtures\thirdparty\
gci dualsolutions-* | Copy-Item -Destination dualsolutions -Recurse
gci dualsolutions-* | Remove-Item -Recurse -Force

gci unity-rts-demo-* | Copy-Item -Destination unity-rts-demo -Recurse
gci unity-rts-demo-* | Remove-Item -Recurse -Force
popd
