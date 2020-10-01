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
publicApiV8.get('sharable-content/validate/:sharableToken', async (req: any, res: any) => {
  if (!req.params.sharableToken || !req.header('org') || req.header('rootOrg')) {
    return res.status(400).send({message: 'org / rootOrg / token is either missing or invalid'})
  }
  const org = req.header('org')
  const rootOrg = req.header('rootOrg')
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
    return res.status(200).send({data: result.data})
  } catch (axiosError) {
    // tslint:disable-next-line: max-line-length
    return res.status(500).send({data: null, error: (axiosError && axiosError.response && axiosError.response.data) || 'Failed due to unkown reason',
  })
  }
})
