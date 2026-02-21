"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerDefinitions = void 0;
const collector_1 = require("./remitly/collector");
const supported_corridors_1 = require("./remitly/supported-corridors");
const limits_1 = require("./remitly/limits");
const collector_2 = require("./westernunion/collector");
const supported_corridors_2 = require("./westernunion/supported-corridors");
const limits_2 = require("./westernunion/limits");
const collector_3 = require("./worldremit/collector");
const supported_corridors_3 = require("./worldremit/supported-corridors");
const limits_3 = require("./worldremit/limits");
const collector_4 = require("./instarem/collector");
const supported_corridors_4 = require("./instarem/supported-corridors");
const limits_4 = require("./instarem/limits");
const collector_5 = require("./wirebarley/collector");
const supported_corridors_5 = require("./wirebarley/supported-corridors");
const limits_5 = require("./wirebarley/limits");
const collector_6 = require("./alansari/collector");
const supported_corridors_6 = require("./alansari/supported-corridors");
const limits_6 = require("./alansari/limits");
const collector_7 = require("./intermex/collector");
const supported_corridors_7 = require("./intermex/supported-corridors");
const limits_7 = require("./intermex/limits");
const collector_8 = require("./xoom/collector");
const supported_corridors_8 = require("./xoom/supported-corridors");
const limits_8 = require("./xoom/limits");
const collector_9 = require("./xe/collector");
const supported_corridors_9 = require("./xe/supported-corridors");
const limits_9 = require("./xe/limits");
const collector_10 = require("./transfergo/collector");
const supported_corridors_10 = require("./transfergo/supported-corridors");
const limits_10 = require("./transfergo/limits");
const collector_11 = require("./paysend/collector");
const supported_corridors_11 = require("./paysend/supported-corridors");
const limits_11 = require("./paysend/limits");
const collector_12 = require("./pangea/collector");
const supported_corridors_12 = require("./pangea/supported-corridors");
const limits_12 = require("./pangea/limits");
const collector_13 = require("./orbitremit/collector");
const supported_corridors_13 = require("./orbitremit/supported-corridors");
const limits_13 = require("./orbitremit/limits");
const collector_14 = require("./bossmoney/collector");
const supported_corridors_14 = require("./bossmoney/supported-corridors");
const limits_14 = require("./bossmoney/limits");
const collector_15 = require("./koronapay/collector");
const supported_corridors_15 = require("./koronapay/supported-corridors");
const limits_15 = require("./koronapay/limits");
const collector_16 = require("./remitbee/collector");
const supported_corridors_16 = require("./remitbee/supported-corridors");
const limits_16 = require("./remitbee/limits");
const collector_17 = require("./singx/collector");
const supported_corridors_17 = require("./singx/supported-corridors");
const limits_17 = require("./singx/limits");
const collector_18 = require("./placid/collector");
const supported_corridors_18 = require("./placid/supported-corridors");
const limits_18 = require("./placid/limits");
const collector_19 = require("./ria/collector");
const supported_corridors_19 = require("./ria/supported-corridors");
const limits_19 = require("./ria/limits");
const collector_20 = require("./dahabshiil/collector");
const supported_corridors_20 = require("./dahabshiil/supported-corridors");
const limits_20 = require("./dahabshiil/limits");
const collector_21 = require("./sendwave/collector");
const supported_corridors_21 = require("./sendwave/supported-corridors");
const limits_21 = require("./sendwave/limits");
const collector_22 = require("./mukuru/collector");
const supported_corridors_22 = require("./mukuru/supported-corridors");
const limits_22 = require("./mukuru/limits");
const collector_23 = require("./wise/collector");
const supported_corridors_23 = require("./wise/supported-corridors");
const limits_23 = require("./wise/limits");
const collector_24 = require("./wellsfargo/collector");
const supported_corridors_24 = require("./wellsfargo/supported-corridors");
const limits_24 = require("./wellsfargo/limits");
/**
 * Single source of provider collector wiring and static metadata.
 */
