import { constants } from "../../../_shared/constants.js"
import Attendee from "../entities/attendee.js"

export default class RoomController {
    constructor({roomInfo, socketBuilder, view}) {
        this.socketBuilder = socketBuilder
        this.roomInfo = roomInfo
        this.view = view

        this.socket = {}
    }

    static async initialize(deps) {
        return new RoomController(deps)._initialize()
    }

    async _initialize() {
        this._setupViewEvents()

        this.socket = this._setupSocket()

        this.socket.emit(constants.events.JOIN_ROOM, this.roomInfo)
    }

    _setupViewEvents() {
        this.view.updateUserImage(this.roomInfo.user)
        this.view.updateRoomTopic(this.roomInfo.room)
    }

    _setupSocket() {
        return this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .setOnRoomUpdated(this.onRoomUpdated())
            .setOnUserProfileUpgrade(this.onUserProfileUpgrade())
            .build()
    }

    onUserProfileUpgrade() {
        return(data) => {
            const attendee = new Attendee(data)
            console.log('onUserProfileUpgrade', attendee)
            if(attendee.isSpeaker) {
                this.view.addAttendeeOnGrid(attendee, true)
            }
        }
    }

    onRoomUpdated() {
        return (room) => {
            this.view.updateAttendeesOnGrid(room)
            console.log('Room list!', room)
        }
    }

    onUserDisconnected() {
        return (data) => {
            const attendee = new Attendee(data)

            console.log(`${attendee.username} disconnected!`)
            this.view.removeitemFromGrid(attendee.id)
        } 
    }

    onUserConnected() {
        return (data) => {
            const attendee = new Attendee(data)
            this.view.addAttendeeOnGrid(attendee)
            console.log('user connected!', attendee)
        }
    }
}