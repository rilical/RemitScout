"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteRefreshStatus = void 0;
var QuoteRefreshStatus;
(function (QuoteRefreshStatus) {
    QuoteRefreshStatus["PENDING"] = "pending";
    QuoteRefreshStatus["PROCESSING"] = "processing";
    QuoteRefreshStatus["COMPLETED"] = "completed";
    QuoteRefreshStatus["FAILED"] = "failed";
    QuoteRefreshStatus["BLOCKED"] = "blocked";
    QuoteRefreshStatus["SKIPPED"] = "skipped";
})(QuoteRefreshStatus || (exports.QuoteRefreshStatus = QuoteRefreshStatus = {}));
