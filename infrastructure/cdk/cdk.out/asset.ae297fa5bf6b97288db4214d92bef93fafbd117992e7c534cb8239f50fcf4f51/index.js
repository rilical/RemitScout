"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// backend/shared/logger.ts
var import_crypto, levelRank, normalizeLevel, resolveLogLevel, serializeError, normalizeContext, createLogger;
var init_logger = __esm({
  "backend/shared/logger.ts"() {
    "use strict";
    import_crypto = require("crypto");
    levelRank = {
      debug: 10,
      info: 20,
      warn: 30,
      error: 40
    };
    normalizeLevel = (value) => {
      const lowered = value?.toLowerCase();
      if (lowered === "debug" || lowered === "info" || lowered === "warn" || lowered === "error") {
        return lowered;
      }
      return "info";
    };
    resolveLogLevel = () => {
      if (process.env.LOG_LEVEL) {
        return normalizeLevel(process.env.LOG_LEVEL);
      }
      return process.env.NODE_ENV === "production" ? "info" : "debug";
    };
    serializeError = (error) => {
      if (error instanceof Error) {
        return {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      }
      return { message: String(error) };
    };
    normalizeContext = (context2) => {
      if (!context2) return void 0;
      const normalized = {};
      for (const [key, value] of Object.entries(context2)) {
        if (key === "error") {
          normalized.error = serializeError(value);
          continue;
        }
        normalized[key] = value;
      }
      return normalized;
    };
    createLogger = (component, traceId) => {
      const currentLevel = resolveLogLevel();
      const resolvedTraceId = traceId || (0, import_crypto.randomUUID)();
      const emit = (level, event, context2) => {
        if (levelRank[level] < levelRank[currentLevel]) return;
        const payload = {
          level,
          time: (/* @__PURE__ */ new Date()).toISOString(),
          component,
          event,
          trace_id: resolvedTraceId,
          ...normalizeContext(context2)
        };
        if (level === "error") {
          console.error(JSON.stringify(payload));
          return;
        }
        if (level === "warn") {
          console.warn(JSON.stringify(payload));
          return;
        }
        console.log(JSON.stringify(payload));
      };
      return {
        debug: (event, context2) => emit("debug", event, context2),
        info: (event, context2) => emit("info", event, context2),
        warn: (event, context2) => emit("warn", event, context2),
        error: (event, context2) => emit("error", event, context2)
      };
    };
  }
});

// node_modules/.pnpm/postgres-array@2.0.0/node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/.pnpm/postgres-array@2.0.0/node_modules/postgres-array/index.js"(exports2) {
    "use strict";
    exports2.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source;
        this.transform = transform || identity;
        this.position = 0;
        this.entries = [];
        this.recorded = [];
        this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        if (character === "\\") {
          return {
            value: this.source[this.position++],
            escaped: true
          };
        }
        return {
          value: character,
          escaped: false
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        if (this.recorded.length > 0 || includeEmpty) {
          entry = this.recorded.join("");
          if (entry === "NULL" && !includeEmpty) {
            entry = null;
          }
          if (entry !== null) entry = this.transform(entry);
          this.entries.push(entry);
          this.recorded = [];
        }
      }
      consumeDimensions() {
        if (this.source[0] === "[") {
          while (!this.isEof()) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
        }
      }
      parse(nested) {
        var character, parser, quote;
        this.consumeDimensions();
        while (!this.isEof()) {
          character = this.nextCharacter();
          if (character.value === "{" && !quote) {
            this.dimension++;
            if (this.dimension > 1) {
              parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform);
              this.entries.push(parser.parse(true));
              this.position += parser.position - 2;
            }
          } else if (character.value === "}" && !quote) {
            this.dimension--;
            if (!this.dimension) {
              this.newEntry();
              if (nested) return this.entries;
            }
          } else if (character.value === '"' && !character.escaped) {
            if (quote) this.newEntry(true);
            quote = !quote;
          } else if (character.value === "," && !quote) {
            this.newEntry();
          } else {
            this.record(character.value);
          }
        }
        if (this.dimension !== 0) {
          throw new Error("array dimension not balanced");
        }
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/arrayParser.js"(exports2, module2) {
    var array = require_postgres_array();
    module2.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// node_modules/.pnpm/postgres-date@1.0.7/node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/.pnpm/postgres-date@1.0.7/node_modules/postgres-date/index.js"(exports2, module2) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
    var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
    var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
    var INFINITY = /^-?infinity$/;
    module2.exports = function parseDate(isoDate) {
      if (INFINITY.test(isoDate)) {
        return Number(isoDate.replace("i", "I"));
      }
      var matches = DATE_TIME.exec(isoDate);
      if (!matches) {
        return getDate(isoDate) || null;
      }
      var isBC = !!matches[8];
      var year = parseInt(matches[1], 10);
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var hour = parseInt(matches[4], 10);
      var minute = parseInt(matches[5], 10);
      var second = parseInt(matches[6], 10);
      var ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date;
      var offset = timeZoneOffset(isoDate);
      if (offset != null) {
        date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
        if (is0To99(year)) {
          date.setUTCFullYear(year);
        }
        if (offset !== 0) {
          date.setTime(date.getTime() - offset);
        }
      } else {
        date = new Date(year, month, day, hour, minute, second, ms);
        if (is0To99(year)) {
          date.setFullYear(year);
        }
      }
      return date;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (!matches) {
        return;
      }
      var year = parseInt(matches[1], 10);
      var isBC = !!matches[4];
      if (isBC) {
        year = bcYearToNegativeYear(year);
      }
      var month = parseInt(matches[2], 10) - 1;
      var day = matches[3];
      var date = new Date(year, month, day);
      if (is0To99(year)) {
        date.setFullYear(year);
      }
      return date;
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00")) {
        return 0;
      }
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (!zone) return;
      var type = zone[1];
      if (type === "Z") {
        return 0;
      }
      var sign = type === "-" ? -1 : 1;
      var offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
      return offset * sign * 1e3;
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// node_modules/.pnpm/xtend@4.0.2/node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/.pnpm/xtend@4.0.2/node_modules/xtend/mutable.js"(exports2, module2) {
    module2.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    }
  }
});

// node_modules/.pnpm/postgres-interval@1.2.0/node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/.pnpm/postgres-interval@1.2.0/node_modules/postgres-interval/index.js"(exports2, module2) {
    "use strict";
    var extend = require_mutable();
    module2.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval)) {
        return new PostgresInterval(raw);
      }
      extend(this, parse(raw));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      if (this.milliseconds && filtered.indexOf("seconds") < 0) {
        filtered.push("seconds");
      }
      if (filtered.length === 0) return "0";
      return filtered.map(function(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
        }
        return value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    };
    var dateProperties = ["years", "months", "days"];
    var timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join("");
      var timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        if (property === "seconds" && this.milliseconds) {
          value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
        }
        return value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)";
    var YEAR = NUMBER + "\\s+years?";
    var MONTH = NUMBER + "\\s+mons?";
    var DAY = NUMBER + "\\s+days?";
    var TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?";
    var INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*"));
    var positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    };
    var negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval);
      var isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property];
        var value = matches[position];
        if (!value) return parsed;
        value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
        if (!value) return parsed;
        if (isNegative && ~negatives.indexOf(property)) {
          value *= -1;
        }
        parsed[property] = value;
        return parsed;
      }, {});
    }
  }
});

// node_modules/.pnpm/postgres-bytea@1.0.1/node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/.pnpm/postgres-bytea@1.0.1/node_modules/postgres-bytea/index.js"(exports2, module2) {
    "use strict";
    var bufferFrom = Buffer.from || Buffer;
    module2.exports = function parseBytea(input) {
      if (/^\\x/.test(input)) {
        return bufferFrom(input.substr(2), "hex");
      }
      var output = "";
      var i = 0;
      while (i < input.length) {
        if (input[i] !== "\\") {
          output += input[i];
          ++i;
        } else {
          if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
            output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
            i += 4;
          } else {
            var backslashes = 1;
            while (i + backslashes < input.length && input[i + backslashes] === "\\") {
              backslashes++;
            }
            for (var k = 0; k < Math.floor(backslashes / 2); ++k) {
              output += "\\";
            }
            i += Math.floor(backslashes / 2) * 2;
          }
        }
      }
      return bufferFrom(output, "binary");
    };
  }
});

// node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/textParsers.js"(exports2, module2) {
    var array = require_postgres_array();
    var arrayParser = require_arrayParser();
    var parseDate = require_postgres_date();
    var parseInterval = require_postgres_interval();
    var parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function nullAllowed(value) {
        if (value === null) return value;
        return fn(value);
      };
    }
    function parseBool(value) {
      if (value === null) return value;
      return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      if (!value) return null;
      return array.parse(value, parseBool);
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(parseBaseTenInt));
    }
    function parseBigIntegerArray(value) {
      if (!value) return null;
      return array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      }));
    }
    var parsePointArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parsePoint(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseFloatArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseFloat(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseStringArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value);
      return p.parse();
    };
    var parseDateArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseDate(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseIntervalArray = function(value) {
      if (!value) {
        return null;
      }
      var p = arrayParser.create(value, function(entry) {
        if (entry !== null) {
          entry = parseInterval(entry);
        }
        return entry;
      });
      return p.parse();
    };
    var parseByteAArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(parseByteA));
    };
    var parseInteger = function(value) {
      return parseInt(value, 10);
    };
    var parseBigInteger = function(value) {
      var valStr = String(value);
      if (/^\d+$/.test(valStr)) {
        return valStr;
      }
      return value;
    };
    var parseJsonArray = function(value) {
      if (!value) {
        return null;
      }
      return array.parse(value, allowNull(JSON.parse));
    };
    var parsePoint = function(value) {
      if (value[0] !== "(") {
        return null;
      }
      value = value.substring(1, value.length - 1).split(",");
      return {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      };
    };
    var parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(") {
        return null;
      }
      var point = "(";
      var radius = "";
      var pointParsed = false;
      for (var i = 2; i < value.length - 1; i++) {
        if (!pointParsed) {
          point += value[i];
        }
        if (value[i] === ")") {
          pointParsed = true;
          continue;
        } else if (!pointParsed) {
          continue;
        }
        if (value[i] === ",") {
          continue;
        }
        radius += value[i];
      }
      var result = parsePoint(point);
      result.radius = parseFloat(radius);
      return result;
    };
    var init = function(register) {
      register(20, parseBigInteger);
      register(21, parseInteger);
      register(23, parseInteger);
      register(26, parseInteger);
      register(700, parseFloat);
      register(701, parseFloat);
      register(16, parseBool);
      register(1082, parseDate);
      register(1114, parseDate);
      register(1184, parseDate);
      register(600, parsePoint);
      register(651, parseStringArray);
      register(718, parseCircle);
      register(1e3, parseBoolArray);
      register(1001, parseByteAArray);
      register(1005, parseIntegerArray);
      register(1007, parseIntegerArray);
      register(1028, parseIntegerArray);
      register(1016, parseBigIntegerArray);
      register(1017, parsePointArray);
      register(1021, parseFloatArray);
      register(1022, parseFloatArray);
      register(1231, parseFloatArray);
      register(1014, parseStringArray);
      register(1015, parseStringArray);
      register(1008, parseStringArray);
      register(1009, parseStringArray);
      register(1040, parseStringArray);
      register(1041, parseStringArray);
      register(1115, parseDateArray);
      register(1182, parseDateArray);
      register(1185, parseDateArray);
      register(1186, parseInterval);
      register(1187, parseIntervalArray);
      register(17, parseByteA);
      register(114, JSON.parse.bind(JSON));
      register(3802, JSON.parse.bind(JSON));
      register(199, parseJsonArray);
      register(3807, parseJsonArray);
      register(3907, parseStringArray);
      register(2951, parseStringArray);
      register(791, parseStringArray);
      register(1183, parseStringArray);
      register(1270, parseStringArray);
    };
    module2.exports = {
      init
    };
  }
});

// node_modules/.pnpm/pg-int8@1.0.1/node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/.pnpm/pg-int8@1.0.1/node_modules/pg-int8/index.js"(exports2, module2) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0);
      var low = buffer.readUInt32BE(4);
      var sign = "";
      if (high < 0) {
        high = ~high + (low === 0);
        low = ~low + 1 >>> 0;
        sign = "-";
      }
      var result = "";
      var carry;
      var t;
      var digits;
      var pad;
      var l;
      var i;
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        high = high / BASE >>> 0;
        t = 4294967296 * carry + low;
        low = t / BASE >>> 0;
        digits = "" + (t - BASE * low);
        if (low === 0 && high === 0) {
          return sign + digits + result;
        }
        pad = "";
        l = 6 - digits.length;
        for (i = 0; i < l; i++) {
          pad += "0";
        }
        result = pad + digits + result;
      }
      {
        carry = high % BASE;
        t = 4294967296 * carry + low;
        digits = "" + t % BASE;
        return sign + digits + result;
      }
    }
    module2.exports = readInt8;
  }
});

// node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/binaryParsers.js"(exports2, module2) {
    var parseInt64 = require_pg_int8();
    var parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0;
      invert = invert || false;
      callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3;
      var inv = function(value) {
        if (invert) {
          return ~value & 255;
        }
        return value;
      };
      var mask = 255;
      var firstBits = 8 - offset % 8;
      if (bits < firstBits) {
        mask = 255 << 8 - bits & 255;
        firstBits = bits;
      }
      if (offset) {
        mask = mask >> offset % 8;
      }
      var result = 0;
      if (offset % 8 + bits >= 8) {
        result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
      }
      var bytes = bits + offset >> 3;
      for (var i = offsetBytes + 1; i < bytes; i++) {
        result = callback(result, inv(data[i]), 8);
      }
      var lastBits = (bits + offset) % 8;
      if (lastBits > 0) {
        result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
      }
      return result;
    };
    var parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1;
      var sign = parseBits(data, 1);
      var exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0) {
        return 0;
      }
      var precisionBitsCounter = 1;
      var parsePrecisionBits = function(lastValue, newValue, bits) {
        if (lastValue === 0) {
          lastValue = 1;
        }
        for (var i = 1; i <= bits; i++) {
          precisionBitsCounter /= 2;
          if ((newValue & 1 << bits - i) > 0) {
            lastValue += precisionBitsCounter;
          }
        }
        return lastValue;
      };
      var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
      if (exponent == Math.pow(2, exponentBits + 1) - 1) {
        if (mantissa === 0) {
          return sign === 0 ? Infinity : -Infinity;
        }
        return NaN;
      }
      return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    };
    var parseInt16 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 15, 1, true) + 1);
      }
      return parseBits(value, 15, 1);
    };
    var parseInt32 = function(value) {
      if (parseBits(value, 1) == 1) {
        return -1 * (parseBits(value, 31, 1, true) + 1);
      }
      return parseBits(value, 31, 1);
    };
    var parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    };
    var parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    };
    var parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152) {
        return NaN;
      }
      var weight = Math.pow(1e4, parseBits(value, 16, 16));
      var result = 0;
      var digits = [];
      var ndigits = parseBits(value, 16);
      for (var i = 0; i < ndigits; i++) {
        result += parseBits(value, 16, 64 + 16 * i) * weight;
        weight /= 1e4;
      }
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    };
    var parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1);
      var rawValue = parseBits(value, 63, 1);
      var result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      if (!isUTC) {
        result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
      }
      result.usec = rawValue % 1e3;
      result.getMicroSeconds = function() {
        return this.usec;
      };
      result.setMicroSeconds = function(value2) {
        this.usec = value2;
      };
      result.getUTCMicroSeconds = function() {
        return this.usec;
      };
      return result;
    };
    var parseArray = function(value) {
      var dim = parseBits(value, 32);
      var flags = parseBits(value, 32, 32);
      var elementType = parseBits(value, 32, 64);
      var offset = 96;
      var dims = [];
      for (var i = 0; i < dim; i++) {
        dims[i] = parseBits(value, 32, offset);
        offset += 32;
        offset += 32;
      }
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        offset += 32;
        if (length == 4294967295) {
          return null;
        }
        var result;
        if (elementType2 == 23 || elementType2 == 20) {
          result = parseBits(value, length * 8, offset);
          offset += length * 8;
          return result;
        } else if (elementType2 == 25) {
          result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
          return result;
        } else {
          console.log("ERROR: ElementType not implemented: " + elementType2);
        }
      };
      var parse = function(dimension, elementType2) {
        var array = [];
        var i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++) {
            array[i2] = parse(dimension, elementType2);
          }
          dimension.unshift(count);
        } else {
          for (i2 = 0; i2 < dimension[0]; i2++) {
            array[i2] = parseElement(elementType2);
          }
        }
        return array;
      };
      return parse(dims, elementType);
    };
    var parseText = function(value) {
      return value.toString("utf8");
    };
    var parseBool = function(value) {
      if (value === null) return null;
      return parseBits(value, 8) > 0;
    };
    var init = function(register) {
      register(20, parseInt64);
      register(21, parseInt16);
      register(23, parseInt32);
      register(26, parseInt32);
      register(1700, parseNumeric);
      register(700, parseFloat32);
      register(701, parseFloat64);
      register(16, parseBool);
      register(1114, parseDate.bind(null, false));
      register(1184, parseDate.bind(null, true));
      register(1e3, parseArray);
      register(1007, parseArray);
      register(1016, parseArray);
      register(1008, parseArray);
      register(1009, parseArray);
      register(25, parseText);
    };
    module2.exports = {
      init
    };
  }
});

// node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/lib/builtins.js"(exports2, module2) {
    module2.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/.pnpm/pg-types@2.2.0/node_modules/pg-types/index.js"(exports2) {
    var textParsers = require_textParsers();
    var binaryParsers = require_binaryParsers();
    var arrayParser = require_arrayParser();
    var builtinTypes = require_builtins();
    exports2.getTypeParser = getTypeParser;
    exports2.setTypeParser = setTypeParser;
    exports2.arrayParser = arrayParser;
    exports2.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    function getTypeParser(oid, format) {
      format = format || "text";
      if (!typeParsers[format]) {
        return noParse;
      }
      return typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      if (typeof format == "function") {
        parseFn = format;
        format = "text";
      }
      typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/defaults.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user: process.platform === "win32" ? process.env.USERNAME : process.env.USER,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: false,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: false,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: false,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: false,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: false,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: false,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: false,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types();
    var parseBigInteger = pgTypes.getTypeParser(20, "text");
    var parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module2.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
      pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/utils.js"(exports2, module2) {
    "use strict";
    var defaults2 = require_defaults();
    var util = require("util");
    var { isDate } = util.types || util;
    function escapeElement(elementRepresentation) {
      const escaped = elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return '"' + escaped + '"';
    }
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        if (i > 0) {
          result = result + ",";
        }
        if (val[i] === null || typeof val[i] === "undefined") {
          result = result + "NULL";
        } else if (Array.isArray(val[i])) {
          result = result + arrayString(val[i]);
        } else if (ArrayBuffer.isView(val[i])) {
          let item = val[i];
          if (!(item instanceof Buffer)) {
            const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
            if (buf.length === item.byteLength) {
              item = buf;
            } else {
              item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
            }
          }
          result += "\\\\x" + item.toString("hex");
        } else {
          result += escapeElement(prepareValue(val[i]));
        }
      }
      result = result + "}";
      return result;
    }
    var prepareValue = function(val, seen) {
      if (val == null) {
        return null;
      }
      if (typeof val === "object") {
        if (val instanceof Buffer) {
          return val;
        }
        if (ArrayBuffer.isView(val)) {
          const buf = Buffer.from(val.buffer, val.byteOffset, val.byteLength);
          if (buf.length === val.byteLength) {
            return buf;
          }
          return buf.slice(val.byteOffset, val.byteOffset + val.byteLength);
        }
        if (isDate(val)) {
          if (defaults2.parseInputDatesAsUTC) {
            return dateToStringUTC(val);
          } else {
            return dateToString(val);
          }
        }
        if (Array.isArray(val)) {
          return arrayString(val);
        }
        return prepareObject(val, seen);
      }
      return val.toString();
    };
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres === "function") {
        seen = seen || [];
        if (seen.indexOf(val) !== -1) {
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        }
        seen.push(val);
        return prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    function dateToString(date) {
      let offset = -date.getTimezoneOffset();
      let year = date.getFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret2 = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      if (offset < 0) {
        ret2 += "-";
        offset *= -1;
      } else {
        ret2 += "+";
      }
      ret2 += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
      if (isBCYear) ret2 += " BC";
      return ret2;
    }
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear();
      const isBCYear = year < 1;
      if (isBCYear) year = Math.abs(year) + 1;
      let ret2 = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      ret2 += "+00:00";
      if (isBCYear) ret2 += " BC";
      return ret2;
    }
    function normalizeQueryConfig(config2, values, callback) {
      config2 = typeof config2 === "string" ? { text: config2 } : config2;
      if (values) {
        if (typeof values === "function") {
          config2.callback = values;
        } else {
          config2.values = values;
        }
      }
      if (callback) {
        config2.callback = callback;
      }
      return config2;
    }
    var escapeIdentifier2 = function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    };
    var escapeLiteral2 = function(str) {
      let hasBackslash = false;
      let escaped = "'";
      if (str == null) {
        return "''";
      }
      if (typeof str !== "string") {
        return "''";
      }
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "'") {
          escaped += c + c;
        } else if (c === "\\") {
          escaped += c + c;
          hasBackslash = true;
        } else {
          escaped += c;
        }
      }
      escaped += "'";
      if (hasBackslash === true) {
        escaped = " E" + escaped;
      }
      return escaped;
    };
    module2.exports = {
      prepareValue: function prepareValueWrapper(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier: escapeIdentifier2,
      escapeLiteral: escapeLiteral2
    };
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/utils-legacy.js"(exports2, module2) {
    "use strict";
    var nodeCrypto = require("crypto");
    function md5(string) {
      return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
    }
    function postgresMd5PasswordHash(user, password, salt) {
      const inner = md5(password + user);
      const outer = md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    function sha256(text) {
      return nodeCrypto.createHash("sha256").update(text).digest();
    }
    function hashByName(hashName, text) {
      hashName = hashName.replace(/(\D)-/, "$1");
      return nodeCrypto.createHash(hashName).update(text).digest();
    }
    function hmacSha256(key, msg) {
      return nodeCrypto.createHmac("sha256", key).update(msg).digest();
    }
    async function deriveKey(password, salt, iterations) {
      return nodeCrypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    }
    module2.exports = {
      postgresMd5PasswordHash,
      randomBytes: nodeCrypto.randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/utils-webcrypto.js"(exports2, module2) {
    var nodeCrypto = require("crypto");
    module2.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
    var subtleCrypto = webCrypto.subtle;
    var textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch (e) {
        const data = typeof string === "string" ? textEncoder.encode(string) : string;
        const hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt) {
      const inner = await md5(password + user);
      const outer = await md5(Buffer.concat([Buffer.from(inner), salt]));
      return "md5" + outer;
    }
    async function sha256(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    async function hmacSha256(keyBuffer, msg) {
      const key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt, iterations) {
      const key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
      const params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/utils.js"(exports2, module2) {
    "use strict";
    var useLegacyCrypto = parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15;
    if (useLegacyCrypto) {
      module2.exports = require_utils_legacy();
    } else {
      module2.exports = require_utils_webcrypto();
    }
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/cert-signatures.js"(exports2, module2) {
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      const lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length << 8 | data[index++];
      }
      return { length, index };
    }
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      const lastIndex = index + OIDLength;
      const byte1 = data[index++];
      let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      while (index < lastIndex) {
        let value = 0;
        while (index < lastIndex) {
          const nextByte = data[index++];
          value = value << 7 | nextByte & 127;
          if (nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    function signatureAlgorithmHashFromCertificate(data, index) {
      if (index === void 0) index = 0;
      index = expectASN1Seq(data, index).index;
      const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength;
      index = expectASN1Seq(data, index).index;
      const { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          index = indexAfterOID;
          index = expectASN1Seq(data, index).index;
          if (data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index;
          index = expectASN1Seq(data, index).index;
          const { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https: return//github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    module2.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/crypto/sasl.js"(exports2, module2) {
    "use strict";
    var crypto = require_utils2();
    var { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function startSession(mechanisms, stream) {
      const candidates = ["SCRAM-SHA-256"];
      if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
      const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism) {
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      }
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") {
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      }
      const clientNonce = crypto.randomBytes(18).toString("base64");
      const gs2Header = mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n";
      return {
        mechanism,
        clientNonce,
        response: gs2Header + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse"
      };
    }
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse") {
        throw new Error("SASL: Last message was not SASLInitialResponse");
      }
      if (typeof password !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      }
      if (password === "") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      }
      const sv = parseServerFirstMessage(serverData);
      if (!sv.nonce.startsWith(session.clientNonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      } else if (sv.nonce.length === session.clientNonce.length) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      }
      const clientFirstMessageBare = "n=*,r=" + session.clientNonce;
      const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
      let channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        const peerCert = stream.getPeerCertificate().raw;
        let hashName = signatureAlgorithmHashFromCertificate(peerCert);
        if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
        const certHash = await crypto.hashByName(hashName, peerCert);
        const bindingData = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]);
        channelBinding = bindingData.toString("base64");
      }
      const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
      const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
      const saltBytes = Buffer.from(sv.salt, "base64");
      const saltedPassword = await crypto.deriveKey(password, saltBytes, sv.iteration);
      const clientKey = await crypto.hmacSha256(saltedPassword, "Client Key");
      const storedKey = await crypto.sha256(clientKey);
      const clientSignature = await crypto.hmacSha256(storedKey, authMessage);
      const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
      const serverKey = await crypto.hmacSha256(saltedPassword, "Server Key");
      const serverSignatureBytes = await crypto.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse";
      session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
      session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse") {
        throw new Error("SASL: Last message was not SASLResponse");
      }
      if (typeof serverData !== "string") {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      }
      const { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
      }
    }
    function isPrintableChars(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: text must be a string");
      }
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    function parseAttributePairs(text) {
      if (typeof text !== "string") {
        throw new TypeError("SASL: attribute pairs text must be a string");
      }
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue)) {
            throw new Error("SASL: Invalid attribute pair entry");
          }
          const name = attrValue[0];
          const value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      const attrPairs = parseAttributePairs(data);
      const nonce = attrPairs.get("r");
      if (!nonce) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      } else if (!isPrintableChars(nonce)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      }
      const salt = attrPairs.get("s");
      if (!salt) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      } else if (!isBase64(salt)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      }
      const iterationText = attrPairs.get("i");
      if (!iterationText) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      } else if (!/^[1-9][0-9]*$/.test(iterationText)) {
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      }
      const iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      const attrPairs = parseAttributePairs(serverData);
      const serverSignature = attrPairs.get("v");
      if (!serverSignature) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      } else if (!isBase64(serverSignature)) {
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      }
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a)) {
        throw new TypeError("first argument must be a Buffer");
      }
      if (!Buffer.isBuffer(b)) {
        throw new TypeError("second argument must be a Buffer");
      }
      if (a.length !== b.length) {
        throw new Error("Buffer lengths must match");
      }
      if (a.length === 0) {
        throw new Error("Buffers cannot be empty");
      }
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module2.exports = {
      startSession,
      continueSession,
      finalizeSession
    };
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/type-overrides.js"(exports2, module2) {
    "use strict";
    var types2 = require_pg_types();
    function TypeOverrides2(userTypes) {
      this._types = userTypes || types2;
      this.text = {};
      this.binary = {};
    }
    TypeOverrides2.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides2.prototype.setTypeParser = function(oid, format, parseFn) {
      if (typeof format === "function") {
        parseFn = format;
        format = "text";
      }
      this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides2.prototype.getTypeParser = function(oid, format) {
      format = format || "text";
      return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module2.exports = TypeOverrides2;
  }
});

