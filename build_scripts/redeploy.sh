cd "${0%/*}"
cd ..
SCREEN_NAME=$(basename "$PWD")
screen -S $SCREEN_NAME -X quit
rm -rf dist
git pull
set -o allexport; source .env; set +o allexport
./build_scripts/download-latest-build.sh --token $APPVEYOR_TOKEN
unzip dist.zip
./build_scripts/start.sh