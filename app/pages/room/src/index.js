import { constants } from "../../_shared/constants.js"
import RoomController from "./util/controller.js"
import RoomSocketBuilder from "./util/roomSocket.js"
import View from "./util/view.js"

const user = {
    img: 'https://cdn2.iconfinder.com/data/icons/social-flat-buttons-3/512/anonymous-256.png',
    username: 'Ukelele ' + Date.now()
}

const room = {
    id: '0001',
    topic: 'JS Expert é nóis'
}

const roomInfo = {user, room}

const socketBuilder = new RoomSocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNameSpaces.room
})

const dependencies = {
    view: View,
    socketBuilder,
    roomInfo
}

await RoomController.initialize(dependencies)
