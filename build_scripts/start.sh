cd "${0%/*}"
cd ..
SCREEN_NAME=$(basename "$PWD")
# Kill existing screen
screen -S $SCREEN_NAME -X quit
# Run in a new screen
screen -dm -S $SCREEN_NAME node dist/src/index.js