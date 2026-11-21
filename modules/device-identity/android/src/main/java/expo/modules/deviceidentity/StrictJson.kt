package expo.modules.deviceidentity

import android.util.JsonReader
import android.util.JsonToken
import java.io.StringReader
import org.json.JSONObject

/** Reject duplicate keys, trailing data, permissive JSON extensions, and excessive nesting. */
internal fun strictObject(text: String): JSONObject {
  JsonReader(StringReader(text)).use { reader ->
    reader.isLenient = false
    var tokens = 0
    fun value(depth: Int) {
      require(depth <= 64 && ++tokens <= 100_000)
      when (reader.peek()) {
        JsonToken.BEGIN_OBJECT -> {
          reader.beginObject()
          val names = mutableSetOf<String>()
          while (reader.hasNext()) {
            require(names.add(reader.nextName()))
            value(depth + 1)
          }
          reader.endObject()
        }
        JsonToken.BEGIN_ARRAY -> {
          reader.beginArray()
          while (reader.hasNext()) value(depth + 1)
          reader.endArray()
        }
        JsonToken.STRING, JsonToken.NUMBER -> reader.nextString()
        JsonToken.BOOLEAN -> reader.nextBoolean()
        JsonToken.NULL -> reader.nextNull()
        else -> error("Invalid JSON")
      }
    }
    require(reader.peek() == JsonToken.BEGIN_OBJECT)
    value(0)
    require(reader.peek() == JsonToken.END_DOCUMENT)
  }
  return JSONObject(text)
}
