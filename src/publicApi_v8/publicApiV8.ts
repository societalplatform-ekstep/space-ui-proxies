import axios from 'axios'
import express from 'express'
import { CONSTANTS } from '../utils/env'
import { proxyCreatorRoute } from '../utils/proxyCreator'
import { axiosRequestConfig } from './../configs/request.config'
import { publicTnc } from './tnc'
const qs = require('qs')
// tslint:disable: no-any

export const publicApiV8 = express.Router()

publicApiV8.get('/', (_req, res) => {
  res.json({
    status: `Public Api is working fine https base: ${CONSTANTS.HTTPS_HOST}`,
  })
})

publicApiV8.use('/assets',
  proxyCreatorRoute(express.Router(), CONSTANTS.WEB_HOST_PROXY + '/web-hosted/web-client-public-assets'))

publicApiV8.use('/tnc', publicTnc)

publicApiV8.post('/default-user/login', async (req: any, res: any) => {
  if (!req.body) {
    res.statys(400).send('BODY is mandatory')
  }
  const {username, password, client_id, grant_type} = req.body
  if (!username || !password || !client_id || !grant_type) {
    res.status(400).send('BODY parameters are either missing or malformed')
  }
  const url = `https://space.societalplatform.org/auth/realms/wingspan/protocol/openid-connect/token`
  try {
    const result = await axios({
      data: qs.stringify({
        client_id,
        grant_type,
        password,
        username,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'post',
      url,
    }
    )
    // tslint:disable-next-line: no-console
    console.log('recieved result as ', result.data)
    res.status(200).send(result.data)
  } catch (axiosError) {
    // tslint:disable-next-line: no-console
    console.log('catched error ', axiosError)
    res.status((axiosError && axiosError.response && axiosError.response.status) || 500)
    .send((axiosError && axiosError.response && axiosError.response.data) || axiosError)
  }
})

publicApiV8.get('/sharable-content/validate/:sharableToken', async (req: any, res: any) => {
  // tslint:disable: no-console
  if (!req.params.sharableToken || !req.header('org') || !req.header('rootorg')) {
    return res.status(400).send({message: 'org / rootorg / token is either missing or invalid'})
  }
  const org = req.header('org')
  const rootOrg = req.header('rootorg')
  const tokenToValidate = req.params.sharableToken
  const url = `${CONSTANTS.SB_EXT_API_BASE}/v1/content/share/validate/${tokenToValidate}`
  try {
    const result = await axios.get(
      url,
      {
        ...axiosRequestConfig,
        headers: {
          org,
          rootOrg,
        },
      }
    )
    res.status(200).send(result.data)
  } catch (axiosError) {
    // tslint:disable-next-line: max-line-length
    res.status((axiosError && axiosError.response && axiosError.response.status) || 500)
    .send((axiosError && axiosError.response && axiosError.response.data) || axiosError)
  }
})

// tslint:disable-next-line: no-any
publicApiV8.post('/content/sharable-url/generate', async (req: any, res: any) => {
  const org = req.header('org')
  const rootOrg = req.header('rootorg')
  const lang = req.header('lang')
  const wid = req.header('wid')
  if (!org || !rootOrg) {
    res.status(400).send('ORG_DATA not provided')
    return
  }
  if (!lang) {
    res.status(400).send('LANG_DATA not provided')
    return
  }
  const url = `${CONSTANTS.SB_EXT_API_BASE}/v1/content/share`
  const requestObj = {
    request: {
      contentType: req.body.contentType,
      lexId: req.body.lexId,
      pageType: req.body.pageType,
    }, // body will accept pageType, contentType and lexId
  }
  console.log('body is ', requestObj)
  try {
    const result = await axios.post(
      url,
      requestObj,
      {
        ...axiosRequestConfig,
        headers: {
          'Content-Type': 'application/json',
          lang,
          org,
          rootOrg,
          wid,
        },
      }
    )
    console.log('result fetched as ', result.data)
    res.status(200).send(result.data)
  } catch (axiosError) {
    console.log('captured error as ', axiosError.response.data)
    // tslint:disable-next-line: max-line-length
    res.status((axiosError && axiosError.response && axiosError.response.status) || 500)
    .send((axiosError && axiosError.response && axiosError.response.data) || axiosError)
  }
})