// node_modules/.pnpm/pg-connection-string@2.9.1/node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/.pnpm/pg-connection-string@2.9.1/node_modules/pg-connection-string/index.js"(exports2, module2) {
    "use strict";
    function parse(str, options = {}) {
      if (str.charAt(0) === "/") {
        const config3 = str.split(" ");
        return { host: config3[0], database: config3[1] };
      }
      const config2 = {};
      let result;
      let dummyHost = false;
      if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) {
        str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
      }
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch (e) {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
          dummyHost = true;
        }
      } catch (err) {
        err.input && (err.input = "*****REDACTED*****");
      }
      for (const entry of result.searchParams.entries()) {
        config2[entry[0]] = entry[1];
      }
      config2.user = config2.user || decodeURIComponent(result.username);
      config2.password = config2.password || decodeURIComponent(result.password);
      if (result.protocol == "socket:") {
        config2.host = decodeURI(result.pathname);
        config2.database = result.searchParams.get("db");
        config2.client_encoding = result.searchParams.get("encoding");
        return config2;
      }
      const hostname = dummyHost ? "" : result.hostname;
      if (!config2.host) {
        config2.host = decodeURIComponent(hostname);
      } else if (hostname && /^%2f/i.test(hostname)) {
        result.pathname = hostname + result.pathname;
      }
      if (!config2.port) {
        config2.port = result.port;
      }
      const pathname = result.pathname.slice(1) || null;
      config2.database = pathname ? decodeURI(pathname) : null;
      if (config2.ssl === "true" || config2.ssl === "1") {
        config2.ssl = true;
      }
      if (config2.ssl === "0") {
        config2.ssl = false;
      }
      if (config2.sslcert || config2.sslkey || config2.sslrootcert || config2.sslmode) {
        config2.ssl = {};
      }
      const fs = config2.sslcert || config2.sslkey || config2.sslrootcert ? require("fs") : null;
      if (config2.sslcert) {
        config2.ssl.cert = fs.readFileSync(config2.sslcert).toString();
      }
      if (config2.sslkey) {
        config2.ssl.key = fs.readFileSync(config2.sslkey).toString();
      }
      if (config2.sslrootcert) {
        config2.ssl.ca = fs.readFileSync(config2.sslrootcert).toString();
      }
      if (options.useLibpqCompat && config2.uselibpqcompat) {
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      }
      if (config2.uselibpqcompat === "true" || options.useLibpqCompat) {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
          case "require": {
            if (config2.sslrootcert) {
              config2.ssl.checkServerIdentity = function() {
              };
            } else {
              config2.ssl.rejectUnauthorized = false;
            }
            break;
          }
          case "verify-ca": {
            if (!config2.ssl.ca) {
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            }
            config2.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full": {
            break;
          }
        }
      } else {
        switch (config2.sslmode) {
          case "disable": {
            config2.ssl = false;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            break;
          }
          case "no-verify": {
            config2.ssl.rejectUnauthorized = false;
            break;
          }
        }
      }
      return config2;
    }
    function toConnectionOptions(sslConfig) {
      const connectionOptions = Object.entries(sslConfig).reduce((c, [key, value]) => {
        if (value !== void 0 && value !== null) {
          c[key] = value;
        }
        return c;
      }, {});
      return connectionOptions;
    }
    function toClientConfig(config2) {
      const poolConfig = Object.entries(config2).reduce((c, [key, value]) => {
        if (key === "ssl") {
          const sslConfig = value;
          if (typeof sslConfig === "boolean") {
            c[key] = sslConfig;
          }
          if (typeof sslConfig === "object") {
            c[key] = toConnectionOptions(sslConfig);
          }
        } else if (value !== void 0 && value !== null) {
          if (key === "port") {
            if (value !== "") {
              const v = parseInt(value, 10);
              if (isNaN(v)) {
                throw new Error(`Invalid ${key}: ${value}`);
              }
              c[key] = v;
            }
          } else {
            c[key] = value;
          }
        }
        return c;
      }, {});
      return poolConfig;
    }
    function parseIntoClientConfig(str) {
      return toClientConfig(parse(str));
    }
    module2.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/connection-parameters.js"(exports2, module2) {
    "use strict";
    var dns = require("dns");
    var defaults2 = require_defaults();
    var parse = require_pg_connection_string().parse;
    var val = function(key, config2, envVar) {
      if (envVar === void 0) {
        envVar = process.env["PG" + key.toUpperCase()];
      } else if (envVar === false) {
      } else {
        envVar = process.env[envVar];
      }
      return config2[key] || envVar || defaults2[key];
    };
    var readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return false;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return true;
        case "no-verify":
          return { rejectUnauthorized: false };
      }
      return defaults2.ssl;
    };
    var quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    };
    var add = function(params, config2, paramName) {
      const value = config2[paramName];
      if (value !== void 0 && value !== null) {
        params.push(paramName + "=" + quoteParamValue(value));
      }
    };
    var ConnectionParameters = class {
      constructor(config2) {
        config2 = typeof config2 === "string" ? parse(config2) : config2 || {};
        if (config2.connectionString) {
          config2 = Object.assign({}, config2, parse(config2.connectionString));
        }
        this.user = val("user", config2);
        this.database = val("database", config2);
        if (this.database === void 0) {
          this.database = this.user;
        }
        this.port = parseInt(val("port", config2), 10);
        this.host = val("host", config2);
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: val("password", config2)
        });
        this.binary = val("binary", config2);
        this.options = val("options", config2);
        this.ssl = typeof config2.ssl === "undefined" ? readSSLConfigFromEnvironment() : config2.ssl;
        if (typeof this.ssl === "string") {
          if (this.ssl === "true") {
            this.ssl = true;
          }
        }
        if (this.ssl === "no-verify") {
          this.ssl = { rejectUnauthorized: false };
        }
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this.client_encoding = val("client_encoding", config2);
        this.replication = val("replication", config2);
        this.isDomainSocket = !(this.host || "").indexOf("/");
        this.application_name = val("application_name", config2, "PGAPPNAME");
        this.fallback_application_name = val("fallback_application_name", config2, false);
        this.statement_timeout = val("statement_timeout", config2, false);
        this.lock_timeout = val("lock_timeout", config2, false);
        this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config2, false);
        this.query_timeout = val("query_timeout", config2, false);
        if (config2.connectionTimeoutMillis === void 0) {
          this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
        } else {
          this.connect_timeout = Math.floor(config2.connectionTimeoutMillis / 1e3);
        }
        if (config2.keepAlive === false) {
          this.keepalives = 0;
        } else if (config2.keepAlive === true) {
          this.keepalives = 1;
        }
        if (typeof config2.keepAliveInitialDelayMillis === "number") {
          this.keepalives_idle = Math.floor(config2.keepAliveInitialDelayMillis / 1e3);
        }
      }
      getLibpqConnectionString(cb) {
        const params = [];
        add(params, this, "user");
        add(params, this, "password");
        add(params, this, "port");
        add(params, this, "application_name");
        add(params, this, "fallback_application_name");
        add(params, this, "connect_timeout");
        add(params, this, "options");
        const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        add(params, ssl, "sslmode");
        add(params, ssl, "sslca");
        add(params, ssl, "sslkey");
        add(params, ssl, "sslcert");
        add(params, ssl, "sslrootcert");
        if (this.database) {
          params.push("dbname=" + quoteParamValue(this.database));
        }
        if (this.replication) {
          params.push("replication=" + quoteParamValue(this.replication));
        }
        if (this.host) {
          params.push("host=" + quoteParamValue(this.host));
        }
        if (this.isDomainSocket) {
          return cb(null, params.join(" "));
        }
        if (this.client_encoding) {
          params.push("client_encoding=" + quoteParamValue(this.client_encoding));
        }
        dns.lookup(this.host, function(err, address) {
          if (err) return cb(err, null);
          params.push("hostaddr=" + quoteParamValue(address));
          return cb(null, params.join(" "));
        });
      }
    };
    module2.exports = ConnectionParameters;
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/result.js"(exports2, module2) {
    "use strict";
    var types2 = require_pg_types();
    var matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
    var Result2 = class {
      constructor(rowMode, types3) {
        this.command = null;
        this.rowCount = null;
        this.oid = null;
        this.rows = [];
        this.fields = [];
        this._parsers = void 0;
        this._types = types3;
        this.RowCtor = null;
        this.rowAsArray = rowMode === "array";
        if (this.rowAsArray) {
          this.parseRow = this._parseRowAsArray;
        }
        this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match;
        if (msg.text) {
          match = matchRegexp.exec(msg.text);
        } else {
          match = matchRegexp.exec(msg.command);
        }
        if (match) {
          this.command = match[1];
          if (match[3]) {
            this.oid = parseInt(match[2], 10);
            this.rowCount = parseInt(match[3], 10);
          } else if (match[2]) {
            this.rowCount = parseInt(match[2], 10);
          }
        }
      }
      _parseRowAsArray(rowData) {
        const row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          if (rawValue !== null) {
            row[i] = this._parsers[i](rawValue);
          } else {
            row[i] = null;
          }
        }
        return row;
      }
      parseRow(rowData) {
        const row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          const rawValue = rowData[i];
          const field = this.fields[i].name;
          if (rawValue !== null) {
            const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else {
            row[field] = null;
          }
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions;
        if (this.fields.length) {
          this._parsers = new Array(fieldDescriptions.length);
        }
        const row = {};
        for (let i = 0; i < fieldDescriptions.length; i++) {
          const desc = fieldDescriptions[i];
          row[desc.name] = null;
          if (this._types) {
            this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text");
          } else {
            this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
          }
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module2.exports = Result2;
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/query.js"(exports2, module2) {
    "use strict";
    var { EventEmitter } = require("events");
    var Result2 = require_result();
    var utils = require_utils();
    var Query2 = class extends EventEmitter {
      constructor(config2, values, callback) {
        super();
        config2 = utils.normalizeQueryConfig(config2, values, callback);
        this.text = config2.text;
        this.values = config2.values;
        this.rows = config2.rows;
        this.types = config2.types;
        this.name = config2.name;
        this.queryMode = config2.queryMode;
        this.binary = config2.binary;
        this.portal = config2.portal || "";
        this.callback = config2.callback;
        this._rowMode = config2.rowMode;
        if (process.domain && config2.callback) {
          this.callback = process.domain.bind(config2.callback);
        }
        this._result = new Result2(this._rowMode, this.types);
        this._results = this._result;
        this._canceledDueToError = false;
      }
      requiresPreparation() {
        if (this.queryMode === "extended") {
          return true;
        }
        if (this.name) {
          return true;
        }
        if (this.rows) {
          return true;
        }
        if (!this.text) {
          return false;
        }
        if (!this.values) {
          return false;
        }
        return this.values.length > 0;
      }
      _checkForMultirow() {
        if (this._result.command) {
          if (!Array.isArray(this._results)) {
            this._results = [this._result];
          }
          this._result = new Result2(this._rowMode, this._result._types);
          this._results.push(this._result);
        }
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow();
        this._result.addFields(msg.fields);
        this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (this._canceledDueToError) {
          return;
        }
        try {
          row = this._result.parseRow(msg.fields);
        } catch (err) {
          this._canceledDueToError = err;
          return;
        }
        this.emit("row", row, this._result);
        if (this._accumulateRows) {
          this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow();
        this._result.addCommandComplete(msg);
        if (this.rows) {
          connection.sync();
        }
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        if (this.rows) {
          connection.sync();
        }
      }
      handleError(err, connection) {
        if (this._canceledDueToError) {
          err = this._canceledDueToError;
          this._canceledDueToError = false;
        }
        if (this.callback) {
          return this.callback(err);
        }
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError) {
          return this.handleError(this._canceledDueToError, con);
        }
        if (this.callback) {
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text !== "string" && typeof this.name !== "string") {
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        }
        const previous = connection.parsedStatements[this.name];
        if (this.text && previous && this.text !== previous) {
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        }
        if (this.values && !Array.isArray(this.values)) {
          return new Error("Query values must be an array");
        }
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else {
          connection.query(this.text);
        }
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && connection.parsedStatements[this.name];
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        });
        if (!rows) {
          connection.sync();
        } else {
          connection.flush();
        }
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        if (!this.hasBeenParsed(connection)) {
          connection.parse({
            text: this.text,
            name: this.name,
            types: this.types
          });
        }
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        });
        this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module2.exports = Query2;
  }
});

// node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.NoticeMessage = exports2.DataRowMessage = exports2.CommandCompleteMessage = exports2.ReadyForQueryMessage = exports2.NotificationResponseMessage = exports2.BackendKeyDataMessage = exports2.AuthenticationMD5Password = exports2.ParameterStatusMessage = exports2.ParameterDescriptionMessage = exports2.RowDescriptionMessage = exports2.Field = exports2.CopyResponse = exports2.CopyDataMessage = exports2.DatabaseError = exports2.copyDone = exports2.emptyQuery = exports2.replicationStart = exports2.portalSuspended = exports2.noData = exports2.closeComplete = exports2.bindComplete = exports2.parseComplete = void 0;
    exports2.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports2.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports2.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports2.noData = {
      name: "noData",
      length: 5
    };
    exports2.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports2.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports2.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports2.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError2 = class extends Error {
      constructor(message, length, name) {
        super(message);
        this.length = length;
        this.name = name;
      }
    };
    exports2.DatabaseError = DatabaseError2;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length;
        this.chunk = chunk;
        this.name = "copyData";
      }
    };
    exports2.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length;
        this.name = name;
        this.binary = binary;
        this.columnTypes = new Array(columnCount);
      }
    };
    exports2.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name;
        this.tableID = tableID;
        this.columnID = columnID;
        this.dataTypeID = dataTypeID;
        this.dataTypeSize = dataTypeSize;
        this.dataTypeModifier = dataTypeModifier;
        this.format = format;
      }
    };
    exports2.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length;
        this.fieldCount = fieldCount;
        this.name = "rowDescription";
        this.fields = new Array(this.fieldCount);
      }
    };
    exports2.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length;
        this.parameterCount = parameterCount;
        this.name = "parameterDescription";
        this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports2.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length;
        this.parameterName = parameterName;
        this.parameterValue = parameterValue;
        this.name = "parameterStatus";
      }
    };
    exports2.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt) {
        this.length = length;
        this.salt = salt;
        this.name = "authenticationMD5Password";
      }
    };
    exports2.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length;
        this.processID = processID;
        this.secretKey = secretKey;
        this.name = "backendKeyData";
      }
    };
    exports2.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length;
        this.processId = processId;
        this.channel = channel;
        this.payload = payload;
        this.name = "notification";
      }
    };
    exports2.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length;
        this.status = status;
        this.name = "readyForQuery";
      }
    };
    exports2.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text) {
        this.length = length;
        this.text = text;
        this.name = "commandComplete";
      }
    };
    exports2.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length;
        this.fields = fields;
        this.name = "dataRow";
        this.fieldCount = fields.length;
      }
    };
    exports2.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length;
        this.message = message;
        this.name = "notice";
      }
    };
    exports2.NoticeMessage = NoticeMessage;
  }
});

// node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/buffer-writer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Writer = void 0;
    var Writer = class {
      constructor(size = 256) {
        this.size = size;
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        const remaining = this.buffer.length - this.offset;
        if (remaining < size) {
          const oldBuffer = this.buffer;
          const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize);
          oldBuffer.copy(this.buffer);
        }
      }
      addInt32(num) {
        this.ensure(4);
        this.buffer[this.offset++] = num >>> 24 & 255;
        this.buffer[this.offset++] = num >>> 16 & 255;
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addInt16(num) {
        this.ensure(2);
        this.buffer[this.offset++] = num >>> 8 & 255;
        this.buffer[this.offset++] = num >>> 0 & 255;
        return this;
      }
      addCString(string) {
        if (!string) {
          this.ensure(1);
        } else {
          const len = Buffer.byteLength(string);
          this.ensure(len + 1);
          this.buffer.write(string, this.offset, "utf-8");
          this.offset += len;
        }
        this.buffer[this.offset++] = 0;
        return this;
      }
      addString(string = "") {
        const len = Buffer.byteLength(string);
        this.ensure(len);
        this.buffer.write(string, this.offset);
        this.offset += len;
        return this;
      }
      add(otherBuffer) {
        this.ensure(otherBuffer.length);
        otherBuffer.copy(this.buffer, this.offset);
        this.offset += otherBuffer.length;
        return this;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          const length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        const result = this.join(code);
        this.offset = 5;
        this.headerPosition = 0;
        this.buffer = Buffer.allocUnsafe(this.size);
        return result;
      }
    };
    exports2.Writer = Writer;
  }
});

// node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/serializer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer();
    var writer = new buffer_writer_1.Writer();
    var startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (const key of Object.keys(opts)) {
        writer.addCString(key).addCString(opts[key]);
      }
      writer.addCString("client_encoding").addCString("UTF8");
      const bodyBuffer = writer.addCString("").flush();
      const length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    };
    var requestSsl = () => {
      const response = Buffer.allocUnsafe(8);
      response.writeInt32BE(8, 0);
      response.writeInt32BE(80877103, 4);
      return response;
    };
    var password = (password2) => {
      return writer.addCString(password2).flush(
        112
        /* code.startup */
      );
    };
    var sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
      return writer.flush(
        112
        /* code.startup */
      );
    };
    var sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    };
    var query2 = (text) => {
      return writer.addCString(text).flush(
        81
        /* code.query */
      );
    };
    var emptyArray = [];
    var parse = (query3) => {
      const name = query3.name || "";
      if (name.length > 63) {
        console.error("Warning! Postgres only supports 63 characters for query names.");
        console.error("You supplied %s (%s)", name, name.length);
        console.error("This can cause conflicts and silent errors executing queries");
      }
      const types2 = query3.types || emptyArray;
      const len = types2.length;
      const buffer = writer.addCString(name).addCString(query3.text).addInt16(len);
      for (let i = 0; i < len; i++) {
        buffer.addInt32(types2[i]);
      }
      return writer.flush(
        80
        /* code.parse */
      );
    };
    var paramWriter = new buffer_writer_1.Writer();
    var writeValues = function(values, valueMapper) {
      for (let i = 0; i < values.length; i++) {
        const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
        if (mappedVal == null) {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(-1);
        } else if (mappedVal instanceof Buffer) {
          writer.addInt16(
            1
            /* ParamType.BINARY */
          );
          paramWriter.addInt32(mappedVal.length);
          paramWriter.add(mappedVal);
        } else {
          writer.addInt16(
            0
            /* ParamType.STRING */
          );
          paramWriter.addInt32(Buffer.byteLength(mappedVal));
          paramWriter.addString(mappedVal);
        }
      }
    };
    var bind = (config2 = {}) => {
      const portal = config2.portal || "";
      const statement = config2.statement || "";
      const binary = config2.binary || false;
      const values = config2.values || emptyArray;
      const len = values.length;
      writer.addCString(portal).addCString(statement);
      writer.addInt16(len);
      writeValues(values, config2.valueMapper);
      writer.addInt16(len);
      writer.add(paramWriter.flush());
      writer.addInt16(1);
      writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      );
      return writer.flush(
        66
        /* code.bind */
      );
    };
    var emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]);
    var execute = (config2) => {
      if (!config2 || !config2.portal && !config2.rows) {
        return emptyExecute;
      }
      const portal = config2.portal || "";
      const rows = config2.rows || 0;
      const portalLength = Buffer.byteLength(portal);
      const len = 4 + portalLength + 1 + 4;
      const buff = Buffer.allocUnsafe(1 + len);
      buff[0] = 69;
      buff.writeInt32BE(len, 1);
      buff.write(portal, 5, "utf-8");
      buff[portalLength + 5] = 0;
      buff.writeUInt32BE(rows, buff.length - 4);
      return buff;
    };
    var cancel = (processID, secretKey) => {
      const buffer = Buffer.allocUnsafe(16);
      buffer.writeInt32BE(16, 0);
      buffer.writeInt16BE(1234, 4);
      buffer.writeInt16BE(5678, 6);
      buffer.writeInt32BE(processID, 8);
      buffer.writeInt32BE(secretKey, 12);
      return buffer;
    };
    var cstringMessage = (code, string) => {
      const stringLen = Buffer.byteLength(string);
      const len = 4 + stringLen + 1;
      const buffer = Buffer.allocUnsafe(1 + len);
      buffer[0] = code;
      buffer.writeInt32BE(len, 1);
      buffer.write(string, 5, "utf-8");
      buffer[len] = 0;
      return buffer;
    };
    var emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    );
    var emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    );
    var describe = (msg) => {
      return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
    };
    var close = (msg) => {
      const text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    };
    var copyData = (chunk) => {
      return writer.add(chunk).flush(
        100
        /* code.copyFromChunk */
      );
    };
    var copyFail = (message) => {
      return cstringMessage(102, message);
    };
    var codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]);
    var flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    );
    var syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    );
    var endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    );
    var copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    );
    var serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query: query2,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports2.serialize = serialize;
  }
});

// node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/buffer-reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.BufferReader = void 0;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset;
        this.buffer = emptyBuffer;
        this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer;
      }
      int16() {
        const result = this.buffer.readInt16BE(this.offset);
        this.offset += 2;
        return result;
      }
      byte() {
        const result = this.buffer[this.offset];
        this.offset++;
        return result;
      }
      int32() {
        const result = this.buffer.readInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      uint32() {
        const result = this.buffer.readUInt32BE(this.offset);
        this.offset += 4;
        return result;
      }
      string(length) {
        const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
      cstring() {
        const start = this.offset;
        let end = start;
        while (this.buffer[end++] !== 0) {
        }
        this.offset = end;
        return this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        const result = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
      }
    };
    exports2.BufferReader = BufferReader;
  }
});

// node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Parser = void 0;
    var messages_1 = require_messages();
    var buffer_reader_1 = require_buffer_reader();
    var CODE_LENGTH = 1;
    var LEN_LENGTH = 4;
    var HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH;
    var emptyBuffer = Buffer.allocUnsafe(0);
    var Parser = class {
      constructor(opts) {
        this.buffer = emptyBuffer;
        this.bufferLength = 0;
        this.bufferOffset = 0;
        this.reader = new buffer_reader_1.BufferReader();
        if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") {
          throw new Error("Binary mode not supported yet");
        }
        this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        const bufferFullLength = this.bufferOffset + this.bufferLength;
        let offset = this.bufferOffset;
        while (offset + HEADER_LENGTH <= bufferFullLength) {
          const code = this.buffer[offset];
          const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
          const fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            const message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message);
            offset += fullMessageLength;
          } else {
            break;
          }
        }
        if (offset === bufferFullLength) {
          this.buffer = emptyBuffer;
          this.bufferLength = 0;
          this.bufferOffset = 0;
        } else {
          this.bufferLength = bufferFullLength - offset;
          this.bufferOffset = offset;
        }
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          const newLength = this.bufferLength + buffer.byteLength;
          const newFullLength = newLength + this.bufferOffset;
          if (newFullLength > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
              newBuffer = this.buffer;
            } else {
              let newBufferLength = this.buffer.byteLength * 2;
              while (newLength >= newBufferLength) {
                newBufferLength *= 2;
              }
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
            this.buffer = newBuffer;
            this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
          this.bufferLength = newLength;
        } else {
          this.buffer = buffer;
          this.bufferOffset = 0;
          this.bufferLength = buffer.byteLength;
        }
      }
      handlePacket(offset, code, length, bytes) {
        switch (code) {
          case 50:
            return messages_1.bindComplete;
          case 49:
            return messages_1.parseComplete;
          case 51:
            return messages_1.closeComplete;
          case 110:
            return messages_1.noData;
          case 115:
            return messages_1.portalSuspended;
          case 99:
            return messages_1.copyDone;
          case 87:
            return messages_1.replicationStart;
          case 73:
            return messages_1.emptyQuery;
          case 68:
            return this.parseDataRowMessage(offset, length, bytes);
          case 67:
            return this.parseCommandCompleteMessage(offset, length, bytes);
          case 90:
            return this.parseReadyForQueryMessage(offset, length, bytes);
          case 65:
            return this.parseNotificationMessage(offset, length, bytes);
          case 82:
            return this.parseAuthenticationResponse(offset, length, bytes);
          case 83:
            return this.parseParameterStatusMessage(offset, length, bytes);
          case 75:
            return this.parseBackendKeyData(offset, length, bytes);
          case 69:
            return this.parseErrorMessage(offset, length, bytes, "error");
          case 78:
            return this.parseErrorMessage(offset, length, bytes, "notice");
          case 84:
            return this.parseRowDescriptionMessage(offset, length, bytes);
          case 116:
            return this.parseParameterDescriptionMessage(offset, length, bytes);
          case 71:
            return this.parseCopyInMessage(offset, length, bytes);
          case 72:
            return this.parseCopyOutMessage(offset, length, bytes);
          case 100:
            return this.parseCopyData(offset, length, bytes);
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
      }
      parseReadyForQueryMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const status = this.reader.string(1);
        return new messages_1.ReadyForQueryMessage(length, status);
      }
      parseCommandCompleteMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const text = this.reader.cstring();
        return new messages_1.CommandCompleteMessage(length, text);
      }
      parseCopyData(offset, length, bytes) {
        const chunk = bytes.slice(offset, offset + (length - 4));
        return new messages_1.CopyDataMessage(length, chunk);
      }
      parseCopyInMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyInResponse");
      }
      parseCopyOutMessage(offset, length, bytes) {
        return this.parseCopyMessage(offset, length, bytes, "copyOutResponse");
      }
      parseCopyMessage(offset, length, bytes, messageName) {
        this.reader.setBuffer(offset, bytes);
        const isBinary = this.reader.byte() !== 0;
        const columnCount = this.reader.int16();
        const message = new messages_1.CopyResponse(length, messageName, isBinary, columnCount);
        for (let i = 0; i < columnCount; i++) {
          message.columnTypes[i] = this.reader.int16();
        }
        return message;
      }
      parseNotificationMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processId = this.reader.int32();
        const channel = this.reader.cstring();
        const payload = this.reader.cstring();
        return new messages_1.NotificationResponseMessage(length, processId, channel, payload);
      }
      parseRowDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const message = new messages_1.RowDescriptionMessage(length, fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          message.fields[i] = this.parseField();
        }
        return message;
      }
      parseField() {
        const name = this.reader.cstring();
        const tableID = this.reader.uint32();
        const columnID = this.reader.int16();
        const dataTypeID = this.reader.uint32();
        const dataTypeSize = this.reader.int16();
        const dataTypeModifier = this.reader.int32();
        const mode = this.reader.int16() === 0 ? "text" : "binary";
        return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
      }
      parseParameterDescriptionMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const parameterCount = this.reader.int16();
        const message = new messages_1.ParameterDescriptionMessage(length, parameterCount);
        for (let i = 0; i < parameterCount; i++) {
          message.dataTypeIDs[i] = this.reader.int32();
        }
        return message;
      }
      parseDataRowMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const fieldCount = this.reader.int16();
        const fields = new Array(fieldCount);
        for (let i = 0; i < fieldCount; i++) {
          const len = this.reader.int32();
          fields[i] = len === -1 ? null : this.reader.string(len);
        }
        return new messages_1.DataRowMessage(length, fields);
      }
      parseParameterStatusMessage(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const name = this.reader.cstring();
        const value = this.reader.cstring();
        return new messages_1.ParameterStatusMessage(length, name, value);
      }
      parseBackendKeyData(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const processID = this.reader.int32();
        const secretKey = this.reader.int32();
        return new messages_1.BackendKeyDataMessage(length, processID, secretKey);
      }
      parseAuthenticationResponse(offset, length, bytes) {
        this.reader.setBuffer(offset, bytes);
        const code = this.reader.int32();
        const message = {
          name: "authenticationOk",
          length
        };
        switch (code) {
          case 0:
            break;
          case 3:
            if (message.length === 8) {
              message.name = "authenticationCleartextPassword";
            }
            break;
          case 5:
            if (message.length === 12) {
              message.name = "authenticationMD5Password";
              const salt = this.reader.bytes(4);
              return new messages_1.AuthenticationMD5Password(length, salt);
            }
            break;
          case 10:
            {
              message.name = "authenticationSASL";
              message.mechanisms = [];
              let mechanism;
              do {
                mechanism = this.reader.cstring();
                if (mechanism) {
                  message.mechanisms.push(mechanism);
                }
              } while (mechanism);
            }
            break;
          case 11:
            message.name = "authenticationSASLContinue";
            message.data = this.reader.string(length - 8);
            break;
          case 12:
            message.name = "authenticationSASLFinal";
            message.data = this.reader.string(length - 8);
            break;
          default:
            throw new Error("Unknown authenticationOk message type " + code);
        }
        return message;
      }
      parseErrorMessage(offset, length, bytes, name) {
        this.reader.setBuffer(offset, bytes);
        const fields = {};
        let fieldType = this.reader.string(1);
        while (fieldType !== "\0") {
          fields[fieldType] = this.reader.cstring();
          fieldType = this.reader.string(1);
        }
        const messageValue = fields.M;
        const message = name === "notice" ? new messages_1.NoticeMessage(length, messageValue) : new messages_1.DatabaseError(messageValue, length, name);
        message.severity = fields.S;
        message.code = fields.C;
        message.detail = fields.D;
        message.hint = fields.H;
        message.position = fields.P;
        message.internalPosition = fields.p;
        message.internalQuery = fields.q;
        message.where = fields.W;
        message.schema = fields.s;
        message.table = fields.t;
        message.column = fields.c;
        message.dataType = fields.d;
        message.constraint = fields.n;
        message.file = fields.F;
        message.line = fields.L;
        message.routine = fields.R;
        return message;
      }
    };
    exports2.Parser = Parser;
  }
});

// node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/pg-protocol@1.10.3/node_modules/pg-protocol/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DatabaseError = exports2.serialize = exports2.parse = void 0;
    var messages_1 = require_messages();
    Object.defineProperty(exports2, "DatabaseError", { enumerable: true, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports2, "serialize", { enumerable: true, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      const parser = new parser_1.Parser();
      stream.on("data", (buffer) => parser.parse(buffer, callback));
      return new Promise((resolve) => stream.on("end", () => resolve()));
    }
    exports2.parse = parse;
  }
});

// node_modules/.pnpm/pg-cloudflare@1.2.7/node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS({
  "node_modules/.pnpm/pg-cloudflare@1.2.7/node_modules/pg-cloudflare/dist/empty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = {};
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/stream.js"(exports2, module2) {
    var { getStream, getSecureStream } = getStreamFuncs();
    module2.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        const net = require("net");
        return new net.Socket();
      }
      function getSecureStream2(options) {
        const tls = require("tls");
        return tls.connect(options);
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        const { CloudflareSocket } = require_empty();
        return new CloudflareSocket(ssl);
      }
      function getSecureStream2(options) {
        options.socket.startTls(options);
        return options.socket;
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function isCloudflareRuntime() {
      if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") {
        return navigator.userAgent === "Cloudflare-Workers";
      }
      if (typeof Response === "function") {
        const resp = new Response(null, { cf: { thing: true } });
        if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) {
          return true;
        }
      }
      return false;
    }
    function getStreamFuncs() {
      if (isCloudflareRuntime()) {
        return getCloudflareStreamFuncs();
      }
      return getNodejsStreamFuncs();
    }
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/connection.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var { parse, serialize } = require_dist();
    var { getStream, getSecureStream } = require_stream();
    var flushBuffer = serialize.flush();
    var syncBuffer = serialize.sync();
    var endBuffer = serialize.end();
    var Connection2 = class extends EventEmitter {
      constructor(config2) {
        super();
        config2 = config2 || {};
        this.stream = config2.stream || getStream(config2.ssl);
        if (typeof this.stream === "function") {
          this.stream = this.stream(config2);
        }
        this._keepAlive = config2.keepAlive;
        this._keepAliveInitialDelayMillis = config2.keepAliveInitialDelayMillis;
        this.lastBuffer = false;
        this.parsedStatements = {};
        this.ssl = config2.ssl || false;
        this._ending = false;
        this._emitMessage = false;
        const self = this;
        this.on("newListener", function(eventName) {
          if (eventName === "message") {
            self._emitMessage = true;
          }
        });
      }
      connect(port, host) {
        const self = this;
        this._connecting = true;
        this.stream.setNoDelay(true);
        this.stream.connect(port, host);
        this.stream.once("connect", function() {
          if (self._keepAlive) {
            self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
          }
          self.emit("connect");
        });
        const reportStreamError = function(error) {
          if (self._ending && (error.code === "ECONNRESET" || error.code === "EPIPE")) {
            return;
          }
          self.emit("error", error);
        };
        this.stream.on("error", reportStreamError);
        this.stream.on("close", function() {
          self.emit("end");
        });
        if (!this.ssl) {
          return this.attachListeners(this.stream);
        }
        this.stream.once("data", function(buffer) {
          const responseCode = buffer.toString("utf8");
          switch (responseCode) {
            case "S":
              break;
            case "N":
              self.stream.end();
              return self.emit("error", new Error("The server does not support SSL connections"));
            default:
              self.stream.end();
              return self.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          const options = {
            socket: self.stream
          };
          if (self.ssl !== true) {
            Object.assign(options, self.ssl);
            if ("key" in self.ssl) {
              options.key = self.ssl.key;
            }
          }
          const net = require("net");
          if (net.isIP && net.isIP(host) === 0) {
            options.servername = host;
          }
          try {
            self.stream = getSecureStream(options);
          } catch (err) {
            return self.emit("error", err);
          }
          self.attachListeners(self.stream);
          self.stream.on("error", reportStreamError);
          self.emit("sslconnect");
        });
      }
      attachListeners(stream) {
        parse(stream, (msg) => {
          const eventName = msg.name === "error" ? "errorMessage" : msg.name;
          if (this._emitMessage) {
            this.emit("message", msg);
          }
          this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config2) {
        this.stream.write(serialize.startup(config2));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        if (!this.stream.writable) {
          return false;
        }
        return this.stream.write(buffer);
      }
      query(text) {
        this._send(serialize.query(text));
      }
      // send parse message
      parse(query2) {
        this._send(serialize.parse(query2));
      }
      // send bind message
      bind(config2) {
        this._send(serialize.bind(config2));
      }
      // send execute message
      execute(config2) {
        this._send(serialize.execute(config2));
      }
      flush() {
        if (this.stream.writable) {
          this.stream.write(flushBuffer);
        }
      }
      sync() {
        this._ending = true;
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        this._ending = true;
        if (!this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module2.exports = Connection2;
  }
});

// node_modules/.pnpm/split2@4.2.0/node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/.pnpm/split2@4.2.0/node_modules/split2/index.js"(exports2, module2) {
    "use strict";
    var { Transform } = require("stream");
    var { StringDecoder } = require("string_decoder");
    var kLast = /* @__PURE__ */ Symbol("last");
    var kDecoder = /* @__PURE__ */ Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        const buf = this[kDecoder].write(chunk);
        list = buf.split(this.matcher);
        if (list.length === 1) return cb();
        list.shift();
        this.overflow = false;
      } else {
        this[kLast] += this[kDecoder].write(chunk);
        list = this[kLast].split(this.matcher);
      }
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++) {
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      }
      this.overflow = this[kLast].length > this.maxLength;
      if (this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      this[kLast] += this[kDecoder].end();
      if (this[kLast]) {
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      }
      cb();
    }
    function push(self, val) {
      if (val !== void 0) {
        self.push(val);
      }
    }
    function noop(incoming) {
      return incoming;
    }
    function split(matcher, mapper, options) {
      matcher = matcher || /\r?\n/;
      mapper = mapper || noop;
      options = options || {};
      switch (arguments.length) {
        case 1:
          if (typeof matcher === "function") {
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof matcher === "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split]) {
            options = matcher;
            matcher = /\r?\n/;
          }
          break;
        case 2:
          if (typeof matcher === "function") {
            options = mapper;
            mapper = matcher;
            matcher = /\r?\n/;
          } else if (typeof mapper === "object") {
            options = mapper;
            mapper = noop;
          }
      }
      options = Object.assign({}, options);
      options.autoDestroy = true;
      options.transform = transform;
      options.flush = flush;
      options.readableObjectMode = true;
      const stream = new Transform(options);
      stream[kLast] = "";
      stream[kDecoder] = new StringDecoder("utf8");
      stream.matcher = matcher;
      stream.mapper = mapper;
      stream.maxLength = options.maxLength;
      stream.skipOverflow = options.skipOverflow || false;
      stream.overflow = false;
      stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = false;
        cb(err);
      };
      return stream;
    }
    module2.exports = split;
  }
});

