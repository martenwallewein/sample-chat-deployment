import React from 'react'
import io from 'socket.io-client'

const SocketContext = React.createContext()
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:5000/'; 

const SocketProvider = ({ children }) => {
    const socket = io(API_ENDPOINT, { transports: ['websocket', 'polling'] })
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

export { SocketContext, SocketProvider, API_ENDPOINT }