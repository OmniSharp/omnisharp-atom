curl -s -L "https://github.com/willl/DualSolutions/archive/37052446b7a7179dfee1557d4c39db5e682f91ed.zip" \
  -H 'Accept: application/octet-stream' \
  -o dualsolutions.zip
unzip -q dualsolutions.zip -d spec/fixtures/thirdparty/
rm dualsolutions.zip

curl -s -L "https://github.com/stormtek/unity-rts-demo/archive/590d533bbc3e16f26b025478af07320d30e59278.zip" \
  -H 'Accept: application/octet-stream' \
  -o unity-rts-demo.zip
unzip -q unity-rts-demo.zip -d spec/fixtures/thirdparty/
rm unity-rts-demo.zip

pushd spec/fixtures/thirdparty/
cp -r DualSolutions-37052446b7a7179dfee1557d4c39db5e682f91ed dualsolutions
rm -rf DualSolutions-37052446b7a7179dfee1557d4c39db5e682f91ed
popd

pushd spec/fixtures/thirdparty/
cp -r DualSolutions-37052446b7a7179dfee1557d4c39db5e682f91ed unity-rts-demo
rm -rf unity-rts-demo-590d533bbc3e16f26b025478af07320d30e59278
popd