exports.providerDefinitions = [
    {
        providerId: 'remitly',
        displayName: 'Remitly',
        supportedCorridors: supported_corridors_1.REMITLY_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_1.httpLimits.rpm,
            perCorridorRpm: limits_1.httpLimits.perCorridorRpm,
        },
        runCollector: collector_1.runRemitlyCollector,
    },
    {
        providerId: 'westernunion',
        displayName: 'Western Union',
        supportedCorridors: supported_corridors_2.WESTERNUNION_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_2.httpLimits.rpm,
            perCorridorRpm: limits_2.httpLimits.perCorridorRpm,
        },
        runCollector: collector_2.runWesternUnionCollector,
    },
    {
        providerId: 'worldremit',
        displayName: 'WorldRemit',
        supportedCorridors: supported_corridors_3.WORLDREMIT_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_3.httpLimits.rpm,
            perCorridorRpm: limits_3.httpLimits.perCorridorRpm,
        },
        runCollector: collector_3.runWorldRemitCollector,
    },
    {
        providerId: 'instarem',
        displayName: 'Instarem',
        supportedCorridors: supported_corridors_4.INSTAREM_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_4.httpLimits.rpm,
            perCorridorRpm: limits_4.httpLimits.perCorridorRpm,
        },
        runCollector: collector_4.runInstaremCollector,
    },
    {
        providerId: 'wirebarley',
        displayName: 'WireBarley',
        supportedCorridors: supported_corridors_5.WIREBARLEY_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_5.httpLimits.rpm,
            perCorridorRpm: limits_5.httpLimits.perCorridorRpm,
        },
        runCollector: collector_5.runWireBarleyCollector,
    },
    {
        providerId: 'alansari',
        displayName: 'Al Ansari',
        supportedCorridors: supported_corridors_6.ALANSARI_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_6.httpLimits.rpm,
            perCorridorRpm: limits_6.httpLimits.perCorridorRpm,
        },
        runCollector: collector_6.runAlansariCollector,
    },
    {
        providerId: 'intermex',
        displayName: 'Intermex',
        supportedCorridors: supported_corridors_7.INTERMEX_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_7.httpLimits.rpm,
            perCorridorRpm: limits_7.httpLimits.perCorridorRpm,
        },
        runCollector: collector_7.runIntermexCollector,
    },
    {
        providerId: 'xoom',
        displayName: 'Xoom',
        supportedCorridors: supported_corridors_8.XOOM_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_8.httpLimits.rpm,
            perCorridorRpm: limits_8.httpLimits.perCorridorRpm,
        },
        runCollector: collector_8.runXoomCollector,
    },
    {
        providerId: 'xe',
        displayName: 'Xe',
        supportedCorridors: supported_corridors_9.XE_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_9.httpLimits.rpm,
            perCorridorRpm: limits_9.httpLimits.perCorridorRpm,
        },
        runCollector: collector_9.runXeCollector,
    },
    {
        providerId: 'transfergo',
        displayName: 'TransferGo',
        supportedCorridors: supported_corridors_10.TRANSFERGO_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_10.httpLimits.rpm,
            perCorridorRpm: limits_10.httpLimits.perCorridorRpm,
        },
        runCollector: collector_10.runTransferGoCollector,
    },
    {
        providerId: 'paysend',
        displayName: 'Paysend',
        supportedCorridors: supported_corridors_11.PAYSEND_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_11.httpLimits.rpm,
            perCorridorRpm: limits_11.httpLimits.perCorridorRpm,
        },
        runCollector: collector_11.runPaysendCollector,
    },
    {
        providerId: 'pangea',
        displayName: 'Pangea',
        supportedCorridors: supported_corridors_12.PANGEA_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_12.httpLimits.rpm,
            perCorridorRpm: limits_12.httpLimits.perCorridorRpm,
        },
        runCollector: collector_12.runPangeaCollector,
    },
    {
        providerId: 'orbitremit',
        displayName: 'OrbitRemit',
        supportedCorridors: supported_corridors_13.ORBITREMIT_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_13.httpLimits.rpm,
            perCorridorRpm: limits_13.httpLimits.perCorridorRpm,
        },
        runCollector: collector_13.runOrbitRemitCollector,
    },
    {
        providerId: 'bossmoney',
        displayName: 'Boss Money',
        supportedCorridors: supported_corridors_14.BOSSMONEY_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_14.httpLimits.rpm,
            perCorridorRpm: limits_14.httpLimits.perCorridorRpm,
        },
        runCollector: collector_14.runBossMoneyCollector,
    },
    {
        providerId: 'koronapay',
        displayName: 'KoronaPay',
        supportedCorridors: supported_corridors_15.KORONAPAY_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_15.httpLimits.rpm,
            perCorridorRpm: limits_15.httpLimits.perCorridorRpm,
        },
        runCollector: collector_15.runKoronaPayCollector,
    },
    {
        providerId: 'remitbee',
        displayName: 'RemitBee',
        supportedCorridors: supported_corridors_16.REMITBEE_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_16.httpLimits.rpm,
            perCorridorRpm: limits_16.httpLimits.perCorridorRpm,
        },
        runCollector: collector_16.runRemitbeeCollector,
    },
    {
        providerId: 'singx',
        displayName: 'SingX',
        supportedCorridors: supported_corridors_17.SINGX_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_17.httpLimits.rpm,
            perCorridorRpm: limits_17.httpLimits.perCorridorRpm,
        },
        runCollector: collector_17.runSingxCollector,
    },
    {
        providerId: 'placid',
        displayName: 'Placid',
        supportedCorridors: supported_corridors_18.PLACID_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_18.httpLimits.rpm,
            perCorridorRpm: limits_18.httpLimits.perCorridorRpm,
        },
        runCollector: collector_18.runPlacidCollector,
    },
    {
        providerId: 'ria',
        displayName: 'Ria',
        supportedCorridors: supported_corridors_19.RIA_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_19.httpLimits.rpm,
            perCorridorRpm: limits_19.httpLimits.perCorridorRpm,
        },
        runCollector: collector_19.runRiaCollector,
    },
    {
        providerId: 'dahabshiil',
        displayName: 'Dahabshiil',
        supportedCorridors: supported_corridors_20.DAHABSHIIL_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_20.httpLimits.rpm,
            perCorridorRpm: limits_20.httpLimits.perCorridorRpm,
        },
        runCollector: collector_20.runDahabshiilCollector,
    },
    {
        providerId: 'sendwave',
        displayName: 'Sendwave',
        supportedCorridors: supported_corridors_21.SENDWAVE_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_21.httpLimits.rpm,
            perCorridorRpm: limits_21.httpLimits.perCorridorRpm,
        },
        runCollector: collector_21.runSendwaveCollector,
    },
    {
        providerId: 'mukuru',
        displayName: 'Mukuru',
        supportedCorridors: supported_corridors_22.MUKURU_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_22.httpLimits.rpm,
            perCorridorRpm: limits_22.httpLimits.perCorridorRpm,
        },
        runCollector: collector_22.runMukuruCollector,
    },
    {
        providerId: 'wise',
        displayName: 'Wise',
        supportedCorridors: supported_corridors_23.WISE_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_23.httpLimits.rpm,
            perCorridorRpm: limits_23.httpLimits.perCorridorRpm,
        },
        runCollector: collector_23.runWiseCollector,
    },
    {
        providerId: 'wellsfargo',
        displayName: 'Wells Fargo',
        supportedCorridors: supported_corridors_24.WELLSFARGO_B2B_CORRIDORS,
        baseRates: {
            rpm: limits_24.httpLimits.rpm,
            perCorridorRpm: limits_24.httpLimits.perCorridorRpm,
        },
        runCollector: collector_24.runWellsFargoCollector,
    },
];
