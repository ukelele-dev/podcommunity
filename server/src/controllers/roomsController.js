import Attendee from "../entities/attendee.js"
import Room from "../entities/room.js"
import { constants } from "../util/constants.js"

export default class RoomsController {
    #users = new Map()

    constructor () {
        this.rooms = new Map()
    }

    onNewConnection(socket) {
        const {id} = socket
        console.log('Connection stablished with ', id)
        this.#updateGlobalUserData(id)
    }

    disconnect(socket) {
        console.log('Disconnected!!!', socket.id)
        this.#logoutUser(socket)
    }

    #logoutUser(socket) {
        const userId = socket.id
        const user = this.#users.get(userId)
        const roomId = user.roomId
        //remover user da lista de usuários ativos
        this.#users.delete(userId)

        //caso seja um "dirty user" que estava em uma sala q não mais existe
        if (!this.rooms.has(roomId)) {
            return;
        }

        const room = this.rooms.get(roomId)
        const toBeRemoved = [...room.users].find(({id}) => id === userId)

        //removemos o user da sala
        room.users.delete(toBeRemoved)

        //se não tiver ninguém na sala, removemos a sala
        if (!room.users.size) {
            this.rooms.delete(roomId)
            return;
        }

        const disconnectedUserWasAnOwner = userId === room.owner.id
        const onlyOneUserLeft = room.users.size === 1

        //validar se tem somente um usuário ou se o usuário era o dono da sala
        if (onlyOneUserLeft || disconnectedUserWasAnOwner) {
            room.owner = this.#getNewRoomOwner(room, socket)
        }

        //atualiza a room no final
        this.rooms.set(roomId, room)

        //notifica a sala que o user se desconectou
        socket.to(roomId).emit(constants.event.USER_DISCONNECTED, user)
    }

    #notifyUserProfileUpgrade(socket, roomId, user) {
        socket.to(roomId).emit(constants.event.UPGRADE_USER_PERMISSION, user)
    }

    #getNewRoomOwner(room, socket) {
        const users = [...room.users.values()]
        const activeSpeakers = users.find(user => user.isSpeaker)
        //se quem desconectou era o dono, passa a liderança para o próximo
        //se não houver speakers, ele pega o attendee mais antigo (primeira posição)
        const [newOwner] = activeSpeakers ? [activeSpeakers] : users
        newOwner.isSpeaker = true

        const outdatedUser = this.#users.get(newOwner.id)
        const updatedUser = new Attendee({
            ...outdatedUser,
            ...newOwner,
        })

        this.#users.set(newOwner.id, updatedUser)
        
        this.#notifyUserProfileUpgrade(socket, room.id, newOwner)
        
        return newOwner
    }

    joinRoom(socket, {user, room}) {

        const userId = user.id = socket.id
        const roomId = room.id

        const updateUserData = this.#updateGlobalUserData(
            userId,
            user,
            roomId
        )

        const updatedRoom = this.#joinUserRoom(socket, updateUserData, room)
        this.#notifyUsersOnRoom(socket, roomId, updateUserData)
        this.#replyWithActiveUsers(socket, updatedRoom.users)
    }

    #replyWithActiveUsers(socket, users) {
        const event = constants.event.LOBBY_UPDATED
        socket.emit(event, [...users.values()])
    }

    #notifyUsersOnRoom(socket, roomId, user) {
        const event = constants.event.USER_CONNECTED
        socket.to(roomId).emit(event, user)
    }

    #joinUserRoom(socket, user, room) {
        const roomId = room.id
        const existingRoom = this.rooms.has(roomId)
        const currentRoom = existingRoom ? this.rooms.get(roomId) : {}
        const currentUser = new Attendee({
            ...user,
            roomId
        })

        //definir quem é o dono da sala
        const [owner, users] = existingRoom ?
            [currentRoom.owner, currentRoom.users] :
            [currentUser, new Set()]

            const updatedRoom = this.#mapRoom({
                ...currentRoom,
                ...room,
                owner,
                users: new Set([...users, ...[currentUser]])
            })

            this.rooms.set(roomId, updatedRoom)

            socket.join(roomId)

            return this.rooms.get(roomId)
    }

    #mapRoom(room) {
        const users = [...room.users.values()]
        const speakersCount = users.filter(user => user.isSpeaker).length
        const featuredAttendees = users.slice(0, 3)
        const mappedRoom = new Room({
            ...room,
            featuredAttendees,
            speakersCount,
            attendeesCount: room.users.size
        })

        return mappedRoom
    }

    #updateGlobalUserData(userId, userData={}, roomId='') {
        const user = this.#users.get(userId) ?? {}
        const existingRoom = this.rooms.has(roomId)

        const updateUserData = new Attendee({
            ...user,
            ...userData,
            roomId,
            //se for o único na sala tem q ser promovido a speaker
            isSpeaker: !existingRoom
        })
        this.#users.set(userId, updateUserData)

        return this.#users.get(userId)
    }

    getEvents() {
        const functions = Reflect.ownKeys(RoomsController.prototype)
        .filter(fn => fn !== 'constructor')
        .map(name => [name, this[name].bind(this)])

        return new Map(functions)
    }
}