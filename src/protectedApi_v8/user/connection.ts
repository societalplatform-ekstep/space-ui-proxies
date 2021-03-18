// SB_EXT_API_BASE_2/v1/user/connection/request
import axios from 'axios'
import express, { Router } from 'express'
import { axiosRequestConfig } from '../../configs/request.config'
import { IActiveConnection, IConnectionStatusChangePayload, IPendingConnection, ISendPayload } from '../../models/connections.model'
import { CONSTANTS } from '../../utils/env'
import { logError } from '../../utils/logger'
import { ERROR } from '../../utils/message'
import { extractUserIdFromRequest } from '../../utils/requestExtract'

const GENERAL_ERROR_MESSAGE = 'Something went wrong, try again later'
const COMBINED_SEARCH_SIZE = 10000

const getConnectionUrl = {
    ChangeRequestStatus: `${CONSTANTS.SB_EXT_API_BASE_2}/v1/user/connection/requests`,
    GetActiveConnections: (userid: string) => `${CONSTANTS.SB_EXT_API_BASE_2}/v1/user/connections/${userid}/Active`,
    GetPendingConnections: (userId: string) => `${CONSTANTS.SB_EXT_API_BASE_2}/v1/user/connection/pending-requests/${userId}`,
    SendRequest: `${CONSTANTS.SB_EXT_API_BASE_2}/v1/user/connection/requests`,
}

export const connectionApi = Router()

const getAllActiveConnections = async (sourceReq: express.Request) => {
    try {
        const userId = extractUserIdFromRequest(sourceReq)
        const response = await axios({
            ...axiosRequestConfig,
            headers: {
                ...sourceReq.headers,
                wid: userId,
            },
            method: 'GET',
            params: {
                size: COMBINED_SEARCH_SIZE,
            },
            url: getConnectionUrl.GetActiveConnections(userId),
        })
        return response.data.content.map((connectionObj: IActiveConnection) => {
            return {
                email: connectionObj.email,
                id: connectionObj.connection_id,
                requested_by: userId,
                status: 'Connected',
                user_id: connectionObj.connected_to,
            }
        })
    } catch (e) {
        return null
    }
}

const getAllPendingConnections = async (sourceReq: express.Request) => {
    try {
        const userId = extractUserIdFromRequest(sourceReq)
        const response = await axios({
            ...axiosRequestConfig,
            headers: {
                ...sourceReq.headers,
                wid: userId,
            },
            method: 'GET',
            params: {
                size: COMBINED_SEARCH_SIZE,
            },
            url: getConnectionUrl.GetPendingConnections(userId),
        })
        return response.data.content.map((pendingConnectionObj: IPendingConnection) => {
            return {
                id: pendingConnectionObj.request_id,
                requested_by: pendingConnectionObj.requested_by,
                status: pendingConnectionObj.status,
                user_id: pendingConnectionObj.requested_to,
            }
        })
    } catch (e) {
        logError('An Error occured while hitting and formatting pending connections response' + e.toString())
        return null
    }
}

// internal function which would merge the active connections and pending connections and then return the merged result
const getAndMergeAllConnections = async (sourceReq: express.Request) => {
    try {
        const combinedResponseArray = await Promise.all(
            [getAllActiveConnections(sourceReq), getAllPendingConnections(sourceReq)]
        )
        if (!combinedResponseArray[0] || !combinedResponseArray[1]) {
            throw new Error('One of the apis, either active connections or pending connections failed, returning failure altogether')
        }
        return [
            ...combinedResponseArray[0],
            ...combinedResponseArray[1],
        ]

    } catch (e) {
        logError('An Error occured while hitting and merging active / pending requests endpoints ' + e.toString())
        return null
    }
}

