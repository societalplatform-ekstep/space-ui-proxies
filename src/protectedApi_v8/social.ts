import axios from 'axios'
import { Buffer } from 'buffer'
import { Request, Response, Router } from 'express'
import { UploadedFile } from 'express-fileupload'
import FormData from 'form-data'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError } from '../utils/logger'
import { ERROR } from '../utils/message'
import { extractUserIdFromRequest } from '../utils/requestExtract'
const API_END_POINTS = {
  acceptAnswer: `${CONSTANTS.NODE_API_BASE}/useractivity/acceptAnswer`,
  activityUpdate: `${CONSTANTS.NODE_API_BASE}/useractivity/create`,
  activityUsers: `${CONSTANTS.NODE_API_BASE}/post/users`,
  adminDeletePosts: `${CONSTANTS.NODE_API_BASE}/admin/deletepost`,
  adminPostsTimeline: `${CONSTANTS.NODE_API_BASE}/admin/timeline`,
  adminReactivatePost: `${CONSTANTS.NODE_API_BASE}/admin/reactivatepost`,
  authoringCatalog: `${CONSTANTS.NODE_API_BASE}/catalog/fetch`,
  autocomplete: `${CONSTANTS.NODE_API_BASE}/post/autocomplete`,
  blogOrQnaCollector: (blogOrQnA: string, status = 'Active') => `${CONSTANTS.SB_EXT_API_BASE}/v1/post/${blogOrQnA}/${status}`,
  createForum: `${CONSTANTS.NODE_API_BASE}/forum/createforum`,
  deletePost: `${CONSTANTS.NODE_API_BASE}/authtool/deletepost`,
  draftPost: `${CONSTANTS.NODE_API_BASE}/authtool/draftpost`,
  editForum: `${CONSTANTS.NODE_API_BASE}/forum/editforum`,
  editMeta: `${CONSTANTS.NODE_API_BASE}/authtool/editmeta`,
  editTags: `${CONSTANTS.NODE_API_BASE}/authtool/edittags`,
  moderatorPostsTimeline: `${CONSTANTS.NODE_API_BASE}/moderator/timeline`,
  moderatorReact: `${CONSTANTS.NODE_API_BASE}/moderator/moderatepost`,
  publishPost: `${CONSTANTS.NODE_API_BASE}/authtool/publishpost`,
  searchSocial: `${CONSTANTS.NODE_API_BASE}/search/searchv1`,
  timeline: `${CONSTANTS.NODE_API_BASE}/post/timeline`,
  timelineV2: `${CONSTANTS.NODE_API_BASE}/post/timelinev2`,
  uploadImage: `${CONSTANTS.CONTENT_API_BASE}/contentv3/upload-live`,
  viewConversation: `${CONSTANTS.NODE_API_BASE}/post/viewConversation`,
  viewConversationV2: `${CONSTANTS.NODE_API_BASE}/post/viewConversationv2`,
  viewForum: `${CONSTANTS.NODE_API_BASE}/forum/viewforum`,
  viewForumlist: `${CONSTANTS.NODE_API_BASE}/forum/forumtimeline`,
}

const GENERAL_ERROR_MSG = 'Failed due to unknown reason'

export const socialApi = Router()

const INVALID_ORG_MSG = ERROR.ERROR_NO_ORG_DATA

socialApi.all('*', (req, _res, next) => {
  // tslint:disable-next-line: no-console
  console.log('request captured as ', req)
  next()
})

