import type { ProviderDefinition } from './registry-builder'

import { runRemitlyCollector } from './remitly/collector'
import { REMITLY_B2B_CORRIDORS } from './remitly/supported-corridors'
import { httpLimits as remitlyLimits } from './remitly/limits'
import { runWesternUnionCollector } from './westernunion/collector'
import { WESTERNUNION_B2B_CORRIDORS } from './westernunion/supported-corridors'
import { httpLimits as westernUnionLimits } from './westernunion/limits'
import { runWorldRemitCollector } from './worldremit/collector'
import { WORLDREMIT_B2B_CORRIDORS } from './worldremit/supported-corridors'
import { httpLimits as worldRemitLimits } from './worldremit/limits'
import { runInstaremCollector } from './instarem/collector'
import { INSTAREM_B2B_CORRIDORS } from './instarem/supported-corridors'
import { httpLimits as instaremLimits } from './instarem/limits'
import { runWireBarleyCollector } from './wirebarley/collector'
import { WIREBARLEY_B2B_CORRIDORS } from './wirebarley/supported-corridors'
import { httpLimits as wireBarleyLimits } from './wirebarley/limits'
import { runAlansariCollector } from './alansari/collector'
import { ALANSARI_B2B_CORRIDORS } from './alansari/supported-corridors'
import { httpLimits as alansariLimits } from './alansari/limits'
import { runIntermexCollector } from './intermex/collector'
import { INTERMEX_B2B_CORRIDORS } from './intermex/supported-corridors'
import { httpLimits as intermexLimits } from './intermex/limits'
import { runXoomCollector } from './xoom/collector'
import { XOOM_B2B_CORRIDORS } from './xoom/supported-corridors'
import { httpLimits as xoomLimits } from './xoom/limits'
import { runXeCollector } from './xe/collector'
import { XE_B2B_CORRIDORS } from './xe/supported-corridors'
import { httpLimits as xeLimits } from './xe/limits'
import { runTransferGoCollector } from './transfergo/collector'
import { TRANSFERGO_B2B_CORRIDORS } from './transfergo/supported-corridors'
import { httpLimits as transferGoLimits } from './transfergo/limits'
import { runPaysendCollector } from './paysend/collector'
import { PAYSEND_B2B_CORRIDORS } from './paysend/supported-corridors'
import { httpLimits as paysendLimits } from './paysend/limits'
import { runPangeaCollector } from './pangea/collector'
import { PANGEA_B2B_CORRIDORS } from './pangea/supported-corridors'
import { httpLimits as pangeaLimits } from './pangea/limits'
import { runOrbitRemitCollector } from './orbitremit/collector'
import { ORBITREMIT_B2B_CORRIDORS } from './orbitremit/supported-corridors'
import { httpLimits as orbitremitLimits } from './orbitremit/limits'
import { runBossMoneyCollector } from './bossmoney/collector'
import { BOSSMONEY_B2B_CORRIDORS } from './bossmoney/supported-corridors'
import { httpLimits as bossmoneyLimits } from './bossmoney/limits'
import { runKoronaPayCollector } from './koronapay/collector'
import { KORONAPAY_B2B_CORRIDORS } from './koronapay/supported-corridors'
import { httpLimits as koronapayLimits } from './koronapay/limits'
import { runRemitbeeCollector } from './remitbee/collector'
import { REMITBEE_B2B_CORRIDORS } from './remitbee/supported-corridors'
import { httpLimits as remitbeeLimits } from './remitbee/limits'
import { runSingxCollector } from './singx/collector'
import { SINGX_B2B_CORRIDORS } from './singx/supported-corridors'
import { httpLimits as singxLimits } from './singx/limits'
import { runPlacidCollector } from './placid/collector'
import { PLACID_B2B_CORRIDORS } from './placid/supported-corridors'
import { httpLimits as placidLimits } from './placid/limits'
import { runRiaCollector } from './ria/collector'
import { RIA_B2B_CORRIDORS } from './ria/supported-corridors'
import { httpLimits as riaLimits } from './ria/limits'
import { runDahabshiilCollector } from './dahabshiil/collector'
import { DAHABSHIIL_B2B_CORRIDORS } from './dahabshiil/supported-corridors'
import { httpLimits as dahabshiilLimits } from './dahabshiil/limits'
import { runSendwaveCollector } from './sendwave/collector'
import { SENDWAVE_B2B_CORRIDORS } from './sendwave/supported-corridors'
import { httpLimits as sendwaveLimits } from './sendwave/limits'
import { runMukuruCollector } from './mukuru/collector'
import { MUKURU_B2B_CORRIDORS } from './mukuru/supported-corridors'
import { httpLimits as mukuruLimits } from './mukuru/limits'
import { runWiseCollector } from './wise/collector'
import { WISE_B2B_CORRIDORS } from './wise/supported-corridors'
import { httpLimits as wiseLimits } from './wise/limits'
import { runWellsFargoCollector } from './wellsfargo/collector'
import { WELLSFARGO_B2B_CORRIDORS } from './wellsfargo/supported-corridors'
import { httpLimits as wellsFargoLimits } from './wellsfargo/limits'

