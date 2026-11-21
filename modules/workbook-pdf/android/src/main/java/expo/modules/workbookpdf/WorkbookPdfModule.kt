package expo.modules.workbookpdf

import android.annotation.TargetApi
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Build
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException

private class PdfReadFailure(val reason: String) : Exception()

class WorkbookPdfModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WorkbookPdf")

    AsyncFunction("extract") { uri: String ->
      if (Build.VERSION.SDK_INT < 35) {
        mapOf("ok" to false, "code" to "unsupported")
      } else {
        try {
          mapOf("ok" to true, "pages" to readPdf(uri))
        } catch (error: PdfReadFailure) {
          mapOf("ok" to false, "code" to error.reason)
        } catch (_: SecurityException) {
          mapOf("ok" to false, "code" to "locked")
        } catch (_: IOException) {
          mapOf("ok" to false, "code" to "invalid")
        } catch (_: IllegalArgumentException) {
          mapOf("ok" to false, "code" to "invalid")
        } catch (_: Exception) {
          mapOf("ok" to false, "code" to "invalid")
        }
      }
    }
  }

  @TargetApi(35)
  private fun readPdf(uriText: String): List<String> {
    val context = appContext.reactContext
      ?: throw PdfReadFailure("invalid")

    val uri = Uri.parse(uriText)

    if (uri.scheme != "file" || !uri.authority.isNullOrEmpty()) {
      throw PdfReadFailure("invalid")
    }

    val path = uri.path ?: throw PdfReadFailure("invalid")
    val file = File(path).canonicalFile
    val cacheRoot = context.cacheDir.canonicalFile.path + File.separator

    if (!file.path.startsWith(cacheRoot) || !file.isFile) {
      throw PdfReadFailure("invalid")
    }

    if (file.length() !in 5L..(20L * 1024 * 1024)) {
      throw PdfReadFailure("limit")
    }

    val validHeader = file.inputStream().use { stream ->
      val header = ByteArray(5)
      stream.read(header) == 5 &&
        header.contentEquals(
          byteArrayOf(37, 80, 68, 70, 45)
        )
    }

    if (!validHeader) throw PdfReadFailure("invalid")

    val descriptor = ParcelFileDescriptor.open(
      file,
      ParcelFileDescriptor.MODE_READ_ONLY
    )

    val renderer = try {
      PdfRenderer(descriptor)
    } catch (error: Exception) {
      descriptor.close()
      throw error
    }

    return renderer.use { document ->
      if (document.pageCount !in 1..32) {
        throw PdfReadFailure("limit")
      }

      val pages = mutableListOf<String>()
      var totalCharacters = 0
      var foundText = false

      for (index in 0 until document.pageCount) {
        document.openPage(index).use { page ->
          val output = StringBuilder()

          for (content in page.textContents) {
            val text = content.text

            if (
              text.length > 200_000 - totalCharacters - 1
            ) {
              throw PdfReadFailure("limit")
            }

            output.append(text).append('\n')
            totalCharacters += text.length + 1
          }

          val text = output.toString().trim()
          if (text.isNotEmpty()) foundText = true
          pages.add(text)
        }
      }

      if (!foundText) throw PdfReadFailure("empty")

      pages
    }
  }
}