// node_modules/.pnpm/pgpass@1.0.5/node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/.pnpm/pgpass@1.0.5/node_modules/pgpass/lib/helper.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var Stream = require("stream").Stream;
    var split = require_split2();
    var util = require("util");
    var defaultPort = 5432;
    var isWin = process.platform === "win32";
    var warnStream = process.stderr;
    var S_IRWXG = 56;
    var S_IRWXO = 7;
    var S_IFMT = 61440;
    var S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"];
    var nrOfFields = fieldNames.length;
    var passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && true === warnStream.writable;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat("\n");
        warnStream.write(util.format.apply(util, args));
      }
    }
    Object.defineProperty(module2.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val) {
        isWin = val;
      }
    });
    module2.exports.warnTo = function(stream) {
      var old = warnStream;
      warnStream = stream;
      return old;
    };
    module2.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env;
      var file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module2.exports.usePgPass = function(stats, fname) {
      if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) {
        return false;
      }
      if (isWin) {
        return true;
      }
      fname = fname || "<unkn>";
      if (!isRegFile(stats.mode)) {
        warn('WARNING: password file "%s" is not a plain file', fname);
        return false;
      }
      if (stats.mode & (S_IRWXG | S_IRWXO)) {
        warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname);
        return false;
      }
      return true;
    };
    var matcher = module2.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        if (idx == 1) {
          if (Number(connInfo[field] || defaultPort) === Number(entry[field])) {
            return prev && true;
          }
        }
        return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, true);
    };
    module2.exports.getPassword = function(connInfo, stream, cb) {
      var pass;
      var lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
          pass = entry[passKey];
          lineStream.end();
        }
      }
      var onEnd = function() {
        stream.destroy();
        cb(pass);
      };
      var onErr = function(err) {
        stream.destroy();
        warn("WARNING: error on reading file: %s", err);
        cb(void 0);
      };
      stream.on("error", onErr);
      lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module2.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/)) {
        return null;
      }
      var curChar = "";
      var prevChar = "";
      var fieldIdx = 0;
      var startIdx = 0;
      var endIdx = 0;
      var obj = {};
      var isLastField = false;
      var addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) {
          field = field.replace(/\\([:\\])/g, "$1");
        }
        obj[fieldNames[idx]] = field;
      };
      for (var i = 0; i < line.length - 1; i += 1) {
        curChar = line.charAt(i + 1);
        prevChar = line.charAt(i);
        isLastField = fieldIdx == nrOfFields - 1;
        if (isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        if (i >= 0 && curChar == ":" && prevChar !== "\\") {
          addToObj(fieldIdx, startIdx, i + 1);
          startIdx = i + 2;
          fieldIdx += 1;
        }
      }
      obj = Object.keys(obj).length === nrOfFields ? obj : null;
      return obj;
    };
    var isValidEntry = module2.exports.isValidEntry = function(entry) {
      var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          if (x === "*") {
            return true;
          }
          x = Number(x);
          return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      };
      for (var idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx];
        var value = entry[fieldNames[idx]] || "";
        var res = rule(value);
        if (!res) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/.pnpm/pgpass@1.0.5/node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/.pnpm/pgpass@1.0.5/node_modules/pgpass/lib/index.js"(exports2, module2) {
    "use strict";
    var path = require("path");
    var fs = require("fs");
    var helper = require_helper();
    module2.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file)) {
          return cb(void 0);
        }
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module2.exports.warnTo = helper.warnTo;
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/client.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var utils = require_utils();
    var sasl = require_sasl();
    var TypeOverrides2 = require_type_overrides();
    var ConnectionParameters = require_connection_parameters();
    var Query2 = require_query();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var crypto = require_utils2();
    var Client2 = class extends EventEmitter {
      constructor(config2) {
        super();
        this.connectionParameters = new ConnectionParameters(config2);
        this.user = this.connectionParameters.user;
        this.database = this.connectionParameters.database;
        this.port = this.connectionParameters.port;
        this.host = this.connectionParameters.host;
        Object.defineProperty(this, "password", {
          configurable: true,
          enumerable: false,
          writable: true,
          value: this.connectionParameters.password
        });
        this.replication = this.connectionParameters.replication;
        const c = config2 || {};
        this._Promise = c.Promise || global.Promise;
        this._types = new TypeOverrides2(c.types);
        this._ending = false;
        this._ended = false;
        this._connecting = false;
        this._connected = false;
        this._connectionError = false;
        this._queryable = true;
        this.enableChannelBinding = Boolean(c.enableChannelBinding);
        this.connection = c.connection || new Connection2({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          keepAlive: c.keepAlive || false,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        });
        this.queryQueue = [];
        this.binary = c.binary || defaults2.binary;
        this.processID = null;
        this.secretKey = null;
        this.ssl = this.connectionParameters.ssl || false;
        if (this.ssl && this.ssl.key) {
          Object.defineProperty(this.ssl, "key", {
            enumerable: false
          });
        }
        this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      _errorAllQueries(err) {
        const enqueueError = (query2) => {
          process.nextTick(() => {
            query2.handleError(err, this.connection);
          });
        };
        if (this.activeQuery) {
          enqueueError(this.activeQuery);
          this.activeQuery = null;
        }
        this.queryQueue.forEach(enqueueError);
        this.queryQueue.length = 0;
      }
      _connect(callback) {
        const self = this;
        const con = this.connection;
        this._connectionCallback = callback;
        if (this._connecting || this._connected) {
          const err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = true;
        if (this._connectionTimeoutMillis > 0) {
          this.connectionTimeoutHandle = setTimeout(() => {
            con._ending = true;
            con.stream.destroy(new Error("timeout expired"));
          }, this._connectionTimeoutMillis);
          if (this.connectionTimeoutHandle.unref) {
            this.connectionTimeoutHandle.unref();
          }
        }
        if (this.host && this.host.indexOf("/") === 0) {
          con.connect(this.host + "/.s.PGSQL." + this.port);
        } else {
          con.connect(this.port, this.host);
        }
        con.on("connect", function() {
          if (self.ssl) {
            con.requestSsl();
          } else {
            con.startup(self.getStartupConf());
          }
        });
        con.on("sslconnect", function() {
          con.startup(self.getStartupConf());
        });
        this._attachListeners(con);
        con.once("end", () => {
          const error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle);
          this._errorAllQueries(error);
          this._ended = true;
          if (!this._ending) {
            if (this._connecting && !this._connectionError) {
              if (this._connectionCallback) {
                this._connectionCallback(error);
              } else {
                this._handleErrorEvent(error);
              }
            } else if (!this._connectionError) {
              this._handleErrorEvent(error);
            }
          }
          process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
        con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
        con.on("authenticationSASL", this._handleAuthSASL.bind(this));
        con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
        con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
        con.on("backendKeyData", this._handleBackendKeyData.bind(this));
        con.on("error", this._handleErrorEvent.bind(this));
        con.on("errorMessage", this._handleErrorMessage.bind(this));
        con.on("readyForQuery", this._handleReadyForQuery.bind(this));
        con.on("notice", this._handleNotice.bind(this));
        con.on("rowDescription", this._handleRowDescription.bind(this));
        con.on("dataRow", this._handleDataRow.bind(this));
        con.on("portalSuspended", this._handlePortalSuspended.bind(this));
        con.on("emptyQuery", this._handleEmptyQuery.bind(this));
        con.on("commandComplete", this._handleCommandComplete.bind(this));
        con.on("parseComplete", this._handleParseComplete.bind(this));
        con.on("copyInResponse", this._handleCopyInResponse.bind(this));
        con.on("copyData", this._handleCopyData.bind(this));
        con.on("notification", this._handleNotification.bind(this));
      }
      // TODO(bmc): deprecate pgpass "built in" integration since this.password can be a function
      // it can be supplied by the user if required - this is a breaking change!
      _checkPgPass(cb) {
        const con = this.connection;
        if (typeof this.password === "function") {
          this._Promise.resolve().then(() => this.password()).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass !== "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else {
              this.connectionParameters.password = this.password = null;
            }
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        } else if (this.password !== null) {
          cb();
        } else {
          try {
            const pgPass = require_lib();
            pgPass(this.connectionParameters, (pass) => {
              if (void 0 !== pass) {
                this.connectionParameters.password = this.password = pass;
              }
              cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
        }
      }
      _handleAuthCleartextPassword(msg) {
        this._checkPgPass(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._checkPgPass(async () => {
          try {
            const hashedPassword = await crypto.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._checkPgPass(() => {
          try {
            this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
            this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          );
          this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data);
          this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID;
        this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        if (this._connecting) {
          this._connecting = false;
          this._connected = true;
          clearTimeout(this.connectionTimeoutHandle);
          if (this._connectionCallback) {
            this._connectionCallback(null, this);
            this._connectionCallback = null;
          }
          this.emit("connect");
        }
        const { activeQuery } = this;
        this.activeQuery = null;
        this.readyForQuery = true;
        if (activeQuery) {
          activeQuery.handleReadyForQuery(this.connection);
        }
        this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (this._connectionError) {
          return;
        }
        this._connectionError = true;
        clearTimeout(this.connectionTimeoutHandle);
        if (this._connectionCallback) {
          return this._connectionCallback(err);
        }
        this.emit("error", err);
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(err);
        }
        this._queryable = false;
        this._errorAllQueries(err);
        this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting) {
          return this._handleErrorWhileConnecting(msg);
        }
        const activeQuery = this.activeQuery;
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this.activeQuery = null;
        activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        this.activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        this.activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        this.activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        this.activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        if (this.activeQuery == null) {
          const error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        this.activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        if (this.activeQuery == null) {
          const error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        if (this.activeQuery.name) {
          this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text;
        }
      }
      _handleCopyInResponse(msg) {
        this.activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        this.activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        const params = this.connectionParameters;
        const data = {
          user: params.user,
          database: params.database
        };
        const appName = params.application_name || params.fallback_application_name;
        if (appName) {
          data.application_name = appName;
        }
        if (params.replication) {
          data.replication = "" + params.replication;
        }
        if (params.statement_timeout) {
          data.statement_timeout = String(parseInt(params.statement_timeout, 10));
        }
        if (params.lock_timeout) {
          data.lock_timeout = String(parseInt(params.lock_timeout, 10));
        }
        if (params.idle_in_transaction_session_timeout) {
          data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
        }
        if (params.options) {
          data.options = params.options;
        }
        return data;
      }
      cancel(client, query2) {
        if (client.activeQuery === query2) {
          const con = this.connection;
          if (this.host && this.host.indexOf("/") === 0) {
            con.connect(this.host + "/.s.PGSQL." + this.port);
          } else {
            con.connect(this.port, this.host);
          }
          con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else if (client.queryQueue.indexOf(query2) !== -1) {
          client.queryQueue.splice(client.queryQueue.indexOf(query2), 1);
        }
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.readyForQuery === true) {
          this.activeQuery = this.queryQueue.shift();
          if (this.activeQuery) {
            this.readyForQuery = false;
            this.hasExecuted = true;
            const queryError = this.activeQuery.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                this.activeQuery.handleError(queryError, this.connection);
                this.readyForQuery = true;
                this._pulseQueryQueue();
              });
            }
          } else if (this.hasExecuted) {
            this.activeQuery = null;
            this.emit("drain");
          }
        }
      }
      query(config2, values, callback) {
        let query2;
        let result;
        let readTimeout;
        let readTimeoutTimer;
        let queryCallback;
        if (config2 === null || config2 === void 0) {
          throw new TypeError("Client was passed a null or undefined query");
        } else if (typeof config2.submit === "function") {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          result = query2 = config2;
          if (typeof values === "function") {
            query2.callback = query2.callback || values;
          }
        } else {
          readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
          query2 = new Query2(config2, values, callback);
          if (!query2.callback) {
            result = new this._Promise((resolve, reject) => {
              query2.callback = (err, res) => err ? reject(err) : resolve(res);
            }).catch((err) => {
              Error.captureStackTrace(err);
              throw err;
            });
          }
        }
        if (readTimeout) {
          queryCallback = query2.callback;
          readTimeoutTimer = setTimeout(() => {
            const error = new Error("Query read timeout");
            process.nextTick(() => {
              query2.handleError(error, this.connection);
            });
            queryCallback(error);
            query2.callback = () => {
            };
            const index = this.queryQueue.indexOf(query2);
            if (index > -1) {
              this.queryQueue.splice(index, 1);
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query2.callback = (err, res) => {
            clearTimeout(readTimeoutTimer);
            queryCallback(err, res);
          };
        }
        if (this.binary && !query2.binary) {
          query2.binary = true;
        }
        if (query2._result && !query2._result._types) {
          query2._result._types = this._types;
        }
        if (!this._queryable) {
          process.nextTick(() => {
            query2.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
          });
          return result;
        }
        if (this._ending) {
          process.nextTick(() => {
            query2.handleError(new Error("Client was closed and is not queryable"), this.connection);
          });
          return result;
        }
        this.queryQueue.push(query2);
        this._pulseQueryQueue();
        return result;
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      end(cb) {
        this._ending = true;
        if (!this.connection._connecting || this._ended) {
          if (cb) {
            cb();
          } else {
            return this._Promise.resolve();
          }
        }
        if (this.activeQuery || !this._queryable) {
          this.connection.stream.destroy();
        } else {
          this.connection.end();
        }
        if (cb) {
          this.connection.once("end", cb);
        } else {
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
        }
      }
    };
    Client2.Query = Query2;
    module2.exports = Client2;
  }
});

// node_modules/.pnpm/pg-pool@3.10.1_pg@8.16.3/node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/.pnpm/pg-pool@3.10.1_pg@8.16.3/node_modules/pg-pool/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var NOOP = function() {
    };
    var removeWhere = (list, predicate) => {
      const i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    };
    var IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client;
        this.idleListener = idleListener;
        this.timeoutId = timeoutId;
      }
    };
    var PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify(Promise2, callback) {
      if (callback) {
        return { callback, result: void 0 };
      }
      let rej;
      let res;
      const cb = function(err, client) {
        err ? rej(err) : res(client);
      };
      const result = new Promise2(function(resolve, reject) {
        res = resolve;
        rej = reject;
      }).catch((err) => {
        Error.captureStackTrace(err);
        throw err;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool2, client) {
      return function idleListener(err) {
        err.client = client;
        client.removeListener("error", idleListener);
        client.on("error", () => {
          pool2.log("additional client error after disconnection due to error", err);
        });
        pool2._remove(client);
        pool2.emit("error", err, client);
      };
    }
    var Pool2 = class extends EventEmitter {
      constructor(options, Client2) {
        super();
        this.options = Object.assign({}, options);
        if (options != null && "password" in options) {
          Object.defineProperty(this.options, "password", {
            configurable: true,
            enumerable: false,
            writable: true,
            value: options.password
          });
        }
        if (options != null && options.ssl && options.ssl.key) {
          Object.defineProperty(this.options.ssl, "key", {
            enumerable: false
          });
        }
        this.options.max = this.options.max || this.options.poolSize || 10;
        this.options.min = this.options.min || 0;
        this.options.maxUses = this.options.maxUses || Infinity;
        this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
        this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
        this.log = this.options.log || function() {
        };
        this.Client = this.options.Client || Client2 || require_lib2().Client;
        this.Promise = this.options.Promise || global.Promise;
        if (typeof this.options.idleTimeoutMillis === "undefined") {
          this.options.idleTimeoutMillis = 1e4;
        }
        this._clients = [];
        this._idle = [];
        this._expired = /* @__PURE__ */ new WeakSet();
        this._pendingQueue = [];
        this._endCallback = void 0;
        this.ending = false;
        this.ended = false;
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        this.log("pulse queue");
        if (this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending");
          if (this._idle.length) {
            this._idle.slice().map((item) => {
              this._remove(item.client);
            });
          }
          if (!this._clients.length) {
            this.ended = true;
            this._endCallback();
          }
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull()) {
          return;
        }
        const pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          const idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          const client = idleItem.client;
          client.ref && client.ref();
          const idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, false);
        }
        if (!this._isFull()) {
          return this.newClient(pendingItem);
        }
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        const removed = removeWhere(this._idle, (item) => item.client === client);
        if (removed !== void 0) {
          clearTimeout(removed.timeoutId);
        }
        this._clients = this._clients.filter((c) => c !== client);
        const context2 = this;
        client.end(() => {
          context2.emit("remove", client);
          if (typeof callback === "function") {
            callback();
          }
        });
      }
      connect(cb) {
        if (this.ending) {
          const err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        const response = promisify(this.Promise, cb);
        const result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length) {
            process.nextTick(() => this._pulseQueue());
          }
          if (!this.options.connectionTimeoutMillis) {
            this._pendingQueue.push(new PendingItem(response.callback));
            return result;
          }
          const queueCallback = (err, res, done) => {
            clearTimeout(tid);
            response.callback(err, res, done);
          };
          const pendingItem = new PendingItem(queueCallback);
          const tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
            pendingItem.timedOut = true;
            response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          if (tid.unref) {
            tid.unref();
          }
          this._pendingQueue.push(pendingItem);
          return result;
        }
        this.newClient(new PendingItem(response.callback));
        return result;
      }
      newClient(pendingItem) {
        const client = new this.Client(this.options);
        this._clients.push(client);
        const idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid;
        let timeoutHit = false;
        if (this.options.connectionTimeoutMillis) {
          tid = setTimeout(() => {
            this.log("ending client due to timeout");
            timeoutHit = true;
            client.connection ? client.connection.stream.destroy() : client.end();
          }, this.options.connectionTimeoutMillis);
        }
        this.log("connecting new client");
        client.connect((err) => {
          if (tid) {
            clearTimeout(tid);
          }
          client.on("error", idleListener);
          if (err) {
            this.log("client failed to connect", err);
            this._clients = this._clients.filter((c) => c !== client);
            if (timeoutHit) {
              err = new Error("Connection terminated due to connection timeout", { cause: err });
            }
            this._pulseQueue();
            if (!pendingItem.timedOut) {
              pendingItem.callback(err, void 0, NOOP);
            }
          } else {
            this.log("new client connected");
            if (this.options.maxLifetimeSeconds !== 0) {
              const maxLifetimeTimeout = setTimeout(() => {
                this.log("ending client due to expired lifetime");
                this._expired.add(client);
                const idleIndex = this._idle.findIndex((idleItem) => idleItem.client === client);
                if (idleIndex !== -1) {
                  this._acquireClient(
                    client,
                    new PendingItem((err2, client2, clientRelease) => clientRelease()),
                    idleListener,
                    false
                  );
                }
              }, this.options.maxLifetimeSeconds * 1e3);
              maxLifetimeTimeout.unref();
              client.once("end", () => clearTimeout(maxLifetimeTimeout));
            }
            return this._acquireClient(client, pendingItem, idleListener, true);
          }
        });
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        if (isNew) {
          this.emit("connect", client);
        }
        this.emit("acquire", client);
        client.release = this._releaseOnce(client, idleListener);
        client.removeListener("error", idleListener);
        if (!pendingItem.timedOut) {
          if (isNew && this.options.verify) {
            this.options.verify(client, (err) => {
              if (err) {
                client.release(err);
                return pendingItem.callback(err, void 0, NOOP);
              }
              pendingItem.callback(void 0, client, client.release);
            });
          } else {
            pendingItem.callback(void 0, client, client.release);
          }
        } else {
          if (isNew && this.options.verify) {
            this.options.verify(client, client.release);
          } else {
            client.release();
          }
        }
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = false;
        return (err) => {
          if (released) {
            throwOnDoubleRelease();
          }
          released = true;
          this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        client.on("error", idleListener);
        client._poolUseCount = (client._poolUseCount || 0) + 1;
        this.emit("release", err, client);
        if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
          if (client._poolUseCount >= this.options.maxUses) {
            this.log("remove expended client");
          }
          return this._remove(client, this._pulseQueue.bind(this));
        }
        const isExpired = this._expired.has(client);
        if (isExpired) {
          this.log("remove expired client");
          this._expired.delete(client);
          return this._remove(client, this._pulseQueue.bind(this));
        }
        let tid;
        if (this.options.idleTimeoutMillis && this._isAboveMin()) {
          tid = setTimeout(() => {
            this.log("remove idle client");
            this._remove(client, this._pulseQueue.bind(this));
          }, this.options.idleTimeoutMillis);
          if (this.options.allowExitOnIdle) {
            tid.unref();
          }
        }
        if (this.options.allowExitOnIdle) {
          client.unref();
        }
        this._idle.push(new IdleItem(client, idleListener, tid));
        this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text === "function") {
          const response2 = promisify(this.Promise, text);
          setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          });
          return response2.result;
        }
        if (typeof values === "function") {
          cb = values;
          values = void 0;
        }
        const response = promisify(this.Promise, cb);
        cb = response.callback;
        this.connect((err, client) => {
          if (err) {
            return cb(err);
          }
          let clientReleased = false;
          const onError = (err2) => {
            if (clientReleased) {
              return;
            }
            clientReleased = true;
            client.release(err2);
            cb(err2);
          };
          client.once("error", onError);
          this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              this.log("query dispatched");
              client.removeListener("error", onError);
              if (clientReleased) {
                return;
              }
              clientReleased = true;
              client.release(err2);
              if (err2) {
                return cb(err2);
              }
              return cb(void 0, res);
            });
          } catch (err2) {
            client.release(err2);
            return cb(err2);
          }
        });
        return response.result;
      }
      end(cb) {
        this.log("ending");
        if (this.ending) {
          const err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = true;
        const promised = promisify(this.Promise, cb);
        this._endCallback = promised.callback;
        this._pulseQueue();
        return promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module2.exports = Pool2;
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/native/query.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var util = require("util");
    var utils = require_utils();
    var NativeQuery = module2.exports = function(config2, values, callback) {
      EventEmitter.call(this);
      config2 = utils.normalizeQueryConfig(config2, values, callback);
      this.text = config2.text;
      this.values = config2.values;
      this.name = config2.name;
      this.queryMode = config2.queryMode;
      this.callback = config2.callback;
      this.state = "new";
      this._arrayMode = config2.rowMode === "array";
      this._emitRowEvents = false;
      this.on(
        "newListener",
        function(event) {
          if (event === "row") this._emitRowEvents = true;
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      const fields = this.native.pq.resultErrorFields();
      if (fields) {
        for (const key in fields) {
          const normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      }
      if (this.callback) {
        this.callback(err);
      } else {
        this.emit("error", err);
      }
      this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      if (this._promise) return this._promise;
      this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve);
          this._once("error", reject);
        }.bind(this)
      );
      return this._promise;
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      const self = this;
      this.native = client.native;
      client.native.arrayMode = this._arrayMode;
      let after = function(err, rows, results) {
        client.native.arrayMode = false;
        setImmediate(function() {
          self.emit("_done");
        });
        if (err) {
          return self.handleError(err);
        }
        if (self._emitRowEvents) {
          if (results.length > 1) {
            rows.forEach((rowOfRows, i) => {
              rowOfRows.forEach((row) => {
                self.emit("row", row, results[i]);
              });
            });
          } else {
            rows.forEach(function(row) {
              self.emit("row", row, results);
            });
          }
        }
        self.state = "end";
        self.emit("end", results);
        if (self.callback) {
          self.callback(null, results);
        }
      };
      if (process.domain) {
        after = process.domain.bind(after);
      }
      if (this.name) {
        if (this.name.length > 63) {
          console.error("Warning! Postgres only supports 63 characters for query names.");
          console.error("You supplied %s (%s)", this.name, this.name.length);
          console.error("This can cause conflicts and silent errors executing queries");
        }
        const values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name]) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            const err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          if (err) return after(err);
          client.namedQueries[self.name] = self.text;
          return self.native.execute(self.name, values, after);
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          const err = new Error("Query values must be an array");
          return after(err);
        }
        const vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else if (this.queryMode === "extended") {
        client.native.query(this.text, [], after);
      } else {
        client.native.query(this.text, after);
      }
    };
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/native/client.js"(exports2, module2) {
    "use strict";
    var Native;
    try {
      Native = require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides2 = require_type_overrides();
    var EventEmitter = require("events").EventEmitter;
    var util = require("util");
    var ConnectionParameters = require_connection_parameters();
    var NativeQuery = require_query2();
    var Client2 = module2.exports = function(config2) {
      EventEmitter.call(this);
      config2 = config2 || {};
      this._Promise = config2.Promise || global.Promise;
      this._types = new TypeOverrides2(config2.types);
      this.native = new Native({
        types: this._types
      });
      this._queryQueue = [];
      this._ending = false;
      this._connecting = false;
      this._connected = false;
      this._queryable = true;
      const cp = this.connectionParameters = new ConnectionParameters(config2);
      if (config2.nativeConnectionString) cp.nativeConnectionString = config2.nativeConnectionString;
      this.user = cp.user;
      Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: cp.password
      });
      this.database = cp.database;
      this.host = cp.host;
      this.port = cp.port;
      this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err) {
      const enqueueError = (query2) => {
        process.nextTick(() => {
          query2.native = this.native;
          query2.handleError(err);
        });
      };
      if (this._hasActiveQuery()) {
        enqueueError(this._activeQuery);
        this._activeQuery = null;
      }
      this._queryQueue.forEach(enqueueError);
      this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      const self = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = true;
      this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
        if (err) return cb(err);
        self.native.connect(conString, function(err2) {
          if (err2) {
            self.native.end();
            return cb(err2);
          }
          self._connected = true;
          self.native.on("error", function(err3) {
            self._queryable = false;
            self._errorAllQueries(err3);
            self.emit("error", err3);
          });
          self.native.on("notification", function(msg) {
            self.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          });
          self.emit("connect");
          self._pulseQueryQueue(true);
          cb();
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    };
    Client2.prototype.query = function(config2, values, callback) {
      let query2;
      let result;
      let readTimeout;
      let readTimeoutTimer;
      let queryCallback;
      if (config2 === null || config2 === void 0) {
        throw new TypeError("Client was passed a null or undefined query");
      } else if (typeof config2.submit === "function") {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        result = query2 = config2;
        if (typeof values === "function") {
          config2.callback = values;
        }
      } else {
        readTimeout = config2.query_timeout || this.connectionParameters.query_timeout;
        query2 = new NativeQuery(config2, values, callback);
        if (!query2.callback) {
          let resolveOut, rejectOut;
          result = new this._Promise((resolve, reject) => {
            resolveOut = resolve;
            rejectOut = reject;
          }).catch((err) => {
            Error.captureStackTrace(err);
            throw err;
          });
          query2.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
        }
      }
      if (readTimeout) {
        queryCallback = query2.callback;
        readTimeoutTimer = setTimeout(() => {
          const error = new Error("Query read timeout");
          process.nextTick(() => {
            query2.handleError(error, this.connection);
          });
          queryCallback(error);
          query2.callback = () => {
          };
          const index = this._queryQueue.indexOf(query2);
          if (index > -1) {
            this._queryQueue.splice(index, 1);
          }
          this._pulseQueryQueue();
        }, readTimeout);
        query2.callback = (err, res) => {
          clearTimeout(readTimeoutTimer);
          queryCallback(err, res);
        };
      }
      if (!this._queryable) {
        query2.native = this.native;
        process.nextTick(() => {
          query2.handleError(new Error("Client has encountered a connection error and is not queryable"));
        });
        return result;
      }
      if (this._ending) {
        query2.native = this.native;
        process.nextTick(() => {
          query2.handleError(new Error("Client was closed and is not queryable"));
        });
        return result;
      }
      this._queryQueue.push(query2);
      this._pulseQueryQueue();
      return result;
    };
    Client2.prototype.end = function(cb) {
      const self = this;
      this._ending = true;
      if (!this._connected) {
        this.once("connect", this.end.bind(this, cb));
      }
      let result;
      if (!cb) {
        result = new this._Promise(function(resolve, reject) {
          cb = (err) => err ? reject(err) : resolve();
        });
      }
      this.native.end(function() {
        self._errorAllQueries(new Error("Connection terminated"));
        process.nextTick(() => {
          self.emit("end");
          if (cb) cb();
        });
      });
      return result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected) {
        return;
      }
      if (this._hasActiveQuery()) {
        return;
      }
      const query2 = this._queryQueue.shift();
      if (!query2) {
        if (!initialConnection) {
          this.emit("drain");
        }
        return;
      }
      this._activeQuery = query2;
      query2.submit(this);
      const self = this;
      query2.once("_done", function() {
        self._pulseQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query2) {
      if (this._activeQuery === query2) {
        this.native.cancel(function() {
        });
      } else if (this._queryQueue.indexOf(query2) !== -1) {
        this._queryQueue.splice(this._queryQueue.indexOf(query2), 1);
      }
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/native/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_client2();
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/lib/index.js"(exports2, module2) {
    "use strict";
    var Client2 = require_client();
    var defaults2 = require_defaults();
    var Connection2 = require_connection();
    var Result2 = require_result();
    var utils = require_utils();
    var Pool2 = require_pg_pool();
    var TypeOverrides2 = require_type_overrides();
    var { DatabaseError: DatabaseError2 } = require_dist();
    var { escapeIdentifier: escapeIdentifier2, escapeLiteral: escapeLiteral2 } = require_utils();
    var poolFactory = (Client3) => {
      return class BoundPool extends Pool2 {
        constructor(options) {
          super(options, Client3);
        }
      };
    };
    var PG = function(clientConstructor) {
      this.defaults = defaults2;
      this.Client = clientConstructor;
      this.Query = this.Client.Query;
      this.Pool = poolFactory(this.Client);
      this._pools = [];
      this.Connection = Connection2;
      this.types = require_pg_types();
      this.DatabaseError = DatabaseError2;
      this.TypeOverrides = TypeOverrides2;
      this.escapeIdentifier = escapeIdentifier2;
      this.escapeLiteral = escapeLiteral2;
      this.Result = Result2;
      this.utils = utils;
    };
    if (typeof process.env.NODE_PG_FORCE_NATIVE !== "undefined") {
      module2.exports = new PG(require_native());
    } else {
      module2.exports = new PG(Client2);
      Object.defineProperty(module2.exports, "native", {
        configurable: true,
        enumerable: false,
        get() {
          let native = null;
          try {
            native = new PG(require_native());
          } catch (err) {
            if (err.code !== "MODULE_NOT_FOUND") {
              throw err;
            }
          }
          Object.defineProperty(module2.exports, "native", {
            value: native
          });
          return native;
        }
      });
    }
  }
});

// node_modules/.pnpm/pg@8.16.3/node_modules/pg/esm/index.mjs
var import_lib, Client, Pool, Connection, types, Query, DatabaseError, escapeIdentifier, escapeLiteral, Result, TypeOverrides, defaults;
var init_esm = __esm({
  "node_modules/.pnpm/pg@8.16.3/node_modules/pg/esm/index.mjs"() {
    import_lib = __toESM(require_lib2(), 1);
    Client = import_lib.default.Client;
    Pool = import_lib.default.Pool;
    Connection = import_lib.default.Connection;
    types = import_lib.default.types;
    Query = import_lib.default.Query;
    DatabaseError = import_lib.default.DatabaseError;
    escapeIdentifier = import_lib.default.escapeIdentifier;
    escapeLiteral = import_lib.default.escapeLiteral;
    Result = import_lib.default.Result;
    TypeOverrides = import_lib.default.TypeOverrides;
    defaults = import_lib.default.defaults;
  }
});

// backend/shared/config.ts
var toNumber, toBoolean, toQueueMode, toVerifyMode, toSupabaseJwksUrl, toList, config;
var init_config = __esm({
  "backend/shared/config.ts"() {
    "use strict";
    toNumber = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    toBoolean = (value) => value === "1" || value === "true";
    toQueueMode = (value) => {
      if (value === "queue" || value === "shadow") return value;
      return "off";
    };
    toVerifyMode = (value) => {
      if (value === "jwks" || value === "remote" || value === "auto") {
        return value;
      }
      return "auto";
    };
    toSupabaseJwksUrl = (baseUrl, explicit) => {
      if (explicit && explicit.trim()) {
        return explicit.trim();
      }
      if (baseUrl && baseUrl.trim()) {
        return `${baseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`;
      }
      return "";
    };
    toList = (value) => (value || "").split(",").map((item) => item.trim()).filter(Boolean);
    config = {
      env: process.env.NODE_ENV || "development",
      planeA: {
        port: toNumber(process.env.PLANE_A_PORT, 4e3),
        rateLimitMax: toNumber(process.env.PLANE_A_RATE_LIMIT_MAX, 120),
        rateLimitWindowMs: toNumber(process.env.PLANE_A_RATE_LIMIT_WINDOW_MS, 6e4),
        requireApiKey: process.env.PLANE_A_REQUIRE_API_KEY === "1",
        requireJwt: process.env.PLANE_A_REQUIRE_JWT === "1",
        apiKeys: (process.env.PLANE_A_API_KEYS || "").split(",").map((k) => k.trim()).filter(Boolean),
        jwtSecret: process.env.PLANE_A_JWT_SECRET || "change-me",
        planeCBaseUrl: process.env.PLANE_C_BASE_URL || "http://localhost:4100",
        adminEmails: (process.env.PLANE_A_ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
        b2c: {
          cacheTtlSeconds: toNumber(process.env.PLANE_A_B2C_CACHE_TTL_SECONDS, 900),
          jitterMs: toNumber(process.env.PLANE_A_B2C_JITTER_MS, 300),
          fxRateCacheTtlSeconds: toNumber(process.env.PLANE_A_FX_RATE_CACHE_TTL_SECONDS, 300),
          latestQuoteCacheTtlSeconds: toNumber(process.env.PLANE_A_LATEST_QUOTE_CACHE_TTL_SECONDS, 15)
        }
      },
      planeC: {
        port: toNumber(process.env.PLANE_C_PORT, 4100)
      },
      planeB: {
        useSeedData: toBoolean(process.env.PLANE_B_USE_SEED_DATA),
        b2bSweepIntervalMinutes: toNumber(process.env.PLANE_B_B2B_SWEEP_INTERVAL_MINUTES, 15),
        b2bMinProviderCount: toNumber(process.env.PLANE_B_B2B_MIN_PROVIDER_COUNT, 0),
        b2bFullSweepDays: toNumber(process.env.PLANE_B_B2B_FULL_SWEEP_DAYS, 30),
        b2bTargetMinutes: toNumber(process.env.PLANE_B_B2B_TARGET_MINUTES, 0),
        b2bFreshnessSloMinutes: toNumber(process.env.PLANE_B_B2B_FRESHNESS_SLO_MINUTES, 30),
        b2bFreshnessSloEnabled: toBoolean(process.env.PLANE_B_B2B_FRESHNESS_SLO_ENABLED),
        circuitOpenMs: toNumber(process.env.PLANE_B_CIRCUIT_OPEN_MS, 3e5),
        circuitHalfOpenMs: toNumber(process.env.PLANE_B_CIRCUIT_HALF_OPEN_MS, 6e4),
        blockCooldownMs: toNumber(process.env.PLANE_B_BLOCK_COOLDOWN_MS, 864e5),
        remitly: {
          delayMs: toNumber(process.env.PLANE_B_REMITLY_DELAY_MS, 1500),
          jitterMs: toNumber(process.env.PLANE_B_REMITLY_JITTER_MS, 600),
          rateLimitBackoffMs: toNumber(process.env.PLANE_B_REMITLY_RATE_LIMIT_BACKOFF_MS, 5e3),
          rateLimitJitterMs: toNumber(process.env.PLANE_B_REMITLY_RATE_LIMIT_JITTER_MS, 2e3),
          rateLimitMaxRetries: toNumber(process.env.PLANE_B_REMITLY_RATE_LIMIT_MAX_RETRIES, 2),
          corridorDelayMs: toNumber(process.env.PLANE_B_REMITLY_CORRIDOR_DELAY_MS, 2e3),
          corridorJitterMs: toNumber(process.env.PLANE_B_REMITLY_CORRIDOR_JITTER_MS, 1e3),
          b2bAmount: toNumber(process.env.PLANE_B_REMITLY_B2B_AMOUNT, 500),
          blockCooldownMs: toNumber(process.env.PLANE_B_REMITLY_BLOCK_COOLDOWN_MS, 36e5),
          sweepShardIndex: toNumber(process.env.PLANE_B_REMITLY_SWEEP_SHARD_INDEX, 0),
          sweepShardCount: toNumber(process.env.PLANE_B_REMITLY_SWEEP_SHARD_COUNT, 1),
          freshnessSloMinutes: toNumber(process.env.PLANE_B_REMITLY_FRESHNESS_SLO_MINUTES, 30),
          freshnessSloEnabled: toBoolean(process.env.PLANE_B_REMITLY_FRESHNESS_SLO_ENABLED)
        },
        wise: {
          delayMs: toNumber(process.env.PLANE_B_WISE_DELAY_MS, 1500),
          jitterMs: toNumber(process.env.PLANE_B_WISE_JITTER_MS, 600),
          rateLimitBackoffMs: toNumber(process.env.PLANE_B_WISE_RATE_LIMIT_BACKOFF_MS, 5e3),
          rateLimitJitterMs: toNumber(process.env.PLANE_B_WISE_RATE_LIMIT_JITTER_MS, 2e3),
          rateLimitMaxRetries: toNumber(process.env.PLANE_B_WISE_RATE_LIMIT_MAX_RETRIES, 2),
          corridorDelayMs: toNumber(process.env.PLANE_B_WISE_CORRIDOR_DELAY_MS, 2e3),
          corridorJitterMs: toNumber(process.env.PLANE_B_WISE_CORRIDOR_JITTER_MS, 1e3),
          b2bAmount: toNumber(process.env.PLANE_B_WISE_B2B_AMOUNT, 500),
          blockCooldownMs: toNumber(process.env.PLANE_B_WISE_BLOCK_COOLDOWN_MS, 36e5),
          sweepShardIndex: toNumber(process.env.PLANE_B_WISE_SWEEP_SHARD_INDEX, 0),
          sweepShardCount: toNumber(process.env.PLANE_B_WISE_SWEEP_SHARD_COUNT, 1),
          freshnessSloMinutes: toNumber(process.env.PLANE_B_WISE_FRESHNESS_SLO_MINUTES, 30),
          freshnessSloEnabled: toBoolean(process.env.PLANE_B_WISE_FRESHNESS_SLO_ENABLED)
        },
        xe: {
          delayMs: toNumber(process.env.PLANE_B_XE_DELAY_MS, 1500),
          jitterMs: toNumber(process.env.PLANE_B_XE_JITTER_MS, 600),
          rateLimitBackoffMs: toNumber(process.env.PLANE_B_XE_RATE_LIMIT_BACKOFF_MS, 5e3),
          rateLimitJitterMs: toNumber(process.env.PLANE_B_XE_RATE_LIMIT_JITTER_MS, 2e3),
          rateLimitMaxRetries: toNumber(process.env.PLANE_B_XE_RATE_LIMIT_MAX_RETRIES, 2),
          corridorDelayMs: toNumber(process.env.PLANE_B_XE_CORRIDOR_DELAY_MS, 2e3),
          corridorJitterMs: toNumber(process.env.PLANE_B_XE_CORRIDOR_JITTER_MS, 1e3),
          b2bAmount: toNumber(process.env.PLANE_B_XE_B2B_AMOUNT, 500),
          blockCooldownMs: toNumber(process.env.PLANE_B_XE_BLOCK_COOLDOWN_MS, 36e5),
          sweepShardIndex: toNumber(process.env.PLANE_B_XE_SWEEP_SHARD_INDEX, 0),
          sweepShardCount: toNumber(process.env.PLANE_B_XE_SWEEP_SHARD_COUNT, 1),
          freshnessSloMinutes: toNumber(process.env.PLANE_B_XE_FRESHNESS_SLO_MINUTES, 30),
          freshnessSloEnabled: toBoolean(process.env.PLANE_B_XE_FRESHNESS_SLO_ENABLED)
        },
        worldremit: {
          delayMs: toNumber(process.env.PLANE_B_WORLDREMIT_DELAY_MS, 1500),
          jitterMs: toNumber(process.env.PLANE_B_WORLDREMIT_JITTER_MS, 600),
          rateLimitBackoffMs: toNumber(process.env.PLANE_B_WORLDREMIT_RATE_LIMIT_BACKOFF_MS, 5e3),
          rateLimitJitterMs: toNumber(process.env.PLANE_B_WORLDREMIT_RATE_LIMIT_JITTER_MS, 2e3),
          rateLimitMaxRetries: toNumber(process.env.PLANE_B_WORLDREMIT_RATE_LIMIT_MAX_RETRIES, 2),
          corridorDelayMs: toNumber(process.env.PLANE_B_WORLDREMIT_CORRIDOR_DELAY_MS, 2e3),
          corridorJitterMs: toNumber(process.env.PLANE_B_WORLDREMIT_CORRIDOR_JITTER_MS, 1e3),
          b2bAmount: toNumber(process.env.PLANE_B_WORLDREMIT_B2B_AMOUNT, 500),
          blockCooldownMs: toNumber(process.env.PLANE_B_WORLDREMIT_BLOCK_COOLDOWN_MS, 36e5),
          sweepShardIndex: toNumber(process.env.PLANE_B_WORLDREMIT_SWEEP_SHARD_INDEX, 0),
          sweepShardCount: toNumber(process.env.PLANE_B_WORLDREMIT_SWEEP_SHARD_COUNT, 1),
          freshnessSloMinutes: toNumber(process.env.PLANE_B_WORLDREMIT_FRESHNESS_SLO_MINUTES, 30),
          freshnessSloEnabled: toBoolean(process.env.PLANE_B_WORLDREMIT_FRESHNESS_SLO_ENABLED)
        },
        westernunion: {
          delayMs: toNumber(process.env.PLANE_B_WESTERNUNION_DELAY_MS, 1500),
          jitterMs: toNumber(process.env.PLANE_B_WESTERNUNION_JITTER_MS, 600),
          rateLimitBackoffMs: toNumber(process.env.PLANE_B_WESTERNUNION_RATE_LIMIT_BACKOFF_MS, 5e3),
          rateLimitJitterMs: toNumber(process.env.PLANE_B_WESTERNUNION_RATE_LIMIT_JITTER_MS, 2e3),
          rateLimitMaxRetries: toNumber(process.env.PLANE_B_WESTERNUNION_RATE_LIMIT_MAX_RETRIES, 2),
          corridorDelayMs: toNumber(process.env.PLANE_B_WESTERNUNION_CORRIDOR_DELAY_MS, 2e3),
          corridorJitterMs: toNumber(process.env.PLANE_B_WESTERNUNION_CORRIDOR_JITTER_MS, 1e3),
          b2bAmount: toNumber(process.env.PLANE_B_WESTERNUNION_B2B_AMOUNT, 500),
          blockCooldownMs: toNumber(process.env.PLANE_B_WESTERNUNION_BLOCK_COOLDOWN_MS, 36e5),
          sweepShardIndex: toNumber(process.env.PLANE_B_WESTERNUNION_SWEEP_SHARD_INDEX, 0),
          sweepShardCount: toNumber(process.env.PLANE_B_WESTERNUNION_SWEEP_SHARD_COUNT, 1),
          freshnessSloMinutes: toNumber(process.env.PLANE_B_WESTERNUNION_FRESHNESS_SLO_MINUTES, 30),
          freshnessSloEnabled: toBoolean(process.env.PLANE_B_WESTERNUNION_FRESHNESS_SLO_ENABLED)
        },
        b2cRefreshBatchLimit: toNumber(process.env.PLANE_B_B2C_REFRESH_BATCH_LIMIT, 25),
        b2cRefreshMaxRetries: toNumber(process.env.PLANE_B_B2C_REFRESH_MAX_RETRIES, 3),
        b2cQueueInSweep: toBoolean(process.env.PLANE_B_B2C_QUEUE_IN_SWEEP)
      },
      redis: {
        url: process.env.REDIS_URL || ""
      },
      queues: {
        quoteRefreshUrl: process.env.QUOTE_REFRESH_QUEUE_URL || "",
        ingestFanout: {
          url: process.env.PLANE_B_INGEST_FANOUT_QUEUE_URL || "",
          mode: toQueueMode(process.env.PLANE_B_INGEST_FANOUT_QUEUE_MODE)
        },
        notifications: {
          url: process.env.PLANE_B_NOTIFICATIONS_QUEUE_URL || "",
          mode: toQueueMode(process.env.PLANE_B_NOTIFICATIONS_QUEUE_MODE)
        },
        opsAlerts: {
          url: process.env.PLANE_B_OPS_ALERT_QUEUE_URL || "",
          mode: toQueueMode(process.env.PLANE_B_OPS_ALERT_QUEUE_MODE)
        }
      },
      alerts: {
        slackWebhookUrl: process.env.ALERT_SLACK_WEBHOOK_URL || "",
        email: {
          enabled: toBoolean(process.env.ALERT_EMAIL_ENABLED),
          smtpHost: process.env.ALERT_SMTP_HOST || "",
          smtpPort: toNumber(process.env.ALERT_SMTP_PORT, 587),
          smtpSecure: toBoolean(process.env.ALERT_SMTP_SECURE),
          smtpUser: process.env.ALERT_SMTP_USER || "",
          smtpPass: process.env.ALERT_SMTP_PASS || "",
          from: process.env.ALERT_EMAIL_FROM || "",
          to: toList(process.env.ALERT_EMAIL_TO)
        }
      },
      db: {
        url: process.env.DATABASE_URL || "postgres://remit:remit@localhost:5432/remit",
        planeAUrl: process.env.DATABASE_URL_PLANE_A || process.env.DATABASE_URL || "postgres://remit:remit@localhost:5432/remit",
        planeBUrl: process.env.DATABASE_URL_PLANE_B || process.env.DATABASE_URL || "postgres://remit:remit@localhost:5432/remit",
        planeCUrl: process.env.DATABASE_URL_PLANE_C || process.env.DATABASE_URL || "postgres://remit:remit@localhost:5432/remit"
      },
      geo: {
        countryHeader: process.env.GEO_COUNTRY_HEADER || "cf-ipcountry"
      },
      auth: {
        supabase: {
          url: process.env.SUPABASE_URL || "",
          publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || "",
          jwksUrl: toSupabaseJwksUrl(process.env.SUPABASE_URL, process.env.SUPABASE_JWKS_URL),
          verifyMode: toVerifyMode(process.env.SUPABASE_AUTH_VERIFY_MODE),
          remoteVerifyCacheTtlSeconds: toNumber(process.env.SUPABASE_AUTH_REMOTE_VERIFY_CACHE_TTL_SECONDS, 30)
        }
      },
      billing: {
        stripe: {
          secretKey: process.env.STRIPE_SECRET_KEY || "",
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
          priceIdPlus: process.env.STRIPE_PRICE_ID_PLUS || "",
          frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3000"
        }
      }
    };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/util.js
var require_util = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/util.js"(exports2) {
    "use strict";
    exports2.getValueAsString = function getValueString(value) {
      if (Number.isNaN(value)) {
        return "Nan";
      } else if (!Number.isFinite(value)) {
        if (value < 0) {
          return "-Inf";
        } else {
          return "+Inf";
        }
      } else {
        return `${value}`;
      }
    };
    exports2.removeLabels = function removeLabels(hashMap, labels, sortedLabelNames) {
      const hash = hashObject(labels, sortedLabelNames);
      delete hashMap[hash];
    };
    exports2.setValue = function setValue(hashMap, value, labels) {
      const hash = hashObject(labels);
      hashMap[hash] = {
        value: typeof value === "number" ? value : 0,
        labels: labels || {}
      };
      return hashMap;
    };
    exports2.setValueDelta = function setValueDelta(hashMap, deltaValue, labels, hash = "") {
      const value = typeof deltaValue === "number" ? deltaValue : 0;
      if (hashMap[hash]) {
        hashMap[hash].value += value;
      } else {
        hashMap[hash] = { value, labels };
      }
      return hashMap;
    };
    exports2.getLabels = function(labelNames, args) {
      if (typeof args[0] === "object") {
        return args[0];
      }
      if (labelNames.length !== args.length) {
        throw new Error(
          `Invalid number of arguments (${args.length}): "${args.join(
            ", "
          )}" for label names (${labelNames.length}): "${labelNames.join(", ")}".`
        );
      }
      const acc = {};
      for (let i = 0; i < labelNames.length; i++) {
        acc[labelNames[i]] = args[i];
      }
      return acc;
    };
    function fastHashObject(keys, labels) {
      if (keys.length === 0) {
        return "";
      }
      let hash = "";
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = labels[key];
        if (value === void 0) continue;
        hash += `${key}:${value},`;
      }
      return hash;
    }
    function hashObject(labels, labelNames) {
      if (labelNames) {
        return fastHashObject(labelNames, labels);
      }
      const keys = Object.keys(labels);
      if (keys.length > 1) {
        keys.sort();
      }
      return fastHashObject(keys, labels);
    }
    exports2.hashObject = hashObject;
    exports2.isObject = function isObject(obj) {
      return obj !== null && typeof obj === "object";
    };
    exports2.nowTimestamp = function nowTimestamp() {
      return Date.now() / 1e3;
    };
    var Grouper = class extends Map {
      /**
       * Adds the `value` to the `key`'s array of values.
       * @param {*} key Key to set.
       * @param {*} value Value to add to `key`'s array.
       * @returns {undefined} undefined.
       */
      add(key, value) {
        if (this.has(key)) {
          this.get(key).push(value);
        } else {
          this.set(key, [value]);
        }
      }
    };
    exports2.Grouper = Grouper;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/registry.js
var require_registry = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/registry.js"(exports2, module2) {
    "use strict";
    var { getValueAsString } = require_util();
    var Registry2 = class _Registry {
      static get PROMETHEUS_CONTENT_TYPE() {
        return "text/plain; version=0.0.4; charset=utf-8";
      }
      static get OPENMETRICS_CONTENT_TYPE() {
        return "application/openmetrics-text; version=1.0.0; charset=utf-8";
      }
      constructor(regContentType = _Registry.PROMETHEUS_CONTENT_TYPE) {
        this._metrics = {};
        this._collectors = [];
        this._defaultLabels = {};
        if (regContentType !== _Registry.PROMETHEUS_CONTENT_TYPE && regContentType !== _Registry.OPENMETRICS_CONTENT_TYPE) {
          throw new TypeError(`Content type ${regContentType} is unsupported`);
        }
        this._contentType = regContentType;
      }
      getMetricsAsArray() {
        return Object.values(this._metrics);
      }
      async getMetricsAsString(metrics2) {
        const metric = typeof metrics2.getForPromString === "function" ? await metrics2.getForPromString() : await metrics2.get();
        const name = escapeString(metric.name);
        const help = `# HELP ${name} ${escapeString(metric.help)}`;
        const type = `# TYPE ${name} ${metric.type}`;
        const values = [help, type];
        const defaultLabels = Object.keys(this._defaultLabels).length > 0 ? this._defaultLabels : null;
        const isOpenMetrics = this.contentType === _Registry.OPENMETRICS_CONTENT_TYPE;
        for (const val of metric.values || []) {
          let { metricName = name, labels = {} } = val;
          const { sharedLabels = {} } = val;
          if (isOpenMetrics && metric.type === "counter") {
            metricName = `${metricName}_total`;
          }
          if (defaultLabels) {
            labels = { ...labels, ...defaultLabels, ...labels };
          }
          const formattedLabels = formatLabels(labels, sharedLabels);
          const flattenedShared = flattenSharedLabels(sharedLabels);
          const labelParts = [...formattedLabels, flattenedShared].filter(Boolean);
          const labelsString = labelParts.length ? `{${labelParts.join(",")}}` : "";
          let fullMetricLine = `${metricName}${labelsString} ${getValueAsString(
            val.value
          )}`;
          const { exemplar } = val;
          if (exemplar && isOpenMetrics) {
            const formattedExemplars = formatLabels(exemplar.labelSet);
            fullMetricLine += ` # {${formattedExemplars.join(
              ","
            )}} ${getValueAsString(exemplar.value)} ${exemplar.timestamp}`;
          }
          values.push(fullMetricLine);
        }
        return values.join("\n");
      }
      async metrics() {
        const isOpenMetrics = this.contentType === _Registry.OPENMETRICS_CONTENT_TYPE;
        const promises = this.getMetricsAsArray().map((metric) => {
          if (isOpenMetrics && metric.type === "counter") {
            metric.name = standardizeCounterName(metric.name);
          }
          return this.getMetricsAsString(metric);
        });
        const resolves = await Promise.all(promises);
        return isOpenMetrics ? `${resolves.join("\n")}
# EOF
` : `${resolves.join("\n\n")}
`;
      }
      registerMetric(metric) {
        if (this._metrics[metric.name] && this._metrics[metric.name] !== metric) {
          throw new Error(
            `A metric with the name ${metric.name} has already been registered.`
          );
        }
        this._metrics[metric.name] = metric;
      }
      clear() {
        this._metrics = {};
        this._defaultLabels = {};
      }
      async getMetricsAsJSON() {
        const metrics2 = [];
        const defaultLabelNames = Object.keys(this._defaultLabels);
        const promises = [];
        for (const metric of this.getMetricsAsArray()) {
          promises.push(metric.get());
        }
        const resolves = await Promise.all(promises);
        for (const item of resolves) {
          if (item.values && defaultLabelNames.length > 0) {
            for (const val of item.values) {
              val.labels = Object.assign({}, val.labels);
              for (const labelName of defaultLabelNames) {
                val.labels[labelName] = val.labels[labelName] || this._defaultLabels[labelName];
              }
            }
          }
          metrics2.push(item);
        }
        return metrics2;
      }
      removeSingleMetric(name) {
        delete this._metrics[name];
      }
      getSingleMetricAsString(name) {
        return this.getMetricsAsString(this._metrics[name]);
      }
      getSingleMetric(name) {
        return this._metrics[name];
      }
      setDefaultLabels(labels) {
        this._defaultLabels = labels;
      }
      resetMetrics() {
        for (const metric in this._metrics) {
          this._metrics[metric].reset();
        }
      }
      get contentType() {
        return this._contentType;
      }
      setContentType(metricsContentType2) {
        if (metricsContentType2 === _Registry.OPENMETRICS_CONTENT_TYPE || metricsContentType2 === _Registry.PROMETHEUS_CONTENT_TYPE) {
          this._contentType = metricsContentType2;
        } else {
          throw new Error(`Content type ${metricsContentType2} is unsupported`);
        }
      }
      static merge(registers) {
        const regType = registers[0].contentType;
        for (const reg of registers) {
          if (reg.contentType !== regType) {
            throw new Error(
              "Registers can only be merged if they have the same content type"
            );
          }
        }
        const mergedRegistry = new _Registry(regType);
        const metricsToMerge = registers.reduce(
          (acc, reg) => acc.concat(reg.getMetricsAsArray()),
          []
        );
        metricsToMerge.forEach(mergedRegistry.registerMetric, mergedRegistry);
        return mergedRegistry;
      }
    };
    function formatLabels(labels, exclude) {
      const { hasOwnProperty } = Object.prototype;
      const formatted = [];
      for (const [name, value] of Object.entries(labels)) {
        if (!exclude || !hasOwnProperty.call(exclude, name)) {
          formatted.push(`${name}="${escapeLabelValue(value)}"`);
        }
      }
      return formatted;
    }
    var sharedLabelCache = /* @__PURE__ */ new WeakMap();
    function flattenSharedLabels(labels) {
      const cached = sharedLabelCache.get(labels);
      if (cached) {
        return cached;
      }
      const formattedLabels = formatLabels(labels);
      const flattened = formattedLabels.join(",");
      sharedLabelCache.set(labels, flattened);
      return flattened;
    }
    function escapeLabelValue(str) {
      if (typeof str !== "string") {
        return str;
      }
      return escapeString(str).replace(/"/g, '\\"');
    }
    function escapeString(str) {
      return str.replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
    }
    function standardizeCounterName(name) {
      return name.replace(/_total$/, "");
    }
    module2.exports = Registry2;
    module2.exports.globalRegistry = new Registry2();
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/validation.js
var require_validation = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/validation.js"(exports2) {
    "use strict";
    var util = require("util");
    var metricRegexp = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
    var labelRegexp = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    exports2.validateMetricName = function(name) {
      return metricRegexp.test(name);
    };
    exports2.validateLabelName = function(names = []) {
      return names.every((name) => labelRegexp.test(name));
    };
    exports2.validateLabel = function validateLabel(savedLabels, labels) {
      for (const label in labels) {
        if (!savedLabels.includes(label)) {
          throw new Error(
            `Added label "${label}" is not included in initial labelset: ${util.inspect(
              savedLabels
            )}`
          );
        }
      }
    };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metric.js
var require_metric = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metric.js"(exports2, module2) {
    "use strict";
    var Registry2 = require_registry();
    var { isObject } = require_util();
    var { validateMetricName, validateLabelName } = require_validation();
    var Metric = class {
      constructor(config2, defaults2 = {}) {
        if (!isObject(config2)) {
          throw new TypeError("constructor expected a config object");
        }
        Object.assign(
          this,
          {
            labelNames: [],
            registers: [Registry2.globalRegistry],
            aggregator: "sum",
            enableExemplars: false
          },
          defaults2,
          config2
        );
        if (!this.registers) {
          this.registers = [Registry2.globalRegistry];
        }
        if (!this.help) {
          throw new Error("Missing mandatory help parameter");
        }
        if (!this.name) {
          throw new Error("Missing mandatory name parameter");
        }
        if (!validateMetricName(this.name)) {
          throw new Error("Invalid metric name");
        }
        if (!validateLabelName(this.labelNames)) {
          throw new Error("Invalid label name");
        }
        if (this.collect && typeof this.collect !== "function") {
          throw new Error('Optional "collect" parameter must be a function');
        }
        if (this.labelNames) {
          this.sortedLabelNames = [...this.labelNames].sort();
        } else {
          this.sortedLabelNames = [];
        }
        this.reset();
        for (const register of this.registers) {
          if (this.enableExemplars && register.contentType === Registry2.PROMETHEUS_CONTENT_TYPE) {
            throw new TypeError(
              "Exemplars are supported only on OpenMetrics registries"
            );
          }
          register.registerMetric(this);
        }
      }
      reset() {
      }
    };
    module2.exports = { Metric };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/exemplar.js
var require_exemplar = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/exemplar.js"(exports2, module2) {
    "use strict";
    var Exemplar = class {
      constructor(labelSet = {}, value = null) {
        this.labelSet = labelSet;
        this.value = value;
      }
      /**
       * Validation for the label set format.
       * https://github.com/OpenObservability/OpenMetrics/blob/d99b705f611b75fec8f450b05e344e02eea6921d/specification/OpenMetrics.md#exemplars
       *
       * @param {object} labelSet - Exemplar labels.
       * @throws {RangeError}
       * @return {void}
       */
      validateExemplarLabelSet(labelSet) {
        let res = "";
        for (const [labelName, labelValue] of Object.entries(labelSet)) {
          res += `${labelName}${labelValue}`;
        }
        if (res.length > 128) {
          throw new RangeError(
            "Label set size must be smaller than 128 UTF-8 chars"
          );
        }
      }
    };
    module2.exports = Exemplar;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/counter.js
var require_counter = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/counter.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var {
      hashObject,
      isObject,
      getLabels,
      removeLabels,
      nowTimestamp
    } = require_util();
    var { validateLabel } = require_validation();
    var { Metric } = require_metric();
    var Exemplar = require_exemplar();
    var Counter2 = class extends Metric {
      constructor(config2) {
        super(config2);
        this.type = "counter";
        this.defaultLabels = {};
        this.defaultValue = 1;
        this.defaultExemplarLabelSet = {};
        if (config2.enableExemplars) {
          this.enableExemplars = true;
          this.inc = this.incWithExemplar;
        } else {
          this.inc = this.incWithoutExemplar;
        }
      }
      /**
       * Increment counter
       * @param {object} labels - What label you want to be incremented
       * @param {Number} value - Value to increment, if omitted increment with 1
       * @returns {object} results - object with information about the inc operation
       * @returns {string} results.labelHash - hash representation of the labels
       */
      incWithoutExemplar(labels, value) {
        let hash = "";
        if (isObject(labels)) {
          hash = hashObject(labels, this.sortedLabelNames);
          validateLabel(this.labelNames, labels);
        } else {
          value = labels;
          labels = {};
        }
        if (value && !Number.isFinite(value)) {
          throw new TypeError(`Value is not a valid number: ${util.format(value)}`);
        }
        if (value < 0) {
          throw new Error("It is not possible to decrease a counter");
        }
        if (value === null || value === void 0) value = 1;
        setValue(this.hashMap, value, labels, hash);
        return { labelHash: hash };
      }
      /**
       * Increment counter with exemplar, same as inc but accepts labels for an
       * exemplar.
       * If no label is provided the current exemplar labels are kept unchanged
       * (defaults to empty set).
       *
       * @param {object} incOpts - Object with options about what metric to increase
       * @param {object} incOpts.labels - What label you want to be incremented,
       *                                  defaults to null (metric with no labels)
       * @param {Number} incOpts.value - Value to increment, defaults to 1
       * @param {object} incOpts.exemplarLabels - Key-value  labels for the
       *                                          exemplar, defaults to empty set {}
       * @returns {void}
       */
      incWithExemplar({
        labels = this.defaultLabels,
        value = this.defaultValue,
        exemplarLabels = this.defaultExemplarLabelSet
      } = {}) {
        const res = this.incWithoutExemplar(labels, value);
        this.updateExemplar(exemplarLabels, value, res.labelHash);
      }
      updateExemplar(exemplarLabels, value, hash) {
        if (exemplarLabels === this.defaultExemplarLabelSet) return;
        if (!isObject(this.hashMap[hash].exemplar)) {
          this.hashMap[hash].exemplar = new Exemplar();
        }
        this.hashMap[hash].exemplar.validateExemplarLabelSet(exemplarLabels);
        this.hashMap[hash].exemplar.labelSet = exemplarLabels;
        this.hashMap[hash].exemplar.value = value ? value : 1;
        this.hashMap[hash].exemplar.timestamp = nowTimestamp();
      }
      /**
       * Reset counter
       * @returns {void}
       */
      reset() {
        this.hashMap = {};
        if (this.labelNames.length === 0) {
          setValue(this.hashMap, 0);
        }
      }
      async get() {
        if (this.collect) {
          const v = this.collect();
          if (v instanceof Promise) await v;
        }
        return {
          help: this.help,
          name: this.name,
          type: this.type,
          values: Object.values(this.hashMap),
          aggregator: this.aggregator
        };
      }
      labels(...args) {
        const labels = getLabels(this.labelNames, args) || {};
        return {
          inc: this.inc.bind(this, labels)
        };
      }
      remove(...args) {
        const labels = getLabels(this.labelNames, args) || {};
        validateLabel(this.labelNames, labels);
        return removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
      }
    };
    function setValue(hashMap, value, labels = {}, hash = "") {
      if (hashMap[hash]) {
        hashMap[hash].value += value;
      } else {
        hashMap[hash] = { value, labels };
      }
      return hashMap;
    }
    module2.exports = Counter2;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/gauge.js
var require_gauge = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/gauge.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var {
      setValue,
      setValueDelta,
      getLabels,
      hashObject,
      isObject,
      removeLabels
    } = require_util();
    var { validateLabel } = require_validation();
    var { Metric } = require_metric();
    var Gauge2 = class extends Metric {
      constructor(config2) {
        super(config2);
        this.type = "gauge";
      }
      /**
       * Set a gauge to a value
       * @param {object} labels - Object with labels and their values
       * @param {Number} value - Value to set the gauge to, must be positive
       * @returns {void}
       */
      set(labels, value) {
        value = getValueArg(labels, value);
        labels = getLabelArg(labels);
        set(this, labels, value);
      }
      /**
       * Reset gauge
       * @returns {void}
       */
      reset() {
        this.hashMap = {};
        if (this.labelNames.length === 0) {
          setValue(this.hashMap, 0, {});
        }
      }
      /**
       * Increment a gauge value
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @param {Number} value - Value to increment - if omitted, increment with 1
       * @returns {void}
       */
      inc(labels, value) {
        value = getValueArg(labels, value);
        labels = getLabelArg(labels);
        if (value === void 0) value = 1;
        setDelta(this, labels, value);
      }
      /**
       * Decrement a gauge value
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @param {Number} value - Value to decrement - if omitted, decrement with 1
       * @returns {void}
       */
      dec(labels, value) {
        value = getValueArg(labels, value);
        labels = getLabelArg(labels);
        if (value === void 0) value = 1;
        setDelta(this, labels, -value);
      }
      /**
       * Set the gauge to current unix epoch
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @returns {void}
       */
      setToCurrentTime(labels) {
        const now = Date.now() / 1e3;
        if (labels === void 0) {
          this.set(now);
        } else {
          this.set(labels, now);
        }
      }
      /**
       * Start a timer
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @returns {function} - Invoke this function to set the duration in seconds since you started the timer.
       * @example
       * var done = gauge.startTimer();
       * makeXHRRequest(function(err, response) {
       *	done(); //Duration of the request will be saved
       * });
       */
      startTimer(labels) {
        const start = process.hrtime();
        return (endLabels) => {
          const delta = process.hrtime(start);
          const value = delta[0] + delta[1] / 1e9;
          this.set(Object.assign({}, labels, endLabels), value);
          return value;
        };
      }
      async get() {
        if (this.collect) {
          const v = this.collect();
          if (v instanceof Promise) await v;
        }
        return {
          help: this.help,
          name: this.name,
          type: this.type,
          values: Object.values(this.hashMap),
          aggregator: this.aggregator
        };
      }
      _getValue(labels) {
        const hash = hashObject(labels || {}, this.sortedLabelNames);
        return this.hashMap[hash] ? this.hashMap[hash].value : 0;
      }
      labels(...args) {
        const labels = getLabels(this.labelNames, args);
        validateLabel(this.labelNames, labels);
        return {
          inc: this.inc.bind(this, labels),
          dec: this.dec.bind(this, labels),
          set: this.set.bind(this, labels),
          setToCurrentTime: this.setToCurrentTime.bind(this, labels),
          startTimer: this.startTimer.bind(this, labels)
        };
      }
      remove(...args) {
        const labels = getLabels(this.labelNames, args);
        validateLabel(this.labelNames, labels);
        removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
      }
    };
    function set(gauge, labels, value) {
      if (typeof value !== "number") {
        throw new TypeError(`Value is not a valid number: ${util.format(value)}`);
      }
      validateLabel(gauge.labelNames, labels);
      setValue(gauge.hashMap, value, labels);
    }
    function setDelta(gauge, labels, delta) {
      if (typeof delta !== "number") {
        throw new TypeError(`Delta is not a valid number: ${util.format(delta)}`);
      }
      validateLabel(gauge.labelNames, labels);
      const hash = hashObject(labels, gauge.sortedLabelNames);
      setValueDelta(gauge.hashMap, delta, labels, hash);
    }
    function getLabelArg(labels) {
      return isObject(labels) ? labels : {};
    }
    function getValueArg(labels, value) {
      return isObject(labels) ? value : labels;
    }
    module2.exports = Gauge2;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/histogram.js
var require_histogram = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/histogram.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var {
      getLabels,
      hashObject,
      isObject,
      removeLabels,
      nowTimestamp
    } = require_util();
    var { validateLabel } = require_validation();
    var { Metric } = require_metric();
    var Exemplar = require_exemplar();
    var Histogram2 = class extends Metric {
      constructor(config2) {
        super(config2, {
          buckets: [5e-3, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        });
        this.type = "histogram";
        this.defaultLabels = {};
        this.defaultExemplarLabelSet = {};
        this.enableExemplars = false;
        for (const label of this.labelNames) {
          if (label === "le") {
            throw new Error("le is a reserved label keyword");
          }
        }
        this.upperBounds = this.buckets;
        this.bucketValues = this.upperBounds.reduce((acc, upperBound) => {
          acc[upperBound] = 0;
          return acc;
        }, {});
        if (config2.enableExemplars) {
          this.enableExemplars = true;
          this.bucketExemplars = this.upperBounds.reduce((acc, upperBound) => {
            acc[upperBound] = null;
            return acc;
          }, {});
          Object.freeze(this.bucketExemplars);
          this.observe = this.observeWithExemplar;
        } else {
          this.observe = this.observeWithoutExemplar;
        }
        Object.freeze(this.bucketValues);
        Object.freeze(this.upperBounds);
        if (this.labelNames.length === 0) {
          this.hashMap = {
            [hashObject({})]: createBaseValues(
              {},
              this.bucketValues,
              this.bucketExemplars
            )
          };
        }
      }
      /**
       * Observe a value in histogram
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @param {Number} value - Value to observe in the histogram
       * @returns {void}
       */
      observeWithoutExemplar(labels, value) {
        observe.call(this, labels === 0 ? 0 : labels || {})(value);
      }
      observeWithExemplar({
        labels = this.defaultLabels,
        value,
        exemplarLabels = this.defaultExemplarLabelSet
      } = {}) {
        observe.call(this, labels === 0 ? 0 : labels || {})(value);
        this.updateExemplar(labels, value, exemplarLabels);
      }
      updateExemplar(labels, value, exemplarLabels) {
        if (Object.keys(exemplarLabels).length === 0) return;
        const hash = hashObject(labels, this.sortedLabelNames);
        const bound = findBound(this.upperBounds, value);
        const { bucketExemplars } = this.hashMap[hash];
        let exemplar = bucketExemplars[bound];
        if (!isObject(exemplar)) {
          exemplar = new Exemplar();
          bucketExemplars[bound] = exemplar;
        }
        exemplar.validateExemplarLabelSet(exemplarLabels);
        exemplar.labelSet = exemplarLabels;
        exemplar.value = value;
        exemplar.timestamp = nowTimestamp();
      }
      async get() {
        const data = await this.getForPromString();
        data.values = data.values.map(splayLabels);
        return data;
      }
      async getForPromString() {
        if (this.collect) {
          const v = this.collect();
          if (v instanceof Promise) await v;
        }
        const data = Object.values(this.hashMap);
        const values = data.map(extractBucketValuesForExport(this)).reduce(addSumAndCountForExport(this), []);
        return {
          name: this.name,
          help: this.help,
          type: this.type,
          values,
          aggregator: this.aggregator
        };
      }
      reset() {
        this.hashMap = {};
      }
      /**
       * Initialize the metrics for the given combination of labels to zero
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @returns {void}
       */
      zero(labels) {
        const hash = hashObject(labels, this.sortedLabelNames);
        this.hashMap[hash] = createBaseValues(
          labels,
          this.bucketValues,
          this.bucketExemplars
        );
      }
      /**
       * Start a timer that could be used to logging durations
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @param {object} exemplarLabels - Object with labels for exemplar where key is the label key and value is label value. Can only be one level deep
       * @returns {function} - Function to invoke when you want to stop the timer and observe the duration in seconds
       * @example
       * var end = histogram.startTimer();
       * makeExpensiveXHRRequest(function(err, res) {
       * 	const duration = end(); //Observe the duration of expensiveXHRRequest and returns duration in seconds
       * 	console.log('Duration', duration);
       * });
       */
      startTimer(labels, exemplarLabels) {
        return this.enableExemplars ? startTimerWithExemplar.call(this, labels, exemplarLabels)() : startTimer.call(this, labels)();
      }
      labels(...args) {
        const labels = getLabels(this.labelNames, args);
        validateLabel(this.labelNames, labels);
        return {
          observe: observe.call(this, labels),
          startTimer: startTimer.call(this, labels)
        };
      }
      remove(...args) {
        const labels = getLabels(this.labelNames, args);
        validateLabel(this.labelNames, labels);
        removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
      }
    };
    function startTimer(startLabels) {
      return () => {
        const start = process.hrtime();
        return (endLabels) => {
          const delta = process.hrtime(start);
          const value = delta[0] + delta[1] / 1e9;
          this.observe(Object.assign({}, startLabels, endLabels), value);
          return value;
        };
      };
    }
    function startTimerWithExemplar(startLabels, startExemplarLabels) {
      return () => {
        const start = process.hrtime();
        return (endLabels, endExemplarLabels) => {
          const delta = process.hrtime(start);
          const value = delta[0] + delta[1] / 1e9;
          this.observe({
            labels: Object.assign({}, startLabels, endLabels),
            value,
            exemplarLabels: Object.assign(
              {},
              startExemplarLabels,
              endExemplarLabels
            )
          });
          return value;
        };
      };
    }
    function setValuePair(labels, value, metricName, exemplar, sharedLabels = {}) {
      return {
        labels,
        sharedLabels,
        value,
        metricName,
        exemplar
      };
    }
    function findBound(upperBounds, value) {
      for (let i = 0; i < upperBounds.length; i++) {
        const bound = upperBounds[i];
        if (value <= bound) {
          return bound;
        }
      }
      return -1;
    }
    function observe(labels) {
      return (value) => {
        const labelValuePair = convertLabelsAndValues(labels, value);
        validateLabel(this.labelNames, labelValuePair.labels);
        if (!Number.isFinite(labelValuePair.value)) {
          throw new TypeError(
            `Value is not a valid number: ${util.format(labelValuePair.value)}`
          );
        }
        const hash = hashObject(labelValuePair.labels, this.sortedLabelNames);
        let valueFromMap = this.hashMap[hash];
        if (!valueFromMap) {
          valueFromMap = createBaseValues(
            labelValuePair.labels,
            this.bucketValues,
            this.bucketExemplars
          );
        }
        const b = findBound(this.upperBounds, labelValuePair.value);
        valueFromMap.sum += labelValuePair.value;
        valueFromMap.count += 1;
        if (Object.prototype.hasOwnProperty.call(valueFromMap.bucketValues, b)) {
          valueFromMap.bucketValues[b] += 1;
        }
        this.hashMap[hash] = valueFromMap;
      };
    }
    function createBaseValues(labels, bucketValues, bucketExemplars) {
      const result = {
        labels,
        bucketValues: { ...bucketValues },
        sum: 0,
        count: 0
      };
      if (bucketExemplars) {
        result.bucketExemplars = { ...bucketExemplars };
      }
      return result;
    }
    function convertLabelsAndValues(labels, value) {
      return isObject(labels) ? {
        labels,
        value
      } : {
        value: labels,
        labels: {}
      };
    }
    function extractBucketValuesForExport(histogram) {
      const name = `${histogram.name}_bucket`;
      return (bucketData) => {
        let acc = 0;
        const buckets = histogram.upperBounds.map((upperBound) => {
          acc += bucketData.bucketValues[upperBound];
          return setValuePair(
            { le: upperBound },
            acc,
            name,
            bucketData.bucketExemplars ? bucketData.bucketExemplars[upperBound] : null,
            bucketData.labels
          );
        });
        return { buckets, data: bucketData };
      };
    }
    function addSumAndCountForExport(histogram) {
      return (acc, d) => {
        acc.push(...d.buckets);
        const infLabel = { le: "+Inf" };
        acc.push(
          setValuePair(
            infLabel,
            d.data.count,
            `${histogram.name}_bucket`,
            d.data.bucketExemplars ? d.data.bucketExemplars["-1"] : null,
            d.data.labels
          ),
          setValuePair(
            {},
            d.data.sum,
            `${histogram.name}_sum`,
            void 0,
            d.data.labels
          ),
          setValuePair(
            {},
            d.data.count,
            `${histogram.name}_count`,
            void 0,
            d.data.labels
          )
        );
        return acc;
      };
    }
    function splayLabels(bucket) {
      const { sharedLabels, labels, ...newBucket } = bucket;
      for (const label of Object.keys(sharedLabels)) {
        labels[label] = sharedLabels[label];
      }
      newBucket.labels = labels;
      return newBucket;
    }
    module2.exports = Histogram2;
  }
});

// node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/lib/treebase.js
var require_treebase = __commonJS({
  "node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/lib/treebase.js"(exports2, module2) {
    function TreeBase() {
    }
    TreeBase.prototype.clear = function() {
      this._root = null;
      this.size = 0;
    };
    TreeBase.prototype.find = function(data) {
      var res = this._root;
      while (res !== null) {
        var c = this._comparator(data, res.data);
        if (c === 0) {
          return res.data;
        } else {
          res = res.get_child(c > 0);
        }
      }
      return null;
    };
    TreeBase.prototype.findIter = function(data) {
      var res = this._root;
      var iter = this.iterator();
      while (res !== null) {
        var c = this._comparator(data, res.data);
        if (c === 0) {
          iter._cursor = res;
          return iter;
        } else {
          iter._ancestors.push(res);
          res = res.get_child(c > 0);
        }
      }
      return null;
    };
    TreeBase.prototype.lowerBound = function(item) {
      var cur = this._root;
      var iter = this.iterator();
      var cmp = this._comparator;
      while (cur !== null) {
        var c = cmp(item, cur.data);
        if (c === 0) {
          iter._cursor = cur;
          return iter;
        }
        iter._ancestors.push(cur);
        cur = cur.get_child(c > 0);
      }
      for (var i = iter._ancestors.length - 1; i >= 0; --i) {
        cur = iter._ancestors[i];
        if (cmp(item, cur.data) < 0) {
          iter._cursor = cur;
          iter._ancestors.length = i;
          return iter;
        }
      }
      iter._ancestors.length = 0;
      return iter;
    };
    TreeBase.prototype.upperBound = function(item) {
      var iter = this.lowerBound(item);
      var cmp = this._comparator;
      while (iter.data() !== null && cmp(iter.data(), item) === 0) {
        iter.next();
      }
      return iter;
    };
    TreeBase.prototype.min = function() {
      var res = this._root;
      if (res === null) {
        return null;
      }
      while (res.left !== null) {
        res = res.left;
      }
      return res.data;
    };
    TreeBase.prototype.max = function() {
      var res = this._root;
      if (res === null) {
        return null;
      }
      while (res.right !== null) {
        res = res.right;
      }
      return res.data;
    };
    TreeBase.prototype.iterator = function() {
      return new Iterator(this);
    };
    TreeBase.prototype.each = function(cb) {
      var it = this.iterator(), data;
      while ((data = it.next()) !== null) {
        if (cb(data) === false) {
          return;
        }
      }
    };
    TreeBase.prototype.reach = function(cb) {
      var it = this.iterator(), data;
      while ((data = it.prev()) !== null) {
        if (cb(data) === false) {
          return;
        }
      }
    };
    function Iterator(tree) {
      this._tree = tree;
      this._ancestors = [];
      this._cursor = null;
    }
    Iterator.prototype.data = function() {
      return this._cursor !== null ? this._cursor.data : null;
    };
    Iterator.prototype.next = function() {
      if (this._cursor === null) {
        var root = this._tree._root;
        if (root !== null) {
          this._minNode(root);
        }
      } else {
        if (this._cursor.right === null) {
          var save;
          do {
            save = this._cursor;
            if (this._ancestors.length) {
              this._cursor = this._ancestors.pop();
            } else {
              this._cursor = null;
              break;
            }
          } while (this._cursor.right === save);
        } else {
          this._ancestors.push(this._cursor);
          this._minNode(this._cursor.right);
        }
      }
      return this._cursor !== null ? this._cursor.data : null;
    };
    Iterator.prototype.prev = function() {
      if (this._cursor === null) {
        var root = this._tree._root;
        if (root !== null) {
          this._maxNode(root);
        }
      } else {
        if (this._cursor.left === null) {
          var save;
          do {
            save = this._cursor;
            if (this._ancestors.length) {
              this._cursor = this._ancestors.pop();
            } else {
              this._cursor = null;
              break;
            }
          } while (this._cursor.left === save);
        } else {
          this._ancestors.push(this._cursor);
          this._maxNode(this._cursor.left);
        }
      }
      return this._cursor !== null ? this._cursor.data : null;
    };
    Iterator.prototype._minNode = function(start) {
      while (start.left !== null) {
        this._ancestors.push(start);
        start = start.left;
      }
      this._cursor = start;
    };
    Iterator.prototype._maxNode = function(start) {
      while (start.right !== null) {
        this._ancestors.push(start);
        start = start.right;
      }
      this._cursor = start;
    };
    module2.exports = TreeBase;
  }
});

// node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/lib/rbtree.js
var require_rbtree = __commonJS({
  "node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/lib/rbtree.js"(exports2, module2) {
    var TreeBase = require_treebase();
    function Node(data) {
      this.data = data;
      this.left = null;
      this.right = null;
      this.red = true;
    }
    Node.prototype.get_child = function(dir) {
      return dir ? this.right : this.left;
    };
    Node.prototype.set_child = function(dir, val) {
      if (dir) {
        this.right = val;
      } else {
        this.left = val;
      }
    };
    function RBTree(comparator) {
      this._root = null;
      this._comparator = comparator;
      this.size = 0;
    }
    RBTree.prototype = new TreeBase();
    RBTree.prototype.insert = function(data) {
      var ret2 = false;
      if (this._root === null) {
        this._root = new Node(data);
        ret2 = true;
        this.size++;
      } else {
        var head = new Node(void 0);
        var dir = 0;
        var last = 0;
        var gp = null;
        var ggp = head;
        var p = null;
        var node = this._root;
        ggp.right = this._root;
        while (true) {
          if (node === null) {
            node = new Node(data);
            p.set_child(dir, node);
            ret2 = true;
            this.size++;
          } else if (is_red(node.left) && is_red(node.right)) {
            node.red = true;
            node.left.red = false;
            node.right.red = false;
          }
          if (is_red(node) && is_red(p)) {
            var dir2 = ggp.right === gp;
            if (node === p.get_child(last)) {
              ggp.set_child(dir2, single_rotate(gp, !last));
            } else {
              ggp.set_child(dir2, double_rotate(gp, !last));
            }
          }
          var cmp = this._comparator(node.data, data);
          if (cmp === 0) {
            break;
          }
          last = dir;
          dir = cmp < 0;
          if (gp !== null) {
            ggp = gp;
          }
          gp = p;
          p = node;
          node = node.get_child(dir);
        }
        this._root = head.right;
      }
      this._root.red = false;
      return ret2;
    };
    RBTree.prototype.remove = function(data) {
      if (this._root === null) {
        return false;
      }
      var head = new Node(void 0);
      var node = head;
      node.right = this._root;
      var p = null;
      var gp = null;
      var found = null;
      var dir = 1;
      while (node.get_child(dir) !== null) {
        var last = dir;
        gp = p;
        p = node;
        node = node.get_child(dir);
        var cmp = this._comparator(data, node.data);
        dir = cmp > 0;
        if (cmp === 0) {
          found = node;
        }
        if (!is_red(node) && !is_red(node.get_child(dir))) {
          if (is_red(node.get_child(!dir))) {
            var sr = single_rotate(node, dir);
            p.set_child(last, sr);
            p = sr;
          } else if (!is_red(node.get_child(!dir))) {
            var sibling = p.get_child(!last);
            if (sibling !== null) {
              if (!is_red(sibling.get_child(!last)) && !is_red(sibling.get_child(last))) {
                p.red = false;
                sibling.red = true;
                node.red = true;
              } else {
                var dir2 = gp.right === p;
                if (is_red(sibling.get_child(last))) {
                  gp.set_child(dir2, double_rotate(p, last));
                } else if (is_red(sibling.get_child(!last))) {
                  gp.set_child(dir2, single_rotate(p, last));
                }
                var gpc = gp.get_child(dir2);
                gpc.red = true;
                node.red = true;
                gpc.left.red = false;
                gpc.right.red = false;
              }
            }
          }
        }
      }
      if (found !== null) {
        found.data = node.data;
        p.set_child(p.right === node, node.get_child(node.left === null));
        this.size--;
      }
      this._root = head.right;
      if (this._root !== null) {
        this._root.red = false;
      }
      return found !== null;
    };
    function is_red(node) {
      return node !== null && node.red;
    }
    function single_rotate(root, dir) {
      var save = root.get_child(!dir);
      root.set_child(!dir, save.get_child(dir));
      save.set_child(dir, root);
      root.red = true;
      save.red = false;
      return save;
    }
    function double_rotate(root, dir) {
      root.set_child(!dir, single_rotate(root.get_child(!dir), !dir));
      return single_rotate(root, dir);
    }
    module2.exports = RBTree;
  }
});

// node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/lib/bintree.js
var require_bintree = __commonJS({
  "node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/lib/bintree.js"(exports2, module2) {
    var TreeBase = require_treebase();
    function Node(data) {
      this.data = data;
      this.left = null;
      this.right = null;
    }
    Node.prototype.get_child = function(dir) {
      return dir ? this.right : this.left;
    };
    Node.prototype.set_child = function(dir, val) {
      if (dir) {
        this.right = val;
      } else {
        this.left = val;
      }
    };
    function BinTree(comparator) {
      this._root = null;
      this._comparator = comparator;
      this.size = 0;
    }
    BinTree.prototype = new TreeBase();
    BinTree.prototype.insert = function(data) {
      if (this._root === null) {
        this._root = new Node(data);
        this.size++;
        return true;
      }
      var dir = 0;
      var p = null;
      var node = this._root;
      while (true) {
        if (node === null) {
          node = new Node(data);
          p.set_child(dir, node);
          ret = true;
          this.size++;
          return true;
        }
        if (this._comparator(node.data, data) === 0) {
          return false;
        }
        dir = this._comparator(node.data, data) < 0;
        p = node;
        node = node.get_child(dir);
      }
    };
    BinTree.prototype.remove = function(data) {
      if (this._root === null) {
        return false;
      }
      var head = new Node(void 0);
      var node = head;
      node.right = this._root;
      var p = null;
      var found = null;
      var dir = 1;
      while (node.get_child(dir) !== null) {
        p = node;
        node = node.get_child(dir);
        var cmp = this._comparator(data, node.data);
        dir = cmp > 0;
        if (cmp === 0) {
          found = node;
        }
      }
      if (found !== null) {
        found.data = node.data;
        p.set_child(p.right === node, node.get_child(node.left === null));
        this._root = head.right;
        this.size--;
        return true;
      } else {
        return false;
      }
    };
    module2.exports = BinTree;
  }
});

// node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/index.js
var require_bintrees = __commonJS({
  "node_modules/.pnpm/bintrees@1.0.2/node_modules/bintrees/index.js"(exports2, module2) {
    module2.exports = {
      RBTree: require_rbtree(),
      BinTree: require_bintree()
    };
  }
});

// node_modules/.pnpm/tdigest@0.1.2/node_modules/tdigest/tdigest.js
var require_tdigest = __commonJS({
  "node_modules/.pnpm/tdigest@0.1.2/node_modules/tdigest/tdigest.js"(exports2, module2) {
    var RBTree = require_bintrees().RBTree;
    function TDigest(delta, K, CX) {
      this.discrete = delta === false;
      this.delta = delta || 0.01;
      this.K = K === void 0 ? 25 : K;
      this.CX = CX === void 0 ? 1.1 : CX;
      this.centroids = new RBTree(compare_centroid_means);
      this.nreset = 0;
      this.reset();
    }
    TDigest.prototype.reset = function() {
      this.centroids.clear();
      this.n = 0;
      this.nreset += 1;
      this.last_cumulate = 0;
    };
    TDigest.prototype.size = function() {
      return this.centroids.size;
    };
    TDigest.prototype.toArray = function(everything) {
      var result = [];
      if (everything) {
        this._cumulate(true);
        this.centroids.each(function(c) {
          result.push(c);
        });
      } else {
        this.centroids.each(function(c) {
          result.push({ mean: c.mean, n: c.n });
        });
      }
      return result;
    };
    TDigest.prototype.summary = function() {
      var approx = this.discrete ? "exact " : "approximating ";
      var s = [
        approx + this.n + " samples using " + this.size() + " centroids",
        "min = " + this.percentile(0),
        "Q1  = " + this.percentile(0.25),
        "Q2  = " + this.percentile(0.5),
        "Q3  = " + this.percentile(0.75),
        "max = " + this.percentile(1)
      ];
      return s.join("\n");
    };
    function compare_centroid_means(a, b) {
      return a.mean > b.mean ? 1 : a.mean < b.mean ? -1 : 0;
    }
    function compare_centroid_mean_cumns(a, b) {
      return a.mean_cumn - b.mean_cumn;
    }
    TDigest.prototype.push = function(x, n) {
      n = n || 1;
      x = Array.isArray(x) ? x : [x];
      for (var i = 0; i < x.length; i++) {
        this._digest(x[i], n);
      }
    };
    TDigest.prototype.push_centroid = function(c) {
      c = Array.isArray(c) ? c : [c];
      for (var i = 0; i < c.length; i++) {
        this._digest(c[i].mean, c[i].n);
      }
    };
    TDigest.prototype._cumulate = function(exact) {
      if (this.n === this.last_cumulate || !exact && this.CX && this.CX > this.n / this.last_cumulate) {
        return;
      }
      var cumn = 0;
      this.centroids.each(function(c) {
        c.mean_cumn = cumn + c.n / 2;
        cumn = c.cumn = cumn + c.n;
      });
      this.n = this.last_cumulate = cumn;
    };
    TDigest.prototype.find_nearest = function(x) {
      if (this.size() === 0) {
        return null;
      }
      var iter = this.centroids.lowerBound({ mean: x });
      var c = iter.data() === null ? iter.prev() : iter.data();
      if (c.mean === x || this.discrete) {
        return c;
      }
      var prev = iter.prev();
      if (prev && Math.abs(prev.mean - x) < Math.abs(c.mean - x)) {
        return prev;
      } else {
        return c;
      }
    };
    TDigest.prototype._new_centroid = function(x, n, cumn) {
      var c = { mean: x, n, cumn };
      this.centroids.insert(c);
      this.n += n;
      return c;
    };
    TDigest.prototype._addweight = function(nearest, x, n) {
      if (x !== nearest.mean) {
        nearest.mean += n * (x - nearest.mean) / (nearest.n + n);
      }
      nearest.cumn += n;
      nearest.mean_cumn += n / 2;
      nearest.n += n;
      this.n += n;
    };
    TDigest.prototype._digest = function(x, n) {
      var min = this.centroids.min();
      var max = this.centroids.max();
      var nearest = this.find_nearest(x);
      if (nearest && nearest.mean === x) {
        this._addweight(nearest, x, n);
      } else if (nearest === min) {
        this._new_centroid(x, n, 0);
      } else if (nearest === max) {
        this._new_centroid(x, n, this.n);
      } else if (this.discrete) {
        this._new_centroid(x, n, nearest.cumn);
      } else {
        var p = nearest.mean_cumn / this.n;
        var max_n = Math.floor(4 * this.n * this.delta * p * (1 - p));
        if (max_n - nearest.n >= n) {
          this._addweight(nearest, x, n);
        } else {
          this._new_centroid(x, n, nearest.cumn);
        }
      }
      this._cumulate(false);
      if (!this.discrete && this.K && this.size() > this.K / this.delta) {
        this.compress();
      }
    };
    TDigest.prototype.bound_mean = function(x) {
      var iter = this.centroids.upperBound({ mean: x });
      var lower = iter.prev();
      var upper = lower.mean === x ? lower : iter.next();
      return [lower, upper];
    };
    TDigest.prototype.p_rank = function(x_or_xlist) {
      var xs = Array.isArray(x_or_xlist) ? x_or_xlist : [x_or_xlist];
      var ps = xs.map(this._p_rank, this);
      return Array.isArray(x_or_xlist) ? ps : ps[0];
    };
    TDigest.prototype._p_rank = function(x) {
      if (this.size() === 0) {
        return void 0;
      } else if (x < this.centroids.min().mean) {
        return 0;
      } else if (x > this.centroids.max().mean) {
        return 1;
      }
      this._cumulate(true);
      var bound = this.bound_mean(x);
      var lower = bound[0], upper = bound[1];
      if (this.discrete) {
        return lower.cumn / this.n;
      } else {
        var cumn = lower.mean_cumn;
        if (lower !== upper) {
          cumn += (x - lower.mean) * (upper.mean_cumn - lower.mean_cumn) / (upper.mean - lower.mean);
        }
        return cumn / this.n;
      }
    };
    TDigest.prototype.bound_mean_cumn = function(cumn) {
      this.centroids._comparator = compare_centroid_mean_cumns;
      var iter = this.centroids.upperBound({ mean_cumn: cumn });
      this.centroids._comparator = compare_centroid_means;
      var lower = iter.prev();
      var upper = lower && lower.mean_cumn === cumn ? lower : iter.next();
      return [lower, upper];
    };
    TDigest.prototype.percentile = function(p_or_plist) {
      var ps = Array.isArray(p_or_plist) ? p_or_plist : [p_or_plist];
      var qs = ps.map(this._percentile, this);
      return Array.isArray(p_or_plist) ? qs : qs[0];
    };
    TDigest.prototype._percentile = function(p) {
      if (this.size() === 0) {
        return void 0;
      }
      this._cumulate(true);
      var h = this.n * p;
      var bound = this.bound_mean_cumn(h);
      var lower = bound[0], upper = bound[1];
      if (upper === lower || lower === null || upper === null) {
        return (lower || upper).mean;
      } else if (!this.discrete) {
        return lower.mean + (h - lower.mean_cumn) * (upper.mean - lower.mean) / (upper.mean_cumn - lower.mean_cumn);
      } else if (h <= lower.cumn) {
        return lower.mean;
      } else {
        return upper.mean;
      }
    };
    function pop_random(choices) {
      var idx = Math.floor(Math.random() * choices.length);
      return choices.splice(idx, 1)[0];
    }
    TDigest.prototype.compress = function() {
      if (this.compressing) {
        return;
      }
      var points = this.toArray();
      this.reset();
      this.compressing = true;
      while (points.length > 0) {
        this.push_centroid(pop_random(points));
      }
      this._cumulate(true);
      this.compressing = false;
    };
    function Digest(config2) {
      this.config = config2 || {};
      this.mode = this.config.mode || "auto";
      TDigest.call(this, this.mode === "cont" ? config2.delta : false);
      this.digest_ratio = this.config.ratio || 0.9;
      this.digest_thresh = this.config.thresh || 1e3;
      this.n_unique = 0;
    }
    Digest.prototype = Object.create(TDigest.prototype);
    Digest.prototype.constructor = Digest;
    Digest.prototype.push = function(x_or_xlist) {
      TDigest.prototype.push.call(this, x_or_xlist);
      this.check_continuous();
    };
    Digest.prototype._new_centroid = function(x, n, cumn) {
      this.n_unique += 1;
      TDigest.prototype._new_centroid.call(this, x, n, cumn);
    };
    Digest.prototype._addweight = function(nearest, x, n) {
      if (nearest.n === 1) {
        this.n_unique -= 1;
      }
      TDigest.prototype._addweight.call(this, nearest, x, n);
    };
    Digest.prototype.check_continuous = function() {
      if (this.mode !== "auto" || this.size() < this.digest_thresh) {
        return false;
      }
      if (this.n_unique / this.size() > this.digest_ratio) {
        this.mode = "cont";
        this.discrete = false;
        this.delta = this.config.delta || 0.01;
        this.compress();
        return true;
      }
      return false;
    };
    module2.exports = {
      "TDigest": TDigest,
      "Digest": Digest
    };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/timeWindowQuantiles.js
var require_timeWindowQuantiles = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/timeWindowQuantiles.js"(exports2, module2) {
    "use strict";
    var { TDigest } = require_tdigest();
    var TimeWindowQuantiles = class {
      constructor(maxAgeSeconds, ageBuckets) {
        this.maxAgeSeconds = maxAgeSeconds || 0;
        this.ageBuckets = ageBuckets || 0;
        this.shouldRotate = maxAgeSeconds && ageBuckets;
        this.ringBuffer = Array(ageBuckets).fill(new TDigest());
        this.currentBuffer = 0;
        this.lastRotateTimestampMillis = Date.now();
        this.durationBetweenRotatesMillis = maxAgeSeconds * 1e3 / ageBuckets || Infinity;
      }
      size() {
        const bucket = rotate.call(this);
        return bucket.size();
      }
      percentile(quantile) {
        const bucket = rotate.call(this);
        return bucket.percentile(quantile);
      }
      push(value) {
        rotate.call(this);
        this.ringBuffer.forEach((bucket) => {
          bucket.push(value);
        });
      }
      reset() {
        this.ringBuffer.forEach((bucket) => {
          bucket.reset();
        });
      }
      compress() {
        this.ringBuffer.forEach((bucket) => {
          bucket.compress();
        });
      }
    };
    function rotate() {
      let timeSinceLastRotateMillis = Date.now() - this.lastRotateTimestampMillis;
      while (timeSinceLastRotateMillis > this.durationBetweenRotatesMillis && this.shouldRotate) {
        this.ringBuffer[this.currentBuffer] = new TDigest();
        if (++this.currentBuffer >= this.ringBuffer.length) {
          this.currentBuffer = 0;
        }
        timeSinceLastRotateMillis -= this.durationBetweenRotatesMillis;
        this.lastRotateTimestampMillis += this.durationBetweenRotatesMillis;
      }
      return this.ringBuffer[this.currentBuffer];
    }
    module2.exports = TimeWindowQuantiles;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/summary.js
var require_summary = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/summary.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var { getLabels, hashObject, removeLabels } = require_util();
    var { validateLabel } = require_validation();
    var { Metric } = require_metric();
    var timeWindowQuantiles = require_timeWindowQuantiles();
    var DEFAULT_COMPRESS_COUNT = 1e3;
    var Summary = class extends Metric {
      constructor(config2) {
        super(config2, {
          percentiles: [0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999],
          compressCount: DEFAULT_COMPRESS_COUNT,
          hashMap: {}
        });
        this.type = "summary";
        for (const label of this.labelNames) {
          if (label === "quantile")
            throw new Error("quantile is a reserved label keyword");
        }
        if (this.labelNames.length === 0) {
          this.hashMap = {
            [hashObject({})]: {
              labels: {},
              td: new timeWindowQuantiles(this.maxAgeSeconds, this.ageBuckets),
              count: 0,
              sum: 0
            }
          };
        }
      }
      /**
       * Observe a value
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @param {Number} value - Value to observe
       * @returns {void}
       */
      observe(labels, value) {
        observe.call(this, labels === 0 ? 0 : labels || {})(value);
      }
      async get() {
        if (this.collect) {
          const v = this.collect();
          if (v instanceof Promise) await v;
        }
        const hashKeys = Object.keys(this.hashMap);
        const values = [];
        hashKeys.forEach((hashKey) => {
          const s = this.hashMap[hashKey];
          if (s) {
            if (this.pruneAgedBuckets && s.td.size() === 0) {
              delete this.hashMap[hashKey];
            } else {
              extractSummariesForExport(s, this.percentiles).forEach((v) => {
                values.push(v);
              });
              values.push(getSumForExport(s, this));
              values.push(getCountForExport(s, this));
            }
          }
        });
        return {
          name: this.name,
          help: this.help,
          type: this.type,
          values,
          aggregator: this.aggregator
        };
      }
      reset() {
        const data = Object.values(this.hashMap);
        data.forEach((s) => {
          s.td.reset();
          s.count = 0;
          s.sum = 0;
        });
      }
      /**
       * Start a timer that could be used to logging durations
       * @param {object} labels - Object with labels where key is the label key and value is label value. Can only be one level deep
       * @returns {function} - Function to invoke when you want to stop the timer and observe the duration in seconds
       * @example
       * var end = summary.startTimer();
       * makeExpensiveXHRRequest(function(err, res) {
       *	end(); //Observe the duration of expensiveXHRRequest
       * });
       */
      startTimer(labels) {
        return startTimer.call(this, labels)();
      }
      labels(...args) {
        const labels = getLabels(this.labelNames, args);
        validateLabel(this.labelNames, labels);
        return {
          observe: observe.call(this, labels),
          startTimer: startTimer.call(this, labels)
        };
      }
      remove(...args) {
        const labels = getLabels(this.labelNames, args);
        validateLabel(this.labelNames, labels);
        removeLabels.call(this, this.hashMap, labels, this.sortedLabelNames);
      }
    };
    function extractSummariesForExport(summaryOfLabels, percentiles) {
      summaryOfLabels.td.compress();
      return percentiles.map((percentile) => {
        const percentileValue = summaryOfLabels.td.percentile(percentile);
        return {
          labels: Object.assign({ quantile: percentile }, summaryOfLabels.labels),
          value: percentileValue ? percentileValue : 0
        };
      });
    }
    function getCountForExport(value, summary) {
      return {
        metricName: `${summary.name}_count`,
        labels: value.labels,
        value: value.count
      };
    }
    function getSumForExport(value, summary) {
      return {
        metricName: `${summary.name}_sum`,
        labels: value.labels,
        value: value.sum
      };
    }
    function startTimer(startLabels) {
      return () => {
        const start = process.hrtime();
        return (endLabels) => {
          const delta = process.hrtime(start);
          const value = delta[0] + delta[1] / 1e9;
          this.observe(Object.assign({}, startLabels, endLabels), value);
          return value;
        };
      };
    }
    function observe(labels) {
      return (value) => {
        const labelValuePair = convertLabelsAndValues(labels, value);
        validateLabel(this.labelNames, labels);
        if (!Number.isFinite(labelValuePair.value)) {
          throw new TypeError(
            `Value is not a valid number: ${util.format(labelValuePair.value)}`
          );
        }
        const hash = hashObject(labelValuePair.labels, this.sortedLabelNames);
        let summaryOfLabel = this.hashMap[hash];
        if (!summaryOfLabel) {
          summaryOfLabel = {
            labels: labelValuePair.labels,
            td: new timeWindowQuantiles(this.maxAgeSeconds, this.ageBuckets),
            count: 0,
            sum: 0
          };
        }
        summaryOfLabel.td.push(labelValuePair.value);
        summaryOfLabel.count++;
        if (summaryOfLabel.count % this.compressCount === 0) {
          summaryOfLabel.td.compress();
        }
        summaryOfLabel.sum += labelValuePair.value;
        this.hashMap[hash] = summaryOfLabel;
      };
    }
    function convertLabelsAndValues(labels, value) {
      if (value === void 0) {
        return {
          value: labels,
          labels: {}
        };
      }
      return {
        labels,
        value
      };
    }
    module2.exports = Summary;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/pushgateway.js
var require_pushgateway = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/pushgateway.js"(exports2, module2) {
    "use strict";
    var url = require("url");
    var http = require("http");
    var https = require("https");
    var { gzipSync } = require("zlib");
    var { globalRegistry } = require_registry();
    var Pushgateway = class {
      constructor(gatewayUrl, options, registry) {
        if (!registry) {
          registry = globalRegistry;
        }
        this.registry = registry;
        this.gatewayUrl = gatewayUrl;
        const { requireJobName, ...requestOptions } = {
          requireJobName: true,
          ...options
        };
        this.requireJobName = requireJobName;
        this.requestOptions = requestOptions;
      }
      pushAdd(params = {}) {
        if (this.requireJobName && !params.jobName) {
          throw new Error("Missing jobName parameter");
        }
        return useGateway.call(this, "POST", params.jobName, params.groupings);
      }
      push(params = {}) {
        if (this.requireJobName && !params.jobName) {
          throw new Error("Missing jobName parameter");
        }
        return useGateway.call(this, "PUT", params.jobName, params.groupings);
      }
      delete(params = {}) {
        if (this.requireJobName && !params.jobName) {
          throw new Error("Missing jobName parameter");
        }
        return useGateway.call(this, "DELETE", params.jobName, params.groupings);
      }
    };
    async function useGateway(method, job, groupings) {
      const gatewayUrlParsed = url.parse(this.gatewayUrl);
      const gatewayUrlPath = gatewayUrlParsed.pathname && gatewayUrlParsed.pathname !== "/" ? gatewayUrlParsed.pathname : "";
      const jobPath = job ? `/job/${encodeURIComponent(job)}${generateGroupings(groupings)}` : "";
      const path = `${gatewayUrlPath}/metrics${jobPath}`;
      const target = url.resolve(this.gatewayUrl, path);
      const requestParams = url.parse(target);
      const httpModule = isHttps(requestParams.href) ? https : http;
      const options = Object.assign(requestParams, this.requestOptions, {
        method
      });
      return new Promise((resolve, reject) => {
        if (method === "DELETE" && options.headers) {
          delete options.headers["Content-Encoding"];
        }
        const req = httpModule.request(options, (resp) => {
          let body = "";
          resp.setEncoding("utf8");
          resp.on("data", (chunk) => {
            body += chunk;
          });
          resp.on("end", () => {
            if (resp.statusCode >= 400) {
              reject(
                new Error(`push failed with status ${resp.statusCode}, ${body}`)
              );
            } else {
              resolve({ resp, body });
            }
          });
        });
        req.on("error", (err) => {
          reject(err);
        });
        req.on("timeout", () => {
          req.destroy(new Error("Pushgateway request timed out"));
        });
        if (method !== "DELETE") {
          this.registry.metrics().then((metrics2) => {
            if (options.headers && options.headers["Content-Encoding"] === "gzip") {
              metrics2 = gzipSync(metrics2);
            }
            req.write(metrics2);
            req.end();
          }).catch((err) => {
            reject(err);
          });
        } else {
          req.end();
        }
      });
    }
    function generateGroupings(groupings) {
      if (!groupings) {
        return "";
      }
      return Object.keys(groupings).map(
        (key) => `/${encodeURIComponent(key)}/${encodeURIComponent(groupings[key])}`
      ).join("");
    }
    function isHttps(href) {
      return href.search(/^https/) !== -1;
    }
    module2.exports = Pushgateway;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/bucketGenerators.js
var require_bucketGenerators = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/bucketGenerators.js"(exports2) {
    "use strict";
    exports2.linearBuckets = (start, width, count) => {
      if (count < 1) {
        throw new Error("Linear buckets needs a positive count");
      }
      const buckets = new Array(count);
      for (let i = 0; i < count; i++) {
        buckets[i] = start + i * width;
      }
      return buckets;
    };
    exports2.exponentialBuckets = (start, factor, count) => {
      if (start <= 0) {
        throw new Error("Exponential buckets needs a positive start");
      }
      if (count < 1) {
        throw new Error("Exponential buckets needs a positive count");
      }
      if (factor <= 1) {
        throw new Error("Exponential buckets needs a factor greater than 1");
      }
      const buckets = new Array(count);
      for (let i = 0; i < count; i++) {
        buckets[i] = start;
        start *= factor;
      }
      return buckets;
    };
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/node/globalThis.js
var _globalThis;
var init_globalThis = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/node/globalThis.js"() {
    _globalThis = typeof globalThis === "object" ? globalThis : global;
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/node/index.js
var init_node = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/node/index.js"() {
    init_globalThis();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/index.js
var init_platform = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/platform/index.js"() {
    init_node();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/version.js
var VERSION;
var init_version = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/version.js"() {
    VERSION = "1.9.0";
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/semver.js
function _makeCompatibilityCheck(ownVersion) {
  var acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  var rejectedVersions = /* @__PURE__ */ new Set();
  var myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return function() {
      return false;
    };
  }
  var ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v) {
    rejectedVersions.add(v);
    return false;
  }
  function _accept(v) {
    acceptedVersions.add(v);
    return true;
  }
  return function isCompatible2(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    var globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    var globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
var re, isCompatible;
var init_semver = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/semver.js"() {
    init_version();
    re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
    isCompatible = _makeCompatibilityCheck(VERSION);
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js
function registerGlobal(type, instance, diag3, allowOverride) {
  var _a;
  if (allowOverride === void 0) {
    allowOverride = false;
  }
  var api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
    version: VERSION
  };
  if (!allowOverride && api[type]) {
    var err = new Error("@opentelemetry/api: Attempted duplicate registration of API: " + type);
    diag3.error(err.stack || err.message);
    return false;
  }
  if (api.version !== VERSION) {
    var err = new Error("@opentelemetry/api: Registration of version v" + api.version + " for " + type + " does not match previously registered API v" + VERSION);
    diag3.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag3.debug("@opentelemetry/api: Registered a global for " + type + " v" + VERSION + ".");
  return true;
}
function getGlobal(type) {
  var _a, _b;
  var globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
  if (!globalVersion || !isCompatible(globalVersion)) {
    return;
  }
  return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag3) {
  diag3.debug("@opentelemetry/api: Unregistering a global for " + type + " v" + VERSION + ".");
  var api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}
var major, GLOBAL_OPENTELEMETRY_API_KEY, _global;
var init_global_utils = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js"() {
    init_platform();
    init_version();
    init_semver();
    major = VERSION.split(".")[0];
    GLOBAL_OPENTELEMETRY_API_KEY = /* @__PURE__ */ Symbol.for("opentelemetry.js.api." + major);
    _global = _globalThis;
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js
function logProxy(funcName, namespace, args) {
  var logger3 = getGlobal("diag");
  if (!logger3) {
    return;
  }
  args.unshift(namespace);
  return logger3[funcName].apply(logger3, __spreadArray([], __read(args), false));
}
var __read, __spreadArray, DiagComponentLogger;
var init_ComponentLogger = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js"() {
    init_global_utils();
    __read = function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    __spreadArray = function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    DiagComponentLogger = /** @class */
    (function() {
      function DiagComponentLogger2(props) {
        this._namespace = props.namespace || "DiagComponentLogger";
      }
      DiagComponentLogger2.prototype.debug = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return logProxy("debug", this._namespace, args);
      };
      DiagComponentLogger2.prototype.error = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return logProxy("error", this._namespace, args);
      };
      DiagComponentLogger2.prototype.info = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return logProxy("info", this._namespace, args);
      };
      DiagComponentLogger2.prototype.warn = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return logProxy("warn", this._namespace, args);
      };
      DiagComponentLogger2.prototype.verbose = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return logProxy("verbose", this._namespace, args);
      };
      return DiagComponentLogger2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js
var DiagLogLevel;
var init_types = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js"() {
    (function(DiagLogLevel2) {
      DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
      DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
      DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
      DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
      DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
      DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
      DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
    })(DiagLogLevel || (DiagLogLevel = {}));
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js
function createLogLevelDiagLogger(maxLevel, logger3) {
  if (maxLevel < DiagLogLevel.NONE) {
    maxLevel = DiagLogLevel.NONE;
  } else if (maxLevel > DiagLogLevel.ALL) {
    maxLevel = DiagLogLevel.ALL;
  }
  logger3 = logger3 || {};
  function _filterFunc(funcName, theLevel) {
    var theFunc = logger3[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger3);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", DiagLogLevel.ERROR),
    warn: _filterFunc("warn", DiagLogLevel.WARN),
    info: _filterFunc("info", DiagLogLevel.INFO),
    debug: _filterFunc("debug", DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
  };
}
var init_logLevelLogger = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js"() {
    init_types();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/diag.js
var __read2, __spreadArray2, API_NAME, DiagAPI;
var init_diag = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/diag.js"() {
    init_ComponentLogger();
    init_logLevelLogger();
    init_types();
    init_global_utils();
    __read2 = function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    __spreadArray2 = function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    API_NAME = "diag";
    DiagAPI = /** @class */
    (function() {
      function DiagAPI2() {
        function _logProxy(funcName) {
          return function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            var logger3 = getGlobal("diag");
            if (!logger3)
              return;
            return logger3[funcName].apply(logger3, __spreadArray2([], __read2(args), false));
          };
        }
        var self = this;
        var setLogger = function(logger3, optionsOrLogLevel) {
          var _a, _b, _c;
          if (optionsOrLogLevel === void 0) {
            optionsOrLogLevel = { logLevel: DiagLogLevel.INFO };
          }
          if (logger3 === self) {
            var err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
            self.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
            return false;
          }
          if (typeof optionsOrLogLevel === "number") {
            optionsOrLogLevel = {
              logLevel: optionsOrLogLevel
            };
          }
          var oldLogger = getGlobal("diag");
          var newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger3);
          if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
            var stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
            oldLogger.warn("Current logger will be overwritten from " + stack);
            newLogger.warn("Current logger will overwrite one already registered from " + stack);
          }
          return registerGlobal("diag", newLogger, self, true);
        };
        self.setLogger = setLogger;
        self.disable = function() {
          unregisterGlobal(API_NAME, self);
        };
        self.createComponentLogger = function(options) {
          return new DiagComponentLogger(options);
        };
        self.verbose = _logProxy("verbose");
        self.debug = _logProxy("debug");
        self.info = _logProxy("info");
        self.warn = _logProxy("warn");
        self.error = _logProxy("error");
      }
      DiagAPI2.instance = function() {
        if (!this._instance) {
          this._instance = new DiagAPI2();
        }
        return this._instance;
      };
      return DiagAPI2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/internal/baggage-impl.js
var __read3, __values, BaggageImpl;
var init_baggage_impl = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/internal/baggage-impl.js"() {
    __read3 = function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    __values = function(o) {
      var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === "number") return {
        next: function() {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
      throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    };
    BaggageImpl = /** @class */
    (function() {
      function BaggageImpl2(entries) {
        this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
      }
      BaggageImpl2.prototype.getEntry = function(key) {
        var entry = this._entries.get(key);
        if (!entry) {
          return void 0;
        }
        return Object.assign({}, entry);
      };
      BaggageImpl2.prototype.getAllEntries = function() {
        return Array.from(this._entries.entries()).map(function(_a) {
          var _b = __read3(_a, 2), k = _b[0], v = _b[1];
          return [k, v];
        });
      };
      BaggageImpl2.prototype.setEntry = function(key, entry) {
        var newBaggage = new BaggageImpl2(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
      };
      BaggageImpl2.prototype.removeEntry = function(key) {
        var newBaggage = new BaggageImpl2(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
      };
      BaggageImpl2.prototype.removeEntries = function() {
        var e_1, _a;
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          keys[_i] = arguments[_i];
        }
        var newBaggage = new BaggageImpl2(this._entries);
        try {
          for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
            var key = keys_1_1.value;
            newBaggage._entries.delete(key);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        return newBaggage;
      };
      BaggageImpl2.prototype.clear = function() {
        return new BaggageImpl2();
      };
      return BaggageImpl2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/internal/symbol.js
var baggageEntryMetadataSymbol;
var init_symbol = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/internal/symbol.js"() {
    baggageEntryMetadataSymbol = /* @__PURE__ */ Symbol("BaggageEntryMetadata");
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/utils.js
function createBaggage(entries) {
  if (entries === void 0) {
    entries = {};
  }
  return new BaggageImpl(new Map(Object.entries(entries)));
}
function baggageEntryMetadataFromString(str) {
  if (typeof str !== "string") {
    diag.error("Cannot create baggage metadata from unknown type: " + typeof str);
    str = "";
  }
  return {
    __TYPE__: baggageEntryMetadataSymbol,
    toString: function() {
      return str;
    }
  };
}
var diag;
var init_utils = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/utils.js"() {
    init_diag();
    init_baggage_impl();
    init_symbol();
    diag = DiagAPI.instance();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/context.js
function createContextKey(description) {
  return Symbol.for(description);
}
var BaseContext, ROOT_CONTEXT;
var init_context = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/context.js"() {
    BaseContext = /** @class */
    /* @__PURE__ */ (function() {
      function BaseContext2(parentContext) {
        var self = this;
        self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
        self.getValue = function(key) {
          return self._currentContext.get(key);
        };
        self.setValue = function(key, value) {
          var context2 = new BaseContext2(self._currentContext);
          context2._currentContext.set(key, value);
          return context2;
        };
        self.deleteValue = function(key) {
          var context2 = new BaseContext2(self._currentContext);
          context2._currentContext.delete(key);
          return context2;
        };
      }
      return BaseContext2;
    })();
    ROOT_CONTEXT = new BaseContext();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/consoleLogger.js
var consoleMap, DiagConsoleLogger;
var init_consoleLogger = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/consoleLogger.js"() {
    consoleMap = [
      { n: "error", c: "error" },
      { n: "warn", c: "warn" },
      { n: "info", c: "info" },
      { n: "debug", c: "debug" },
      { n: "verbose", c: "trace" }
    ];
    DiagConsoleLogger = /** @class */
    /* @__PURE__ */ (function() {
      function DiagConsoleLogger2() {
        function _consoleFunc(funcName) {
          return function() {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            if (console) {
              var theFunc = console[funcName];
              if (typeof theFunc !== "function") {
                theFunc = console.log;
              }
              if (typeof theFunc === "function") {
                return theFunc.apply(console, args);
              }
            }
          };
        }
        for (var i = 0; i < consoleMap.length; i++) {
          this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
        }
      }
      return DiagConsoleLogger2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js
function createNoopMeter() {
  return NOOP_METER;
}
var __extends, NoopMeter, NoopMetric, NoopCounterMetric, NoopUpDownCounterMetric, NoopGaugeMetric, NoopHistogramMetric, NoopObservableMetric, NoopObservableCounterMetric, NoopObservableGaugeMetric, NoopObservableUpDownCounterMetric, NOOP_METER, NOOP_COUNTER_METRIC, NOOP_GAUGE_METRIC, NOOP_HISTOGRAM_METRIC, NOOP_UP_DOWN_COUNTER_METRIC, NOOP_OBSERVABLE_COUNTER_METRIC, NOOP_OBSERVABLE_GAUGE_METRIC, NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
var init_NoopMeter = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js"() {
    __extends = /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    NoopMeter = /** @class */
    (function() {
      function NoopMeter2() {
      }
      NoopMeter2.prototype.createGauge = function(_name, _options) {
        return NOOP_GAUGE_METRIC;
      };
      NoopMeter2.prototype.createHistogram = function(_name, _options) {
        return NOOP_HISTOGRAM_METRIC;
      };
      NoopMeter2.prototype.createCounter = function(_name, _options) {
        return NOOP_COUNTER_METRIC;
      };
      NoopMeter2.prototype.createUpDownCounter = function(_name, _options) {
        return NOOP_UP_DOWN_COUNTER_METRIC;
      };
      NoopMeter2.prototype.createObservableGauge = function(_name, _options) {
        return NOOP_OBSERVABLE_GAUGE_METRIC;
      };
      NoopMeter2.prototype.createObservableCounter = function(_name, _options) {
        return NOOP_OBSERVABLE_COUNTER_METRIC;
      };
      NoopMeter2.prototype.createObservableUpDownCounter = function(_name, _options) {
        return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
      };
      NoopMeter2.prototype.addBatchObservableCallback = function(_callback, _observables) {
      };
      NoopMeter2.prototype.removeBatchObservableCallback = function(_callback) {
      };
      return NoopMeter2;
    })();
    NoopMetric = /** @class */
    /* @__PURE__ */ (function() {
      function NoopMetric2() {
      }
      return NoopMetric2;
    })();
    NoopCounterMetric = /** @class */
    (function(_super) {
      __extends(NoopCounterMetric2, _super);
      function NoopCounterMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      NoopCounterMetric2.prototype.add = function(_value, _attributes) {
      };
      return NoopCounterMetric2;
    })(NoopMetric);
    NoopUpDownCounterMetric = /** @class */
    (function(_super) {
      __extends(NoopUpDownCounterMetric2, _super);
      function NoopUpDownCounterMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      NoopUpDownCounterMetric2.prototype.add = function(_value, _attributes) {
      };
      return NoopUpDownCounterMetric2;
    })(NoopMetric);
    NoopGaugeMetric = /** @class */
    (function(_super) {
      __extends(NoopGaugeMetric2, _super);
      function NoopGaugeMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      NoopGaugeMetric2.prototype.record = function(_value, _attributes) {
      };
      return NoopGaugeMetric2;
    })(NoopMetric);
    NoopHistogramMetric = /** @class */
    (function(_super) {
      __extends(NoopHistogramMetric2, _super);
      function NoopHistogramMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      NoopHistogramMetric2.prototype.record = function(_value, _attributes) {
      };
      return NoopHistogramMetric2;
    })(NoopMetric);
    NoopObservableMetric = /** @class */
    (function() {
      function NoopObservableMetric2() {
      }
      NoopObservableMetric2.prototype.addCallback = function(_callback) {
      };
      NoopObservableMetric2.prototype.removeCallback = function(_callback) {
      };
      return NoopObservableMetric2;
    })();
    NoopObservableCounterMetric = /** @class */
    (function(_super) {
      __extends(NoopObservableCounterMetric2, _super);
      function NoopObservableCounterMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return NoopObservableCounterMetric2;
    })(NoopObservableMetric);
    NoopObservableGaugeMetric = /** @class */
    (function(_super) {
      __extends(NoopObservableGaugeMetric2, _super);
      function NoopObservableGaugeMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return NoopObservableGaugeMetric2;
    })(NoopObservableMetric);
    NoopObservableUpDownCounterMetric = /** @class */
    (function(_super) {
      __extends(NoopObservableUpDownCounterMetric2, _super);
      function NoopObservableUpDownCounterMetric2() {
        return _super !== null && _super.apply(this, arguments) || this;
      }
      return NoopObservableUpDownCounterMetric2;
    })(NoopObservableMetric);
    NOOP_METER = new NoopMeter();
    NOOP_COUNTER_METRIC = new NoopCounterMetric();
    NOOP_GAUGE_METRIC = new NoopGaugeMetric();
    NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
    NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
    NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
    NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
    NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/Metric.js
var ValueType;
var init_Metric = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/Metric.js"() {
    (function(ValueType2) {
      ValueType2[ValueType2["INT"] = 0] = "INT";
      ValueType2[ValueType2["DOUBLE"] = 1] = "DOUBLE";
    })(ValueType || (ValueType = {}));
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js
var defaultTextMapGetter, defaultTextMapSetter;
var init_TextMapPropagator = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js"() {
    defaultTextMapGetter = {
      get: function(carrier, key) {
        if (carrier == null) {
          return void 0;
        }
        return carrier[key];
      },
      keys: function(carrier) {
        if (carrier == null) {
          return [];
        }
        return Object.keys(carrier);
      }
    };
    defaultTextMapSetter = {
      set: function(carrier, key, value) {
        if (carrier == null) {
          return;
        }
        carrier[key] = value;
      }
    };
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js
var __read4, __spreadArray3, NoopContextManager;
var init_NoopContextManager = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js"() {
    init_context();
    __read4 = function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    __spreadArray3 = function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    NoopContextManager = /** @class */
    (function() {
      function NoopContextManager2() {
      }
      NoopContextManager2.prototype.active = function() {
        return ROOT_CONTEXT;
      };
      NoopContextManager2.prototype.with = function(_context, fn, thisArg) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
          args[_i - 3] = arguments[_i];
        }
        return fn.call.apply(fn, __spreadArray3([thisArg], __read4(args), false));
      };
      NoopContextManager2.prototype.bind = function(_context, target) {
        return target;
      };
      NoopContextManager2.prototype.enable = function() {
        return this;
      };
      NoopContextManager2.prototype.disable = function() {
        return this;
      };
      return NoopContextManager2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/context.js
var __read5, __spreadArray4, API_NAME2, NOOP_CONTEXT_MANAGER, ContextAPI;
var init_context2 = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/context.js"() {
    init_NoopContextManager();
    init_global_utils();
    init_diag();
    __read5 = function(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = { error };
      } finally {
        try {
          if (r && !r.done && (m = i["return"])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    };
    __spreadArray4 = function(to, from, pack) {
      if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
      return to.concat(ar || Array.prototype.slice.call(from));
    };
    API_NAME2 = "context";
    NOOP_CONTEXT_MANAGER = new NoopContextManager();
    ContextAPI = /** @class */
    (function() {
      function ContextAPI2() {
      }
      ContextAPI2.getInstance = function() {
        if (!this._instance) {
          this._instance = new ContextAPI2();
        }
        return this._instance;
      };
      ContextAPI2.prototype.setGlobalContextManager = function(contextManager) {
        return registerGlobal(API_NAME2, contextManager, DiagAPI.instance());
      };
      ContextAPI2.prototype.active = function() {
        return this._getContextManager().active();
      };
      ContextAPI2.prototype.with = function(context2, fn, thisArg) {
        var _a;
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
          args[_i - 3] = arguments[_i];
        }
        return (_a = this._getContextManager()).with.apply(_a, __spreadArray4([context2, fn, thisArg], __read5(args), false));
      };
      ContextAPI2.prototype.bind = function(context2, target) {
        return this._getContextManager().bind(context2, target);
      };
      ContextAPI2.prototype._getContextManager = function() {
        return getGlobal(API_NAME2) || NOOP_CONTEXT_MANAGER;
      };
      ContextAPI2.prototype.disable = function() {
        this._getContextManager().disable();
        unregisterGlobal(API_NAME2, DiagAPI.instance());
      };
      return ContextAPI2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js
var TraceFlags;
var init_trace_flags = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js"() {
    (function(TraceFlags2) {
      TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
      TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
    })(TraceFlags || (TraceFlags = {}));
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js
var INVALID_SPANID, INVALID_TRACEID, INVALID_SPAN_CONTEXT;
var init_invalid_span_constants = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js"() {
    init_trace_flags();
    INVALID_SPANID = "0000000000000000";
    INVALID_TRACEID = "00000000000000000000000000000000";
    INVALID_SPAN_CONTEXT = {
      traceId: INVALID_TRACEID,
      spanId: INVALID_SPANID,
      traceFlags: TraceFlags.NONE
    };
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js
var NonRecordingSpan;
var init_NonRecordingSpan = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js"() {
    init_invalid_span_constants();
    NonRecordingSpan = /** @class */
    (function() {
      function NonRecordingSpan2(_spanContext) {
        if (_spanContext === void 0) {
          _spanContext = INVALID_SPAN_CONTEXT;
        }
        this._spanContext = _spanContext;
      }
      NonRecordingSpan2.prototype.spanContext = function() {
        return this._spanContext;
      };
      NonRecordingSpan2.prototype.setAttribute = function(_key, _value) {
        return this;
      };
      NonRecordingSpan2.prototype.setAttributes = function(_attributes) {
        return this;
      };
      NonRecordingSpan2.prototype.addEvent = function(_name, _attributes) {
        return this;
      };
      NonRecordingSpan2.prototype.addLink = function(_link) {
        return this;
      };
      NonRecordingSpan2.prototype.addLinks = function(_links) {
        return this;
      };
      NonRecordingSpan2.prototype.setStatus = function(_status) {
        return this;
      };
      NonRecordingSpan2.prototype.updateName = function(_name) {
        return this;
      };
      NonRecordingSpan2.prototype.end = function(_endTime) {
      };
      NonRecordingSpan2.prototype.isRecording = function() {
        return false;
      };
      NonRecordingSpan2.prototype.recordException = function(_exception, _time) {
      };
      return NonRecordingSpan2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js
function getSpan(context2) {
  return context2.getValue(SPAN_KEY) || void 0;
}
function getActiveSpan() {
  return getSpan(ContextAPI.getInstance().active());
}
function setSpan(context2, span) {
  return context2.setValue(SPAN_KEY, span);
}
function deleteSpan(context2) {
  return context2.deleteValue(SPAN_KEY);
}
function setSpanContext(context2, spanContext) {
  return setSpan(context2, new NonRecordingSpan(spanContext));
}
function getSpanContext(context2) {
  var _a;
  return (_a = getSpan(context2)) === null || _a === void 0 ? void 0 : _a.spanContext();
}
var SPAN_KEY;
var init_context_utils = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js"() {
    init_context();
    init_NonRecordingSpan();
    init_context2();
    SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js
function isValidTraceId(traceId) {
  return VALID_TRACEID_REGEX.test(traceId) && traceId !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
  return VALID_SPANID_REGEX.test(spanId) && spanId !== INVALID_SPANID;
}
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan(spanContext);
}
var VALID_TRACEID_REGEX, VALID_SPANID_REGEX;
var init_spancontext_utils = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js"() {
    init_invalid_span_constants();
    init_NonRecordingSpan();
    VALID_TRACEID_REGEX = /^([0-9a-f]{32})$/i;
    VALID_SPANID_REGEX = /^[0-9a-f]{16}$/i;
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js
function isSpanContext(spanContext) {
  return typeof spanContext === "object" && typeof spanContext["spanId"] === "string" && typeof spanContext["traceId"] === "string" && typeof spanContext["traceFlags"] === "number";
}
var contextApi, NoopTracer;
var init_NoopTracer = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js"() {
    init_context2();
    init_context_utils();
    init_NonRecordingSpan();
    init_spancontext_utils();
    contextApi = ContextAPI.getInstance();
    NoopTracer = /** @class */
    (function() {
      function NoopTracer2() {
      }
      NoopTracer2.prototype.startSpan = function(name, options, context2) {
        if (context2 === void 0) {
          context2 = contextApi.active();
        }
        var root = Boolean(options === null || options === void 0 ? void 0 : options.root);
        if (root) {
          return new NonRecordingSpan();
        }
        var parentFromContext = context2 && getSpanContext(context2);
        if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) {
          return new NonRecordingSpan(parentFromContext);
        } else {
          return new NonRecordingSpan();
        }
      };
      NoopTracer2.prototype.startActiveSpan = function(name, arg2, arg3, arg4) {
        var opts;
        var ctx;
        var fn;
        if (arguments.length < 2) {
          return;
        } else if (arguments.length === 2) {
          fn = arg2;
        } else if (arguments.length === 3) {
          opts = arg2;
          fn = arg3;
        } else {
          opts = arg2;
          ctx = arg3;
          fn = arg4;
        }
        var parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
        var span = this.startSpan(name, opts, parentContext);
        var contextWithSpanSet = setSpan(parentContext, span);
        return contextApi.with(contextWithSpanSet, fn, void 0, span);
      };
      return NoopTracer2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js
var NOOP_TRACER, ProxyTracer;
var init_ProxyTracer = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js"() {
    init_NoopTracer();
    NOOP_TRACER = new NoopTracer();
    ProxyTracer = /** @class */
    (function() {
      function ProxyTracer2(_provider, name, version, options) {
        this._provider = _provider;
        this.name = name;
        this.version = version;
        this.options = options;
      }
      ProxyTracer2.prototype.startSpan = function(name, options, context2) {
        return this._getTracer().startSpan(name, options, context2);
      };
      ProxyTracer2.prototype.startActiveSpan = function(_name, _options, _context, _fn) {
        var tracer = this._getTracer();
        return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
      };
      ProxyTracer2.prototype._getTracer = function() {
        if (this._delegate) {
          return this._delegate;
        }
        var tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
        if (!tracer) {
          return NOOP_TRACER;
        }
        this._delegate = tracer;
        return this._delegate;
      };
      return ProxyTracer2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js
var NoopTracerProvider;
var init_NoopTracerProvider = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js"() {
    init_NoopTracer();
    NoopTracerProvider = /** @class */
    (function() {
      function NoopTracerProvider2() {
      }
      NoopTracerProvider2.prototype.getTracer = function(_name, _version, _options) {
        return new NoopTracer();
      };
      return NoopTracerProvider2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js
var NOOP_TRACER_PROVIDER, ProxyTracerProvider;
var init_ProxyTracerProvider = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js"() {
    init_ProxyTracer();
    init_NoopTracerProvider();
    NOOP_TRACER_PROVIDER = new NoopTracerProvider();
    ProxyTracerProvider = /** @class */
    (function() {
      function ProxyTracerProvider2() {
      }
      ProxyTracerProvider2.prototype.getTracer = function(name, version, options) {
        var _a;
        return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer(this, name, version, options);
      };
      ProxyTracerProvider2.prototype.getDelegate = function() {
        var _a;
        return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
      };
      ProxyTracerProvider2.prototype.setDelegate = function(delegate) {
        this._delegate = delegate;
      };
      ProxyTracerProvider2.prototype.getDelegateTracer = function(name, version, options) {
        var _a;
        return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
      };
      return ProxyTracerProvider2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js
var SamplingDecision;
var init_SamplingResult = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js"() {
    (function(SamplingDecision2) {
      SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
      SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
      SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
    })(SamplingDecision || (SamplingDecision = {}));
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js
var SpanKind;
var init_span_kind = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js"() {
    (function(SpanKind2) {
      SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
      SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
      SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
      SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
      SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
    })(SpanKind || (SpanKind = {}));
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/status.js
var SpanStatusCode;
var init_status = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/status.js"() {
    (function(SpanStatusCode2) {
      SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
      SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
      SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
    })(SpanStatusCode || (SpanStatusCode = {}));
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-validators.js
function validateKey(key) {
  return VALID_KEY_REGEX.test(key);
}
function validateValue(value) {
  return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}
var VALID_KEY_CHAR_RANGE, VALID_KEY, VALID_VENDOR_KEY, VALID_KEY_REGEX, VALID_VALUE_BASE_REGEX, INVALID_VALUE_COMMA_EQUAL_REGEX;
var init_tracestate_validators = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-validators.js"() {
    VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
    VALID_KEY = "[a-z]" + VALID_KEY_CHAR_RANGE + "{0,255}";
    VALID_VENDOR_KEY = "[a-z0-9]" + VALID_KEY_CHAR_RANGE + "{0,240}@[a-z]" + VALID_KEY_CHAR_RANGE + "{0,13}";
    VALID_KEY_REGEX = new RegExp("^(?:" + VALID_KEY + "|" + VALID_VENDOR_KEY + ")$");
    VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
    INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-impl.js
var MAX_TRACE_STATE_ITEMS, MAX_TRACE_STATE_LEN, LIST_MEMBERS_SEPARATOR, LIST_MEMBER_KEY_VALUE_SPLITTER, TraceStateImpl;
var init_tracestate_impl = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-impl.js"() {
    init_tracestate_validators();
    MAX_TRACE_STATE_ITEMS = 32;
    MAX_TRACE_STATE_LEN = 512;
    LIST_MEMBERS_SEPARATOR = ",";
    LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
    TraceStateImpl = /** @class */
    (function() {
      function TraceStateImpl2(rawTraceState) {
        this._internalState = /* @__PURE__ */ new Map();
        if (rawTraceState)
          this._parse(rawTraceState);
      }
      TraceStateImpl2.prototype.set = function(key, value) {
        var traceState = this._clone();
        if (traceState._internalState.has(key)) {
          traceState._internalState.delete(key);
        }
        traceState._internalState.set(key, value);
        return traceState;
      };
      TraceStateImpl2.prototype.unset = function(key) {
        var traceState = this._clone();
        traceState._internalState.delete(key);
        return traceState;
      };
      TraceStateImpl2.prototype.get = function(key) {
        return this._internalState.get(key);
      };
      TraceStateImpl2.prototype.serialize = function() {
        var _this = this;
        return this._keys().reduce(function(agg, key) {
          agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + _this.get(key));
          return agg;
        }, []).join(LIST_MEMBERS_SEPARATOR);
      };
      TraceStateImpl2.prototype._parse = function(rawTraceState) {
        if (rawTraceState.length > MAX_TRACE_STATE_LEN)
          return;
        this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR).reverse().reduce(function(agg, part) {
          var listMember = part.trim();
          var i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
          if (i !== -1) {
            var key = listMember.slice(0, i);
            var value = listMember.slice(i + 1, part.length);
            if (validateKey(key) && validateValue(value)) {
              agg.set(key, value);
            } else {
            }
          }
          return agg;
        }, /* @__PURE__ */ new Map());
        if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
          this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, MAX_TRACE_STATE_ITEMS));
        }
      };
      TraceStateImpl2.prototype._keys = function() {
        return Array.from(this._internalState.keys()).reverse();
      };
      TraceStateImpl2.prototype._clone = function() {
        var traceState = new TraceStateImpl2();
        traceState._internalState = new Map(this._internalState);
        return traceState;
      };
      return TraceStateImpl2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/internal/utils.js
function createTraceState(rawTraceState) {
  return new TraceStateImpl(rawTraceState);
}
var init_utils2 = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/internal/utils.js"() {
    init_tracestate_impl();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context-api.js
var context;
var init_context_api = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/context-api.js"() {
    init_context2();
    context = ContextAPI.getInstance();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag-api.js
var diag2;
var init_diag_api = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag-api.js"() {
    init_diag();
    diag2 = DiagAPI.instance();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeterProvider.js
var NoopMeterProvider, NOOP_METER_PROVIDER;
var init_NoopMeterProvider = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeterProvider.js"() {
    init_NoopMeter();
    NoopMeterProvider = /** @class */
    (function() {
      function NoopMeterProvider2() {
      }
      NoopMeterProvider2.prototype.getMeter = function(_name, _version, _options) {
        return NOOP_METER;
      };
      return NoopMeterProvider2;
    })();
    NOOP_METER_PROVIDER = new NoopMeterProvider();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/metrics.js
var API_NAME3, MetricsAPI;
var init_metrics = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/metrics.js"() {
    init_NoopMeterProvider();
    init_global_utils();
    init_diag();
    API_NAME3 = "metrics";
    MetricsAPI = /** @class */
    (function() {
      function MetricsAPI2() {
      }
      MetricsAPI2.getInstance = function() {
        if (!this._instance) {
          this._instance = new MetricsAPI2();
        }
        return this._instance;
      };
      MetricsAPI2.prototype.setGlobalMeterProvider = function(provider) {
        return registerGlobal(API_NAME3, provider, DiagAPI.instance());
      };
      MetricsAPI2.prototype.getMeterProvider = function() {
        return getGlobal(API_NAME3) || NOOP_METER_PROVIDER;
      };
      MetricsAPI2.prototype.getMeter = function(name, version, options) {
        return this.getMeterProvider().getMeter(name, version, options);
      };
      MetricsAPI2.prototype.disable = function() {
        unregisterGlobal(API_NAME3, DiagAPI.instance());
      };
      return MetricsAPI2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics-api.js
var metrics;
var init_metrics_api = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/metrics-api.js"() {
    init_metrics();
    metrics = MetricsAPI.getInstance();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation/NoopTextMapPropagator.js
var NoopTextMapPropagator;
var init_NoopTextMapPropagator = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation/NoopTextMapPropagator.js"() {
    NoopTextMapPropagator = /** @class */
    (function() {
      function NoopTextMapPropagator2() {
      }
      NoopTextMapPropagator2.prototype.inject = function(_context, _carrier) {
      };
      NoopTextMapPropagator2.prototype.extract = function(context2, _carrier) {
        return context2;
      };
      NoopTextMapPropagator2.prototype.fields = function() {
        return [];
      };
      return NoopTextMapPropagator2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/context-helpers.js
function getBaggage(context2) {
  return context2.getValue(BAGGAGE_KEY) || void 0;
}
function getActiveBaggage() {
  return getBaggage(ContextAPI.getInstance().active());
}
function setBaggage(context2, baggage) {
  return context2.setValue(BAGGAGE_KEY, baggage);
}
function deleteBaggage(context2) {
  return context2.deleteValue(BAGGAGE_KEY);
}
var BAGGAGE_KEY;
var init_context_helpers = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/baggage/context-helpers.js"() {
    init_context2();
    init_context();
    BAGGAGE_KEY = createContextKey("OpenTelemetry Baggage Key");
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/propagation.js
var API_NAME4, NOOP_TEXT_MAP_PROPAGATOR, PropagationAPI;
var init_propagation = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/propagation.js"() {
    init_global_utils();
    init_NoopTextMapPropagator();
    init_TextMapPropagator();
    init_context_helpers();
    init_utils();
    init_diag();
    API_NAME4 = "propagation";
    NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
    PropagationAPI = /** @class */
    (function() {
      function PropagationAPI2() {
        this.createBaggage = createBaggage;
        this.getBaggage = getBaggage;
        this.getActiveBaggage = getActiveBaggage;
        this.setBaggage = setBaggage;
        this.deleteBaggage = deleteBaggage;
      }
      PropagationAPI2.getInstance = function() {
        if (!this._instance) {
          this._instance = new PropagationAPI2();
        }
        return this._instance;
      };
      PropagationAPI2.prototype.setGlobalPropagator = function(propagator) {
        return registerGlobal(API_NAME4, propagator, DiagAPI.instance());
      };
      PropagationAPI2.prototype.inject = function(context2, carrier, setter) {
        if (setter === void 0) {
          setter = defaultTextMapSetter;
        }
        return this._getGlobalPropagator().inject(context2, carrier, setter);
      };
      PropagationAPI2.prototype.extract = function(context2, carrier, getter) {
        if (getter === void 0) {
          getter = defaultTextMapGetter;
        }
        return this._getGlobalPropagator().extract(context2, carrier, getter);
      };
      PropagationAPI2.prototype.fields = function() {
        return this._getGlobalPropagator().fields();
      };
      PropagationAPI2.prototype.disable = function() {
        unregisterGlobal(API_NAME4, DiagAPI.instance());
      };
      PropagationAPI2.prototype._getGlobalPropagator = function() {
        return getGlobal(API_NAME4) || NOOP_TEXT_MAP_PROPAGATOR;
      };
      return PropagationAPI2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation-api.js
var propagation;
var init_propagation_api = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/propagation-api.js"() {
    init_propagation();
    propagation = PropagationAPI.getInstance();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/trace.js
var API_NAME5, TraceAPI;
var init_trace = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/api/trace.js"() {
    init_global_utils();
    init_ProxyTracerProvider();
    init_spancontext_utils();
    init_context_utils();
    init_diag();
    API_NAME5 = "trace";
    TraceAPI = /** @class */
    (function() {
      function TraceAPI2() {
        this._proxyTracerProvider = new ProxyTracerProvider();
        this.wrapSpanContext = wrapSpanContext;
        this.isSpanContextValid = isSpanContextValid;
        this.deleteSpan = deleteSpan;
        this.getSpan = getSpan;
        this.getActiveSpan = getActiveSpan;
        this.getSpanContext = getSpanContext;
        this.setSpan = setSpan;
        this.setSpanContext = setSpanContext;
      }
      TraceAPI2.getInstance = function() {
        if (!this._instance) {
          this._instance = new TraceAPI2();
        }
        return this._instance;
      };
      TraceAPI2.prototype.setGlobalTracerProvider = function(provider) {
        var success = registerGlobal(API_NAME5, this._proxyTracerProvider, DiagAPI.instance());
        if (success) {
          this._proxyTracerProvider.setDelegate(provider);
        }
        return success;
      };
      TraceAPI2.prototype.getTracerProvider = function() {
        return getGlobal(API_NAME5) || this._proxyTracerProvider;
      };
      TraceAPI2.prototype.getTracer = function(name, version) {
        return this.getTracerProvider().getTracer(name, version);
      };
      TraceAPI2.prototype.disable = function() {
        unregisterGlobal(API_NAME5, DiagAPI.instance());
        this._proxyTracerProvider = new ProxyTracerProvider();
      };
      return TraceAPI2;
    })();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js
var trace;
var init_trace_api = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js"() {
    init_trace();
    trace = TraceAPI.getInstance();
  }
});

// node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/index.js
var esm_exports = {};
__export(esm_exports, {
  DiagConsoleLogger: () => DiagConsoleLogger,
  DiagLogLevel: () => DiagLogLevel,
  INVALID_SPANID: () => INVALID_SPANID,
  INVALID_SPAN_CONTEXT: () => INVALID_SPAN_CONTEXT,
  INVALID_TRACEID: () => INVALID_TRACEID,
  ProxyTracer: () => ProxyTracer,
  ProxyTracerProvider: () => ProxyTracerProvider,
  ROOT_CONTEXT: () => ROOT_CONTEXT,
  SamplingDecision: () => SamplingDecision,
  SpanKind: () => SpanKind,
  SpanStatusCode: () => SpanStatusCode,
  TraceFlags: () => TraceFlags,
  ValueType: () => ValueType,
  baggageEntryMetadataFromString: () => baggageEntryMetadataFromString,
  context: () => context,
  createContextKey: () => createContextKey,
  createNoopMeter: () => createNoopMeter,
  createTraceState: () => createTraceState,
  default: () => esm_default,
  defaultTextMapGetter: () => defaultTextMapGetter,
  defaultTextMapSetter: () => defaultTextMapSetter,
  diag: () => diag2,
  isSpanContextValid: () => isSpanContextValid,
  isValidSpanId: () => isValidSpanId,
  isValidTraceId: () => isValidTraceId,
  metrics: () => metrics,
  propagation: () => propagation,
  trace: () => trace
});
var esm_default;
var init_esm2 = __esm({
  "node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/index.js"() {
    init_utils();
    init_context();
    init_consoleLogger();
    init_types();
    init_NoopMeter();
    init_Metric();
    init_TextMapPropagator();
    init_ProxyTracer();
    init_ProxyTracerProvider();
    init_SamplingResult();
    init_span_kind();
    init_status();
    init_trace_flags();
    init_utils2();
    init_spancontext_utils();
    init_invalid_span_constants();
    init_context_api();
    init_diag_api();
    init_metrics_api();
    init_propagation_api();
    init_trace_api();
    esm_default = {
      context,
      diag: diag2,
      metrics,
      propagation,
      trace
    };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processCpuTotal.js
var require_processCpuTotal = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processCpuTotal.js"(exports2, module2) {
    "use strict";
    var OtelApi = (init_esm2(), __toCommonJS(esm_exports));
    var Counter2 = require_counter();
    var PROCESS_CPU_USER_SECONDS = "process_cpu_user_seconds_total";
    var PROCESS_CPU_SYSTEM_SECONDS = "process_cpu_system_seconds_total";
    var PROCESS_CPU_SECONDS = "process_cpu_seconds_total";
    module2.exports = (registry, config2 = {}) => {
      const registers = registry ? [registry] : void 0;
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const exemplars = config2.enableExemplars ? config2.enableExemplars : false;
      const labelNames = Object.keys(labels);
      let lastCpuUsage = process.cpuUsage();
      const cpuUserUsageCounter = new Counter2({
        name: namePrefix + PROCESS_CPU_USER_SECONDS,
        help: "Total user CPU time spent in seconds.",
        enableExemplars: exemplars,
        registers,
        labelNames,
        // Use this one metric's `collect` to set all metrics' values.
        collect() {
          const cpuUsage = process.cpuUsage();
          const userUsageMicros = cpuUsage.user - lastCpuUsage.user;
          const systemUsageMicros = cpuUsage.system - lastCpuUsage.system;
          lastCpuUsage = cpuUsage;
          if (this.enableExemplars) {
            let exemplarLabels = {};
            const currentSpan = OtelApi.trace.getSpan(OtelApi.context.active());
            if (currentSpan) {
              exemplarLabels = {
                traceId: currentSpan.spanContext().traceId,
                spanId: currentSpan.spanContext().spanId
              };
            }
            cpuUserUsageCounter.inc({
              labels,
              value: userUsageMicros / 1e6,
              exemplarLabels
            });
            cpuSystemUsageCounter.inc({
              labels,
              value: systemUsageMicros / 1e6,
              exemplarLabels
            });
            cpuUsageCounter.inc({
              labels,
              value: (userUsageMicros + systemUsageMicros) / 1e6,
              exemplarLabels
            });
          } else {
            cpuUserUsageCounter.inc(labels, userUsageMicros / 1e6);
            cpuSystemUsageCounter.inc(labels, systemUsageMicros / 1e6);
            cpuUsageCounter.inc(
              labels,
              (userUsageMicros + systemUsageMicros) / 1e6
            );
          }
        }
      });
      const cpuSystemUsageCounter = new Counter2({
        name: namePrefix + PROCESS_CPU_SYSTEM_SECONDS,
        help: "Total system CPU time spent in seconds.",
        enableExemplars: exemplars,
        registers,
        labelNames
      });
      const cpuUsageCounter = new Counter2({
        name: namePrefix + PROCESS_CPU_SECONDS,
        help: "Total user and system CPU time spent in seconds.",
        enableExemplars: exemplars,
        registers,
        labelNames
      });
    };
    module2.exports.metricNames = [
      PROCESS_CPU_USER_SECONDS,
      PROCESS_CPU_SYSTEM_SECONDS,
      PROCESS_CPU_SECONDS
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processStartTime.js
var require_processStartTime = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processStartTime.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var startInSeconds = Math.round(Date.now() / 1e3 - process.uptime());
    var PROCESS_START_TIME = "process_start_time_seconds";
    module2.exports = (registry, config2 = {}) => {
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + PROCESS_START_TIME,
        help: "Start time of the process since unix epoch in seconds.",
        registers: registry ? [registry] : void 0,
        labelNames,
        aggregator: "omit",
        collect() {
          this.set(labels, startInSeconds);
        }
      });
    };
    module2.exports.metricNames = [PROCESS_START_TIME];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/osMemoryHeapLinux.js
var require_osMemoryHeapLinux = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/osMemoryHeapLinux.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var fs = require("fs");
    var values = ["VmSize", "VmRSS", "VmData"];
    var PROCESS_RESIDENT_MEMORY = "process_resident_memory_bytes";
    var PROCESS_VIRTUAL_MEMORY = "process_virtual_memory_bytes";
    var PROCESS_HEAP = "process_heap_bytes";
    function structureOutput(input) {
      return input.split("\n").reduce((acc, string) => {
        if (!values.some((value2) => string.startsWith(value2))) {
          return acc;
        }
        const split = string.split(":");
        let value = split[1].trim();
        value = value.substr(0, value.length - 3);
        value = Number(value) * 1024;
        acc[split[0]] = value;
        return acc;
      }, {});
    }
    module2.exports = (registry, config2 = {}) => {
      const registers = registry ? [registry] : void 0;
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      const residentMemGauge = new Gauge2({
        name: namePrefix + PROCESS_RESIDENT_MEMORY,
        help: "Resident memory size in bytes.",
        registers,
        labelNames,
        // Use this one metric's `collect` to set all metrics' values.
        collect() {
          try {
            const stat = fs.readFileSync("/proc/self/status", "utf8");
            const structuredOutput = structureOutput(stat);
            residentMemGauge.set(labels, structuredOutput.VmRSS);
            virtualMemGauge.set(labels, structuredOutput.VmSize);
            heapSizeMemGauge.set(labels, structuredOutput.VmData);
          } catch {
          }
        }
      });
      const virtualMemGauge = new Gauge2({
        name: namePrefix + PROCESS_VIRTUAL_MEMORY,
        help: "Virtual memory size in bytes.",
        registers,
        labelNames
      });
      const heapSizeMemGauge = new Gauge2({
        name: namePrefix + PROCESS_HEAP,
        help: "Process heap size in bytes.",
        registers,
        labelNames
      });
    };
    module2.exports.metricNames = [
      PROCESS_RESIDENT_MEMORY,
      PROCESS_VIRTUAL_MEMORY,
      PROCESS_HEAP
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/helpers/safeMemoryUsage.js
var require_safeMemoryUsage = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/helpers/safeMemoryUsage.js"(exports2, module2) {
    "use strict";
    function safeMemoryUsage() {
      try {
        return process.memoryUsage();
      } catch {
        return;
      }
    }
    module2.exports = safeMemoryUsage;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/osMemoryHeap.js
var require_osMemoryHeap = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/osMemoryHeap.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var linuxVariant = require_osMemoryHeapLinux();
    var safeMemoryUsage = require_safeMemoryUsage();
    var PROCESS_RESIDENT_MEMORY = "process_resident_memory_bytes";
    function notLinuxVariant(registry, config2 = {}) {
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + PROCESS_RESIDENT_MEMORY,
        help: "Resident memory size in bytes.",
        registers: registry ? [registry] : void 0,
        labelNames,
        collect() {
          const memUsage = safeMemoryUsage();
          if (memUsage) {
            this.set(labels, memUsage.rss);
          }
        }
      });
    }
    module2.exports = (registry, config2) => process.platform === "linux" ? linuxVariant(registry, config2) : notLinuxVariant(registry, config2);
    module2.exports.metricNames = process.platform === "linux" ? linuxVariant.metricNames : [PROCESS_RESIDENT_MEMORY];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processOpenFileDescriptors.js
var require_processOpenFileDescriptors = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processOpenFileDescriptors.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var fs = require("fs");
    var process2 = require("process");
    var PROCESS_OPEN_FDS = "process_open_fds";
    module2.exports = (registry, config2 = {}) => {
      if (process2.platform !== "linux") {
        return;
      }
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + PROCESS_OPEN_FDS,
        help: "Number of open file descriptors.",
        registers: registry ? [registry] : void 0,
        labelNames,
        collect() {
          try {
            const fds = fs.readdirSync("/proc/self/fd");
            this.set(labels, fds.length - 1);
          } catch {
          }
        }
      });
    };
    module2.exports.metricNames = [PROCESS_OPEN_FDS];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processMaxFileDescriptors.js
var require_processMaxFileDescriptors = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processMaxFileDescriptors.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var fs = require("fs");
    var PROCESS_MAX_FDS = "process_max_fds";
    var maxFds;
    module2.exports = (registry, config2 = {}) => {
      if (maxFds === void 0) {
        try {
          const limits = fs.readFileSync("/proc/self/limits", "utf8");
          const lines = limits.split("\n");
          for (const line of lines) {
            if (line.startsWith("Max open files")) {
              const parts = line.split(/  +/);
              maxFds = Number(parts[1]);
              break;
            }
          }
        } catch {
          return;
        }
      }
      if (maxFds === void 0) return;
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + PROCESS_MAX_FDS,
        help: "Maximum number of open file descriptors.",
        registers: registry ? [registry] : void 0,
        labelNames,
        collect() {
          if (maxFds !== void 0) this.set(labels, maxFds);
        }
      });
    };
    module2.exports.metricNames = [PROCESS_MAX_FDS];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/eventLoopLag.js
var require_eventLoopLag = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/eventLoopLag.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var perf_hooks;
    try {
      perf_hooks = require("perf_hooks");
    } catch {
    }
    var NODEJS_EVENTLOOP_LAG = "nodejs_eventloop_lag_seconds";
    var NODEJS_EVENTLOOP_LAG_MIN = "nodejs_eventloop_lag_min_seconds";
    var NODEJS_EVENTLOOP_LAG_MAX = "nodejs_eventloop_lag_max_seconds";
    var NODEJS_EVENTLOOP_LAG_MEAN = "nodejs_eventloop_lag_mean_seconds";
    var NODEJS_EVENTLOOP_LAG_STDDEV = "nodejs_eventloop_lag_stddev_seconds";
    var NODEJS_EVENTLOOP_LAG_P50 = "nodejs_eventloop_lag_p50_seconds";
    var NODEJS_EVENTLOOP_LAG_P90 = "nodejs_eventloop_lag_p90_seconds";
    var NODEJS_EVENTLOOP_LAG_P99 = "nodejs_eventloop_lag_p99_seconds";
    function reportEventloopLag(start, gauge, labels) {
      const delta = process.hrtime(start);
      const nanosec = delta[0] * 1e9 + delta[1];
      const seconds = nanosec / 1e9;
      gauge.set(labels, seconds);
    }
    module2.exports = (registry, config2 = {}) => {
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      const registers = registry ? [registry] : void 0;
      let collect = () => {
        const start = process.hrtime();
        setImmediate(reportEventloopLag, start, lag, labels);
      };
      if (perf_hooks && perf_hooks.monitorEventLoopDelay) {
        try {
          const histogram = perf_hooks.monitorEventLoopDelay({
            resolution: config2.eventLoopMonitoringPrecision
          });
          histogram.enable();
          collect = () => {
            const start = process.hrtime();
            setImmediate(reportEventloopLag, start, lag, labels);
            lagMin.set(labels, histogram.min / 1e9);
            lagMax.set(labels, histogram.max / 1e9);
            lagMean.set(labels, histogram.mean / 1e9);
            lagStddev.set(labels, histogram.stddev / 1e9);
            lagP50.set(labels, histogram.percentile(50) / 1e9);
            lagP90.set(labels, histogram.percentile(90) / 1e9);
            lagP99.set(labels, histogram.percentile(99) / 1e9);
            histogram.reset();
          };
        } catch (e) {
          if (e.code === "ERR_NOT_IMPLEMENTED") {
            return;
          }
          throw e;
        }
      }
      const lag = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG,
        help: "Lag of event loop in seconds.",
        registers,
        labelNames,
        aggregator: "average",
        // Use this one metric's `collect` to set all metrics' values.
        collect
      });
      const lagMin = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_MIN,
        help: "The minimum recorded event loop delay.",
        registers,
        labelNames,
        aggregator: "min"
      });
      const lagMax = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_MAX,
        help: "The maximum recorded event loop delay.",
        registers,
        labelNames,
        aggregator: "max"
      });
      const lagMean = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_MEAN,
        help: "The mean of the recorded event loop delays.",
        registers,
        labelNames,
        aggregator: "average"
      });
      const lagStddev = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_STDDEV,
        help: "The standard deviation of the recorded event loop delays.",
        registers,
        labelNames,
        aggregator: "average"
      });
      const lagP50 = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_P50,
        help: "The 50th percentile of the recorded event loop delays.",
        registers,
        labelNames,
        aggregator: "average"
      });
      const lagP90 = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_P90,
        help: "The 90th percentile of the recorded event loop delays.",
        registers,
        labelNames,
        aggregator: "average"
      });
      const lagP99 = new Gauge2({
        name: namePrefix + NODEJS_EVENTLOOP_LAG_P99,
        help: "The 99th percentile of the recorded event loop delays.",
        registers,
        labelNames,
        aggregator: "average"
      });
    };
    module2.exports.metricNames = [
      NODEJS_EVENTLOOP_LAG,
      NODEJS_EVENTLOOP_LAG_MIN,
      NODEJS_EVENTLOOP_LAG_MAX,
      NODEJS_EVENTLOOP_LAG_MEAN,
      NODEJS_EVENTLOOP_LAG_STDDEV,
      NODEJS_EVENTLOOP_LAG_P50,
      NODEJS_EVENTLOOP_LAG_P90,
      NODEJS_EVENTLOOP_LAG_P99
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/helpers/processMetricsHelpers.js
var require_processMetricsHelpers = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/helpers/processMetricsHelpers.js"(exports2, module2) {
    "use strict";
    function aggregateByObjectName(list) {
      const data = {};
      for (let i = 0; i < list.length; i++) {
        const listElement = list[i];
        if (!listElement || typeof listElement.constructor === "undefined") {
          continue;
        }
        if (Object.hasOwnProperty.call(data, listElement.constructor.name)) {
          data[listElement.constructor.name] += 1;
        } else {
          data[listElement.constructor.name] = 1;
        }
      }
      return data;
    }
    function updateMetrics(gauge, data, labels) {
      gauge.reset();
      for (const key in data) {
        gauge.set(Object.assign({ type: key }, labels || {}), data[key]);
      }
    }
    module2.exports = {
      aggregateByObjectName,
      updateMetrics
    };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processHandles.js
var require_processHandles = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processHandles.js"(exports2, module2) {
    "use strict";
    var { aggregateByObjectName } = require_processMetricsHelpers();
    var { updateMetrics } = require_processMetricsHelpers();
    var Gauge2 = require_gauge();
    var NODEJS_ACTIVE_HANDLES = "nodejs_active_handles";
    var NODEJS_ACTIVE_HANDLES_TOTAL = "nodejs_active_handles_total";
    module2.exports = (registry, config2 = {}) => {
      if (typeof process._getActiveHandles !== "function") {
        return;
      }
      const registers = registry ? [registry] : void 0;
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + NODEJS_ACTIVE_HANDLES,
        help: "Number of active libuv handles grouped by handle type. Every handle type is C++ class name.",
        labelNames: ["type", ...labelNames],
        registers,
        collect() {
          const handles = process._getActiveHandles();
          updateMetrics(this, aggregateByObjectName(handles), labels);
        }
      });
      new Gauge2({
        name: namePrefix + NODEJS_ACTIVE_HANDLES_TOTAL,
        help: "Total number of active handles.",
        registers,
        labelNames,
        collect() {
          const handles = process._getActiveHandles();
          this.set(labels, handles.length);
        }
      });
    };
    module2.exports.metricNames = [
      NODEJS_ACTIVE_HANDLES,
      NODEJS_ACTIVE_HANDLES_TOTAL
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processRequests.js
var require_processRequests = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processRequests.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var { aggregateByObjectName } = require_processMetricsHelpers();
    var { updateMetrics } = require_processMetricsHelpers();
    var NODEJS_ACTIVE_REQUESTS = "nodejs_active_requests";
    var NODEJS_ACTIVE_REQUESTS_TOTAL = "nodejs_active_requests_total";
    module2.exports = (registry, config2 = {}) => {
      if (typeof process._getActiveRequests !== "function") {
        return;
      }
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + NODEJS_ACTIVE_REQUESTS,
        help: "Number of active libuv requests grouped by request type. Every request type is C++ class name.",
        labelNames: ["type", ...labelNames],
        registers: registry ? [registry] : void 0,
        collect() {
          const requests = process._getActiveRequests();
          updateMetrics(this, aggregateByObjectName(requests), labels);
        }
      });
      new Gauge2({
        name: namePrefix + NODEJS_ACTIVE_REQUESTS_TOTAL,
        help: "Total number of active requests.",
        registers: registry ? [registry] : void 0,
        labelNames,
        collect() {
          const requests = process._getActiveRequests();
          this.set(labels, requests.length);
        }
      });
    };
    module2.exports.metricNames = [
      NODEJS_ACTIVE_REQUESTS,
      NODEJS_ACTIVE_REQUESTS_TOTAL
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processResources.js
var require_processResources = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/processResources.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var { updateMetrics } = require_processMetricsHelpers();
    var NODEJS_ACTIVE_RESOURCES = "nodejs_active_resources";
    var NODEJS_ACTIVE_RESOURCES_TOTAL = "nodejs_active_resources_total";
    module2.exports = (registry, config2 = {}) => {
      if (typeof process.getActiveResourcesInfo !== "function") {
        return;
      }
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + NODEJS_ACTIVE_RESOURCES,
        help: "Number of active resources that are currently keeping the event loop alive, grouped by async resource type.",
        labelNames: ["type", ...labelNames],
        registers: registry ? [registry] : void 0,
        collect() {
          const resources = process.getActiveResourcesInfo();
          const data = {};
          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            if (Object.hasOwn(data, resource)) {
              data[resource] += 1;
            } else {
              data[resource] = 1;
            }
          }
          updateMetrics(this, data, labels);
        }
      });
      new Gauge2({
        name: namePrefix + NODEJS_ACTIVE_RESOURCES_TOTAL,
        help: "Total number of active resources.",
        registers: registry ? [registry] : void 0,
        labelNames,
        collect() {
          const resources = process.getActiveResourcesInfo();
          this.set(labels, resources.length);
        }
      });
    };
    module2.exports.metricNames = [
      NODEJS_ACTIVE_RESOURCES,
      NODEJS_ACTIVE_RESOURCES_TOTAL
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/heapSizeAndUsed.js
var require_heapSizeAndUsed = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/heapSizeAndUsed.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var safeMemoryUsage = require_safeMemoryUsage();
    var NODEJS_HEAP_SIZE_TOTAL = "nodejs_heap_size_total_bytes";
    var NODEJS_HEAP_SIZE_USED = "nodejs_heap_size_used_bytes";
    var NODEJS_EXTERNAL_MEMORY = "nodejs_external_memory_bytes";
    module2.exports = (registry, config2 = {}) => {
      if (typeof process.memoryUsage !== "function") {
        return;
      }
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      const registers = registry ? [registry] : void 0;
      const namePrefix = config2.prefix ? config2.prefix : "";
      const collect = () => {
        const memUsage = safeMemoryUsage();
        if (memUsage) {
          heapSizeTotal.set(labels, memUsage.heapTotal);
          heapSizeUsed.set(labels, memUsage.heapUsed);
          if (memUsage.external !== void 0) {
            externalMemUsed.set(labels, memUsage.external);
          }
        }
      };
      const heapSizeTotal = new Gauge2({
        name: namePrefix + NODEJS_HEAP_SIZE_TOTAL,
        help: "Process heap size from Node.js in bytes.",
        registers,
        labelNames,
        // Use this one metric's `collect` to set all metrics' values.
        collect
      });
      const heapSizeUsed = new Gauge2({
        name: namePrefix + NODEJS_HEAP_SIZE_USED,
        help: "Process heap size used from Node.js in bytes.",
        registers,
        labelNames
      });
      const externalMemUsed = new Gauge2({
        name: namePrefix + NODEJS_EXTERNAL_MEMORY,
        help: "Node.js external memory size in bytes.",
        registers,
        labelNames
      });
    };
    module2.exports.metricNames = [
      NODEJS_HEAP_SIZE_TOTAL,
      NODEJS_HEAP_SIZE_USED,
      NODEJS_EXTERNAL_MEMORY
    ];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/heapSpacesSizeAndUsed.js
var require_heapSpacesSizeAndUsed = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/heapSpacesSizeAndUsed.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var v8 = require("v8");
    var METRICS = ["total", "used", "available"];
    var NODEJS_HEAP_SIZE = {};
    METRICS.forEach((metricType) => {
      NODEJS_HEAP_SIZE[metricType] = `nodejs_heap_space_size_${metricType}_bytes`;
    });
    module2.exports = (registry, config2 = {}) => {
      try {
        v8.getHeapSpaceStatistics();
      } catch (e) {
        if (e.code === "ERR_NOT_IMPLEMENTED") {
          return;
        }
        throw e;
      }
      const registers = registry ? [registry] : void 0;
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = ["space", ...Object.keys(labels)];
      const gauges = {};
      METRICS.forEach((metricType) => {
        gauges[metricType] = new Gauge2({
          name: namePrefix + NODEJS_HEAP_SIZE[metricType],
          help: `Process heap space size ${metricType} from Node.js in bytes.`,
          labelNames,
          registers
        });
      });
      gauges.total.collect = () => {
        for (const space of v8.getHeapSpaceStatistics()) {
          const spaceName = space.space_name.substr(
            0,
            space.space_name.indexOf("_space")
          );
          gauges.total.set({ space: spaceName, ...labels }, space.space_size);
          gauges.used.set({ space: spaceName, ...labels }, space.space_used_size);
          gauges.available.set(
            { space: spaceName, ...labels },
            space.space_available_size
          );
        }
      };
    };
    module2.exports.metricNames = Object.values(NODEJS_HEAP_SIZE);
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/version.js
var require_version = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/version.js"(exports2, module2) {
    "use strict";
    var Gauge2 = require_gauge();
    var version = process.version;
    var versionSegments = version.slice(1).split(".").map(Number);
    var NODE_VERSION_INFO = "nodejs_version_info";
    module2.exports = (registry, config2 = {}) => {
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      new Gauge2({
        name: namePrefix + NODE_VERSION_INFO,
        help: "Node.js version info.",
        labelNames: ["version", "major", "minor", "patch", ...labelNames],
        registers: registry ? [registry] : void 0,
        aggregator: "first",
        collect() {
          this.labels(
            version,
            versionSegments[0],
            versionSegments[1],
            versionSegments[2],
            ...Object.values(labels)
          ).set(1);
        }
      });
    };
    module2.exports.metricNames = [NODE_VERSION_INFO];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/gc.js
var require_gc = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metrics/gc.js"(exports2, module2) {
    "use strict";
    var Histogram2 = require_histogram();
    var perf_hooks;
    try {
      perf_hooks = require("perf_hooks");
    } catch {
    }
    var NODEJS_GC_DURATION_SECONDS = "nodejs_gc_duration_seconds";
    var DEFAULT_GC_DURATION_BUCKETS = [1e-3, 0.01, 0.1, 1, 2, 5];
    var kinds = [];
    if (perf_hooks && perf_hooks.constants) {
      kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR] = "major";
      kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR] = "minor";
      kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL] = "incremental";
      kinds[perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB] = "weakcb";
    }
    module2.exports = (registry, config2 = {}) => {
      if (!perf_hooks) {
        return;
      }
      const namePrefix = config2.prefix ? config2.prefix : "";
      const labels = config2.labels ? config2.labels : {};
      const labelNames = Object.keys(labels);
      const buckets = config2.gcDurationBuckets ? config2.gcDurationBuckets : DEFAULT_GC_DURATION_BUCKETS;
      const gcHistogram = new Histogram2({
        name: namePrefix + NODEJS_GC_DURATION_SECONDS,
        help: "Garbage collection duration by kind, one of major, minor, incremental or weakcb.",
        labelNames: ["kind", ...labelNames],
        enableExemplars: false,
        buckets,
        registers: registry ? [registry] : void 0
      });
      const obs = new perf_hooks.PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        const kind = entry.detail ? kinds[entry.detail.kind] : kinds[entry.kind];
        gcHistogram.observe(Object.assign({ kind }, labels), entry.duration / 1e3);
      });
      obs.observe({ entryTypes: ["gc"] });
    };
    module2.exports.metricNames = [NODEJS_GC_DURATION_SECONDS];
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/defaultMetrics.js
var require_defaultMetrics = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/defaultMetrics.js"(exports2, module2) {
    "use strict";
    var { isObject } = require_util();
    var processCpuTotal = require_processCpuTotal();
    var processStartTime = require_processStartTime();
    var osMemoryHeap = require_osMemoryHeap();
    var processOpenFileDescriptors = require_processOpenFileDescriptors();
    var processMaxFileDescriptors = require_processMaxFileDescriptors();
    var eventLoopLag = require_eventLoopLag();
    var processHandles = require_processHandles();
    var processRequests = require_processRequests();
    var processResources = require_processResources();
    var heapSizeAndUsed = require_heapSizeAndUsed();
    var heapSpacesSizeAndUsed = require_heapSpacesSizeAndUsed();
    var version = require_version();
    var gc = require_gc();
    var metrics2 = {
      processCpuTotal,
      processStartTime,
      osMemoryHeap,
      processOpenFileDescriptors,
      processMaxFileDescriptors,
      eventLoopLag,
      ...typeof process.getActiveResourcesInfo === "function" ? { processResources } : {},
      processHandles,
      processRequests,
      heapSizeAndUsed,
      heapSpacesSizeAndUsed,
      version,
      gc
    };
    var metricsList = Object.keys(metrics2);
    module2.exports = function collectDefaultMetrics(config2) {
      if (config2 !== null && config2 !== void 0 && !isObject(config2)) {
        throw new TypeError("config must be null, undefined, or an object");
      }
      config2 = { eventLoopMonitoringPrecision: 10, ...config2 };
      for (const metric of Object.values(metrics2)) {
        metric(config2.register, config2);
      }
    };
    module2.exports.metricsList = metricsList;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metricAggregators.js
