package expo.modules.deviceidentity

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.AlgorithmParameters
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.Signature
import java.security.interfaces.ECPublicKey
import java.security.spec.ECGenParameterSpec
import java.security.spec.ECParameterSpec
import java.security.spec.X509EncodedKeySpec
import org.json.JSONObject

private const val KEY_ALIAS = "jw-timer.device-identity.p256.v1"
private val IDENTITY_LOCK = Any()

class DeviceIdentityModule : Module() {

  private var lanProbe: LanSessionProbe? = null

  private fun lanEngine(): LanSessionProbe = synchronized(IDENTITY_LOCK) {
    lanProbe ?: LanSessionProbe(
      appContext.reactContext?.applicationContext ?: error("App unavailable"),
      { name, body -> sendEvent(name, body) },
      { bytes ->
        inspectPublicKey(Base64.encodeToString(bytes, Base64.NO_WRAP))
          .getValue("fingerprint")
      }
    ).also { lanProbe = it }
  }

  private fun lanKey(): KeyStore.PrivateKeyEntry = synchronized(IDENTITY_LOCK) {
    require(appContext.currentActivity?.hasWindowFocus() == true)
    val store = keyStore()
    require(describe(store)["status"] == "ready")
    store.getEntry(KEY_ALIAS, null) as KeyStore.PrivateKeyEntry
  }

      private fun inspectPublicKey(encoded: String): Map<String, String> {
    require(encoded.length == 124)
    require(Regex("^[A-Za-z0-9+/]{122}==$").matches(encoded))

    val bytes = Base64.decode(encoded, Base64.NO_WRAP)

    require(
      Base64.encodeToString(bytes, Base64.NO_WRAP) == encoded
    )

    val publicKey = KeyFactory.getInstance("EC").generatePublic(
      X509EncodedKeySpec(bytes)
    ) as? ECPublicKey ?: error("Invalid public key")

    val parameters = AlgorithmParameters.getInstance("EC").apply {
      init(ECGenParameterSpec("secp256r1"))
    }

    val expected = parameters.getParameterSpec(
      ECParameterSpec::class.java
    )

    require(
      publicKey.params.curve == expected.curve &&
      publicKey.params.generator == expected.generator &&
      publicKey.params.order == expected.order &&
      publicKey.params.cofactor == expected.cofactor &&
      publicKey.encoded.contentEquals(bytes)
    )

    val fingerprint = MessageDigest.getInstance("SHA-256")
      .digest(bytes)
      .joinToString("") { byte ->
        "%02x".format(byte.toInt() and 0xff)
      }

    return mapOf(
      "publicKey" to encoded,
      "fingerprint" to "sha256:$fingerprint"
    )
  }

