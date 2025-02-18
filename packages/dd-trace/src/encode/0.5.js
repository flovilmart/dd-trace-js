'use strict'

const { AgentEncoder: BaseEncoder } = require('./0.4')

const ARRAY_OF_TWO = 0x92
const ARRAY_OF_TWELVE = 0x9c

class AgentEncoder extends BaseEncoder {
  makePayload () {
    const prefixSize = 1
    const stringSize = this._stringBytes.length + 5
    const traceSize = this._traceBytes.length + 5
    const buffer = Buffer.allocUnsafe(prefixSize + stringSize + traceSize)

    let offset = 0

    buffer[offset++] = ARRAY_OF_TWO

    offset = this._writeStrings(buffer, offset)
    offset = this._writeTraces(buffer, offset)

    this._reset()

    return buffer
  }

  _encode (bytes, trace) {
    this._encodeArrayPrefix(bytes, trace)

    for (const span of trace) {
      this._encodeByte(bytes, ARRAY_OF_TWELVE)
      this._encodeString(bytes, span.service)
      this._encodeString(bytes, span.name)
      this._encodeString(bytes, span.resource)
      this._encodeId(bytes, span.trace_id)
      this._encodeId(bytes, span.span_id)
      this._encodeId(bytes, span.parent_id)
      this._encodeInteger(bytes, span.start || 0)
      this._encodeInteger(bytes, span.duration || 0)
      this._encodeInteger(bytes, span.error)
      this._encodeMap(bytes, span.meta || {})
      this._encodeMap(bytes, span.metrics || {})
      this._encodeString(bytes, span.type)
    }
  }

  _encodeString (bytes, value = '') {
    this._cacheString(value)
    this._encodeInteger(bytes, this._stringMap[value])
  }

  _cacheString (value) {
    if (!(value in this._stringMap)) {
      this._stringMap[value] = this._stringCount++
      this._stringBytes.write(value)
    }
  }

  _writeStrings (buffer, offset) {
    offset = this._writeArrayPrefix(buffer, offset, this._stringCount)
    offset += this._stringBytes.buffer.copy(buffer, offset, 0, this._stringBytes.length)

    return offset
  }
}

module.exports = { AgentEncoder }
