import type { FastifyInstance } from 'fastify'
import { remitlyHealthRoutes } from './remitly-health'
import { westernUnionHealthRoutes } from './westernunion-health'
import { wellsFargoHealthRoutes } from './wellsfargo-health'
import { xeHealthRoutes } from './xe-health'
import { transferGoHealthRoutes } from './transfergo-health'
import { paysendHealthRoutes } from './paysend-health'
import { pangeaHealthRoutes } from './pangea-health'
import { orbitremitHealthRoutes } from './orbitremit-health'
import { bossmoneyHealthRoutes } from './bossmoney-health'
import { riaHealthRoutes } from './ria-health'
import { dahabshiilHealthRoutes } from './dahabshiil-health'
import { sendwaveHealthRoutes } from './sendwave-health'
import { mukuruHealthRoutes } from './mukuru-health'
import { worldRemitHealthRoutes } from './worldremit-health'
import { wiseHealthRoutes } from './wise-health'
import { xoomHealthRoutes } from './xoom-health'
import { instaremHealthRoutes } from './instarem-health'
import { koronapayHealthRoutes } from './koronapay-health'
import { remitbeeHealthRoutes } from './remitbee-health'
import { singxHealthRoutes } from './singx-health'
import { placidHealthRoutes } from './placid-health'
import { wirebarleyHealthRoutes } from './wirebarley-health'
import { intermexHealthRoutes } from './intermex-health'
import { alansariHealthRoutes } from './alansari-health'

export const opsRoutes = async (app: FastifyInstance) => {
  remitlyHealthRoutes(app)
  westernUnionHealthRoutes(app)
  wellsFargoHealthRoutes(app)
  xeHealthRoutes(app)
  transferGoHealthRoutes(app)
  paysendHealthRoutes(app)
  pangeaHealthRoutes(app)
  orbitremitHealthRoutes(app)
  bossmoneyHealthRoutes(app)
  riaHealthRoutes(app)
  dahabshiilHealthRoutes(app)
  sendwaveHealthRoutes(app)
  mukuruHealthRoutes(app)
  worldRemitHealthRoutes(app)
  wiseHealthRoutes(app)
  xoomHealthRoutes(app)
  instaremHealthRoutes(app)
  koronapayHealthRoutes(app)
  remitbeeHealthRoutes(app)
  singxHealthRoutes(app)
  placidHealthRoutes(app)
  wirebarleyHealthRoutes(app)
  alansariHealthRoutes(app)
  intermexHealthRoutes(app)
}