var require_metricAggregators = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/metricAggregators.js"(exports2) {
    "use strict";
    var { Grouper, hashObject } = require_util();
    function AggregatorFactory(aggregatorFn) {
      return (metrics2) => {
        if (metrics2.length === 0) return;
        const result = {
          help: metrics2[0].help,
          name: metrics2[0].name,
          type: metrics2[0].type,
          values: [],
          aggregator: metrics2[0].aggregator
        };
        const byLabels = new Grouper();
        metrics2.forEach((metric) => {
          metric.values.forEach((value) => {
            const key = hashObject(value.labels);
            byLabels.add(`${value.metricName}_${key}`, value);
          });
        });
        byLabels.forEach((values) => {
          if (values.length === 0) return;
          const valObj = {
            value: aggregatorFn(values),
            labels: values[0].labels
          };
          if (values[0].metricName) {
            valObj.metricName = values[0].metricName;
          }
          result.values.push(valObj);
        });
        return result;
      };
    }
    exports2.AggregatorFactory = AggregatorFactory;
    exports2.aggregators = {
      /**
       * @return The sum of values.
       */
      sum: AggregatorFactory((v) => v.reduce((p, c) => p + c.value, 0)),
      /**
       * @return The first value.
       */
      first: AggregatorFactory((v) => v[0].value),
      /**
       * @return {undefined} Undefined; omits the metric.
       */
      omit: () => {
      },
      /**
       * @return The arithmetic mean of the values.
       */
      average: AggregatorFactory(
        (v) => v.reduce((p, c) => p + c.value, 0) / v.length
      ),
      /**
       * @return The minimum of the values.
       */
      min: AggregatorFactory(
        (v) => v.reduce((p, c) => Math.min(p, c.value), Infinity)
      ),
      /**
       * @return The maximum of the values.
       */
      max: AggregatorFactory(
        (v) => v.reduce((p, c) => Math.max(p, c.value), -Infinity)
      )
    };
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/cluster.js
var require_cluster = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/lib/cluster.js"(exports2, module2) {
    "use strict";
    var Registry2 = require_registry();
    var { Grouper } = require_util();
    var { aggregators } = require_metricAggregators();
    var cluster = () => {
      const data = require("cluster");
      cluster = () => data;
      return data;
    };
    var GET_METRICS_REQ = "prom-client:getMetricsReq";
    var GET_METRICS_RES = "prom-client:getMetricsRes";
    var registries = [Registry2.globalRegistry];
    var requestCtr = 0;
    var listenersAdded = false;
    var requests = /* @__PURE__ */ new Map();
    var AggregatorRegistry = class extends Registry2 {
      constructor(regContentType = Registry2.PROMETHEUS_CONTENT_TYPE) {
        super(regContentType);
        addListeners();
      }
      /**
       * Gets aggregated metrics for all workers. The optional callback and
       * returned Promise resolve with the same value; either may be used.
       * @return {Promise<string>} Promise that resolves with the aggregated
       *   metrics.
       */
      clusterMetrics() {
        const requestId = requestCtr++;
        return new Promise((resolve, reject) => {
          let settled = false;
          function done(err, result) {
            if (settled) return;
            settled = true;
            if (err) reject(err);
            else resolve(result);
          }
          const request = {
            responses: [],
            pending: 0,
            done,
            errorTimeout: setTimeout(() => {
              const err = new Error("Operation timed out.");
              request.done(err);
            }, 5e3)
          };
          requests.set(requestId, request);
          const message = {
            type: GET_METRICS_REQ,
            requestId
          };
          for (const id in cluster().workers) {
            if (cluster().workers[id].isConnected()) {
              cluster().workers[id].send(message);
              request.pending++;
            }
          }
          if (request.pending === 0) {
            clearTimeout(request.errorTimeout);
            process.nextTick(() => done(null, ""));
          }
        });
      }
      get contentType() {
        return super.contentType;
      }
      /**
       * Creates a new Registry instance from an array of metrics that were
       * created by `registry.getMetricsAsJSON()`. Metrics are aggregated using
       * the method specified by their `aggregator` property, or by summation if
       * `aggregator` is undefined.
       * @param {Array} metricsArr Array of metrics, each of which created by
       *   `registry.getMetricsAsJSON()`.
       * @param {string} registryType content type of the new registry. Defaults
       * to PROMETHEUS_CONTENT_TYPE.
       * @return {Registry} aggregated registry.
       */
      static aggregate(metricsArr, registryType = Registry2.PROMETHEUS_CONTENT_TYPE) {
        const aggregatedRegistry = new Registry2();
        const metricsByName = new Grouper();
        aggregatedRegistry.setContentType(registryType);
        metricsArr.forEach((metrics2) => {
          metrics2.forEach((metric) => {
            metricsByName.add(metric.name, metric);
          });
        });
        metricsByName.forEach((metrics2) => {
          const aggregatorName = metrics2[0].aggregator;
          const aggregatorFn = aggregators[aggregatorName];
          if (typeof aggregatorFn !== "function") {
            throw new Error(`'${aggregatorName}' is not a defined aggregator.`);
          }
          const aggregatedMetric = aggregatorFn(metrics2);
          if (aggregatedMetric) {
            const aggregatedMetricWrapper = Object.assign(
              {
                get: () => aggregatedMetric
              },
              aggregatedMetric
            );
            aggregatedRegistry.registerMetric(aggregatedMetricWrapper);
          }
        });
        return aggregatedRegistry;
      }
      /**
       * Sets the registry or registries to be aggregated. Call from workers to
       * use a registry/registries other than the default global registry.
       * @param {Array<Registry>|Registry} regs Registry or registries to be
       *   aggregated.
       * @return {void}
       */
      static setRegistries(regs) {
        if (!Array.isArray(regs)) regs = [regs];
        regs.forEach((reg) => {
          if (!(reg instanceof Registry2)) {
            throw new TypeError(`Expected Registry, got ${typeof reg}`);
          }
        });
        registries = regs;
      }
    };
    function addListeners() {
      if (listenersAdded) return;
      listenersAdded = true;
      if (cluster().isMaster) {
        cluster().on("message", (worker, message) => {
          if (message.type === GET_METRICS_RES) {
            const request = requests.get(message.requestId);
            if (message.error) {
              request.done(new Error(message.error));
              return;
            }
            message.metrics.forEach((registry) => request.responses.push(registry));
            request.pending--;
            if (request.pending === 0) {
              requests.delete(message.requestId);
              clearTimeout(request.errorTimeout);
              const registry = AggregatorRegistry.aggregate(request.responses);
              const promString = registry.metrics();
              request.done(null, promString);
            }
          }
        });
      }
      if (cluster().isWorker) {
        process.on("message", (message) => {
          if (message.type === GET_METRICS_REQ) {
            Promise.all(registries.map((r) => r.getMetricsAsJSON())).then((metrics2) => {
              process.send({
                type: GET_METRICS_RES,
                requestId: message.requestId,
                metrics: metrics2
              });
            }).catch((error) => {
              process.send({
                type: GET_METRICS_RES,
                requestId: message.requestId,
                error: error.message
              });
            });
          }
        });
      }
    }
    module2.exports = AggregatorRegistry;
  }
});

