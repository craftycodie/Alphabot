cd "${0%/*}"
cd ..
# Sometimes it takes a second for the dist.zip to finish uploading.
sleep 5s
SCREEN_NAME=$(basename "$PWD")
screen -S $SCREEN_NAME -X quit
rm -rf dist/*
git pull
APPVEYOR_TOKEN=$(grep APPVEYOR_TOKEN .env | xargs)
APPVEYOR_TOKEN=${APPVEYOR_TOKEN#*=}
bash ./build_scripts/download-latest-build.sh --token $APPVEYOR_TOKEN
unzip -q dist.zip -d dist
rm -rf dist.zip
bash ./build_scripts/start.sh