socialApi.post('/post/upload/:contentId', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const contentId = req.params.contentId
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    if (req.files && req.files.content) {
      const url = `${rootOrg}/${org}/Public/${contentId}/artifacts`
      const file: UploadedFile = req.files.content as UploadedFile
      const formData = new FormData()
      formData.append('content', Buffer.from(file.data), {
        contentType: file.mimetype,
        filename: file.name,
      })
      formData.submit(
        `${API_END_POINTS.uploadImage}/${url.replace(/\//g, '%2F')}`,
        (err, response) => {
          if (response.statusCode === 200 || response.statusCode === 201) {
            response.on('data', (data) => {
              res.send(JSON.parse(data.toString('utf8')))
            })
          } else {
            res.send(
              (err && err.message) || {
                error: GENERAL_ERROR_MSG,
              }
            )
          }
        }
      )
    } else {
      throw new Error('File not found')
    }
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/publish', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.publishPost, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/draft', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.draftPost, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.put('/edit/tags', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.put(API_END_POINTS.editTags, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
socialApi.put('/edit/meta', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.put(API_END_POINTS.editMeta, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    logError('EDIT META ERROR >', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/delete', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios({
      ...axiosRequestConfig,
      data,
      method: 'DELETE',
      url: API_END_POINTS.deletePost,
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    logError('ERROR DELETING POST', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/autocomplete', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const response = await axios.post(API_END_POINTS.autocomplete, req.body, {
      ...axiosRequestConfig,
      headers: {
        org,
        rootOrg,
      },
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/viewConversation', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.viewConversation, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/viewConversationV2', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.viewConversationV2, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/timeline', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.timeline, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/timelineV2', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = req.query.wid || extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.timelineV2, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
// moderator forum ends
// moderator content-approve/reject start

socialApi.post('/moderator/moderatepost', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const moderatorId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      moderatorId,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.moderatorReact, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/moderator/timeline', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.moderatorPostsTimeline, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

//// moderator content-approve end

// Admin timeline api start
socialApi.post('/admin/timeline', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.adminPostsTimeline, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
// admin timeline api ends
// Admin reject post start
socialApi.post('/admin/deletePost', async (req, res) => {
  try {
    const adminId = extractUserIdFromRequest(req)
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      adminId,
      org,
      rootOrg,
    }
    const response = await axios.delete(API_END_POINTS.adminDeletePosts, {
      ...axiosRequestConfig,
      data,
    })

    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
// Admin reject post end
// Admin reactivate post start
socialApi.post('/admin/reactivatePost', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const adminId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      adminId,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.adminReactivatePost, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
// admin reactivate post end

socialApi.post('/viewForum', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.viewForum, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

// forum list view start
socialApi.post('/forum/forumtimeline', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.viewForumlist, data, {
      ...axiosRequestConfig,
      timeout: Number(CONSTANTS.SOCIAL_TIMEOUT),
    })
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})
// forum list end
// social search start
// social search end
socialApi.post('/post/activity/create', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.activityUpdate, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/createForum', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const forumCreator = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      forumCreator,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.createForum, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/editForum', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const forumEditor = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      forumEditor,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.editForum, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/acceptAnswer', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.acceptAnswer, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/activity/users', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
    }
    const response = await axios.post(API_END_POINTS.activityUsers, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/post/search', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)
    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userId,
    }
    const response = await axios.post(API_END_POINTS.searchSocial, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

socialApi.post('/catalog', async (req, res) => {
  try {
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    const userId = extractUserIdFromRequest(req)

    if (!org || !rootOrg) {
      res.status(400).send(INVALID_ORG_MSG)
      return
    }
    const data = {
      ...req.body,
      org,
      rootOrg,
      userid: userId,
    }
    const response = await axios.post(API_END_POINTS.authoringCatalog, data, axiosRequestConfig)
    res.status(response.status).send(response.data)
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      }
    )
  }
})

// tslint:disable-next-line: no-shadowed-variable
socialApi.get('/post/list/:blogOrQna', async (req: Request, res: Response) => {
  // tslint:disable-next-line: no-console
  console.log('recieved requst ')
  // get all the ids of content specified from platform
  try {
    const url = `${API_END_POINTS.blogOrQnaCollector(req.params.blogOrQna, 'Active')}`
    // tslint:disable: no-console
    console.log('url generated as ', url)
    const query = req.query || {}
    if (req.query.hasOwnProperty('startDate')) {
      const date = new Date(req.query.startDate)
      if (isNaN(date.getTime())) {
        delete query.startDate
      } else {
        query.startDate = date.toISOString().replace('Z', '').replace('T', ' ')
      }
    }
    if (req.query.hasOwnProperty('endDate')) {
      const date = new Date(req.query.endDate)
      if (isNaN(date.getTime())) {
        delete query.endDate
      } else {
        query.endDate = date.toISOString().replace('Z', '').replace('T', ' ')
      }
    }
    console.log('final query looks like ', JSON.stringify(query))
    const response = await axios.get(url, {
      headers: {
        org: req.header('org'),
        rootOrg: req.header('rootOrg'),
      },
      params: query,
    })
    console.log('recieved response as ', JSON.stringify(response.data))
    // tslint:disable: no-any
    // tslint:disable-next-line: max-line-length
    if (response.data.hasOwnProperty('result') && response.data.result.hasOwnProperty('response') && Array.isArray(response.data.result.response)) {
      const IDS = response.data.result.response.map((obj: any) => {
        return {
          creatorName: obj.postCreator.name,
          id: obj.id,
          title: obj.postContent.title,
        }
      })
      res.status(200).send({ ok: true, status: 200, data: IDS })
    } else {
      // when we recieve improper format from the endpoint server
      res.status(200).send({ ok: true, status: 200, data: [] })
    }
  } catch (e) {
    console.log('An Error occured ---> ', e.message)
    res.status(500).send({ message: 'An unexpepcted error occured' })
  }
})