// node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/index.js
var require_prom_client = __commonJS({
  "node_modules/.pnpm/prom-client@15.1.3/node_modules/prom-client/index.js"(exports2) {
    "use strict";
    exports2.register = require_registry().globalRegistry;
    exports2.Registry = require_registry();
    Object.defineProperty(exports2, "contentType", {
      configurable: false,
      enumerable: true,
      get() {
        return exports2.register.contentType;
      },
      set(value) {
        exports2.register.setContentType(value);
      }
    });
    exports2.prometheusContentType = exports2.Registry.PROMETHEUS_CONTENT_TYPE;
    exports2.openMetricsContentType = exports2.Registry.OPENMETRICS_CONTENT_TYPE;
    exports2.validateMetricName = require_validation().validateMetricName;
    exports2.Counter = require_counter();
    exports2.Gauge = require_gauge();
    exports2.Histogram = require_histogram();
    exports2.Summary = require_summary();
    exports2.Pushgateway = require_pushgateway();
    exports2.linearBuckets = require_bucketGenerators().linearBuckets;
    exports2.exponentialBuckets = require_bucketGenerators().exponentialBuckets;
    exports2.collectDefaultMetrics = require_defaultMetrics();
    exports2.aggregators = require_metricAggregators().aggregators;
    exports2.AggregatorRegistry = require_cluster();
  }
});