// used to send connection request
connectionApi.post('/send-request', async (req: express.Request, res: express.Response) => {
    try {
        const payload: ISendPayload = req.body
        const rootOrg = req.header('rootOrg')
        const org = req.header('org')
        if (!org || !rootOrg) {
            res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
            return
        }
        const response = await axios({
            ...axiosRequestConfig,
            data: payload,
            headers: {
                org,
                rootOrg,
                wid: extractUserIdFromRequest(req),
            },
            method: 'POST',
            url: getConnectionUrl.SendRequest,
        })
        res.status(200).json(response.data)
    } catch (err) {
        logError('Error occured while processing data for send request api')
        res.status((err && err.response && err.response.status) || 500).send(
            (err && err.response && err.response.data) || {
                error: GENERAL_ERROR_MESSAGE,
            }
        )
    }
})

connectionApi.post('/withdraw-pending', async (req: express.Request, res: express.Response) => {
    try {
        const payload: IConnectionStatusChangePayload = {
            action: 'Withdraw',
            actor_id: extractUserIdFromRequest(req),
            request_id: req.body.request_id,
        }
        const rootOrg = req.header('rootOrg')
        const org = req.header('org')
        if (!org || !rootOrg) {
            res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
            return
        }
        const response = await axios({
            ...axiosRequestConfig,
            data: payload,
            headers: {
                org,
                rootOrg,
                wid: extractUserIdFromRequest(req),
            },
            method: 'PATCH',
            url: getConnectionUrl.ChangeRequestStatus,
        })
        res.status(200).json(response.data)
    } catch (err) {
        logError('Error occured while processing data for send request api')
        res.status((err && err.response && err.response.status) || 500).send(
            (err && err.response && err.response.data) || {
                error: GENERAL_ERROR_MESSAGE,
            }
        )
    }
})

// used to accept / reject connection request from another user
connectionApi.get('/invitation/:requestID/:actionType', async (req: express.Request, res: express.Response) => {
    try {
        const { requestID, actionType } = req.params
        if (!requestID || !actionType) {
            res.status(400).send({
                error: 'requestID | actionType is not supplied',
            })
            return
        }
        const actionPerformedBy = extractUserIdFromRequest(req)
        if (!actionPerformedBy) {
            res.status(400).send({
                error: 'user id not present',
            })
            return
        }
        const rootOrg = req.header('rootOrg')
        const org = req.header('org')
        if (!org || !rootOrg) {
            res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
            return
        }
        const payload: IConnectionStatusChangePayload = {
            action: actionType,
            actor_id: actionPerformedBy,
            request_id: requestID,
        }

        const response = await axios({
            ...axiosRequestConfig,
            data: payload,
            headers: {
                org,
                rootOrg,
                wid: actionPerformedBy,
            },
            method: 'PATCH',
            url: getConnectionUrl.ChangeRequestStatus,
        })
        res.status(200).send({ status: 200, ok: true, data: response.data })
    } catch (err) {
        logError('Error occured while processing data for perform invitation action api --> ', err.toString())
        res.status((err && err.response && err.response.status) || 500).send(
            (err && err.response && err.response.data) || {
                error: GENERAL_ERROR_MESSAGE,
            }
        )
    }
})

// used to get all connections with respect to specific user
connectionApi.get('/list', async (req: express.Request, res: express.Response) => {
    try {
        const userID = extractUserIdFromRequest(req)
        if (!userID) {
            res.status(400).send({
                error: 'userid is not supplied',
            })
            return
        }
        const rootOrg = req.header('rootOrg')
        const org = req.header('org')
        if (!org || !rootOrg) {
            res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
            return
        }
        // get all active connections and pending connections of a user and send back as a merged result
        const response = await getAndMergeAllConnections(req)
        if (!response) {
            throw new Error('one of the apis failed')
        }
        res.status(200).send({ status: 200, ok: true, data: response })
        return
    } catch (err) {
        logError('Error occured while processing data for perform invitation action api --> ', err.toString())
        res.status((err && err.response && err.response.status) || 500).send(
            (err && err.response && err.response.data) || {
                error: GENERAL_ERROR_MESSAGE,
            }
        )
    }
})
