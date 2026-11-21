package expo.modules.deviceidentity

import java.net.Socket
import java.security.KeyStore
import java.security.Principal
import java.security.PrivateKey
import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.SSLEngine
import javax.net.ssl.X509ExtendedKeyManager
import javax.net.ssl.X509TrustManager

internal fun pairedTlsContext(
  entry: KeyStore.PrivateKeyEntry,
  expectedPeer: ByteArray
): SSLContext {
  val keys = object : X509ExtendedKeyManager() {
    private fun alias(types: Array<out String>?): String? =
      if (types?.any { it == "EC" } == true) "identity" else null

    override fun getClientAliases(type: String?, issuers: Array<out Principal>?) =
      if (type == "EC") arrayOf("identity") else null

    override fun chooseClientAlias(
      types: Array<out String>?, issuers: Array<out Principal>?, socket: Socket?
    ) = alias(types)

    override fun getServerAliases(type: String?, issuers: Array<out Principal>?) =
      if (type == "EC") arrayOf("identity") else null

    override fun chooseServerAlias(
      type: String?, issuers: Array<out Principal>?, socket: Socket?
    ) = if (type == "EC") "identity" else null

    override fun chooseEngineClientAlias(
      types: Array<out String>?, issuers: Array<out Principal>?, engine: SSLEngine?
    ) = alias(types)

    override fun chooseEngineServerAlias(
      type: String?, issuers: Array<out Principal>?, engine: SSLEngine?
    ) = if (type == "EC") "identity" else null

    override fun getCertificateChain(alias: String?): Array<X509Certificate>? =
      if (alias == "identity") {
        entry.certificateChain.map { it as X509Certificate }.toTypedArray()
      } else null

    override fun getPrivateKey(alias: String?): PrivateKey? =
      if (alias == "identity") entry.privateKey else null
  }

  val trust = object : X509TrustManager {
    private fun verify(chain: Array<out X509Certificate>?) {
      val leaf = chain?.firstOrNull() ?: throw CertificateException("Missing peer")
      leaf.checkValidity()
      // Pairing pins the SPKI. The TLS handshake proves possession of its key.
      if (!leaf.publicKey.encoded.contentEquals(expectedPeer)) {
        throw CertificateException("Unpaired peer")
      }
    }

    override fun checkClientTrusted(chain: Array<out X509Certificate>?, type: String?) = verify(chain)
    override fun checkServerTrusted(chain: Array<out X509Certificate>?, type: String?) = verify(chain)
    override fun getAcceptedIssuers(): Array<X509Certificate> = emptyArray()
  }

  return SSLContext.getInstance("TLSv1.3").apply {
    init(arrayOf(keys), arrayOf(trust), SecureRandom())
  }
}