// backend/shared/metrics-registry.ts
var import_prom_client, metricsRegistry, metricsContentType;
var init_metrics_registry = __esm({
  "backend/shared/metrics-registry.ts"() {
    "use strict";
    import_prom_client = __toESM(require_prom_client());
    metricsRegistry = new import_prom_client.Registry();
    metricsContentType = metricsRegistry.contentType;
  }
});

// backend/shared/db-metrics.ts
var import_prom_client2, dbQueryDurationSeconds, dbConnectionPoolActive, dbConnectionPoolIdle, dbQueriesTotal, parseQuerySignature, recordQueryFromSql, updateConnectionPoolMetrics;
var init_db_metrics = __esm({
  "backend/shared/db-metrics.ts"() {
    "use strict";
    import_prom_client2 = __toESM(require_prom_client());
    init_metrics_registry();
    dbQueryDurationSeconds = new import_prom_client2.Histogram({
      name: "db_query_duration_seconds",
      help: "Database query duration in seconds.",
      labelNames: ["operation", "table"],
      buckets: [1e-3, 5e-3, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [metricsRegistry]
    });
    dbConnectionPoolActive = new import_prom_client2.Gauge({
      name: "db_connection_pool_active",
      help: "Active database connections.",
      labelNames: ["pool_name"],
      registers: [metricsRegistry]
    });
    dbConnectionPoolIdle = new import_prom_client2.Gauge({
      name: "db_connection_pool_idle",
      help: "Idle database connections.",
      labelNames: ["pool_name"],
      registers: [metricsRegistry]
    });
    dbQueriesTotal = new import_prom_client2.Counter({
      name: "db_queries_total",
      help: "Total database queries.",
      labelNames: ["operation", "table", "status"],
      registers: [metricsRegistry]
    });
    parseQuerySignature = (sql) => {
      const normalized = sql.trim().replace(/\s+/g, " ");
      const operation = normalized.split(" ")[0]?.toUpperCase() || "OTHER";
      let table = "unknown";
      if (operation === "SELECT" || operation === "DELETE") {
        const match = normalized.match(/\bFROM\s+([^\s,]+)/i);
        table = match?.[1]?.replace(/["']/g, "") ?? table;
      } else if (operation === "INSERT") {
        const match = normalized.match(/\bINTO\s+([^\s(]+)/i);
        table = match?.[1]?.replace(/["']/g, "") ?? table;
      } else if (operation === "UPDATE") {
        const match = normalized.match(/\bUPDATE\s+([^\s]+)/i);
        table = match?.[1]?.replace(/["']/g, "") ?? table;
      }
      return { operation, table };
    };
    recordQueryFromSql = (sql, durationSeconds, status) => {
      const { operation, table } = parseQuerySignature(sql);
      dbQueryDurationSeconds.observe({ operation, table }, durationSeconds);
      dbQueriesTotal.inc({ operation, table, status });
    };
    updateConnectionPoolMetrics = (poolName, active, idle) => {
      dbConnectionPoolActive.set({ pool_name: poolName }, active);
      dbConnectionPoolIdle.set({ pool_name: poolName }, idle);
    };
  }
});

// backend/shared/db.ts
var createPool, poolCache, getPool, pool, startPoolMetricsUpdater, query;
var init_db = __esm({
  "backend/shared/db.ts"() {
    "use strict";
    init_esm();
    init_config();
    init_db_metrics();
    createPool = (connectionString) => {
      return new Pool({
        connectionString: connectionString || config.db.url
      });
    };
    poolCache = /* @__PURE__ */ new Map();
    getPool = (connectionString) => {
      const key = connectionString || config.db.url;
      const existing = poolCache.get(key);
      if (existing) {
        return existing;
      }
      const pool2 = createPool(key);
      poolCache.set(key, pool2);
      return pool2;
    };
    pool = getPool();
    startPoolMetricsUpdater = () => {
      setInterval(() => {
        try {
          for (const [name, p] of poolCache.entries()) {
            const poolName = name === config.db.planeAUrl ? "plane-a" : name === config.db.planeBUrl ? "plane-b" : name === config.db.planeCUrl ? "plane-c" : "default";
            const active = p.totalCount - p.idleCount;
            updateConnectionPoolMetrics(poolName, active, p.idleCount);
          }
        } catch {
        }
      }, 1e4);
    };
    startPoolMetricsUpdater();
    query = async (text, params = [], poolInstance = pool) => {
      const startTime = Date.now();
      try {
        const result = await poolInstance.query(text, params);
        try {
          const durationSeconds = (Date.now() - startTime) / 1e3;
          recordQueryFromSql(text, durationSeconds, "success");
        } catch {
        }
        return result;
      } catch (error) {
        try {
          const durationSeconds = (Date.now() - startTime) / 1e3;
          recordQueryFromSql(text, durationSeconds, "error");
        } catch {
        }
        throw error;
      }
    };
  }
});

// backend/plane-b/src/repositories/types/quote-refresh-status.ts
var init_quote_refresh_status = __esm({
  "backend/plane-b/src/repositories/types/quote-refresh-status.ts"() {
    "use strict";
  }
});

// backend/plane-b/src/repositories/implementations/quote-refresh-repository.ts
var QuoteRefreshRepository;
var init_quote_refresh_repository = __esm({
  "backend/plane-b/src/repositories/implementations/quote-refresh-repository.ts"() {
    "use strict";
    init_db();
    init_quote_refresh_status();
    QuoteRefreshRepository = class {
      constructor(pool2) {
        this.pool = pool2;
      }
      async claimPendingRequests(limit, maxRetries) {
        const result = await query(
          `WITH next AS (
         SELECT request_id, status, retry_count, processed_at
           FROM silver.quote_refresh_request
          WHERE status = $1
             OR (
               status = $2
               AND retry_count < $3
               AND (
                 processed_at IS NULL
                 OR EXTRACT(EPOCH FROM (NOW() - processed_at)) >= POWER(2, retry_count)
               )
             )
          ORDER BY last_requested_at DESC
          LIMIT $4
          FOR UPDATE SKIP LOCKED
       )
       UPDATE silver.quote_refresh_request AS req
          SET status = $5,
              locked_at = NOW(),
              retry_count = CASE
                WHEN next.status = $2 THEN req.retry_count + 1
                ELSE req.retry_count
              END
        FROM next
        WHERE req.request_id = next.request_id
        RETURNING req.request_id, req.provider_id, req.corridor_id, req.amount_bucket, req.payin_method, req.payout_method, req.retry_count`,
          [
            "pending" /* PENDING */,
            "failed" /* FAILED */,
            maxRetries,
            limit,
            "processing" /* PROCESSING */
          ],
          this.pool
        );
        return result.rows;
      }
      async markRequestStatus(requestId, status, errorMessage) {
        await query(
          `UPDATE silver.quote_refresh_request
          SET status = $1,
              processed_at = NOW(),
              error_message = $2,
              retry_count = CASE
                WHEN $1 = $3 THEN retry_count
                ELSE 0
              END
        WHERE request_id = $4`,
          [status, errorMessage, "failed" /* FAILED */, requestId],
          this.pool
        );
      }
      async markRequestFailed(requestId, errorMessage, retryCountOverride) {
        await query(
          `UPDATE silver.quote_refresh_request
          SET status = $1,
              processed_at = NOW(),
              error_message = $2,
              retry_count = COALESCE($3, retry_count)
        WHERE request_id = $4`,
          ["failed" /* FAILED */, errorMessage, retryCountOverride ?? null, requestId],
          this.pool
        );
      }
      async retryFailedRequests(minAgeSeconds) {
        const result = await query(
          `UPDATE silver.quote_refresh_request
          SET status = $1,
              error_message = NULL,
              processed_at = NULL,
              locked_at = NULL,
              retry_count = 0
        WHERE status = $2
          AND EXTRACT(EPOCH FROM (NOW() - processed_at)) > $3
        RETURNING request_id`,
          ["pending" /* PENDING */, "failed" /* FAILED */, minAgeSeconds],
          this.pool
        );
        return result.rowCount ?? 0;
      }
      async getQueueDepth() {
        const result = await query(
          `SELECT COUNT(*)::int AS count
         FROM silver.quote_refresh_request
        WHERE status = $1`,
          ["pending" /* PENDING */],
          this.pool
        );
        return result.rows[0]?.count ?? 0;
      }
      async cleanupRequests(statuses2, olderThanHours2) {
        if (statuses2.length === 0 || olderThanHours2 <= 0) return 0;
        const result = await query(
          `DELETE FROM silver.quote_refresh_request
        WHERE status = ANY($1)
          AND processed_at IS NOT NULL
          AND processed_at < NOW() - ($2 * INTERVAL '1 hour')
        RETURNING request_id`,
          [statuses2, olderThanHours2],
          this.pool
        );
        return result.rowCount ?? 0;
      }
    };
  }
});

// backend/scripts/quote-refresh-queue-cleanup.ts
var quote_refresh_queue_cleanup_exports = {};
__export(quote_refresh_queue_cleanup_exports, {
  runQuoteRefreshQueueCleanup: () => runQuoteRefreshQueueCleanup
});
var logger2, toNumber2, parseStatusList, statusMap, defaultStatuses, statuses, olderThanHours, runQuoteRefreshQueueCleanup;
var init_quote_refresh_queue_cleanup = __esm({
  "backend/scripts/quote-refresh-queue-cleanup.ts"() {
    "use strict";
    init_db();
    init_config();
    init_logger();
    init_quote_refresh_repository();
    init_quote_refresh_status();
    logger2 = createLogger("script.quote-refresh-queue-cleanup");
    toNumber2 = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    parseStatusList = (value) => (value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    statusMap = {
      completed: "completed" /* COMPLETED */,
      failed: "failed" /* FAILED */,
      blocked: "blocked" /* BLOCKED */,
      skipped: "skipped" /* SKIPPED */
    };
    defaultStatuses = [
      "completed" /* COMPLETED */,
      "failed" /* FAILED */,
      "blocked" /* BLOCKED */,
      "skipped" /* SKIPPED */
    ];
    statuses = (() => {
      const parsed = parseStatusList(process.env.QUOTE_REFRESH_CLEANUP_STATUSES);
      if (parsed.length === 0) return defaultStatuses;
      const resolved = parsed.map((item) => statusMap[item]).filter(Boolean);
      return resolved.length ? resolved : defaultStatuses;
    })();
    olderThanHours = toNumber2(process.env.QUOTE_REFRESH_CLEANUP_AGE_HOURS, 168);
    runQuoteRefreshQueueCleanup = async () => {
      if (olderThanHours <= 0) {
        logger2.info("cleanup_skipped", { reason: "invalid_age_hours", older_than_hours: olderThanHours });
        return;
      }
      const pool2 = createPool(config.db.planeBUrl);
      const repo = new QuoteRefreshRepository(pool2);
      const start = Date.now();
      try {
        const deleted = await repo.cleanupRequests(statuses, olderThanHours);
        logger2.info("cleanup_complete", {
          deleted_count: deleted,
          statuses,
          older_than_hours: olderThanHours,
          duration_ms: Date.now() - start
        });
      } finally {
        await pool2.end();
      }
    };
    runQuoteRefreshQueueCleanup().then(() => process.exit(0)).catch((error) => {
      logger2.error("cleanup_failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : void 0
      });
      process.exit(1);
    });
  }
});

// backend/scripts/aws/quote-refresh-queue-cleanup-lambda.ts
var quote_refresh_queue_cleanup_lambda_exports = {};
__export(quote_refresh_queue_cleanup_lambda_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(quote_refresh_queue_cleanup_lambda_exports);

// backend/shared/aws-params.ts
var import_client_secrets_manager = require("@aws-sdk/client-secrets-manager");
var import_client_ssm = require("@aws-sdk/client-ssm");
init_logger();
var logger = createLogger("shared.aws-params");
var secretsClient = null;
var ssmClient = null;
var getSecretsClient = () => {
  if (!secretsClient) {
    secretsClient = new import_client_secrets_manager.SecretsManagerClient({});
  }
  return secretsClient;
};
var getSsmClient = () => {
  if (!ssmClient) {
    ssmClient = new import_client_ssm.SSMClient({});
  }
  return ssmClient;
};
var parseSecretJson = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
};
var pickJsonValue = (parsed, keys) => {
  if (!keys || keys.length === 0) return void 0;
  for (const key of keys) {
    const value = parsed[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return void 0;
};
var buildDatabaseUrl = (username, password, host, port, dbName) => {
  const encodedUser = encodeURIComponent(username);
  const encodedPass = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPass}@${host}:${port}/${dbName}`;
};
var loadSecretValue = async (secretArn) => {
  try {
    const client = getSecretsClient();
    const response = await client.send(
      new import_client_secrets_manager.GetSecretValueCommand({ SecretId: secretArn })
    );
    if (response.SecretString) {
      return response.SecretString;
    }
    if (response.SecretBinary) {
      return Buffer.from(response.SecretBinary).toString("utf8");
    }
    return null;
  } catch (error) {
    logger.error("secret_fetch_failed", {
      secret_arn: secretArn,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};
var loadSsmValue = async (name) => {
  try {
    const client = getSsmClient();
    const response = await client.send(
      new import_client_ssm.GetParameterCommand({ Name: name, WithDecryption: true })
    );
    return response.Parameter?.Value ?? null;
  } catch (error) {
    logger.error("ssm_fetch_failed", {
      parameter_name: name,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};
var resolveDatabaseUrl = async (source) => {
  if (process.env[source.envVar]) {
    return;
  }
  const envHost = source.hostEnv ? process.env[source.hostEnv] : void 0;
  const envPort = source.portEnv ? process.env[source.portEnv] : void 0;
  const envName = source.nameEnv ? process.env[source.nameEnv] : void 0;
  const envUser = source.usernameEnv ? process.env[source.usernameEnv] : void 0;
  const envPassword = source.passwordEnv ? process.env[source.passwordEnv] : void 0;
  if (envHost && envPort && envName && envUser && envPassword) {
    process.env[source.envVar] = buildDatabaseUrl(
      envUser,
      envPassword,
      envHost,
      envPort,
      envName
    );
    return;
  }
  const secretArn = source.secretArnEnv ? process.env[source.secretArnEnv] : void 0;
  if (secretArn) {
    const raw = await loadSecretValue(secretArn);
    if (raw) {
      const parsed = parseSecretJson(raw);
      if (parsed) {
        const url = pickJsonValue(parsed, source.jsonKeys) ?? pickJsonValue(parsed, [source.envVar]);
        if (url) {
          process.env[source.envVar] = url;
          return;
        }
        const username = pickJsonValue(parsed, source.usernameKeys) ?? pickJsonValue(parsed, ["username", "user"]);
        const password = pickJsonValue(parsed, source.passwordKeys) ?? pickJsonValue(parsed, ["password", "pass"]);
        const host = pickJsonValue(parsed, source.hostKeys ?? ["host", "hostname"]) ?? envHost;
        const port = pickJsonValue(parsed, source.portKeys ?? ["port"]) ?? envPort;
        const name = pickJsonValue(parsed, source.nameKeys ?? ["dbname", "database", "db_name", "name"]) ?? envName;
        if (username && password && host && port && name) {
          process.env[source.envVar] = buildDatabaseUrl(
            username,
            password,
            host,
            port,
            name
          );
          return;
        }
        logger.warn("db_url_build_failed", {
          env_var: source.envVar,
          secret_arn: secretArn,
          missing: {
            username: Boolean(username),
            password: Boolean(password),
            host: Boolean(host),
            port: Boolean(port),
            name: Boolean(name)
          }
        });
      } else {
        process.env[source.envVar] = raw;
        return;
      }
    }
  }
  const ssmName = source.ssmNameEnv ? process.env[source.ssmNameEnv] : void 0;
  if (ssmName) {
    const raw = await loadSsmValue(ssmName);
    if (raw) {
      process.env[source.envVar] = raw;
    }
  }
};

// backend/scripts/aws/quote-refresh-queue-cleanup-lambda.ts
var handler = async () => {
  await resolveDatabaseUrl({
    envVar: "DATABASE_URL_PLANE_B",
    secretArnEnv: "PLANE_B_DB_SECRET_ARN",
    ssmNameEnv: "PLANE_B_DB_SSM_NAME",
    hostEnv: "PLANE_B_DB_HOST",
    portEnv: "PLANE_B_DB_PORT",
    nameEnv: "PLANE_B_DB_NAME",
    usernameEnv: "PLANE_B_DB_USERNAME",
    passwordEnv: "PLANE_B_DB_PASSWORD",
    jsonKeys: ["url", "DATABASE_URL_PLANE_B", "database_url"]
  });
  const { runQuoteRefreshQueueCleanup: runQuoteRefreshQueueCleanup2 } = await Promise.resolve().then(() => (init_quote_refresh_queue_cleanup(), quote_refresh_queue_cleanup_exports));
  await runQuoteRefreshQueueCleanup2();
  return { status: "ok" };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
