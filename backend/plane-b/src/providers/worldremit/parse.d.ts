import type { CollectorRequest } from '../../collectors/types';
import { QualityFlag } from '../../normalize/quality-flags';
type WorldRemitMoney = {
    amount: number;
    currency: string;
    __typename: string;
};
type WorldRemitFee = {
    value: WorldRemitMoney;
    type: string;
    __typename: string;
};
type WorldRemitDiscount = {
    value: WorldRemitMoney;
    type: string;
    __typename: string;
};
type WorldRemitInformativeSummary = {
    fee: WorldRemitFee;
    discount: WorldRemitDiscount;
    appliedPromotions: unknown[];
    totalToPay: {
        amount: number;
        __typename: string;
    };
    __typename: string;
};
type WorldRemitExchangeRate = {
    value: number;
    crossedOutValue: number | null;
    __typename: string;
};
type WorldRemitPayInMethod = {
    name: string;
    transferRedirectionType: string;
    id: string;
    icon: {
        resolutions: unknown[];
        __typename: string;
    };
    __typename: string;
};
type WorldRemitPayInMethodCalculation = {
    totalToPay: WorldRemitMoney;
    payInMethod: WorldRemitPayInMethod;
    __typename: string;
};
type WorldRemitCalculation = {
    id: string | null;
    isFree: boolean;
    informativeSummary: WorldRemitInformativeSummary;
    payInMethodsCalculations: WorldRemitPayInMethodCalculation[];
    send: WorldRemitMoney;
    receive: WorldRemitMoney;
    rounding: {
        sendRoundingSeed: number;
        receiveRoundingSeed: number;
        __typename: string;
    };
    exchangeRate: WorldRemitExchangeRate;
    __typename: string;
};
type WorldRemitCreateCalculation = {
    calculation: WorldRemitCalculation;
    errors: Array<{
        __typename: string;
        message: string;
        [key: string]: unknown;
    }>;
    __typename: string;
};
type WorldRemitPayoutMethod = {
    code: string;
    payOutTimeEstimate: string;
    correspondents: Array<{
        id: string;
        name: string;
        payOutTime: string | null;
        __typename: string;
    }>;
    __typename: string;
};
type WorldRemitPayload = {
    payoutMethods?: {
        payOutMethods: WorldRemitPayoutMethod[];
    };
    calculation?: {
        createCalculation: WorldRemitCreateCalculation;
    };
    mappedPayoutMethod?: string;
    selectedPayoutMethod?: WorldRemitPayoutMethod | null;
};
export type WorldRemitParsedQuote = {
    send_amount: number;
    receive_amount: number;
    fee_amount: number;
    total_debit_amount: number;
    payin_method: string;
    payout_method: string;
    fee_currency: string | null;
    exchange_rate: number | null;
    promotional_fee_amount: number | null;
    promotional_rate: number | null;
    base_rate: number | null;
    promotional_cap_amount: number | null;
    delivery_time_min_minutes: number | null;
    delivery_time_max_minutes: number | null;
    collected_at: string;
    parser_version: string;
    parse_flags: QualityFlag[];
};
export declare const extractWorldRemitMethodPairs: (payload: WorldRemitPayload) => {
    payin_method: string;
    payout_method: string;
}[];
export declare const parseWorldRemitPayload: (payload: WorldRemitPayload, request: CollectorRequest) => WorldRemitParsedQuote | null;
export {};
