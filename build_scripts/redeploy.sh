cd "${0%/*}"
cd ..
# Sometimes it takes a second for the dist.zip to finish uploading.
sleep 5s
SCREEN_NAME=$(basename "$PWD")
screen -S $SCREEN_NAME -X quit
git pull
npm i
npm run build
# bash ./build_scripts/start.sh
