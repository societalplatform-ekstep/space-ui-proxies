import axios from 'axios'
import express from 'express'
import { CONSTANTS } from '../utils/env'
import { proxyCreatorRoute } from '../utils/proxyCreator'
import { axiosRequestConfig } from './../configs/request.config'
import { publicTnc } from './tnc'

export const publicApiV8 = express.Router()

publicApiV8.get('/', (_req, res) => {
  res.json({
    status: `Public Api is working fine https base: ${CONSTANTS.HTTPS_HOST}`,
  })
})

publicApiV8.use('/assets',
  proxyCreatorRoute(express.Router(), CONSTANTS.WEB_HOST_PROXY + '/web-hosted/web-client-public-assets'))

publicApiV8.use('/tnc', publicTnc)

// tslint:disable-next-line: no-any
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
    return res.status(200).send({data: {...result}})
  } catch (axiosError) {
    // tslint:disable-next-line: max-line-length
    return res.status(500).send({data: null, error: (axiosError && axiosError.response && axiosError.response.data) || 'Failed due to unkown reason',
  })
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
  try {
    const result = await axios.post(
      url,
      {
        request: { ...req.body }, // body will accept pageType, contentType and lexId
      },
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
    return res.status(200).send({data: {...result}})
  } catch (axiosError) {
    // tslint:disable-next-line: max-line-length
    return res.status(500).send({ data: null, error: (axiosError && axiosError.response && axiosError.response.data) || 'Failed due to unkown reason',
  })
  }
})
