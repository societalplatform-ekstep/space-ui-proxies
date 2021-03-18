export interface ISendPayload {
    requested_by: string
    requested_to: string
    comment?: string
}

export interface IActiveConnection {
    connected_to: string
    connection_id: string
    email: string
}

export interface IPendingConnection {
    request_id: string
    requested_by: string
    requested_to: string
    status: string
}

export interface IConnectionStatusChangePayload {
    actor_id: string
    request_id: string
    action: string
}
