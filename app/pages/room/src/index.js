import { constants } from "../../_shared/constants.js"
import RoomSocketBuilder from "./util/roomSocket.js"


const socketBuilder = new RoomSocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNameSpaces.room
})

const socket = socketBuilder
    .setOnUserConnected((user) => console.log('user connected!', user))
    .setOnUserDisconnected((user) => console.log('user disconnected!', user))
    .setOnRoomUpdated((room) => console.log('Room list!', room))
    .build()

const room = {
    id: '0001',
    topic: 'JS Expert é nois'
}

const user = {
    img: 'https://cdn2.iconfinder.com/data/icons/social-flat-buttons-3/512/anonymous-256.png',
    username: 'Ukelele ' + Date.now()
}

socket.emit(constants.events.JOIN_ROOM, {user, room})