/**
 * Single source of provider collector wiring and static metadata.
 */
export const providerDefinitions: ProviderDefinition[] = [
  {
    providerId: 'remitly',
    displayName: 'Remitly',
    supportedCorridors: REMITLY_B2B_CORRIDORS,
    baseRates: {
      rpm: remitlyLimits.rpm,
      perCorridorRpm: remitlyLimits.perCorridorRpm,
    },
    runCollector: runRemitlyCollector,
  },
  {
    providerId: 'westernunion',
    displayName: 'Western Union',
    supportedCorridors: WESTERNUNION_B2B_CORRIDORS,
    baseRates: {
      rpm: westernUnionLimits.rpm,
      perCorridorRpm: westernUnionLimits.perCorridorRpm,
    },
    runCollector: runWesternUnionCollector,
  },
  {
    providerId: 'worldremit',
    displayName: 'WorldRemit',
    supportedCorridors: WORLDREMIT_B2B_CORRIDORS,
    baseRates: {
      rpm: worldRemitLimits.rpm,
      perCorridorRpm: worldRemitLimits.perCorridorRpm,
    },
    runCollector: runWorldRemitCollector,
  },
  {
    providerId: 'instarem',
    displayName: 'Instarem',
    supportedCorridors: INSTAREM_B2B_CORRIDORS,
    baseRates: {
      rpm: instaremLimits.rpm,
      perCorridorRpm: instaremLimits.perCorridorRpm,
    },
    runCollector: runInstaremCollector,
  },
  {
    providerId: 'wirebarley',
    displayName: 'WireBarley',
    supportedCorridors: WIREBARLEY_B2B_CORRIDORS,
    baseRates: {
      rpm: wireBarleyLimits.rpm,
      perCorridorRpm: wireBarleyLimits.perCorridorRpm,
    },
    runCollector: runWireBarleyCollector,
  },
  {
    providerId: 'alansari',
    displayName: 'Al Ansari',
    supportedCorridors: ALANSARI_B2B_CORRIDORS,
    baseRates: {
      rpm: alansariLimits.rpm,
      perCorridorRpm: alansariLimits.perCorridorRpm,
    },
    runCollector: runAlansariCollector,
  },
  {
    providerId: 'intermex',
    displayName: 'Intermex',
    supportedCorridors: INTERMEX_B2B_CORRIDORS,
    baseRates: {
      rpm: intermexLimits.rpm,
      perCorridorRpm: intermexLimits.perCorridorRpm,
    },
    runCollector: runIntermexCollector,
  },
  {
    providerId: 'xoom',
    displayName: 'Xoom',
    supportedCorridors: XOOM_B2B_CORRIDORS,
    baseRates: {
      rpm: xoomLimits.rpm,
      perCorridorRpm: xoomLimits.perCorridorRpm,
    },
    runCollector: runXoomCollector,
  },
  {
    providerId: 'xe',
    displayName: 'Xe',
    supportedCorridors: XE_B2B_CORRIDORS,
    baseRates: {
      rpm: xeLimits.rpm,
      perCorridorRpm: xeLimits.perCorridorRpm,
    },
    runCollector: runXeCollector,
  },
  {
    providerId: 'transfergo',
    displayName: 'TransferGo',
    supportedCorridors: TRANSFERGO_B2B_CORRIDORS,
    baseRates: {
      rpm: transferGoLimits.rpm,
      perCorridorRpm: transferGoLimits.perCorridorRpm,
    },
    runCollector: runTransferGoCollector,
  },
  {
    providerId: 'paysend',
    displayName: 'Paysend',
    supportedCorridors: PAYSEND_B2B_CORRIDORS,
    baseRates: {
      rpm: paysendLimits.rpm,
      perCorridorRpm: paysendLimits.perCorridorRpm,
    },
    runCollector: runPaysendCollector,
  },
  {
    providerId: 'pangea',
    displayName: 'Pangea',
    supportedCorridors: PANGEA_B2B_CORRIDORS,
    baseRates: {
      rpm: pangeaLimits.rpm,
      perCorridorRpm: pangeaLimits.perCorridorRpm,
    },
    runCollector: runPangeaCollector,
  },
  {
    providerId: 'orbitremit',
    displayName: 'OrbitRemit',
    supportedCorridors: ORBITREMIT_B2B_CORRIDORS,
    baseRates: {
      rpm: orbitremitLimits.rpm,
      perCorridorRpm: orbitremitLimits.perCorridorRpm,
    },
    runCollector: runOrbitRemitCollector,
  },
  {
    providerId: 'bossmoney',
    displayName: 'Boss Money',
    supportedCorridors: BOSSMONEY_B2B_CORRIDORS,
    baseRates: {
      rpm: bossmoneyLimits.rpm,
      perCorridorRpm: bossmoneyLimits.perCorridorRpm,
    },
    runCollector: runBossMoneyCollector,
  },
  {
    providerId: 'koronapay',
    displayName: 'KoronaPay',
    supportedCorridors: KORONAPAY_B2B_CORRIDORS,
    baseRates: {
      rpm: koronapayLimits.rpm,
      perCorridorRpm: koronapayLimits.perCorridorRpm,
    },
    runCollector: runKoronaPayCollector,
  },
  {
    providerId: 'remitbee',
    displayName: 'RemitBee',
    supportedCorridors: REMITBEE_B2B_CORRIDORS,
    baseRates: {
      rpm: remitbeeLimits.rpm,
      perCorridorRpm: remitbeeLimits.perCorridorRpm,
    },
    runCollector: runRemitbeeCollector,
  },
  {
    providerId: 'singx',
    displayName: 'SingX',
    supportedCorridors: SINGX_B2B_CORRIDORS,
    baseRates: {
      rpm: singxLimits.rpm,
      perCorridorRpm: singxLimits.perCorridorRpm,
    },
    runCollector: runSingxCollector,
  },
  {
    providerId: 'placid',
    displayName: 'Placid',
    supportedCorridors: PLACID_B2B_CORRIDORS,
    baseRates: {
      rpm: placidLimits.rpm,
      perCorridorRpm: placidLimits.perCorridorRpm,
    },
    runCollector: runPlacidCollector,
  },
  {
    providerId: 'ria',
    displayName: 'Ria',
    supportedCorridors: RIA_B2B_CORRIDORS,
    baseRates: {
      rpm: riaLimits.rpm,
      perCorridorRpm: riaLimits.perCorridorRpm,
    },
    runCollector: runRiaCollector,
  },
  {
    providerId: 'dahabshiil',
    displayName: 'Dahabshiil',
    supportedCorridors: DAHABSHIIL_B2B_CORRIDORS,
    baseRates: {
      rpm: dahabshiilLimits.rpm,
      perCorridorRpm: dahabshiilLimits.perCorridorRpm,
    },
    runCollector: runDahabshiilCollector,
  },
  {
    providerId: 'sendwave',
    displayName: 'Sendwave',
    supportedCorridors: SENDWAVE_B2B_CORRIDORS,
    baseRates: {
      rpm: sendwaveLimits.rpm,
      perCorridorRpm: sendwaveLimits.perCorridorRpm,
    },
    runCollector: runSendwaveCollector,
  },
  {
    providerId: 'mukuru',
    displayName: 'Mukuru',
    supportedCorridors: MUKURU_B2B_CORRIDORS,
    baseRates: {
      rpm: mukuruLimits.rpm,
      perCorridorRpm: mukuruLimits.perCorridorRpm,
    },
    runCollector: runMukuruCollector,
  },
  {
    providerId: 'wise',
    displayName: 'Wise',
    supportedCorridors: WISE_B2B_CORRIDORS,
    baseRates: {
      rpm: wiseLimits.rpm,
      perCorridorRpm: wiseLimits.perCorridorRpm,
    },
    runCollector: runWiseCollector,
  },
  {
    providerId: 'wellsfargo',
    displayName: 'Wells Fargo',
    supportedCorridors: WELLSFARGO_B2B_CORRIDORS,
    baseRates: {
      rpm: wellsFargoLimits.rpm,
      perCorridorRpm: wellsFargoLimits.perCorridorRpm,
    },
    runCollector: runWellsFargoCollector,
  },
]