  override fun definition() = ModuleDefinition {
    Name("DeviceIdentity")

    Events("onLanAuthorize", "onLanStopped", "onLanDiscovered", "onLanDiscoveryState")

    AsyncFunction("startLanDiscovery") {
      lanKey() // Foreground and identity required; discovery conveys no trust.
      lanEngine().startDiscovery()
    }
    AsyncFunction("stopLanDiscovery") { lanProbe?.stopDiscovery(); Unit }

    AsyncFunction("newLanToken") { lanToken() }

    AsyncFunction("describeLanEndpoint") { scope: String ->
      lanEngine().describe(lanKey(), scope)
    }

    AsyncFunction("startLanProbe") { hostId: String, peerPublicKey: String, scope: String ->
      inspectPublicKey(peerPublicKey)
      lanEngine().start(hostId, lanKey(), Base64.decode(peerPublicKey, Base64.NO_WRAP), scope)
    }

    AsyncFunction("probeLanPeer") { peerPublicKey: String, connectionCode: String, operation: String, bodyJSON: String, clientId: String ->
      require(connectionCode.length <= 512)
      inspectPublicKey(peerPublicKey)
      lanEngine().probe(lanKey(), Base64.decode(peerPublicKey, Base64.NO_WRAP), strictObject(connectionCode), operation, bodyJSON, clientId)
    }

    AsyncFunction("resolveLanAuthorization") { ticket: String, allowed: Boolean, schedule: String ->
      lanProbe?.resolve(ticket, allowed, schedule)
      Unit
    }

    AsyncFunction("stopLanProbe") { expectedHostId: String? ->
      lanProbe?.stop(expectedHostId)
      Unit
    }
    AsyncFunction("cancelLanClient") { expectedClientId: String ->
      lanProbe?.cancelClient(expectedClientId)
      Unit
    }

    AsyncFunction("checkLanProtocol") { checkLanProtocol() }

    AsyncFunction("signSyncProof") { body: String ->
      synchronized(IDENTITY_LOCK) {
        val entry = lanKey()
        val author = inspectPublicKey(Base64.encodeToString(entry.certificate.publicKey.encoded, Base64.NO_WRAP)).getValue("fingerprint")
        val bytes = syncProofBytes(body, author)
        val signer = Signature.getInstance("SHA256withECDSA")
        signer.initSign(entry.privateKey)
        signer.update(bytes)
        mapOf("hash" to syncHash(bytes), "signature" to Base64.encodeToString(signer.sign(), Base64.NO_WRAP))
      }
    }
    AsyncFunction("verifySyncProof") { publicKey: String, body: String, hash: String, signature: String ->
      try {
        val author = inspectPublicKey(publicKey).getValue("fingerprint")
        val bytes = syncProofBytes(body, author)
        require(Regex("^sha256:[a-f0-9]{64}$").matches(hash) && hash == syncHash(bytes))
        require(signature.length in 80..104 && Regex("^[A-Za-z0-9+/]+={0,2}$").matches(signature))
        val signatureBytes = Base64.decode(signature, Base64.NO_WRAP)
        require(Base64.encodeToString(signatureBytes, Base64.NO_WRAP) == signature)
        val key = KeyFactory.getInstance("EC").generatePublic(X509EncodedKeySpec(Base64.decode(publicKey, Base64.NO_WRAP)))
        Signature.getInstance("SHA256withECDSA").run {
          initVerify(key); update(bytes); verify(signatureBytes)
        }
      } catch (_: Exception) { false }
    }

    OnActivityEntersBackground { lanProbe?.stop() }
    OnDestroy {
      lanProbe?.stop()
      lanProbe = null
    }
    
     AsyncFunction("inspectPeerPublicKey") { encoded: String ->
      inspectPublicKey(encoded)
    }

    AsyncFunction("readIdentity") {
      identity(false)
    }

    AsyncFunction("createIdentity") {
      identity(true)
    }

    AsyncFunction("checkIdentity") {
      selfCheck()
    }
        AsyncFunction("newPairingNonce") {
      ByteArray(32).also {
        SecureRandom().nextBytes(it)
      }.joinToString("") { byte ->
        "%02x".format(byte.toInt() and 0xff)
      }
    }

    AsyncFunction("signPairingProof") { payload: String ->
      synchronized(IDENTITY_LOCK) {
        val proof = pairingProof(payload)
        val store = keyStore()
        val own = describe(store)

        require(own["status"] == "ready")
        require(own["publicKey"] == proof.sender)

        val entry = store.getEntry(KEY_ALIAS, null)
          as KeyStore.PrivateKeyEntry

        val signer = Signature.getInstance("SHA256withECDSA")
        signer.initSign(entry.privateKey)
        signer.update(proof.bytes)

        Base64.encodeToString(signer.sign(), Base64.NO_WRAP)
      }
    }

    AsyncFunction("verifyPairingProof") {
      payload: String, signature: String ->
      try {
        val proof = pairingProof(payload)

        require(signature.length in 80..104)
        val signatureBytes = Base64.decode(
          signature,
          Base64.NO_WRAP
        )

        require(
          Base64.encodeToString(
            signatureBytes,
            Base64.NO_WRAP
          ) == signature
        )

        val publicKey = KeyFactory.getInstance("EC")
          .generatePublic(
            X509EncodedKeySpec(
              Base64.decode(proof.sender, Base64.NO_WRAP)
            )
          )

        val verifier = Signature.getInstance("SHA256withECDSA")
        verifier.initVerify(publicKey)
        verifier.update(proof.bytes)
        verifier.verify(signatureBytes)
      } catch (_: Exception) {
        false
      }
    }
  }

  private fun syncProofBytes(body: String, author: String): ByteArray {
    require(body.length in 1..262_144)
    val value = strictObject(body)
    require(value.opt("version") == 2)
    require(value.opt("kind") == "revision" || value.opt("kind") == "proposal")
    require(value.opt("authorFingerprint") == author)
    return ("JW-Timer/sync-proof/v2\n" + body).toByteArray(Charsets.UTF_8)
  }

  private fun syncHash(bytes: ByteArray): String = "sha256:" +
    MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it.toInt() and 0xff) }

    private data class PairingProof(
    val sender: String,
    val bytes: ByteArray
  )

  private fun pairingProof(payload: String): PairingProof {
    require(payload.length <= 2048)

    val value = JSONObject(payload)
    val fields = listOf(
      "version", "type", "from", "to",
      "nonce", "peerNonce", "expiresAt"
    )

    require(
      value.length() == fields.size &&
      fields.all { value.has(it) } &&
      value.opt("version") == 1
    )

    val type = value.getString("type")
    val from = value.getString("from")
    val to = value.getString("to")
    val nonce = value.getString("nonce")
    val peerNonce = value.getString("peerNonce")
    val rawExpiry = value.get("expiresAt") as? Number
      ?: error("Invalid expiry")
    val expiry = rawExpiry.toLong()
    val now = System.currentTimeMillis()

    require(type == "challenge" || type == "approval")
    require(rawExpiry.toDouble() == expiry.toDouble())
    require(expiry > now && expiry <= now + 360_000)
    require(from != to)

    inspectPublicKey(from)
    inspectPublicKey(to)

    require(Regex("^[a-f0-9]{64}$").matches(nonce))

    if (type == "challenge") {
      require(peerNonce.isEmpty())
    } else {
      require(Regex("^[a-f0-9]{64}$").matches(peerNonce))
      require(peerNonce != nonce)
    }

    val message = listOf(
      "JW-Timer/pairing/v1",
      type,
      from,
      to,
      nonce,
      peerNonce,
      expiry.toString()
    ).joinToString("\n")

    return PairingProof(
      from,
      message.toByteArray(Charsets.UTF_8)
    )
  }

  private fun keyStore(): KeyStore =
    KeyStore.getInstance("AndroidKeyStore").apply {
      load(null)
    }

  private fun identity(create: Boolean): Map<String, Any> =
    synchronized(IDENTITY_LOCK) {
      try {
        val store = keyStore()

        if (create && !store.containsAlias(KEY_ALIAS)) {
          val generator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            "AndroidKeyStore"
          )

          generator.initialize(
            KeyGenParameterSpec.Builder(
              KEY_ALIAS,
              KeyProperties.PURPOSE_SIGN
            )
              .setAlgorithmParameterSpec(
                ECGenParameterSpec("secp256r1")
              )
              .setDigests(KeyProperties.DIGEST_SHA256)
              .setUserAuthenticationRequired(false)
              .build()
          )

          generator.generateKeyPair()
        }

        describe(store)
      } catch (_: Exception) {
        mapOf("status" to "error")
      }
    }

  private fun describe(store: KeyStore): Map<String, Any> {
    if (!store.containsAlias(KEY_ALIAS)) {
      return mapOf("status" to "missing")
    }

    val entry = store.getEntry(KEY_ALIAS, null)
      as? KeyStore.PrivateKeyEntry
      ?: error("Invalid identity entry")

    val publicKey = entry.certificate.publicKey as? ECPublicKey
      ?: error("Invalid identity algorithm")

    val parameters = AlgorithmParameters.getInstance("EC").apply {
      init(ECGenParameterSpec("secp256r1"))
    }

    val expected = parameters.getParameterSpec(
      ECParameterSpec::class.java
    )

    require(
      publicKey.params.curve == expected.curve &&
      publicKey.params.generator == expected.generator &&
      publicKey.params.order == expected.order &&
      publicKey.params.cofactor == expected.cofactor
    )

    val information = KeyFactory
      .getInstance("EC", "AndroidKeyStore")
      .getKeySpec(entry.privateKey, KeyInfo::class.java)

    require(information.origin == KeyProperties.ORIGIN_GENERATED)

    val protection = protection(information)
    val encoded = publicKey.encoded

    val fingerprint = MessageDigest
      .getInstance("SHA-256")
      .digest(encoded)
      .joinToString("") { byte ->
        "%02x".format(byte.toInt() and 0xff)
      }

    return mapOf(
      "status" to "ready",
      "fingerprint" to "sha256:$fingerprint",
      "publicKey" to Base64.encodeToString(encoded, Base64.NO_WRAP),
      "protection" to protection
    )
  }

  @Suppress("DEPRECATION")
  private fun protection(information: KeyInfo): String {
    if (Build.VERSION.SDK_INT >= 31) {
      return when (information.securityLevel) {
        KeyProperties.SECURITY_LEVEL_TRUSTED_ENVIRONMENT -> "tee"
        KeyProperties.SECURITY_LEVEL_STRONGBOX -> "strongbox"
        else -> error("Hardware backing could not be verified")
      }
    }

    require(information.isInsideSecureHardware)
    return "hardware"
  }

  private fun selfCheck(): Boolean =
    synchronized(IDENTITY_LOCK) {
      try {
        val store = keyStore()
        require(describe(store)["status"] == "ready")

        val entry = store.getEntry(KEY_ALIAS, null)
          as KeyStore.PrivateKeyEntry

        val challenge = ByteArray(32).also {
          SecureRandom().nextBytes(it)
        }

        val message =
          "JW-Timer/identity-self-check/v1:".toByteArray(
            Charsets.UTF_8
          ) + challenge

        val signer = Signature.getInstance("SHA256withECDSA")
        signer.initSign(entry.privateKey)
        signer.update(message)
        val signature = signer.sign()

        val publicKey = KeyFactory.getInstance("EC").generatePublic(
          X509EncodedKeySpec(entry.certificate.publicKey.encoded)
        )

        val verifier = Signature.getInstance("SHA256withECDSA")
        verifier.initVerify(publicKey)
        verifier.update(message)
        require(verifier.verify(signature))

        val modified = message.copyOf()
        val last = modified.lastIndex
        modified[last] = (modified[last].toInt() xor 1).toByte()

        val alteredVerifier =
          Signature.getInstance("SHA256withECDSA")
        alteredVerifier.initVerify(publicKey)
        alteredVerifier.update(modified)

        !alteredVerifier.verify(signature)
      } catch (_: Exception) {
        false
      }
    }
}
